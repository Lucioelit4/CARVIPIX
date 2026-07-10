import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "./indicatorFramework";

test("indicator framework computes EMA/ATR/RSI/ADX from candles", () => {
  const fw = new IndicatorFramework();
  const base = 1710000000000;

  for (let i = 0; i < 60; i++) {
    const close = 1.1 + i * 0.0001;
    fw.update(
      "EURUSD",
      "5M",
      {
        asset: "EURUSD",
        timeframe: "5M",
        timestamp: base + i * 5 * 60 * 1000,
        open: close - 0.00005,
        high: close + 0.0001,
        low: close - 0.0001,
        close,
        volume: 100,
        complete: true,
      },
      0.0002
    );
  }

  const latest = fw.getLatest("EURUSD", "5M");
  assert.ok(latest);
  assert.ok(Number.isFinite(latest?.ema20));
  assert.ok(Number.isFinite(latest?.atr));
  assert.ok(Number.isFinite(latest?.rsi));
  assert.ok(Number.isFinite(latest?.adx));
});

test("indicator framework comparator detects mismatches", () => {
  const fw = new IndicatorFramework();
  const result = fw.compareSeries([1, 2, 3], [1, 2.5, 3], 0.1);

  assert.equal(result.totalPoints, 3);
  assert.equal(result.mismatches, 1);
  assert.equal(result.mismatchIndices[0], 1);
});
