/**
 * EXPEDIENTE MAESTRO V3 — Tipos Oficiales
 * Congelado: 2026-07-14
 * Filosofía: El expediente solo contiene hechos. ChatGPT razona. El disparador distribuye.
 */

import type { Candle } from "../../engine/types/marketData";

// ─── Enumeraciones base ───────────────────────────────────────────────────────

export type CanonicalSymbol =
  | "XAUUSD"
  | "BTCUSD"
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "AUDUSD"
  | "USDCHF";

export type CadpDecisionV3 =
  | "ENTER_BUY"
  | "ENTER_SELL"
  | "WAIT"
  | "CONDITIONAL_ENTRY"
  | "NO_TRADE"
  | "ENTRY_MISSED"
  | "DATA_INSUFFICIENT"
  | "NEWS_VERIFICATION_REQUIRED";

export type ProximityToEntry =
  | "IMMEDIATE"    // recheck: 5 min
  | "NEAR"         // recheck: 10 min
  | "DEVELOPING"   // recheck: 15 min
  | "FAR"          // recheck: 30 min
  | "INVALID";     // recheck: 60 min

export type ScenarioClassification =
  | "NEW"
  | "DEVELOPING"
  | "NEAR_ENTRY"
  | "READY"
  | "ACTIVE"
  | "INVALIDATED"
  | "EXPIRED"
  | "NO_SETUP";

export type MarketVisualState =
  | "MUY_FAVORABLE"
  | "FAVORABLE"
  | "NEUTRAL"
  | "COMPLICADO"
  | "ALTO_RIESGO"
  | "SIN_MERCADO";

export type PreAnalysisTriggerReason =
  | "NEW_H1_CANDLE_CLOSED"
  | "NEW_M30_CANDLE_CLOSED"
  | "NEW_M5_CANDLE_CLOSED"
  | "PRICE_REACHED_WATCHED_LEVEL"
  | "NEW_HIGH_IMPACT_NEWS_DETECTED"
  | "ATR_SIGNIFICANT_CHANGE"
  | "PAPER_TRADE_CLOSED"
  | "WATCH_CONDITION_MET"
  | "SCHEDULED_RECHECK"
  | "SCENARIO_POTENTIALLY_INVALIDATED";

export type SkipReason =
  | "NO_CLOSED_CANDLES"
  | "DATA_TOO_STALE"
  | "CRITICAL_GAP"
  | "MARKET_CLOSED"
  | "INDICATORS_UNAVAILABLE"
  | "IDEMPOTENT_REUSE";

export type PaperTradeResult = "WIN" | "LOSS" | "EXPIRED" | "CANCELLED" | "OPEN";

// ─── Sección 1: Identidad ─────────────────────────────────────────────────────

export interface IdentityV3 {
  analysis_id: string;
  signal_id: string;
  canonical_symbol: CanonicalSymbol;
  provider_symbol: string;
  broker_symbol: null;
  timestamp_utc_ms: number;
  timestamp_iso: string;
  session_primary: "ASIA" | "LONDON" | "NEW_YORK" | "OVERLAP_LDN_NY" | "CLOSED" | "CRYPTO_24H";
  version_expediente: "MAESTRO_V3";
  version_prompt: string;
  version_strategy: string;
  model_openai: string;
  version_engine: string;
  version_cadp: "maestro-v3";
  data_sources: {
    candles: "TWELVE_DATA";
    indicators: "CARVIPIX_INTERNAL";
    news: "FINNHUB";
    sessions: "CARVIPIX_INTERNAL";
  };
  snapshot_hash: string;
}

// ─── Sección 2: Calidad ───────────────────────────────────────────────────────

