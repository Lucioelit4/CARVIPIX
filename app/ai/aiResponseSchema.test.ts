import test from "node:test";
import assert from "node:assert/strict";

import { validateAIResponseSchema } from "./aiResponseSchema";
import type { AIAnalysisRequest } from "./types";
import { AI_CONTEXT_VERSION, AI_SCHEMA_VERSION } from "./aiVersioning";

function baseRequest(): AIAnalysisRequest {
  return {
    identity: {
      analysis_id: "analysis_1",
      symbol: "XAUUSD",
      broker_symbol: "XAU_USD",
      timestamp_utc: new Date().toISOString(),
      strategy_id: "CARVIPIX_TREND_PULLBACK_SHORT_V1",
      strategy_version: "1.0.0",
      context_version: AI_CONTEXT_VERSION,
      schema_version: AI_SCHEMA_VERSION,
      horizon: "SHORT",
      expected_duration: "30m",
      analysis_reason: "new_candle",
    },
    data_quality: {
      provider: "oanda",
      connection_status: "connected",
      latency_ms: 20,
      latest_closed_candle_utc: new Date().toISOString(),
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
      session: "X",
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
      entry_zone_min: 0.9,
      entry_zone_max: 1.1,
      invalidation_price: 0.8,
      technical_stop: 0.8,
      volatility_buffer: 0.05,
      initial_target: 1.3,
      risk_reward: 1.5,
      signal_expires_at_utc: new Date().toISOString(),
      distance_from_entry: 0,
      state: "READY",
    },
    risk_safety: {
      safety_gates: [],
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

test("rejects invalid decision", () => {
  const req = baseRequest();
  const out = validateAIResponseSchema(
    {
      analysis_id: req.identity.analysis_id,
      strategy_id: req.identity.strategy_id,
      strategy_version: req.identity.strategy_version,
      decision: "BUY_NOW",
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
      confidence: 80,
      client_message_code: "BUY_NOW",
      human_review_required: true,
    },
    req
  );

  assert.equal(out.ok, false);
  assert.ok(out.errors.includes("DECISION_OUT_OF_CATALOG"));
});

test("rejects analysis_id mismatch", () => {
  const req = baseRequest();
  const out = validateAIResponseSchema(
    {
      analysis_id: "analysis_other",
      strategy_id: req.identity.strategy_id,
      strategy_version: req.identity.strategy_version,
      decision: "WAIT",
      direction: "NONE",
      setup_valid: false,
      entry_ready: false,
      entry_missed: false,
      data_sufficient: true,
      levels_match_input: true,
      risk_conflict: false,
      critical_conflicts: [],
      reasons: [],
      warnings: [],
      confidence: 50,
      client_message_code: "WAIT_CONFIRMATION",
      human_review_required: true,
    },
    req
  );

  assert.equal(out.ok, false);
  assert.ok(out.errors.includes("ANALYSIS_ID_MISMATCH"));
});
