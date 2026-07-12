import type { Asset, Candle, Timeframe } from "../engine/types/marketData";

export type AIHorizon = "SHORT" | "MEDIUM" | "LONG" | "VERY_LONG";
export type AIRegime = "TREND" | "COMPRESSION" | "RANGE" | "SHOCK" | "TRANSITION" | "DATA_NOT_READY";
export type AIOperationMode = "SHADOW" | "ASSISTED" | "EXPLAIN_ONLY";

export type AIDecision =
  | "ENTER_BUY"
  | "ENTER_SELL"
  | "WAIT"
  | "MISSED"
  | "REJECT_HIGH_RISK"
  | "INVALIDATED"
  | "DATA_NOT_READY";

export type AIClientMessageCode =
  | "BUY_NOW"
  | "SELL_NOW"
  | "WAIT_CONFIRMATION"
  | "DO_NOT_ENTER"
  | "ENTRY_MISSED"
  | "HIGH_RISK"
  | "SETUP_INVALIDATED"
  | "DATA_UNAVAILABLE";

export interface AIAnalysisIdentity {
  analysis_id: string;
  symbol: Asset;
  broker_symbol: string;
  timestamp_utc: string;
  strategy_id: string;
  strategy_version: string;
  context_version: string;
  schema_version: string;
  horizon: AIHorizon;
  expected_duration: string;
  analysis_reason: string;
}

export interface AIDataQualityBlock {
  provider: string;
  connection_status: "connected" | "degraded" | "disconnected" | "blocked";
  latency_ms: number;
  latest_closed_candle_utc: string | null;
  gaps: number;
  duplicates: number;
  out_of_order_timestamps: number;
  incomplete_candles: number;
  sync_status: "SYNCED" | "LAGGING" | "BROKEN";
  data_ready: boolean;
}

export interface AIMarketNowBlock {
  bid: number;
  ask: number;
  spread: number;
  spread_avg: number;
  spread_vs_atr: number;
  session: string;
  market_open: boolean;
  volatility_now: number;
  volatility_percentile: number;
  economic_event_relevant: boolean;
  next_relevant_event_utc: string | null;
}

export interface AITimeframeBlock {
  timeframe: string;
  last_closed_candles: Candle[];
  ema20: number;
  ema50: number;
  ema200: number;
  ema20_slope: number;
  ema50_slope: number;
  ema200_slope: number;
  atr: number;
  adx: number;
  structural_high: number;
  structural_low: number;
  structure_direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  distance_to_zone: number;
  closed_candle_state: "CLOSED_ONLY";
}

export interface AILevelsBlock {
  candidate_direction: "BUY" | "SELL" | "NONE";
  activation_price: number | null;
  entry_zone_min: number | null;
  entry_zone_max: number | null;
  invalidation_price: number | null;
  technical_stop: number | null;
  volatility_buffer: number | null;
  initial_target: number | null;
  risk_reward: number | null;
  signal_expires_at_utc: string | null;
  distance_from_entry: number | null;
  state: "READY" | "WAITING" | "MISSED" | "INVALID";
}

export interface AIRiskSafetyBlock {
  safety_gates: Array<{ name: string; passed: boolean; reason: string }>;
  risk_engine: { approved: boolean; reason: string };
  spread_acceptable: boolean;
  volatility_acceptable: boolean;
  news_blocking: boolean;
  daily_limit_blocking: boolean;
  exposure_blocking: boolean;
  duplicate_signal_blocking: boolean;
  blocking_reason: string | null;
}

export interface AIVisualContextBlock {
  image_url: string | null;
  image_type: "internal_chart" | "none";
  overlays: string[];
}

export interface AIAnalysisRequest {
  identity: AIAnalysisIdentity;
  data_quality: AIDataQualityBlock;
  market_now: AIMarketNowBlock;
  context_tf: AITimeframeBlock;
  setup_tf: AITimeframeBlock;
  confirmation_tf: AITimeframeBlock;
  levels: AILevelsBlock;
  risk_safety: AIRiskSafetyBlock;
  visual_context: AIVisualContextBlock;
  regime: AIRegime;
}

export interface AIAnalysisResponse {
  analysis_id: string;
  strategy_id: string;
  strategy_version: string;
  decision: AIDecision;
  direction: "BUY" | "SELL" | "NONE";
  setup_valid: boolean;
  entry_ready: boolean;
  entry_missed: boolean;
  data_sufficient: boolean;
  levels_match_input: boolean;
  risk_conflict: boolean;
  critical_conflicts: string[];
  reasons: string[];
  warnings: string[];
  confidence: number;
  client_message_code: AIClientMessageCode;
  human_review_required: boolean;
}

export interface AIUsageMetrics {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  retries: number;
  timestampUtc: string;
}

export interface AIAnalysisAuditRecord {
  analysis_id: string;
  strategy_id: string;
  strategy_version: string;
  prompt_version: string;
  mode: AIOperationMode;
  model: string;
  request: AIAnalysisRequest;
  raw_response: unknown;
  validated_response: AIAnalysisResponse | null;
  decision_final: AIDecision | "REJECTED" | "BLOCKED";
  validation_errors: string[];
  usage: AIUsageMetrics | null;
  latency_ms: number;
  external_errors: string[];
  human_approved: boolean | null;
  engine_version: string;
  created_at_utc: string;
}

export interface MarketAnalysisAI {
  analyze(input: AIAnalysisRequest): Promise<{ response: AIAnalysisResponse; usage: AIUsageMetrics; raw: unknown }>;
}

export interface AIQueueTask {
  dedupeKey: string;
  analysisId: string;
  symbol: Asset;
  horizon: AIHorizon;
  strategyVersion: string;
  candleCloseTimestamp: number;
}

export interface AIQueueResult<T> {
  dedupeKey: string;
  value: T;
  createdAtUtc: string;
}

export type TimeframeRoleMap = {
  context: Timeframe;
  setup: Timeframe;
  confirmation: Timeframe;
};
