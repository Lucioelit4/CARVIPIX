import test from "node:test";
import assert from "node:assert/strict";

import { AIEvaluationQueue } from "./aiEvaluationQueue";

test("queue dedupes in-flight tasks", async () => {
  const queue = new AIEvaluationQueue();
  let runs = 0;

  const payload = {
    dedupeKey: "XAUUSD:SHORT:1.0.0:1",
    analysisId: "a1",
    symbol: "XAUUSD" as const,
    horizon: "SHORT" as const,
    strategyVersion: "1.0.0",
    candleCloseTimestamp: 1,
  };

  const p1 = queue.enqueue(payload, async () => {
    runs += 1;
    return 7;
  });
  const p2 = queue.enqueue(payload, async () => {
    runs += 1;
    return 9;
  });

  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(runs, 1);
  assert.equal(r1.value, 7);
  assert.equal(r2.value, 7);
  assert.equal(r2.dedupeKey, payload.dedupeKey);
});
