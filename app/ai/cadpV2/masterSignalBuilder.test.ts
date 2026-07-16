import assert from "node:assert/strict";
import test from "node:test";

import { CadpMasterSignalBuilder } from "./masterSignalBuilder";
import type { CadpAnalysisResponseV2 } from "./types";

function response(decision: CadpAnalysisResponseV2["analyst_decision"]): CadpAnalysisResponseV2 {
  return {
    analysis_id: "ana-1",
    snapshot_utc: new Date().toISOString(),
    symbol: "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
    data_assessment: { sufficient: true, visual_numeric_consistent: true, issues: [] },
    market_assessment: { regime: null, timeframe_alignment: null, volatility_state: null, session_assessment: null, news_risk: null },
    strategy: { selected_strategy_id: "CARVIPIX_NO_TRADE_V1", selected_strategy_version: "1", selection_reason: "TEST" },
    analyst_decision: decision,
    system_validation_result: "PENDING_OBJECTIVE_VALIDATION",
    final_system_status: "SHADOW_PENDING_REVIEW",
    setup: { valid: null, direction: null, activation_condition: null, entry_missed: null, invalidation_condition: null },
    order_plan: {
      entry_type: null,
      entry_price: 100,
      entry_zone_min: null,
      entry_zone_max: null,
      stop_loss: 90,
      stop_anchor_source: null,
      stop_anchor_timeframe: null,
      stop_anchor_timestamp: null,
      stop_anchor_price: null,
      stop_buffer: null,
      stop_distance_price: null,
      stop_distance_atr: null,
      stop_reason: null,
      take_profit: 120,
      target_anchor_source: null,
      target_anchor_id: null,
      target_anchor_timeframe: null,
      target_anchor_timestamp: null,
      target_anchor_price: null,
      reward_distance_price: null,
      proposed_gross_rr: 2,
      proposed_net_rr: 1.8,
      target_reason: null,
      expected_duration: null,
      expires_at: null,
    },
    quality: { setup_quality_score: null, model_confidence: null, empirical_probability_used: false },
    news: { verification_requested: false, research_used: false, status: null, relevant_event_ids: [], source_ids: [] },
    evidence: { supporting_factors: [], conflicting_factors: [], warnings: [] },
    client_message_code: "WAIT_CONFIRMATION",
    human_review_required: true,
    visual_manifest_hash: "v",
    prompt_version: "p",
    response_schema_version: "r",
    engine_version: "e",
  };
}

test("master signal builder maps ENTER_BUY into BUY without mutating levels", () => {
  const builder = new CadpMasterSignalBuilder();
  const signal = builder.build({
    signalId: "sig-1",
    analysisId: "ana-1",
    symbol: "XAUUSD",
    profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
    response: response("ENTER_BUY"),
  });

  assert.equal(signal.direction, "BUY");
  assert.equal(signal.entry, 100);
  assert.equal(signal.stop_loss, 90);
  assert.equal(signal.take_profit, 120);
});
