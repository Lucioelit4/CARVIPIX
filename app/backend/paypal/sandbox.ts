import "server-only";

import { createHash } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";
import {
  buildPayPalOfferings,
  getCommercialProductByCheckoutId,
  isBotLicenseCheckoutProduct,
  resolveCheckoutProductId,
} from "@/app/lib/commercial/business-model";

export type PayPalRecordStatus =
  | "pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired"
  | "payment_failed"
  | "refunded";

export type OfferingType = "one_time" | "subscription";

export type PayPalOffering = {
  id: string;
  name: string;
  description: string;
  type: OfferingType;
  amount: number;
  currency: "USD";
};

type PayPalCacheRow = {
  local_product_id: string;
  paypal_product_id: string;
  paypal_plan_id: string | null;
};

type PayPalRecordRow = {
  id: string;
  user_id: string;
  email: string;
  product_id: string;
  paypal_order_id: string | null;
  paypal_subscription_id: string | null;
  paypal_payer_id: string | null;
  status: PayPalRecordStatus;
  currency: string;
  amount: number;
  created_at: Date;
  updated_at: Date;
  last_payment_at: Date | null;
  next_billing_time: Date | null;
};

type PayPalUser = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
};

type PayPalApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

let tablesReadyPromise: Promise<void> | null = null;

export const PAYPAL_OFFERINGS: Record<string, PayPalOffering> = buildPayPalOfferings().reduce<Record<string, PayPalOffering>>((acc, item) => {
  acc[item.id] = {
    ...item,
    type: item.type as OfferingType,
  };
  return acc;
}, {});

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function resolvePayPalBaseUrl(): string {
  return process.env.PAYPAL_SANDBOX_API_BASE?.trim() || "https://api-m.sandbox.paypal.com";
}

function assertSandboxMode(): void {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  if (mode !== "sandbox") {
    throw new Error("PayPal esta configurado fuera de Sandbox. Esta integracion solo permite sandbox por ahora.");
  }
}

function resolveOffering(productIdRaw: string): PayPalOffering {
  const productId = resolveCheckoutProductId(productIdRaw);
  const offering = PAYPAL_OFFERINGS[productId];
  if (!offering) {
    throw new Error("Producto PayPal no soportado");
  }
  return offering;
}

function mapSubscriptionStatus(statusRaw: string | null | undefined): PayPalRecordStatus {
  const status = String(statusRaw ?? "").toUpperCase();
  if (["APPROVAL_PENDING", "APPROVED", "CREATED", "PENDING"].includes(status)) {
    return "pending";
  }
  if (["ACTIVE", "COMPLETED"].includes(status)) {
    return "active";
  }
  if (status === "SUSPENDED") {
    return "suspended";
  }
  if (["CANCELLED", "VOIDED", "DENIED"].includes(status)) {
    return "cancelled";
  }
  if (status === "EXPIRED") {
    return "expired";
  }
  if (["FAILED", "PAYMENT_FAILED"].includes(status)) {
    return "payment_failed";
  }
  if (status === "REFUNDED") {
    return "refunded";
  }

  return "pending";
}

async function ensurePayPalTables(): Promise<void> {
  if (!backendDatabase.enabled) {
    throw new Error("DATABASE_URL no configurado");
  }

  if (!tablesReadyPromise) {
    tablesReadyPromise = backendDatabase
      .query(`
        CREATE TABLE IF NOT EXISTS paypal_billing_records (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          product_id TEXT NOT NULL,
          paypal_order_id TEXT,
          paypal_subscription_id TEXT,
          paypal_payer_id TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired', 'payment_failed', 'refunded')),
          currency CHAR(3) NOT NULL,
          amount NUMERIC(14, 2) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_payment_at TIMESTAMPTZ,
          next_billing_time TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS paypal_catalog_cache (
          local_product_id TEXT PRIMARY KEY,
          paypal_product_id TEXT NOT NULL,
          paypal_plan_id TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS paypal_webhook_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          verification_status TEXT NOT NULL,
          process_status TEXT NOT NULL CHECK (process_status IN ('received', 'processed', 'ignored', 'failed')),
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );

        CREATE UNIQUE INDEX IF NOT EXISTS ux_paypal_billing_order
          ON paypal_billing_records(paypal_order_id)
          WHERE paypal_order_id IS NOT NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS ux_paypal_billing_subscription
          ON paypal_billing_records(paypal_subscription_id)
          WHERE paypal_subscription_id IS NOT NULL;
      `)
      .then(() => undefined);
  }

  await tablesReadyPromise;
}