export interface QualityV3 {
  data_complete: boolean;
  candles_closed: { H1: boolean; M30: boolean; M5: boolean };
  candle_freshness_seconds: { H1: number; M30: number; M5: number };
  data_fresh: boolean;
  gap_detected: { H1: boolean; M30: boolean; M5: boolean };
  indicators_available: {
    ema20: boolean;
    ema50: boolean;
    ema200: boolean;
    atr: boolean;
    adx: boolean;
  };
  market_open: boolean;
  market_status: "OPEN" | "CLOSING_SOON" | "CLOSED";
  spread_available: boolean;
  spread_source: "BROKER_REALTIME" | "NOT_AVAILABLE";
  paper_mode_note: "NOT_BROKER_VERIFIED" | "BROKER_VERIFIED";
  news_available: boolean;
  news_empty: boolean;
  visual_context_enabled: boolean;
  skip_before_ai: null | { skip_reason: SkipReason; detail: string };
}

// ─── Sección 3: Pre-análisis (neutral, sin predisposición) ───────────────────

export interface PreAnalysisTrigger {
  trigger_reason: PreAnalysisTriggerReason;
  change_detected: boolean;
  change_description: string;
  previous_condition_met: {
    met: boolean;
    original_condition_text: string | null;
    evidence: string | null;
  };
}

// ─── Sección 4: Contexto anterior ────────────────────────────────────────────

export interface ScenarioLifetime {
  scenario_active_since_iso: string | null;
  lifetime_minutes: number | null;
  lifetime_label: string;
  is_extended: boolean;
}

export interface PreviousContextV3 {
  exists: boolean;
  previous_analysis_id: string | null;
  previous_timestamp_iso: string | null;
  minutes_since_previous: number | null;
  previous_decision: CadpDecisionV3 | null;
  previous_scenario_state: ScenarioClassification | null;
  previous_order_plan: {
    entry: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    rr: number | null;
  } | null;
  previous_vigilance: {
    level_watch_break_above: number | null;
    level_watch_break_below: number | null;
    event_trigger: string | null;
    expected_recheck_minutes: number | null;
    condition_described: string | null;
  } | null;
  condition_met_since_previous: { met: boolean; description: string | null };
  last_paper_trade: {
    paper_trade_id: string;
    direction: "BUY" | "SELL";
    entry_price: number;
    exit_price: number | null;
    result: PaperTradeResult | null;
    pnl_pips: number | null;
    rr_achieved: number | null;
  } | null;
  scenario_lifetime: ScenarioLifetime;
}

// ─── Sección 5: Delta (cambios objetivos) ────────────────────────────────────

export interface DeltaContextV3 {
  new_closed_candle: { H1: boolean; M30: boolean; M5: boolean };
  new_high_detected: { detected: boolean; timeframe: "H1" | "M30" | "M5" | null; level: number | null };
  new_low_detected: { detected: boolean; timeframe: "H1" | "M30" | "M5" | null; level: number | null };
  break_detected: {
    detected: boolean;
    direction: "ABOVE" | "BELOW" | null;
    broken_level: number | null;
    timeframe: "H1" | "M30" | "M5" | null;
    candle_that_broke_timestamp: number | null;
  };
  zone_reached: {
    detected: boolean;
    zone_type: "SUPPORT" | "RESISTANCE" | null;
    zone_level: number | null;
    proximity_pips: number | null;
    timeframe: "H1" | "M30" | "M5" | null;
  };
  atr_change: { previous: number | null; current: number | null; change_pct: number | null };
  session_changed: boolean;
  session_previous: string | null;
  session_current: string;
  new_news_event: {
    detected: boolean;
    event_name: string | null;
    impact: "LOW" | "MEDIUM" | "HIGH" | null;
    minutes_to: number | null;
  };
  previous_condition_met: {
    met: boolean;
    original_condition: string | null;
    evidence: string | null;
  };
  paper_trade_closed: {
    occurred: boolean;
    result: "TP_HIT" | "SL_HIT" | "EXPIRED" | "CANCELLED" | null;
    paper_trade_id: string | null;
  };
}

// ─── Sección 6-8: Datos de temporalidades ────────────────────────────────────

