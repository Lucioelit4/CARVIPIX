import test from "node:test";
import assert from "node:assert/strict";

import { CandleBuilder } from "./candleBuilder";

test("candle builder emits completed 5M candle when bucket changes", () => {
  const builder = new CandleBuilder();

  const base = 1710000000000;
  const emitted1 = builder.ingestTick({
    asset: "XAUUSD",
    timestamp: base,
    bid: 2500,
    ask: 2500.2,
    lastUpdate: base,
  });

  const emitted2 = builder.ingestTick({
    asset: "XAUUSD",
    timestamp: base + 5 * 60 * 1000,
    bid: 2501,
    ask: 2501.2,
    lastUpdate: base + 5 * 60 * 1000,
  });

  assert.equal(emitted1.length, 0);
  assert.equal(emitted2.length, 1);
  assert.equal(emitted2[0].timeframe, "5M");
  assert.equal(emitted2[0].complete, true);
});

test("candle builder tracks timeframe gaps", () => {
  const builder = new CandleBuilder();
  const base = 1710000000000;

  builder.ingestTick({
    asset: "EURUSD",
    timestamp: base,
    bid: 1.1,
    ask: 1.1002,
    lastUpdate: base,
  });

  builder.ingestTick({
    asset: "EURUSD",
    timestamp: base + 15 * 60 * 1000,
    bid: 1.101,
    ask: 1.1012,
    lastUpdate: base + 15 * 60 * 1000,
  });

  const gaps = builder.getDetectedGaps();
  assert.ok(gaps.length > 0);
  assert.equal(gaps[0].timeframe, "5M");
});
