export type PaymentEmailTemplateId =
  | "membership-payment-confirmed"
  | "membership-renewal"
  | "payment-failed"
  | "payment-refunded";

export function resolvePaymentEmailTemplateId(eventType: string): PaymentEmailTemplateId | null {
  const normalized = String(eventType ?? "").trim().toLowerCase();

  if (normalized === "payment_captured") {
    return "membership-payment-confirmed";
  }

  if (normalized === "subscription_renewed") {
    return "membership-renewal";
  }

  if (normalized === "subscription_payment_failed" || normalized === "payment_failed") {
    return "payment-failed";
  }

  if (normalized === "payment_refunded") {
    return "payment-refunded";
  }

  return null;
}

export function buildPaymentEmailDedupeKey(input: {
  transactionId: string;
  eventType: string;
  providerPaymentId?: string | null;
  providerSubscriptionId?: string | null;
}): string {
  const eventType = String(input.eventType ?? "").trim().toLowerCase();
  const providerRef =
    String(input.providerPaymentId ?? "").trim() ||
    String(input.providerSubscriptionId ?? "").trim() ||
    "na";

  return `email:${input.transactionId}:${eventType}:${providerRef}`;
}

export function getRetryBackoffSeconds(attempt: number): number {
  if (attempt <= 1) {
    return 60;
  }

  if (attempt === 2) {
    return 5 * 60;
  }

  if (attempt === 3) {
    return 15 * 60;
  }

  if (attempt === 4) {
    return 60 * 60;
  }

  return 4 * 60 * 60;
}

export function calculateNextRetryAt(input: { now: Date; attempt: number }): Date {
  const backoffSeconds = getRetryBackoffSeconds(input.attempt);
  return new Date(input.now.getTime() + backoffSeconds * 1000);
}

export function shouldFinalizeAsFailed(input: { attempt: number; maxRetries: number }): boolean {
  return input.attempt >= input.maxRetries;
}
