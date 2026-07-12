import type { CadpAnalysisRequestV2, CadpAnalysisResponseV2 } from "./types";

export interface CadpVerifierV2Result {
  valid: boolean;
  errors: string[];
  repairedResponse: CadpAnalysisResponseV2 | null;
  retryable: boolean;
}

const ALLOWED_DECISIONS = new Set([
  "ENTER_BUY",
  "ENTER_SELL",
  "WAIT",
  "CONDITIONAL_ENTRY",
  "NO_TRADE",
  "ENTRY_MISSED",
  "DATA_INSUFFICIENT",
  "NEWS_VERIFICATION_REQUIRED",
]);

export class CadpVerifierV2 {
  verify(input: { request: CadpAnalysisRequestV2; response: unknown }): CadpVerifierV2Result {
    if (!input.response || typeof input.response !== "object") {
      return { valid: false, errors: ["RESPONSE_NOT_OBJECT"], repairedResponse: null, retryable: true };
    }

    const response = input.response as Record<string, unknown>;
    const required = [
      "analysis_id",
      "snapshot_utc",
      "symbol",
      "analysis_profile",
      "data_assessment",
      "market_assessment",
      "strategy",
      "analyst_decision",
      "setup",
      "order_plan",
      "quality",
      "news",
      "evidence",
      "client_message_code",
      "human_review_required",
      "visual_manifest_hash",
      "prompt_version",
      "response_schema_version",
      "engine_version",
    ];

    const errors: string[] = [];
    for (const field of required) {
      if (!(field in response)) errors.push(`MISSING_FIELD:${field}`);
    }
    if (errors.length > 0) return { valid: false, errors, repairedResponse: null, retryable: true };

    if (response.analysis_id !== input.request.identity.analysis_id) errors.push("ANALYSIS_ID_MISMATCH");
    if (response.analysis_profile !== input.request.identity.analysis_profile) errors.push("PROFILE_MISMATCH");
    if (response.symbol !== input.request.identity.symbol) errors.push("SYMBOL_MISMATCH");
    if (!ALLOWED_DECISIONS.has(String(response.analyst_decision))) errors.push("DECISION_OUT_OF_CATALOG");

    const decision = String(response.analyst_decision);
    const setup = response.setup as Record<string, unknown>;
    const orderPlan = response.order_plan as Record<string, unknown>;
    const quality = response.quality as Record<string, unknown>;

    if ((decision === "ENTER_BUY" || decision === "ENTER_SELL") && !orderPlan.entry_type) {
      errors.push("ENTRY_PLAN_REQUIRED_FOR_ENTER");
    }
    if (decision === "CONDITIONAL_ENTRY" && !setup.activation_condition) {
      errors.push("ACTIVATION_CONDITION_REQUIRED");
    }
    if (decision === "WAIT" || decision === "NO_TRADE" || decision === "ENTRY_MISSED" || decision === "DATA_INSUFFICIENT" || decision === "NEWS_VERIFICATION_REQUIRED") {
      if (orderPlan.entry_price !== null || orderPlan.stop_loss !== null || orderPlan.take_profit !== null) {
        errors.push("LEVELS_NOT_ALLOWED_FOR_NON_ENTRY_DECISION");
      }
    }

    if (quality.empirical_probability_used !== false) {
      errors.push("EMPIRICAL_PROBABILITY_MUST_BE_FALSE");
    }

    const disallowedProbabilityFields = ["win_probability", "probability_of_profit", "guaranteed_probability"];
    for (const field of disallowedProbabilityFields) {
      if (field in quality) errors.push(`DISALLOWED_PROBABILITY_FIELD:${field}`);
    }

    const stopAnchorFields = ["stop_loss", "stop_anchor_source", "stop_anchor_timeframe", "stop_anchor_timestamp", "stop_anchor_price", "stop_buffer", "stop_distance_price", "stop_distance_atr", "stop_reason"];
    const tpAnchorFields = ["take_profit", "target_anchor_source", "target_anchor_timeframe", "target_anchor_id", "target_anchor_price", "reward_distance_price", "proposed_gross_rr", "proposed_net_rr", "target_reason"];

    const hasEnterLikeDecision = decision === "ENTER_BUY" || decision === "ENTER_SELL" || decision === "CONDITIONAL_ENTRY";
    if (hasEnterLikeDecision) {
      for (const field of stopAnchorFields) {
        if (!(field in orderPlan) || orderPlan[field] == null) errors.push(`STOP_FIELD_REQUIRED:${field}`);
      }
      for (const field of tpAnchorFields) {
        if (!(field in orderPlan) || orderPlan[field] == null) errors.push(`TARGET_FIELD_REQUIRED:${field}`);
      }
    }

    if (response.human_review_required !== true) {
      errors.push("HUMAN_REVIEW_REQUIRED_TRUE_ONLY");
    }

    if (errors.length > 0) {
      return { valid: false, errors, repairedResponse: null, retryable: errors.some((e) => e.startsWith("MISSING_FIELD:")) };
    }

    return { valid: true, errors: [], repairedResponse: response as unknown as CadpAnalysisResponseV2, retryable: false };
  }
}
