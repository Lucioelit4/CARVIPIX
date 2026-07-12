import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { CadpSnapshotBuilder } from "./snapshotBuilder";
import { CadpVerifierV2 } from "./verifierV2";
import type { CadpAnalysisResponseV2 } from "./types";

function baseResponse() {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();
  const snapshotBuilder = new CadpSnapshotBuilder(pipeline, indicators);
  const request = snapshotBuilder.build({
    analysisId: "analysis_verify_1",
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });

  const response: CadpAnalysisResponseV2 = {
      analysis_id: request.identity.analysis_id,
      snapshot_utc: request.identity.snapshot_utc,
      symbol: request.identity.symbol,
      analysis_profile: request.identity.analysis_profile,
      data_assessment: { sufficient: true, visual_numeric_consistent: true, issues: [] },
      market_assessment: {
        regime: "TREND",
        timeframe_alignment: "ALIGNED",
        volatility_state: "NORMAL",
        session_assessment: "OPEN",
        news_risk: "LOW",
      },
      strategy: {
        selected_strategy_id: "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
        selected_strategy_version: "1.0.0",
        selection_reason: "MATCH",
      },
      analyst_decision: "WAIT",
      system_validation_result: "PENDING_OBJECTIVE_VALIDATION",
      final_system_status: "SHADOW_PENDING_REVIEW",
      setup: {
        valid: null,
        direction: null,
        activation_condition: null,
        entry_missed: null,
        invalidation_condition: null,
      },
      order_plan: {
        entry_type: null,
        entry_price: null,
        entry_zone_min: null,
        entry_zone_max: null,
        stop_loss: null,
        stop_anchor_source: null,
        stop_anchor_timeframe: null,
        stop_anchor_timestamp: null,
        stop_anchor_price: null,
        stop_buffer: null,
        stop_distance_price: null,
        stop_distance_atr: null,
        stop_reason: null,
        take_profit: null,
        target_anchor_source: null,
        target_anchor_timeframe: null,
        target_anchor_id: null,
        target_anchor_timestamp: null,
        target_anchor_price: null,
        reward_distance_price: null,
        proposed_gross_rr: null,
        proposed_net_rr: null,
        target_reason: null,
        expected_duration: null,
        expires_at: null,
      },
      quality: {
        setup_quality_score: 70,
        model_confidence: 60,
        empirical_probability_used: false,
      },
      news: {
        verification_requested: false,
        research_used: false,
        status: "CURRENT",
        relevant_event_ids: [],
        source_ids: [],
      },
      evidence: {
        supporting_factors: [],
        conflicting_factors: [],
        warnings: [],
      },
      client_message_code: "WAIT_CONFIRMATION",
      human_review_required: true,
      visual_manifest_hash: request.visual_manifest.visual_manifest_hash,
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
      response_schema_version: "cadp_response_v2",
      engine_version: "CARVIPIX_AI_ENGINE_v1",
  };

  return {
    request,
    response,
  };
}

test("verifier accepts all eight allowed decisions and rejects unauthorized decisions", () => {
  const verifier = new CadpVerifierV2();
  const base = baseResponse();
  const allowed = [
    "ENTER_BUY",
    "ENTER_SELL",
    "WAIT",
    "CONDITIONAL_ENTRY",
    "NO_TRADE",
    "ENTRY_MISSED",
    "DATA_INSUFFICIENT",
    "NEWS_VERIFICATION_REQUIRED",
  ] as const;

  for (const decision of allowed) {
    const candidate = structuredClone(base.response) as typeof base.response;
    candidate.analyst_decision = decision;
    if (decision === "ENTER_BUY" || decision === "ENTER_SELL" || decision === "CONDITIONAL_ENTRY") {
      candidate.setup.activation_condition = "TRIGGER";
      candidate.order_plan.entry_type = "MARKET";
      candidate.order_plan.entry_price = 1;
      candidate.order_plan.stop_loss = 0.9;
      candidate.order_plan.stop_anchor_source = "STRUCTURE";
      candidate.order_plan.stop_anchor_timeframe = "5M";
      candidate.order_plan.stop_anchor_timestamp = 1;
      candidate.order_plan.stop_anchor_price = 0.91;
      candidate.order_plan.stop_buffer = 0.01;
      candidate.order_plan.stop_distance_price = 0.1;
      candidate.order_plan.stop_distance_atr = 1;
      candidate.order_plan.stop_reason = "VALID";
      candidate.order_plan.take_profit = 1.2;
      candidate.order_plan.target_anchor_source = "STRUCTURE";
      candidate.order_plan.target_anchor_timeframe = "1H";
      candidate.order_plan.target_anchor_id = "T1";
      candidate.order_plan.target_anchor_timestamp = 2;
      candidate.order_plan.target_anchor_price = 1.2;
      candidate.order_plan.reward_distance_price = 0.2;
      candidate.order_plan.proposed_gross_rr = 2;
      candidate.order_plan.proposed_net_rr = 1.8;
      candidate.order_plan.target_reason = "VALID";
    }
    const out = verifier.verify({ request: base.request, response: candidate });
    assert.equal(out.valid, true);
  }

  const invalidDecision = structuredClone(base.response) as typeof base.response;
  (invalidDecision as unknown as { analyst_decision: string }).analyst_decision = "RANDOM_DECISION";
  const invalidOut = verifier.verify({ request: base.request, response: invalidDecision });
  assert.equal(invalidOut.valid, false);
  assert.ok(invalidOut.errors.includes("DECISION_OUT_OF_CATALOG"));
});

test("verifier enforces conditional and enter plan requirements plus non-probability confidence", () => {
  const verifier = new CadpVerifierV2();
  const base = baseResponse();

  const conditional = structuredClone(base.response) as typeof base.response;
  conditional.analyst_decision = "CONDITIONAL_ENTRY";
  const conditionalOut = verifier.verify({ request: base.request, response: conditional });
  assert.equal(conditionalOut.valid, false);
  assert.ok(conditionalOut.errors.includes("ACTIVATION_CONDITION_REQUIRED"));

  const enter = structuredClone(base.response) as typeof base.response;
  enter.analyst_decision = "ENTER_BUY";
  const enterOut = verifier.verify({ request: base.request, response: enter });
  assert.equal(enterOut.valid, false);
  assert.ok(enterOut.errors.some((e) => e.startsWith("STOP_FIELD_REQUIRED:")));
  assert.ok(enterOut.errors.some((e) => e.startsWith("TARGET_FIELD_REQUIRED:")));

  const wrongProbability = structuredClone(base.response) as typeof base.response;
  wrongProbability.quality.empirical_probability_used = true;
  const probOut = verifier.verify({ request: base.request, response: wrongProbability });
  assert.equal(probOut.valid, false);
  assert.ok(probOut.errors.includes("EMPIRICAL_PROBABILITY_MUST_BE_FALSE"));
});
