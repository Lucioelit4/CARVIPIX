import { createHash } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";
import { getRuntimeStage } from "@/app/backend/core/config";
import {
  getCommercialProductByCheckoutId,
  isBotLicenseCheckoutProduct,
  resolveCheckoutProductId,
} from "@/app/lib/commercial/business-model";

export type PayPalRecordStatus =
  | "pending"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "expired"
  | "payment_failed"
  | "refunded";

export type MembershipInternalStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "PAYMENT_FAILED";

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

type PayPalMode = "sandbox" | "production";

type PayPalPaymentOrderRow = {
  user_id: string;
  paypal_order_id: string;
  product_code: string;
  amount: number;
  currency: string;
  status: string;
  capture_id: string | null;
  completed_at: Date | null;
};

type PayPalSubscriptionRow = {
  user_id: string;
  paypal_subscription_id: string;
  paypal_plan_id: string;
  internal_plan_code: string;
  status: MembershipInternalStatus;
  next_billing_date: Date | null;
};

type PayPalActivationResult = {
  fulfillment: "none" | "membership" | "bot-license";
  licenseKey?: string | null;
  downloadUrl?: string | null;
  manualUrl?: string | null;
};

type PayPalApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

let tablesReadyPromise: Promise<void> | null = null;
let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

const PAYPAL_OFFERINGS_LIST: PayPalOffering[] = [
  {
    id: "plan-basic-monthly",
    name: "CARVIPIX Basico",
    description: "Suscripcion mensual CARVIPIX Basico.",
    type: "subscription",
    amount: 19.99,
    currency: "USD",
  },
  {
    id: "plan-pro-monthly",
    name: "CARVIPIX Pro",
    description: "Suscripcion mensual CARVIPIX Pro.",
    type: "subscription",
    amount: 99.0,
    currency: "USD",
  },
  {
    id: "bot-carvipix-999",
    name: "Bot CARVIPIX",
    description: "Licencia de pago unico Bot CARVIPIX.",
    type: "one_time",
    amount: 999.0,
    currency: "USD",
  },
];

