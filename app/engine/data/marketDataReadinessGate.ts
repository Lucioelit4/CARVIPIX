import type { Asset, Candle, Tick, Timeframe } from "../types/marketData";
import type { CadpAnalysisRequestV2 } from "../../ai/cadpV2/types";

export const DATA_NOT_READY = "DATA_NOT_READY" as const;

type IndicatorSet = {
  ema200: number;
  atr: number;
  adx: number;
};

type TimeframeSeries = {
  timeframe: Timeframe;
  closedCandles: number;
  latestTimestamp: number | null;
  indicators: IndicatorSet;
  chartImagePresent: boolean;
  candles?: Candle[];
};

export interface ReadinessInput {
  asset: Asset;
  snapshotUtc: string;
  tick: Tick | null;
  requiredTimeframes: TimeframeSeries[];
  marketActive?: boolean;
  maxSnapshotAgeMs?: number;
  minCandlesByTimeframe?: Partial<Record<Timeframe, number>>;
}

export interface ReadinessResult {
  pass: boolean;
  status: "PASS" | typeof DATA_NOT_READY;
  reasons: string[];
  details: {
    snapshotAgeMs: number;
    tickAgeMs: number | null;
    marketActive: boolean;
  };
}

function isFinitePositive(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

export class MarketDataReadinessGate {
  evaluate(input: ReadinessInput): ReadinessResult {
    const reasons: string[] = [];
    const now = Date.now();
    const snapshotTs = Date.parse(input.snapshotUtc);
    const maxSnapshotAgeMs = input.maxSnapshotAgeMs ?? 120_000;

    const snapshotAgeMs = Number.isFinite(snapshotTs) ? now - snapshotTs : Number.MAX_SAFE_INTEGER;
    if (!Number.isFinite(snapshotTs) || snapshotAgeMs > maxSnapshotAgeMs) {
      reasons.push("STALE_SNAPSHOT");
    }

    const tick = input.tick;
    let tickAgeMs: number | null = null;
    if (!tick) {
      reasons.push("MISSING_TICK");
    } else {
      if (!isFinitePositive(tick.bid) || !isFinitePositive(tick.ask) || tick.ask < tick.bid) {
        reasons.push("INVALID_BID_ASK");
      }
      const spread = tick.ask - tick.bid;
      if (!Number.isFinite(spread) || spread <= 0) {
        reasons.push("INVALID_SPREAD");
      }
      tickAgeMs = now - tick.timestamp;
    }

    const inferredMarketActive = this.inferMarketActive(now, tickAgeMs, maxSnapshotAgeMs);
    const marketActive = input.marketActive ?? inferredMarketActive;
    if (!marketActive || tickAgeMs === null || !Number.isFinite(tick?.timestamp) || tickAgeMs > maxSnapshotAgeMs) {
      reasons.push("MARKET_CLOSED_OR_STALE_TICK");
    }

    const minima: Record<Timeframe, number> = {
      "5M": input.minCandlesByTimeframe?.["5M"] ?? 300,
      "30M": input.minCandlesByTimeframe?.["30M"] ?? 250,
      "45M": input.minCandlesByTimeframe?.["45M"] ?? 250,
      "1H": input.minCandlesByTimeframe?.["1H"] ?? 250,
    };

    for (const tf of input.requiredTimeframes) {
      if (tf.closedCandles < minima[tf.timeframe]) {
        if (tf.timeframe === "1H") reasons.push("INSUFFICIENT_H1_HISTORY");
        if (tf.timeframe === "5M") reasons.push("INSUFFICIENT_M5_HISTORY");
        if (tf.timeframe === "30M") reasons.push("INSUFFICIENT_M30_HISTORY");
        if (tf.timeframe === "45M") reasons.push("INSUFFICIENT_M45_HISTORY");
      }
      if (!Number.isFinite(tf.latestTimestamp ?? NaN)) {
        reasons.push(`EMPTY_TIMEFRAME_${tf.timeframe}`);
      }
      if (!tf.chartImagePresent) {
        reasons.push(`EMPTY_CHART_${tf.timeframe}`);
      }

      if (!isFinitePositive(tf.indicators.ema200)) {
        reasons.push(`EMA200_NOT_READY_${tf.timeframe}`);
      }
      if (!isFinitePositive(tf.indicators.atr)) {
        reasons.push(`ATR_NOT_READY_${tf.timeframe}`);
      }
      if (!isFinitePositive(tf.indicators.adx)) {
        reasons.push(`ADX_NOT_READY_${tf.timeframe}`);
      }

      const series = tf.candles ?? [];
      if (series.length > 0) {
        for (let i = 1; i < series.length; i++) {
          if (series[i].timestamp <= series[i - 1].timestamp) {
            reasons.push(`DUPLICATED_OR_UNORDERED_SERIES_${tf.timeframe}`);
            break;
          }
        }

        const lastClosed = [...series].reverse().find((c) => c.complete) ?? null;
        if (!lastClosed || !Number.isFinite(lastClosed.timestamp)) {
          reasons.push(`LAST_CLOSED_CANDLE_INVALID_${tf.timeframe}`);
        } else if (Number.isFinite(tf.latestTimestamp ?? NaN) && tf.latestTimestamp !== lastClosed.timestamp) {
          reasons.push(`LAST_CLOSED_CANDLE_MISMATCH_${tf.timeframe}`);
        }
      }
    }

    const uniqueReasons = Array.from(new Set(reasons));
    return {
      pass: uniqueReasons.length === 0,
      status: uniqueReasons.length === 0 ? "PASS" : DATA_NOT_READY,
      reasons: uniqueReasons,
      details: {
        snapshotAgeMs,
        tickAgeMs,
        marketActive,
      },
    };
  }

  private inferMarketActive(now: number, tickAgeMs: number | null, maxTickAgeMs: number): boolean {
    const weekday = new Date(now).getUTCDay();
    const weekDayActive = weekday >= 1 && weekday <= 5;
    const tickFresh = tickAgeMs !== null && Number.isFinite(tickAgeMs) && tickAgeMs <= maxTickAgeMs;
    return weekDayActive && tickFresh;
  }

  evaluateCadpRequest(input: { request: CadpAnalysisRequestV2 }): ReadinessResult {
    const { request } = input;
    const toSeries = [
      { tf: "1H" as const, env: request.timeframes.H1 },
      { tf: "30M" as const, env: request.timeframes.M30 },
      { tf: "5M" as const, env: request.timeframes.M5 },
    ];

    return this.evaluate({
      asset: request.identity.symbol,
      snapshotUtc: request.identity.snapshot_utc,
      tick: {
        asset: request.identity.symbol,
        bid: request.identity.current_bid,
        ask: request.identity.current_ask,
        spread: Math.max(0, request.identity.current_ask - request.identity.current_bid),
        timestamp: Date.parse(request.identity.snapshot_utc),
        lastUpdate: Date.parse(request.identity.snapshot_utc),
      },
      requiredTimeframes: toSeries.map(({ tf, env }) => ({
        timeframe: tf,
        closedCandles: env.closed_candles.length,
        latestTimestamp: env.latest_timestamp,
        indicators: {
          ema200: env.ema200,
          atr: env.atr,
          adx: env.adx,
        },
        chartImagePresent: request.visual_manifest.images.some((img) => img.timeframe === tf),
      })),
    });
  }
}