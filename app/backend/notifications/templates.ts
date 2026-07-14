import type {
  IdentityVerificationApprovedEmailInput,
  IdentityVerificationNewDocumentEmailInput,
  IdentityVerificationReceivedEmailInput,
  IdentityVerificationRejectedEmailInput,
  PasswordChangedEmailInput,
  PasswordResetEmailInput,
  PaymentTransactionalEmailInput,
  PromotionCampaignEmailInput,
  TransactionalEmailTemplateId,
  WelcomeActivatedEmailInput,
  WelcomeRegistrationEmailInput,
} from "./types";

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type BrandLayoutInput = {
  preheader: string;
  headline: string;
  bodyHtml: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
  supportEmail?: string;
  legalNote: string;
  unsubscribeUrl?: string;
};

function renderBrandLayout(input: BrandLayoutInput): { html: string; text: string } {
  const ctaHtml = input.ctaUrl && input.ctaLabel
    ? `<p style="margin: 18px 0;"><a href="${input.ctaUrl}" style="display:inline-block;padding:12px 16px;background:#D4AF37;color:#111;text-decoration:none;border-radius:8px;font-weight:700;">${input.ctaLabel}</a></p>`
    : "";

  const unsubscribeHtml = input.unsubscribeUrl
    ? `<p style="margin:8px 0 0 0;color:#8a8a8a;font-size:12px;">Si no deseas recibir mensajes comerciales, <a href="${input.unsubscribeUrl}" style="color:#8a8a8a;">cancela tu suscripcion</a>.</p>`
    : "";

  const supportHtml = input.supportEmail
    ? `<p style="margin:0;color:#8a8a8a;font-size:12px;">Soporte: <a href="mailto:${input.supportEmail}" style="color:#8a8a8a;">${input.supportEmail}</a></p>`
    : "";

  const html = [
    "<div style=\"margin:0;padding:0;background:#050505;\">",
    "  <div style=\"display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;\">",
    `    ${input.preheader}`,
    "  </div>",
    "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#050505;padding:24px 12px;\">",
    "    <tr>",
    "      <td align=\"center\">",
    "        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:620px;background:#0E0E0E;border:1px solid #222;border-radius:14px;overflow:hidden;font-family:Arial,sans-serif;color:#EDEDED;\">",
    "          <tr>",
    "            <td style=\"padding:22px 24px;background:linear-gradient(90deg,#1E1E1E 0%,#131313 100%);border-bottom:1px solid #252525;\">",
    "              <p style=\"margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#D4AF37;font-weight:700;\">CARVIPIX</p>",
    "              <p style=\"margin:6px 0 0 0;font-size:12px;color:#9A9A9A;\">Centro de Comunicaciones</p>",
    "            </td>",
    "          </tr>",
    "          <tr>",
    "            <td style=\"padding:24px;\">",
    `              <h2 style=\"margin:0 0 12px 0;color:#FFFFFF;font-size:24px;line-height:1.25;\">${input.headline}</h2>`,
    `              <div style=\"font-size:15px;line-height:1.6;color:#D0D0D0;\">${input.bodyHtml}</div>`,
    ctaHtml,
    "            </td>",
    "          </tr>",
    "          <tr>",
    "            <td style=\"padding:16px 24px;border-top:1px solid #252525;background:#0A0A0A;\">",
    `              <p style=\"margin:0 0 8px 0;color:#8a8a8a;font-size:12px;\">${input.legalNote}</p>`,
    supportHtml,
    unsubscribeHtml,
    "              <p style=\"margin:8px 0 0 0;color:#676767;font-size:12px;\">CARVIPIX \u00b7 Todos los derechos reservados</p>",
    "            </td>",
    "          </tr>",
    "        </table>",
    "      </td>",
    "    </tr>",
    "  </table>",
    "</div>",
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    "CARVIPIX - Centro de Comunicaciones",
    input.headline,
    "",
    input.bodyText,
    "",
    input.ctaUrl && input.ctaLabel ? `${input.ctaLabel}: ${input.ctaUrl}` : "",
    "",
    input.legalNote,
    input.supportEmail ? `Soporte: ${input.supportEmail}` : "",
    input.unsubscribeUrl ? `Cancelar suscripcion: ${input.unsubscribeUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

type WelcomeTemplateContext = {
  recipientName: string;
  verificationUrl: string;
  supportEmail: string;
};

function renderWelcomeRegistrationTemplate(context: WelcomeTemplateContext): RenderedEmailTemplate {
  const subject = "Bienvenido a CARVIPIX: confirma tu correo";

  const rendered = renderBrandLayout({
    preheader: "Tu cuenta fue creada. Falta confirmar tu correo.",
    headline: "Bienvenido a CARVIPIX",
    bodyHtml: [
      `<p>Hola ${context.recipientName},</p>`,
      "<p>Tu cuenta fue creada correctamente. Para activar el acceso, confirma tu correo con el boton seguro.</p>",
      `<p>Si el boton no abre, copia esta URL en tu navegador:<br/><a href=\"${context.verificationUrl}\" style=\"color:#D4AF37;\">${context.verificationUrl}</a></p>`,
      `<p>Si no reconoces este registro, escribe a ${context.supportEmail}.</p>`,
    ].join(""),
    bodyText: [
      `Hola ${context.recipientName},`,
      "Tu cuenta fue creada correctamente. Confirma tu correo para activar el acceso.",
      `URL: ${context.verificationUrl}`,
      `Si no reconoces este registro, escribe a ${context.supportEmail}.`,
    ].join("\n"),
    ctaLabel: "Confirmar correo",
    ctaUrl: context.verificationUrl,
    supportEmail: context.supportEmail,
    legalNote: "Correo transaccional de verificacion de cuenta.",
  });

  return { subject, html: rendered.html, text: rendered.text };
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

