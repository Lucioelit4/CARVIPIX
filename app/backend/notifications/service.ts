import "server-only";

import { getEmailNotificationConfig, hasValidSmtpCredentials } from "./config";
import { buildPaymentTransactionalEmailTemplate, buildWelcomeRegistrationEmailTemplate } from "./templates";
import { NoopEmailProvider, SmtpEmailProvider, type EmailProvider } from "./provider";
import type {
  EmailAddress,
  EmailMessage,
  EmailSendResult,
  EmailSenderRole,
  PaymentTransactionalEmailInput,
  WelcomeRegistrationEmailInput,
} from "./types";

function resolveSenderAddress(role: EmailSenderRole, fromName: string, addresses: { noreply: string; soporte: string; pagos: string }): EmailAddress {
  if (role === "soporte") {
    return { name: `${fromName} Soporte`, email: addresses.soporte };
  }

  if (role === "pagos") {
    return { name: `${fromName} Pagos`, email: addresses.pagos };
  }

  return { name: `${fromName} Notificaciones`, email: addresses.noreply };
}

function createProvider(): EmailProvider {
  const config = getEmailNotificationConfig();

  if (config.transport === "smtp" && hasValidSmtpCredentials(config)) {
    return new SmtpEmailProvider(config);
  }

  if (config.transport === "smtp" && !hasValidSmtpCredentials(config)) {
    console.warn("[CARVIPIX][EMAIL] SMTP seleccionado sin credenciales completas. Se usa proveedor noop.");
  }

  return new NoopEmailProvider();
}

export class EmailNotificationService {
  private readonly config = getEmailNotificationConfig();
  private readonly provider = createProvider();

  async sendEmail(message: Omit<EmailMessage, "from"> & { senderRole?: EmailSenderRole }): Promise<EmailSendResult> {
    const senderRole = message.senderRole ?? "noreply";
    const from = resolveSenderAddress(senderRole, this.config.fromName, this.config.addresses);

    return this.provider.send({
      ...message,
      from,
    });
  }

  async sendWelcomeRegistration(input: WelcomeRegistrationEmailInput): Promise<EmailSendResult> {
    const rendered = buildWelcomeRegistrationEmailTemplate(input, {
      appPublicUrl: this.config.appPublicUrl,
      supportEmail: this.config.addresses.soporte,
    });

    return this.sendEmail({
      senderRole: "noreply",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "X-CARVIPIX-Template": "welcome-registration",
      },
    });
  }

  async sendPaymentTransactional(input: PaymentTransactionalEmailInput): Promise<EmailSendResult> {
    const rendered = buildPaymentTransactionalEmailTemplate(input);

    return this.sendEmail({
      senderRole: "pagos",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.pagos, name: `${this.config.fromName} Pagos` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "X-CARVIPIX-Template": input.templateId,
        "X-CARVIPIX-Payment-Order": input.paymentOrderId,
      },
    });
  }
}
