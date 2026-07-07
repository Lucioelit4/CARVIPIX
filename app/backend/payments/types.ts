import type { ServicePaymentMethod } from "@/app/backend/contracts";

export type PaymentGatewayProvider = "mock" | "stripe" | "mercadopago" | "openpay" | "custom";

export type PaymentAuthorizationStatus = "approved" | "declined" | "pending";

export interface PaymentAuthorizationRequest {
  orderId: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  method: ServicePaymentMethod;
}

export interface PaymentAuthorizationResult {
  status: PaymentAuthorizationStatus;
  externalReferenceId?: string;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentGateway {
  provider: PaymentGatewayProvider;
  authorizePayment(input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult>;
}
