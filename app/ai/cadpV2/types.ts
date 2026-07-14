import type { Asset, Candle, Timeframe } from "../../engine/types/marketData";
import type { AIClientMessageCode } from "../types";

export const CADP_V1_PROFILE = "XAUUSD_INTRADAY_H1_M30_M5_V1" as const;
export const CADP_V1_PROMPT_ID = "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT" as const;

export type CadpAnalysisTriggerReason =
  | "NEW_H1_CLOSE"
  | "NEW_M30_CLOSE"
  | "NEW_M5_CLOSE_WHEN_WATCHING"
  | "PRICE_NEAR_STRUCTURE"
  | "VOLATILITY_CHANGE"
  | "COMPRESSION_TO_EXPANSION"
  | "PREVIOUS_SIGNAL_WAIT"
  | "NEWS_NEARBY"
  | "NEWS_STATE_CHANGE"
  | "ABNORMAL_MOVE"
  | "ENTRY_PENDING_EXPIRING";

export interface CadpFeatureFlags {
  CADP_V1_ENABLED: boolean;
  AI_ANALYST_MODE: "DRAFT" | "SHADOW" | "HUMAN_REVIEW_REQUIRED" | "ACTIVE";
  AI_VISUAL_CONTEXT_REQUIRED: boolean;
  AI_NEWS_RESEARCH_ENABLED: boolean;
  AI_REASONING_EFFORT: string;
  AI_IMAGE_DETAIL: string;
}

export interface CadpPromptDraftRecord {
  prompt_id: string;
  prompt_version: string;
  status: "DRAFT" | "SHADOW_ONLY" | "NOT_APPROVED_FOR_PRODUCTION";
  created_at: string;
  prompt_hash: string;
  schema_version: string;
  compatible_profiles: string[];
  compatible_strategy_versions: string[];
  text: string;
}

export interface CadpAnalyticalCoreRecord {
  core_id: "CARVIPIX_ANALYTICAL_CORE_V1";
  version: "1.0.0";
  status: "DRAFT";
  mode: "SHADOW_ONLY";
  approved_for_production: false;
  compatible_protocol: "CADP_V2";
  compatible_profile: typeof CADP_V1_PROFILE;
  created_at: string;
  content_hash: string;
  content: string;
}

export interface CadpAnalysisMissionRecord {
  mission_id: "CARVIPIX_ANALYSIS_MISSION_V1";
  version: "1.0.0";
  status: "DRAFT";
  mode: "SHADOW_ONLY";
  compatible_protocol: "CADP_V2";
  compatible_profile: typeof CADP_V1_PROFILE;
  created_at: string;
  content_hash: string;
  content: string;
}

export interface CadpSnapshotIdentity {
  analysis_id: string;
  symbol: Asset;
  broker_symbol: string;
  analysis_profile: typeof CADP_V1_PROFILE;
  snapshot_utc: string;
  current_bid: number;
  current_ask: number;
  last_closed_candle_h1: number | null;
  last_closed_candle_m30: number | null;
  last_closed_candle_m5: number | null;
  engine_version: string;
  context_version: string;
  visual_schema_version: string;
  prompt_version: string;
  response_schema_version: string;
  m30_alignment_version: string;
}

export interface CadpTimeframeEnvelope {
  timeframe: Timeframe;
  closed_candles: Candle[];
  open_candle: Candle | null;
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
  volatility_percentile: number;
  structural_highs: number[];
  structural_lows: number[];
  support_zones: number[];
  resistance_zones: number[];
  latest_timestamp: number | null;
}

export interface CadpNewsEvent {
  event_id: string;
  event_name: string;
  scheduled_utc: string;
  minutes_to_event: number;
  impact: "LOW" | "MEDIUM" | "HIGH";
  currencies: string[];
  relevance_to_symbol: "LOW" | "MEDIUM" | "HIGH";
  source: string;
  confirmed: boolean;
}

export interface CadpNewsBundle {
  news_status: "CURRENT" | "STALE" | "NEWS_UNCONFIRMED";
  last_refresh_utc: string;
  events: CadpNewsEvent[];
  source_ids: string[];
  research_used: boolean;
  verification_requested: boolean;
  evidence_hash: string;
}

export interface CadpSessionContext {
  market_status: "OPEN" | "CLOSED" | "CLOSING_SOON";
  primary_session: "ASIA" | "LONDON" | "NEW_YORK" | "OVERLAP" | "NONE";
  session_overlap: "LONDON_NEW_YORK" | "NONE";
  minutes_to_session_close: number;
  minutes_to_daily_maintenance: number;
  minutes_to_weekly_close: number;
  next_market_open_utc: string | null;
  holiday_schedule_active: boolean;
  early_close: boolean;
  schedule_source: string;
}

export interface CadpVisualManifestImage {
  timeframe: Timeframe;
  filename: string;
  width: number;
  height: number;
  first_candle_timestamp: number | null;
  last_closed_candle_timestamp: number | null;
  open_candle_included: boolean;
  sha256: string;
  source_snapshot_id: string;
}

