import test from "node:test";
import assert from "node:assert/strict";

import { OandaV20DemoAdapter } from "./oandaV20DemoAdapter";

const backup = {
  OANDA_API_TOKEN: process.env.OANDA_API_TOKEN,
  OANDA_ACCOUNT_ID: process.env.OANDA_ACCOUNT_ID,
  OANDA_BASE_URL: process.env.OANDA_BASE_URL,
};

function restoreEnv(): void {
  process.env.OANDA_API_TOKEN = backup.OANDA_API_TOKEN;
  process.env.OANDA_ACCOUNT_ID = backup.OANDA_ACCOUNT_ID;
  process.env.OANDA_BASE_URL = backup.OANDA_BASE_URL;
}

test("blocks when OANDA demo credentials are missing", () => {
  process.env.OANDA_API_TOKEN = "";
  process.env.OANDA_ACCOUNT_ID = "";
  process.env.OANDA_BASE_URL = "https://api-fxpractice.oanda.com";

  const adapter = new OandaV20DemoAdapter();
  assert.throws(() => adapter.ensureCredentialsOrThrow(), /BLOCKED_BY_EXTERNAL_DEPENDENCY: OANDA_DEMO_CREDENTIALS/);

  restoreEnv();
});

test("maps XAUUSD to XAU_USD", () => {
  const adapter = new OandaV20DemoAdapter({
    apiToken: "demo",
    accountId: "demo-account",
    baseUrl: "https://api-fxpractice.oanda.com",
  });

  assert.equal(adapter.resolveInstrument("XAUUSD"), "XAU_USD");
});

test("builds 5M 45M and 1H aggregates and validates candles", () => {
  const adapter = new OandaV20DemoAdapter({
    apiToken: "demo",
    accountId: "demo-account",
    baseUrl: "https://api-fxpractice.oanda.com",
  });

  const start = Date.UTC(2026, 5, 1, 0, 0, 0, 0);
  const m1 = Array.from({ length: 120 }, (_, i) => ({
    asset: "XAUUSD" as const,
    timeframe: "5M" as const,
    timestamp: start + i * 60_000,
    open: 3300 + i * 0.01,
    high: 3300 + i * 0.01 + 0.2,
    low: 3300 + i * 0.01 - 0.2,
    close: 3300 + i * 0.01 + 0.05,
    volume: 10 + i,
    complete: true,
  }));

  const validation = adapter.validateM1Candles(m1);
  assert.equal(validation.totalCandles, 120);
  assert.equal(validation.invalidOhlc, 0);
  assert.equal(validation.duplicateTimestamps, 0);
  assert.equal(validation.nonIncreasingTimestamps, 0);

  const aggregated = adapter.buildAggregatesFromM1("XAUUSD", m1);
  assert.equal(aggregated["5M"].length, 24);
  assert.equal(aggregated["45M"].length, 3);
  assert.equal(aggregated["1H"].length, 2);

  const pipeline = adapter.runPipeline("XAUUSD", aggregated);
  assert.ok(pipeline.latest5M);
  assert.ok(pipeline.latest45M);
  assert.ok(pipeline.latest1H);
  assert.ok(pipeline.stats.candlesIngested > 0);
});
