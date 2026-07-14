import test from "node:test";
import assert from "node:assert/strict";

import { getTwelveDataRuntimeConfig } from "./config";
import { redactApikeyFromEndpoint } from "./errors";

test("twelve data config blocks when api key is missing", () => {
  const previous = process.env.TWELVE_DATA_API_KEY;
  delete process.env.TWELVE_DATA_API_KEY;

  try {
    assert.throws(() => getTwelveDataRuntimeConfig(), /BLOCKED_BY_EXTERNAL_DEPENDENCY: TWELVE_DATA_API_KEY/);
  } finally {
    if (typeof previous === "undefined") {
      delete process.env.TWELVE_DATA_API_KEY;
    } else {
      process.env.TWELVE_DATA_API_KEY = previous;
    }
  }
});

test("twelve data config reads overrides", () => {
  const previous = {
    TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY,
    TWELVE_DATA_TIMEOUT_MS: process.env.TWELVE_DATA_TIMEOUT_MS,
    TWELVE_DATA_MAX_RETRIES: process.env.TWELVE_DATA_MAX_RETRIES,
  };

  process.env.TWELVE_DATA_API_KEY = "dummy";
  process.env.TWELVE_DATA_TIMEOUT_MS = "7000";
  process.env.TWELVE_DATA_MAX_RETRIES = "2";

  try {
    const config = getTwelveDataRuntimeConfig();
    assert.equal(config.apiKey, "dummy");
    assert.equal(config.timeoutMs, 7000);
    assert.equal(config.maxRetries, 2);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("redacts apikey in endpoint", () => {
  const safe = redactApikeyFromEndpoint("https://api.twelvedata.com/quote?symbol=BTC/USD&apikey=secret-token");
  assert.match(safe, /apikey=\*\*\*/);
  assert.doesNotMatch(safe, /secret-token/);
});
