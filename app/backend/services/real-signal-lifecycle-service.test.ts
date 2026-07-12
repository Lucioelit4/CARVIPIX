import assert from "node:assert/strict";
import test from "node:test";

import { buildLifecycleFixture, isEntryDecision } from "./real-signal-lifecycle-fixtures";

test("audit-only decisions are excluded from entry lifecycle", () => {
  assert.equal(isEntryDecision("WAIT"), false);
  assert.equal(isEntryDecision("NO_TRADE"), false);
  assert.equal(isEntryDecision("DATA_INSUFFICIENT"), false);
  assert.equal(isEntryDecision("ENTER_BUY"), true);
  assert.equal(isEntryDecision("ENTER_SELL"), true);
});

test("fixture builds full transition cycle for entry decisions", () => {
  const sequence = buildLifecycleFixture({
    signalId: "sig-fixture-1",
    analysisId: "ana-fixture-1",
    symbol: "XAUUSD",
    decision: "CONDITIONAL_ENTRY",
    strategyId: "CARVIPIX_BREAKOUT_V1",
  });

  assert.deepEqual(
    sequence.map((step) => step.status),
    ["CREATED", "CONDITIONAL", "ACTIVE", "TP_HIT"]
  );
  assert.equal(sequence.at(-1)?.realizedPnl, 125.5);
});

test("fixture closes audit-only decisions without alert states", () => {
  const sequence = buildLifecycleFixture({
    signalId: "sig-fixture-2",
    analysisId: "ana-fixture-2",
    symbol: "EURUSD",
    decision: "WAIT",
    strategyId: "CARVIPIX_NO_TRADE_V1",
  });

  assert.deepEqual(sequence, [{ status: "CLOSED", realizedPnl: 0 }]);
});
