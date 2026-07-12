import { IndicatorFramework } from "./indicatorFramework";
import { MarketDataPipeline } from "./marketDataPipeline";
import { CandleBuilder } from "./candleBuilder";
import { DataProvider } from "./dataProvider";
import {
  Asset,
  Candle,
  ConnectionState,
  DataHealthStatus,
  DataQuality,
  MarketData,
  Tick,
  Timeframe,
} from "../types/marketData";
import { RealProviderConfig } from "../types/realDataProvider";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CANDLE_LIMIT = 300;
const HEALTH_THRESHOLD_MS = 120_000;

type Mt5BridgeStatusResponse = {
  bridge_status?: string;
  terminal_connected?: boolean;
  server?: string | null;
};

type Mt5BridgeTickResponse = {
  symbol?: string;
  bid?: number;
  ask?: number;
  time?: string | number;
};

type Mt5BridgeBarsResponse = {
  symbol?: string;
  timeframe?: string;
  candles?: Array<{
    time?: string | number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    tick_volume?: number;
    volume?: number;
    complete?: boolean;
  }>;
};

type Mt5BridgeCandleRow = NonNullable<Mt5BridgeBarsResponse["candles"]>[number];

type HttpMethod = "GET" | "POST";

function assertEnv(name: string): string {
  const value = String(process.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`BLOCKED_BY_EXTERNAL_DEPENDENCY: ${name}`);
  }
  return value;
}

function toTimeframeParam(timeframe: Timeframe): string {
  if (timeframe === "1H") return "H1";
  if (timeframe === "45M") return "M45";
  return "M5";
}

