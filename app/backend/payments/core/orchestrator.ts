import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import { resolveProviderAdapter } from "./provider-adapter";
import type { Money, PaymentMethodType, PaymentOrderStatus, PaymentTransactionStatus, ProviderName } from "./types";
import { canCreateCheckoutSessionFromStatus, createExternalOrderCode, deriveCheckoutProgression } from "./payment-order-logic";
import {
  buildWebhookFingerprint,
  deriveOrderTargetStatus,
  deriveTransactionStatusPath,
  isUniqueViolation,
} from "./webhook-logic";
import {
  buildMembershipSourceTag,
  calculateMembershipExpiry,
  resolveMembershipPlanForProduct,
  shouldSkipActivation,
} from "./membership-activation-logic";
import { buildPaymentEmailDedupeKey, resolvePaymentEmailTemplateId } from "./email-outbox-logic";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProvider(value: string | undefined): ProviderName {
  const provider = (value ?? "").trim().toLowerCase();
  if (provider === "stripe" || provider === "mercadopago" || provider === "openpay" || provider === "custom") {
    return provider;
  }

  return "custom";
}

function mapTimelineEventType(eventType: string): "payment_authorized" | "payment_captured" | "payment_failed" | "refund_succeeded" | null {
  if (eventType === "payment_authorized") {
    return "payment_authorized";
  }
  if (eventType === "payment_captured") {
    return "payment_captured";
  }
  if (eventType === "payment_failed") {
    return "payment_failed";
  }
  if (eventType === "payment_refunded") {
    return "refund_succeeded";
  }

  return null;
}

export interface CreateOrderInput {
  userId: string;
  productId: string;
  idempotencyKey: string;
  paymentMethodRequested?: PaymentMethodType;
  providerPreferred?: ProviderName;
  metadata?: Record<string, unknown>;
}