async function getPayPalAccessToken(): Promise<string> {
  assertSandboxMode();
  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Faltan credenciales de PayPal Sandbox");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${resolvePayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "No se pudo autenticar contra PayPal Sandbox");
  }

  return payload.access_token;
}

async function callPayPal<T>(path: string, init: RequestInit): Promise<PayPalApiResponse<T>> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${resolvePayPalBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    const maybeMessage = (data as { message?: string; details?: Array<{ issue?: string; description?: string }> }).message;
    const detail = (data as { details?: Array<{ issue?: string; description?: string }> }).details?.[0];
    throw new Error(maybeMessage || detail?.description || detail?.issue || `PayPal API error ${response.status}`);
  }

  return { ok: true, status: response.status, data };
}

async function findCatalogCache(localProductId: string): Promise<PayPalCacheRow | null> {
  await ensurePayPalTables();
  const result = await backendDatabase.query<PayPalCacheRow>(
    `
    SELECT local_product_id, paypal_product_id, paypal_plan_id
    FROM paypal_catalog_cache
    WHERE local_product_id = $1
    LIMIT 1
    `,
    [localProductId]
  );
  return result.rows[0] ?? null;
}

async function upsertCatalogCache(input: {
  localProductId: string;
  paypalProductId: string;
  paypalPlanId?: string | null;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_catalog_cache (local_product_id, paypal_product_id, paypal_plan_id, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (local_product_id) DO UPDATE
    SET paypal_product_id = EXCLUDED.paypal_product_id,
        paypal_plan_id = COALESCE(EXCLUDED.paypal_plan_id, paypal_catalog_cache.paypal_plan_id),
        updated_at = NOW()
    `,
    [input.localProductId, input.paypalProductId, input.paypalPlanId ?? null]
  );
}

async function upsertBillingRecordByOrder(input: {
  userId: string;
  email: string;
  productId: string;
  orderId: string;
  status: PayPalRecordStatus;
  currency: string;
  amount: number;
  payerId?: string | null;
  lastPaymentAt?: Date | null;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_billing_records (
      id, user_id, email, product_id, paypal_order_id, paypal_payer_id,
      status, currency, amount, created_at, updated_at, last_payment_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10)
    ON CONFLICT (paypal_order_id) DO UPDATE
    SET paypal_payer_id = COALESCE(EXCLUDED.paypal_payer_id, paypal_billing_records.paypal_payer_id),
        status = EXCLUDED.status,
        currency = EXCLUDED.currency,
        amount = EXCLUDED.amount,
        email = EXCLUDED.email,
        updated_at = NOW(),
        last_payment_at = COALESCE(EXCLUDED.last_payment_at, paypal_billing_records.last_payment_at)
    `,
    [
      createId("pprec"),
      input.userId,
      input.email,
      input.productId,
      input.orderId,
      input.payerId ?? null,
      input.status,
      input.currency,
      input.amount,
      input.lastPaymentAt ?? null,
    ]
  );
}

async function upsertBillingRecordBySubscription(input: {
  userId: string;
  email: string;
  productId: string;
  subscriptionId: string;
  status: PayPalRecordStatus;
  currency: string;
  amount: number;
  payerId?: string | null;
  lastPaymentAt?: Date | null;
  nextBillingTime?: Date | null;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_billing_records (
      id, user_id, email, product_id, paypal_subscription_id, paypal_payer_id,
      status, currency, amount, created_at, updated_at, last_payment_at, next_billing_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10, $11)
    ON CONFLICT (paypal_subscription_id) DO UPDATE
    SET paypal_payer_id = COALESCE(EXCLUDED.paypal_payer_id, paypal_billing_records.paypal_payer_id),
        status = EXCLUDED.status,
        currency = EXCLUDED.currency,
        amount = EXCLUDED.amount,
        email = EXCLUDED.email,
        updated_at = NOW(),
        last_payment_at = COALESCE(EXCLUDED.last_payment_at, paypal_billing_records.last_payment_at),
        next_billing_time = COALESCE(EXCLUDED.next_billing_time, paypal_billing_records.next_billing_time)
    `,
    [
      createId("pprec"),
      input.userId,
      input.email,
      input.productId,
      input.subscriptionId,
      input.payerId ?? null,
      input.status,
      input.currency,
      input.amount,
      input.lastPaymentAt ?? null,
      input.nextBillingTime ?? null,
    ]
  );
}

async function findRecordByOrderId(orderId: string): Promise<PayPalRecordRow | null> {
  await ensurePayPalTables();
  const result = await backendDatabase.query<PayPalRecordRow>(
    `
    SELECT *
    FROM paypal_billing_records
    WHERE paypal_order_id = $1
    LIMIT 1
    `,
    [orderId]
  );

  return result.rows[0] ?? null;
}

async function findRecordBySubscriptionId(subscriptionId: string): Promise<PayPalRecordRow | null> {
  await ensurePayPalTables();
  const result = await backendDatabase.query<PayPalRecordRow>(
    `
    SELECT *
    FROM paypal_billing_records
    WHERE paypal_subscription_id = $1
    LIMIT 1
    `,
    [subscriptionId]
  );

  return result.rows[0] ?? null;
}

async function activateAccessByProduct(input: {
  userId: string;
  productId: string;
  nextBillingTime?: Date | null;
  now: Date;
}): Promise<void> {
  const checkoutId = resolveCheckoutProductId(input.productId);
  const product = getCommercialProductByCheckoutId(checkoutId);

  if (product?.planCode === "basic") {
    await backendDatabase.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source)
      VALUES ($1, 'basic', 'activo', $2, $3, true, 'paypal_sandbox')
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'basic', estado = 'activo', fecha_inicio = COALESCE(memberships.fecha_inicio, EXCLUDED.fecha_inicio),
          fecha_fin = EXCLUDED.fecha_fin, renovacion_automatica = true, source = 'paypal_sandbox'
      `,
      [input.userId, input.now, input.nextBillingTime ?? addDays(input.now, 30)]
    );
    return;
  }

  if (product?.planCode === "pro") {
    await backendDatabase.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source)
      VALUES ($1, 'advanced', 'activo', $2, $3, true, 'paypal_sandbox')
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'advanced', estado = 'activo', fecha_inicio = COALESCE(memberships.fecha_inicio, EXCLUDED.fecha_inicio),
          fecha_fin = EXCLUDED.fecha_fin, renovacion_automatica = true, source = 'paypal_sandbox'
      `,
      [input.userId, input.now, input.nextBillingTime ?? addDays(input.now, 30)]
    );
    return;
  }

  if (isBotLicenseCheckoutProduct(checkoutId)) {
    const currentLicense = await backendDatabase.query<{ user_id: string }>(
      `
      SELECT user_id
      FROM bot_licenses
      WHERE user_id = $1
      LIMIT 1
      `,
      [input.userId]
    );

    const expiryDate = null;

    if (currentLicense.rows[0]) {
      await backendDatabase.query(
        `
        UPDATE bot_licenses
        SET active = true,
            purchase_date = COALESCE(purchase_date, $2),
            expiry_date = $3
        WHERE user_id = $1
        `,
        [input.userId, input.now, expiryDate]
      );
    } else {
      await backendDatabase.query(
        `
        INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
        VALUES ($1, $2, $3, $4, true, 'sandbox')
        `,
        [input.userId, `CVPX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, input.now, expiryDate]
      );
    }
  }
}

