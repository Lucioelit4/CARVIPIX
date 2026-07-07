import { createHash, createHmac, timingSafeEqual } from "crypto";
import {
  buildMercadoPagoWebhookManifest,
  extractMercadoPagoWebhookDataId,
  normalizeMercadoPagoWebhookTopic,
  normalizeWebhookEventType,
} from "./webhook-logic";
import type { CanonicalWebhookEvent } from "./contracts";

export type SupportedProvider = "stripe" | "mercadopago" | "openpay" | "custom";
export type MercadoPagoEnvironment = "sandbox" | "production";

export type MercadoPagoWebhookSignature = {
  timestamp: string;
  v1: string;
};

export type MercadoPagoCredentials = {
  environment: MercadoPagoEnvironment;
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  applicationId?: string;
  clientId?: string;
  clientSecret?: string;
};

function readFirstDefinedEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function toMercadoPagoEnvironment(value: string | undefined): MercadoPagoEnvironment {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "sandbox" || normalized === "test" ? "sandbox" : "production";
}

function asProvider(value: string | undefined): SupportedProvider | null {
  if (value === "stripe" || value === "mercadopago" || value === "openpay" || value === "custom") {
    return value;
  }

  return null;
}

export function resolveEffectiveProvider(options: {
  preferredProvider?: string;
  runtimeActiveProvider?: string;
  envProvider?: string;
}): SupportedProvider {
  return (
    asProvider(options.preferredProvider) ??
    asProvider(options.runtimeActiveProvider) ??
    asProvider(options.envProvider) ??
    "custom"
  );
}

export function resolveMercadoPagoEnvironment(value: string | undefined): MercadoPagoEnvironment {
  return toMercadoPagoEnvironment(value);
}

export function resolveMercadoPagoCredentials(environment?: MercadoPagoEnvironment): MercadoPagoCredentials {
  const resolvedEnvironment = environment ?? resolveMercadoPagoEnvironment(process.env.PAYMENT_GATEWAY_ENV?.trim().toLowerCase());
  const sandbox = resolvedEnvironment === "sandbox";
  const prefix = sandbox ? "MERCADOPAGO_SANDBOX" : "MERCADOPAGO_PRODUCTION";
  const legacyPrefix = sandbox ? "MERCADOPAGO_TEST" : "MERCADOPAGO_PROD";

  return {
    environment: resolvedEnvironment,
    publicKey: readFirstDefinedEnv(`${prefix}_PUBLIC_KEY`, `${legacyPrefix}_PUBLIC_KEY`) ?? "",
    accessToken: readFirstDefinedEnv(`${prefix}_ACCESS_TOKEN`, `${legacyPrefix}_ACCESS_TOKEN`) ?? "",
    webhookSecret: readFirstDefinedEnv(`${prefix}_WEBHOOK_SECRET`, `${legacyPrefix}_WEBHOOK_SECRET`) ?? "",
    applicationId: readFirstDefinedEnv(`${prefix}_APPLICATION_ID`, `${legacyPrefix}_APPLICATION_ID`),
    clientId: readFirstDefinedEnv(`${prefix}_CLIENT_ID`, `${legacyPrefix}_CLIENT_ID`),
    clientSecret: readFirstDefinedEnv(`${prefix}_CLIENT_SECRET`, `${legacyPrefix}_CLIENT_SECRET`),
  };
}

export function parseMercadoPagoWebhookSignature(signatureHeader: string | undefined): MercadoPagoWebhookSignature | null {
  const raw = String(signatureHeader ?? "").trim();
  if (!raw) {
    return null;
  }

  const parts = new Map<string, string>();
  for (const segment of raw.split(",")) {
    const [key, value] = segment.split("=");
    const normalizedKey = key?.trim().toLowerCase();
    const normalizedValue = value?.trim();
    if (normalizedKey && normalizedValue) {
      parts.set(normalizedKey, normalizedValue);
    }
  }

  const timestamp = parts.get("ts");
  const v1 = parts.get("v1");

  if (!timestamp || !v1) {
    return null;
  }

  return { timestamp, v1 };
}

export function buildMercadoPagoWebhookSignatureManifest(input: {
  dataId: string;
  requestId: string;
  timestamp: string;
}): string {
  return buildMercadoPagoWebhookManifest(input);
}

export function signMercadoPagoWebhookManifest(manifest: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(manifest).digest("hex");
}

