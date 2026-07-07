import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMercadoPagoWebhookManifest,
  buildWebhookFingerprint,
  extractMercadoPagoWebhookDataId,
  deriveOrderTargetStatus,
  deriveTransactionStatusPath,
  isUniqueViolation,
  normalizeMercadoPagoWebhookTopic,
  normalizeWebhookEventType,
} from "./webhook-logic";

test("normalizeWebhookEventType maps aliases", () => {
  assert.equal(normalizeWebhookEventType("authorized"), "payment_authorized");
  assert.equal(normalizeWebhookEventType("payment.succeeded"), "payment_captured");
  assert.equal(normalizeWebhookEventType("refund.succeeded"), "payment_refunded");
  assert.equal(normalizeWebhookEventType("something-new"), "unknown");
});

test("buildWebhookFingerprint is deterministic", () => {
  const a = buildWebhookFingerprint({ provider: "custom", providerEventId: "evt-1", payloadRaw: "{\"a\":1}" });
  const b = buildWebhookFingerprint({ provider: "custom", providerEventId: "evt-1", payloadRaw: "{\"a\":1}" });
  const c = buildWebhookFingerprint({ provider: "custom", providerEventId: "evt-2", payloadRaw: "{\"a\":1}" });

  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("deriveTransactionStatusPath provides capture path", () => {
  assert.deepEqual(deriveTransactionStatusPath("initiated", "payment_captured"), ["authorized", "captured"]);
  assert.deepEqual(deriveTransactionStatusPath("authorized", "payment_captured"), ["captured"]);
});

test("deriveOrderTargetStatus supports partial and full refunds", () => {
  assert.equal(
    deriveOrderTargetStatus({ current: "paid", eventType: "payment_refunded", refundedAmount: 50, orderTotal: 100 }),
    "partially_refunded"
  );
  assert.equal(
    deriveOrderTargetStatus({ current: "paid", eventType: "payment_refunded", refundedAmount: 100, orderTotal: 100 }),
    "refunded"
  );
});

test("isUniqueViolation detects duplicate key error", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation({ message: "duplicate key value violates unique constraint" }), true);
  assert.equal(isUniqueViolation({ code: "500" }), false);
});

test("normalizeMercadoPagoWebhookTopic maps the common topics", () => {
  assert.equal(normalizeMercadoPagoWebhookTopic("payment"), "payment");
  assert.equal(normalizeMercadoPagoWebhookTopic("preapproval"), "subscription_preapproval");
  assert.equal(normalizeMercadoPagoWebhookTopic("authorized_payment"), "subscription_authorized_payment");
  assert.equal(normalizeMercadoPagoWebhookTopic("orders"), "order");
  assert.equal(normalizeMercadoPagoWebhookTopic("topic_claims_integration_wh"), "claims");
  assert.equal(normalizeMercadoPagoWebhookTopic("nope"), "unknown");
});

test("extractMercadoPagoWebhookDataId prefers data.id then resource then id", () => {
  assert.equal(extractMercadoPagoWebhookDataId({ data: { id: "123" } }), "123");
  assert.equal(extractMercadoPagoWebhookDataId({ resource: "/v1/payments/999" }), "999");
  assert.equal(extractMercadoPagoWebhookDataId({ id: "abc" }), "abc");
});

test("buildMercadoPagoWebhookManifest keeps canonical field order", () => {
  assert.equal(
    buildMercadoPagoWebhookManifest({ dataId: "123", requestId: "req-1", timestamp: "1704908010" }),
    "id:123;request-id:req-1;ts:1704908010;"
  );
});
