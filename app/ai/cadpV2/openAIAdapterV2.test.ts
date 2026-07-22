import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateRetryDelayMs,
  OpenAIAdapterV2,
  parseRetryAfterMs,
} from "./openAIAdapterV2";

test("retry delay honors seconds and HTTP-date Retry-After values", () => {
  const now = Date.parse("2026-07-18T12:00:00.000Z");

  assert.equal(parseRetryAfterMs("12", now), 12_000);
  assert.equal(parseRetryAfterMs("Sat, 18 Jul 2026 12:00:45 GMT", now), 45_000);
  assert.equal(parseRetryAfterMs("invalid", now), null);
});

test("retry delay uses exponential backoff with bounded jitter", () => {
  assert.equal(calculateRetryDelayMs({ retryNumber: 1, retryBaseMs: 750, random: () => 0 }), 750);
  assert.equal(calculateRetryDelayMs({ retryNumber: 3, retryBaseMs: 750, random: () => 0.5 }), 3_375);
  assert.equal(calculateRetryDelayMs({ retryNumber: 1, retryBaseMs: 750, retryAfterMs: 20_000, random: () => 0 }), 20_000);
});

test("openai adapter v2 blocks when credentials are missing", async () => {
  const prevKey = process.env.OPENAI_API_KEY;
  const prevModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;

  const adapter = new OpenAIAdapterV2();
  await assert.rejects(
    () => adapter.analyze({
      promptText: "{}",
      responseSchemaName: "schema",
      responseSchema: { type: "object", additionalProperties: false, properties: {} },
    }),
    /BLOCKED_BY_EXTERNAL_DEPENDENCY/
  );

  if (prevKey != null) process.env.OPENAI_API_KEY = prevKey;
  else delete process.env.OPENAI_API_KEY;
  if (prevModel != null) process.env.OPENAI_MODEL = prevModel;
  else delete process.env.OPENAI_MODEL;
});
