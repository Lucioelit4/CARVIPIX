import assert from "node:assert/strict";
import test from "node:test";

import { masterSignalStore } from "@/app/ai/cadpV2/masterSignalStore";
import { InMemoryQueueLayer } from "../core/queue";
import { DeliveryDomainService } from "./delivery-domain-service";

test("delivery enqueues reference from latest master signal with idempotency", async () => {
  masterSignalStore.save({
    signal_id: "sig-del-1",
    analysis_id: "ana-del-1",
    symbol: "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
    selected_strategy_id: "CARVIPIX_NO_TRADE_V1",
    direction: "NONE",
    entry: 0,
    stop_loss: 0,
    take_profit: 0,
    calculated_gross_rr: 0,
    calculated_net_rr: 0,
    expires_at: null,
    status: "SHADOW",
    human_review_required: true,
    auto_execution_eligible: false,
  });

  const queue = new InMemoryQueueLayer(2);
  const delivery = new DeliveryDomainService(queue);

  const first = await delivery.enqueueFromLatestSignal("cadp-v2");
  const second = await delivery.enqueueFromLatestSignal("cadp-v2");
  const pending = await delivery.peek();

  assert.ok(first);
  assert.ok(second);
  assert.equal(first?.reference.signalId, "sig-del-1");
  assert.equal(first?.reference.analysisId, "ana-del-1");
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
