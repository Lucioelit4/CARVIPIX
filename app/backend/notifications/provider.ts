import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailSendResult } from "./types";
import type { EmailNotificationConfig } from "./config";

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

function normalizeAddresses(input: EmailMessage["to"]): string {
  const addresses = Array.isArray(input) ? input : [input];
  return addresses
    .map((address) => (address.name ? `${address.name} <${address.email}>` : address.email))
    .join(", ");
}

function formatAddress(address: { name?: string; email: string }): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

export class NoopEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.info("[CARVIPIX][EMAIL][NOOP]", {
      to: normalizeAddresses(message.to),
      from: formatAddress(message.from),
      subject: message.subject,
    });

    return {
      accepted: true,
      provider: "noop",
      messageId: `noop-${Date.now()}`,
    };
  }
}

export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(config: EmailNotificationConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const to = normalizeAddresses(message.to);
    const result = await this.transporter.sendMail({
      from: formatAddress(message.from),
      to,
      replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
    });

    return {
      accepted: result.accepted.length > 0,
      provider: "smtp",
      messageId: result.messageId,
    };
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly config: EmailNotificationConfig) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const actualFrom = formatAddress(message.from);
    const configuredFrom = this.config.resend.fromEmail
      ? `${this.config.resend.fromName} <${this.config.resend.fromEmail}>`
      : null;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.resend.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: actualFrom,
        to: Array.isArray(message.to) ? message.to.map((item) => formatAddress(item)) : [formatAddress(message.to)],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo ? formatAddress(message.replyTo) : undefined,
        headers: message.headers,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[CARVIPIX][EMAIL][RESEND-FAILED]", {
        status: response.status,
        from: actualFrom,
        configuredFrom,
        usesResendDev: actualFrom.toLowerCase().includes("resend.dev"),
        replyTo: message.replyTo ? formatAddress(message.replyTo) : null,
        errorText: errorText || "REQUEST_FAILED",
      });
      throw new Error(`RESEND_HTTP_${response.status}:${errorText || "REQUEST_FAILED"}`);
    }

    const payload = (await response.json().catch(() => ({}))) as { id?: string };

    return {
      accepted: true,
      provider: "resend",
      messageId: payload.id,
    };
  }
}
