import assert from "node:assert/strict";
import test from "node:test";

import { runSignalProfitabilityValidation } from "./signalProfitabilityValidation";

test("signal profitability validation returns required metrics and benchmarks", () => {
  const report = runSignalProfitabilityValidation();

  assert.ok(report.historicalWindow.samples > 0);
  assert.ok(report.forwardWindow.samples > 0);

  assert.ok(report.primary.executions.length > 0);
  assert.ok(report.primary.metrics.signalsEvaluated > 0);

  assert.ok(Object.keys(report.primary.byPair).includes("XAUUSD"));
  assert.ok(Object.keys(report.primary.byPair).includes("BTCUSD"));
  assert.ok(Object.keys(report.primary.byPair).includes("EURUSD"));
  assert.ok(Object.keys(report.primary.byPair).includes("GBPUSD"));
  assert.ok(Object.keys(report.primary.byPair).includes("USDJPY"));

  const decisions = new Set(report.primary.executions.map((item) => item.decision));
  assert.ok(decisions.has("BUY"));
  assert.ok(decisions.has("SELL"));
  assert.ok(decisions.has("WAIT") || decisions.has("NO_TRADE"));

  const classes = new Set(report.primary.executions.map((item) => item.classification));
  assert.ok(classes.has("A+"));
  assert.ok(classes.has("A"));
  assert.ok(classes.has("B") || classes.has("C"));

  assert.ok(Number.isFinite(report.primary.reportByGrade.APlus.winRate));
  assert.ok(Number.isFinite(report.primary.reportByGrade.A.profitFactor));
  assert.ok(Number.isFinite(report.primary.reportByGrade.B.expectancy));

  const slTpTracked = report.primary.executions.filter((item) => item.decision === "BUY" || item.decision === "SELL");
  assert.ok(slTpTracked.length > 0);
  assert.ok(slTpTracked.every((item) => item.entry !== null && item.sl !== null && item.tp !== null));
  assert.ok(slTpTracked.some((item) => item.outcome === "TP" || item.outcome === "SL" || item.outcome === "TIMEOUT"));

  assert.ok(Number.isFinite(report.primary.metrics.winRate));
  assert.ok(Number.isFinite(report.primary.metrics.profitFactor));
  assert.ok(Number.isFinite(report.primary.metrics.expectancy));
  assert.ok(Number.isFinite(report.primary.metrics.drawdown));
  assert.ok(Number.isFinite(report.primary.metrics.averageRR));
  assert.ok(Number.isFinite(report.primary.metrics.maxConsecutiveLosses));

  assert.ok(report.baselines.noTrade.mode === "no_trade");
  assert.ok(report.baselines.random.mode === "random");
  assert.ok(report.baselines.simpleEngine.mode === "simple_engine");

  assert.ok(report.conditionsWhereItWorks.length > 0 || report.conditionsWhereItFails.length > 0);
  assert.ok(report.minimumChangeRecommendations.length > 0);
});
