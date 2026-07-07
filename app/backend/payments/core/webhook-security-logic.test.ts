import test from "node:test";
import assert from "node:assert/strict";

import {
  isWebhookPayloadWithinLimit,
  isWebhookTimestampWithinTolerance,
  normalizeWebhookProvider,
  parseWebhookTimestampMillis,
} from "./webhook-security-logic";

test("normalizeWebhookProvider accepts only supported providers", () => {
  assert.equal(normalizeWebhookProvider("custom"), "custom");
  assert.equal(normalizeWebhookProvider("stripe"), "stripe");
  assert.equal(normalizeWebhookProvider("invalid"), null);
});

test("isWebhookPayloadWithinLimit validates payload size", () => {
  assert.equal(isWebhookPayloadWithinLimit("abc", 3), true);
  assert.equal(isWebhookPayloadWithinLimit("abcd", 3), false);
});

test("parseWebhookTimestampMillis accepts unix and ISO", () => {
  assert.equal(parseWebhookTimestampMillis("1735689600"), 1735689600000);
  assert.equal(parseWebhookTimestampMillis("2026-01-01T00:00:00.000Z"), 1767225600000);
  assert.equal(parseWebhookTimestampMillis("bad"), null);
});

test("isWebhookTimestampWithinTolerance enforces replay window", () => {
  assert.equal(
    isWebhookTimestampWithinTolerance({
      timestampMs: 1767225600000,
      nowMs: 1767225600000 + 60_000,
      toleranceMs: 5 * 60_000,
    }),
    true
  );

  assert.equal(
    isWebhookTimestampWithinTolerance({
      timestampMs: 1767225600000,
      nowMs: 1767225600000 + 10 * 60_000,
      toleranceMs: 5 * 60_000,
    }),
    false
  );
});
