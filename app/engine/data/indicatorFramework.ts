import { Asset, Candle, TechnicalIndicators, Timeframe } from "../types/marketData";

type IndicatorLog = {
  asset: Asset;
  timeframe: Timeframe;
  timestamp: number;
  message: string;
};

export type IndicatorComparisonResult = {
  totalPoints: number;
  mismatches: number;
  maxDiff: number;
  mismatchIndices: number[];
};

export class IndicatorFramework {
  private candleCache = new Map<string, Candle[]>();
  private latest = new Map<string, TechnicalIndicators>();
  private logs: IndicatorLog[] = [];

  constructor(private readonly maxCandlesPerSeries = 1500) {}

  update(asset: Asset, timeframe: Timeframe, candle: Candle, spread = 0): TechnicalIndicators {
    const key = this.key(asset, timeframe);
    const series = this.candleCache.get(key) ?? [];

    if (series.length > 0 && series[series.length - 1].timestamp === candle.timestamp) {
      series[series.length - 1] = candle;
    } else {
      series.push(candle);
      series.sort((a, b) => a.timestamp - b.timestamp);
      if (series.length > this.maxCandlesPerSeries) {
        series.splice(0, series.length - this.maxCandlesPerSeries);
      }
    }

    this.candleCache.set(key, series);

    const closes = series.map((c) => c.close);
    const highs = series.map((c) => c.high);
    const lows = series.map((c) => c.low);

    const ema20 = this.ema(closes, 20);
    const ema50 = this.ema(closes, 50);
    const ema200 = this.ema(closes, 200);
    const atr = this.atr(highs, lows, closes, 14);
    const rsi = this.rsi(closes, 14);
    const adx = this.adx(highs, lows, closes, 14);
    const close = closes[closes.length - 1] ?? 0;

    const indicators: TechnicalIndicators = {
      ema20,
      ema50,
      ema200,
      atr,
      rsi,
      adx,
      spread,
      volatility: close > 0 ? (atr / close) * 100 : 0,
      timestamp: candle.timestamp,
      internal: {
        close,
      },
    };

    this.latest.set(key, indicators);
    this.log(asset, timeframe, candle.timestamp, "Indicators updated");

    return indicators;
  }

  getLatest(asset: Asset, timeframe: Timeframe): TechnicalIndicators | null {
    return this.latest.get(this.key(asset, timeframe)) ?? null;
  }

  getSeries(asset: Asset, timeframe: Timeframe, limit = 300): Candle[] {
    const series = this.candleCache.get(this.key(asset, timeframe)) ?? [];
    return series.slice(-limit);
  }

  compareSeries(reference: number[], computed: number[], tolerance: number): IndicatorComparisonResult {
    const size = Math.min(reference.length, computed.length);
    let mismatches = 0;
    let maxDiff = 0;
    const mismatchIndices: number[] = [];

    for (let i = 0; i < size; i++) {
      const diff = Math.abs(reference[i] - computed[i]);
      maxDiff = Math.max(maxDiff, diff);
      if (diff > tolerance) {
        mismatches++;
        mismatchIndices.push(i);
      }
    }

    return {
      totalPoints: size,
      mismatches,
      maxDiff,
      mismatchIndices,
    };
  }

  getLogs(limit = 200): IndicatorLog[] {
    return this.logs.slice(-limit);
  }

  private key(asset: Asset, timeframe: Timeframe): string {
    return `${asset}:${timeframe}`;
  }

  private log(asset: Asset, timeframe: Timeframe, timestamp: number, message: string): void {
    this.logs.push({ asset, timeframe, timestamp, message });
    if (this.logs.length > 3000) {
      this.logs.splice(0, this.logs.length - 3000);
    }
  }

  private ema(values: number[], period: number): number {
    if (values.length === 0) return 0;
    const k = 2 / (period + 1);
    let out = values[0];
    for (let i = 1; i < values.length; i++) {
      out = values[i] * k + out * (1 - k);
    }
    return out;
  }

  private atr(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length === 0 || lows.length === 0 || closes.length === 0) return 0;
    const tr: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      const prevClose = i === 0 ? closes[i] : closes[i - 1];
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose)));
    }
    const start = Math.max(0, tr.length - period);
    const slice = tr.slice(start);
    return slice.reduce((sum, v) => sum + v, 0) / Math.max(1, slice.length);
  }

  private rsi(closes: number[], period: number): number {
    if (closes.length < 2) return 50;
    const start = Math.max(1, closes.length - period);
    let gains = 0;
    let losses = 0;
    for (let i = start; i < closes.length; i++) {
      const delta = closes[i] - closes[i - 1];
      if (delta >= 0) gains += delta;
      else losses += Math.abs(delta);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  }

  private adx(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length < 2 * period + 1 || lows.length < 2 * period + 1 || closes.length < 2 * period + 1) {
      return Number.NaN;
    }

    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const tr: number[] = [];

    for (let i = 1; i < highs.length; i++) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

      const prevClose = closes[i - 1];
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose)));
    }

    let smoothedTR = tr.slice(0, period).reduce((sum, v) => sum + v, 0);
    let smoothedPlus = plusDM.slice(0, period).reduce((sum, v) => sum + v, 0);
    let smoothedMinus = minusDM.slice(0, period).reduce((sum, v) => sum + v, 0);

    const dxValues: number[] = [];

    const seedDiSum = smoothedTR > 0 ? (100 * smoothedPlus) / smoothedTR + (100 * smoothedMinus) / smoothedTR : 0;
    const seedDx =
      seedDiSum > 0
        ? (100 * Math.abs((100 * smoothedPlus) / smoothedTR - (100 * smoothedMinus) / smoothedTR)) / seedDiSum
        : 0;
    dxValues.push(seedDx);

    for (let i = period; i < tr.length; i++) {
      smoothedTR = smoothedTR - smoothedTR / period + tr[i];
      smoothedPlus = smoothedPlus - smoothedPlus / period + plusDM[i];
      smoothedMinus = smoothedMinus - smoothedMinus / period + minusDM[i];

      if (smoothedTR <= 0) {
        dxValues.push(0);
        continue;
      }

      const diPlus = (100 * smoothedPlus) / smoothedTR;
      const diMinus = (100 * smoothedMinus) / smoothedTR;
      const diSum = diPlus + diMinus;
      const dx = diSum > 0 ? (100 * Math.abs(diPlus - diMinus)) / diSum : 0;
      dxValues.push(dx);
    }

    if (dxValues.length < period) {
      return Number.NaN;
    }

    let adx = dxValues.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
    for (let i = period; i < dxValues.length; i++) {
      adx = ((adx * (period - 1)) + dxValues[i]) / period;
    }

    if (!Number.isFinite(adx)) {
      return Number.NaN;
    }

    if (adx < 0) return 0;
    if (adx > 100) return 100;
    return adx;
  }

  private wilder(values: number[], period: number): number[] {
    if (values.length === 0) return [];
    const out: number[] = [];
    let running = values.slice(0, period).reduce((sum, v) => sum + v, 0);
    out.push(running);
    for (let i = period; i < values.length; i++) {
      running = running - running / period + values[i];
      out.push(running);
    }
    return out;
  }
}