export interface EmaOrderFacts {
  ema20_above_ema50: boolean;
  ema50_above_ema200: boolean;
  price_above_ema200: boolean;
  price_above_ema50: boolean;
  price_above_ema20: boolean;
}

export interface MarketTimeframeH1 {
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
  volatility_percentile: number;
  ema_order: EmaOrderFacts;
  last_5_highs: number[];
  last_5_lows: number[];
  consecutive_higher_highs: number;
  consecutive_lower_lows: number;
  closed_candles: Candle[];
  open_candle: Candle | null;
  structural_highs: number[];
  structural_lows: number[];
  support_zones: number[];
  resistance_zones: number[];
  atr_vs_resistance_pips: number;
  atr_vs_support_pips: number;
  anomalies: string[];
}

export interface MarketTimeframeM30 {
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
  ema_order: { ema20_above_ema50: boolean; ema50_above_ema200: boolean; price_above_ema20: boolean };
  closed_candles: Candle[];
  open_candle: Candle | null;
  structural_highs: number[];
  structural_lows: number[];
  support_zones: number[];
  resistance_zones: number[];
  consecutive_compressed_candles: number;
  last_impulse_candles: number;
  retrace_from_impulse: {
    impulse_start: number | null;
    impulse_end: number | null;
    current_retrace_pct: number | null;
    candles_in_retrace: number;
  };
  distance_to_nearest_support_pips: number;
  distance_to_nearest_resistance_pips: number;
}

export interface MarketTimeframeM5 {
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
  ema_order: { ema20_above_ema50: boolean; price_above_ema20: boolean };
  closed_candles: Candle[];
  open_candle: Candle | null;
  structural_highs: number[];
  structural_lows: number[];
  support_zones: number[];
  resistance_zones: number[];
  last_closed_candle: {
    open: number;
    high: number;
    low: number;
    close: number;
    body_pips: number;
    upper_wick_pips: number;
    lower_wick_pips: number;
    direction: "BULLISH" | "BEARISH" | "DOJI";
  } | null;
  current_bid: number | null;
  current_ask: number | null;
  mid_price: number;
  spread_pips: number | null;
  spread_vs_atr_pct: number | null;
  price_vs_m30_support_pips: number;
  price_vs_m30_resistance_pips: number;
  price_vs_h1_support_pips: number;
  price_vs_h1_resistance_pips: number;
}

// ─── Sección 9: Coherencia multi-temporalidad ─────────────────────────────────

export interface MultiTimeframeContext {
  ema_alignment_score: { h1: number; m30: number; m5: number };
  adx_values: { h1: number; m30: number; m5: number };
  price_vs_ema200: { h1: "ABOVE" | "BELOW"; m30: "ABOVE" | "BELOW"; m5: "ABOVE" | "BELOW" };
  structure_direction: {
    h1: "BULLISH" | "BEARISH" | "MIXED";
    m30: "BULLISH" | "BEARISH" | "MIXED";
    m5: "BULLISH" | "BEARISH" | "MIXED";
  };
  conflicts_detected: string[];
}

// ─── Sección 10: Volatilidad y sesión ────────────────────────────────────────

export interface VolatilityAndSession {
  atr_h1_pips: number;
  atr_m30_pips: number;
  atr_m5_pips: number;
  atr_h1_percentile: number;
  session_current: string;
  session_overlap: boolean;
  minutes_to_session_end: number;
  is_transition_period: boolean;
  time_to_next_high_impact_event: number | null;
  spread_pips: number | null;
  spread_pct_of_atr_m5: number | null;
  minutes_to_daily_maintenance: number;
  minutes_to_weekly_close: number;
  paper_spread_note: "NOT_BROKER_VERIFIED" | "BROKER_VERIFIED";
}

// ─── Sección 11: Noticias ─────────────────────────────────────────────────────

export interface NewsEventV3 {
  event_id: string;
  event_name: string;
  scheduled_iso: string;
  minutes_to_event: number;
  impact: "LOW" | "MEDIUM" | "HIGH";
  currencies_affected: string[];
  relevance_to_canonical_symbol: "LOW" | "MEDIUM" | "HIGH";
  confirmed: boolean;
}

