import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "./indicatorFramework";

function adxReference(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2 * period + 1 || lows.length < 2 * period + 1 || closes.length < 2 * period + 1) {
    return Number.NaN;
  }

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const prevClose = closes[i - 1];
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose)));
  }

  let smoothedTR = tr.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedPlus = plusDM.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedMinus = minusDM.slice(0, period).reduce((sum, v) => sum + v, 0);

  const dxValues: number[] = [];

  const seedDiPlus = smoothedTR > 0 ? (100 * smoothedPlus) / smoothedTR : 0;
  const seedDiMinus = smoothedTR > 0 ? (100 * smoothedMinus) / smoothedTR : 0;
  const seedSum = seedDiPlus + seedDiMinus;
  dxValues.push(seedSum > 0 ? (100 * Math.abs(seedDiPlus - seedDiMinus)) / seedSum : 0);

  for (let i = period; i < tr.length; i++) {
    smoothedTR = smoothedTR - smoothedTR / period + tr[i];
    smoothedPlus = smoothedPlus - smoothedPlus / period + plusDM[i];
    smoothedMinus = smoothedMinus - smoothedMinus / period + minusDM[i];

    if (smoothedTR <= 0) {
      dxValues.push(0);
      continue;
    }

    const diPlus = (100 * smoothedPlus) / smoothedTR;
    const diMinus = (100 * smoothedMinus) / smoothedTR;
    const diSum = diPlus + diMinus;
    dxValues.push(diSum > 0 ? (100 * Math.abs(diPlus - diMinus)) / diSum : 0);
  }

  if (dxValues.length < period) {
    return Number.NaN;
  }

  let adx = dxValues.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adx = ((adx * (period - 1)) + dxValues[i]) / period;
  }
  return adx;
}

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

test("adx is finite and bounded 0-100 for sufficient history", () => {
  const fw = new IndicatorFramework();
  const base = 1711000000000;

  for (let i = 0; i < 120; i++) {
    const close = 1800 + Math.sin(i / 7) * 4 + i * 0.05;
    fw.update(
      "XAUUSD",
      "5M",
      {
        asset: "XAUUSD",
        timeframe: "5M",
        timestamp: base + i * 5 * 60 * 1000,
        open: close - 0.7,
        high: close + 1.2,
        low: close - 1.4,
        close,
        volume: 100 + i,
        complete: true,
      },
      0.2
    );
  }

  const latest = fw.getLatest("XAUUSD", "5M");
  assert.ok(latest);
  assert.ok(Number.isFinite(latest?.adx));
  assert.ok((latest?.adx ?? -1) >= 0);
  assert.ok((latest?.adx ?? 101) <= 100);
});

test("adx returns non-finite when history is insufficient", () => {
  const fw = new IndicatorFramework();
  const base = 1712000000000;

  for (let i = 0; i < 20; i++) {
    const close = 1.2 + i * 0.0002;
    fw.update(
      "EURUSD",
      "5M",
      {
        asset: "EURUSD",
        timeframe: "5M",
        timestamp: base + i * 5 * 60 * 1000,
        open: close - 0.0001,
        high: close + 0.0002,
        low: close - 0.0002,
        close,
        volume: 50,
        complete: true,
      },
      0.0002
    );
  }

  const latest = fw.getLatest("EURUSD", "5M");
  assert.ok(latest);
  assert.ok(!Number.isFinite(latest?.adx ?? Number.NaN));
});

test("adx matches reference implementation within tolerance", () => {
  const fw = new IndicatorFramework();
  const base = 1713000000000;
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];

  for (let i = 0; i < 160; i++) {
    const close = 3300 + Math.sin(i / 8) * 8 + Math.cos(i / 11) * 5 + i * 0.03;
    const high = close + 2.1 + Math.abs(Math.sin(i));
    const low = close - 2.3 - Math.abs(Math.cos(i));
    highs.push(high);
    lows.push(low);
    closes.push(close);

    fw.update(
      "XAUUSD",
      "1H",
      {
        asset: "XAUUSD",
        timeframe: "1H",
        timestamp: base + i * 60 * 60 * 1000,
        open: close - 0.8,
        high,
        low,
        close,
        volume: 200 + i,
        complete: true,
      },
      0.3
    );
  }

  const latest = fw.getLatest("XAUUSD", "1H");
  const ref = adxReference(highs, lows, closes, 14);

  assert.ok(latest);
  assert.ok(Number.isFinite(latest?.adx));
  assert.ok(Number.isFinite(ref));
  assert.ok(Math.abs((latest?.adx ?? 0) - ref) < 1e-8);
});