export const PAYPAL_OFFERINGS: Record<string, PayPalOffering> = PAYPAL_OFFERINGS_LIST.reduce<Record<string, PayPalOffering>>((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function resolvePayPalMode(): PayPalMode {
  const runtimeStage = getRuntimeStage();
  const defaultMode = runtimeStage === "production" ? "production" : "sandbox";
  const mode = String(process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || defaultMode).trim().toLowerCase();
  return mode === "production" || mode === "live" ? "production" : "sandbox";
}

function resolvePayPalBaseUrl(): string {
  const override = process.env.PAYPAL_API_BASE?.trim();
  if (override) {
    return override;
  }

  if (resolvePayPalMode() === "production") {
    return "https://api-m.paypal.com";
  }

  return process.env.PAYPAL_SANDBOX_API_BASE?.trim() || "https://api-m.sandbox.paypal.com";
}

function resolvePayPalClientId(): string {
  if (resolvePayPalMode() === "production") {
    return String(process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_LIVE_CLIENT_ID || "").trim();
  }

  return String(process.env.PAYPAL_SANDBOX_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || "").trim();
}

function resolvePayPalClientSecret(): string {
  if (resolvePayPalMode() === "production") {
    return String(process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_LIVE_CLIENT_SECRET || "").trim();
  }

  return String(process.env.PAYPAL_SANDBOX_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET || "").trim();
}

function resolvePayPalWebhookId(): string {
  if (resolvePayPalMode() === "production") {
    return String(process.env.PAYPAL_WEBHOOK_ID || process.env.PAYPAL_LIVE_WEBHOOK_ID || "").trim();
  }

  return String(process.env.PAYPAL_SANDBOX_WEBHOOK_ID || process.env.PAYPAL_WEBHOOK_ID || "").trim();
}

function resolvePayPalMerchantId(): string {
  if (resolvePayPalMode() === "production") {
    return String(process.env.PAYPAL_MERCHANT_ID || process.env.PAYPAL_LIVE_MERCHANT_ID || "").trim();
  }

  return String(process.env.PAYPAL_SANDBOX_MERCHANT_ID || process.env.PAYPAL_MERCHANT_ID || "").trim();
}

function resolvePayPalSoftDescriptor(): string {
  return String(process.env.PAYPAL_SOFT_DESCRIPTOR || "CARVIPIX").trim().slice(0, 22);
}

function resolvePayPalEnvironmentSource(): string {
  return resolvePayPalMode() === "production" ? "paypal_live" : "paypal_sandbox";
}

function resolvePayPalProvisioningTag(): string {
  return resolvePayPalMode() === "production" ? "paypal-live" : "paypal-sandbox";
}

function resolveAppPublicUrl(): string {
  return String(process.env.APP_PUBLIC_URL || "https://carvipix.com").trim().replace(/\/$/, "");
}

function resolvePayPalRequestTimeoutMs(): number {
  const raw = Number(process.env.PAYPAL_REQUEST_TIMEOUT_MS || "12000");
  if (!Number.isFinite(raw) || raw < 1000) {
    return 12000;
  }
  return raw;
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
  if (status === "PAST_DUE") {
    return "payment_failed";
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

export function mapPayPalToMembershipStatus(statusRaw: string | null | undefined): MembershipInternalStatus {
  const status = String(statusRaw ?? "").toUpperCase();
  if (["ACTIVE", "COMPLETED"].includes(status)) return "ACTIVE";
  if (status === "PAST_DUE") return "PAST_DUE";
  if (status === "SUSPENDED") return "SUSPENDED";
  if (["CANCELLED", "VOIDED", "DENIED"].includes(status)) return "CANCELLED";
  if (status === "EXPIRED") return "EXPIRED";
  if (["PAYMENT_FAILED", "FAILED"].includes(status)) return "PAYMENT_FAILED";
  return "PENDING";
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
          status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'past_due', 'suspended', 'cancelled', 'expired', 'payment_failed', 'refunded')),
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
          error_message TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS paypal_products (
          id TEXT PRIMARY KEY,
          internal_code TEXT NOT NULL UNIQUE,
          paypal_product_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          environment TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS paypal_plans (
          id TEXT PRIMARY KEY,
          internal_code TEXT NOT NULL UNIQUE,
          paypal_plan_id TEXT NOT NULL UNIQUE,
          paypal_product_id TEXT NOT NULL,
          name TEXT NOT NULL,
          price NUMERIC(14, 2) NOT NULL,
          currency CHAR(3) NOT NULL,
          billing_interval TEXT NOT NULL,
          environment TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS paypal_payment_orders (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          paypal_order_id TEXT NOT NULL UNIQUE,
          product_code TEXT NOT NULL,
          amount NUMERIC(14, 2) NOT NULL,
          currency CHAR(3) NOT NULL,
          status TEXT NOT NULL,
          capture_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS paypal_subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          paypal_subscription_id TEXT NOT NULL UNIQUE,
          paypal_plan_id TEXT NOT NULL,
          internal_plan_code TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PAYMENT_FAILED')),
          environment TEXT NOT NULL,
          start_date TIMESTAMPTZ,
          next_billing_date TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS ux_paypal_billing_order
          ON paypal_billing_records(paypal_order_id)
          WHERE paypal_order_id IS NOT NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS ux_paypal_billing_subscription
          ON paypal_billing_records(paypal_subscription_id)
          WHERE paypal_subscription_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_paypal_payment_orders_user
          ON paypal_payment_orders(user_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_paypal_subscriptions_user
          ON paypal_subscriptions(user_id, created_at DESC);
      `)
      .then(() => undefined);
  }

  await tablesReadyPromise;
}

async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs - now > 45_000) {
    return cachedAccessToken.token;
  }

  const clientId = resolvePayPalClientId();
  const clientSecret = resolvePayPalClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error(`Faltan credenciales de PayPal ${resolvePayPalMode()}`);
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolvePayPalRequestTimeoutMs());
  let response: Response;
  try {
    response = await fetch(`${resolvePayPalBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || `No se pudo autenticar contra PayPal ${resolvePayPalMode()}`);
  }

  const ttlMs = Math.max(60_000, Number(payload.expires_in ?? 300) * 1000);
  cachedAccessToken = {
    token: payload.access_token,
    expiresAtMs: Date.now() + ttlMs,
  };

  return cachedAccessToken.token;
}

async function callPayPal<T>(path: string, init: RequestInit): Promise<PayPalApiResponse<T>> {
  const accessToken = await getPayPalAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolvePayPalRequestTimeoutMs());
  let response: Response;
  try {
    response = await fetch(`${resolvePayPalBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    const maybeMessage = (data as { message?: string; details?: Array<{ issue?: string; description?: string }> }).message;
    const detail = (data as { details?: Array<{ issue?: string; description?: string }> }).details?.[0];
    throw new Error(maybeMessage || detail?.description || detail?.issue || `PayPal API error ${response.status}`);
  }

  return { ok: true, status: response.status, data };
}

function isPayPalMissingResourceError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /specified resource does not exist/i.test(message);
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

async function upsertPayPalProductCatalog(input: {
  internalCode: string;
  paypalProductId: string;
  name: string;
  status: string;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_products (id, internal_code, paypal_product_id, name, environment, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (internal_code) DO UPDATE
    SET paypal_product_id = EXCLUDED.paypal_product_id,
        name = EXCLUDED.name,
      environment = EXCLUDED.environment,
        status = EXCLUDED.status,
        updated_at = NOW()
    `,
    [createId("pprod"), input.internalCode, input.paypalProductId, input.name, resolvePayPalMode(), input.status]
  );
}

async function upsertPayPalPlanCatalog(input: {
  internalCode: string;
  paypalPlanId: string;
  paypalProductId: string;
  name: string;
  price: number;
  currency: string;
  billingInterval: string;
  status: string;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_plans (
      id, internal_code, paypal_plan_id, paypal_product_id, name, price, currency,
      billing_interval, environment, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    ON CONFLICT (internal_code) DO UPDATE
    SET paypal_plan_id = EXCLUDED.paypal_plan_id,
        paypal_product_id = EXCLUDED.paypal_product_id,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        billing_interval = EXCLUDED.billing_interval,
        environment = EXCLUDED.environment,
        status = EXCLUDED.status,
        updated_at = NOW()
    `,
    [
      createId("pplan"),
      input.internalCode,
      input.paypalPlanId,
      input.paypalProductId,
      input.name,
      input.price,
      input.currency,
      input.billingInterval,
      resolvePayPalMode(),
      input.status,
    ]
  );
}

async function upsertPayPalPaymentOrder(input: {
  userId: string;
  paypalOrderId: string;
  productCode: string;
  amount: number;
  currency: string;
  status: string;
  captureId?: string | null;
  completedAt?: Date | null;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_payment_orders (
      id, user_id, paypal_order_id, product_code, amount, currency, status,
      capture_id, created_at, completed_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW())
    ON CONFLICT (paypal_order_id) DO UPDATE
    SET status = EXCLUDED.status,
        capture_id = COALESCE(EXCLUDED.capture_id, paypal_payment_orders.capture_id),
        completed_at = COALESCE(EXCLUDED.completed_at, paypal_payment_orders.completed_at),
        updated_at = NOW()
    `,
    [
      createId("ppord"),
      input.userId,
      input.paypalOrderId,
      input.productCode,
      input.amount,
      input.currency,
      input.status,
      input.captureId ?? null,
      input.completedAt ?? null,
    ]
  );
}

async function upsertPayPalSubscription(input: {
  userId: string;
  paypalSubscriptionId: string;
  paypalPlanId: string;
  internalPlanCode: string;
  status: MembershipInternalStatus;
  startDate?: Date | null;
  nextBillingDate?: Date | null;
  cancelledAt?: Date | null;
}): Promise<void> {
  await ensurePayPalTables();
  await backendDatabase.query(
    `
    INSERT INTO paypal_subscriptions (
      id, user_id, paypal_subscription_id, paypal_plan_id, internal_plan_code,
      status, environment, start_date, next_billing_date, cancelled_at, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    ON CONFLICT (paypal_subscription_id) DO UPDATE
    SET paypal_plan_id = EXCLUDED.paypal_plan_id,
        internal_plan_code = EXCLUDED.internal_plan_code,
        status = EXCLUDED.status,
      environment = EXCLUDED.environment,
        start_date = COALESCE(EXCLUDED.start_date, paypal_subscriptions.start_date),
        next_billing_date = COALESCE(EXCLUDED.next_billing_date, paypal_subscriptions.next_billing_date),
        cancelled_at = COALESCE(EXCLUDED.cancelled_at, paypal_subscriptions.cancelled_at),
        updated_at = NOW()
    `,
    [
      createId("ppsub"),
      input.userId,
      input.paypalSubscriptionId,
      input.paypalPlanId,
      input.internalPlanCode,
      input.status,
      resolvePayPalMode(),
      input.startDate ?? null,
      input.nextBillingDate ?? null,
      input.cancelledAt ?? null,
    ]
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
    ON CONFLICT (paypal_order_id) WHERE paypal_order_id IS NOT NULL DO UPDATE
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
    ON CONFLICT (paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL DO UPDATE
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

async function findPaymentOrderByPayPalOrderId(orderId: string): Promise<PayPalPaymentOrderRow | null> {
  await ensurePayPalTables();
  const result = await backendDatabase.query<PayPalPaymentOrderRow>(
    `
    SELECT user_id, paypal_order_id, product_code, amount, currency, status, capture_id, completed_at
    FROM paypal_payment_orders
    WHERE paypal_order_id = $1
    LIMIT 1
    `,
    [orderId]
  );

  return result.rows[0] ?? null;
}

async function findPayPalSubscriptionById(subscriptionId: string): Promise<PayPalSubscriptionRow | null> {
  await ensurePayPalTables();
  const result = await backendDatabase.query<PayPalSubscriptionRow>(
    `
    SELECT user_id, paypal_subscription_id, paypal_plan_id, internal_plan_code, status, next_billing_date
    FROM paypal_subscriptions
    WHERE paypal_subscription_id = $1
    LIMIT 1
    `,
    [subscriptionId]
  );

  return result.rows[0] ?? null;
}

function extractOrderAmount(resource: Record<string, unknown>): { amount: number | null; currency: string | null } {
  const purchaseUnit = Array.isArray(resource.purchase_units)
    ? (resource.purchase_units[0] as { amount?: { value?: string | number; currency_code?: string } } | undefined)
    : undefined;
  const value = purchaseUnit?.amount?.value;
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
  const currency = purchaseUnit?.amount?.currency_code ? String(purchaseUnit.amount.currency_code).toUpperCase() : null;
  return { amount: Number.isFinite(amount as number) ? (amount as number) : null, currency };
}

function extractCaptureAmount(resource: Record<string, unknown>): { amount: number | null; currency: string | null } {
  const amountNode = resource.amount as { value?: string | number; currency_code?: string } | undefined;
  const value = amountNode?.value;
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
  const currency = amountNode?.currency_code ? String(amountNode.currency_code).toUpperCase() : null;
  return { amount: Number.isFinite(amount as number) ? (amount as number) : null, currency };
}

function assertAmountAndCurrencyMatch(
  record: { amount: number; currency: string },
  payload: { amount: number | null; currency: string | null },
  context: string
): void {
  if (payload.amount === null || !payload.currency) {
    throw new Error(`${context}: monto o moneda no disponibles en evento PayPal`);
  }

  if (Math.abs(Number(record.amount) - payload.amount) > 0.009) {
    throw new Error(`${context}: monto PayPal no coincide con la orden interna`);
  }

  if (String(record.currency).toUpperCase() !== payload.currency.toUpperCase()) {
    throw new Error(`${context}: moneda PayPal no coincide con la orden interna`);
  }
}

async function resolveRecipientName(userId: string, fallbackEmail: string): Promise<string> {
  const result = await backendDatabase.query<{ nombre: string | null; apellido: string | null }>(
    `SELECT nombre, apellido FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  const fullName = `${row?.nombre ?? ""} ${row?.apellido ?? ""}`.trim();
  return fullName || fallbackEmail;
}

async function activateAccessByProduct(input: {
  userId: string;
  productId: string;
  subscriptionId?: string;
  nextBillingTime?: Date | null;
  now: Date;
}): Promise<PayPalActivationResult> {
  const checkoutId = resolveCheckoutProductId(input.productId);
  const product = getCommercialProductByCheckoutId(checkoutId);
  const source = resolvePayPalEnvironmentSource();

  if (product?.planCode === "basic") {
    await backendDatabase.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source, payment_subscription_id)
      VALUES ($1, 'basic', 'activo', $2, $3, true, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'basic', estado = 'activo', fecha_inicio = COALESCE(memberships.fecha_inicio, EXCLUDED.fecha_inicio),
          fecha_fin = EXCLUDED.fecha_fin, renovacion_automatica = true, source = EXCLUDED.source,
          payment_subscription_id = COALESCE(EXCLUDED.payment_subscription_id, memberships.payment_subscription_id)
      `,
      [input.userId, input.now, input.nextBillingTime ?? addDays(input.now, 30), source, input.subscriptionId ?? null]
    );
    return { fulfillment: "membership" };
  }

  if (product?.planCode === "pro") {
    await backendDatabase.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source, payment_subscription_id)
      VALUES ($1, 'advanced', 'activo', $2, $3, true, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'advanced', estado = 'activo', fecha_inicio = COALESCE(memberships.fecha_inicio, EXCLUDED.fecha_inicio),
          fecha_fin = EXCLUDED.fecha_fin, renovacion_automatica = true, source = EXCLUDED.source,
          payment_subscription_id = COALESCE(EXCLUDED.payment_subscription_id, memberships.payment_subscription_id)
      `,
      [input.userId, input.now, input.nextBillingTime ?? addDays(input.now, 30), source, input.subscriptionId ?? null]
    );
    return { fulfillment: "membership" };
  }

  if (isBotLicenseCheckoutProduct(checkoutId)) {
    const botAccessExpiresAt = addDays(input.now, 365);
    await backendDatabase.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source)
      VALUES ($1, 'advanced', 'activo', $2, $3, false, $4)
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'advanced',
          estado = 'activo',
          fecha_inicio = COALESCE(memberships.fecha_inicio, EXCLUDED.fecha_inicio),
          fecha_fin = GREATEST(COALESCE(memberships.fecha_fin, EXCLUDED.fecha_fin), EXCLUDED.fecha_fin),
          renovacion_automatica = false,
          source = EXCLUDED.source
      `,
      [input.userId, input.now, botAccessExpiresAt, "paypal_bot_license"]
    );

    await backendDatabase.query(
      `
      UPDATE users
      SET plan = 'advanced', estado = 'activo', fecha_vencimiento = $2
      WHERE id = $1
      `,
      [input.userId, botAccessExpiresAt]
    );

    const currentLicense = await backendDatabase.query<{ user_id: string; license_key: string | null }>(
      `
      SELECT user_id, license_key
      FROM bot_licenses
      WHERE user_id = $1
      LIMIT 1
      `,
      [input.userId]
    );

    const expiryDate = null;

    if (currentLicense.rows[0]) {
      const licenseKey = currentLicense.rows[0].license_key || `CVPX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await backendDatabase.query(
        `
        UPDATE bot_licenses
        SET active = true,
            purchase_date = COALESCE(purchase_date, $2),
            expiry_date = $3,
            license_key = COALESCE(license_key, $4)
        WHERE user_id = $1
        `,
        [input.userId, input.now, expiryDate, licenseKey]
      );

      await backendDatabase.query(
        `
        INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, created_at, expires_at, max_installations, subscription_tier, activated_at)
        VALUES ($1, $2, $3, 'ACTIVE', NOW(), $4, 1, 'ENTERPRISE', NOW())
        ON CONFLICT (license_id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            status = 'ACTIVE',
            expires_at = EXCLUDED.expires_at,
            activated_at = NOW()
        `,
        [createId("mt5lic"), licenseKey, input.userId, botAccessExpiresAt]
      );

      const downloadToken = createHash("sha256")
        .update(`${licenseKey}:${input.userId}:${input.now.toISOString()}`)
        .digest("hex");

      await backendDatabase.query(
        `
        INSERT INTO bot_mt5_downloads (id, user_id, license_id, file_hash, download_token, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (download_token) DO NOTHING
        `,
        [
          createId("mt5dl"),
          input.userId,
          licenseKey,
          "CARVIPIX_EA_MT5_V1.ex5",
          downloadToken,
          addDays(input.now, 1),
        ]
      );

      return {
        fulfillment: "bot-license",
        licenseKey,
        downloadUrl: `${resolveAppPublicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(downloadToken)}`,
        manualUrl: `${resolveAppPublicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(downloadToken)}&file=manual`,
      };
    } else {
      const licenseKey = `CVPX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await backendDatabase.query(
        `
        INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
        VALUES ($1, $2, $3, $4, true, $5)
        `,
        [input.userId, licenseKey, input.now, expiryDate, resolvePayPalProvisioningTag()]
      );

      await backendDatabase.query(
        `
        INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, created_at, expires_at, max_installations, subscription_tier, activated_at)
        VALUES ($1, $2, $3, 'ACTIVE', NOW(), $4, 1, 'ENTERPRISE', NOW())
        ON CONFLICT (license_id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            status = 'ACTIVE',
            expires_at = EXCLUDED.expires_at,
            activated_at = NOW()
        `,
        [createId("mt5lic"), licenseKey, input.userId, botAccessExpiresAt]
      );

      const downloadToken = createHash("sha256")
        .update(`${licenseKey}:${input.userId}:${input.now.toISOString()}`)
        .digest("hex");

      await backendDatabase.query(
        `
        INSERT INTO bot_mt5_downloads (id, user_id, license_id, file_hash, download_token, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (download_token) DO NOTHING
        `,
        [
          createId("mt5dl"),
          input.userId,
          licenseKey,
          "CARVIPIX_EA_MT5_V1.ex5",
          downloadToken,
          addDays(input.now, 1),
        ]
      );

      return {
        fulfillment: "bot-license",
        licenseKey,
        downloadUrl: `${resolveAppPublicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(downloadToken)}`,
        manualUrl: `${resolveAppPublicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(downloadToken)}&file=manual`,
      };
    }
  }

  return { fulfillment: "none" };
}

async function sendPaymentFulfillmentEmail(input: {
  userId: string;
  recipientEmail: string;
  productId: string;
  paymentOrderId: string;
  amount: number;
  currency: string;
  activation: PayPalActivationResult;
  providerEventId?: string;
  templateId?: "membership-payment-confirmed" | "bot-license-delivery-ready" | "membership-renewal" | "payment-failed" | "payment-refunded";
  failureReason?: string;
}): Promise<void> {
  const templateId = input.templateId || (input.activation.fulfillment === "bot-license" ? "bot-license-delivery-ready" : "membership-payment-confirmed");
  const recipientName = await resolveRecipientName(input.userId, input.recipientEmail);

  await emailNotificationService.sendPaymentTransactional({
    templateId,
    recipientEmail: input.recipientEmail,
    recipientName,
    paymentOrderId: input.paymentOrderId,
    amount: input.amount,
    currency: input.currency,
    provider: "paypal",
    providerEventId: input.providerEventId,
    productId: input.productId,
    productType: input.activation.fulfillment,
    failureReason: input.failureReason,
    licenseKey: input.activation.licenseKey ?? undefined,
    downloadUrl: input.activation.downloadUrl ?? undefined,
    manualUrl: input.activation.manualUrl ?? undefined,
  });
}

export async function listPayPalOfferings(): Promise<PayPalOffering[]> {
  return Object.values(PAYPAL_OFFERINGS);
}

export function getPayPalStatus() {
  const clientId = resolvePayPalClientId();
  const webhookId = resolvePayPalWebhookId();
  const merchantId = resolvePayPalMerchantId();
  return {
    env: resolvePayPalMode(),
    configured: Boolean(clientId && resolvePayPalClientSecret()),
    webhookConfigured: Boolean(webhookId),
    merchantConfigured: Boolean(merchantId),
    clientId,
    merchantId,
    apiBase: resolvePayPalBaseUrl(),
  };
}

async function ensureCatalogProductForOffering(
  offering: PayPalOffering,
  options?: { ignoreCache?: boolean }
): Promise<{ paypalProductId: string; created: boolean }> {
  const cache = options?.ignoreCache ? null : await findCatalogCache(offering.id);
  if (cache?.paypal_product_id) {
    return { paypalProductId: cache.paypal_product_id, created: false };
  }

  const productPayload = {
    name: offering.name,
    description: offering.description,
    type: "SERVICE",
    category: "SOFTWARE",
  };

  const productResponse = await callPayPal<{ id: string }>('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify(productPayload),
  });

  await upsertCatalogCache({
    localProductId: offering.id,
    paypalProductId: productResponse.data.id,
    paypalPlanId: cache?.paypal_plan_id ?? null,
  });

  await upsertPayPalProductCatalog({
    internalCode: offering.id,
    paypalProductId: productResponse.data.id,
    name: offering.name,
    status: "ACTIVE",
  });

  return { paypalProductId: productResponse.data.id, created: true };
}

export async function seedPayPalCatalog(): Promise<{
  environment: string;
  products: Array<{ internalCode: string; paypalProductId: string; created: boolean }>;
  plans: Array<{ internalCode: string; paypalPlanId: string; created: boolean }>;
}> {
  await ensurePayPalTables();

  const products: Array<{ internalCode: string; paypalProductId: string; created: boolean }> = [];
  const plans: Array<{ internalCode: string; paypalPlanId: string; created: boolean }> = [];

  for (const offering of PAYPAL_OFFERINGS_LIST) {
    const existingCache = await findCatalogCache(offering.id);
    const product = await ensureCatalogProductForOffering(offering);
    products.push({
      internalCode: offering.id,
      paypalProductId: product.paypalProductId,
      created: product.created,
    });

    if (offering.type === "subscription") {
      const plan = await ensureSubscriptionPlanForOffering(offering.id);
      plans.push({
        internalCode: offering.id,
        paypalPlanId: plan.paypalPlanId,
        created: !Boolean(existingCache?.paypal_plan_id),
      });
    }
  }

  return {
    environment: resolvePayPalMode(),
    products,
    plans,
  };
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
    try {
      await callPayPal(`/v1/catalogs/products/${encodeURIComponent(cache.paypal_product_id)}`, { method: "GET" });
      await callPayPal(`/v1/billing/plans/${encodeURIComponent(cache.paypal_plan_id)}`, { method: "GET" });

      await upsertPayPalProductCatalog({
        internalCode: offering.id,
        paypalProductId: cache.paypal_product_id,
        name: offering.name,
        status: "ACTIVE",
      });
      await upsertPayPalPlanCatalog({
        internalCode: offering.id,
        paypalPlanId: cache.paypal_plan_id,
        paypalProductId: cache.paypal_product_id,
        name: `${offering.name} mensual`,
        price: offering.amount,
        currency: offering.currency,
        billingInterval: "MONTH:1",
        status: "ACTIVE",
      });
      return {
        offering,
        paypalProductId: cache.paypal_product_id,
        paypalPlanId: cache.paypal_plan_id,
      };
    } catch (error) {
      if (!isPayPalMissingResourceError(error)) {
        throw error;
      }
    }
  }

  const { paypalProductId } = await ensureCatalogProductForOffering(offering, { ignoreCache: true });

  const planPayload = {
    product_id: paypalProductId,
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
    paypalProductId,
    paypalPlanId: planResponse.data.id,
  });

  await upsertPayPalProductCatalog({
    internalCode: offering.id,
    paypalProductId,
    name: offering.name,
    status: "ACTIVE",
  });

  await upsertPayPalPlanCatalog({
    internalCode: offering.id,
    paypalPlanId: planResponse.data.id,
    paypalProductId,
    name: `${offering.name} mensual`,
    price: offering.amount,
    currency: offering.currency,
    billingInterval: "MONTH:1",
    status: "ACTIVE",
  });

  return {
    offering,
    paypalProductId,
    paypalPlanId: planResponse.data.id,
  };
}

export async function createPayPalOrder(input: {
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
          soft_descriptor: resolvePayPalSoftDescriptor(),
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

  await upsertPayPalPaymentOrder({
    userId: input.user.id,
    paypalOrderId: response.data.id,
    productCode: offering.id,
    amount: offering.amount,
    currency: offering.currency,
    status: "PENDING",
  });

  return {
    orderId: response.data.id,
    status: response.data.status,
    approveUrl: response.data.links?.find((link) => link.rel === "approve")?.href ?? null,
    offering,
  };
}

export async function capturePayPalOrder(input: {
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

  const storedOrder = await findPaymentOrderByPayPalOrderId(input.orderId);
  if (!storedOrder) {
    throw new Error("Orden PayPal no encontrada en tabla interna de pagos");
  }

  if (existing.user_id !== input.user.id) {
    throw new Error("Orden no pertenece al usuario autenticado");
  }

  const response = await callPayPal<{
    id: string;
    status: string;
    payer?: { payer_id?: string; email_address?: string };
    purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string }> } }>;
  }>(`/v2/checkout/orders/${encodeURIComponent(input.orderId)}/capture`, {
    method: "POST",
    body: "{}",
  });

  const recordStatus = mapSubscriptionStatus(response.data.status);
  const now = new Date();
  const purchaseUnits = response.data.purchase_units as unknown as Record<string, unknown>[] | undefined;
  const eventAmount = purchaseUnits ? extractOrderAmount({ purchase_units: purchaseUnits }) : { amount: Number(existing.amount), currency: existing.currency };

  assertAmountAndCurrencyMatch(
    { amount: Number(existing.amount), currency: existing.currency },
    eventAmount,
    "capture_paypal_order"
  );

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

  let activation: PayPalActivationResult = { fulfillment: "none" };
  if (recordStatus === "active" && storedOrder.status !== "COMPLETED") {
    activation = await activateAccessByProduct({
      userId: input.user.id,
      productId: existing.product_id,
      now,
    });
  }

  const captureId = response.data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
  await upsertPayPalPaymentOrder({
    userId: input.user.id,
    paypalOrderId: response.data.id,
    productCode: existing.product_id,
    amount: Number(existing.amount),
    currency: existing.currency,
    status: recordStatus === "active" ? "COMPLETED" : "FAILED",
    captureId,
    completedAt: recordStatus === "active" ? now : null,
  });

  if (recordStatus === "active" && storedOrder.status !== "COMPLETED") {
    await sendPaymentFulfillmentEmail({
      userId: input.user.id,
      recipientEmail: response.data.payer?.email_address || input.user.email,
      productId: existing.product_id,
      paymentOrderId: response.data.id,
      amount: Number(existing.amount),
      currency: existing.currency,
      activation,
      providerEventId: response.data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? undefined,
    });
  }

  return {
    orderId: response.data.id,
    status: response.data.status,
    recordStatus,
  };
}

export async function getPayPalOrderStatus(input: {
  orderId: string;
  userId: string;
}): Promise<{
  orderId: string;
  paypalStatus: string;
  recordStatus: PayPalRecordStatus;
  productId: string;
  productName: string;
  isBotLicense: boolean;
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

  const checkoutId = resolveCheckoutProductId(existing.product_id);
  const product = getCommercialProductByCheckoutId(checkoutId);

  return {
    orderId: response.data.id,
    paypalStatus: response.data.status,
    recordStatus: existing.status,
    productId: existing.product_id,
    productName: product?.name ?? existing.product_id,
    isBotLicense: isBotLicenseCheckoutProduct(existing.product_id),
  };
}

export async function createPayPalSubscription(input: {
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

  await upsertPayPalSubscription({
    userId: input.user.id,
    paypalSubscriptionId: response.data.id,
    paypalPlanId,
    internalPlanCode: offering.id,
    status: mapPayPalToMembershipStatus(response.data.status),
    startDate: new Date(),
  });

  const pendingPlan = offering.id === "plan-pro-monthly" ? "advanced" : "basic";
  await backendDatabase.query(
    `
    INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source, payment_subscription_id)
    VALUES ($1, $2, 'inactivo', NOW(), NULL, true, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
    SET payment_subscription_id = EXCLUDED.payment_subscription_id,
        renovacion_automatica = true,
        source = EXCLUDED.source
    `,
    [input.user.id, pendingPlan, resolvePayPalEnvironmentSource(), response.data.id]
  );

  return {
    subscriptionId: response.data.id,
    status: response.data.status,
    approveUrl: response.data.links?.find((link) => link.rel === "approve")?.href ?? null,
    planId: paypalPlanId,
    offering,
  };
}

export async function getPayPalSubscriptionStatus(input: {
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
    plan_id?: string;
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

  await upsertPayPalSubscription({
    userId: existing.user_id,
    paypalSubscriptionId: response.data.id,
    paypalPlanId: response.data.plan_id ?? "unknown",
    internalPlanCode: existing.product_id,
    status: mapPayPalToMembershipStatus(response.data.status),
    nextBillingDate: nextBillingTime,
  });

  if (mapped === "active") {
    await activateAccessByProduct({
      userId: existing.user_id,
      productId: existing.product_id,
      subscriptionId: response.data.id,
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

export async function cancelPayPalSubscription(input: {
  subscriptionId: string;
  userId: string;
  reason?: string;
}): Promise<{
  subscriptionId: string;
  status: string;
  recordStatus: PayPalRecordStatus;
}> {
  const existing = await findRecordBySubscriptionId(input.subscriptionId);
  if (!existing) {
    throw new Error("Suscripcion no encontrada");
  }

  if (existing.user_id !== input.userId) {
    throw new Error("Suscripcion no pertenece al usuario autenticado");
  }

  await callPayPal(`/v1/billing/subscriptions/${encodeURIComponent(input.subscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: String(input.reason || "Cancelada por cliente") }),
  });

  const cancelledAt = new Date();
  await upsertBillingRecordBySubscription({
    userId: existing.user_id,
    email: existing.email,
    productId: existing.product_id,
    subscriptionId: input.subscriptionId,
    payerId: existing.paypal_payer_id,
    status: "cancelled",
    currency: existing.currency,
    amount: Number(existing.amount),
    nextBillingTime: null,
  });

  await upsertPayPalSubscription({
    userId: existing.user_id,
    paypalSubscriptionId: input.subscriptionId,
    paypalPlanId: "unknown",
    internalPlanCode: existing.product_id,
    status: "CANCELLED",
    cancelledAt,
  });

  await backendDatabase.query(
    `
    UPDATE memberships
    SET renovacion_automatica = false,
        estado = CASE WHEN fecha_fin IS NOT NULL AND fecha_fin > NOW() THEN estado ELSE 'cancelado' END
    WHERE user_id = $1
    `,
    [existing.user_id]
  );

  return {
    subscriptionId: input.subscriptionId,
    status: "CANCELLED",
    recordStatus: "cancelled",
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
  const webhookId = resolvePayPalWebhookId();

  if (!webhookId) {
    throw new Error(`Falta PAYPAL_WEBHOOK_ID en entorno ${resolvePayPalMode()}`);
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
    ON CONFLICT (event_id) DO UPDATE
    SET event_type = EXCLUDED.event_type,
      verification_status = EXCLUDED.verification_status,
      process_status = EXCLUDED.process_status,
      payload = EXCLUDED.payload,
      error_message = NULL,
      processed_at = NULL
    WHERE paypal_webhook_events.verification_status <> 'SUCCESS'
       OR paypal_webhook_events.process_status = 'failed'
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
      SET process_status = 'failed', error_message = 'verification_failed', processed_at = NOW()
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
      if (!orderId) {
        throw new Error("Webhook PayPal sin orderId");
      }

      const record = await findRecordByOrderId(orderId);
      if (!record) {
        throw new Error("Orden PayPal inexistente para webhook de checkout");
      }

      assertAmountAndCurrencyMatch(
        { amount: Number(record.amount), currency: record.currency },
        extractOrderAmount(resource),
        "paypal_checkout_order"
      );

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
    }

    if (
      eventType === "BILLING.SUBSCRIPTION.CREATED" ||
      eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
      eventType === "BILLING.SUBSCRIPTION.UPDATED" ||
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
      eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
      eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    ) {
      const subscriptionId = String(resource.id || "").trim();
      if (!subscriptionId) {
        throw new Error("Webhook PayPal sin subscriptionId");
      }

      const record = await findRecordBySubscriptionId(subscriptionId);
      if (!record) {
        throw new Error("Suscripcion PayPal inexistente para webhook");
      }

      const existingSubscription = await findPayPalSubscriptionById(subscriptionId);
      const statusByEvent: Record<string, PayPalRecordStatus> = {
        "BILLING.SUBSCRIPTION.CREATED": "pending",
        "BILLING.SUBSCRIPTION.ACTIVATED": "active",
        "BILLING.SUBSCRIPTION.UPDATED": "pending",
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

      await upsertPayPalSubscription({
        userId: record.user_id,
        paypalSubscriptionId: subscriptionId,
        paypalPlanId: existingSubscription?.paypal_plan_id || "unknown",
        internalPlanCode: record.product_id,
        status: mapPayPalToMembershipStatus(mapped),
        nextBillingDate: nextBillingTime,
        cancelledAt: mapped === "cancelled" ? now : null,
      });

      if (mapped === "active" && existingSubscription?.status !== "ACTIVE") {
        const activation = await activateAccessByProduct({
          userId: record.user_id,
          productId: record.product_id,
          subscriptionId,
          nextBillingTime,
          now,
        });

        await sendPaymentFulfillmentEmail({
          userId: record.user_id,
          recipientEmail: record.email,
          productId: record.product_id,
          paymentOrderId: subscriptionId,
          amount: Number(record.amount),
          currency: record.currency,
          activation,
          providerEventId: eventId,
          templateId: existingSubscription ? "membership-renewal" : "membership-payment-confirmed",
        });
      }
    }

    if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      const relatedIds = resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
      const orderId = String(relatedIds?.related_ids?.order_id || "").trim();
      if (!orderId) {
        throw new Error("Webhook PayPal refund sin orderId");
      }

      const record = await findRecordByOrderId(orderId);
      if (!record) {
        throw new Error("Orden PayPal inexistente para refund");
      }

      assertAmountAndCurrencyMatch(
        { amount: Number(record.amount), currency: record.currency },
        extractCaptureAmount(resource),
        "paypal_capture_refunded"
      );

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

      await upsertPayPalPaymentOrder({
        userId: record.user_id,
        paypalOrderId: orderId,
        productCode: record.product_id,
        amount: Number(record.amount),
        currency: record.currency,
        status: "REFUNDED",
      });

      await sendPaymentFulfillmentEmail({
        userId: record.user_id,
        recipientEmail: record.email,
        productId: record.product_id,
        paymentOrderId: orderId,
        amount: Number(record.amount),
        currency: record.currency,
        activation: { fulfillment: "none" },
        providerEventId: eventId,
        templateId: "payment-refunded",
      });
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "PAYMENT.SALE.COMPLETED") {
      const orderId = String((resource as { supplementary_data?: { related_ids?: { order_id?: string } } })?.supplementary_data?.related_ids?.order_id || "").trim();
      if (!orderId) {
        throw new Error("Webhook PayPal capture sin orderId");
      }

      const record = await findRecordByOrderId(orderId);
      if (!record) {
        throw new Error("Orden PayPal inexistente para capture");
      }

      const storedOrder = await findPaymentOrderByPayPalOrderId(orderId);
      if (!storedOrder) {
        throw new Error("Orden interna de pago inexistente para capture");
      }

      assertAmountAndCurrencyMatch(
        { amount: Number(record.amount), currency: record.currency },
        extractCaptureAmount(resource),
        "paypal_capture_completed"
      );

      const now = new Date();
      await upsertBillingRecordByOrder({
        userId: record.user_id,
        email: record.email,
        productId: record.product_id,
        orderId,
        payerId: record.paypal_payer_id,
        status: "active",
        currency: record.currency,
        amount: Number(record.amount),
        lastPaymentAt: now,
      });
      await upsertPayPalPaymentOrder({
        userId: record.user_id,
        paypalOrderId: orderId,
        productCode: record.product_id,
        amount: Number(record.amount),
        currency: record.currency,
        status: "COMPLETED",
        captureId: String(resource.id || "").trim() || null,
        completedAt: now,
      });

      if (storedOrder.status !== "COMPLETED") {
        const activation = await activateAccessByProduct({
          userId: record.user_id,
          productId: record.product_id,
          now,
        });

        await sendPaymentFulfillmentEmail({
          userId: record.user_id,
          recipientEmail: record.email,
          productId: record.product_id,
          paymentOrderId: orderId,
          amount: Number(record.amount),
          currency: record.currency,
          activation,
          providerEventId: eventId,
        });
      }
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.SALE.DENIED") {
      const orderId = String((resource as { supplementary_data?: { related_ids?: { order_id?: string } } })?.supplementary_data?.related_ids?.order_id || "").trim();
      if (!orderId) {
        throw new Error("Webhook PayPal denied sin orderId");
      }

      const record = await findRecordByOrderId(orderId);
      if (!record) {
        throw new Error("Orden PayPal inexistente para denied");
      }

      assertAmountAndCurrencyMatch(
        { amount: Number(record.amount), currency: record.currency },
        extractCaptureAmount(resource),
        "paypal_capture_denied"
      );

      await upsertBillingRecordByOrder({
        userId: record.user_id,
        email: record.email,
        productId: record.product_id,
        orderId,
        payerId: record.paypal_payer_id,
        status: "payment_failed",
        currency: record.currency,
        amount: Number(record.amount),
      });
      await upsertPayPalPaymentOrder({
        userId: record.user_id,
        paypalOrderId: orderId,
        productCode: record.product_id,
        amount: Number(record.amount),
        currency: record.currency,
        status: "FAILED",
      });

      await sendPaymentFulfillmentEmail({
        userId: record.user_id,
        recipientEmail: record.email,
        productId: record.product_id,
        paymentOrderId: orderId,
        amount: Number(record.amount),
        currency: record.currency,
        activation: { fulfillment: "none" },
        providerEventId: eventId,
        templateId: "payment-failed",
        failureReason: eventType,
      });
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
      SET process_status = 'failed', error_message = $2, processed_at = NOW()
      WHERE event_id = $1
      `,
      [eventId, error instanceof Error ? error.message : "unknown_error"]
    );

    throw error;
  }
}
