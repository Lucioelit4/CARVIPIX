import { createHash } from "node:crypto";
import type { Asset, Candle } from "../../engine/types/marketData";
import type { IndicatorFramework } from "../../engine/data/indicatorFramework";
import type { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { AI_CONTEXT_VERSION, AI_ENGINE_VERSION } from "../aiVersioning";
import { CADP_V1_PROFILE, type CadpAnalysisRequestV2, type CadpSnapshotIdentity, type CadpTimeframeEnvelope } from "./types";
import { getCadpFeatureFlags } from "./config";

function clampSeries(candles: Candle[], max = 32): Candle[] {
  return candles.slice(-max);
}

function buildEnvelope(timeframe: "H1" | "M30" | "M5", candles: Candle[], indicators: IndicatorFramework, symbol: Asset): CadpTimeframeEnvelope {
  const series = clampSeries(candles, timeframe === "M5" ? 48 : 32);
  const closed = series.filter((c) => c.complete);
  const open = [...series].reverse().find((c) => !c.complete) ?? null;
  const latest = indicators.getLatest(symbol, timeframe as never);
  const highs = closed.map((c) => c.high);
  const lows = closed.map((c) => c.low);
  return {
    timeframe: timeframe as never,
    closed_candles: closed,
    open_candle: open,
    ema20: latest?.ema20 ?? 0,
    ema50: latest?.ema50 ?? 0,
    ema200: latest?.ema200 ?? 0,
    atr: latest?.atr ?? 0,
    adx: latest?.adx ?? 0,
    volatility_percentile: 50,
    structural_highs: highs.slice(-5),
    structural_lows: lows.slice(-5),
    support_zones: lows.slice(-3),
    resistance_zones: highs.slice(-3),
    latest_timestamp: closed.at(-1)?.timestamp ?? null,
  };
}

export class CadpSnapshotBuilder {
  constructor(private readonly pipeline: MarketDataPipeline, private readonly indicators: IndicatorFramework) {}

  build(input: { analysisId: string; symbol: Asset; brokerSymbol: string; nowUtc?: number }): CadpAnalysisRequestV2 {
    const nowUtc = input.nowUtc ?? Date.now();
    const h1 = this.pipeline.getRecentCandles(input.symbol, "1H", 120);
    const m30 = this.pipeline.getRecentCandles(input.symbol, "30M", 120);
    const m5 = this.pipeline.getRecentCandles(input.symbol, "5M", 144);

    const h1Env = buildEnvelope("H1", h1, this.indicators, input.symbol);
    const m30Env = buildEnvelope("M30", m30, this.indicators, input.symbol);
    const m5Env = buildEnvelope("M5", m5, this.indicators, input.symbol);

    const numericContext = {
      h1: h1Env,
      m30: m30Env,
      m5: m5Env,
      market: {
        bid: m5Env.open_candle?.close ?? m5Env.closed_candles.at(-1)?.close ?? 0,
        ask: m5Env.open_candle?.close ?? m5Env.closed_candles.at(-1)?.close ?? 0,
        spread: 0,
      },
    };

    const numeric_context_hash = createHash("sha256").update(JSON.stringify(numericContext)).digest("hex");
    const visual_manifest_hash = createHash("sha256").update(`${input.analysisId}:${numeric_context_hash}`).digest("hex");
    const final_context_hash = createHash("sha256").update(`${numeric_context_hash}:${visual_manifest_hash}`).digest("hex");

    const identity: CadpSnapshotIdentity = {
      analysis_id: input.analysisId,
      symbol: input.symbol,
      broker_symbol: input.brokerSymbol,
      analysis_profile: CADP_V1_PROFILE,
      snapshot_utc: new Date(nowUtc).toISOString(),
      current_bid: numericContext.market.bid,
      current_ask: numericContext.market.ask,
      last_closed_candle_h1: h1Env.closed_candles.at(-1)?.timestamp ?? null,
      last_closed_candle_m30: m30Env.closed_candles.at(-1)?.timestamp ?? null,
      last_closed_candle_m5: m5Env.closed_candles.at(-1)?.timestamp ?? null,
      engine_version: AI_ENGINE_VERSION,
      context_version: AI_CONTEXT_VERSION,
      visual_schema_version: "cadp_visual_v1",
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
      response_schema_version: "cadp_response_v2",
      m30_alignment_version: "m30_alignment_v1",
    };

    return {
      identity,
      timeframes: { H1: h1Env, M30: m30Env, M5: m5Env },
      market_now: {
        spread: 0,
        spread_avg: 0,
        spread_vs_atr: 0,
        session: "UNKNOWN",
        volatility_now: m5Env.atr,
        volatility_percentile: 50,
        market_open: true,
        news_status: "CURRENT",
      },
      sessions: {
        market_status: "OPEN",
        primary_session: "NONE",
        session_overlap: "NONE",
        minutes_to_session_close: 0,
        minutes_to_daily_maintenance: 0,
        minutes_to_weekly_close: 0,
        next_market_open_utc: null,
        holiday_schedule_active: false,
        early_close: false,
        schedule_source: "internal-default",
      },
      news_bundle: {
        news_status: "CURRENT",
        last_refresh_utc: new Date(nowUtc).toISOString(),
        events: [],
        source_ids: [],
        research_used: false,
        verification_requested: false,
        evidence_hash: createHash("sha256").update("[]").digest("hex"),
      },
      visual_manifest: {
        analysis_id: input.analysisId,
        images: [],
        visual_manifest_hash,
      },
      authorized_strategies: [
        {
          strategy_id: "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
          strategy_version: "1.0.0",
          status: "SHADOW",
          short_description: "MTF pullback for XAUUSD intraday.",
          critical_requirements: ["H1_DIRECTION", "M30_PULLBACK_OR_COMPRESSION", "M5_CONFIRMATION"],
          allowed_profile: CADP_V1_PROFILE,
        },
        {
          strategy_id: "CARVIPIX_VOLATILITY_BREAKOUT_XAUUSD_V1",
          strategy_version: "1.0.0",
          status: "SHADOW",
          short_description: "Volatility breakout for XAUUSD intraday.",
          critical_requirements: ["H1_RANGE_OR_COMPRESSION", "M30_EXPANSION", "M5_TRIGGER"],
          allowed_profile: CADP_V1_PROFILE,
        },
        {
          strategy_id: "CARVIPIX_NO_TRADE_V1",
          strategy_version: "1.0.0",
          status: "ACTIVE",
          short_description: "Explicit no trade option.",
          critical_requirements: ["NO_SETUP", "RISK_OR_NEWS_BLOCK"],
          allowed_profile: CADP_V1_PROFILE,
        },
      ],
      numeric_context_hash,
      final_context_hash,
      risk_envelope: {
        max_daily_risk_pct: 1,
        max_exposure_pct: 3,
        lot_size_policy: "CARVIPIX_CONTROLLED",
        auto_execution_eligible: false,
        human_review_required: true,
      },
      feature_flags: getCadpFeatureFlags(),
    };
  }
}
