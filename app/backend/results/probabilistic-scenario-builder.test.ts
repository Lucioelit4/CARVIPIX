import assert from "node:assert/strict";
import test from "node:test";

import { buildProbabilisticScenarios, type HistoricalMarketCandle } from "./probabilistic-scenario-builder";

const candles: HistoricalMarketCandle[] = Array.from({ length: 400 }, (_, index) => ({
  symbol: "EURUSD",
  occurredAt: new Date(Date.UTC(2026, 2, 1, index)).toISOString(),
  open: 1.08 + index * 0.00001,
  high: 1.081 + index * 0.00001,
  low: 1.079 + index * 0.00001,
  close: 1.0805 + index * 0.00001,
  volume: 100 + index,
}));

test("builds deterministic modeled scenarios from real candle-shaped inputs", () => {
  const first = buildProbabilisticScenarios({ candles });
  const second = buildProbabilisticScenarios({ candles });
  assert.deepEqual(first, second);
  assert.ok(first.scenarios.length > 0);
  assert.ok(first.scenarios.every(scenario => scenario.sourceType === "DOCUMENTED_MODEL"));
  assert.match(first.dataHash, /^sha256:[a-f0-9]{64}$/);
  assert.ok(first.limitations.length >= 4);
});

test("keeps recorded probabilities distinct from documented models", () => {
  const result = buildProbabilisticScenarios({
    candles,
    recordedAnalyses: [{
      analysisId: "analysis-real-1",
      occurredAt: "2026-07-20T12:00:00.000Z",
      symbol: "EURUSD",
      direction: "BUY",
      probability: 0.63,
      decisionQuality: 0.74,
      riskReward: 1.8,
      riskPips: 18,
    }],
  });
  const recorded = result.scenarios.find(scenario => scenario.sourceType === "RECORDED_ANALYSIS");
  assert.equal(recorded?.originalProbability, 0.63);
  assert.equal(recorded?.scenarioId, "analysis-analysis-real-1");
});