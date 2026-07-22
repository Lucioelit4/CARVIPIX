import assert from "node:assert/strict";
import test from "node:test";

import { runProbabilisticSimulation, type ProbabilisticScenario } from "./probabilistic-simulation-engine";

const scenarios: ProbabilisticScenario[] = Array.from({ length: 40 }, (_, index) => ({
  scenarioId: `scenario-${index + 1}`,
  occurredAt: new Date(Date.UTC(2026, 2, 1 + index * 3)).toISOString(),
  symbol: index % 2 === 0 ? "XAUUSD" : "EURUSD",
  direction: index % 3 === 0 ? "SELL" : "BUY",
  originalProbability: index % 5 === 0 ? 0.44 : 0.56,
  decisionQuality: 0.62,
  riskReward: index % 4 === 0 ? 1.35 : 1.8,
  activationProbability: 0.78,
  volatilityFactor: 0.55,
  trendFactor: 0.58,
  contextFactor: 0.52,
  riskPips: 20,
  spreadPips: 1.4,
  commissionPips: 0.4,
  slippagePips: 0.5,
  sourceType: index < 3 ? "RECORDED_ANALYSIS" : "DOCUMENTED_MODEL",
  ...(index === 0 ? { observedOutcome: "TP" as const, observedSignalId: "official-1" } : {}),
}));

const profiles = [
  { profileId: "conservative", initialBalance: 1000, riskType: "CONSERVATIVE" as const },
  { profileId: "moderate", initialBalance: 2500, riskType: "MODERATE" as const },
  { profileId: "dynamic", initialBalance: 5000, riskType: "DYNAMIC" as const },
];

test("is exactly reproducible with a registered seed", () => {
  const input = { seed: "carvipix-prob-v1", iterations: 500, scenarios, profiles, generatedAt: "2026-07-21T00:00:00.000Z" };
  assert.deepEqual(runProbabilisticSimulation(input), runProbabilisticSimulation(input));
});

test("calculates uncertainty, costs, drawdown and observed replacement", () => {
  const result = runProbabilisticSimulation({
    seed: "carvipix-prob-v1",
    iterations: 500,
    scenarios,
    profiles,
    generatedAt: "2026-07-21T00:00:00.000Z",
  });
  assert.equal(result.profiles.length, 3);
  assert.ok(result.profiles.every(profile => profile.equityCurve.length === scenarios.length + 1));
  assert.ok(result.profiles.every(profile => profile.maxDrawdownPct > 0));
  assert.ok(result.profiles.every(profile => profile.observedOperations === 1));
  assert.ok(result.profiles.every(profile => profile.observedComponentPct > 0));
  assert.ok(result.profiles.every(profile => profile.probableBalanceRange.low <= profile.probableBalanceRange.high));
  assert.notEqual(result.profiles[0].returnPct, result.profiles[2].returnPct);
});