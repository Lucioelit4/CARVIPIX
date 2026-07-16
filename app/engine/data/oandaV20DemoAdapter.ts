import { Asset, Candle, Timeframe } from "../types/marketData";
import { MarketDataPipeline } from "./marketDataPipeline";

const DEFAULT_OANDA_BASE_URL = "https://api-fxpractice.oanda.com";
const M1_MS = 60 * 1000;
const MAX_CANDLES_PER_REQUEST = 5000;

export interface OandaDemoConfig {
  apiToken?: string;
  accountId?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  backoffMs?: number;
}

export interface OandaPilotValidation {
  totalCandles: number;
  duplicateTimestamps: number;
  nonIncreasingTimestamps: number;
  gapsDetected: number;
  maxGapMinutes: number;
  invalidOhlc: number;
  timezone: "UTC" | "UNKNOWN";
  firstUtc: string | null;
  lastUtc: string | null;
}

export interface OandaPilotReport {
  provider: "oanda-v20-demo";
  oandaApiAvailable: boolean;
  accountInstrumentsRead: boolean;
  xauusdAvailable: boolean;
  historicalM1Available: boolean;
  downloadedCandlesM1: number;
  instrumentCount: number;
  selectedInstrument: string;
  generatedFrames: Record<Timeframe, number>;
  validation: OandaPilotValidation;
  pipeline: {
    stats: ReturnType<MarketDataPipeline["getStats"]>;
    latest5M: Candle | null;
    latest45M: Candle | null;
    latest1H: Candle | null;
    recentErrors: ReturnType<MarketDataPipeline["getRecentErrors"]>;
  };
  errors: string[];
  createdAtUtc: string;
}

function buildBlockedCredentialsError(): Error {
  return new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: OANDA_DEMO_CREDENTIALS");
}

function toBucketStart(timestamp: number, timeframe: Timeframe): number {
  const ms = timeframe === "5M" ? 5 * M1_MS : timeframe === "45M" ? 45 * M1_MS : 60 * M1_MS;
  return Math.floor(timestamp / ms) * ms;
}

function assertUtcIso(text: string): boolean {
  return text.endsWith("Z") && Number.isFinite(Date.parse(text));
}

export class OandaV20DemoAdapter {
  private readonly apiToken: string;
  private readonly accountId: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffMs: number;

  private readonly mapAssetToInstrument: Record<Asset, string> = {
    XAUUSD: "XAU_USD",
    EURUSD: "EUR_USD",
    GBPUSD: "GBP_USD",
    BTCUSD: "BTC_USD",
  };

  constructor(config: OandaDemoConfig = {}) {
    const apiToken = (config.apiToken ?? process.env.OANDA_API_TOKEN ?? "").trim();
    const accountId = (config.accountId ?? process.env.OANDA_ACCOUNT_ID ?? "").trim();
    const baseUrl = (config.baseUrl ?? process.env.OANDA_BASE_URL ?? DEFAULT_OANDA_BASE_URL).trim();

    this.apiToken = apiToken;
    this.accountId = accountId;
    this.baseUrl = baseUrl;
    this.timeoutMs = config.timeoutMs ?? 20_000;
    this.maxRetries = config.maxRetries ?? 4;
    this.backoffMs = config.backoffMs ?? 500;
  }

  ensureCredentialsOrThrow(): void {
    if (!this.apiToken || !this.accountId || !this.baseUrl) {
      throw buildBlockedCredentialsError();
    }
  }

  async pingApi(): Promise<boolean> {
    try {
      const response = await this.requestJson<{ accounts?: unknown[] }>("/v3/accounts");
      return Array.isArray(response.accounts);
    } catch {
      return false;
    }
  }

  async listAccountInstruments(): Promise<string[]> {
    const payload = await this.requestJson<{ instruments?: Array<{ name?: string }> }>(
      `/v3/accounts/${this.accountId}/instruments`
    );
    const out = (payload.instruments ?? [])
      .map((item) => (item.name || "").trim())
      .filter((name) => name.length > 0);
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }

  resolveInstrument(asset: Asset): string {
    return this.mapAssetToInstrument[asset];
  }