export interface CheckoutSessionInput {
  orderId: string;
  userId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface ProcessWebhookInput {
  provider?: ProviderName;
  payloadRaw: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface ProcessWebhookResult {
  ok: boolean;
  duplicate: boolean;
  processStatus: "processed" | "ignored" | "failed";
  signatureValid: boolean;
  provider: ProviderName;
  providerEventId: string;
  orderId?: string;
  transactionId?: string;
}

interface MembershipActivationResult {
  activated: boolean;
  plan?: "pro" | "premium" | "enterprise";
  expiresAt?: Date;
}

export class PaymentOrchestrator {
  private async enqueueTransactionalEmailOutbox(input: {
    client: {
      query: (sql: string, params?: Array<unknown>) => Promise<{ rows: Array<Record<string, unknown>> }>;
    };
    now: Date;
    eventType: string;
    transactionId: string;
    orderId: string;
    recipientEmail: string;
    recipientName: string;
    provider?: string | null;
    providerEventId?: string;
    providerPaymentId?: string | null;
    providerSubscriptionId?: string | null;
    productId?: string;
    productType?: string | null;
    amount?: number;
    currency?: string;
    failureReason?: string | null;
  }): Promise<void> {
    const templateId = resolvePaymentEmailTemplateId({
      eventType: input.eventType,
      productType: input.productType,
    });
    if (!templateId) {
      return;
    }

    const dedupeKey = buildPaymentEmailDedupeKey({
      transactionId: input.transactionId,
      eventType: input.eventType,
      providerPaymentId: input.providerPaymentId,
      providerSubscriptionId: input.providerSubscriptionId,
    });

    await input.client.query(
      `
      INSERT INTO payment_outbox_events (
        id, aggregate_type, aggregate_id, event_name, payload, status, attempts, available_at, created_at
      ) VALUES (
        $1, 'payment_email', $2, 'email.transactional.requested', $3::jsonb, 'pending', 0, $4, $4
      )
      ON CONFLICT DO NOTHING
      `,
      [
        createId("pout"),
        input.transactionId,
        JSON.stringify({
          templateId,
          dedupeKey,
          paymentOrderId: input.orderId,
          paymentTransactionId: input.transactionId,
          recipientEmail: input.recipientEmail,
          recipientName: input.recipientName,
          amount: input.amount,
          currency: input.currency,
          provider: input.provider ?? null,
          providerEventId: input.providerEventId ?? null,
          productId: input.productId ?? null,
          productType: input.productType ?? null,
          failureReason: input.failureReason ?? null,
        }),
        input.now,
      ]
    );
  }

  private async activateMembershipFromCapturedPayment(input: {
    client: {
      query: (sql: string, params?: Array<unknown>) => Promise<{ rows: Array<Record<string, unknown>> }>;
    };
    userId: string;
    orderId: string;
    transactionId: string;
    productId: string;
    productType?: string | null;
    provider: ProviderName;
    providerEventId: string;
    now: Date;
  }): Promise<MembershipActivationResult> {
    const plan = resolveMembershipPlanForProduct({
      productId: input.productId,
      productType: input.productType,
    });

    if (!plan) {
      return { activated: false };
    }

    const sourceTag = buildMembershipSourceTag(input.orderId);

    const membershipResult = await input.client.query(
      `
      SELECT user_id, estado, fecha_fin, source
      FROM memberships
      WHERE user_id = $1
      FOR UPDATE
      `,
      [input.userId]
    );

    const membershipRow = membershipResult.rows[0] as
      | {
          user_id: string;
          estado: string;
          fecha_fin: Date | null;
          source: string | null;
        }
      | undefined;

    if (
      shouldSkipActivation({
        membershipStatus: membershipRow?.estado,
        membershipSource: membershipRow?.source,
        sourceTag,
      })
    ) {
      return {
        activated: false,
        plan,
        expiresAt: membershipRow?.fecha_fin ?? undefined,
      };
    }

    const expiresAt = calculateMembershipExpiry({
      now: input.now,
      plan,
      currentExpiry: membershipRow?.fecha_fin,
    });

    await input.client.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source)
      VALUES ($1, $2, 'activo', $3, $4, true, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET plan = EXCLUDED.plan,
          estado = 'activo',
          fecha_inicio = CASE
            WHEN memberships.estado = 'activo' THEN memberships.fecha_inicio
            ELSE EXCLUDED.fecha_inicio
          END,
          fecha_fin = EXCLUDED.fecha_fin,
          renovacion_automatica = true,
          source = EXCLUDED.source
      `,
      [input.userId, plan, input.now, expiresAt, sourceTag]
    );

    await input.client.query(
      `
      UPDATE users
      SET plan = $2,
          estado = 'activo',
          fecha_vencimiento = $3
      WHERE id = $1
      `,
      [input.userId, plan, expiresAt]
    );

    await input.client.query(
      `
      INSERT INTO payment_timeline_events (
        id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
      ) VALUES (
        $1, $2, $3, 'membership_activated', 'system', $4::jsonb, $5, $6, $7
      )
      `,
      [
        createId("ptle"),
        input.orderId,
        input.transactionId,
        JSON.stringify({
          userId: input.userId,
          plan,
          source: sourceTag,
          expiresAt,
        }),
        input.providerEventId,
        input.now,
        "system",
      ]
    );

    await input.client.query(
      `
      INSERT INTO payment_outbox_events (
        id, aggregate_type, aggregate_id, event_name, payload, status, attempts, available_at, created_at
      ) VALUES (
        $1, 'membership', $2, 'membership.activated', $3::jsonb, 'pending', 0, $4, $4
      )
      `,
      [
        createId("pout"),
        input.userId,
        JSON.stringify({
          userId: input.userId,
          paymentOrderId: input.orderId,
          paymentTransactionId: input.transactionId,
          provider: input.provider,
          providerEventId: input.providerEventId,
          plan,
          expiresAt,
        }),
        input.now,
      ]
    );

    return {
      activated: true,
      plan,
      expiresAt,
    };
  }

  async createOrder(input: CreateOrderInput) {
    if (!backendDatabase.enabled) {
      throw new Error("Database is required for payment orchestration.");
    }

    const existing = await backendDatabase.query<{
      id: string;
      external_order_code: string;
      order_status: PaymentOrderStatus;
      amount_total: number;
      currency: string;
      created_at: Date;
    }>(
      `
      SELECT id, external_order_code, order_status, amount_total, currency, created_at
      FROM payment_orders
      WHERE user_id = $1 AND idempotency_key = $2
      LIMIT 1
      `,
      [input.userId, input.idempotencyKey]
    );

    if (existing.rows[0]) {
      const row = existing.rows[0];
      return {
        id: row.id,
        externalOrderCode: row.external_order_code,
        status: row.order_status,
        total: { amount: Number(row.amount_total), currency: row.currency } satisfies Money,
        createdAt: row.created_at,
        idempotent: true,
      };
    }

    const productResult = await backendDatabase.query<{
      id: string;
      price: number;
      currency: string;
    }>(
      `SELECT id, price, currency FROM products WHERE id = $1 LIMIT 1`,
      [input.productId]
    );

    const product = productResult.rows[0];
    if (!product) {
      throw new Error("Product not found.");
    }

    const now = new Date();
    const orderId = createId("pord");
    const externalOrderCode = createExternalOrderCode(now);
    const amountTotal = Number(product.price ?? 0);

    await backendDatabase.withTransaction(async (client) => {
      await client.query(
        `
        INSERT INTO payment_orders (
          id, external_order_code, user_id, product_id, order_status, amount_subtotal, amount_tax,
          amount_total, currency, payment_method_requested, provider_preferred, idempotency_key,
          metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'created', $5, 0,
          $5, $6, $7, $8, $9,
          $10::jsonb, $11, $11
        )
        `,
        [
          orderId,
          externalOrderCode,
          input.userId,
          input.productId,
          amountTotal,
          product.currency,
          input.paymentMethodRequested ?? null,
          input.providerPreferred ?? null,
          input.idempotencyKey,
          JSON.stringify(input.metadata ?? {}),
          now,
        ]
      );

      await client.query(
        `
        INSERT INTO payment_timeline_events (
          id, payment_order_id, event_type, event_source, event_data, occurred_at, actor
        ) VALUES (
          $1, $2, 'order_created', 'system', $3::jsonb, $4, $5
        )
        `,
        [createId("ptle"), orderId, JSON.stringify({ idempotencyKey: input.idempotencyKey }), now, input.userId]
      );

      await client.query(
        `
        INSERT INTO payment_outbox_events (
          id, aggregate_type, aggregate_id, event_name, payload, status, attempts, available_at, created_at
        ) VALUES (
          $1, 'payment_order', $2, 'payment.order.created', $3::jsonb, 'pending', 0, $4, $4
        )
        `,
        [createId("pout"), orderId, JSON.stringify({ userId: input.userId, productId: input.productId }), now]
      );
    });

    return {
      id: orderId,
      externalOrderCode,
      status: "created" as const,
      total: { amount: amountTotal, currency: product.currency } satisfies Money,
      createdAt: now,
      idempotent: false,
    };
  }

  async createCheckoutSession(input: CheckoutSessionInput) {
    if (!backendDatabase.enabled) {
      throw new Error("Database is required for payment orchestration.");
    }

    const orderResult = await backendDatabase.query<{
      id: string;
      user_id: string;
      product_id: string;
      order_status: PaymentOrderStatus;
      amount_total: number;
      currency: string;
      provider_preferred: ProviderName | null;
      payment_method_requested: PaymentMethodType | null;
    }>(
      `
      SELECT id, user_id, product_id, order_status, amount_total, currency, provider_preferred, payment_method_requested
      FROM payment_orders
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [input.orderId, input.userId]
    );

    const order = orderResult.rows[0];
    if (!order) {
      throw new Error("Order not found.");
    }

    if (!canCreateCheckoutSessionFromStatus(order.order_status)) {
      throw new Error(`Order in status ${order.order_status} cannot create a checkout session.`);
    }

    const adapter = resolveProviderAdapter(order.provider_preferred ?? undefined);
    const session = await adapter.createCheckoutSession({
      orderId: order.id,
      userId: order.user_id,
      productId: order.product_id,
      amount: { amount: Number(order.amount_total), currency: order.currency },
      paymentMethod: order.payment_method_requested ?? undefined,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        userId: input.userId,
      },
    });

    const now = new Date();

    const providerAccountResult = await backendDatabase.query<{ id: string }>(
      `
      SELECT id
      FROM provider_accounts
      WHERE provider = $1 AND environment = 'production' AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [session.provider]
    );

    const providerAccountId = providerAccountResult.rows[0]?.id ?? createId("provacc");

    if (!providerAccountResult.rows[0]) {
      await backendDatabase.query(
        `
        INSERT INTO provider_accounts (
          id, provider, environment, display_name, credentials_secret_ref, webhook_secret_ref,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, 'production', $3, $4, $5, true, $6, $6
        )
        `,
        [
          providerAccountId,
          session.provider,
          `${session.provider.toUpperCase()} Default`,
          `secrets/${session.provider}/credentials`,
          `secrets/${session.provider}/webhook`,
          now,
        ]
      );
    }

    await backendDatabase.withTransaction(async (client) => {
      const { awaitingConfirmationStatus } = deriveCheckoutProgression(order.order_status);

      await client.query(
        `
        UPDATE payment_orders
        SET order_status = $2,
            provider_preferred = COALESCE(provider_preferred, $3),
            updated_at = $4
        WHERE id = $1
        `,
        [order.id, awaitingConfirmationStatus, session.provider, now]
      );

      const txId = createId("ptx");
      await client.query(
        `
        INSERT INTO payment_transactions (
          id, payment_order_id, provider, provider_account_id, provider_checkout_id,
          status, currency, payment_method, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          'initiated', $6, $7, $8::jsonb, $9, $9
        )
        `,
        [
          txId,
          order.id,
          session.provider,
          providerAccountId,
          session.providerCheckoutId,
          order.currency,
          order.payment_method_requested ?? null,
          JSON.stringify(session.raw ?? {}),
          now,
        ]
      );

      await client.query(
        `
        INSERT INTO payment_timeline_events (
          id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, occurred_at, actor
        ) VALUES
          ($1, $2, $3, 'provider_session_created', 'system', $4::jsonb, $5, $6),
          ($7, $2, $3, 'webhook_received', 'system', $8::jsonb, $5, $6)
        `,
        [
          createId("ptle"),
          order.id,
          txId,
          JSON.stringify({ provider: session.provider, providerCheckoutId: session.providerCheckoutId }),
          now,
          input.userId,
          createId("ptle"),
          JSON.stringify({ note: "Awaiting provider webhook confirmation" }),
        ]
      );

      await client.query(
        `
        INSERT INTO payment_outbox_events (
          id, aggregate_type, aggregate_id, event_name, payload, status, attempts, available_at, created_at
        ) VALUES (
          $1, 'payment_order', $2, 'payment.checkout.session.created', $3::jsonb, 'pending', 0, $4, $4
        )
        `,
        [
          createId("pout"),
          order.id,
          JSON.stringify({ provider: session.provider, providerCheckoutId: session.providerCheckoutId }),
          now,
        ]
      );
    });

    return {
      orderId: order.id,
      status: "awaiting_confirmation" as const,
      provider: session.provider,
      providerCheckoutId: session.providerCheckoutId,
      checkoutUrl: session.checkoutUrl,
      expiresAt: session.expiresAt,
    };
  }

  async listOrders(userId: string, status?: PaymentOrderStatus) {
    if (!backendDatabase.enabled) {
      throw new Error("Database is required for payment orchestration.");
    }

    const params: Array<string> = [userId];
    let whereClause = "WHERE po.user_id = $1";

    if (status) {
      params.push(status);
      whereClause += ` AND po.order_status = $${params.length}`;
    }

    const { rows } = await backendDatabase.query<{
      id: string;
      external_order_code: string;
      order_status: PaymentOrderStatus;
      amount_total: number;
      currency: string;
      created_at: Date;
      updated_at: Date;
      provider: ProviderName | null;
    }>(
      `
      SELECT
        po.id,
        po.external_order_code,
        po.order_status,
        po.amount_total,
        po.currency,
        po.created_at,
        po.updated_at,
        pt.provider
      FROM payment_orders po
      LEFT JOIN payment_transactions pt ON pt.payment_order_id = po.id
      ${whereClause}
      ORDER BY po.created_at DESC
      `,
      params
    );

    return rows.map((item) => ({
      id: item.id,
      externalOrderCode: item.external_order_code,
      status: item.order_status,
      total: { amount: Number(item.amount_total), currency: item.currency } satisfies Money,
      provider: item.provider ?? undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async getOrderDetail(userId: string, orderId: string) {
    if (!backendDatabase.enabled) {
      throw new Error("Database is required for payment orchestration.");
    }

    const [orderResult, timelineResult] = await Promise.all([
      backendDatabase.query<{
        id: string;
        external_order_code: string;
        order_status: PaymentOrderStatus;
        amount_subtotal: number;
        amount_tax: number;
        amount_total: number;
        currency: string;
        payment_method_requested: PaymentMethodType | null;
        provider_preferred: ProviderName | null;
        metadata: unknown;
        created_at: Date;
        updated_at: Date;
      }>(
        `
        SELECT id, external_order_code, order_status, amount_subtotal, amount_tax, amount_total, currency,
               payment_method_requested, provider_preferred, metadata, created_at, updated_at
        FROM payment_orders
        WHERE id = $1 AND user_id = $2
        LIMIT 1
        `,
        [orderId, userId]
      ),
      backendDatabase.query<{
        id: string;
        event_type: string;
        event_source: string;
        event_data: unknown;
        occurred_at: Date;
      }>(
        `
        SELECT id, event_type, event_source, event_data, occurred_at
        FROM payment_timeline_events
        WHERE payment_order_id = $1
        ORDER BY occurred_at DESC
        `,
        [orderId]
      ),
    ]);

    const order = orderResult.rows[0];
    if (!order) {
      return null;
    }

    return {
      id: order.id,
      externalOrderCode: order.external_order_code,
      status: order.order_status,
      subtotal: { amount: Number(order.amount_subtotal), currency: order.currency } satisfies Money,
      tax: { amount: Number(order.amount_tax), currency: order.currency } satisfies Money,
      total: { amount: Number(order.amount_total), currency: order.currency } satisfies Money,
      paymentMethodRequested: order.payment_method_requested ?? undefined,
      providerPreferred: order.provider_preferred ?? undefined,
      metadata: typeof order.metadata === "object" && order.metadata ? order.metadata : {},
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      timeline: timelineResult.rows.map((item) => ({
        id: item.id,
        eventType: item.event_type,
        eventSource: item.event_source,
        eventData: typeof item.event_data === "object" && item.event_data ? item.event_data : {},
        occurredAt: item.occurred_at,
      })),
    };
  }

  async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    if (!backendDatabase.enabled) {
      throw new Error("Database is required for payment orchestration.");
    }

    const providerFromHeader = Array.isArray(input.headers["x-provider"])
      ? input.headers["x-provider"][0]
      : input.headers["x-provider"];
    const provider = normalizeProvider(input.provider ?? providerFromHeader);
    const adapter = resolveProviderAdapter(provider);
    const now = new Date();

    let signatureValid = false;
    try {
      signatureValid = await adapter.verifyWebhookSignature({
        payloadRaw: input.payloadRaw,
        headers: input.headers,
        webhookSecret: "",
      });
    } catch {
      signatureValid = false;
    }

    const canonical = await adapter.parseWebhookEvent({
      payloadRaw: input.payloadRaw,
      headers: input.headers,
    });

    const providerAccountResult = await backendDatabase.query<{ id: string }>(
      `
      SELECT id
      FROM provider_accounts
      WHERE provider = $1 AND environment = 'production' AND is_active = true
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [provider]
    );

    const providerAccountId = providerAccountResult.rows[0]?.id ?? createId("provacc");
    if (!providerAccountResult.rows[0]) {
      await backendDatabase.query(
        `
        INSERT INTO provider_accounts (
          id, provider, environment, display_name, credentials_secret_ref, webhook_secret_ref,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, 'production', $3, $4, $5, true, $6, $6
        )
        `,
        [
          providerAccountId,
          provider,
          `${provider.toUpperCase()} Default`,
          `secrets/${provider}/credentials`,
          `secrets/${provider}/webhook`,
          now,
        ]
      );
    }

    const idempotencyFingerprint = buildWebhookFingerprint({
      provider,
      providerEventId: canonical.providerEventId,
      payloadRaw: input.payloadRaw,
    });
    const webhookEventId = createId("pwe");

    try {
      await backendDatabase.query(
        `
        INSERT INTO payment_webhook_events (
          id, provider, provider_account_id, provider_event_id, event_type, event_created_at,
          signature_valid, process_status, idempotency_fingerprint, payload, headers, first_seen_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, 'received', $8, $9::jsonb, $10::jsonb, $11
        )
        `,
        [
          webhookEventId,
          provider,
          providerAccountId,
          canonical.providerEventId,
          canonical.eventType,
          canonical.occurredAt,
          signatureValid,
          idempotencyFingerprint,
          JSON.stringify(canonical.raw ?? {}),
          JSON.stringify(input.headers ?? {}),
          now,
        ]
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          ok: true,
          duplicate: true,
          processStatus: "ignored",
          signatureValid: true,
          provider,
          providerEventId: canonical.providerEventId,
        };
      }

      throw error;
    }

