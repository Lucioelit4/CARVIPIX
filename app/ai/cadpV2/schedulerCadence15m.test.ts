import assert from "node:assert/strict";
import test from "node:test";

import { AdaptiveScheduler, FIXED_SLOT_INTERVAL_MS } from "./schedulerAdaptativo";
import type { CanonicalSymbol } from "./typesMaestroV3";

const SYMBOLS: CanonicalSymbol[] = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD"];

function utcMs(hour: number, minute: number, second = 0): number {
  return Date.UTC(2026, 7, 3, hour, minute, second);
}

test("each active symbol keeps a 900-second cadence", () => {
  const start = utcMs(0, 0);
  for (const symbol of SYMBOLS) {
    const first = AdaptiveScheduler.computeNextSlotUtcMs(symbol, start);
    const second = AdaptiveScheduler.computeNextSlotUtcMs(symbol, first);
    assert.equal(second - first, FIXED_SLOT_INTERVAL_MS);
  }
});

test("active symbol offsets are staggered by three minutes", () => {
  const reference = utcMs(0, 0, 5);
  const slots = SYMBOLS.map((symbol) => AdaptiveScheduler.computeCurrentOrNextSlotUtcMs(symbol, reference));
  assert.deepEqual(slots.map((slot) => (slot - slots[0]) / 60_000), [0, 3, 6, 9]);
});

test("claiming a due slot advances only that symbol by 15 minutes", () => {
  const scheduler = new AdaptiveScheduler();
  scheduler.initialize(utcMs(0, 0, 10), SYMBOLS);

  assert.deepEqual(scheduler.getInstrumentsDue(utcMs(0, 0, 10)).map(({ symbol }) => symbol), ["XAUUSD"]);
  assert.equal(scheduler.getInstrumentsDue(utcMs(0, 1)).some(({ symbol }) => symbol === "XAUUSD"), false);
  assert.equal(scheduler.getInstrumentsDue(utcMs(0, 15, 1)).some(({ symbol }) => symbol === "XAUUSD"), true);
});

test("adaptive response cannot replace the fixed 15-minute cadence", () => {
  const scheduler = new AdaptiveScheduler();
  const now = utcMs(0, 0, 10);
  scheduler.initialize(now, SYMBOLS);
  scheduler.getInstrumentsDue(now);
  scheduler.updateFromAdaptiveState("XAUUSD", {
    proximity_to_entry: "IMMEDIATE",
    recheck_minutes: 5,
    watch_conditions: [],
    wake_up_triggers: [],
    missing_for_entry: null,
    scenario_classification: "READY",
  }, now);

  assert.equal(scheduler.getSchedule("XAUUSD")?.recheck_minutes, 15);
  assert.equal(scheduler.getSchedule("XAUUSD")?.next_review_at_ms, utcMs(0, 15));
});