export async function listOfferings(): Promise<PayPalOffering[]> {
  return Object.values(PAYPAL_OFFERINGS);
}

export async function ensureSubscriptionPlanForOffering(productIdRaw: string): Promise<{
  offering: PayPalOffering;
  paypalProductId: string;
  paypalPlanId: string;
}> {
  const offering = resolveOffering(productIdRaw);
  if (offering.type !== "subscription") {
    throw new Error("Solo los productos de suscripcion tienen plan PayPal");
  }

  const cache = await findCatalogCache(offering.id);
  if (cache?.paypal_product_id && cache.paypal_plan_id) {
    return {
      offering,
      paypalProductId: cache.paypal_product_id,
      paypalPlanId: cache.paypal_plan_id,
    };
  }

  const productPayload = {
    name: offering.name,
    description: offering.description,
    type: "SERVICE",
    category: "SOFTWARE",
  };

  const productResponse = await callPayPal<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify(productPayload),
  });

  const planPayload = {
    product_id: productResponse.data.id,
    name: `${offering.name} mensual`,
    description: offering.description,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1,
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: offering.amount.toFixed(2),
            currency_code: offering.currency,
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 1,
    },
  };

  const planResponse = await callPayPal<{ id: string }>("/v1/billing/plans", {
    method: "POST",
    body: JSON.stringify(planPayload),
  });

  await upsertCatalogCache({
    localProductId: offering.id,
    paypalProductId: productResponse.data.id,
    paypalPlanId: planResponse.data.id,
  });

  return {
    offering,
    paypalProductId: productResponse.data.id,
    paypalPlanId: planResponse.data.id,
  };
}

