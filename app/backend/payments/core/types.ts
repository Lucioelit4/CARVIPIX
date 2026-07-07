import "server-only";

export type ProviderName = "stripe" | "mercadopago" | "openpay" | "custom";

export type PaymentMethodType =
  | "card_credit"
  | "card_debit"
  | "bank_transfer"
  | "spei"
  | "cash_voucher"
  | "wallet"
  | "other";

export type PaymentOrderStatus =
  | "created"
  | "pending_provider"
  | "awaiting_confirmation"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "expired";

export type PaymentTransactionStatus =
  | "initiated"
  | "authorized"
  | "captured"
  | "settled"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "chargeback";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "cancelled" | "expired";

export type MembershipStatus = "inactive" | "active" | "grace_period" | "suspended" | "cancelled";

export interface Money {
  amount: number;
  currency: string;
}

export interface BillingProfile {
  id: string;
  userId: string;
  legalName: string;
  taxId?: string;
  taxCountry?: string;
  taxRegime?: string;
  fiscalEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodReference {
  id: string;
  userId: string;
  provider: ProviderName;
  providerPaymentMethodId?: string;
  tokenReference: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  alias?: string;
  paymentType?: PaymentMethodType;
  isDefault: boolean;
  status: "active" | "inactive" | "expired" | "revoked";
  billingProfileId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertBillingProfileInput {
  id: string;
  userId: string;
  legalName: string;
  taxId?: string;
  taxCountry?: string;
  taxRegime?: string;
  fiscalEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  isDefault: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpsertPaymentMethodReferenceInput {
  id: string;
  userId: string;
  provider: ProviderName;
  providerPaymentMethodId?: string;
  tokenReference: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  alias?: string;
  paymentType?: PaymentMethodType;
  isDefault: boolean;
  status: "active" | "inactive" | "expired" | "revoked";
  billingProfileId?: string;
  metadata?: Record<string, unknown>;
}
