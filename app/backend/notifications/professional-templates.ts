import "server-only";

/**
 * PLANTILLAS DE EMAIL PROFESIONALES PARA CARVIPIX
 * Todas las plantillas siguen la identidad visual corporativa
 * Optimizadas para Gmail, Outlook, Apple Mail, Android, iPhone
 */

export type EmailTemplateType = 
  | "welcome-registration"
  | "email-verification"
  | "password-recovery"
  | "password-changed"
  | "founders-welcome"
  | "bot-license-purchased"
  | "bot-license-delivery"
  | "membership-purchased"
  | "membership-renewal"
  | "license-suspended"
  | "license-expired"
  | "support-ticket-received"
  | "support-ticket-resolved"
  | "general-announcement";

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
  preheader: string;
};

// ═══════════════════════════════════════════════════════════════════════
// BASE LAYOUT — Identidad visual CARVIPIX
// ═══════════════════════════════════════════════════════════════════════

export function createBrandWrapper(options: {
  preheader: string;
  headline: string;
  bodyHtml: string;
  bodyText: string;
  ctaButton?: { label: string; url: string };
  supportEmail?: string;
  legalNote: string;
  footerLinks?: Array<{ label: string; url: string }>;
}): { html: string; text: string } {
  const ctaButtonHtml = options.ctaButton
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="background:#D4AF37;border-radius:8px;padding:0;">
          <a href="${options.ctaButton.url}" style="display:inline-block;padding:14px 32px;color:#030303;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.5px;">${options.ctaButton.label}</a>
        </td>
      </tr>
    </table>
    `
    : "";

  const footerLinks = options.footerLinks
    ? options.footerLinks.map(link => `<a href="${link.url}" style="color:#D4AF37;text-decoration:none;margin:0 12px;">${link.label}</a>`).join(" • ")
    : "";

  const html = `
<!DOCTYPE html>
<html style="margin:0;padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${options.headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#030303;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#EDEDED;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;width:0;height:0;">${options.preheader}</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#030303;margin:0;padding:0;">
    <tr>
      <td style="padding:24px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0E0E0E;border:1px solid #1A1A1A;border-radius:12px 12px 0 0;overflow:hidden;">
                <tr>
                  <td style="padding:24px;background:linear-gradient(135deg,#1E1E1E 0%,#131313 100%);border-bottom:1px solid #252525;">
                    <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#D4AF37;font-weight:800;">🔹 CARVIPIX</p>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#9A9A9A;font-weight:500;">Plataforma de Trading Profesional</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0E0E0E;border-left:1px solid #1A1A1A;border-right:1px solid #1A1A1A;padding:32px 24px;">
                <tr>
                  <td>
                    <h1 style="margin:0 0 16px 0;color:#FFFFFF;font-size:28px;font-weight:700;line-height:1.2;">${options.headline}</h1>
                    <div style="color:#D0D0D0;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
                      ${options.bodyHtml}
                    </div>
                    ${ctaButtonHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0E0E0E;border:1px solid #1A1A1A;border-radius:0 0 12px 12px;border-top:1px solid #252525;padding:20px 24px;">
                <tr>
                  <td style="border-bottom:1px solid #252525;padding-bottom:16px;margin-bottom:16px;">
                    <p style="margin:0;color:#8A8A8A;font-size:12px;line-height:1.5;">
                      ${options.legalNote}
                    </p>
                  </td>
                </tr>
                ${options.supportEmail ? `
                <tr>
                  <td style="border-bottom:1px solid #252525;padding-bottom:12px;margin-bottom:12px;">
                    <p style="margin:0;color:#8A8A8A;font-size:12px;">
                      <strong>Soporte:</strong> <a href="mailto:${options.supportEmail}" style="color:#D4AF37;text-decoration:none;">${options.supportEmail}</a>
                    </p>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;color:#676767;font-size:11px;text-align:center;">
                      ${footerLinks}
                    </p>
                    <p style="margin:8px 0 0 0;color:#4A4A4A;font-size:11px;text-align:center;">
                      © 2026 CARVIPIX. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    "CARVIPIX - Plataforma de Trading Profesional",
    "═" .repeat(50),
    options.headline,
    "",
    options.bodyText,
    options.ctaButton ? `[${options.ctaButton.label}] ${options.ctaButton.url}` : "",
    "",
    "═".repeat(50),
    options.legalNote,
    options.supportEmail ? `Soporte: ${options.supportEmail}` : "",
    "",
    "© 2026 CARVIPIX. Todos los derechos reservados.",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export function createWelcomeRegistrationTemplate(params: {
  name: string;
  verificationUrl: string;
  supportEmail: string;
  appUrl: string;
}): EmailTemplate {
  const { name, verificationUrl, supportEmail, appUrl } = params;
  const { html, text } = createBrandWrapper({
    preheader: "Confirma tu correo para acceder a CARVIPIX",
    headline: "¡Bienvenido a CARVIPIX!",
    bodyHtml: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Tu cuenta fue creada correctamente en CARVIPIX. Para acceder a la plataforma, necesitamos que confirmes tu correo electrónico.</p>
      <p style="margin:20px 0;padding:16px;background:#1A1A1A;border-left:3px solid #D4AF37;border-radius:4px;">
        <strong>¿Por qué?</strong> La confirmación de correo protege tu cuenta y garantiza que recibirás notificaciones importantes.
      </p>
      <p><strong>Este enlace expira en 24 horas.</strong> Si no confirmas, tu cuenta se desactivará automáticamente.</p>
    `,
    bodyText: `Hola ${name},\n\nTu cuenta fue creada correctamente en CARVIPIX.\n\nPara acceder, confirma tu correo visitando:\n${verificationUrl}\n\nEste enlace expira en 24 horas.\n\nSi no reconoces este registro, contáctanos inmediatamente.`,
    ctaButton: { label: "✓ CONFIRMAR CORREO", url: verificationUrl },
    supportEmail,
    legalNote: "Correo transaccional de verificación de cuenta. No responda a este correo.",
    footerLinks: [
      { label: "Ir a CARVIPIX", url: appUrl },
      { label: "Centro de Ayuda", url: `${appUrl}/soporte` },
    ],
  });

  return {
    subject: "✓ CARVIPIX: Confirma tu correo para activar tu cuenta",
    preheader: "Confirma tu correo para acceder a CARVIPIX",
    html,
    text,
  };
}

