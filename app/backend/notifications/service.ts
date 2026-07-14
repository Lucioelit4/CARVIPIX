import "server-only";

import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { getEmailNotificationConfig, hasValidSmtpCredentials } from "./config";
import {
  buildIdentityVerificationApprovedEmailTemplate,
  buildIdentityVerificationNewDocumentEmailTemplate,
  buildIdentityVerificationReceivedEmailTemplate,
  buildIdentityVerificationRejectedEmailTemplate,
  buildPasswordChangedEmailTemplate,
  buildPasswordResetEmailTemplate,
  buildPaymentTransactionalEmailTemplate,
  buildPromotionCampaignEmailTemplate,
  buildWelcomeActivatedEmailTemplate,
  buildWelcomeRegistrationEmailTemplate,
} from "./templates";
import { NoopEmailProvider, ResendEmailProvider, SmtpEmailProvider, type EmailProvider } from "./provider";
import type {
  EmailAddress,
  EmailMessage,
  EmailSendResult,
  EmailSenderRole,
  IdentityVerificationApprovedEmailInput,
  IdentityVerificationNewDocumentEmailInput,
  IdentityVerificationReceivedEmailInput,
  IdentityVerificationRejectedEmailInput,
  PasswordChangedEmailInput,
  PasswordResetEmailInput,
  PaymentTransactionalEmailInput,
  PromotionCampaignEmailInput,
  WelcomeActivatedEmailInput,
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

  if (config.transport === "resend") {
    if (!config.resend.apiKey || !config.resend.fromEmail) {
      console.warn("[CARVIPIX][EMAIL] RESEND seleccionado sin credenciales completas. Se usa proveedor noop.");
      return new NoopEmailProvider();
    }

    return new ResendEmailProvider(config);
  }

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

    try {
      const result = await this.provider.send({
        ...message,
        from,
      });

      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const templateId = message.headers?.["X-CARVIPIX-Template"] ?? "unknown";
      const providerResult = result.provider;

      try {
        await recordCommercialAuditEvent({
          actorType: "system",
          action: result.accepted ? "communications.email.sent" : "communications.email.noop",
          resource: templateId,
          result: result.accepted ? "success" : "error",
          metadata: {
            provider: providerResult,
            messageId: result.messageId ?? null,
            recipients: recipients.map((item) => item.email),
            senderRole,
          },
        });
      } catch {
        // Non-blocking: communication audit must not break transactional delivery.
      }

      return result;
    } catch (error) {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const templateId = message.headers?.["X-CARVIPIX-Template"] ?? "unknown";

      try {
        await recordCommercialAuditEvent({
          actorType: "system",
          action: "communications.email.failed",
          resource: templateId,
          result: "error",
          metadata: {
            recipients: recipients.map((item) => item.email),
            senderRole,
            reason: error instanceof Error ? error.message : "unknown",
          },
        });
      } catch {
        // Non-blocking: communication audit must not mask original send failure.
      }

      throw error;
    }
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

  async sendPasswordReset(input: PasswordResetEmailInput): Promise<EmailSendResult> {
    const rendered = buildPasswordResetEmailTemplate(input, {
      appPublicUrl: this.config.appPublicUrl,
      supportEmail: this.config.addresses.soporte,
    });

    return this.sendEmail({
      senderRole: "soporte",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "X-CARVIPIX-Template": "security-password-reset",
      },
    });
  }

  async sendWelcomeActivated(input: WelcomeActivatedEmailInput): Promise<EmailSendResult> {
    const rendered = buildWelcomeActivatedEmailTemplate(input, {
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
        "X-CARVIPIX-Template": "account-activated-welcome",
      },
    });
  }

  async sendPasswordChangedConfirmation(input: PasswordChangedEmailInput): Promise<EmailSendResult> {
    const rendered = buildPasswordChangedEmailTemplate(input, {
      appPublicUrl: this.config.appPublicUrl,
      supportEmail: this.config.addresses.soporte,
    });

    return this.sendEmail({
      senderRole: "soporte",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "X-CARVIPIX-Template": "security-password-changed",
      },
    });
  }

  async sendIdentityVerificationReceived(input: IdentityVerificationReceivedEmailInput): Promise<EmailSendResult> {
    const rendered = buildIdentityVerificationReceivedEmailTemplate(input, {
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
      headers: { "X-CARVIPIX-Template": "identity-verification-received" },
    });
  }

  async sendIdentityVerificationApproved(input: IdentityVerificationApprovedEmailInput): Promise<EmailSendResult> {
    const rendered = buildIdentityVerificationApprovedEmailTemplate(input, {
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
      headers: { "X-CARVIPIX-Template": "identity-verification-approved" },
    });
  }

  async sendIdentityVerificationRejected(input: IdentityVerificationRejectedEmailInput): Promise<EmailSendResult> {
    const rendered = buildIdentityVerificationRejectedEmailTemplate(input, {
      appPublicUrl: this.config.appPublicUrl,
      supportEmail: this.config.addresses.soporte,
    });

    return this.sendEmail({
      senderRole: "soporte",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: { "X-CARVIPIX-Template": "identity-verification-rejected" },
    });
  }

  async sendIdentityVerificationNewDocumentRequest(input: IdentityVerificationNewDocumentEmailInput): Promise<EmailSendResult> {
    const rendered = buildIdentityVerificationNewDocumentEmailTemplate(input, {
      appPublicUrl: this.config.appPublicUrl,
      supportEmail: this.config.addresses.soporte,
    });

    return this.sendEmail({
      senderRole: "soporte",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: { "X-CARVIPIX-Template": "identity-verification-new-document" },
    });
  }

  async sendPromotionCampaign(input: PromotionCampaignEmailInput): Promise<EmailSendResult> {
    const rendered = buildPromotionCampaignEmailTemplate(input);

    return this.sendEmail({
      senderRole: "noreply",
      to: { email: input.recipientEmail, name: input.recipientName },
      replyTo: { email: this.config.addresses.soporte, name: `${this.config.fromName} Soporte` },
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "X-CARVIPIX-Template": "campaign-promotion",
        "X-CARVIPIX-Campaign": input.campaignName,
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
