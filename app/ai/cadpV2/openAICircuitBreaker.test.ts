import assert from "node:assert/strict";
import test from "node:test";

import { OpenAICircuitBreaker } from "./openAICircuitBreaker";

test("circuit allows one recovery probe after cooldown and closes on success", () => {
  let now = Date.parse("2026-07-18T12:00:00.000Z");
  const circuit = new OpenAICircuitBreaker(5, 60_000, () => now);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(circuit.allowRequest(), true);
    circuit.recordFailure();
  }

  assert.equal(circuit.getSnapshot().state, "OPEN");
  assert.equal(circuit.allowRequest(), false);

  now += 60_000;
  assert.equal(circuit.allowRequest(), true);
  assert.equal(circuit.getSnapshot().state, "HALF_OPEN");
  assert.equal(circuit.allowRequest(), false);

  circuit.recordSuccess();
  assert.equal(circuit.getSnapshot().state, "CLOSED");
  assert.equal(circuit.allowRequest(), true);
});

test("failed recovery probe reopens for the longer Retry-After cooldown", () => {
  let now = Date.parse("2026-07-18T12:00:00.000Z");
  const circuit = new OpenAICircuitBreaker(1, 60_000, () => now);

  circuit.recordFailure();
  now += 60_000;
  assert.equal(circuit.allowRequest(), true);

  circuit.recordFailure(120_000);
  assert.equal(circuit.getSnapshot().state, "OPEN");
  now += 60_000;
  assert.equal(circuit.allowRequest(), false);
  now += 60_000;
  assert.equal(circuit.allowRequest(), true);
});