export interface NewsAndRisk {
  news_status: "CURRENT" | "STALE" | "UNAVAILABLE";
  last_refresh_iso: string;
  source: "FINNHUB";
  events: NewsEventV3[];
  events_within_operation_window: Array<{
    event_id: string;
    event_name: string;
    minutes_to: number;
    impact: "LOW" | "MEDIUM" | "HIGH";
  }>;
  no_events_note: string | null;
}

// ─── Sección 12: Contexto histórico ──────────────────────────────────────────

export interface HistoricalContext {
  statistical_reference_only: true;
  eligible: boolean;
  eligibility_conditions: {
    same_canonical_symbol: boolean;
    same_strategy_version: boolean;
    same_prompt_version: boolean;
    sample_size: number;
    minimum_sample_met: boolean;
  };
  data: {
    win_count: number;
    loss_count: number;
    expired_count: number;
    win_rate: number;
    avg_rr_achieved: number | null;
    reference_period_days: number;
    note: "STATISTICAL_REFERENCE_ONLY_DO_NOT_BIAS_DECISION";
  } | null;
}

// ─── Sección 13: Contexto visual ─────────────────────────────────────────────

export interface VisualContextV3 {
  enabled: boolean;
  images: Array<{
    timeframe: "H1" | "M30" | "M5";
    filename: string;
    sha256: string;
    included_in_payload: boolean;
  }>;
}

// ─── Sección 14: Estrategias autorizadas ─────────────────────────────────────

export interface AuthorizedStrategyV3 {
  strategy_id: string;
  strategy_version: string;
  status: "SHADOW" | "ACTIVE" | "PENDING";
  short_description: string;
  critical_requirements: string[];
  canonical_symbol: CanonicalSymbol;
}

// ─── Sección 15: Contexto narrativo objetivo ─────────────────────────────────

export interface NarrativeContext {
  price_situation: string;
  h1_facts: string;
  m30_facts: string;
  m5_facts: string;
  session_and_volatility_facts: string;
  news_facts: string;
  delta_facts: string;
  previous_expectation: string | null;
}

// ─── Sección 16: Resumen ejecutivo ───────────────────────────────────────────

export interface ExecutiveSummary {
  one_line: string;
  data_inventory: {
    h1_candles_closed: number;
    m30_candles_closed: number;
    m5_candles_closed: number;
    indicators_available: boolean;
    news_events_count: number;
    previous_analysis_exists: boolean;
    visual_context_included: boolean;
    historical_sample_size: number;
  };
  attention_items: string[];
  missing_items: string[];
}

// ─── Expediente completo ──────────────────────────────────────────────────────

export interface ExpedienteMaestroV3 {
  identity: IdentityV3;
  quality: QualityV3;
  pre_analysis_trigger: PreAnalysisTrigger;
  previous_context: PreviousContextV3;
  delta: DeltaContextV3;
  market_h1: MarketTimeframeH1;
  market_m30: MarketTimeframeM30;
  market_m5: MarketTimeframeM5;
  multi_timeframe: MultiTimeframeContext;
  volatility_and_session: VolatilityAndSession;
  news_and_risk: NewsAndRisk;
  historical_context: HistoricalContext;
  visual_context: VisualContextV3;
  authorized_strategies: AuthorizedStrategyV3[];
  narrative_context: NarrativeContext;
  executive_summary: ExecutiveSummary;
}

// ─── Respuesta Maestra (6 bloques) ───────────────────────────────────────────

export interface MasterDecision {
  decision: CadpDecisionV3;
  direction: "BUY" | "SELL" | "NEUTRAL" | null;
  strategy_selected: string | null;
  conviction: "LOW" | "MEDIUM" | "HIGH";
  probability_estimated: number | null;
  probability_basis: string | null;
}

