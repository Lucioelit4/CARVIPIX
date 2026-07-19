import "server-only";

import { resolvePublicAppUrl } from "@/app/lib/url/public-app-url";

export type EmailTransportMode = "smtp" | "resend" | "noop";

export type EmailNotificationConfig = {
  transport: EmailTransportMode;
  appPublicUrl: string;
  fromName: string;
  resend: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  addresses: {
    noreply: string;
    soporte: string;
    pagos: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
};

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveTransportMode(value: string | undefined): EmailTransportMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "smtp" || normalized === "resend") {
    return normalized;
  }

  if (normalized === "noop") {
    return "noop";
  }

  if (normalized === "resend") {
    return "resend";
  }

  if (normalized === "smtp") {
    return "smtp";
  }

  return "noop";
}

export function getEmailNotificationConfig(): EmailNotificationConfig {
  const config: EmailNotificationConfig = {
    transport: resolveTransportMode(process.env.EMAIL_TRANSPORT),
    appPublicUrl: resolvePublicAppUrl(),
    fromName: process.env.EMAIL_FROM_NAME?.trim() || "CARVIPIX",
    resend: {
      apiKey: process.env.RESEND_API_KEY?.trim() || "",
      fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || "",
      fromName: process.env.RESEND_FROM_NAME?.trim() || process.env.EMAIL_FROM_NAME?.trim() || "CARVIPIX",
    },
    addresses: {
      noreply: process.env.EMAIL_NOREPLY_ADDRESS?.trim() || "noreply@carvipix.com",
      soporte: process.env.EMAIL_SUPPORT_ADDRESS?.trim() || "soporte@carvipix.com",
      pagos: process.env.EMAIL_PAYMENTS_ADDRESS?.trim() || "pagos@carvipix.com",
    },
    smtp: {
      host: process.env.EMAIL_SMTP_HOST?.trim() || "",
      port: asNumber(process.env.EMAIL_SMTP_PORT, 587),
      secure: asBoolean(process.env.EMAIL_SMTP_SECURE, false),
      user: process.env.EMAIL_SMTP_USER?.trim() || "",
      password: process.env.EMAIL_SMTP_PASSWORD?.trim() || "",
    },
  };

  return config;
}

export function hasValidSmtpCredentials(config: EmailNotificationConfig): boolean {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.password);
}

export function hasValidResendCredentials(config: EmailNotificationConfig): boolean {
  return Boolean(config.resend.apiKey && config.resend.fromEmail);
}
