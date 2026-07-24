import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPasswordChangedEmailTemplate,
  buildPaymentTransactionalEmailTemplate,
  buildWelcomeActivatedEmailTemplate,
} from "./templates";

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

test("buildPaymentTransactionalEmailTemplate renders bot downloadable delivery template", () => {
  const rendered = buildPaymentTransactionalEmailTemplate({
    templateId: "bot-license-delivery-ready",
    recipientEmail: "cliente@carvipix.local",
    recipientName: "Cliente Demo",
    paymentOrderId: "pord-bot-1",
    amount: 999,
    currency: "USD",
    productId: "bot-carvipix-license",
    productType: "bot",
    licenseKey: "CVPX-TEST-LICENSE",
    downloadUrl: "https://carvipix.com/api/bot/mt5/download?token=test-token",
    manualUrl: "https://carvipix.com/api/bot/mt5/download?token=test-token&file=manual",
  });

  assert.match(rendered.subject, /licencia/i);
  assert.match(rendered.text, /CARVIPIX_EA_MT5_V1\.ex5/);
  assert.match(rendered.text, /MQL5 > Experts/);
  assert.match(rendered.text, /Permite WebRequest/);
  assert.match(rendered.text, /CARVIPIX_LICENSE_KEY/);
  assert.match(rendered.text, /PRODUCTION/);
  assert.match(rendered.text, /cuenta demo/i);
  assert.match(rendered.text, /vence en 24 horas/i);
  assert.match(rendered.text, /Manual de instalacion/);
  assert.match(rendered.text, /file=manual/);
});

test("buildWelcomeActivatedEmailTemplate renders activation copy", () => {
  const rendered = buildWelcomeActivatedEmailTemplate(
    {
      recipientEmail: "cliente@carvipix.local",
      recipientName: "Cliente Demo",
    },
    {
      appPublicUrl: "http://localhost:3000",
      supportEmail: "soporte@carvipix.com",
    }
  );

  assert.match(rendered.subject, /activa/i);
  assert.match(rendered.text, /dashboard/i);
});

test("buildPasswordChangedEmailTemplate renders security confirmation copy", () => {
  const rendered = buildPasswordChangedEmailTemplate(
    {
      recipientEmail: "cliente@carvipix.local",
      recipientName: "Cliente Demo",
    },
    {
      appPublicUrl: "http://localhost:3000",
      supportEmail: "soporte@carvipix.com",
    }
  );

  assert.match(rendered.subject, /contrasena/i);
  assert.match(rendered.text, /confirmamos/i);
});
