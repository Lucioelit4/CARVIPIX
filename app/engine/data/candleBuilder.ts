import { Asset, Candle, Tick, Timeframe } from "../types/marketData";

const TF_MS: Record<Timeframe, number> = {
  "5M": 5 * 60 * 1000,
  "30M": 30 * 60 * 1000,
  "45M": 45 * 60 * 1000,
  "1H": 60 * 60 * 1000,
};

type OpenBucket = {
  bucketStart: number;
  candle: Candle;
};

export type CandleBuilderGap = {
  asset: Asset;
  timeframe: Timeframe;
  previousBucket: number;
  currentBucket: number;
  missingBars: number;
};

export class CandleBuilder {
  private openBuckets = new Map<string, OpenBucket>();
  private completed = new Map<string, Candle[]>();
  private gaps: CandleBuilderGap[] = [];

  constructor(private readonly maxCandlesPerKey = 1000) {}

  ingestTick(tick: Tick, timeframes: Timeframe[] = ["5M", "30M", "1H"]): Candle[] {
    const emitted: Candle[] = [];

    for (const tf of timeframes) {
      const key = `${tick.asset}:${tf}`;
      const bucketStart = this.toBucketStart(tick.timestamp, tf);
      const existing = this.openBuckets.get(key);

      if (!existing) {
        this.openBuckets.set(key, {
          bucketStart,
          candle: this.createSeedCandle(tick, tf, bucketStart),
        });
        continue;
      }

      if (bucketStart !== existing.bucketStart) {
        existing.candle.complete = true;
        emitted.push(existing.candle);
        this.storeCompleted(key, existing.candle);

        this.detectGap(tick.asset, tf, existing.bucketStart, bucketStart);

        this.openBuckets.set(key, {
          bucketStart,
          candle: this.createSeedCandle(tick, tf, bucketStart),
        });
        continue;
      }

      existing.candle.high = Math.max(existing.candle.high, tick.ask);
      existing.candle.low = Math.min(existing.candle.low, tick.bid);
      existing.candle.close = (tick.bid + tick.ask) / 2;
      existing.candle.volume += tick.volume ?? 0;
      existing.candle.timestamp = bucketStart;
      existing.candle.complete = false;
    }

    return emitted;
  }

  ingestCandle(candle: Candle): Candle[] {
    const key = `${candle.asset}:${candle.timeframe}`;
    const bucketStart = this.toBucketStart(candle.timestamp, candle.timeframe);
    const existing = this.openBuckets.get(key);

    if (!existing) {
      this.openBuckets.set(key, { bucketStart, candle: { ...candle, timestamp: bucketStart } });
      return [];
    }

    if (existing.bucketStart !== bucketStart) {
      existing.candle.complete = true;
      this.storeCompleted(key, existing.candle);
      this.detectGap(candle.asset, candle.timeframe, existing.bucketStart, bucketStart);
      this.openBuckets.set(key, { bucketStart, candle: { ...candle, timestamp: bucketStart } });
      return [existing.candle];
    }

    existing.candle.high = Math.max(existing.candle.high, candle.high);
    existing.candle.low = Math.min(existing.candle.low, candle.low);
    existing.candle.close = candle.close;
    existing.candle.volume += candle.volume;
    existing.candle.complete = candle.complete;

    return [];
  }

  flushUntil(timestamp: number): Candle[] {
    const emitted: Candle[] = [];

    for (const [key, value] of this.openBuckets.entries()) {
      const [, tf] = key.split(":") as [Asset, Timeframe];
      const tfMs = TF_MS[tf];
      if (value.bucketStart + tfMs <= timestamp) {
        value.candle.complete = true;
        emitted.push(value.candle);
        this.storeCompleted(key, value.candle);
        this.openBuckets.delete(key);
      }
    }

    return emitted;
  }

  getRecent(asset: Asset, timeframe: Timeframe, limit = 300): Candle[] {
    const key = `${asset}:${timeframe}`;
    const all = this.completed.get(key) ?? [];
    return all.slice(-limit);
  }

  getOpen(asset: Asset, timeframe: Timeframe): Candle | null {
    return this.openBuckets.get(`${asset}:${timeframe}`)?.candle ?? null;
  }

  getDetectedGaps(limit = 100): CandleBuilderGap[] {
    return this.gaps.slice(-limit);
  }

  private createSeedCandle(tick: Tick, timeframe: Timeframe, bucketStart: number): Candle {
    const mid = (tick.bid + tick.ask) / 2;
    return {
      asset: tick.asset,
      timeframe,
      timestamp: bucketStart,
      open: mid,
      high: tick.ask,
      low: tick.bid,
      close: mid,
      volume: tick.volume ?? 0,
      complete: false,
    };
  }

  private toBucketStart(timestamp: number, timeframe: Timeframe): number {
    const size = TF_MS[timeframe];
    return Math.floor(timestamp / size) * size;
  }

  private detectGap(asset: Asset, timeframe: Timeframe, prev: number, current: number): void {
    const tfMs = TF_MS[timeframe];
    const diff = current - prev;
    if (diff <= tfMs) return;
    const missing = Math.max(0, Math.floor(diff / tfMs) - 1);
    this.gaps.push({
      asset,
      timeframe,
      previousBucket: prev,
      currentBucket: current,
      missingBars: missing,
    });
    if (this.gaps.length > 2000) {
      this.gaps.splice(0, this.gaps.length - 2000);
    }
  }

  private storeCompleted(key: string, candle: Candle): void {
    const arr = this.completed.get(key) ?? [];
    arr.push(candle);
    arr.sort((a, b) => a.timestamp - b.timestamp);
    if (arr.length > this.maxCandlesPerKey) {
      arr.splice(0, arr.length - this.maxCandlesPerKey);
    }
    this.completed.set(key, arr);
  }
}
