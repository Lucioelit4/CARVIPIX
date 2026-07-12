import test from "node:test";
import assert from "node:assert/strict";

import type { Candle } from "../../engine/types/marketData";
import { VisualChartRenderer } from "./visualChartRenderer";

function candles(tf: "1H" | "45M" | "5M"): Candle[] {
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => ({
    timestamp: now - (20 - i) * 300000,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100.5 + i,
    volume: 10,
    asset: "XAUUSD",
    timeframe: tf,
    complete: i < 19,
  }));
}

test("visual renderer generates deterministic chart manifest metadata", () => {
  const renderer = new VisualChartRenderer();
  const image = renderer.render({
    analysisId: "analysis_visual_1",
    snapshotUtc: new Date().toISOString(),
    timeframe: "1H",
    candles: candles("1H"),
    ema20: 1,
    ema50: 2,
    ema200: 3,
    structuralHighs: [1],
    structuralLows: [0],
    supportZones: [0],
    resistanceZones: [1],
    currentPrice: 101,
  });

  assert.equal(image.timeframe, "1H");
  assert.equal(image.source_snapshot_id, "analysis_visual_1");
  assert.ok(image.filename.endsWith(".svg"));
  assert.ok(image.sha256.length > 0);
});
