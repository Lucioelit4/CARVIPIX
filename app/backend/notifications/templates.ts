import type { PaymentTransactionalEmailInput, TransactionalEmailTemplateId, WelcomeRegistrationEmailInput } from "./types";

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type WelcomeTemplateContext = {
  recipientName: string;
  verificationUrl: string;
  supportEmail: string;
};

function renderWelcomeRegistrationTemplate(context: WelcomeTemplateContext): RenderedEmailTemplate {
  const subject = "Bienvenido a CARVIPIX: confirma tu correo";

  const html = [
    "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
    "  <h2 style=\"margin-bottom: 8px;\">Bienvenido a CARVIPIX</h2>",
    `  <p>Hola ${context.recipientName},</p>`,
    "  <p>Tu cuenta fue creada correctamente. Para activar el acceso y finalizar el registro, confirma tu correo con el siguiente enlace:</p>",
    `  <p><a href=\"${context.verificationUrl}\" style=\"display:inline-block;padding:10px 14px;background:#D4AF37;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;\">Confirmar correo</a></p>`,
    `  <p>Si el boton no funciona, copia y pega esta URL en tu navegador:<br/><a href=\"${context.verificationUrl}\">${context.verificationUrl}</a></p>`,
    `  <p>Si no reconoces este registro, escribe a ${context.supportEmail}.</p>`,
    "  <p>Equipo CARVIPIX</p>",
    "</div>",
  ].join("\n");

  const text = [
    "Bienvenido a CARVIPIX",
    `Hola ${context.recipientName},`,
    "",
    "Tu cuenta fue creada correctamente. Confirma tu correo para activar el acceso:",
    context.verificationUrl,
    "",
    `Si no reconoces este registro, escribe a ${context.supportEmail}.`,
    "",
    "Equipo CARVIPIX",
  ].join("\n");

  return { subject, html, text };
}

export function buildWelcomeRegistrationEmailTemplate(
  input: WelcomeRegistrationEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const verificationUrl = `${options.appPublicUrl.replace(/\/$/, "")}/verificar-correo?token=${encodeURIComponent(input.verificationToken)}`;

  return renderWelcomeRegistrationTemplate({
    recipientName: input.recipientName,
    verificationUrl,
    supportEmail: options.supportEmail,
  });
}

function amountLabel(amount?: number, currency?: string): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "No disponible";
  }

  return `${amount.toFixed(2)} ${String(currency ?? "USD").toUpperCase()}`;
}

function renderPaymentTransactionalTemplate(input: PaymentTransactionalEmailInput): RenderedEmailTemplate {
  const recipientName = input.recipientName || "cliente";
  const amount = amountLabel(input.amount, input.currency);
  const orderRef = input.paymentOrderId;

  if (input.templateId === "membership-payment-confirmed") {
    return {
      subject: "CARVIPIX: pago confirmado y membresia activada",
      html: [
        "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
        `  <p>Hola ${recipientName},</p>`,
        "  <p>Confirmamos tu pago y la activacion de tu membresia.</p>",
        `  <p><strong>Orden:</strong> ${orderRef}<br/><strong>Monto:</strong> ${amount}</p>`,
        "  <p>Ya puedes acceder a tu dashboard con los permisos de tu plan activo.</p>",
        "  <p>Equipo CARVIPIX</p>",
        "</div>",
      ].join("\n"),
      text: [
        `Hola ${recipientName},`,
        "",
        "Confirmamos tu pago y la activacion de tu membresia.",
        `Orden: ${orderRef}`,
        `Monto: ${amount}`,
        "Ya puedes acceder a tu dashboard.",
        "",
        "Equipo CARVIPIX",
      ].join("\n"),
    };
  }

  if (input.templateId === "membership-renewal") {
    return {
      subject: "CARVIPIX: renovacion de membresia confirmada",
      html: [
        "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
        `  <p>Hola ${recipientName},</p>`,
        "  <p>Tu renovacion de membresia fue procesada correctamente.</p>",
        `  <p><strong>Orden:</strong> ${orderRef}<br/><strong>Monto:</strong> ${amount}</p>`,
        "  <p>Tu acceso se mantiene activo sin interrupciones.</p>",
        "  <p>Equipo CARVIPIX</p>",
        "</div>",
      ].join("\n"),
      text: [
        `Hola ${recipientName},`,
        "",
        "Tu renovacion de membresia fue procesada correctamente.",
        `Orden: ${orderRef}`,
        `Monto: ${amount}`,
        "Tu acceso se mantiene activo.",
        "",
        "Equipo CARVIPIX",
      ].join("\n"),
    };
  }

  if (input.templateId === "payment-failed") {
    return {
      subject: "CARVIPIX: no pudimos confirmar tu pago",
      html: [
        "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
        `  <p>Hola ${recipientName},</p>`,
        "  <p>No fue posible confirmar tu pago en este intento.</p>",
        `  <p><strong>Orden:</strong> ${orderRef}<br/><strong>Monto:</strong> ${amount}</p>`,
        `  <p><strong>Motivo:</strong> ${input.failureReason || "No disponible"}</p>`,
        "  <p>Puedes intentar nuevamente desde tu flujo de pago.</p>",
        "  <p>Equipo CARVIPIX</p>",
        "</div>",
      ].join("\n"),
      text: [
        `Hola ${recipientName},`,
        "",
        "No fue posible confirmar tu pago en este intento.",
        `Orden: ${orderRef}`,
        `Monto: ${amount}`,
        `Motivo: ${input.failureReason || "No disponible"}`,
        "Puedes intentar nuevamente desde tu flujo de pago.",
        "",
        "Equipo CARVIPIX",
      ].join("\n"),
    };
  }

  return {
    subject: "CARVIPIX: reembolso confirmado",
    html: [
      "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
      `  <p>Hola ${recipientName},</p>`,
      "  <p>Tu reembolso fue confirmado correctamente.</p>",
      `  <p><strong>Orden:</strong> ${orderRef}<br/><strong>Monto:</strong> ${amount}</p>`,
      "  <p>El tiempo de reflejo puede variar segun el medio de pago.</p>",
      "  <p>Equipo CARVIPIX</p>",
      "</div>",
    ].join("\n"),
    text: [
      `Hola ${recipientName},`,
      "",
      "Tu reembolso fue confirmado correctamente.",
      `Orden: ${orderRef}`,
      `Monto: ${amount}`,
      "El tiempo de reflejo puede variar segun el medio de pago.",
      "",
      "Equipo CARVIPIX",
    ].join("\n"),
  };
}

export function buildPaymentTransactionalEmailTemplate(
  input: PaymentTransactionalEmailInput,
  options?: { allowedTemplates?: TransactionalEmailTemplateId[] }
): RenderedEmailTemplate {
  const allowedTemplates = options?.allowedTemplates ?? [
    "membership-payment-confirmed",
    "membership-renewal",
    "payment-failed",
    "payment-refunded",
  ];

  if (!allowedTemplates.includes(input.templateId)) {
    throw new Error(`Unsupported transactional template: ${input.templateId}`);
  }

  return renderPaymentTransactionalTemplate(input);
}