  async downloadM1Range(asset: Asset, fromUtc: string, toUtc: string): Promise<Candle[]> {
    const instrument = this.resolveInstrument(asset);
    if (!instrument) {
      throw new Error(`SYMBOL_NOT_AVAILABLE: ${asset}`);
    }

    const start = Date.parse(fromUtc);
    const end = Date.parse(toUtc);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error("INVALID_TIME_RANGE");
    }

    const candles: Candle[] = [];
    let cursor = start;

    while (cursor < end) {
      const fromIso = new Date(cursor).toISOString();
      const query = new URLSearchParams({
        price: "M",
        granularity: "M1",
        from: fromIso,
        count: String(MAX_CANDLES_PER_REQUEST),
      });

      const payload = await this.requestJson<{
        candles?: Array<{
          complete?: boolean;
          time?: string;
          volume?: number;
          mid?: { o?: string; h?: string; l?: string; c?: string };
        }>;
      }>(`/v3/instruments/${instrument}/candles?${query.toString()}`);

      const batch = payload.candles ?? [];
      if (batch.length === 0) {
        break;
      }

      let maxTsInBatch = cursor;

      for (const item of batch) {
        if (!item.complete) continue;
        if (!item.time || !item.mid) continue;
        if (!assertUtcIso(item.time)) continue;

        const timestamp = Date.parse(item.time);
        if (!Number.isFinite(timestamp)) continue;
        if (timestamp < start || timestamp >= end) continue;

        const open = Number(item.mid.o);
        const high = Number(item.mid.h);
        const low = Number(item.mid.l);
        const close = Number(item.mid.c);
        const volume = Number(item.volume ?? 0);

        candles.push({
          asset,
          timeframe: "5M",
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          complete: true,
        });

        if (timestamp > maxTsInBatch) {
          maxTsInBatch = timestamp;
        }
      }

      const nextCursor = maxTsInBatch + M1_MS;
      if (nextCursor <= cursor) {
        break;
      }
      cursor = nextCursor;
    }

