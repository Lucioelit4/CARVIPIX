/**
 * Snapshot Builder V3 — Expediente Maestro V3
 * Construye las Secciones 1-13 del expediente para cualquiera de los 7 instrumentos.
 * Genérico: una sola clase, 7 instrumentos, expedientes completamente independientes.
 */

import { createHash } from "node:crypto";
import type { Asset, Candle } from "../../engine/types/marketData";
import type { IndicatorFramework } from "../../engine/data/indicatorFramework";
import type { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { AI_ENGINE_VERSION } from "../aiVersioning";
import { CADP_PROMPT_VERSION } from "../aiVersioning";
import { getCadpFeatureFlags } from "./config";
import { getInstrument, getAuthorizedStrategies } from "./instrumentRegistry";
import { scenarioMemoryStore } from "./scenarioMemoryStore";
import { idempotencyStore } from "./idempotencyStore";
import { NewsContextProvider } from "./newsContextProvider";
import { DefaultEconomicEventProvider } from "./defaultEconomicEventProvider";
import { SessionContextService } from "./sessionContextService";
import type {
  CanonicalSymbol,
  IdentityV3,
  QualityV3,
  PreAnalysisTrigger,
  PreAnalysisTriggerReason,
  PreviousContextV3,
  DeltaContextV3,
  MarketTimeframeH1,
  MarketTimeframeM30,
  MarketTimeframeM5,
  EmaOrderFacts,
  MultiTimeframeContext,
  VolatilityAndSession,
  NewsAndRisk,
  HistoricalContext,
  VisualContextV3,
  ExpedienteMaestroV3,
  IdempotencyKey,
} from "./typesMaestroV3";

const CADP_VERSION = "maestro-v3" as const;

function clamp<T>(arr: T[], max: number): T[] {
  return arr.slice(-max);
}

function buildEmaOrder(ema20: number, ema50: number, ema200: number, price: number): EmaOrderFacts {
  return {
    ema20_above_ema50: ema20 > ema50,
    ema50_above_ema200: ema50 > ema200,
    price_above_ema200: price > ema200,
    price_above_ema50: price > ema50,
    price_above_ema20: price > ema20,
  };
}

function countConsecutiveHH(highs: number[]): number {
  let count = 0;
  for (let i = highs.length - 1; i > 0; i--) {
    if (highs[i] > highs[i - 1]) count++;
    else break;
  }
  return count;
}

function countConsecutiveLL(lows: number[]): number {
  let count = 0;
  for (let i = lows.length - 1; i > 0; i--) {
    if (lows[i] < lows[i - 1]) count++;
    else break;
  }
  return count;
}

function countConsecutiveCompressed(candles: Candle[], atr: number): number {
  const threshold = atr * 0.5;
  let count = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    const range = candles[i].high - candles[i].low;
    if (range < threshold) count++;
    else break;
  }
  return count;
}

function detectStructureDirection(highs: number[], lows: number[]): "BULLISH" | "BEARISH" | "MIXED" {
  const hhCount = countConsecutiveHH(highs);
  const llCount = countConsecutiveLL(lows);
  if (hhCount >= 2 && llCount === 0) return "BULLISH";
  if (llCount >= 2 && hhCount === 0) return "BEARISH";
  return "MIXED";
}

function getLastCandleDirection(c: Candle): "BULLISH" | "BEARISH" | "DOJI" {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0 || body / range < 0.1) return "DOJI";
  return c.close > c.open ? "BULLISH" : "BEARISH";
}

function buildPricePosition(
  price: number,
  supportZones: number[],
  resistanceZones: number[],
  pipValue: number,
): { nearestSupportPips: number; nearestResistancePips: number } {
  const supportsBelow = supportZones.filter(s => s < price);
  const resistancesAbove = resistanceZones.filter(r => r > price);

  const nearestSupport = supportsBelow.length > 0 ? Math.max(...supportsBelow) : (supportZones[0] ?? price);
  const nearestResistance = resistancesAbove.length > 0 ? Math.min(...resistancesAbove) : (resistanceZones[resistanceZones.length - 1] ?? price);

  return {
    nearestSupportPips: Math.abs(price - nearestSupport) / pipValue,
    nearestResistancePips: Math.abs(nearestResistance - price) / pipValue,
  };
}