    if (!signatureValid || canonical.eventType === "unknown") {
      await backendDatabase.query(
        `
        UPDATE payment_webhook_events
        SET process_status = 'ignored',
            error_message = $2,
            processed_at = $3
        WHERE id = $1
        `,
        [
          webhookEventId,
          !signatureValid ? "Webhook signature is invalid." : "Unsupported webhook event type.",
          now,
        ]
      );

      return {
        ok: true,
        duplicate: false,
        processStatus: "ignored",
        signatureValid,
        provider,
        providerEventId: canonical.providerEventId,
      };
    }

    const txFilters: string[] = [];
    const txParams: Array<string> = [provider];

    if (canonical.paymentOrderId) {
      txParams.push(canonical.paymentOrderId);
      txFilters.push(`pt.payment_order_id = $${txParams.length}`);
    }
    if (canonical.providerPaymentId) {
      txParams.push(canonical.providerPaymentId);
      txFilters.push(`pt.provider_payment_id = $${txParams.length}`);
    }
    if (canonical.providerCheckoutId) {
      txParams.push(canonical.providerCheckoutId);
      txFilters.push(`pt.provider_checkout_id = $${txParams.length}`);
    }

    if (txFilters.length === 0) {
      await backendDatabase.query(
        `
        UPDATE payment_webhook_events
        SET process_status = 'ignored',
            error_message = $2,
            processed_at = $3
        WHERE id = $1
        `,
        [webhookEventId, "No order or transaction reference in webhook payload.", now]
      );

      return {
        ok: true,
        duplicate: false,
        processStatus: "ignored",
        signatureValid,
        provider,
        providerEventId: canonical.providerEventId,
      };
    }

