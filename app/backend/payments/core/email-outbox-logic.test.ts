import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPaymentEmailDedupeKey,
  calculateNextRetryAt,
  getRetryBackoffSeconds,
  resolvePaymentEmailTemplateId,
  shouldFinalizeAsFailed,
} from "./email-outbox-logic";

test("resolvePaymentEmailTemplateId maps approved webhook events", () => {
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "payment_captured", productType: "plan_pro" }), "membership-payment-confirmed");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "payment_captured", productType: "bot" }), "bot-license-delivery-ready");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "subscription_renewed" }), "membership-renewal");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "payment_failed" }), "payment-failed");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "subscription_payment_failed" }), "payment-failed");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "payment_refunded" }), "payment-refunded");
  assert.equal(resolvePaymentEmailTemplateId({ eventType: "unknown" }), null);
});

test("buildPaymentEmailDedupeKey is stable for same transaction + event", () => {
  const a = buildPaymentEmailDedupeKey({
    transactionId: "ptx-1",
    eventType: "payment_captured",
    providerPaymentId: "pay-1",
  });
  const b = buildPaymentEmailDedupeKey({
    transactionId: "ptx-1",
    eventType: "payment_captured",
    providerPaymentId: "pay-1",
  });
  const c = buildPaymentEmailDedupeKey({
    transactionId: "ptx-1",
    eventType: "payment_captured",
    providerPaymentId: "pay-2",
  });

  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("payment_captured repeated webhook maps to one dedupe key", () => {
  const first = buildPaymentEmailDedupeKey({
    transactionId: "ptx-captured-1",
    eventType: "payment_captured",
    providerPaymentId: "pay-captured-1",
  });
  const repeated = buildPaymentEmailDedupeKey({
    transactionId: "ptx-captured-1",
    eventType: "payment_captured",
    providerPaymentId: "pay-captured-1",
  });

  assert.equal(first, repeated);
});

test("getRetryBackoffSeconds scales as expected", () => {
  assert.equal(getRetryBackoffSeconds(1), 60);
  assert.equal(getRetryBackoffSeconds(2), 300);
  assert.equal(getRetryBackoffSeconds(3), 900);
  assert.equal(getRetryBackoffSeconds(4), 3600);
  assert.equal(getRetryBackoffSeconds(5), 14400);
});

test("calculateNextRetryAt adds backoff to now", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const next = calculateNextRetryAt({ now, attempt: 2 });
  assert.equal(next.toISOString(), "2026-01-01T00:05:00.000Z");
});

test("shouldFinalizeAsFailed respects retry ceiling", () => {
  assert.equal(shouldFinalizeAsFailed({ attempt: 3, maxRetries: 5 }), false);
  assert.equal(shouldFinalizeAsFailed({ attempt: 5, maxRetries: 5 }), true);
});
