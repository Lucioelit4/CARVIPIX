import { NextRequest, NextResponse } from "next/server";

type BillingMembershipState = "ACTIVO" | "PENDIENTE" | "SUSPENDIDO" | "CANCELADO" | "EXPIRADO";

type BillingAction = "updateBillingProfile" | "toggleAutoRenew" | "setPaymentMethod";

type BillingAuthSuccess = {
  ok: true;
  user: {
    id: string;
  };
};

type BillingAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type BillingDependencies = {
  requireAuth: (request: NextRequest) => Promise<BillingAuthSuccess | BillingAuthFailure>;
  resolveAccess: (userId: string) => Promise<{
    entitlements: {
      maxAlertsPerDay: number;
      maxPairs: number;
      maxBots: number;
      historyLimit: number;
    };
  }>;
  db: {
    enabled: boolean;
    query: <T extends Record<string, unknown>>(
      sql: string,
      params?: Array<string | number | boolean | Date | null | string[]>
    ) => Promise<{ rows: T[] }>;
  };
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function daysRemaining(expiryIso: string | null): number | null {
  if (!expiryIso) {
    return null;
  }

  const expiry = new Date(expiryIso);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const diffMs = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function mapMembershipState(input: {
  membershipState: string | null;
  expiryIso: string | null;
  subscriptionState: string | null;
}): BillingMembershipState {
  const membershipState = String(input.membershipState ?? "").trim().toLowerCase();
  const subscriptionState = String(input.subscriptionState ?? "").trim().toUpperCase();

  if (input.expiryIso && new Date(input.expiryIso).getTime() <= Date.now()) {
    return "EXPIRADO";
  }

  if (subscriptionState === "SUSPENDED" || subscriptionState === "PAYMENT_FAILED" || subscriptionState === "PAST_DUE") {
    return "SUSPENDIDO";
  }

  if (membershipState === "cancelado") {
    return "CANCELADO";
  }

  if (membershipState === "inactivo" || !membershipState) {
    return "PENDIENTE";
  }

  return "ACTIVO";
}

function labelForMembershipState(state: BillingMembershipState): string {
  if (state === "ACTIVO") return "Activo";
  if (state === "PENDIENTE") return "Pendiente";
  if (state === "SUSPENDIDO") return "Suspendido";
  if (state === "CANCELADO") return "Cancelado";
  return "Expirado";
}

function mapPaymentStatus(value: string): string {
  const normalized = String(value ?? "").toLowerCase();
  if (["completed", "paid", "captured", "settled", "active"].includes(normalized)) {
    return "Completado";
  }

  if (["pending", "processing", "created", "awaiting_confirmation"].includes(normalized)) {
    return "Pendiente";
  }

  if (["failed", "payment_failed", "declined"].includes(normalized)) {
    return "Fallido";
  }

  if (["cancelled", "voided"].includes(normalized)) {
    return "Cancelado";
  }

  if (["refunded", "partially_refunded"].includes(normalized)) {
    return "Reembolsado";
  }

  return normalized ? normalized.toUpperCase() : "Pendiente";
}

function mapPaymentMethod(value: string | null | undefined): string {
  const method = String(value ?? "").trim().toLowerCase();
  if (!method) {
    return "No definido";
  }

  if (method.includes("card")) return "Tarjeta";
  if (method.includes("bank") || method.includes("spei")) return "Transferencia";
  if (method.includes("wallet") || method.includes("paypal")) return "Wallet";
  if (method.includes("crypto")) return "Crypto";
  return method;
}

function normalizeFiscalPayload(payload: Record<string, unknown>) {
  return {
    legalName: String(payload.legalName ?? "").trim(),
    taxId: String(payload.taxId ?? "").trim(),
    fiscalAddress: String(payload.fiscalAddress ?? "").trim(),
    fiscalEmail: String(payload.fiscalEmail ?? "").trim(),
  };
}

function normalizePaymentMethodPayload(payload: Record<string, unknown>) {
  return {
    provider: String(payload.provider ?? "custom").trim().toLowerCase(),
    paymentType: String(payload.paymentType ?? "wallet").trim().toLowerCase(),
    brand: String(payload.brand ?? "").trim(),
    alias: String(payload.alias ?? "Metodo principal").trim(),
    last4: String(payload.last4 ?? "").trim().replace(/\D/g, "").slice(-4),
    status: String(payload.status ?? "active").trim().toLowerCase(),
  };
}

function isValidRfc(value: string): boolean {
  if (!value) {
    return true;
  }

  return /^([A-Z&\u00d1]{3,4})\d{6}([A-Z0-9]{3})$/i.test(value);
}

function isValidEmail(value: string): boolean {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function getBillingSnapshot(userId: string, deps: Pick<BillingDependencies, "resolveAccess" | "db">) {
  const access = await deps.resolveAccess(userId);

  const membershipResult = await deps.db.query<{
    user_plan: string;
    membership_plan: string | null;
    membership_state: string | null;
    fecha_inicio: Date | null;
    fecha_fin: Date | null;
    renovacion_automatica: boolean | null;
    payment_subscription_id: string | null;
    paypal_subscription_id: string | null;
    subscription_status: string | null;
    next_billing_date: Date | null;
    subscription_updated_at: Date | null;
  }>(
    `
    SELECT
      u.plan AS user_plan,
      m.plan AS membership_plan,
      m.estado AS membership_state,
      m.fecha_inicio,
      m.fecha_fin,
      m.renovacion_automatica,
      m.payment_subscription_id,
      ps.paypal_subscription_id,
      ps.status AS subscription_status,
      ps.next_billing_date,
      ps.updated_at AS subscription_updated_at
    FROM users u
    LEFT JOIN memberships m ON m.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT paypal_subscription_id, status, next_billing_date, updated_at
      FROM paypal_subscriptions
      WHERE user_id = u.id
      ORDER BY updated_at DESC
      LIMIT 1
    ) ps ON true
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  const membershipRow = membershipResult.rows[0];
  const plan = String(membershipRow?.membership_plan ?? membershipRow?.user_plan ?? "free").toUpperCase();
  const startIso = toIso(membershipRow?.fecha_inicio ?? null);
  const expiryIso = toIso(membershipRow?.fecha_fin ?? null);
  const nextChargeIso = membershipRow?.renovacion_automatica
    ? toIso(membershipRow?.next_billing_date ?? membershipRow?.fecha_fin ?? null)
    : null;

  const normalizedState = mapMembershipState({
    membershipState: membershipRow?.membership_state ?? null,
    expiryIso,
    subscriptionState: membershipRow?.subscription_status ?? null,
  });

  const paymentsResult = await deps.db.query<{
    order_id: string;
    product_id: string;
    concept: string;
    amount_total: number;
    currency: string;
    order_status: string;
    requested_method: string | null;
    provider_payment_id: string | null;
    transaction_status: string | null;
    created_at: Date;
    paid_at: Date | null;
  }>(
    `
    SELECT
      po.id AS order_id,
      po.product_id,
      p.name AS concept,
      po.amount_total,
      po.currency,
      po.order_status,
      COALESCE(pt.payment_method, po.payment_method_requested) AS requested_method,
      pt.provider_payment_id,
      pt.status AS transaction_status,
      po.created_at,
      COALESCE(pt.captured_at, pt.settled_at) AS paid_at
    FROM payment_orders po
    LEFT JOIN products p ON p.id = po.product_id
    LEFT JOIN LATERAL (
      SELECT payment_method, provider_payment_id, status, captured_at, settled_at
      FROM payment_transactions
      WHERE payment_order_id = po.id
      ORDER BY created_at DESC
      LIMIT 1
    ) pt ON true
    WHERE po.user_id = $1
    ORDER BY po.created_at DESC
    LIMIT 100
    `,
    [userId]
  );

  const paypalPaymentsResult = await deps.db.query<{
    paypal_order_id: string | null;
    paypal_subscription_id: string | null;
    product_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT paypal_order_id, paypal_subscription_id, product_id, amount, currency, status, created_at, updated_at
    FROM paypal_billing_records
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 100
    `,
    [userId]
  );

  const timeline = [
    ...paymentsResult.rows.map((row) => {
      const transactionId = row.provider_payment_id ?? row.order_id;
      return {
        id: `po-${row.order_id}`,
        date: toIso(row.paid_at ?? row.created_at),
        concept: row.concept || row.product_id,
        plan,
        paymentMethod: mapPaymentMethod(row.requested_method),
        amount: Number(row.amount_total ?? 0),
        currency: String(row.currency || "USD").toUpperCase(),
        status: mapPaymentStatus(row.transaction_status ?? row.order_status),
        transactionId,
        details: {
          source: "payment_orders",
          orderId: row.order_id,
          providerPaymentId: row.provider_payment_id,
          productId: row.product_id,
          orderStatus: row.order_status,
          transactionStatus: row.transaction_status,
        },
      };
    }),
    ...paypalPaymentsResult.rows.map((row) => {
      const transactionId = row.paypal_order_id ?? row.paypal_subscription_id ?? `pp-${row.product_id}-${row.created_at.getTime()}`;
      return {
        id: `pp-${transactionId}`,
        date: toIso(row.updated_at ?? row.created_at),
        concept: String(row.product_id || "PayPal").replace(/-/g, " "),
        plan,
        paymentMethod: "Wallet",
        amount: Number(row.amount ?? 0),
        currency: String(row.currency || "USD").toUpperCase(),
        status: mapPaymentStatus(row.status),
        transactionId,
        details: {
          source: "paypal_billing_records",
          paypalOrderId: row.paypal_order_id,
          paypalSubscriptionId: row.paypal_subscription_id,
          productId: row.product_id,
          status: row.status,
        },
      };
    }),
  ];

  const dedupedPayments = Array.from(
    new Map(timeline.map((item) => [item.transactionId, item])).values()
  ).sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  const fiscalResult = await deps.db.query<{
    id: string;
    legal_name: string;
    tax_id: string | null;
    fiscal_email: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country_code: string | null;
    updated_at: Date;
  }>(
    `
    SELECT id, legal_name, tax_id, fiscal_email, address_line1, city, state, postal_code, country_code, updated_at
    FROM billing_profiles
    WHERE user_id = $1
    ORDER BY is_default DESC, updated_at DESC
    LIMIT 1
    `,
    [userId]
  );

  const fiscal = fiscalResult.rows[0]
    ? {
        legalName: fiscalResult.rows[0].legal_name,
        taxId: fiscalResult.rows[0].tax_id ?? "",
        fiscalAddress: [
          fiscalResult.rows[0].address_line1,
          fiscalResult.rows[0].city,
          fiscalResult.rows[0].state,
          fiscalResult.rows[0].postal_code,
          fiscalResult.rows[0].country_code,
        ]
          .filter(Boolean)
          .join(", "),
        fiscalEmail: fiscalResult.rows[0].fiscal_email ?? "",
        updatedAt: toIso(fiscalResult.rows[0].updated_at),
      }
    : {
        legalName: "",
        taxId: "",
        fiscalAddress: "",
        fiscalEmail: "",
        updatedAt: null,
      };

  const methodResult = await deps.db.query<{
    provider: string;
    payment_type: string | null;
    brand: string | null;
    last4: string | null;
    status: string;
    updated_at: Date;
    alias: string | null;
  }>(
    `
    SELECT provider, payment_type, brand, last4, status, updated_at, alias
    FROM payment_method_references
    WHERE user_id = $1
    ORDER BY is_default DESC, updated_at DESC
    LIMIT 1
    `,
    [userId]
  );

  const latestMethod = methodResult.rows[0];
  const fallbackMethod = dedupedPayments[0]?.paymentMethod ?? "Wallet";

  return {
    membership: {
      plan,
      state: normalizedState,
      stateLabel: labelForMembershipState(normalizedState),
      startDate: startIso,
      nextChargeDate: nextChargeIso,
      expiryDate: expiryIso,
      autoRenew: Boolean(membershipRow?.renovacion_automatica),
      daysRemaining: daysRemaining(expiryIso),
      accessKeepsUntil: expiryIso,
      benefits: [
        `Alertas por dia: ${access.entitlements.maxAlertsPerDay}`,
        `Pares permitidos: ${access.entitlements.maxPairs}`,
        `Bots permitidos: ${access.entitlements.maxBots}`,
        `Historial operativo: ${access.entitlements.historyLimit}`,
      ],
      subscriptionId: membershipRow?.payment_subscription_id ?? membershipRow?.paypal_subscription_id ?? null,
    },
    paymentHistory: dedupedPayments,
    billingProfile: fiscal,
    paymentMethod: {
      activeMethod: latestMethod ? mapPaymentMethod(latestMethod.payment_type ?? latestMethod.provider) : fallbackMethod,
      status: latestMethod?.status ?? "active",
      last4: latestMethod?.last4 ?? null,
      updatedAt: toIso(latestMethod?.updated_at ?? null),
      brand: latestMethod?.brand ?? null,
      alias: latestMethod?.alias ?? null,
    },
  };
}

export function createBillingHandlers(deps: BillingDependencies) {
  return {
    GET: async (request: NextRequest) => {
      const auth = await deps.requireAuth(request);
      if (!auth.ok) {
        return auth.response;
      }

      if (!deps.db.enabled) {
        return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
      }

      try {
        const data = await getBillingSnapshot(auth.user.id, deps);
        return NextResponse.json({ data }, { status: 200 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar el centro de facturacion";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },

    POST: async (request: NextRequest) => {
      const auth = await deps.requireAuth(request);
      if (!auth.ok) {
        return auth.response;
      }

      if (!deps.db.enabled) {
        return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
      }

      const body = (await request.json().catch(() => ({}))) as {
        action?: BillingAction;
        payload?: Record<string, unknown>;
      };

      const action = body.action;
      const payload = body.payload ?? {};

      if (!action) {
        return NextResponse.json({ error: "action es requerido" }, { status: 400 });
      }

      try {
        if (action === "toggleAutoRenew") {
          const enabled = Boolean(payload.enabled);
          await deps.db.query(
            `
            UPDATE memberships
            SET renovacion_automatica = $2
            WHERE user_id = $1
            `,
            [auth.user.id, enabled]
          );

          const data = await getBillingSnapshot(auth.user.id, deps);
          return NextResponse.json({ ok: true, data }, { status: 200 });
        }

        if (action === "updateBillingProfile") {
          const normalized = normalizeFiscalPayload(payload);
          if (!normalized.legalName) {
            return NextResponse.json({ error: "La razon social es obligatoria" }, { status: 400 });
          }

          if (!isValidRfc(normalized.taxId)) {
            return NextResponse.json({ error: "RFC invalido" }, { status: 400 });
          }

          if (!isValidEmail(normalized.fiscalEmail)) {
            return NextResponse.json({ error: "Correo fiscal invalido" }, { status: 400 });
          }

          const existing = await deps.db.query<{ id: string }>(
            `SELECT id FROM billing_profiles WHERE user_id = $1 ORDER BY is_default DESC, updated_at DESC LIMIT 1`,
            [auth.user.id]
          );

          if (existing.rows[0]?.id) {
            await deps.db.query(
              `
              UPDATE billing_profiles
              SET legal_name = $2,
                  tax_id = NULLIF($3, ''),
                  address_line1 = NULLIF($4, ''),
                  fiscal_email = NULLIF($5, ''),
                  updated_at = NOW()
              WHERE id = $1
              `,
              [existing.rows[0].id, normalized.legalName, normalized.taxId, normalized.fiscalAddress, normalized.fiscalEmail]
            );
          } else {
            await deps.db.query(
              `
              INSERT INTO billing_profiles (
                id, user_id, legal_name, tax_id, address_line1, fiscal_email, is_default, metadata, created_at, updated_at
              )
              VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), true, '{}'::jsonb, NOW(), NOW())
              `,
              [
                createId("billprof"),
                auth.user.id,
                normalized.legalName,
                normalized.taxId,
                normalized.fiscalAddress,
                normalized.fiscalEmail,
              ]
            );
          }

          const data = await getBillingSnapshot(auth.user.id, deps);
          return NextResponse.json({ ok: true, data }, { status: 200 });
        }

        if (action === "setPaymentMethod") {
          normalizePaymentMethodPayload(payload);
          return NextResponse.json(
            {
              ok: false,
              error: "Administrar en PayPal. El cambio directo de metodo de pago estara disponible proximamente.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json({ error: "Action no soportada" }, { status: 400 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo actualizar facturacion";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },
  };
}