    const transactionResult = await backendDatabase.query<{
      tx_id: string;
      tx_status: string;
      amount_refunded: number;
      provider_payment_id: string | null;
      order_id: string;
      user_id: string;
      user_email: string;
      user_nombre: string;
      user_apellido: string;
      product_id: string;
      product_type: string;
      order_status: PaymentOrderStatus;
      order_total: number;
      order_currency: string;
    }>(
      `
      SELECT
        pt.id AS tx_id,
        pt.status AS tx_status,
        pt.amount_refunded,
        pt.provider_payment_id,
        po.id AS order_id,
        po.user_id,
        u.email AS user_email,
        u.nombre AS user_nombre,
        u.apellido AS user_apellido,
        po.product_id,
        p.type AS product_type,
        po.order_status,
        po.amount_total AS order_total,
        po.currency AS order_currency
      FROM payment_transactions pt
      INNER JOIN payment_orders po ON po.id = pt.payment_order_id
      INNER JOIN products p ON p.id = po.product_id
      INNER JOIN users u ON u.id = po.user_id
      WHERE pt.provider = $1
        AND (${txFilters.join(" OR ")})
      ORDER BY pt.created_at DESC
      LIMIT 1
      `,
      txParams
    );

    const tx = transactionResult.rows[0];
    if (!tx) {
      await backendDatabase.query(
        `
        UPDATE payment_webhook_events
        SET process_status = 'ignored',
            error_message = $2,
            processed_at = $3
        WHERE id = $1
        `,
        [webhookEventId, "No transaction found for webhook references.", now]
      );

      return {
        ok: true,
        duplicate: false,
        processStatus: "ignored",
        signatureValid,
        provider,
        providerEventId: canonical.providerEventId,
      };
    }