type PasswordResetTemplateContext = {
  recipientName: string;
  resetUrl: string;
  supportEmail: string;
};

function renderPasswordResetTemplate(context: PasswordResetTemplateContext): RenderedEmailTemplate {
  const subject = "CARVIPIX: restablece tu contrasena";

  const rendered = renderBrandLayout({
    preheader: "Recibimos una solicitud para restablecer tu contrasena.",
    headline: "Recuperacion de cuenta",
    bodyHtml: [
      `<p>Hola ${context.recipientName},</p>`,
      "<p>Recibimos una solicitud para restablecer tu contrasena. Usa el enlace temporal para continuar.</p>",
      `<p>Si el boton no funciona, abre esta URL:<br/><a href=\"${context.resetUrl}\" style=\"color:#D4AF37;\">${context.resetUrl}</a></p>`,
      "<p>Este enlace expira en 2 horas.</p>",
      `<p>Si no solicitaste este cambio, escribe a ${context.supportEmail}.</p>`,
    ].join(""),
    bodyText: [
      `Hola ${context.recipientName},`,
      "Recibimos una solicitud para restablecer tu contrasena.",
      `URL: ${context.resetUrl}`,
      "Este enlace expira en 2 horas.",
      `Si no solicitaste este cambio, escribe a ${context.supportEmail}.`,
    ].join("\n"),
    ctaLabel: "Restablecer contrasena",
    ctaUrl: context.resetUrl,
    supportEmail: context.supportEmail,
    legalNote: "Correo transaccional de seguridad.",
  });

  return { subject, html: rendered.html, text: rendered.text };
}

export function buildPasswordResetEmailTemplate(
  input: PasswordResetEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const resetUrl = `${options.appPublicUrl.replace(/\/$/, "")}/recuperar-password?token=${encodeURIComponent(input.resetToken)}`;

  return renderPasswordResetTemplate({
    recipientName: input.recipientName,
    resetUrl,
    supportEmail: options.supportEmail,
  });
}

export function buildWelcomeActivatedEmailTemplate(
  input: WelcomeActivatedEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const dashboardUrl = `${options.appPublicUrl.replace(/\/$/, "")}/dashboard`;

  const rendered = renderBrandLayout({
    preheader: "Tu cuenta ya esta activa. Bienvenido a CARVIPIX.",
    headline: "Cuenta activada exitosamente",
    bodyHtml: [
      `<p>Hola ${input.recipientName},</p>`,
      "<p>Tu correo fue verificado y tu acceso quedo activado.</p>",
      `<p>Ya puedes iniciar sesion y entrar a tu panel principal.</p>`,
      `<p>Si necesitas ayuda, escribe a ${options.supportEmail}.</p>`,
    ].join(""),
    bodyText: [
      `Hola ${input.recipientName},`,
      "Tu correo fue verificado y tu acceso quedo activado.",
      "Ya puedes iniciar sesion y entrar a tu panel principal.",
      `Soporte: ${options.supportEmail}`,
    ].join("\n"),
    ctaLabel: "Abrir dashboard",
    ctaUrl: dashboardUrl,
    supportEmail: options.supportEmail,
    legalNote: "Correo transaccional de activacion de cuenta.",
  });

  return {
    subject: "CARVIPIX: tu cuenta ya esta activa",
    html: rendered.html,
    text: rendered.text,
  };
}

