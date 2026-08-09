import assert from "node:assert/strict";
import test from "node:test";

import { IdempotencyStore } from "./idempotencyStore";
import { findReusableWait, type WaitDeduplicationCandidate } from "./waitDeduplication";

const NOW = Date.parse("2026-07-23T18:00:00.000Z");
const TTL = 30 * 60 * 1000;

function candidate(overrides: Partial<WaitDeduplicationCandidate> = {}): WaitDeduplicationCandidate {
  return {
    analysis_id: "analysis-original",
    canonical_symbol: "XAUUSD",
    status: "COMPLETED",
    response_valid: true,
    decision: "WAIT",
    scenario_signature: "signature-a",
    recorded_at_ms: NOW - 10_000,
    timestamp_utc_ms: NOW - 10_000,
    ...overrides,
  };
}

test("same WAIT signature inside TTL is reusable", () => {
  assert.equal(findReusableWait({ candidates: [candidate()], symbol: "XAUUSD", scenarioSignature: "signature-a", ttlMs: TTL, nowMs: NOW })?.analysis_id, "analysis-original");
});

test("different or expired WAIT signature is not reusable", () => {
  assert.equal(findReusableWait({ candidates: [candidate()], symbol: "XAUUSD", scenarioSignature: "signature-b", ttlMs: TTL, nowMs: NOW }), undefined);
  assert.equal(findReusableWait({ candidates: [candidate({ recorded_at_ms: NOW - TTL - 1 })], symbol: "XAUUSD", scenarioSignature: "signature-a", ttlMs: TTL, nowMs: NOW }), undefined);
});

test("concurrent equal signatures execute the new call once", async () => {
  const locks = new IdempotencyStore();
  const completed: WaitDeduplicationCandidate[] = [];
  let calls = 0;
  const execute = async () => {
    const release = await locks.acquireExecutionLock("signature-a");
    try {
      if (findReusableWait({ candidates: completed, symbol: "XAUUSD", scenarioSignature: "signature-a", ttlMs: TTL, nowMs: NOW })) return "REUSED";
      calls += 1;
      await Promise.resolve();
      completed.push(candidate());
      return "NEW";
    } finally {
      release();
    }
  };
  assert.deepEqual((await Promise.all([execute(), execute()])).sort(), ["NEW", "REUSED"]);
  assert.equal(calls, 1);
});