export interface AnalysisPrivateV3 {
  analysis_summary: string;
  decisive_evidence: string[];
  opposing_evidence: string[];
  primary_risk: string;
  missing_condition: string | null;
  market_context_observed: string;
  what_must_change: string;
  probability_detail: {
    estimated: number | null;
    basis: string | null;
    confidence_in_estimate: "LOW" | "MEDIUM" | "HIGH" | null;
    disclaimer: "ANALYTICAL_ESTIMATE_NOT_MATHEMATICAL_PROBABILITY";
  };
}

export interface AnalysisPublicV3 {
  market_visual_state: MarketVisualState;
  supporting_facts: string[];
  public_summary: string;
  action_taken: "ENTRY_SIGNALED" | "WATCHING" | "NO_ACTION" | "RISK_BLOCK";
  public_warning: string | null;
}

export interface OrderPlanV3 {
  entry_type: "MARKET" | "LIMIT" | "STOP";
  entry_price: number | null;
  entry_zone_min: number | null;
  entry_zone_max: number | null;
  stop_loss: number | null;
  stop_loss_anchor: string | null;
  take_profit: number | null;
  take_profit_anchor: string | null;
  risk_reward_ratio: number | null;
  validity_minutes: number | null;
  cancellation_condition: string | null;
}

export interface WatchCondition {
  condition: string;
  level: number | null;
  timeframe: "H1" | "M30" | "M5" | null;
}

export interface WakeUpTriggerV3 {
  trigger:
    | "NEW_H1_CLOSE"
    | "NEW_M30_CLOSE"
    | "PRICE_REACHES_LEVEL"
    | "NEW_HIGH_IMPACT_NEWS_DETECTED"
    | "ATR_SPIKE"
    | "PAPER_TRADE_CLOSED";
  level: number | null;
  description: string;
}

export interface AdaptiveStateV3 {
  proximity_to_entry: ProximityToEntry;
  recheck_minutes: 5 | 10 | 15 | 30 | 60;
  watch_conditions: WatchCondition[];
  wake_up_triggers: WakeUpTriggerV3[];
  missing_for_entry: string | null;
  scenario_classification: ScenarioClassification;
}

export interface AnalystObservations {
  summary: string;
  scenario_narrative: string;
  key_observation: string | null;
}

export interface ResponseMetaV3 {
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  snapshot_utc: string;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  tokens_cached: number;
  cost_usd_estimated: number;
  latency_ms: number;
  prompt_version: string;
  cadp_version: "maestro-v3";
  response_schema_version: "maestro_v3_response";
  human_review_required: true;
  auto_execution_eligible: false;
}

export interface RespuestaMaestraV3 {
  master_decision: MasterDecision;
  analysis_private: AnalysisPrivateV3;
  analysis_public: AnalysisPublicV3;
  order_plan: OrderPlanV3 | null;
  adaptive_state: AdaptiveStateV3;
  analyst_observations: AnalystObservations;
  _meta: ResponseMetaV3;
}

// ─── Idempotencia ─────────────────────────────────────────────────────────────

export interface IdempotencyKey {
  canonical_symbol: CanonicalSymbol;
  last_closed_h1_timestamp: number | null;
  last_closed_m30_timestamp: number | null;
  last_closed_m5_timestamp: number | null;
  strategy_version: string;
  prompt_version: string;
  scenario_version: number;
  relevant_event_hash: string;
  full_key: string;
}

// ─── Registro de análisis ─────────────────────────────────────────────────────