export interface SnapshotV3BuildInput {
  analysis_id: string;
  signal_id: string;
  canonical_symbol: CanonicalSymbol;
  trigger_reason: PreAnalysisTriggerReason;
  nowUtc?: number;
}

export interface SnapshotV3BuildResult {
  expediente: Omit<ExpedienteMaestroV3, "narrative_context" | "executive_summary">;
  idempotency_key: IdempotencyKey;
  asset: Asset;
}

export class MaestroV3SnapshotBuilder {
  private readonly sessionService = new SessionContextService();
  private readonly newsProvider = new NewsContextProvider(new DefaultEconomicEventProvider());

  constructor(
    private readonly pipeline: MarketDataPipeline,
    private readonly indicators: IndicatorFramework,
  ) {}

  async build(input: SnapshotV3BuildInput): Promise<SnapshotV3BuildResult> {
    const nowUtc = input.nowUtc ?? Date.now();
    const instrument = getInstrument(input.canonical_symbol);
    const asset = input.canonical_symbol as unknown as Asset;
    const pipValue = instrument.pip_value;
    const flags = getCadpFeatureFlags();

    // ── Candle data
    const h1Raw = this.pipeline.getRecentCandles(asset, "1H", 120);
    const m30Raw = this.pipeline.getRecentCandles(asset, "30M", 120);
    const m5Raw = this.pipeline.getRecentCandles(asset, "5M", 144);

    const h1Candles = clamp(h1Raw, 32);
    const m30Candles = clamp(m30Raw, 32);
    const m5Candles = clamp(m5Raw, 48);

    const h1Closed = h1Candles.filter(c => c.complete);
    const m30Closed = m30Candles.filter(c => c.complete);
    const m5Closed = m5Candles.filter(c => c.complete);

    const h1Open = [...h1Candles].reverse().find(c => !c.complete) ?? null;
    const m30Open = [...m30Candles].reverse().find(c => !c.complete) ?? null;
    const m5Open = [...m5Candles].reverse().find(c => !c.complete) ?? null;

    // ── Indicators
    const indH1 = this.indicators.getLatest(asset, "1H" as never);
    const indM30 = this.indicators.getLatest(asset, "30M" as never);
    const indM5 = this.indicators.getLatest(asset, "5M" as never);

    const midPrice = m5Open?.close ?? m5Closed.at(-1)?.close ?? 0;

    const lastH1Ts = h1Closed.at(-1)?.timestamp ?? null;
    const lastM30Ts = m30Closed.at(-1)?.timestamp ?? null;
    const lastM5Ts = m5Closed.at(-1)?.timestamp ?? null;

    // ── Quality validation
    const h1FreshnessSec = lastH1Ts !== null ? (nowUtc - lastH1Ts) / 1000 : 99999;
    const m30FreshnessSec = lastM30Ts !== null ? (nowUtc - lastM30Ts) / 1000 : 99999;
    const m5FreshnessSec = lastM5Ts !== null ? (nowUtc - lastM5Ts) / 1000 : 99999;

    const dataFresh = h1FreshnessSec < 3660 && m30FreshnessSec < 1860 && m5FreshnessSec < 360;
    const indicatorsOk = !!(indH1?.ema20 && indH1?.ema200 && indH1?.atr);

    const quality: QualityV3 = {
      data_complete: h1Closed.length > 0 && m30Closed.length > 0 && m5Closed.length > 0,
      candles_closed: {
        H1: h1Closed.length > 0,
        M30: m30Closed.length > 0,
        M5: m5Closed.length > 0,
      },
      candle_freshness_seconds: {
        H1: Math.round(h1FreshnessSec),
        M30: Math.round(m30FreshnessSec),
        M5: Math.round(m5FreshnessSec),
      },
      data_fresh: dataFresh,
      gap_detected: { H1: false, M30: false, M5: false },
      indicators_available: {
        ema20: !!(indH1?.ema20),
        ema50: !!(indH1?.ema50),
        ema200: !!(indH1?.ema200),
        atr: !!(indH1?.atr),
        adx: !!(indH1?.adx),
      },
      market_open: true,
      market_status: "OPEN",
      spread_available: false,
      spread_source: "NOT_AVAILABLE",
      paper_mode_note: "NOT_BROKER_VERIFIED",
      news_available: false,
      news_empty: true,
      visual_context_enabled: flags.AI_VISUAL_CONTEXT_REQUIRED,
      skip_before_ai: null,
    };

    // Determine skip reason
    let skipReason: QualityV3["skip_before_ai"] = null;
    if (!quality.candles_closed.H1 || !quality.candles_closed.M30 || !quality.candles_closed.M5) {
      skipReason = { skip_reason: "NO_CLOSED_CANDLES", detail: "One or more timeframes have no closed candles." };
    } else if (!dataFresh) {
      skipReason = {
        skip_reason: "DATA_TOO_STALE",
        detail: `H1: ${Math.round(h1FreshnessSec)}s, M30: ${Math.round(m30FreshnessSec)}s, M5: ${Math.round(m5FreshnessSec)}s since last close.`,
      };
    } else if (!indicatorsOk) {
      skipReason = { skip_reason: "INDICATORS_UNAVAILABLE", detail: "EMA/ATR indicators not available for H1." };
    }

    quality.skip_before_ai = skipReason;

    // ── Previous context
    const previousContext: PreviousContextV3 = scenarioMemoryStore.buildPreviousContext(
      input.canonical_symbol,
      nowUtc,
    );

    // ── Delta context
    const prevLatest = scenarioMemoryStore.getLatest(input.canonical_symbol);
    const delta = this.buildDelta(
      input.trigger_reason,
      h1Closed,
      m30Closed,
      m5Closed,
      indM5?.atr ?? 0,
      prevLatest?.adaptive_state?.watch_conditions ?? [],
      midPrice,
    );

    // ── H1 timeframe
    const h1Highs = h1Closed.map(c => c.high);
    const h1Lows = h1Closed.map(c => c.low);
    const h1StructHigh = h1Highs.slice(-5);
    const h1StructLow = h1Lows.slice(-5);
    const h1SupportZones = h1Lows.slice(-3);
    const h1ResistanceZones = h1Highs.slice(-3);
    const nearestH1 = buildPricePosition(midPrice, h1SupportZones, h1ResistanceZones, pipValue);

    const market_h1: MarketTimeframeH1 = {
      ema20: indH1?.ema20 ?? 0,
      ema50: indH1?.ema50 ?? 0,
      ema200: indH1?.ema200 ?? 0,
      atr: indH1?.atr ?? 0,
      adx: indH1?.adx ?? 0,
      volatility_percentile: 50,
      ema_order: buildEmaOrder(indH1?.ema20 ?? 0, indH1?.ema50 ?? 0, indH1?.ema200 ?? 0, midPrice),
      last_5_highs: h1StructHigh,
      last_5_lows: h1StructLow,
      consecutive_higher_highs: countConsecutiveHH(h1Highs),
      consecutive_lower_lows: countConsecutiveLL(h1Lows),
      closed_candles: h1Closed,
      open_candle: h1Open,
      structural_highs: h1StructHigh,
      structural_lows: h1StructLow,
      support_zones: h1SupportZones,
      resistance_zones: h1ResistanceZones,
      atr_vs_resistance_pips: nearestH1.nearestResistancePips,
      atr_vs_support_pips: nearestH1.nearestSupportPips,
      anomalies: [],
    };

    // ── M30 timeframe
    const m30Highs = m30Closed.map(c => c.high);
    const m30Lows = m30Closed.map(c => c.low);
    const m30SupportZones = m30Lows.slice(-3);
    const m30ResistanceZones = m30Highs.slice(-3);
    const nearestM30 = buildPricePosition(midPrice, m30SupportZones, m30ResistanceZones, pipValue);

    const market_m30: MarketTimeframeM30 = {
      ema20: indM30?.ema20 ?? 0,
      ema50: indM30?.ema50 ?? 0,
      ema200: indM30?.ema200 ?? 0,
      atr: indM30?.atr ?? 0,
      adx: indM30?.adx ?? 0,
      ema_order: {
        ema20_above_ema50: (indM30?.ema20 ?? 0) > (indM30?.ema50 ?? 0),
        ema50_above_ema200: (indM30?.ema50 ?? 0) > (indM30?.ema200 ?? 0),
        price_above_ema20: midPrice > (indM30?.ema20 ?? 0),
      },
      closed_candles: m30Closed,
      open_candle: m30Open,
      structural_highs: m30Highs.slice(-5),
      structural_lows: m30Lows.slice(-5),
      support_zones: m30SupportZones,
      resistance_zones: m30ResistanceZones,
      consecutive_compressed_candles: countConsecutiveCompressed(m30Closed, indM30?.atr ?? 1),
      last_impulse_candles: 0,
      retrace_from_impulse: { impulse_start: null, impulse_end: null, current_retrace_pct: null, candles_in_retrace: 0 },
      distance_to_nearest_support_pips: nearestM30.nearestSupportPips,
      distance_to_nearest_resistance_pips: nearestM30.nearestResistancePips,
    };

    // ── M5 timeframe
    const lastM5c = m5Closed.at(-1);
    const m5Highs = m5Closed.map(c => c.high);
    const m5Lows = m5Closed.map(c => c.low);
    const m5SupportZones = m5Lows.slice(-3);
    const m5ResistanceZones = m5Highs.slice(-3);

    const market_m5: MarketTimeframeM5 = {
      ema20: indM5?.ema20 ?? 0,
      ema50: indM5?.ema50 ?? 0,
      ema200: indM5?.ema200 ?? 0,
      atr: indM5?.atr ?? 0,
      adx: indM5?.adx ?? 0,
      ema_order: {
        ema20_above_ema50: (indM5?.ema20 ?? 0) > (indM5?.ema50 ?? 0),
        price_above_ema20: midPrice > (indM5?.ema20 ?? 0),
      },
      closed_candles: m5Closed,
      open_candle: m5Open,
      structural_highs: m5Highs.slice(-5),
      structural_lows: m5Lows.slice(-5),
      support_zones: m5SupportZones,
      resistance_zones: m5ResistanceZones,
      last_closed_candle: lastM5c
        ? {
            open: lastM5c.open,
            high: lastM5c.high,
            low: lastM5c.low,
            close: lastM5c.close,
            body_pips: Math.abs(lastM5c.close - lastM5c.open) / pipValue,
            upper_wick_pips: (lastM5c.high - Math.max(lastM5c.open, lastM5c.close)) / pipValue,
            lower_wick_pips: (Math.min(lastM5c.open, lastM5c.close) - lastM5c.low) / pipValue,
            direction: getLastCandleDirection(lastM5c),
          }
        : null,
      current_bid: null,
      current_ask: null,
      mid_price: midPrice,
      spread_pips: null,
      spread_vs_atr_pct: null,
      price_vs_m30_support_pips: nearestM30.nearestSupportPips,
      price_vs_m30_resistance_pips: nearestM30.nearestResistancePips,
      price_vs_h1_support_pips: nearestH1.nearestSupportPips,
      price_vs_h1_resistance_pips: nearestH1.nearestResistancePips,
    };

    // ── Multi-timeframe
    const emaAlignScore = (ema: { ema20_above_ema50: boolean; ema50_above_ema200: boolean; price_above_ema200: boolean }) =>
      (ema.ema20_above_ema50 ? 1 : 0) + (ema.ema50_above_ema200 ? 1 : 0) + (ema.price_above_ema200 ? 1 : 0);

    const multi_timeframe: MultiTimeframeContext = {
      ema_alignment_score: {
        h1: emaAlignScore(market_h1.ema_order),
        m30: emaAlignScore({ ema20_above_ema50: market_m30.ema_order.ema20_above_ema50, ema50_above_ema200: market_m30.ema_order.ema50_above_ema200, price_above_ema200: midPrice > (indM30?.ema200 ?? 0) }),
        m5: (market_m5.ema_order.ema20_above_ema50 ? 1 : 0) + (midPrice > (indM5?.ema200 ?? 0) ? 1 : 0),
      },
      adx_values: { h1: market_h1.adx, m30: market_m30.adx, m5: market_m5.adx },
      price_vs_ema200: {
        h1: market_h1.ema_order.price_above_ema200 ? "ABOVE" : "BELOW",
        m30: midPrice > (indM30?.ema200 ?? 0) ? "ABOVE" : "BELOW",
        m5: midPrice > (indM5?.ema200 ?? 0) ? "ABOVE" : "BELOW",
      },
      structure_direction: {
        h1: detectStructureDirection(h1Highs, h1Lows),
        m30: detectStructureDirection(m30Highs, m30Lows),
        m5: detectStructureDirection(m5Highs, m5Lows),
      },
      conflicts_detected: [],
    };

    // ── Sessions
    const sessionCtx = this.sessionService.build({
      nowUtc,
      sessionTimezone: "UTC",
      scheduleSource: "carvipix_internal",
    });

    const sessionName = instrument.is_crypto ? "CRYPTO_24H" : sessionCtx.primary_session;
    const sessionOverlap = sessionCtx.session_overlap === "LONDON_NEW_YORK";

    const volatility_and_session: VolatilityAndSession = {
      atr_h1_pips: (indH1?.atr ?? 0) / pipValue,
      atr_m30_pips: (indM30?.atr ?? 0) / pipValue,
      atr_m5_pips: (indM5?.atr ?? 0) / pipValue,
      atr_h1_percentile: 50,
      session_current: String(sessionName),
      session_overlap: sessionOverlap,
      minutes_to_session_end: sessionCtx.minutes_to_session_close,
      is_transition_period: sessionCtx.minutes_to_session_close < 15,
      time_to_next_high_impact_event: null,
      spread_pips: null,
      spread_pct_of_atr_m5: null,
      minutes_to_daily_maintenance: sessionCtx.minutes_to_daily_maintenance,
      minutes_to_weekly_close: sessionCtx.minutes_to_weekly_close,
      paper_spread_note: "NOT_BROKER_VERIFIED",
    };

    // ── News — newsBundle is CadpNewsBundle (from original types) or null
    const newsBundle = await this.newsProvider.build({
      symbol: asset,
      snapshotUtc: new Date(nowUtc).toISOString(),
    }).catch(() => null);

    // Map CadpNewsBundle events to NewsEventV3 format
    const rawEvents = newsBundle?.events ?? [];

    quality.news_available = rawEvents.length > 0;
    quality.news_empty = rawEvents.length === 0;

    const operationWindowMinutes = 120;
    const newsInWindow = rawEvents.filter(
      (e) => e.minutes_to_event >= 0 && e.minutes_to_event <= operationWindowMinutes
    );

    // Map NEWS_UNCONFIRMED to STALE for V3 schema compatibility
    const rawNewsStatus = newsBundle ? newsBundle.news_status : "UNAVAILABLE";
    const newsStatus: NewsAndRisk["news_status"] = rawNewsStatus === "NEWS_UNCONFIRMED" ? "STALE" : rawNewsStatus;

    const news_and_risk: NewsAndRisk = {
      news_status: newsStatus,
      last_refresh_iso: new Date(nowUtc).toISOString(),
      source: "FINNHUB",
      events: rawEvents.map((e) => ({
        event_id: e.event_id,
        event_name: e.event_name,
        scheduled_iso: e.scheduled_utc,
        minutes_to_event: e.minutes_to_event,
        impact: e.impact,
        currencies_affected: e.currencies,
        relevance_to_canonical_symbol: e.relevance_to_symbol,
        confirmed: e.confirmed,
      })),
      events_within_operation_window: newsInWindow.map((e) => ({
        event_id: e.event_id,
        event_name: e.event_name,
        minutes_to: e.minutes_to_event,
        impact: e.impact,
      })),
      no_events_note: rawEvents.length === 0
        ? `No events found for next 4h from Finnhub (polled at ${new Date(nowUtc).toISOString()}).`
        : null,
    };

    // Time to next high impact event
    const highImpactEvents = rawEvents.filter(
      (e) => (e.impact === "HIGH" || e.impact === "MEDIUM") && e.minutes_to_event > 0
    );
    if (highImpactEvents.length > 0) {
      volatility_and_session.time_to_next_high_impact_event = Math.min(
        ...highImpactEvents.map((e) => e.minutes_to_event)
      );
    }

    // ── Historical context
    const history = scenarioMemoryStore.getHistory(input.canonical_symbol, 50);
    const sameContext = history.filter(
      h => h.canonical_symbol === input.canonical_symbol &&
        h.strategy_version === "1.0.0" &&
        h.prompt_version === CADP_PROMPT_VERSION
    );

    const historical_context: HistoricalContext = {
      statistical_reference_only: true,
      eligible: sameContext.length >= 10,
      eligibility_conditions: {
        same_canonical_symbol: true,
        same_strategy_version: true,
        same_prompt_version: true,
        sample_size: sameContext.length,
        minimum_sample_met: sameContext.length >= 10,
      },
      data: null,
    };

    // ── Visual context
    const visual_context: VisualContextV3 = {
      enabled: flags.AI_VISUAL_CONTEXT_REQUIRED,
      images: flags.AI_VISUAL_CONTEXT_REQUIRED
        ? [
            { timeframe: "H1", filename: `${input.analysis_id}-H1.svg`, sha256: "", included_in_payload: true },
            { timeframe: "M30", filename: `${input.analysis_id}-M30.svg`, sha256: "", included_in_payload: true },
            { timeframe: "M5", filename: `${input.analysis_id}-M5.svg`, sha256: "", included_in_payload: true },
          ]
        : [],
    };

    // ── Authorized strategies
    const authorized_strategies = getAuthorizedStrategies(input.canonical_symbol);

    // ── Pre-analysis trigger
    const pre_analysis_trigger: PreAnalysisTrigger = {
      trigger_reason: input.trigger_reason,
      change_detected: delta.new_closed_candle.H1 || delta.new_closed_candle.M30 || delta.new_closed_candle.M5
        || delta.break_detected.detected || delta.new_news_event.detected || delta.previous_condition_met.met,
      change_description: this.buildChangeDescription(delta, input.trigger_reason),
      previous_condition_met: {
        met: delta.previous_condition_met.met,
        original_condition_text: previousContext.previous_vigilance?.condition_described ?? null,
        evidence: delta.previous_condition_met.evidence,
      },
    };

    // ── Identity
    const numericContextStr = JSON.stringify({ h1: h1Closed.length, m30: m30Closed.length, m5: m5Closed.length, price: midPrice });
    const snapshot_hash = createHash("sha256").update(numericContextStr).digest("hex");

    const identity: IdentityV3 = {
      analysis_id: input.analysis_id,
      signal_id: input.signal_id,
      canonical_symbol: input.canonical_symbol,
      provider_symbol: instrument.provider_symbol,
      broker_symbol: null,
      timestamp_utc_ms: nowUtc,
      timestamp_iso: new Date(nowUtc).toISOString(),
      session_primary: instrument.is_crypto ? "CRYPTO_24H" : (sessionCtx.primary_session as IdentityV3["session_primary"]),
      version_expediente: "MAESTRO_V3",
      version_prompt: CADP_PROMPT_VERSION,
      version_strategy: "1.0.0",
      model_openai: process.env["OPENAI_MODEL"] ?? "unknown",
      version_engine: AI_ENGINE_VERSION,
      version_cadp: CADP_VERSION,
      data_sources: {
        candles: "TWELVE_DATA",
        indicators: "CARVIPIX_INTERNAL",
        news: "FINNHUB",
        sessions: "CARVIPIX_INTERNAL",
      },
      snapshot_hash,
    };

    // ── Idempotency key
    const idempotency_key = idempotencyStore.buildKey({
      canonical_symbol: input.canonical_symbol,
      last_closed_h1_timestamp: lastH1Ts,
      last_closed_m30_timestamp: lastM30Ts,
      last_closed_m5_timestamp: lastM5Ts,
      strategy_version: "1.0.0",
      prompt_version: CADP_PROMPT_VERSION,
      relevant_event_data: {
        news_event_ids: rawEvents.map((e) => e.event_id).filter(Boolean),
        level_reached: delta.zone_reached.detected ? delta.zone_reached.zone_level : null,
        atr_spike: delta.atr_change.change_pct !== null && Math.abs(delta.atr_change.change_pct) >= 25,
        trade_closed_id: delta.paper_trade_closed.occurred ? delta.paper_trade_closed.paper_trade_id : null,
      },
    });

    // Check idempotency
    if (idempotencyStore.exists(idempotency_key.full_key)) {
      quality.skip_before_ai = { skip_reason: "IDEMPOTENT_REUSE", detail: `Key: ${idempotency_key.full_key}` };
    }

    const expediente: Omit<ExpedienteMaestroV3, "narrative_context" | "executive_summary"> = {
      identity,
      quality,
      pre_analysis_trigger,
      previous_context: previousContext,
      delta,
      market_h1,
      market_m30,
      market_m5,
      multi_timeframe,
      volatility_and_session,
      news_and_risk,
      historical_context,
      visual_context,
      authorized_strategies,
    };

    return { expediente, idempotency_key, asset };
  }