export function createPasswordRecoveryTemplate(params: {
  name: string;
  resetUrl: string;
  supportEmail: string;
  appUrl: string;
}): EmailTemplate {
  const { name, resetUrl, supportEmail, appUrl } = params;
  const { html, text } = createBrandWrapper({
    preheader: "Restablecer contraseña de tu cuenta CARVIPIX",
    headline: "Restablecer tu contraseña",
    bodyHtml: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en CARVIPIX. Si no fuiste tú, ignora este correo.</p>
      <p style="margin:20px 0;padding:16px;background:#1A1A1A;border-left:3px solid #D4AF37;border-radius:4px;">
        <strong>⚠️ Por seguridad:</strong> Este enlace expira en 30 minutos. No compartas este correo con otros.
      </p>
      <p>Si el botón no funciona, copia esta URL en tu navegador:</p>
      <p><code style="background:#1A1A1A;padding:8px 12px;border-radius:4px;display:inline-block;font-family:monospace;font-size:12px;color:#D4AF37;">${resetUrl}</code></p>
    `,
    bodyText: `Hola ${name},\n\nRecibimos una solicitud para restablecer tu contraseña en CARVIPIX.\n\nURL: ${resetUrl}\n\nEste enlace expira en 30 minutos.\n\nSi no solicitaste esto, ignora este correo.`,
    ctaButton: { label: "RESTABLECER CONTRASEÑA", url: resetUrl },
    supportEmail,
    legalNote: "Correo de seguridad. Si no solicitaste cambiar tu contraseña, actúa inmediatamente.",
    footerLinks: [
      { label: "Ir a CARVIPIX", url: appUrl },
      { label: "Reporte de seguridad", url: `${appUrl}/soporte?category=seguridad` },
    ],
  });

  return {
    subject: "🔐 CARVIPIX: Restablecer tu contraseña",
    preheader: "Restablecer contraseña de tu cuenta CARVIPIX",
    html,
    text,
  };
}

export function createFoundersProgramWelcomeTemplate(params: {
  name: string;
  benefits: string[];
  expiryDate: string;
  supportEmail: string;
  appUrl: string;
  telegramUrl?: string;
}): EmailTemplate {
  const { name, benefits, expiryDate, supportEmail, appUrl, telegramUrl } = params;
  
  const benefitsHtml = benefits
    .map(b => `<li style="margin:8px 0;color:#D0D0D0;">${b}</li>`)
    .join("");

  const { html, text } = createBrandWrapper({
    preheader: `¡${name}, eres parte del Programa de Fundadores de CARVIPIX!`,
    headline: `¡Bienvenido al Programa de Fundadores!`,
    bodyHtml: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>¡Felicitaciones! Has sido seleccionado como uno de nuestros Fundadores. Tu membresía beta te da acceso prioritario a las mejores funciones de CARVIPIX.</p>
      
      <h3 style="color:#D4AF37;margin:20px 0 12px 0;font-size:16px;">✨ Tus beneficios incluyen:</h3>
      <ul style="margin:0;padding:0 0 0 20px;list-style:none;">
        ${benefitsHtml}
      </ul>
      
      <p style="margin:20px 0;padding:16px;background:#1A1A1A;border-left:3px solid #D4AF37;border-radius:4px;">
        <strong>Vigencia:</strong> Tu membresía es válida hasta ${expiryDate}.<br/>
        <strong>Acceso:</strong> 24/7 en todas las funciones del programa.
      </p>
      
      ${telegramUrl ? `<p><strong>📱 Únete a nuestro grupo privado:</strong> Acceso exclusivo a anuncios, actualizaciones y soporte directo.</p>` : ""}
    `,
    bodyText: `Hola ${name},\n\n¡Felicitaciones! Eres parte del Programa de Fundadores de CARVIPIX.\n\nBeneficios:\n${benefits.map(b => `• ${b}`).join("\n")}\n\nVigencia hasta: ${expiryDate}\n\nAcceso: https://carvipix.com/dashboard\n${telegramUrl ? `\nGrupo Telegram: ${telegramUrl}` : ""}`,
    ctaButton: { label: "→ IR A MI DASHBOARD", url: `${appUrl}/dashboard` },
    supportEmail,
    legalNote: "Correo de bienvenida al Programa de Fundadores de CARVIPIX.",
    footerLinks: [
      { label: "Mis Beneficios", url: `${appUrl}/dashboard` },
      { label: "Soporte de Fundadores", url: `${appUrl}/soporte` },
    ],
  });

  return {
    subject: "🌟 CARVIPIX: ¡Bienvenido al Programa de Fundadores!",
    preheader: `¡${name}, eres parte del Programa de Fundadores de CARVIPIX!`,
    html,
    text,
  };
}

