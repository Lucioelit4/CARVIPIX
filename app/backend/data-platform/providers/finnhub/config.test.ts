import test from "node:test";
import assert from "node:assert/strict";

import { getFinnhubRuntimeConfig } from "./config";

test("finnhub config blocks when api key is missing", () => {
  const previous = process.env.FINNHUB_API_KEY;
  delete process.env.FINNHUB_API_KEY;

  try {
    assert.throws(() => getFinnhubRuntimeConfig(), /BLOCKED_BY_EXTERNAL_DEPENDENCY: FINNHUB_API_KEY/);
  } finally {
    if (typeof previous === "undefined") {
      delete process.env.FINNHUB_API_KEY;
    } else {
      process.env.FINNHUB_API_KEY = previous;
    }
  }
});

test("finnhub config reads overrides", () => {
  const previous = {
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
    FINNHUB_TIMEOUT_MS: process.env.FINNHUB_TIMEOUT_MS,
    FINNHUB_MAX_RETRIES: process.env.FINNHUB_MAX_RETRIES,
  };

  process.env.FINNHUB_API_KEY = "dummy";
  process.env.FINNHUB_TIMEOUT_MS = "7000";
  process.env.FINNHUB_MAX_RETRIES = "2";

  try {
    const config = getFinnhubRuntimeConfig();
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
