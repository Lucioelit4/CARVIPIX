import "server-only";

import type { Money, PaymentMethodType, ProviderName } from "./types";

export interface CreateCheckoutSessionInput {
  orderId: string;
  userId: string;
  productId: string;
  amount: Money;
  paymentMethod?: PaymentMethodType;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCheckoutSessionResult {
  provider: ProviderName;
  providerCheckoutId: string;
  checkoutUrl: string;
  expiresAt?: Date;
  raw?: Record<string, unknown>;
}

export interface VerifyWebhookInput {
  payloadRaw: string;
  headers: Record<string, string | string[] | undefined>;
  webhookSecret: string;
}

export interface ParseWebhookInput {
  payloadRaw: string;
  headers: Record<string, string | string[] | undefined>;
}

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

export interface CanonicalWebhookEvent {
  providerEventId: string;
  eventType: CanonicalWebhookEventType;
  paymentOrderId?: string;
  providerPaymentId?: string;
  providerCheckoutId?: string;
  providerSubscriptionId?: string;
  amount?: Money;
  currency?: string;
  failureReason?: string;
  occurredAt: Date;
  raw: Record<string, unknown>;
}

export interface CanonicalPaymentStatus {
  providerPaymentId: string;
  status: "pending" | "authorized" | "captured" | "failed" | "refunded";
  amount?: Money;
  raw?: Record<string, unknown>;
}

export interface ProviderPaymentAdapter {
  provider: ProviderName;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult>;
  verifyWebhookSignature(input: VerifyWebhookInput): Promise<boolean>;
  parseWebhookEvent(input: ParseWebhookInput): Promise<CanonicalWebhookEvent>;
  getPaymentStatus(providerPaymentId: string): Promise<CanonicalPaymentStatus>;
}