export async function createSandboxOrder(input: {
  productId: string;
  user: PayPalUser;
}): Promise<{ orderId: string; status: string; approveUrl: string | null; offering: PayPalOffering }> {
  const offering = resolveOffering(input.productId);
  if (offering.type !== "one_time") {
    throw new Error("Este producto no es de pago unico");
  }

  const customId = createHash("sha256").update(input.user.id).digest("hex").slice(0, 32);
  const response = await callPayPal<{
    id: string;
    status: string;
    links?: Array<{ rel?: string; href?: string }>;
  }>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: customId,
          description: offering.name,
          amount: {
            currency_code: offering.currency,
            value: offering.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: process.env.PAYPAL_BRAND_NAME || "CARVIPIX",
        user_action: "PAY_NOW",
      },
    }),
  });

  await upsertBillingRecordByOrder({
    userId: input.user.id,
    email: input.user.email,
    productId: offering.id,
    orderId: response.data.id,
    status: mapSubscriptionStatus(response.data.status),
    currency: offering.currency,
    amount: offering.amount,
  });

  return {
    orderId: response.data.id,
    status: response.data.status,
    approveUrl: response.data.links?.find((link) => link.rel === "approve")?.href ?? null,
    offering,
  };
}

export async function captureSandboxOrder(input: {
  orderId: string;
  user: PayPalUser;
}): Promise<{
  orderId: string;
  status: string;
  recordStatus: PayPalRecordStatus;
}> {
  const existing = await findRecordByOrderId(input.orderId);
  if (!existing) {
    throw new Error("Orden PayPal no encontrada en base de datos local");
  }

  if (existing.user_id !== input.user.id) {
    throw new Error("Orden no pertenece al usuario autenticado");
  }

  const response = await callPayPal<{
    id: string;
    status: string;
    payer?: { payer_id?: string; email_address?: string };
  }>(`/v2/checkout/orders/${encodeURIComponent(input.orderId)}/capture`, {
    method: "POST",
    body: "{}",
  });

  const recordStatus = mapSubscriptionStatus(response.data.status);
  const now = new Date();

  await upsertBillingRecordByOrder({
    userId: input.user.id,
    email: response.data.payer?.email_address || input.user.email,
    productId: existing.product_id,
    orderId: response.data.id,
    payerId: response.data.payer?.payer_id || null,
    status: recordStatus,
    currency: existing.currency,
    amount: Number(existing.amount),
    lastPaymentAt: recordStatus === "active" ? now : null,
  });

  if (recordStatus === "active") {
    await activateAccessByProduct({
      userId: input.user.id,
      productId: existing.product_id,
      now,
    });
  }

  return {
    orderId: response.data.id,
    status: response.data.status,
    recordStatus,
  };
}

export async function getOrderStatus(input: {
  orderId: string;
  userId: string;
}): Promise<{
  orderId: string;
  paypalStatus: string;
  recordStatus: PayPalRecordStatus;
}> {
  const existing = await findRecordByOrderId(input.orderId);
  if (!existing) {
    throw new Error("Orden no encontrada");
  }

  if (existing.user_id !== input.userId) {
    throw new Error("Orden no pertenece al usuario autenticado");
  }

  const response = await callPayPal<{ id: string; status: string }>(`/v2/checkout/orders/${encodeURIComponent(input.orderId)}`, {
    method: "GET",
  });

  return {
    orderId: response.data.id,
    paypalStatus: response.data.status,
    recordStatus: existing.status,
  };
}