    const statusPath = deriveTransactionStatusPath(tx.tx_status as PaymentTransactionStatus, canonical.eventType);
    const refundDelta = canonical.eventType === "payment_refunded" ? Number(canonical.amount?.amount ?? 0) : 0;
    const newRefundedAmount = Number(tx.amount_refunded ?? 0) + (Number.isFinite(refundDelta) ? refundDelta : 0);
    const targetOrderStatus = deriveOrderTargetStatus({
      current: tx.order_status,
      eventType: canonical.eventType,
      refundedAmount: newRefundedAmount,
      orderTotal: Number(tx.order_total),
    });

    try {
      await backendDatabase.withTransaction(async (client) => {
        let resultingOrderStatus: PaymentOrderStatus = tx.order_status;

        await client.query(
          `
          UPDATE payment_transactions
          SET provider_payment_id = COALESCE(provider_payment_id, $2),
              provider_checkout_id = COALESCE(provider_checkout_id, $3),
              updated_at = $4
          WHERE id = $1
          `,
          [tx.tx_id, canonical.providerPaymentId ?? null, canonical.providerCheckoutId ?? null, now]
        );

        for (const nextStatus of statusPath) {
          if (nextStatus === "authorized") {
            await client.query(
              `
              UPDATE payment_transactions
              SET status = 'authorized',
                  authorized_at = COALESCE(authorized_at, $2),
                  amount_authorized = COALESCE($3, amount_authorized),
                  updated_at = $2
              WHERE id = $1
              `,
              [tx.tx_id, now, canonical.amount?.amount ?? null]
            );
          }

          if (nextStatus === "captured") {
            await client.query(
              `
              UPDATE payment_transactions
              SET status = 'captured',
                  captured_at = COALESCE(captured_at, $2),
                  amount_captured = COALESCE($3, amount_captured),
                  updated_at = $2
              WHERE id = $1
              `,
              [tx.tx_id, now, canonical.amount?.amount ?? null]
            );
          }

          if (nextStatus === "failed") {
            await client.query(
              `
              UPDATE payment_transactions
              SET status = 'failed',
                  failed_at = COALESCE(failed_at, $2),
                  failure_reason = COALESCE($3, failure_reason),
                  updated_at = $2
              WHERE id = $1
              `,
              [tx.tx_id, now, canonical.failureReason ?? null]
            );
          }

          if (nextStatus === "refunded") {
            await client.query(
              `
              UPDATE payment_transactions
              SET status = 'refunded',
                  amount_refunded = GREATEST(amount_refunded, $2),
                  updated_at = $3
              WHERE id = $1
              `,
              [tx.tx_id, newRefundedAmount, now]
            );
          }
        }

        if (targetOrderStatus && targetOrderStatus !== tx.order_status) {
          await client.query(
            `
            UPDATE payment_orders
            SET order_status = $2,
                updated_at = $3
            WHERE id = $1
            `,
            [tx.order_id, targetOrderStatus, now]
          );
          resultingOrderStatus = targetOrderStatus;
        }

        const membershipActivation =
          canonical.eventType === "payment_captured" && resultingOrderStatus === "paid"
            ? await this.activateMembershipFromCapturedPayment({
                client,
                userId: tx.user_id,
                orderId: tx.order_id,
                transactionId: tx.tx_id,
                productId: tx.product_id,
                productType: tx.product_type,
                provider,
                providerEventId: canonical.providerEventId,
                now,
              })
            : { activated: false };

        await client.query(
          `
          INSERT INTO payment_timeline_events (
            id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
          ) VALUES (
            $1, $2, $3, 'webhook_received', 'provider_webhook', $4::jsonb, $5, $6, $7
          )
          `,
          [
            createId("ptle"),
            tx.order_id,
            tx.tx_id,
            JSON.stringify({ provider, providerEventId: canonical.providerEventId, eventType: canonical.eventType }),
            canonical.providerEventId,
            now,
            provider,
          ]
        );

        const mappedTimelineEventType = mapTimelineEventType(canonical.eventType);
        if (mappedTimelineEventType) {
          await client.query(
            `
            INSERT INTO payment_timeline_events (
              id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
            ) VALUES (
              $1, $2, $3, $4, 'provider_webhook', $5::jsonb, $6, $7, $8
            )
            `,
            [
              createId("ptle"),
              tx.order_id,
              tx.tx_id,
              mappedTimelineEventType,
              JSON.stringify({
                provider,
                providerEventId: canonical.providerEventId,
                amount: canonical.amount ?? null,
                failureReason: canonical.failureReason ?? null,
              }),
              canonical.providerEventId,
              now,
              provider,
            ]
          );
        }

        await client.query(
          `
          INSERT INTO payment_timeline_events (
            id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
          ) VALUES (
            $1, $2, $3, 'webhook_processed', 'system', $4::jsonb, $5, $6, $7
          )
          `,
          [
            createId("ptle"),
            tx.order_id,
            tx.tx_id,
            JSON.stringify({
              provider,
              providerEventId: canonical.providerEventId,
              resultingOrderStatus,
              membershipActivated: membershipActivation.activated,
              membershipPlan: membershipActivation.plan ?? null,
            }),
            canonical.providerEventId,
            now,
            "system",
          ]
        );

        await client.query(
          `
          INSERT INTO payment_outbox_events (
            id, aggregate_type, aggregate_id, event_name, payload, status, attempts, available_at, created_at
          ) VALUES (
            $1, 'payment_order', $2, 'payment.webhook.processed', $3::jsonb, 'pending', 0, $4, $4
          )
          `,
          [
            createId("pout"),
            tx.order_id,
            JSON.stringify({
              provider,
              providerEventId: canonical.providerEventId,
              eventType: canonical.eventType,
              paymentOrderId: tx.order_id,
              paymentTransactionId: tx.tx_id,
            }),
            now,
          ]
        );

        await this.enqueueTransactionalEmailOutbox({
          client,
          now,
          eventType: canonical.eventType,
          transactionId: tx.tx_id,
          orderId: tx.order_id,
          recipientEmail: tx.user_email,
          recipientName: `${tx.user_nombre} ${tx.user_apellido}`.trim() || tx.user_email,
          provider,
          providerEventId: canonical.providerEventId,
          providerPaymentId: canonical.providerPaymentId ?? tx.provider_payment_id,
          providerSubscriptionId: canonical.providerSubscriptionId,
          productId: tx.product_id,
          productType: tx.product_type,
          amount: canonical.amount?.amount ?? Number(tx.order_total),
          currency: canonical.amount?.currency ?? tx.order_currency,
          failureReason: canonical.failureReason,
        });

        await client.query(
          `
          UPDATE payment_webhook_events
          SET process_status = 'processed',
              processed_at = $2
          WHERE id = $1
          `,
          [webhookEventId, now]
        );
      });

      return {
        ok: true,
        duplicate: false,
        processStatus: "processed",
        signatureValid,
        provider,
        providerEventId: canonical.providerEventId,
        orderId: tx.order_id,
        transactionId: tx.tx_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process webhook.";
      await backendDatabase.query(
        `
        UPDATE payment_webhook_events
        SET process_status = 'failed',
            error_message = $2,
            processed_at = $3
        WHERE id = $1
        `,
        [webhookEventId, errorMessage, new Date()]
      );

      return {
        ok: false,
        duplicate: false,
        processStatus: "failed",
        signatureValid,
        provider,
        providerEventId: canonical.providerEventId,
        orderId: tx.order_id,
        transactionId: tx.tx_id,
      };
    }
  }
}
