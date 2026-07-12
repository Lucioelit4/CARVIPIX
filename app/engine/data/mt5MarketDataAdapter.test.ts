import test from "node:test";
import assert from "node:assert/strict";

import { MT5MarketDataAdapter } from "./mt5MarketDataAdapter";

const backup = {
  MT5_BRIDGE_BASE_URL: process.env.MT5_BRIDGE_BASE_URL,
};

test.afterEach(() => {
  process.env.MT5_BRIDGE_BASE_URL = backup.MT5_BRIDGE_BASE_URL;
});

test("blocks when MT5 bridge credentials are missing", () => {
  process.env.MT5_BRIDGE_BASE_URL = "";

  const adapter = new MT5MarketDataAdapter(["XAUUSD"], ["5M", "45M", "1H"]);
  assert.throws(() => adapter.ensureCredentialsOrThrow(), /BLOCKED_BY_EXTERNAL_DEPENDENCY/);
});