function toTimestampMs(value: string | number | undefined): number {
  if (typeof value === "number") {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n < 10_000_000_000 ? n * 1000 : n;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

export class MT5MarketDataAdapter extends DataProvider {
  private readonly baseUrl: string;
  private readonly token: string | null;
  private readonly timeoutMs: number;
  private readonly indicatorFramework = new IndicatorFramework();
  private readonly pipeline = new MarketDataPipeline();
  private readonly candleBuilder = new CandleBuilder(5000);

  private connected = false;
  private resolvedSymbols = new Map<Asset, string>();

  constructor(assets: Asset[], timeframes: Timeframe[], config?: Partial<RealProviderConfig>) {
    super(assets, timeframes);
    this.baseUrl = (config?.baseUrl ?? process.env.MT5_BRIDGE_BASE_URL ?? "").trim();
    this.token = (config?.apiKey ?? process.env.MT5_BRIDGE_API_TOKEN ?? "").trim() || null;
    this.timeoutMs = Number(config?.timeout ?? process.env.MT5_BRIDGE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  }

  ensureCredentialsOrThrow(): void {
    if (!this.baseUrl) {
      assertEnv("MT5_BRIDGE_BASE_URL");
    }
  }

  async connect(): Promise<void> {
    this.ensureCredentialsOrThrow();
    const health = await this.request<Mt5BridgeStatusResponse>("GET", "/health");
    if (!health.terminal_connected) {
      throw new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_TERMINAL_NOT_CONNECTED");
    }

    for (const asset of this.assets) {
      const symbol = await this.resolveSymbol(asset);
      this.resolvedSymbols.set(asset, symbol);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  getResolvedSymbol(asset: Asset): string | null {
    return this.resolvedSymbols.get(asset) ?? null;
  }

  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    this.assertConnected();
    const symbol = await this.resolveSymbol(asset);
    const barsResponse = await this.request<Mt5BridgeBarsResponse>(
      "GET",
      `/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(toTimeframeParam(timeframe))}&count=2`
    );

    const rows = barsResponse.candles ?? [];
    const latest = rows[rows.length - 1];
    if (!latest) {
      return null;
    }

    const candle = this.mapBarToCandle(asset, timeframe, latest);
    this.pipeline.ingestCandle(
      {
        asset,
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        complete: candle.complete,
        timezone: "UTC",
      },
      timeframe
    );
    return candle;
  }

  async getTick(asset: Asset): Promise<Tick | null> {
    this.assertConnected();
    const symbol = await this.resolveSymbol(asset);
    const raw = await this.request<Mt5BridgeTickResponse>(
      "GET",
      `/tick?symbol=${encodeURIComponent(symbol)}`
    );

    const bid = Number(raw.bid);
    const ask = Number(raw.ask);
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0 || ask < bid) {
      return null;
    }

    const tick = this.pipeline.ingestTick({
      asset,
      bid,
      ask,
      timestamp: toTimestampMs(raw.time),
      timezone: "UTC",
    });
    return tick;
  }

  async calculateIndicators(asset: Asset, timeframe: Timeframe) {
    this.assertConnected();
    const candles = await this.getHistoricalCandles(asset, timeframe, 220);
    if (candles.length === 0) {
      return null;
    }

    let latest = this.indicatorFramework.getLatest(asset, timeframe);
    for (const candle of candles) {
      latest = this.indicatorFramework.update(asset, timeframe, candle, 0);
    }
    return latest;
  }

  async getHistoricalCandles(asset: Asset, timeframe: Timeframe, count = DEFAULT_CANDLE_LIMIT): Promise<Candle[]> {
    this.assertConnected();
    if (timeframe === "45M") {
      return this.buildM45FromM5(asset, count);
    }

    const symbol = await this.resolveSymbol(asset);
    const barsResponse = await this.request<Mt5BridgeBarsResponse>(
      "GET",
      `/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(toTimeframeParam(timeframe))}&count=${Math.max(1, Math.floor(count))}`
    );

    const out = (barsResponse.candles ?? [])
      .map((bar) => this.mapBarToCandle(asset, timeframe, bar))
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const candle of out) {
      this.pipeline.ingestCandle(
        {
          asset,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          complete: candle.complete,
          timezone: "UTC",
        },
        timeframe
      );
    }

    return out;
  }

  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    this.assertConnected();
    const [tick, candle, indicators] = await Promise.all([
      this.getTick(asset),
      this.getCandle(asset, timeframe),
      this.calculateIndicators(asset, timeframe),
    ]);

    if (!tick || !candle || !indicators) {
      return null;
    }

    const quality = this.pipeline.buildQuality(asset, timeframe);
    return {
      asset,
      timeframe,
      tick,
      candle,
      indicators,
      lastUpdate: Date.now(),
      quality,
    };
  }

  async checkHealth(): Promise<DataQuality> {
    const now = Date.now();
    const stats = this.pipeline.getStats();
    const freshness = stats.lastIngestAt > 0 ? now - stats.lastIngestAt : Number.MAX_SAFE_INTEGER;

    return {
      isHealthy: this.connected && freshness <= HEALTH_THRESHOLD_MS,
      latency: 0,
      completeness: this.connected ? 100 : 0,
      freshness,
      errors: this.pipeline.getRecentErrors(20),
      lastHealthCheck: now,
    };
  }

  async getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState> {
    return {
      asset,
      timeframe,
      status: this.connected ? "connected" : "disconnected",
      lastConnect: this.connected ? Date.now() : 0,
      uptime: 0,
      failureCount: 0,
      consecutiveErrors: 0,
    };
  }

  async getHealthStatus(): Promise<DataHealthStatus> {
    const now = Date.now();
    const connectionStates = {} as Record<Asset, Record<Timeframe, ConnectionState>>;

    for (const asset of this.assets) {
      connectionStates[asset] = {} as Record<Timeframe, ConnectionState>;
      for (const timeframe of this.timeframes) {
        connectionStates[asset][timeframe] = await this.getConnectionState(asset, timeframe);
      }
    }

    const connectedAssets = this.connected ? [...this.assets] : [];
    const disconnectedAssets = this.connected ? [] : [...this.assets];
    return {
      timestamp: now,
      overallHealth: this.connected ? 95 : 0,
      connectedAssets,
      disconnectedAssets,
      totalErrors: this.pipeline.getRecentErrors(100).length,
      activeAssets: connectedAssets.length,
      dataProvider: "real",
      avgLatency: 0,
      uptime: this.connected ? 100 : 0,
      lastUpdate: this.pipeline.getStats().lastIngestAt || 0,
      connectionStates,
      recentErrors: this.pipeline.getRecentErrors(50),
    };
  }

  private async resolveSymbol(asset: Asset): Promise<string> {
    const cached = this.resolvedSymbols.get(asset);
    if (cached) return cached;

    const resolved = await this.request<{ resolved?: string }>(
      "GET",
      `/symbols/resolve?requested=${encodeURIComponent(asset)}`
    );
    const symbol = String(resolved.resolved ?? "").trim();
    if (!symbol) {
      throw new Error(`BLOCKED_BY_EXTERNAL_DEPENDENCY: MT5_SYMBOL_NOT_FOUND:${asset}`);
    }
    this.resolvedSymbols.set(asset, symbol);
    return symbol;
  }

  private async buildM45FromM5(asset: Asset, count: number): Promise<Candle[]> {
    const sourceCount = Math.max(60, Math.floor(count) * 10);
    const m5Candles = await this.getHistoricalCandles(asset, "5M", sourceCount);
    const tf = "45M" as const;
    for (const c of m5Candles) {
      this.candleBuilder.ingestCandle({
        ...c,
        timeframe: tf,
        timestamp: c.timestamp,
      });
    }

    const built = this.candleBuilder.getRecent(asset, tf, Math.max(1, Math.floor(count)));
    for (const candle of built) {
      this.pipeline.ingestCandle(
        {
          asset,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          complete: candle.complete,
          timezone: "UTC",
        },
        tf
      );
    }
    return built;
  }

  private mapBarToCandle(
    asset: Asset,
    timeframe: Timeframe,
    row: Mt5BridgeCandleRow
  ): Candle {
    return {
      asset,
      timeframe,
      timestamp: toTimestampMs(row.time),
      open: Number(row.open ?? 0),
      high: Number(row.high ?? 0),
      low: Number(row.low ?? 0),
      close: Number(row.close ?? 0),
      volume: Number(row.tick_volume ?? row.volume ?? 0),
      complete: row.complete !== false,
    };
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error("MT5 provider is not connected. Call connect() first.");
    }
  }

  private async request<T>(method: HttpMethod, path: string): Promise<T> {
    const base = this.baseUrl || assertEnv("MT5_BRIDGE_BASE_URL");
    const timeoutMs = Number.isFinite(this.timeoutMs) ? this.timeoutMs : DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`MT5_BRIDGE_HTTP_${response.status}: ${body || "request failed"}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}