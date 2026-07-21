import assert from "node:assert/strict";
import test from "node:test";

import type { PlanEntitlements } from "../commercial/access-control";
import { buildPlanAlertDeliveryPolicy } from "../commercial/alert-delivery-policy";

function entitlements(overrides: Partial<PlanEntitlements>): PlanEntitlements {
  return {
    plan: "basic",
    alertsEnabled: true,
    botEnabled: false,
    maxAlertsPerDay: 5,
    maxPairs: 2,
    maxBots: 0,
    historyLimit: 25,
    allowedPairs: ["XAUUSD", "BTCUSD"],
    tradingWindowsUtc: [],
    ...overrides,
  };
}

test("basic delivery policy limits daily signals to five authorized pairs", () => {
  const policy = buildPlanAlertDeliveryPolicy(
    entitlements({}),
    50,
    new Date("2026-07-21T18:30:00.000Z"),
  );

  assert.equal(policy.limit, 5);
  assert.deepEqual(policy.symbols, ["XAUUSD", "BTCUSD"]);
  assert.equal(policy.since.toISOString(), "2026-07-21T00:00:00.000Z");
});

test("advanced delivery policy limits daily signals to twenty across all pairs", () => {
  const policy = buildPlanAlertDeliveryPolicy(
    entitlements({ plan: "advanced", maxAlertsPerDay: 20, allowedPairs: null }),
    100,
    new Date("2026-07-21T18:30:00.000Z"),
  );

  assert.equal(policy.limit, 20);
  assert.equal(policy.symbols, undefined);
});

test("free app delivery policy returns no private alerts", () => {
  const policy = buildPlanAlertDeliveryPolicy(
    entitlements({ plan: "free", alertsEnabled: false, maxAlertsPerDay: 0 }),
    10,
  );

  assert.equal(policy.limit, 0);
});