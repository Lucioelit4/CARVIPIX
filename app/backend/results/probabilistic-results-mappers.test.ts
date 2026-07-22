import assert from "node:assert/strict";
import test from "node:test";

import { buildProfileSummaries, mapLifecycleStatusToObservedOutcome } from "./probabilistic-results-mappers";

test("maps only TP_HIT and SL_HIT to observed outcomes", () => {
  assert.equal(mapLifecycleStatusToObservedOutcome("TP_HIT"), "TP");
  assert.equal(mapLifecycleStatusToObservedOutcome("SL_HIT"), "SL");
  assert.equal(mapLifecycleStatusToObservedOutcome("CLOSED"), null);
});

test("builds profile summary map for snapshot metrics", () => {
  const summary = buildProfileSummaries([
    {
      profileId: "run-profile-01",
      initialBalance: 1000,
      finalBalance: 1075,
      pnl: 75,
      returnPct: 7.5,
      maxDrawdownPct: 1.2,
      estimatedPips: 23,
      alertsApplied: 10,
      simulatedOperations: 7,
      takeProfits: 5,
      stopLosses: 2,
      notActivated: 3,
      observedOperations: 2,
      simulatedComponentPct: 71.43,
      observedComponentPct: 28.57,
      probabilityOfLoss: 18,
      probableBalanceRange: { low: 950, median: 1030, high: 1150 },
      equityCurve: [],
      outcomes: [],
    },
  ]);

  assert.deepEqual(summary["run-profile-01"], {
    returnPct: 7.5,
    probabilityOfLoss: 18,
    probableBalanceRange: { low: 950, median: 1030, high: 1150 },
    observedComponentPct: 28.57,
    simulatedComponentPct: 71.43,
  });
});
