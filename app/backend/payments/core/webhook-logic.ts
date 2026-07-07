import { createHash } from "crypto";
import type { PaymentOrderStatus, PaymentTransactionStatus } from "./types";

export type CanonicalWebhookEventType =
  | "payment_authorized"
  | "payment_captured"
  | "payment_failed"
  | "payment_refunded"
  | "subscription_renewed"
  | "subscription_payment_failed"
  | "subscription_cancelled"
  | "chargeback_created"
  | "unknown";

export type MercadoPagoWebhookTopic =
  | "payment"
  | "subscription_preapproval"
  | "subscription_authorized_payment"
  | "subscription_preapproval_plan"
  | "order"
  | "chargebacks"
  | "claims"
  | "wallet_connect"
  | "unknown";

export function normalizeMercadoPagoWebhookTopic(raw: string | undefined): MercadoPagoWebhookTopic {
  const value = (raw ?? "").trim().toLowerCase();

  if (["payment", "payments"].includes(value)) {
    return "payment";
  }

  if (["subscription_preapproval", "preapproval"].includes(value)) {
    return "subscription_preapproval";
  }

  if (["subscription_authorized_payment", "authorized_payment"].includes(value)) {
    return "subscription_authorized_payment";
  }

  if (["subscription_preapproval_plan", "preapproval_plan"].includes(value)) {
    return "subscription_preapproval_plan";
  }

  if (["order", "orders"].includes(value)) {
    return "order";
  }

  if (["chargebacks", "chargeback"].includes(value)) {
    return "chargebacks";
  }

  if (["claims", "topic_claims_integration_wh"].includes(value)) {
    return "claims";
  }

  if (["wallet_connect", "mp-connect"].includes(value)) {
    return "wallet_connect";
  }

  return "unknown";
}

export function extractMercadoPagoWebhookDataId(payload: Record<string, unknown>): string | undefined {
  const data = payload.data;
  if (data && typeof data === "object") {
    const dataId = (data as { id?: unknown }).id;
    if (typeof dataId === "string" && dataId.trim()) {
      return dataId.trim();
    }
  }

  const resource = payload.resource;
  if (typeof resource === "string" && resource.trim()) {
    const trimmed = resource.trim();
    const parts = trimmed.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? trimmed;
  }

  const id = payload.id;
  if (typeof id === "string" && id.trim()) {
    return id.trim();
  }

  return undefined;
}

export function buildMercadoPagoWebhookManifest(input: {
  dataId: string;
  requestId: string;
  timestamp: string;
}): string {
  return `id:${input.dataId};request-id:${input.requestId};ts:${input.timestamp};`;
}

export function normalizeWebhookEventType(raw: string | undefined): CanonicalWebhookEventType {
  const value = (raw ?? "").trim().toLowerCase();

  if (["payment_authorized", "authorized", "authorization.succeeded"].includes(value)) {
    return "payment_authorized";
  }

  if (["payment_captured", "captured", "payment.succeeded"].includes(value)) {
    return "payment_captured";
  }

  if (["payment_failed", "failed", "payment.failed"].includes(value)) {
    return "payment_failed";
  }

  if (["payment_refunded", "refunded", "refund.succeeded"].includes(value)) {
    return "payment_refunded";
  }

  if (["subscription_renewed", "subscription_payment_succeeded"].includes(value)) {
    return "subscription_renewed";
  }

  if (["subscription_payment_failed"].includes(value)) {
    return "subscription_payment_failed";
  }

  if (["subscription_cancelled", "subscription_canceled"].includes(value)) {
    return "subscription_cancelled";
  }

  if (["chargeback_created", "chargeback"].includes(value)) {
    return "chargeback_created";
  }

  return "unknown";
}

export function buildWebhookFingerprint(input: {
  provider: string;
  providerEventId: string;
  payloadRaw: string;
}): string {
  const payloadHash = createHash("sha256").update(input.payloadRaw).digest("hex");
  return createHash("sha256")
    .update(`${input.provider}:${input.providerEventId}:${payloadHash}`)
    .digest("hex");
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code;
  const message = String((error as { message?: string }).message ?? "").toLowerCase();

  return code === "23505" || message.includes("duplicate key");
}

export function deriveTransactionStatusPath(
  current: PaymentTransactionStatus,
  eventType: CanonicalWebhookEventType
): PaymentTransactionStatus[] {
  if (eventType === "payment_authorized") {
    return current === "initiated" ? ["authorized"] : [];
  }

  if (eventType === "payment_captured") {
    if (current === "initiated") {
      return ["authorized", "captured"];
    }
    if (current === "authorized") {
      return ["captured"];
    }
    return [];
  }

  if (eventType === "payment_failed") {
    if (current === "initiated" || current === "authorized") {
      return ["failed"];
    }
    return [];
  }

  if (eventType === "payment_refunded") {
    if (current === "captured" || current === "settled") {
      return ["refunded"];
    }
    if (current === "partially_refunded") {
      return ["refunded"];
    }
    return [];
  }

  return [];
}

export function deriveOrderTargetStatus(input: {
  current: PaymentOrderStatus;
  eventType: CanonicalWebhookEventType;
  refundedAmount?: number;
  orderTotal?: number;
}): PaymentOrderStatus | null {
  if (input.eventType === "payment_captured") {
    return "paid";
  }

  if (input.eventType === "payment_failed") {
    return "failed";
  }

  if (input.eventType === "payment_refunded") {
    if (typeof input.refundedAmount === "number" && typeof input.orderTotal === "number" && input.refundedAmount < input.orderTotal) {
      return "partially_refunded";
    }
    return "refunded";
  }

  return null;
}
