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
