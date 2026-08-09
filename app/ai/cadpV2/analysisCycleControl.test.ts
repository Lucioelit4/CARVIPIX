import assert from "node:assert/strict";
import test from "node:test";

import { AnalysisCycleControl, MIN_CYCLE_INTERVAL_MS, type MarketAvailabilitySnapshot } from "./analysisCycleControl";

const NOW = Date.parse("2026-07-27T10:00:00.000Z");
const CANDLE = NOW - 5 * 60 * 1000;
const market: MarketAvailabilitySnapshot = {
  marketOpen: true,
  inMaintenance: false,
  minutesToClose: 180,
  minutesSinceOpen: 120,
  weeklyClosed: false,
  holidayClosed: false,
};

test("active cycle blocks the same symbol", () => {
  const control = new AnalysisCycleControl();
  control.enter("XAUUSD", NOW);
  const result = control.evaluate({ symbol: "XAUUSD", nowUtcMs: NOW + 1, lastClosedCandleTs: CANDLE, market });
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.equal(result.reason, "SKIPPED_DUPLICATE");
});

test("a new scheduled turn is allowed for each symbol", () => {
  const control = new AnalysisCycleControl();
  control.enter("XAUUSD", NOW);
  control.leave("XAUUSD", CANDLE);

  const xau = control.evaluate({ symbol: "XAUUSD", nowUtcMs: NOW + MIN_CYCLE_INTERVAL_MS - 1, lastClosedCandleTs: CANDLE + 300_000, market });
  const eur = control.evaluate({ symbol: "EURUSD", nowUtcMs: NOW + 1, lastClosedCandleTs: CANDLE, market });
  assert.equal(xau.allowed, true);
  assert.equal(eur.allowed, true);
});

test("same closed candle is allowed on the next scheduled turn", () => {
  const control = new AnalysisCycleControl();
  control.enter("XAUUSD", NOW);
  control.leave("XAUUSD", CANDLE);
  const result = control.evaluate({ symbol: "XAUUSD", nowUtcMs: NOW + MIN_CYCLE_INTERVAL_MS, lastClosedCandleTs: CANDLE, market });
  assert.equal(result.allowed, true);
});

test("pre-close and post-open context do not block an open market", () => {
  const control = new AnalysisCycleControl();
  const preClose = control.evaluate({
    symbol: "XAUUSD",
    nowUtcMs: NOW,
    lastClosedCandleTs: CANDLE,
    market: { ...market, minutesToClose: 5 },
  });
  const postOpen = control.evaluate({
    symbol: "EURUSD",
    nowUtcMs: NOW,
    lastClosedCandleTs: CANDLE,
    market: { ...market, minutesSinceOpen: 1 },
  });
  assert.equal(preClose.allowed, true);
  assert.equal(postOpen.allowed, true);
});