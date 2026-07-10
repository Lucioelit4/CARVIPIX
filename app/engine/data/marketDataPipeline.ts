import {
  Asset,
  Candle,
  DataError,
  DataQuality,
  Tick,
  Timeframe,
} from "../types/marketData";

type RawTick = {
  symbol?: string;
  asset?: Asset;
  timestamp?: number | string;
  bid?: number | string;
  ask?: number | string;
  volume?: number | string;
  timezone?: string;
};

type RawCandle = {
  symbol?: string;
  asset?: Asset;
  timestamp?: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
  volume?: number | string;
  complete?: boolean;
  timezone?: string;
};

export type PipelineStats = {
  ticksIngested: number;
  candlesIngested: number;
  duplicatesIgnored: number;
  delayedItems: number;
  missingCandlesDetected: number;
  timezoneNormalizations: number;
  lastIngestAt: number;
};

const ASSET_ALIASES: Record<string, Asset> = {
  XAUUSD: "XAUUSD",
  "XAU/USD": "XAUUSD",
  GOLD: "XAUUSD",
  EURUSD: "EURUSD",
  "EUR/USD": "EURUSD",
  GBPUSD: "GBPUSD",
  "GBP/USD": "GBPUSD",
  BTCUSD: "BTCUSD",
  "BTC/USD": "BTCUSD",
};

const TF_MS: Record<Timeframe, number> = {
  "5M": 5 * 60 * 1000,
  "45M": 45 * 60 * 1000,
  "1H": 60 * 60 * 1000,
};

export class MarketDataPipeline {
  private tickBuffer = new Map<Asset, Tick[]>();
  private candleBuffer = new Map<string, Candle[]>();
  private latestTick = new Map<Asset, Tick>();
  private latestCandle = new Map<string, Candle>();
  private seenTickIds = new Set<string>();
  private seenCandleIds = new Set<string>();
  private recentErrors: DataError[] = [];
  private stats: PipelineStats = {
    ticksIngested: 0,
    candlesIngested: 0,
    duplicatesIgnored: 0,
    delayedItems: 0,
    missingCandlesDetected: 0,
    timezoneNormalizations: 0,
    lastIngestAt: 0,
  };

  constructor(private readonly maxBufferPerKey = 500) {}

  ingestTick(raw: RawTick): Tick | null {
    const asset = this.normalizeAsset(raw.asset ?? raw.symbol);
    if (!asset) {
      this.recordError({
        timestamp: Date.now(),
        asset: "EURUSD",
        errorType: "invalid",
        message: "Unknown tick symbol",
        severity: "warning",
      });
      return null;
    }

    const timestamp = this.normalizeTimestamp(raw.timestamp, raw.timezone);
    const bid = Number(raw.bid);
    const ask = Number(raw.ask);
    const volume = raw.volume == null ? undefined : Number(raw.volume);

    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0 || ask < bid) {
      this.recordError({
        timestamp: Date.now(),
        asset,
        errorType: "invalid",
        message: "Invalid tick bid/ask",
        severity: "error",
      });
      return null;
    }

    const id = `${asset}:${timestamp}:${bid}:${ask}`;
    if (this.seenTickIds.has(id)) {
      this.stats.duplicatesIgnored++;
      return null;
    }
    this.seenTickIds.add(id);

    const tick: Tick = {
      asset,
      timestamp,
      bid,
      ask,
      spread: ask - bid,
      volume,
      lastUpdate: Date.now(),
    };

    const age = Date.now() - timestamp;
    if (age > 30_000) {
      this.stats.delayedItems++;
    }

    this.stats.ticksIngested++;
    this.stats.lastIngestAt = Date.now();
    this.latestTick.set(asset, tick);
    this.pushTick(asset, tick);
    this.trimSeen(this.seenTickIds, 50_000);