export interface AnalysisRecordV3 {
  analysis_id: string;
  signal_id: string;
  canonical_symbol: CanonicalSymbol;
  timestamp_iso: string;
  idempotency_key: string;
  expediente: ExpedienteMaestroV3;
  prompt_sent: string;
  response_raw: RespuestaMaestraV3 | null;
  skip_before_ai: QualityV3["skip_before_ai"];
  status: "COMPLETED" | "SKIPPED_BEFORE_AI" | "REUSED_PREVIOUS_ANALYSIS" | "AI_ERROR";
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

// ─── Paper Trade ──────────────────────────────────────────────────────────────

export interface PaperTrade {
  paper_trade_id: string;
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  opened_at: string;
  closed_at: string | null;
  exit_price: number | null;
  result: PaperTradeResult;
  pnl_pips: number | null;
  pnl_usd: number | null;
  rr_achieved: number | null;
  close_reason: "TP_HIT" | "SL_HIT" | "EXPIRED" | "CANCELLED" | null;
  paper_spread_note: "NOT_BROKER_VERIFIED";
}

// ─── Monitor Paper ────────────────────────────────────────────────────────────

export interface PaperAccountState {
  initial_balance_usd: 10000;
  current_balance_usd: number;
  equity_usd: number;
  floating_pnl_usd: number;
  daily_pnl_usd: number;
  total_pnl_usd: number;
  open_trades: PaperTrade[];
  closed_trades: PaperTrade[];
  win_count: number;
  loss_count: number;
  expired_count: number;
  win_rate: number | null;
  avg_rr_achieved: number | null;
  max_drawdown_usd: number;
  drawdown_pct: number;
  openai_cost_total_usd: number;
  last_updated: string;
}

// ─── Payload de módulos (construidos por el Disparador) ───────────────────────

export interface PayloadBotEngine {
  signal_id: string;
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  direction: "BUY" | "SELL" | "NONE";
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  rr: number | null;
  validity_minutes: number | null;
  strategy: string | null;
  status: "NON_EXECUTABLE" | "SHADOW" | "TEST_ONLY";
  auto_executable: false;
  requires_human_review: true;
}

export interface PayloadAlertaPremium {
  canonical_symbol: CanonicalSymbol;
  action: "BUY" | "SELL" | "WAIT" | "NO_TRADE";
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  rr: number | null;
  probability: number | null;
  market_condition: string;
  primary_warning: string | null;
}

export interface PayloadTelegram {
  public_summary: string;
  market_status: MarketVisualState;
  action_taken: string;
  public_warning: string | null;
}

export interface PayloadDashboard {
  canonical_symbol: CanonicalSymbol;
  market_visual_state: MarketVisualState;
  decision: CadpDecisionV3;
  probability: number | null;
  conviction: string;
  scenario_classification: ScenarioClassification;
  proximity: ProximityToEntry;
  recheck_minutes: number;
  next_review_iso: string;
  scenario_lifetime_label: string;
}

export interface PayloadObservador {
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  timestamp_iso: string;
  master_decision: MasterDecision;
  analysis_private: AnalysisPrivateV3;
  analysis_public: AnalysisPublicV3;
  order_plan: OrderPlanV3 | null;
  adaptive_state: AdaptiveStateV3;
  analyst_observations: AnalystObservations;
  decision_evolution: DecisionEvolution;
  scenario_lifetime: ScenarioLifetime;
  meta: ResponseMetaV3;
}

export interface DecisionEvolution {
  canonical_symbol: CanonicalSymbol;
  period_hours: number;
  entries: Array<{
    analysis_id: string;
    timestamp_iso: string;
    decision: CadpDecisionV3;
    scenario_classification: ScenarioClassification;
    probability_estimated: number | null;
    conviction: string | null;
    minutes_since_previous: number | null;
  }>;
  decision_chain: string;
}

export interface PayloadResultados {
  paper_trade_id: string;
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number;
  result: PaperTradeResult;
  pnl_pips: number;
  pnl_usd: number;
  rr_achieved: number | null;
  duration_minutes: number;
  close_reason: string;
  paper_spread_note: "NOT_BROKER_VERIFIED";
}

// ─── Dispatcher output ────────────────────────────────────────────────────────

export interface DispatcherOutput {
  bot_engine: PayloadBotEngine;
  alerta_premium: PayloadAlertaPremium;
  telegram: PayloadTelegram;
  dashboard: PayloadDashboard;
  observador: PayloadObservador;
  paper_account: PaperAccountState;
}