export function buildPasswordChangedEmailTemplate(
  input: PasswordChangedEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const loginUrl = `${options.appPublicUrl.replace(/\/$/, "")}/login`;

  const rendered = renderBrandLayout({
    preheader: "Tu contrasena fue actualizada correctamente.",
    headline: "Cambio de contrasena confirmado",
    bodyHtml: [
      `<p>Hola ${input.recipientName},</p>`,
      "<p>Confirmamos que tu contrasena fue actualizada.</p>",
      "<p>Si no realizaste este cambio, contacta soporte de inmediato.</p>",
      `<p>Soporte: ${options.supportEmail}</p>`,
    ].join(""),
    bodyText: [
      `Hola ${input.recipientName},`,
      "Confirmamos que tu contrasena fue actualizada.",
      "Si no realizaste este cambio, contacta soporte de inmediato.",
      `Soporte: ${options.supportEmail}`,
    ].join("\n"),
    ctaLabel: "Iniciar sesion",
    ctaUrl: loginUrl,
    supportEmail: options.supportEmail,
    legalNote: "Correo transaccional de seguridad.",
  });

  return {
    subject: "CARVIPIX: cambio de contrasena confirmado",
    html: rendered.html,
    text: rendered.text,
  };
}

function renderIdentityVerificationTemplate(input: {
  headline: string;
  preheader: string;
  bodyLines: string[];
  recipientName: string;
  supportEmail: string;
  ctaLabel?: string;
  ctaUrl?: string;
  legalNote: string;
}) {
  return renderBrandLayout({
    preheader: input.preheader,
    headline: input.headline,
    bodyHtml: [
      `<p>Hola ${escapeHtml(input.recipientName)},</p>`,
      ...input.bodyLines.map((line) => `<p>${escapeHtml(line)}</p>`),
      `<p>Soporte: ${escapeHtml(input.supportEmail)}</p>`,
    ].join(""),
    bodyText: [
      `Hola ${input.recipientName},`,
      ...input.bodyLines,
      `Soporte: ${input.supportEmail}`,
    ].join("\n"),
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    supportEmail: input.supportEmail,
    legalNote: input.legalNote,
  });
}

export function buildIdentityVerificationReceivedEmailTemplate(
  input: IdentityVerificationReceivedEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const rendered = renderIdentityVerificationTemplate({
    headline: "Solicitud recibida",
    preheader: "Tus documentos estan en revision.",
    bodyLines: [
      "Recibimos tus documentos de identidad y ya iniciamos la revision.",
      "Te notificaremos cuando exista una resolucion.",
    ],
    recipientName: input.recipientName,
    supportEmail: options.supportEmail,
    ctaLabel: "Abrir perfil",
    ctaUrl: `${options.appPublicUrl.replace(/\/$/, "")}/perfil`,
    legalNote: "Correo transaccional de verificacion de identidad.",
  });

  return { subject: "CARVIPIX: recibimos tu solicitud de verificacion", html: rendered.html, text: rendered.text };
}

export function buildIdentityVerificationApprovedEmailTemplate(
  input: IdentityVerificationApprovedEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const rendered = renderIdentityVerificationTemplate({
    headline: "Verificacion aprobada",
    preheader: "Ya puedes usar los servicios que la requieren.",
    bodyLines: [
      "Tu verificacion fue aprobada correctamente.",
      "Los servicios que requieren identidad validada ya pueden activarse segun tu acceso.",
    ],
    recipientName: input.recipientName,
    supportEmail: options.supportEmail,
    ctaLabel: "Ir al dashboard",
    ctaUrl: `${options.appPublicUrl.replace(/\/$/, "")}/dashboard`,
    legalNote: "Correo transaccional de cumplimiento.",
  });

  return { subject: "CARVIPIX: tu verificacion fue aprobada", html: rendered.html, text: rendered.text };
}

export function buildIdentityVerificationRejectedEmailTemplate(
  input: IdentityVerificationRejectedEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const rendered = renderIdentityVerificationTemplate({
    headline: "Verificacion rechazada",
    preheader: "Necesitamos que ajustes tu documento.",
    bodyLines: [
      "Tu solicitud fue rechazada.",
      `Motivo: ${input.reason}`,
      "Revisa la legibilidad, vigencia y completitud de ambos lados del documento.",
    ],
    recipientName: input.recipientName,
    supportEmail: options.supportEmail,
    ctaLabel: "Reenviar documentos",
    ctaUrl: `${options.appPublicUrl.replace(/\/$/, "")}/perfil`,
    legalNote: "Correo transaccional de cumplimiento.",
  });

  return { subject: "CARVIPIX: tu verificacion fue rechazada", html: rendered.html, text: rendered.text };
}