export async function createSandboxSubscription(input: {
  productId: string;
  user: PayPalUser;
}): Promise<{
  subscriptionId: string;
  status: string;
  approveUrl: string | null;
  planId: string;
  offering: PayPalOffering;
}> {
  const { offering, paypalPlanId } = await ensureSubscriptionPlanForOffering(input.productId);

  const response = await callPayPal<{
    id: string;
    status: string;
    links?: Array<{ rel?: string; href?: string }>;
  }>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: paypalPlanId,
      custom_id: input.user.id,
      subscriber: {
        email_address: input.user.email,
      },
      application_context: {
        brand_name: process.env.PAYPAL_BRAND_NAME || "CARVIPIX",
      },
    }),
  });

  await upsertBillingRecordBySubscription({
    userId: input.user.id,
    email: input.user.email,
    productId: offering.id,
    subscriptionId: response.data.id,
    status: mapSubscriptionStatus(response.data.status),
    currency: offering.currency,
    amount: offering.amount,
  });

  return {
    subscriptionId: response.data.id,
    status: response.data.status,
    approveUrl: response.data.links?.find((link) => link.rel === "approve")?.href ?? null,
    planId: paypalPlanId,
    offering,
  };
}

export async function getSandboxSubscriptionStatus(input: {
  subscriptionId: string;
  userId: string;
}): Promise<{
  subscriptionId: string;
  paypalStatus: string;
  recordStatus: PayPalRecordStatus;
  nextBillingTime: string | null;
}> {
  const existing = await findRecordBySubscriptionId(input.subscriptionId);
  if (!existing) {
    throw new Error("Suscripcion no encontrada");
  }

  if (existing.user_id !== input.userId) {
    throw new Error("Suscripcion no pertenece al usuario autenticado");
  }

  const response = await callPayPal<{
    id: string;
    status: string;
    subscriber?: { payer_id?: string; email_address?: string };
    billing_info?: { last_payment?: { time?: string }; next_billing_time?: string };
  }>(`/v1/billing/subscriptions/${encodeURIComponent(input.subscriptionId)}`, {
    method: "GET",
  });

  const mapped = mapSubscriptionStatus(response.data.status);
  const nextBillingTime = response.data.billing_info?.next_billing_time
    ? new Date(response.data.billing_info.next_billing_time)
    : null;
  const lastPaymentTime = response.data.billing_info?.last_payment?.time
    ? new Date(response.data.billing_info.last_payment.time)
    : mapped === "active"
      ? new Date()
      : null;

  await upsertBillingRecordBySubscription({
    userId: existing.user_id,
    email: response.data.subscriber?.email_address || existing.email,
    productId: existing.product_id,
    subscriptionId: response.data.id,
    payerId: response.data.subscriber?.payer_id || existing.paypal_payer_id,
    status: mapped,
    currency: existing.currency,
    amount: Number(existing.amount),
    lastPaymentAt: lastPaymentTime,
    nextBillingTime,
  });

  if (mapped === "active") {
    await activateAccessByProduct({
      userId: existing.user_id,
      productId: existing.product_id,
      nextBillingTime,
      now: new Date(),
    });
  }

  return {
    subscriptionId: response.data.id,
    paypalStatus: response.data.status,
    recordStatus: mapped,
    nextBillingTime: response.data.billing_info?.next_billing_time ?? null,
  };
}

