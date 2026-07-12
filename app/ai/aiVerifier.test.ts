import test from "node:test";
import assert from "node:assert/strict";

import { AIVerifier } from "./aiVerifier";
import type { AIAnalysisRequest, AIAnalysisResponse } from "./types";

function buildRequest(): AIAnalysisRequest {
  return {
    identity: {
      analysis_id: "analysis_1",
      symbol: "XAUUSD",
      broker_symbol: "XAU_USD",
      timestamp_utc: "2026-07-11T00:00:00.000Z",
      strategy_id: "CARVIPIX_TREND_PULLBACK_SHORT_V1",
      strategy_version: "1.0.0",
      context_version: "ai_context_v1",
      schema_version: "ai_response_v1",
      horizon: "SHORT",
      expected_duration: "30m",
      analysis_reason: "test",
    },
    data_quality: {
      provider: "oanda",
      connection_status: "connected",
      latency_ms: 10,
      latest_closed_candle_utc: "2026-07-11T00:00:00.000Z",
      gaps: 0,
      duplicates: 0,
      out_of_order_timestamps: 0,
      incomplete_candles: 0,
      sync_status: "SYNCED",
      data_ready: true,
    },
    market_now: {
      bid: 1,
      ask: 1.1,
      spread: 0.1,
      spread_avg: 0.1,
      spread_vs_atr: 0.1,
      session: "LONDON",
      market_open: true,
      volatility_now: 1,
      volatility_percentile: 50,
      economic_event_relevant: false,
      next_relevant_event_utc: null,
    },
    context_tf: {
      timeframe: "1H",
      last_closed_candles: [],
      ema20: 0,
      ema50: 0,
      ema200: 0,
      ema20_slope: 0,
      ema50_slope: 0,
      ema200_slope: 0,
      atr: 0,
      adx: 0,
      structural_high: 0,
      structural_low: 0,
      structure_direction: "NEUTRAL",
      distance_to_zone: 0,
      closed_candle_state: "CLOSED_ONLY",
    },
    setup_tf: {
      timeframe: "45M",
      last_closed_candles: [],
      ema20: 0,
      ema50: 0,
      ema200: 0,
      ema20_slope: 0,
      ema50_slope: 0,
      ema200_slope: 0,
      atr: 0,
      adx: 0,
      structural_high: 0,
      structural_low: 0,
      structure_direction: "NEUTRAL",
      distance_to_zone: 0,
      closed_candle_state: "CLOSED_ONLY",
    },
    confirmation_tf: {
      timeframe: "5M",
      last_closed_candles: [],
      ema20: 0,
      ema50: 0,
      ema200: 0,
      ema20_slope: 0,
      ema50_slope: 0,
      ema200_slope: 0,
      atr: 0,
      adx: 0,
      structural_high: 0,
      structural_low: 0,
      structure_direction: "NEUTRAL",
      distance_to_zone: 0,
      closed_candle_state: "CLOSED_ONLY",
    },
    levels: {
      candidate_direction: "BUY",
      activation_price: 1,
      entry_zone_min: 0.99,
      entry_zone_max: 1.01,
      invalidation_price: 0.9,
      technical_stop: 0.9,
      volatility_buffer: 0.01,
      initial_target: 1.2,
      risk_reward: 2,
      signal_expires_at_utc: "2026-07-11T01:00:00.000Z",
      distance_from_entry: 0,
      state: "READY",
    },
    risk_safety: {
      safety_gates: [{ name: "LIQUIDITY", passed: true, reason: "ok" }],
      risk_engine: { approved: true, reason: "ok" },
      spread_acceptable: true,
      volatility_acceptable: true,
      news_blocking: false,
      daily_limit_blocking: false,
      exposure_blocking: false,
      duplicate_signal_blocking: false,
      blocking_reason: null,
    },
    visual_context: {
      image_url: null,
      image_type: "none",
      overlays: [],
    },
    regime: "TREND",
  };
}

const response: AIAnalysisResponse = {
  analysis_id: "analysis_1",
  strategy_id: "CARVIPIX_TREND_PULLBACK_SHORT_V1",
  strategy_version: "1.0.0",
  decision: "ENTER_BUY",
  direction: "BUY",
  setup_valid: true,
  entry_ready: true,
  entry_missed: false,
  data_sufficient: true,
  levels_match_input: true,
  risk_conflict: false,
  critical_conflicts: [],
  reasons: [],
  warnings: [],
  confidence: 92,
  client_message_code: "BUY_NOW",
  human_review_required: true,
};

test("verifier rejects empty responses", () => {
  const verifier = new AIVerifier();
  const out = verifier.verify({ request: buildRequest(), response: null });
  assert.equal(out.valid, false);
  assert.ok(out.errors.includes("AI_RESPONSE_EMPTY"));
});

test("verifier accepts coherent response and blocks unauthorized direction change", () => {
  const verifier = new AIVerifier();
  const ok = verifier.verify({ request: buildRequest(), response });
  assert.equal(ok.valid, true);

  const bad = verifier.verify({
    request: buildRequest(),
    response: { ...response, direction: "SELL" },
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.includes("UNAUTHORIZED_DIRECTION_CHANGE"));
});
