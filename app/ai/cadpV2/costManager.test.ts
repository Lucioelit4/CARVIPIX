import test from "node:test";
import assert from "node:assert/strict";

import { CadpCostManager } from "./costManager";

test("cost manager tracks per-analysis and aggregate cost metrics", () => {
  const manager = new CadpCostManager();
  manager.register({
    analysisId: "a1",
    decision: "NO_TRADE",
    modelId: "gpt-5.6-sol",
    usage: { input_tokens: 100, cached_tokens: 20, output_tokens: 30, reasoning_tokens: 5 },
    imagesSent: 3,
    estimatedCostUsd: 0.0123,
    durationMs: 250,
  });
  manager.register({
    analysisId: "a2",
    decision: "ENTER_BUY",
    modelId: "gpt-5.6-sol",
    usage: { input_tokens: 200, cached_tokens: 100, output_tokens: 60, reasoning_tokens: 10 },
    imagesSent: 3,
    estimatedCostUsd: 0.02,
    durationMs: 300,
  });

  const summary = manager.summarize(new Date());
  assert.equal(summary.total_records, 2);
  assert.ok(summary.daily_cost_usd > 0);
  assert.ok(summary.monthly_cost_usd > 0);
  assert.ok(summary.cost_per_analysis_usd > 0);
  assert.ok(summary.cost_per_approved_signal_usd > 0);
  assert.ok(summary.cost_per_no_trade_usd > 0);
});