export async function verifyAndProcessPayPalWebhook(input: {
  headers: Record<string, string | null>;
  payloadRaw: string;
}): Promise<{
  ok: boolean;
  duplicate: boolean;
  verified: boolean;
  eventId: string;
  eventType: string;
}> {
  await ensurePayPalTables();
  assertSandboxMode();

  const payload = JSON.parse(input.payloadRaw) as {
    id?: string;
    event_type?: string;
    resource?: Record<string, unknown>;
  };

  const eventId = String(payload.id || "").trim();
  const eventType = String(payload.event_type || "").trim();
  if (!eventId || !eventType) {
    throw new Error("Webhook PayPal invalido");
  }

  const transmissionId = input.headers["paypal-transmission-id"];
  const transmissionTime = input.headers["paypal-transmission-time"];
  const transmissionSig = input.headers["paypal-transmission-sig"];
  const certUrl = input.headers["paypal-cert-url"];
  const authAlgo = input.headers["paypal-auth-algo"];
  const webhookId = process.env.PAYPAL_SANDBOX_WEBHOOK_ID?.trim();

  if (!webhookId) {
    throw new Error("Falta PAYPAL_SANDBOX_WEBHOOK_ID");
  }

  const verificationResponse = await callPayPal<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: payload,
      }),
    }
  );

  const verificationStatus = String(verificationResponse.data.verification_status || "FAILED").toUpperCase();

  const inserted = await backendDatabase.query<{ event_id: string }>(
    `
    INSERT INTO paypal_webhook_events (event_id, event_type, verification_status, process_status, payload, created_at)
    VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
    `,
    [eventId, eventType, verificationStatus, "received", input.payloadRaw]
  );

  if (!inserted.rows[0]) {
    return {
      ok: true,
      duplicate: true,
      verified: verificationStatus === "SUCCESS",
      eventId,
      eventType,
    };
  }

  if (verificationStatus !== "SUCCESS") {
    await backendDatabase.query(
      `
      UPDATE paypal_webhook_events
      SET process_status = 'failed', processed_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    return {
      ok: false,
      duplicate: false,
      verified: false,
      eventId,
      eventType,
    };
  }

  const resource = payload.resource || {};

  try {
    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "CHECKOUT.ORDER.COMPLETED") {
      const orderId = String(resource.id || "").trim();
      if (orderId) {
        const record = await findRecordByOrderId(orderId);
        if (record) {
          const mapped = mapSubscriptionStatus(eventType === "CHECKOUT.ORDER.COMPLETED" ? "COMPLETED" : "APPROVED");
          const now = new Date();

          await upsertBillingRecordByOrder({
            userId: record.user_id,
            email: record.email,
            productId: record.product_id,
            orderId,
            payerId: record.paypal_payer_id,
            status: mapped,
            currency: record.currency,
            amount: Number(record.amount),
            lastPaymentAt: mapped === "active" ? now : null,
          });

          if (mapped === "active") {
            await activateAccessByProduct({
              userId: record.user_id,
              productId: record.product_id,
              now,
            });
          }
        }
      }
    }

    if (
      eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
      eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
      eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    ) {
      const subscriptionId = String(resource.id || "").trim();
      if (subscriptionId) {
        const record = await findRecordBySubscriptionId(subscriptionId);
        if (record) {
          const statusByEvent: Record<string, PayPalRecordStatus> = {
            "BILLING.SUBSCRIPTION.ACTIVATED": "active",
            "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
            "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
            "BILLING.SUBSCRIPTION.EXPIRED": "expired",
            "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "payment_failed",
          };

          const mapped = statusByEvent[eventType] || "pending";
          const nextBillingRaw = resource.next_billing_time;
          const nextBillingTime = typeof nextBillingRaw === "string" ? new Date(nextBillingRaw) : null;
          const now = new Date();

          await upsertBillingRecordBySubscription({
            userId: record.user_id,
            email: record.email,
            productId: record.product_id,
            subscriptionId,
            payerId: record.paypal_payer_id,
            status: mapped,
            currency: record.currency,
            amount: Number(record.amount),
            lastPaymentAt: mapped === "active" ? now : null,
            nextBillingTime,
          });

          if (mapped === "active") {
            await activateAccessByProduct({
              userId: record.user_id,
              productId: record.product_id,
              nextBillingTime,
              now,
            });
          }
        }
      }
    }

    if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      const relatedIds = resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
      const orderId = String(relatedIds?.related_ids?.order_id || "").trim();
      if (orderId) {
        const record = await findRecordByOrderId(orderId);
        if (record) {
          await upsertBillingRecordByOrder({
            userId: record.user_id,
            email: record.email,
            productId: record.product_id,
            orderId,
            payerId: record.paypal_payer_id,
            status: "refunded",
            currency: record.currency,
            amount: Number(record.amount),
          });
        }
      }
    }

    await backendDatabase.query(
      `
      UPDATE paypal_webhook_events
      SET process_status = 'processed', processed_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    return {
      ok: true,
      duplicate: false,
      verified: true,
      eventId,
      eventType,
    };
  } catch (error) {
    await backendDatabase.query(
      `
      UPDATE paypal_webhook_events
      SET process_status = 'failed', processed_at = NOW()
      WHERE event_id = $1
      `,
      [eventId]
    );

    throw error;
  }
}
