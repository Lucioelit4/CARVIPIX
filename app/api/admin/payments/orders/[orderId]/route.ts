import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";
import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  const rateLimit = rateLimiter.check({
    scope: "admin.payments.read",
    key: getClientIp(request),
    limit: 180,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiadas solicitudes",
        retryAfter: rateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ ok: false, error: "Detalle no disponible sin base de datos" }, { status: 501 });
  }

  const { orderId } = await context.params;

  const [orderResult, timelineResult, refundsResult, attemptsResult, webhooksResult] = await Promise.all([
    backendDatabase.query<{
      id: string;
      external_order_code: string;
      user_id: string;
      user_email: string | null;
      user_nombre: string | null;
      user_apellido: string | null;
      order_status: string;
      amount_subtotal: number;
      amount_tax: number;
      amount_total: number;
      currency: string;
      payment_method_requested: string | null;
      provider_preferred: string | null;
      metadata: unknown;
      created_at: Date;
      updated_at: Date;
      transaction_id: string | null;
      transaction_status: string | null;
      provider_payment_id: string | null;
      provider: string | null;
    }>(
      `
      SELECT
        po.id,
        po.external_order_code,
        po.user_id,
        u.email AS user_email,
        u.nombre AS user_nombre,
        u.apellido AS user_apellido,
        po.order_status,
        po.amount_subtotal,
        po.amount_tax,
        po.amount_total,
        po.currency,
        po.payment_method_requested,
        po.provider_preferred,
        po.metadata,
        po.created_at,
        po.updated_at,
        pt.id AS transaction_id,
        pt.status AS transaction_status,
        pt.provider_payment_id,
        pt.provider
      FROM payment_orders po
      LEFT JOIN payment_transactions pt ON pt.payment_order_id = po.id
      LEFT JOIN users u ON u.id = po.user_id
      WHERE po.id = $1
      LIMIT 1
      `,
      [orderId]
    ),
    backendDatabase.query<{
      id: string;
      event_type: string;
      event_source: string;
      event_data: unknown;
      correlation_id: string | null;
      occurred_at: Date;
      actor: string | null;
    }>(
      `
      SELECT id, event_type, event_source, event_data, correlation_id, occurred_at, actor
      FROM payment_timeline_events
      WHERE payment_order_id = $1
      ORDER BY occurred_at DESC
      `,
      [orderId]
    ),
    backendDatabase.query<{
      id: string;
      payment_transaction_id: string;
      provider_refund_id: string | null;
      amount: number;
      currency: string;
      status: string;
      reason: string | null;
      requested_by: string;
      requested_at: Date;
      completed_at: Date | null;
      metadata: unknown;
    }>(
      `
      SELECT id, payment_transaction_id, provider_refund_id, amount, currency, status, reason, requested_by, requested_at, completed_at, metadata
      FROM payment_refunds
      WHERE payment_transaction_id IN (
        SELECT id FROM payment_transactions WHERE payment_order_id = $1
      )
      ORDER BY requested_at DESC
      `,
      [orderId]
    ),
    backendDatabase.query<{
      id: string;
      payment_transaction_id: string;
      operation: string;
      status: string;
      request_payload: unknown;
      response_payload: unknown;
      http_status: number | null;
      latency_ms: number | null;
      error_message: string | null;
      retried_count: number;
      created_at: Date;
    }>(
      `
      SELECT id, payment_transaction_id, operation, status, request_payload, response_payload, http_status, latency_ms, error_message, retried_count, created_at
      FROM payment_attempts
      WHERE payment_transaction_id IN (
        SELECT id FROM payment_transactions WHERE payment_order_id = $1
      )
      ORDER BY created_at DESC
      `,
      [orderId]
    ),
    backendDatabase.query<{
      id: string;
      provider: string;
      provider_event_id: string;
      event_type: string;
      signature_valid: boolean;
      process_status: string;
      first_seen_at: Date;
      processed_at: Date | null;
      error_message: string | null;
    }>(
      `
      SELECT id, provider, provider_event_id, event_type, signature_valid, process_status, first_seen_at, processed_at, error_message
      FROM payment_webhook_events
      WHERE payload->>'orderId' = $1 OR payload->>'paymentOrderId' = $1
      ORDER BY first_seen_at DESC
      `,
      [orderId]
    ),
  ]);

  const order = orderResult.rows[0];
  if (!order) {
    return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        order,
        timeline: timelineResult.rows,
        refunds: refundsResult.rows,
        attempts: attemptsResult.rows,
        webhooks: webhooksResult.rows,
      },
    },
    { status: 200 }
  );
}