  private buildDelta(
    triggerReason: PreAnalysisTriggerReason,
    h1Closed: Candle[],
    m30Closed: Candle[],
    m5Closed: Candle[],
    currentAtr: number,
    watchConditions: Array<{ level: number | null }>,
    midPrice: number,
  ): DeltaContextV3 {
    const prevLatest = scenarioMemoryStore.getLatest("XAUUSD" as CanonicalSymbol); // placeholder — actual latest from store

    const conditionMet = watchConditions.some(wc => wc.level !== null && Math.abs(midPrice - wc.level) / Math.max(currentAtr, 0.001) < 0.1);

    return {
      new_closed_candle: {
        H1: triggerReason === "NEW_H1_CANDLE_CLOSED",
        M30: triggerReason === "NEW_M30_CANDLE_CLOSED",
        M5: triggerReason === "NEW_M5_CANDLE_CLOSED",
      },
      new_high_detected: { detected: false, timeframe: null, level: null },
      new_low_detected: { detected: false, timeframe: null, level: null },
      break_detected: { detected: false, direction: null, broken_level: null, timeframe: null, candle_that_broke_timestamp: null },
      zone_reached: { detected: false, zone_type: null, zone_level: null, proximity_pips: null, timeframe: null },
      atr_change: { previous: prevLatest ? (prevLatest.adaptive_state as unknown as { atr?: number }).atr ?? null : null, current: currentAtr, change_pct: null },
      session_changed: triggerReason === "SCHEDULED_RECHECK" ? false : false,
      session_previous: null,
      session_current: "UNKNOWN",
      new_news_event: {
        detected: triggerReason === "NEW_HIGH_IMPACT_NEWS_DETECTED",
        event_name: null,
        impact: null,
        minutes_to: null,
      },
      previous_condition_met: {
        met: conditionMet || triggerReason === "WATCH_CONDITION_MET",
        original_condition: null,
        evidence: conditionMet ? `Price ${midPrice.toFixed(2)} reached watched level.` : null,
      },
      paper_trade_closed: {
        occurred: triggerReason === "PAPER_TRADE_CLOSED",
        result: null,
        paper_trade_id: null,
      },
    };
  }

  private buildChangeDescription(delta: DeltaContextV3, reason: PreAnalysisTriggerReason): string {
    const parts: string[] = [];
    if (delta.new_closed_candle.H1) parts.push("New H1 candle closed.");
    if (delta.new_closed_candle.M30) parts.push("New M30 candle closed.");
    if (delta.new_closed_candle.M5) parts.push("New M5 candle closed.");
    if (delta.break_detected.detected) parts.push(`Break detected ${delta.break_detected.direction} at ${delta.break_detected.broken_level?.toFixed(2)}.`);
    if (delta.new_news_event.detected) parts.push(`New news: ${delta.new_news_event.event_name} (${delta.new_news_event.impact}).`);
    if (delta.previous_condition_met.met) parts.push(`Watch condition met. ${delta.previous_condition_met.evidence ?? ""}`);
    if (parts.length === 0) parts.push(`Scheduled recheck. Trigger: ${reason}.`);
    return parts.join(" ");
  }
}
