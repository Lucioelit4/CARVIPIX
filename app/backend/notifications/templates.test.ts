import test from "node:test";
import assert from "node:assert/strict";

import { buildPaymentTransactionalEmailTemplate } from "./templates";

test("buildPaymentTransactionalEmailTemplate renders captured payment template", () => {
  const rendered = buildPaymentTransactionalEmailTemplate({
    templateId: "membership-payment-confirmed",
    recipientEmail: "cliente@carvipix.local",
    recipientName: "Cliente Demo",
    paymentOrderId: "pord-1",
    amount: 49,
    currency: "USD",
  });

  assert.match(rendered.subject, /pago confirmado/i);
  assert.match(rendered.text, /pord-1/);
});

test("buildPaymentTransactionalEmailTemplate renders renewal/failure/refund templates", () => {
  const renewal = buildPaymentTransactionalEmailTemplate({
    templateId: "membership-renewal",
    recipientEmail: "cliente@carvipix.local",
    recipientName: "Cliente Demo",
    paymentOrderId: "pord-2",
    amount: 49,
    currency: "USD",
  });

  const failure = buildPaymentTransactionalEmailTemplate({
    templateId: "payment-failed",
    recipientEmail: "cliente@carvipix.local",
    recipientName: "Cliente Demo",
    paymentOrderId: "pord-3",
    amount: 49,
    currency: "USD",
    failureReason: "insufficient_funds",
  });

  const refund = buildPaymentTransactionalEmailTemplate({
    templateId: "payment-refunded",
    recipientEmail: "cliente@carvipix.local",
    recipientName: "Cliente Demo",
    paymentOrderId: "pord-4",
    amount: 49,
    currency: "USD",
  });

  assert.match(renewal.subject, /renovacion/i);
  assert.match(failure.text, /insufficient_funds/);
  assert.match(refund.subject, /reembolso/i);
});
