import test from "node:test";
import assert from "node:assert/strict";

import { BrainManager } from "./brainManager";
import { StrategyPromptRegistry } from "./strategyPromptRegistry";

test("brain manager selects authorized plan and produces deterministic id shape", () => {
  const brain = new BrainManager(new StrategyPromptRegistry());

  const plan = brain.selectPlan({ symbol: "XAUUSD", horizon: "SHORT", regime: "TREND" });
  assert.equal(plan.strategy_id, "CARVIPIX_TREND_PULLBACK_SHORT_V1");
  assert.equal(plan.strategy_version, "1.0.0");
  assert.equal(plan.prompt_version, "PENDING_MASTER_PROMPT");

  const identity = brain.buildAnalysisIdentity();
  assert.match(identity.analysisId, /^analysis_/);
  assert.match(identity.signalId, /^sig_analysis_/);
});