    candles.sort((a, b) => a.timestamp - b.timestamp);
    return candles;
  }

  validateM1Candles(rawCandles: Candle[]): OandaPilotValidation {
    let duplicateTimestamps = 0;
    let nonIncreasingTimestamps = 0;
    let gapsDetected = 0;
    let maxGapMinutes = 0;
    let invalidOhlc = 0;
    const seen = new Set<number>();

    let prevTs: number | null = null;

    for (const candle of rawCandles) {
      if (seen.has(candle.timestamp)) {
        duplicateTimestamps += 1;
      }
      seen.add(candle.timestamp);

      const validPositive =
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        candle.open > 0 &&
        candle.high > 0 &&
        candle.low > 0 &&
        candle.close > 0;

      if (!validPositive || candle.high < candle.low || candle.open > candle.high || candle.open < candle.low || candle.close > candle.high || candle.close < candle.low) {
        invalidOhlc += 1;
      }

      if (prevTs !== null) {
        if (candle.timestamp <= prevTs) {
          nonIncreasingTimestamps += 1;
        }
        const diffMin = Math.floor((candle.timestamp - prevTs) / M1_MS);
        if (diffMin > 1) {
          gapsDetected += 1;
          if (diffMin > maxGapMinutes) {
            maxGapMinutes = diffMin;
          }
        }
      }

      prevTs = candle.timestamp;
    }

    return {
      totalCandles: rawCandles.length,
      duplicateTimestamps,
      nonIncreasingTimestamps,
      gapsDetected,
      maxGapMinutes,
      invalidOhlc,
      timezone: "UTC",
      firstUtc: rawCandles.length > 0 ? new Date(rawCandles[0].timestamp).toISOString() : null,
      lastUtc: rawCandles.length > 0 ? new Date(rawCandles[rawCandles.length - 1].timestamp).toISOString() : null,
    };
  }

  buildAggregatesFromM1(asset: Asset, m1Candles: Candle[]): Record<Timeframe, Candle[]> {
    const buildFor = (timeframe: Timeframe): Candle[] => {
      const byBucket = new Map<number, Candle>();
      for (const row of m1Candles) {
        const bucket = toBucketStart(row.timestamp, timeframe);
        const existing = byBucket.get(bucket);
        if (!existing) {
          byBucket.set(bucket, {
            asset,
            timeframe,
            timestamp: bucket,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            complete: true,
          });
          continue;
        }
        existing.high = Math.max(existing.high, row.high);
        existing.low = Math.min(existing.low, row.low);
        existing.close = row.close;
        existing.volume += row.volume;
      }

      return Array.from(byBucket.values()).sort((a, b) => a.timestamp - b.timestamp);
    };

    return {
      "5M": buildFor("5M"),
      "30M": buildFor("30M"),
      "45M": buildFor("45M"),
      "1H": buildFor("1H"),
    };
  }

  runPipeline(asset: Asset, aggregates: Record<Timeframe, Candle[]>) {
    const pipeline = new MarketDataPipeline();

    for (const timeframe of ["5M", "45M", "1H"] as Timeframe[]) {
      for (const candle of aggregates[timeframe]) {
        pipeline.ingestCandle(
          {
            symbol: asset,
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            complete: true,
            timezone: "UTC",
          },
          timeframe
        );
      }
    }

    return {
      stats: pipeline.getStats(),
      latest5M: pipeline.getLatestCandle(asset, "5M"),
      latest45M: pipeline.getLatestCandle(asset, "45M"),
      latest1H: pipeline.getLatestCandle(asset, "1H"),
      recentErrors: pipeline.getRecentErrors(20),
    };
  }

  async runXauusdPilot(days = 30): Promise<OandaPilotReport> {
    this.ensureCredentialsOrThrow();

    const errors: string[] = [];
    let oandaApiAvailable = false;
    let accountInstrumentsRead = false;
    let xauusdAvailable = false;
    let historicalM1Available = false;
    let instruments: string[] = [];

    try {
      oandaApiAvailable = await this.pingApi();
      if (!oandaApiAvailable) {
        errors.push("OANDA_API_UNAVAILABLE_OR_UNAUTHORIZED");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    try {
      instruments = await this.listAccountInstruments();
      accountInstrumentsRead = true;
      xauusdAvailable = instruments.includes("XAU_USD");
      if (!xauusdAvailable) {
        errors.push("SYMBOL_NOT_AVAILABLE: XAU_USD");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    const now = Date.now();
    const from = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date(now).toISOString();

    let m1Rows: Candle[] = [];
    try {
      if (xauusdAvailable) {
        m1Rows = await this.downloadM1Range("XAUUSD", from, to);
        historicalM1Available = m1Rows.length > 0;
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    const validation = this.validateM1Candles(m1Rows);
    const aggregates = this.buildAggregatesFromM1("XAUUSD", m1Rows);
    const pipeline = this.runPipeline("XAUUSD", aggregates);

    return {
      provider: "oanda-v20-demo",
      oandaApiAvailable,
      accountInstrumentsRead,
      xauusdAvailable,
      historicalM1Available,
      downloadedCandlesM1: m1Rows.length,
      instrumentCount: instruments.length,
      selectedInstrument: "XAU_USD",
      generatedFrames: {
        "5M": aggregates["5M"].length,
        "30M": aggregates["30M"].length,
        "45M": aggregates["45M"].length,
        "1H": aggregates["1H"].length,
      },
      validation,
      pipeline,
      errors,
      createdAtUtc: new Date().toISOString(),
    };
  }

  private async requestJson<T>(path: string): Promise<T> {
    this.ensureCredentialsOrThrow();

    const url = `${this.baseUrl}${path}`;
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        const body = await response.text();
        const retriable = response.status === 429 || response.status >= 500;
        if (!retriable) {
          throw new Error(`HTTP_${response.status}: ${body || "OANDA request failed"}`);
        }

        lastError = new Error(`HTTP_${response.status}: ${body || "retryable"}`);
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }

      attempt += 1;
      if (attempt > this.maxRetries) {
        break;
      }
      const waitMs = this.backoffMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    throw lastError instanceof Error ? lastError : new Error("UNKNOWN_PROVIDER_ERROR");
  }
}
