import test from "node:test";
import assert from "node:assert/strict";

import { MarketDataPipeline } from "./marketDataPipeline";

test("pipeline normalizes symbols and removes duplicate ticks", () => {
  const pipeline = new MarketDataPipeline();

  const first = pipeline.ingestTick({
    symbol: "xau/usd",
    timestamp: 1710000000,
    bid: 2500.1,
    ask: 2500.2,
    timezone: "UTC",
  });

  const duplicate = pipeline.ingestTick({
    symbol: "XAUUSD",
    timestamp: 1710000000,
    bid: 2500.1,
    ask: 2500.2,
    timezone: "UTC",
  });

  assert.ok(first);
  assert.equal(first?.asset, "XAUUSD");
  assert.equal(duplicate, null);
  assert.equal(pipeline.getStats().duplicatesIgnored, 1);
});

test("pipeline detects missing candles based on timeframe gaps", () => {
  const pipeline = new MarketDataPipeline();
  const t0 = 1710000000000;

  pipeline.ingestCandle(
    {
      symbol: "EURUSD",
      timestamp: t0,
      open: 1.1,
      high: 1.11,
      low: 1.09,
      close: 1.105,
      volume: 100,
      complete: true,
    },
    "5M"
  );

  pipeline.ingestCandle(
    {
      symbol: "EURUSD",
      timestamp: t0 + 15 * 60 * 1000,
      open: 1.106,
      high: 1.12,
      low: 1.1,
      close: 1.115,
      volume: 110,
      complete: true,
    },
    "5M"
  );

  assert.equal(pipeline.getStats().missingCandlesDetected, 2);
});
