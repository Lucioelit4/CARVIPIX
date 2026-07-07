import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import {
  deletePaymentMethodReference,
  listPaymentMethodReferences,
  upsertPaymentMethodReference,
} from "@/app/backend/core/local-auth-store";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hasSensitiveData(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const blocked = new Set(["pan", "cardnumber", "card_number", "cvv", "cvc", "securitycode", "security_code"]);
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
      if (blocked.has(key.toLowerCase())) {
        return true;
      }
      if (nested && typeof nested === "object") {
        stack.push(nested);
      }
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    const data = await listPaymentMethodReferences(auth.user.id);
    return NextResponse.json({ data }, { status: 200 });
  }

  const { rows } = await backendDatabase.query<{
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
    payment_type: string | null;
    is_default: boolean;
    status: "active" | "inactive" | "expired" | "revoked";
    billing_profile_id: string | null;
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT id, user_id, provider, provider_payment_method_id, token_reference, brand, last4, exp_month, exp_year,
           alias, payment_type, is_default, status, billing_profile_id, metadata, created_at, updated_at
    FROM payment_method_references
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
    `,
    [auth.user.id]
  );

  const data = rows.map((item) => ({
    id: item.id,
    userId: item.user_id,
    provider: item.provider,
    providerPaymentMethodId: item.provider_payment_method_id ?? undefined,
    tokenReference: item.token_reference,
    brand: item.brand ?? undefined,
    last4: item.last4 ?? undefined,
    expMonth: item.exp_month ?? undefined,
    expYear: item.exp_year ?? undefined,
    alias: item.alias ?? undefined,
    paymentType: item.payment_type ?? undefined,
    isDefault: item.is_default,
    status: item.status,
    billingProfileId: item.billing_profile_id ?? undefined,
    metadata: typeof item.metadata === "object" && item.metadata ? item.metadata : {},
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    provider?: "stripe" | "mercadopago" | "openpay" | "custom";
    providerPaymentMethodId?: string;
    tokenReference?: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    alias?: string;
    paymentType?: "card_credit" | "card_debit" | "bank_transfer" | "spei" | "cash_voucher" | "wallet" | "other";
    isDefault?: boolean;
    status?: "active" | "inactive" | "expired" | "revoked";
    billingProfileId?: string;
    metadata?: Record<string, unknown>;
  };

  if (hasSensitiveData(body)) {
    return NextResponse.json({ error: "No se permite almacenar PAN/CVV ni datos sensibles de tarjeta" }, { status: 400 });
  }

  const provider = body.provider ?? "custom";
  const tokenReference = String(body.tokenReference ?? "").trim();
  if (!tokenReference) {
    return NextResponse.json({ error: "tokenReference es requerido" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim() || createId("pmref");
  const now = new Date();

  if (!backendDatabase.enabled) {
    const data = await upsertPaymentMethodReference({
      id,
      userId: auth.user.id,
      provider,
      providerPaymentMethodId: body.providerPaymentMethodId,
      tokenReference,
      brand: body.brand,
      last4: body.last4,
      expMonth: body.expMonth,
      expYear: body.expYear,
      alias: body.alias,
      paymentType: body.paymentType,
      isDefault: Boolean(body.isDefault),
      status: body.status ?? "active",
      billingProfileId: body.billingProfileId,
      metadata: body.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({ data }, { status: 200 });
  }

  await backendDatabase.withTransaction(async (client) => {
    if (body.isDefault) {
      await client.query(`UPDATE payment_method_references SET is_default = false, updated_at = NOW() WHERE user_id = $1`, [auth.user.id]);
    }

    await client.query(
      `
      INSERT INTO payment_method_references (
        id, user_id, provider, provider_payment_method_id, token_reference, brand, last4, exp_month, exp_year,
        alias, payment_type, is_default, status, billing_profile_id, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15::jsonb, $16, $16
      )
      ON CONFLICT (id) DO UPDATE
      SET provider = EXCLUDED.provider,
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
      `,
      [
        id,
        auth.user.id,
        provider,
        body.providerPaymentMethodId ?? null,
        tokenReference,
        body.brand ?? null,
        body.last4 ?? null,
        body.expMonth ?? null,
        body.expYear ?? null,
        body.alias ?? null,
        body.paymentType ?? null,
        Boolean(body.isDefault),
        body.status ?? "active",
        body.billingProfileId ?? null,
        JSON.stringify(body.metadata ?? {}),
        now,
      ]
    );
  });

  return NextResponse.json({ ok: true, id }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  if (!backendDatabase.enabled) {
    const deleted = await deletePaymentMethodReference(auth.user.id, id);
    return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 404 });
  }

  const result = await backendDatabase.query(
    `DELETE FROM payment_method_references WHERE id = $1 AND user_id = $2`,
    [id, auth.user.id]
  );

  const deleted = Number(result.rowCount ?? 0) > 0;
  return NextResponse.json({ ok: deleted }, { status: deleted ? 200 : 404 });
}
