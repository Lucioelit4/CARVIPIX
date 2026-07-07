import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import {
  deletePaymentMethodReference as deletePaymentMethodReferenceLocal,
  listBillingProfiles as listBillingProfilesLocal,
  listPaymentMethodReferences as listPaymentMethodReferencesLocal,
  upsertBillingProfile as upsertBillingProfileLocal,
  upsertPaymentMethodReference as upsertPaymentMethodReferenceLocal,
} from "@/app/backend/core/local-auth-store";
import type {
  BillingProfile,
  PaymentMethodReference,
  UpsertBillingProfileInput,
  UpsertPaymentMethodReferenceInput,
} from "./types";

type BillingProfileRow = {
  id: string;
  user_id: string;
  legal_name: string;
  tax_id: string | null;
  tax_country: string | null;
  tax_regime: string | null;
  fiscal_email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country_code: string | null;
  is_default: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

type PaymentMethodReferenceRow = {
  id: string;
  user_id: string;
  provider: "stripe" | "mercadopago" | "openpay" | "custom";
  provider_payment_method_id: string | null;
  token_reference: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  alias: string | null;
  payment_type: "card_credit" | "card_debit" | "bank_transfer" | "spei" | "cash_voucher" | "wallet" | "other" | null;
  is_default: boolean;
  status: "active" | "inactive" | "expired" | "revoked";
  billing_profile_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

function toBillingProfile(row: BillingProfileRow): BillingProfile {
  return {
    id: row.id,
    userId: row.user_id,
    legalName: row.legal_name,
    taxId: row.tax_id ?? undefined,
    taxCountry: row.tax_country ?? undefined,
    taxRegime: row.tax_regime ?? undefined,
    fiscalEmail: row.fiscal_email ?? undefined,
    addressLine1: row.address_line1 ?? undefined,
    addressLine2: row.address_line2 ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    postalCode: row.postal_code ?? undefined,
    countryCode: row.country_code ?? undefined,
    isDefault: row.is_default,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toPaymentMethodReference(row: PaymentMethodReferenceRow): PaymentMethodReference {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerPaymentMethodId: row.provider_payment_method_id ?? undefined,
    tokenReference: row.token_reference,
    brand: row.brand ?? undefined,
    last4: row.last4 ?? undefined,
    expMonth: row.exp_month ?? undefined,
    expYear: row.exp_year ?? undefined,
    alias: row.alias ?? undefined,
    paymentType: row.payment_type ?? undefined,
    isDefault: row.is_default,
    status: row.status,
    billingProfileId: row.billing_profile_id ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function assertSafePaymentMethodReference(input: UpsertPaymentMethodReferenceInput): void {
  if (!input.tokenReference.trim()) {
    throw new Error("tokenReference es requerido");
  }

  if (input.last4 && !/^\d{4}$/.test(input.last4)) {
    throw new Error("last4 debe contener 4 digitos");
  }

  if (input.expMonth && (input.expMonth < 1 || input.expMonth > 12)) {
    throw new Error("expMonth invalido");
  }
}

export class BillingProfileRepository {
  async listByUser(userId: string): Promise<BillingProfile[]> {
    if (!backendDatabase.enabled) {
      const localItems = await listBillingProfilesLocal(userId);
      return localItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        legalName: item.legalName,
        taxId: item.taxId,
        taxCountry: item.taxCountry,
        taxRegime: item.taxRegime,
        fiscalEmail: item.fiscalEmail,
        addressLine1: item.addressLine1,
        addressLine2: item.addressLine2,
        city: item.city,
        state: item.state,
        postalCode: item.postalCode,
        countryCode: item.countryCode,
        isDefault: item.isDefault,
        metadata: item.metadata,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    }

    const result = await backendDatabase.query<BillingProfileRow>(
      `
      SELECT *
      FROM billing_profiles
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [userId]
    );

    return result.rows.map(toBillingProfile);
  }

  async upsert(input: UpsertBillingProfileInput): Promise<BillingProfile> {
    if (!input.legalName.trim()) {
      throw new Error("legalName es requerido");
    }

    const metadata = input.metadata ?? {};

    if (!backendDatabase.enabled) {
      const local = await upsertBillingProfileLocal({
        id: input.id,
        userId: input.userId,
        legalName: input.legalName,
        taxId: input.taxId,
        taxCountry: input.taxCountry,
        taxRegime: input.taxRegime,
        fiscalEmail: input.fiscalEmail,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        countryCode: input.countryCode,
        isDefault: input.isDefault,
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        id: local.id,
        userId: local.userId,
        legalName: local.legalName,
        taxId: local.taxId,
        taxCountry: local.taxCountry,
        taxRegime: local.taxRegime,
        fiscalEmail: local.fiscalEmail,
        addressLine1: local.addressLine1,
        addressLine2: local.addressLine2,
        city: local.city,
        state: local.state,
        postalCode: local.postalCode,
        countryCode: local.countryCode,
        isDefault: local.isDefault,
        metadata: local.metadata,
        createdAt: new Date(local.createdAt),
        updatedAt: new Date(local.updatedAt),
      };
    }

    return backendDatabase.withTransaction(async (client) => {
      const now = new Date();

      if (input.isDefault) {
        await client.query(
          `
          UPDATE billing_profiles
          SET is_default = false,
              updated_at = $2
          WHERE user_id = $1
          `,
          [input.userId, now]
        );
      }

      const result = await client.query<BillingProfileRow>(
        `
        INSERT INTO billing_profiles (
          id, user_id, legal_name, tax_id, tax_country, tax_regime, fiscal_email,
          address_line1, address_line2, city, state, postal_code, country_code,
          is_default, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15::jsonb, $16, $16
        )
        ON CONFLICT (id) DO UPDATE SET
          legal_name = EXCLUDED.legal_name,
          tax_id = EXCLUDED.tax_id,
          tax_country = EXCLUDED.tax_country,
          tax_regime = EXCLUDED.tax_regime,
          fiscal_email = EXCLUDED.fiscal_email,
          address_line1 = EXCLUDED.address_line1,
          address_line2 = EXCLUDED.address_line2,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          postal_code = EXCLUDED.postal_code,
          country_code = EXCLUDED.country_code,
          is_default = EXCLUDED.is_default,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
        RETURNING *
        `,
        [
          input.id,
          input.userId,
          input.legalName,
          input.taxId ?? null,
          input.taxCountry ?? null,
          input.taxRegime ?? null,
          input.fiscalEmail ?? null,
          input.addressLine1 ?? null,
          input.addressLine2 ?? null,
          input.city ?? null,
          input.state ?? null,
          input.postalCode ?? null,
          input.countryCode ?? null,
          input.isDefault,
          JSON.stringify(metadata),
          now,
        ]
      );

      return toBillingProfile(result.rows[0]);
    });
  }
}

export class PaymentMethodReferenceRepository {
  async listByUser(userId: string): Promise<PaymentMethodReference[]> {
    if (!backendDatabase.enabled) {
      const localItems = await listPaymentMethodReferencesLocal(userId);
      return localItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        provider: item.provider,
        providerPaymentMethodId: item.providerPaymentMethodId,
        tokenReference: item.tokenReference,
        brand: item.brand,
        last4: item.last4,
        expMonth: item.expMonth,
        expYear: item.expYear,
        alias: item.alias,
        paymentType: item.paymentType,
        isDefault: item.isDefault,
        status: item.status,
        billingProfileId: item.billingProfileId,
        metadata: item.metadata,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    }

    const result = await backendDatabase.query<PaymentMethodReferenceRow>(
      `
      SELECT *
      FROM payment_method_references
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [userId]
    );

    return result.rows.map(toPaymentMethodReference);
  }

  async upsert(input: UpsertPaymentMethodReferenceInput): Promise<PaymentMethodReference> {
    assertSafePaymentMethodReference(input);
    const metadata = input.metadata ?? {};

    if (!backendDatabase.enabled) {
      const local = await upsertPaymentMethodReferenceLocal({
        id: input.id,
        userId: input.userId,
        provider: input.provider,
        providerPaymentMethodId: input.providerPaymentMethodId,
        tokenReference: input.tokenReference,
        brand: input.brand,
        last4: input.last4,
        expMonth: input.expMonth,
        expYear: input.expYear,
        alias: input.alias,
        paymentType: input.paymentType,
        isDefault: input.isDefault,
        status: input.status,
        billingProfileId: input.billingProfileId,
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        id: local.id,
        userId: local.userId,
        provider: local.provider,
        providerPaymentMethodId: local.providerPaymentMethodId,
        tokenReference: local.tokenReference,
        brand: local.brand,
        last4: local.last4,
        expMonth: local.expMonth,
        expYear: local.expYear,
        alias: local.alias,
        paymentType: local.paymentType,
        isDefault: local.isDefault,
        status: local.status,
        billingProfileId: local.billingProfileId,
        metadata: local.metadata,
        createdAt: new Date(local.createdAt),
        updatedAt: new Date(local.updatedAt),
      };
    }

    return backendDatabase.withTransaction(async (client) => {
      const now = new Date();

      if (input.isDefault) {
        await client.query(
          `
          UPDATE payment_method_references
          SET is_default = false,
              updated_at = $2
          WHERE user_id = $1
          `,
          [input.userId, now]
        );
      }

      const result = await client.query<PaymentMethodReferenceRow>(
        `
        INSERT INTO payment_method_references (
          id, user_id, provider, provider_payment_method_id, token_reference,
          brand, last4, exp_month, exp_year, alias, payment_type,
          is_default, status, billing_profile_id, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15::jsonb, $16, $16
        )
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          provider_payment_method_id = EXCLUDED.provider_payment_method_id,
          token_reference = EXCLUDED.token_reference,
          brand = EXCLUDED.brand,
          last4 = EXCLUDED.last4,
          exp_month = EXCLUDED.exp_month,
          exp_year = EXCLUDED.exp_year,
          alias = EXCLUDED.alias,
          payment_type = EXCLUDED.payment_type,
          is_default = EXCLUDED.is_default,
          status = EXCLUDED.status,
          billing_profile_id = EXCLUDED.billing_profile_id,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
        RETURNING *
        `,
        [
          input.id,
          input.userId,
          input.provider,
          input.providerPaymentMethodId ?? null,
          input.tokenReference,
          input.brand ?? null,
          input.last4 ?? null,
          input.expMonth ?? null,
          input.expYear ?? null,
          input.alias ?? null,
          input.paymentType ?? null,
          input.isDefault,
          input.status,
          input.billingProfileId ?? null,
          JSON.stringify(metadata),
          now,
        ]
      );

      return toPaymentMethodReference(result.rows[0]);
    });
  }

  async delete(userId: string, paymentMethodReferenceId: string): Promise<boolean> {
    if (!backendDatabase.enabled) {
      return deletePaymentMethodReferenceLocal(userId, paymentMethodReferenceId);
    }

    const result = await backendDatabase.query(
      `
      DELETE FROM payment_method_references
      WHERE user_id = $1 AND id = $2
      `,
      [userId, paymentMethodReferenceId]
    );

    return Number(result.rowCount ?? 0) > 0;
  }
}
