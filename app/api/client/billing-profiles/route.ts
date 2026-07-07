import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { listBillingProfiles, upsertBillingProfile } from "@/app/backend/core/local-auth-store";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    const data = await listBillingProfiles(auth.user.id);
    return NextResponse.json({ data }, { status: 200 });
  }

  const { rows } = await backendDatabase.query<{
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
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT id, user_id, legal_name, tax_id, tax_country, tax_regime, fiscal_email, address_line1, address_line2,
           city, state, postal_code, country_code, is_default, metadata, created_at, updated_at
    FROM billing_profiles
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
    `,
    [auth.user.id]
  );

  const data = rows.map((item) => ({
    id: item.id,
    userId: item.user_id,
    legalName: item.legal_name,
    taxId: item.tax_id ?? undefined,
    taxCountry: item.tax_country ?? undefined,
    taxRegime: item.tax_regime ?? undefined,
    fiscalEmail: item.fiscal_email ?? undefined,
    addressLine1: item.address_line1 ?? undefined,
    addressLine2: item.address_line2 ?? undefined,
    city: item.city ?? undefined,
    state: item.state ?? undefined,
    postalCode: item.postal_code ?? undefined,
    countryCode: item.country_code ?? undefined,
    isDefault: item.is_default,
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
    legalName?: string;
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
    isDefault?: boolean;
    metadata?: Record<string, unknown>;
  };

  const legalName = String(body.legalName ?? "").trim();
  if (!legalName) {
    return NextResponse.json({ error: "legalName es requerido" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim() || createId("bill");
  const now = new Date();

  if (!backendDatabase.enabled) {
    const data = await upsertBillingProfile({
      id,
      userId: auth.user.id,
      legalName,
      taxId: body.taxId,
      taxCountry: body.taxCountry,
      taxRegime: body.taxRegime,
      fiscalEmail: body.fiscalEmail,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      countryCode: body.countryCode,
      isDefault: Boolean(body.isDefault),
      metadata: body.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({ data }, { status: 200 });
  }

  await backendDatabase.withTransaction(async (client) => {
    if (body.isDefault) {
      await client.query(`UPDATE billing_profiles SET is_default = false, updated_at = NOW() WHERE user_id = $1`, [auth.user.id]);
    }

    await client.query(
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
      ON CONFLICT (id) DO UPDATE
      SET legal_name = EXCLUDED.legal_name,
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
      `,
      [
        id,
        auth.user.id,
        legalName,
        body.taxId ?? null,
        body.taxCountry ?? null,
        body.taxRegime ?? null,
        body.fiscalEmail ?? null,
        body.addressLine1 ?? null,
        body.addressLine2 ?? null,
        body.city ?? null,
        body.state ?? null,
        body.postalCode ?? null,
        body.countryCode ?? null,
        Boolean(body.isDefault),
        JSON.stringify(body.metadata ?? {}),
        now,
      ]
    );
  });

  return NextResponse.json({ ok: true, id }, { status: 200 });
}
