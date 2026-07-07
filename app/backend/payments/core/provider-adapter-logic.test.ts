import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMercadoPagoWebhookSignatureManifest,
  buildMockCheckoutSession,
  parseMockWebhookEvent,
  parseMercadoPagoWebhookEvent,
  parseMercadoPagoWebhookSignature,
  resolveEffectiveProvider,
  resolveMercadoPagoCredentials,
  resolveMercadoPagoEnvironment,
  signMercadoPagoWebhookManifest,
  signMockWebhookPayload,
  verifyMercadoPagoWebhookSignature,
  verifyMockWebhookSignature,
} from "./provider-adapter-logic";

function withEnv(overrides: Record<string, string | undefined>) {
  const snapshot = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    snapshot.set(key, process.env[key]);
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const [key, value] of snapshot.entries()) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

test("resolveEffectiveProvider prioritizes preferred provider", () => {
  const provider = resolveEffectiveProvider({
    preferredProvider: "mercadopago",
    runtimeActiveProvider: "stripe",
    envProvider: "openpay",
  });

  assert.equal(provider, "mercadopago");
});

test("resolveEffectiveProvider falls back to custom for invalid values", () => {
  const provider = resolveEffectiveProvider({
    preferredProvider: "invalid",
    runtimeActiveProvider: "legacy",
    envProvider: "unknown",
  });

  assert.equal(provider, "custom");
});

test("buildMockCheckoutSession returns deterministic contract fields", () => {
  const session = buildMockCheckoutSession({
    provider: "custom",
    orderId: "pord-123",
    returnUrl: "http://localhost:3000/checkout/success",
    now: new Date("2026-01-01T00:00:00.000Z"),
    randomFragment: "abc123",
  });

  assert.equal(session.provider, "custom");
  assert.equal(session.providerCheckoutId, "custom-checkout-1767225600000-abc123");
  assert.equal(
    session.checkoutUrl,
    "http://localhost:3000/checkout/success?providerCheckoutId=custom-checkout-1767225600000-abc123&orderId=pord-123"
  );
  assert.equal(session.raw.connectionStatus, "not_connected");
});

test("verifyMockWebhookSignature validates HMAC-SHA256", () => {
  const payloadRaw = JSON.stringify({ eventId: "evt-1", eventType: "payment.succeeded" });
  const secret = "phase3-secret";
  const signature = signMockWebhookPayload(payloadRaw, secret);

  assert.equal(
    verifyMockWebhookSignature({
      payloadRaw,
      headers: { "x-mock-signature": signature },
      webhookSecret: secret,
    }),
    true
  );

  assert.equal(
    verifyMockWebhookSignature({
      payloadRaw,
      headers: { "x-mock-signature": "invalid" },
      webhookSecret: secret,
    }),
    false
  );
});

test("parseMockWebhookEvent returns canonical payload", () => {
  const payloadRaw = JSON.stringify({
    eventId: "evt-22",
    eventType: "payment.failed",
    paymentOrderId: "pord-1",
    providerCheckoutId: "chk-1",
    providerPaymentId: "pay-1",
    amount: 149.5,
    currency: "USD",
    failureReason: "insufficient_funds",
    occurredAt: "2026-01-01T00:00:00.000Z",
  });

  const event = parseMockWebhookEvent({ payloadRaw });

  assert.equal(event.providerEventId, "evt-22");
  assert.equal(event.eventType, "payment_failed");
  assert.equal(event.paymentOrderId, "pord-1");
  assert.equal(event.providerCheckoutId, "chk-1");
  assert.equal(event.providerPaymentId, "pay-1");
  assert.deepEqual(event.amount, { amount: 149.5, currency: "USD" });
  assert.equal(event.failureReason, "insufficient_funds");
});

test("resolveMercadoPagoEnvironment normalizes test and production values", () => {
  assert.equal(resolveMercadoPagoEnvironment("sandbox"), "sandbox");
  assert.equal(resolveMercadoPagoEnvironment("test"), "sandbox");
  assert.equal(resolveMercadoPagoEnvironment("production"), "production");
  assert.equal(resolveMercadoPagoEnvironment("anything-else"), "production");
});

test("resolveMercadoPagoCredentials reads sandbox credentials", () => {
  const restore = withEnv({
    MERCADOPAGO_SANDBOX_PUBLIC_KEY: "sb-pk",
    MERCADOPAGO_SANDBOX_ACCESS_TOKEN: "sb-at",
    MERCADOPAGO_SANDBOX_WEBHOOK_SECRET: "sb-wh",
    MERCADOPAGO_SANDBOX_APPLICATION_ID: "sb-app",
    MERCADOPAGO_SANDBOX_CLIENT_ID: "sb-client",
    MERCADOPAGO_SANDBOX_CLIENT_SECRET: "sb-secret",
  });

  try {
    const credentials = resolveMercadoPagoCredentials("sandbox");
    assert.equal(credentials.environment, "sandbox");
    assert.equal(credentials.publicKey, "sb-pk");
    assert.equal(credentials.accessToken, "sb-at");
    assert.equal(credentials.webhookSecret, "sb-wh");
    assert.equal(credentials.applicationId, "sb-app");
    assert.equal(credentials.clientId, "sb-client");
    assert.equal(credentials.clientSecret, "sb-secret");
  } finally {
    restore();
  }
});

test("Mercado Pago webhook signature helpers are deterministic", () => {
  const manifest = buildMercadoPagoWebhookSignatureManifest({
    dataId: "123456",
    requestId: "req-abc",
    timestamp: "1704908010",
  });

  assert.equal(manifest, "id:123456;request-id:req-abc;ts:1704908010;");

  const secret = "phase1-secret";
  const signature = signMercadoPagoWebhookManifest(manifest, secret);

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=1704908010,v1=${signature}`,
      requestId: "req-abc",
      dataId: "123456",
      webhookSecret: secret,
    }),
    true
  );

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=1704908010,v1=invalid`,
      requestId: "req-abc",
      dataId: "123456",
      webhookSecret: secret,
    }),
    false
  );
});

test("parseMercadoPagoWebhookSignature accepts ts and v1 pairs", () => {
  assert.deepEqual(parseMercadoPagoWebhookSignature("ts=1704908010,v1=abcdef"), {
    timestamp: "1704908010",
    v1: "abcdef",
  });
  assert.equal(parseMercadoPagoWebhookSignature("bad-header"), null);
});

test("parseMercadoPagoWebhookEvent extracts payment and subscription references", () => {
  const paymentEvent = parseMercadoPagoWebhookEvent({
    payloadRaw: JSON.stringify({
      id: "evt-1",
      type: "payment",
      action: "payment.updated",
      data: { id: "999999999" },
      date_created: "2026-01-01T00:00:00.000Z",
      transaction_amount: 149.5,
      currency_id: "MXN",
      status_detail: "approved",
    }),
  });

  const subscriptionEvent = parseMercadoPagoWebhookEvent({
    payloadRaw: JSON.stringify({
      id: "evt-2",
      topic: "subscription_authorized_payment",
      data: { id: "sub-123" },
      date_created: "2026-01-01T00:00:00.000Z",
      currency_id: "MXN",
    }),
  });

  assert.equal(paymentEvent.providerEventId, "evt-1");
  assert.equal(paymentEvent.providerPaymentId, "999999999");
  assert.equal(paymentEvent.currency, "MXN");
  assert.equal(paymentEvent.failureReason, "approved");
  assert.equal(subscriptionEvent.providerSubscriptionId, "sub-123");
  assert.equal(subscriptionEvent.raw.mercadopagoTopic, "subscription_authorized_payment");
});
