import test from "node:test";
import assert from "node:assert/strict";

import { DATA_NOT_READY, MarketDataReadinessGate } from "./marketDataReadinessGate";

test("readiness gate blocks stale snapshot and invalid tick", () => {
  const gate = new MarketDataReadinessGate();

  const result = gate.evaluate({
    asset: "XAUUSD",
    snapshotUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
    tick: {
      asset: "XAUUSD",
      bid: 0,
      ask: 0,
      timestamp: Date.now() - 10 * 60_000,
      lastUpdate: Date.now() - 10 * 60_000,
    },
    requiredTimeframes: [
      {
        timeframe: "1H",
        closedCandles: 0,
        latestTimestamp: null,
        indicators: { ema200: 0, atr: 0, adx: 0 },
        chartImagePresent: false,
      },
      {
        timeframe: "45M",
        closedCandles: 0,
        latestTimestamp: null,
        indicators: { ema200: 0, atr: 0, adx: 0 },
        chartImagePresent: false,
      },
      {
        timeframe: "5M",
        closedCandles: 0,
        latestTimestamp: null,
        indicators: { ema200: 0, atr: 0, adx: 0 },
        chartImagePresent: false,
      },
    ],
  });

  assert.equal(result.pass, false);
  assert.equal(result.status, DATA_NOT_READY);
  assert.ok(result.reasons.includes("STALE_SNAPSHOT"));
  assert.ok(result.reasons.includes("INVALID_BID_ASK"));
  assert.ok(result.reasons.includes("MARKET_CLOSED_OR_STALE_TICK"));
  assert.ok(result.reasons.includes("EMPTY_CHART_1H"));
  assert.ok(result.reasons.includes("INSUFFICIENT_M5_HISTORY"));
  assert.ok(result.reasons.includes("INSUFFICIENT_M45_HISTORY"));
});

test("readiness gate passes when all requirements are satisfied", () => {
  const gate = new MarketDataReadinessGate();
  const now = Date.now();

  const result = gate.evaluate({
    asset: "XAUUSD",
    snapshotUtc: new Date(now).toISOString(),
    tick: {
      asset: "XAUUSD",
      bid: 2500.1,
      ask: 2500.3,
      timestamp: now,
      lastUpdate: now,
    },
    requiredTimeframes: [
      {
        timeframe: "1H",
        closedCandles: 260,
        latestTimestamp: now - 60_000,
        indicators: { ema200: 2499, atr: 5, adx: 20 },
        chartImagePresent: true,
      },
      {
        timeframe: "45M",
        closedCandles: 260,
        latestTimestamp: now - 60_000,
        indicators: { ema200: 2499, atr: 4, adx: 19 },
        chartImagePresent: true,
      },
      {
        timeframe: "5M",
        closedCandles: 400,
        latestTimestamp: now - 60_000,
        indicators: { ema200: 2499, atr: 1, adx: 18 },
        chartImagePresent: true,
      },
    ],
    marketActive: true,
  });

  assert.equal(result.pass, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.reasons.length, 0);
});