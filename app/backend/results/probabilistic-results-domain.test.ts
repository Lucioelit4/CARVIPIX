import assert from "node:assert/strict";
import test from "node:test";

import {
  isProbabilisticResultsEnabled,
  shouldApplyOfficialClosure,
  validateProbabilisticRun,
} from "./probabilistic-results-domain";

const validRun = {
  periodStart: new Date("2026-03-21T00:00:00.000Z"),
  periodEnd: new Date("2026-07-21T00:00:00.000Z"),
  dataSource: "TWELVE_DATA_REAL_H1_AND_DOCUMENTED_PROBABILITY_MODEL",
  dataHash: "sha256:abc123",
  seed: "registered-seed",
  iterations: 1_000,
  scenarioIds: ["scenario-1"],
};

test("uses only the probabilistic results feature flag", () => {
  assert.equal(isProbabilisticResultsEnabled({ PROBABILISTIC_HISTORICAL_RESULTS_ENABLED: "true" }), true);
  assert.equal(isProbabilisticResultsEnabled({ HISTORICAL_BACKTEST_RESULTS_ENABLED: "true" }), false);
});

test("requires reproducible real-market probabilistic runs", () => {
  assert.doesNotThrow(() => validateProbabilisticRun(validRun));
  assert.throws(() => validateProbabilisticRun({ ...validRun, dataHash: "abc123" }), /SHA256/);
  assert.throws(() => validateProbabilisticRun({ ...validRun, scenarioIds: ["duplicate", "duplicate"] }), /DUPLICATE/);
});

test("accepts only activated official TP or SL closures", () => {
  assert.equal(shouldApplyOfficialClosure({
    decision: "ENTER_BUY",
    status: "TP_HIT",
    source: "CADP_V2_MASTER_SIGNAL",
    activatedAt: new Date(),
  }), true);
  assert.equal(shouldApplyOfficialClosure({
    decision: "ENTER_SELL",
    status: "CLOSED",
    source: "CADP_V2_MASTER_SIGNAL",
    activatedAt: new Date(),
  }), false);
  assert.equal(shouldApplyOfficialClosure({
    decision: "ENTER_BUY",
    status: "SL_HIT",
    source: "CONTROLLED_E2E_AUTOMATION",
    activatedAt: new Date(),
  }), false);
});