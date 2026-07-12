import test from "node:test";
import assert from "node:assert/strict";

import { AnalysisTriggerPolicy } from "./triggerPolicy";

test("trigger policy enables shadow analysis for relevant market events", () => {
  const policy = new AnalysisTriggerPolicy();
  const result = policy.evaluate({
    symbol: "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M45_M5_V1",
    snapshot_close_timestamp: 123,
    context_version: "ai_context_v1",
    reason: "NEW_H1_CLOSE",
    watching: true,
    minutes_to_expire: 9,
    proximity_to_structure: 0.1,
    volatility_change: 0.3,
    news_nearby: true,
    previous_decision: "WAIT",
  });

  assert.equal(result.shouldTrigger, true);
  assert.equal(result.stateOfWatch, "WATCHING");
  assert.equal(result.priority, 90);
});
