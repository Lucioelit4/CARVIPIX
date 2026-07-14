export const AI_ENGINE_VERSION = "CARVIPIX_AI_ENGINE_v1";
export const AI_CONTEXT_VERSION = "ai_context_v1";
export const AI_SCHEMA_VERSION = "ai_response_v1";
export const CADP_RESPONSE_SCHEMA_VERSION = "cadp_response_v2";
export const CADP_PROMPT_VERSION = "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT";
export const CADP_ANALYSIS_PROFILE = "XAUUSD_INTRADAY_H1_M30_M5_V1";

export interface AIVersionStamp {
  strategy_version: string;
  prompt_version: string;
  context_version: string;
  schema_version: string;
  engine_version: string;
}

export interface CADPVersionStamp extends AIVersionStamp {
  analysis_profile: typeof CADP_ANALYSIS_PROFILE;
  response_schema_version: typeof CADP_RESPONSE_SCHEMA_VERSION;
}