export function createBotLicensePurchasedTemplate(params: {
  name: string;
  orderId: string;
  licenseCode: string;
  downloadUrl: string;
  manualUrl: string;
  supportEmail: string;
  appUrl: string;
}): EmailTemplate {
  const { name, orderId, licenseCode, downloadUrl, manualUrl, supportEmail, appUrl } = params;
  
  const { html, text } = createBrandWrapper({
    preheader: "Tu licencia del Bot CARVIPIX está lista para descargar",
    headline: "✓ Licencia del Bot Confirmada",
    bodyHtml: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>¡Excelente! Tu pago fue confirmado y tu licencia del Bot CARVIPIX está lista.</p>
      
      <table style="width:100%;margin:20px 0;background:#1A1A1A;border-radius:4px;">
        <tr>
          <td style="padding:12px;border-bottom:1px solid #252525;">
            <strong style="color:#D4AF37;">Número de Orden:</strong>
          </td>
          <td style="padding:12px;border-bottom:1px solid #252525;text-align:right;">
            <code style="color:#EDEDED;font-family:monospace;">${orderId}</code>
          </td>
        </tr>
        <tr>
          <td style="padding:12px;">
            <strong style="color:#D4AF37;">Código de Licencia:</strong>
          </td>
          <td style="padding:12px;text-align:right;">
            <code style="color:#D4AF37;font-family:monospace;font-weight:700;">${licenseCode}</code>
          </td>
        </tr>
      </table>
      
      <h3 style="color:#D4AF37;margin:20px 0 12px 0;font-size:16px;">📦 Próximos Pasos:</h3>
      <ol style="margin:0;padding:0 0 0 20px;">
        <li style="margin:8px 0;color:#D0D0D0;">Descarga el archivo del Bot</li>
        <li style="margin:8px 0;color:#D0D0D0;">Lee el manual de instalación</li>
        <li style="margin:8px 0;color:#D0D0D0;">Importa el EA en tu MetaTrader 5</li>
        <li style="margin:8px 0;color:#D0D0D0;">Contacta con soporte si tienes dudas</li>
      </ol>
      
      <p style="margin:20px 0;padding:16px;background:#1A1A1A;border-left:3px solid #D4AF37;border-radius:4px;">
        <strong>💾 Guardar tu código de licencia:</strong> Lo necesitarás durante la instalación en MetaTrader 5.
      </p>
    `,
    bodyText: `Hola ${name},\n\n¡Tu licencia del Bot CARVIPIX está lista!\n\nNúmero de Orden: ${orderId}\nCódigo de Licencia: ${licenseCode}\n\nDescargar: ${downloadUrl}\nManual: ${manualUrl}\n\nGuarda tu código de licencia, lo necesitarás en MetaTrader 5.`,
    ctaButton: { label: "↓ DESCARGAR BOT EA", url: downloadUrl },
    supportEmail,
    legalNote: "Correo de confirmación de compra del Bot CARVIPIX.",
    footerLinks: [
      { label: "Ver Manual", url: manualUrl },
      { label: "Soporte Técnico", url: `${appUrl}/soporte?category=bot` },
    ],
  });

  return {
    subject: "✓ CARVIPIX: Tu Bot EA está listo para descargar",
    preheader: "Tu licencia del Bot CARVIPIX está lista para descargar",
    html,
    text,
  };
}

export function createSupportTicketResolvedTemplate(params: {
  name: string;
  ticketId: string;
  resolution: string;
  supportEmail: string;
  appUrl: string;
}): EmailTemplate {
  const { name, ticketId, resolution, supportEmail, appUrl } = params;
  
  const { html, text } = createBrandWrapper({
    preheader: `Tu ticket de soporte #${ticketId} fue resuelto`,
    headline: "✓ Tu problema fue resuelto",
    bodyHtml: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Tu ticket de soporte <code style="background:#1A1A1A;padding:2px 6px;border-radius:3px;color:#D4AF37;">#${ticketId}</code> fue resuelto.</p>
      
      <h3 style="color:#D4AF37;margin:20px 0 12px 0;font-size:16px;">📋 Solución:</h3>
      <div style="background:#1A1A1A;padding:16px;border-radius:4px;border-left:3px solid #D4AF37;color:#D0D0D0;line-height:1.6;">
        ${resolution}
      </div>
      
      <p style="margin:20px 0;">Si el problema persiste o tienes más preguntas, responde este correo directamente. Estamos aquí para ayudarte.</p>
    `,
    bodyText: `Hola ${name},\n\nTu ticket #${ticketId} fue resuelto.\n\nSolución:\n${resolution}\n\nSi tienes más preguntas, contáctanos.`,
    ctaButton: { label: "IR A MI PANEL", url: `${appUrl}/dashboard` },
    supportEmail,
    legalNote: "Correo de resolución de ticket de soporte.",
    footerLinks: [
      { label: "Mi Panel", url: `${appUrl}/dashboard` },
      { label: "Contactar Soporte", url: `${appUrl}/soporte` },
    ],
  });

  return {
    subject: "✓ CARVIPIX: Tu problema fue resuelto",
    preheader: `Tu ticket de soporte #${ticketId} fue resuelto`,
    html,
    text,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Funciones auxiliares
// ═══════════════════════════════════════════════════════════════════════

export function renderTemplate(templateType: EmailTemplateType, params: Record<string, unknown>): EmailTemplate {
  switch (templateType) {
    case "welcome-registration":
      return createWelcomeRegistrationTemplate(params as Parameters<typeof createWelcomeRegistrationTemplate>[0]);
    case "password-recovery":
      return createPasswordRecoveryTemplate(params as Parameters<typeof createPasswordRecoveryTemplate>[0]);
    case "founders-welcome":
      return createFoundersProgramWelcomeTemplate(params as Parameters<typeof createFoundersProgramWelcomeTemplate>[0]);
    case "bot-license-purchased":
      return createBotLicensePurchasedTemplate(params as Parameters<typeof createBotLicensePurchasedTemplate>[0]);
    case "support-ticket-resolved":
      return createSupportTicketResolvedTemplate(params as Parameters<typeof createSupportTicketResolvedTemplate>[0]);
    default:
      throw new Error(`Plantilla desconocida: ${templateType}`);
  }
}