    return tick;
  }

  ingestCandle(raw: RawCandle, timeframe: Timeframe): Candle | null {
    const asset = this.normalizeAsset(raw.asset ?? raw.symbol);
    if (!asset) {
      return null;
    }

    const timestamp = this.normalizeTimestamp(raw.timestamp, raw.timezone);
    const open = Number(raw.open);
    const high = Number(raw.high);
    const low = Number(raw.low);
    const close = Number(raw.close);
    const volume = Number(raw.volume ?? 0);
    const complete = raw.complete !== false;

    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      open <= 0 ||
      high <= 0 ||
      low <= 0 ||
      close <= 0 ||
      high < low
    ) {
      this.recordError({
        timestamp: Date.now(),
        asset,
        timeframe,
        errorType: "invalid",
        message: "Invalid candle OHLC",
        severity: "error",
      });
      return null;
    }

    const candle: Candle = {
      asset,
      timeframe,
      timestamp,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
      complete,
    };

    const id = `${asset}:${timeframe}:${timestamp}`;
    if (this.seenCandleIds.has(id)) {
      this.stats.duplicatesIgnored++;
      return null;
    }
    this.seenCandleIds.add(id);

    this.detectMissing(asset, timeframe, candle.timestamp);

    const age = Date.now() - timestamp;
    if (age > TF_MS[timeframe] * 3) {
      this.stats.delayedItems++;
    }

    this.stats.candlesIngested++;
    this.stats.lastIngestAt = Date.now();

    const key = this.candleKey(asset, timeframe);
    this.latestCandle.set(key, candle);
    this.pushCandle(key, candle);
    this.trimSeen(this.seenCandleIds, 100_000);

    return candle;
  }

  getLatestTick(asset: Asset): Tick | null {
    return this.latestTick.get(asset) ?? null;
  }

  getLatestCandle(asset: Asset, timeframe: Timeframe): Candle | null {
    return this.latestCandle.get(this.candleKey(asset, timeframe)) ?? null;
  }

  getRecentCandles(asset: Asset, timeframe: Timeframe, limit = 200): Candle[] {
    const all = this.candleBuffer.get(this.candleKey(asset, timeframe)) ?? [];
    return all.slice(-limit);
  }

  appendBuiltCandle(candle: Candle): void {
    this.ingestCandle(candle, candle.timeframe);
  }

  buildQuality(asset: Asset, timeframe: Timeframe): DataQuality {
    const tick = this.getLatestTick(asset);
    const candle = this.getLatestCandle(asset, timeframe);
    const freshnessRef = candle?.timestamp ?? tick?.timestamp ?? 0;
    const latency = tick ? Date.now() - tick.timestamp : 0;

    return {
      isHealthy: this.recentErrors.filter((e) => e.severity === "critical").length === 0,
      latency,
      completeness: 100,
      freshness: freshnessRef ? Date.now() - freshnessRef : Number.MAX_SAFE_INTEGER,
      errors: this.recentErrors.slice(-25),
      lastHealthCheck: Date.now(),
    };
  }

  getStats(): PipelineStats {
    return { ...this.stats };
  }

  getRecentErrors(limit = 50): DataError[] {
    return this.recentErrors.slice(-limit);
  }

  private normalizeAsset(input?: string): Asset | null {
    if (!input) return null;
    const cleaned = input.trim().toUpperCase();
    return ASSET_ALIASES[cleaned] ?? null;
  }

  private normalizeTimestamp(input?: number | string, timezone?: string): number {
    if (timezone && timezone.toUpperCase() !== "UTC") {
      this.stats.timezoneNormalizations++;
    }

    if (typeof input === "number") {
      if (input < 10_000_000_000) {
        return input * 1000;
      }
      return input;
    }

    if (typeof input === "string" && input.length > 0) {
      const numeric = Number(input);
      if (Number.isFinite(numeric)) {
        return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
      }
      const parsed = Date.parse(input);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return Date.now();
  }

  private candleKey(asset: Asset, timeframe: Timeframe): string {
    return `${asset}:${timeframe}`;
  }

  private pushTick(asset: Asset, tick: Tick): void {
    const existing = this.tickBuffer.get(asset) ?? [];
    existing.push(tick);
    if (existing.length > this.maxBufferPerKey) {
      existing.splice(0, existing.length - this.maxBufferPerKey);
    }
    this.tickBuffer.set(asset, existing);
  }

  private pushCandle(key: string, candle: Candle): void {
    const existing = this.candleBuffer.get(key) ?? [];
    existing.push(candle);
    existing.sort((a, b) => a.timestamp - b.timestamp);
    if (existing.length > this.maxBufferPerKey) {
      existing.splice(0, existing.length - this.maxBufferPerKey);
    }
    this.candleBuffer.set(key, existing);
  }

  private detectMissing(asset: Asset, timeframe: Timeframe, timestamp: number): void {
    const candles = this.candleBuffer.get(this.candleKey(asset, timeframe));
    const last = candles?.[candles.length - 1];
    if (!last) return;

    const expected = TF_MS[timeframe];
    const diff = timestamp - last.timestamp;
    if (diff > expected * 1.5) {
      const missing = Math.max(0, Math.floor(diff / expected) - 1);
      this.stats.missingCandlesDetected += missing;
    }
  }

  private recordError(error: DataError): void {
    this.recentErrors.push(error);
    if (this.recentErrors.length > 500) {
      this.recentErrors.splice(0, this.recentErrors.length - 500);
    }
  }

  private trimSeen(seen: Set<string>, limit: number): void {
    if (seen.size <= limit) return;
    const removeCount = seen.size - limit;
    let removed = 0;
    for (const id of seen) {
      seen.delete(id);
      removed++;
      if (removed >= removeCount) break;
    }
  }
}