export function buildIdentityVerificationNewDocumentEmailTemplate(
  input: IdentityVerificationNewDocumentEmailInput,
  options: {
    appPublicUrl: string;
    supportEmail: string;
  }
): RenderedEmailTemplate {
  const rendered = renderIdentityVerificationTemplate({
    headline: "Solicitud de nuevo documento",
    preheader: "Necesitamos una fotografia mas clara.",
    bodyLines: [
      "Necesitamos una nueva fotografia de tu documento para continuar con la verificacion.",
      `Motivo: ${input.reason}`,
      "Puedes reemplazar el archivo desde tu perfil mientras el estado lo permita.",
    ],
    recipientName: input.recipientName,
    supportEmail: options.supportEmail,
    ctaLabel: "Actualizar documentos",
    ctaUrl: `${options.appPublicUrl.replace(/\/$/, "")}/perfil`,
    legalNote: "Correo transaccional de cumplimiento.",
  });

  return { subject: "CARVIPIX: necesitamos nueva fotografia de tu documento", html: rendered.html, text: rendered.text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPromotionCampaignEmailTemplate(input: PromotionCampaignEmailInput): RenderedEmailTemplate {
  const subject = `CARVIPIX: ${input.headline}`;
  const safeHeadline = escapeHtml(input.headline);
  const safeBody = escapeHtml(input.body);
  const safeCampaignName = escapeHtml(input.campaignName);
  const safeRecipientName = escapeHtml(input.recipientName || "miembro");
  const ctaUrl = input.ctaUrl?.trim() || "";
  const ctaLabel = escapeHtml(input.ctaLabel?.trim() || "Ver detalle");
  const unsubscribeUrl = input.unsubscribeUrl?.trim() || "";

  const rendered = renderBrandLayout({
    preheader: safeHeadline,
    headline: safeHeadline,
    bodyHtml: [
      `<p>Hola ${safeRecipientName},</p>`,
      `<p>${safeBody}</p>`,
      `<p style=\"margin-top:16px;color:#8a8a8a;font-size:12px;\">Campana: ${safeCampaignName}</p>`,
    ].join(""),
    bodyText: [
      `Hola ${input.recipientName || "miembro"},`,
      input.headline,
      input.body,
      `Campana: ${input.campaignName}`,
    ].join("\n"),
    ctaLabel,
    ctaUrl: ctaUrl || undefined,
    legalNote: "Comunicacion comercial de CARVIPIX.",
    unsubscribeUrl: unsubscribeUrl || undefined,
  });

  return { subject, html: rendered.html, text: rendered.text };
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

  if (input.templateId === "bot-license-delivery-ready") {
    return {
      subject: "CARVIPIX: licencia de Bot confirmada y entrega preparada",
      html: [
        "<div style=\"font-family: Arial, sans-serif; color: #111; line-height: 1.5;\">",
        `  <p>Hola ${recipientName},</p>`,
        "  <p>Confirmamos tu pago del Bot CARVIPIX y tu licencia ya quedo registrada correctamente.</p>",
        `  <p><strong>Orden:</strong> ${orderRef}<br/><strong>Monto:</strong> ${amount}</p>`,
        "  <p>Tu flujo de entrega queda preparado con:</p>",
        "  <ul>",
        "    <li>Licencia oficial activa</li>",
        "    <li>Descarga del paquete EA</li>",
        "    <li>Guia de instalacion</li>",
        "    <li>Manual y recursos de video</li>",
        "    <li>Canal de soporte para activacion</li>",
        "  </ul>",
        "  <p>Equipo CARVIPIX</p>",
        "</div>",
      ].join("\n"),
      text: [
        `Hola ${recipientName},`,
        "",
        "Confirmamos tu pago del Bot CARVIPIX y tu licencia ya quedo registrada.",
        `Orden: ${orderRef}`,
        `Monto: ${amount}`,
        "",
        "Tu flujo de entrega queda preparado con:",
        "- Licencia oficial activa",
        "- Descarga del paquete EA",
        "- Guia de instalacion",
        "- Manual y recursos de video",
        "- Soporte para activacion",
        "",
        "Equipo CARVIPIX",
      ].join("\n"),
    };
  }

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
    "bot-license-delivery-ready",
    "membership-renewal",
    "payment-failed",
    "payment-refunded",
  ];

  if (!allowedTemplates.includes(input.templateId)) {
    throw new Error(`Unsupported transactional template: ${input.templateId}`);
  }

  return renderPaymentTransactionalTemplate(input);
}