export function verifyMercadoPagoWebhookSignature(input: {
  signatureHeader?: string;
  requestId?: string;
  dataId?: string;
  webhookSecret: string;
}): boolean {
  const parsed = parseMercadoPagoWebhookSignature(input.signatureHeader);
  if (!parsed || !input.requestId || !input.dataId || !input.webhookSecret) {
    return false;
  }

  const manifest = buildMercadoPagoWebhookSignatureManifest({
    dataId: input.dataId,
    requestId: input.requestId,
    timestamp: parsed.timestamp,
  });

  const expected = signMercadoPagoWebhookManifest(manifest, input.webhookSecret);
  const signatureBuffer = Buffer.from(parsed.v1);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function parseMercadoPagoWebhookEvent(input: { payloadRaw: string }): CanonicalWebhookEvent {
  const parsed = JSON.parse(input.payloadRaw) as Record<string, unknown>;
  const topic = normalizeMercadoPagoWebhookTopic(
    typeof parsed.type === "string"
      ? parsed.type
      : typeof parsed.topic === "string"
        ? parsed.topic
        : typeof parsed.action === "string"
          ? parsed.action
          : undefined
  );

  const dataId = extractMercadoPagoWebhookDataId(parsed);
  const paymentOrderId = typeof parsed.external_reference === "string" ? parsed.external_reference : undefined;
  const currency = typeof parsed.currency_id === "string" ? parsed.currency_id : undefined;
  const amountRaw = parsed.transaction_amount;
  const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw ?? 0);

  const providerEventId =
    (typeof parsed.id === "string" && parsed.id) ||
    (typeof parsed.notification_id === "string" && parsed.notification_id) ||
    `evt-${createHash("sha256").update(input.payloadRaw).digest("hex").slice(0, 24)}`;

  return {
    providerEventId,
    eventType: topic === "chargebacks" ? "chargeback_created" : normalizeWebhookEventType(typeof parsed.action === "string" ? parsed.action : undefined),
    paymentOrderId,
    providerPaymentId: topic === "payment" ? dataId : undefined,
    providerCheckoutId: topic === "order" ? dataId : undefined,
    providerSubscriptionId: topic === "subscription_preapproval" || topic === "subscription_authorized_payment" || topic === "subscription_preapproval_plan" ? dataId : undefined,
    amount: Number.isFinite(amount) && amount > 0 ? { amount, currency: currency ?? "USD" } : undefined,
    currency: currency ?? "USD",
    failureReason: typeof parsed.status_detail === "string" ? parsed.status_detail : undefined,
    occurredAt:
      typeof parsed.date_created === "string" && parsed.date_created
        ? new Date(parsed.date_created)
        : new Date(),
    raw: {
      ...parsed,
      mercadopagoTopic: topic,
      mercadopagoDataId: dataId,
    },
  };
}

export function buildMockCheckoutSession(input: {
  provider: SupportedProvider;
  orderId: string;
  returnUrl: string;
  now?: Date;
  randomFragment?: string;
}) {
  const now = input.now ?? new Date();
  const random = input.randomFragment ?? Math.random().toString(36).slice(2, 8);
  const providerCheckoutId = `${input.provider}-checkout-${now.getTime()}-${random}`;

  return {
    provider: input.provider,
    providerCheckoutId,
    checkoutUrl: `${input.returnUrl.replace(/\/$/, "")}?providerCheckoutId=${providerCheckoutId}&orderId=${input.orderId}`,
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    raw: {
      placeholder: true,
      provider: input.provider,
      connectionStatus: "not_connected",
    },
  };
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  headerName: string
): string | null {
  const target = headerName.toLowerCase();
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === target);
  if (!key) {
    return null;
  }

  const raw = headers[key];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }

  return raw ?? null;
}

export function signMockWebhookPayload(payloadRaw: string, webhookSecret: string): string {
  return createHmac("sha256", webhookSecret).update(payloadRaw).digest("hex");
}

export function verifyMockWebhookSignature(input: {
  payloadRaw: string;
  headers: Record<string, string | string[] | undefined>;
  webhookSecret: string;
  signatureHeaderName?: string;
}): boolean {
  const signature = getHeaderValue(input.headers, input.signatureHeaderName ?? "x-mock-signature");
  if (!signature || !input.webhookSecret) {
    return false;
  }

  const expected = signMockWebhookPayload(input.payloadRaw, input.webhookSecret);
  const signatureBuffer = Buffer.from(signature.trim());
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function parseMockWebhookEvent(input: { payloadRaw: string }) {
  const parsed = JSON.parse(input.payloadRaw) as Record<string, unknown>;

  const amountRaw = parsed.amount;
  const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw ?? 0);
  const currency = typeof parsed.currency === "string" ? parsed.currency : "USD";

  return {
    providerEventId:
      (typeof parsed.eventId === "string" && parsed.eventId) ||
      (typeof parsed.providerEventId === "string" && parsed.providerEventId) ||
      `evt-${createHash("sha256").update(input.payloadRaw).digest("hex").slice(0, 24)}`,
    eventType: normalizeWebhookEventType(typeof parsed.eventType === "string" ? parsed.eventType : undefined),
    paymentOrderId: typeof parsed.paymentOrderId === "string" ? parsed.paymentOrderId : undefined,
    providerPaymentId: typeof parsed.providerPaymentId === "string" ? parsed.providerPaymentId : undefined,
    providerCheckoutId: typeof parsed.providerCheckoutId === "string" ? parsed.providerCheckoutId : undefined,
    providerSubscriptionId: typeof parsed.providerSubscriptionId === "string" ? parsed.providerSubscriptionId : undefined,
    amount: Number.isFinite(amount) && amount > 0 ? { amount, currency } : undefined,
    currency,
    failureReason: typeof parsed.failureReason === "string" ? parsed.failureReason : undefined,
    occurredAt:
      typeof parsed.occurredAt === "string" && parsed.occurredAt
        ? new Date(parsed.occurredAt)
        : new Date(),
    raw: parsed,
  };
}