export interface CadpVisualManifest {
  analysis_id: string;
  images: CadpVisualManifestImage[];
  visual_manifest_hash: string;
}

export interface CadpAnalysisRequestV2 {
  identity: CadpSnapshotIdentity;
  timeframes: {
    H1: CadpTimeframeEnvelope;
    M30: CadpTimeframeEnvelope;
    M5: CadpTimeframeEnvelope;
  };
  market_now: {
    spread: number;
    spread_avg: number;
    spread_vs_atr: number;
    session: string;
    volatility_now: number;
    volatility_percentile: number;
    market_open: boolean;
    news_status: CadpNewsBundle["news_status"];
  };
  sessions: CadpSessionContext;
  news_bundle: CadpNewsBundle;
  visual_manifest: CadpVisualManifest;
  authorized_strategies: Array<{
    strategy_id: string;
    strategy_version: string;
    status: string;
    short_description: string;
    critical_requirements: string[];
    allowed_profile: typeof CADP_V1_PROFILE;
  }>;
  numeric_context_hash: string;
  final_context_hash: string;
  risk_envelope: {
    max_daily_risk_pct: number;
    max_exposure_pct: number;
    lot_size_policy: "CARVIPIX_CONTROLLED";
    auto_execution_eligible: false;
    human_review_required: true;
  };
  feature_flags: CadpFeatureFlags;
}

export interface CadpResponseOrderPlan {
  entry_type: "MARKET" | "LIMIT" | "STOP" | null;
  entry_price: number | null;
  entry_zone_min: number | null;
  entry_zone_max: number | null;
  stop_loss: number | null;
  stop_anchor_source: string | null;
  stop_anchor_timeframe: Timeframe | null;
  stop_anchor_timestamp: number | null;
  stop_anchor_price: number | null;
  stop_buffer: number | null;
  stop_distance_price: number | null;
  stop_distance_atr: number | null;
  stop_reason: string | null;
  take_profit: number | null;
  target_anchor_source: string | null;
  target_anchor_id: string | null;
  target_anchor_timeframe: Timeframe | null;
  target_anchor_timestamp: number | null;
  target_anchor_price: number | null;
  reward_distance_price: number | null;
  proposed_gross_rr: number | null;
  proposed_net_rr: number | null;
  target_reason: string | null;
  expected_duration: string | null;
  expires_at: string | null;
}

export interface CadpAnalysisResponseV2 {
  analysis_id: string;
  snapshot_utc: string;
  symbol: Asset;
  analysis_profile: typeof CADP_V1_PROFILE;
  data_assessment: {
    sufficient: boolean;
    visual_numeric_consistent: boolean;
    issues: string[];
  };
  market_assessment: {
    regime: string | null;
    timeframe_alignment: "ALIGNED" | "MISALIGNED" | null;
    volatility_state: string | null;
    session_assessment: string | null;
    news_risk: string | null;
  };
  strategy: {
    selected_strategy_id: string | null;
    selected_strategy_version: string | null;
    selection_reason: string | null;
  };
  analyst_decision:
    | "ENTER_BUY"
    | "ENTER_SELL"
    | "WAIT"
    | "CONDITIONAL_ENTRY"
    | "NO_TRADE"
    | "ENTRY_MISSED"
    | "DATA_INSUFFICIENT"
    | "NEWS_VERIFICATION_REQUIRED";
  system_validation_result: "PENDING_OBJECTIVE_VALIDATION" | "VALID" | "REJECTED";
  final_system_status: "SHADOW_PENDING_REVIEW" | "SHADOW_REJECTED" | "SHADOW_ACCEPTED";
  setup: {
    valid: boolean | null;
    direction: "BUY" | "SELL" | "NONE" | null;
    activation_condition: string | null;
    entry_missed: boolean | null;
    invalidation_condition: string | null;
  };
  order_plan: CadpResponseOrderPlan;
  quality: {
    setup_quality_score: number | null;
    model_confidence: number | null;
    empirical_probability_used: boolean;
  };
  news: {
    verification_requested: boolean;
    research_used: boolean;
    status: CadpNewsBundle["news_status"] | null;
    relevant_event_ids: string[];
    source_ids: string[];
  };
  evidence: {
    supporting_factors: string[];
    conflicting_factors: string[];
    warnings: string[];
  };
  client_message_code: AIClientMessageCode;
  human_review_required: true;
  visual_manifest_hash: string;
  prompt_version: string;
  response_schema_version: string;
  engine_version: string;
}

export interface CadpShadowSignal {
  signal_id: string;
  analysis_id: string;
  symbol: Asset;
  analysis_profile: typeof CADP_V1_PROFILE;
  selected_strategy_id: string;
  direction: "BUY" | "SELL" | "NONE";
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  calculated_gross_rr: number | null;
  calculated_net_rr: number | null;
  expires_at: string | null;
  status: "SHADOW";
  human_review_required: true;
  auto_execution_eligible: false;
}

export interface CadpPromptAssembly {
  prompt_text: string;
  prompt_cache_key: string;
  core_hash: string;
  mission_hash: string;
  prompt_hash: string;
  cache_eligible: boolean;
  section_order: string[];
}
