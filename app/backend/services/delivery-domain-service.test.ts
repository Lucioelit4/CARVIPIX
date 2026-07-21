import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryQueueLayer } from "../core/queue";
import { DeliveryDomainService } from "./delivery-domain-service";

test("delivery enqueues references with idempotency", async () => {
  const queue = new InMemoryQueueLayer(2);
  const delivery = new DeliveryDomainService(queue);
  const reference = {
    signalId: "sig-del-1",
    analysisId: "ana-del-1",
    signalVersion: "cadp-v2",
  };

  const first = await delivery.enqueueReference(reference);
  const second = await delivery.enqueueReference(reference);
  const pending = await delivery.peek();

  assert.equal(first.reference.signalId, "sig-del-1");
  assert.equal(first.reference.analysisId, "ana-del-1");
  assert.equal(second.id, first.id);
  assert.equal(pending.length, 1);
});

test("delivery rejects malformed references and preserves queue failure status", async () => {
  const queue = new InMemoryQueueLayer(1);
  const delivery = new DeliveryDomainService(queue);

  const malformed = queue.enqueue({
    queue: "alerts",
    type: "master-signal-delivery",
    payload: { reference: { signalId: "", analysisId: "", signalVersion: "" } },
  });

  const processed = await delivery.processNext();
  assert.ok(processed);
  assert.equal(processed?.id, malformed.id);
  assert.equal(processed?.status, "failed");
});
