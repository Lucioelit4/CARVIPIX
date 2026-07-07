import { PaymentStateMachine } from "./state-machine-logic";
import type { PaymentOrderStatus } from "./types";

export function createExternalOrderCode(now = new Date(), randomFragment?: string): string {
  const timestamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = (randomFragment ?? Math.random().toString(36).slice(2, 6)).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function canCreateCheckoutSessionFromStatus(status: PaymentOrderStatus): boolean {
  return status === "created" || status === "pending_provider";
}

export function deriveCheckoutProgression(status: PaymentOrderStatus) {
  const pendingProviderStatus = PaymentStateMachine.transitionOrder(status, "pending_provider");
  const awaitingConfirmationStatus = PaymentStateMachine.transitionOrder(pendingProviderStatus, "awaiting_confirmation");

  return {
    pendingProviderStatus,
    awaitingConfirmationStatus,
  };
}
