import test from "node:test";
import assert from "node:assert/strict";

import { RealDataProvider } from "./realDataProvider";

const assets = ["XAUUSD", "EURUSD"] as const;
const timeframes = ["5M", "45M", "1H"] as const;

test("real data provider emits synthetic pipeline market data once connected", async () => {
  const provider = new RealDataProvider([...assets], [...timeframes], {
    provider: "oanda",
    apiKey: "test-key",
  });

  await provider.connect();
  const data = await provider.getMarketData("EURUSD", "5M");

  assert.ok(data);
  assert.equal(data?.asset, "EURUSD");
  assert.equal(data?.timeframe, "5M");
  assert.ok(Number.isFinite(data?.indicators.ema20));
  assert.ok(Number.isFinite(data?.indicators.adx));

  await provider.disconnect();
});

test("real data provider health includes pipeline status", async () => {
  const provider = new RealDataProvider([...assets], [...timeframes], {
    provider: "oanda",
    apiKey: "test-key",
  });

  await provider.connect();
  await provider.getTick("XAUUSD");

  const health = await provider.getHealthStatus();
  assert.ok(health.lastUpdate > 0);
  assert.equal(health.dataProvider, "real");

  await provider.disconnect();
});
