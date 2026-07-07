import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";
import { listPayments, listUsers } from "@/app/backend/core/local-auth-store";
import { buildOrdersWhereClause, filterLocalPayments, parseOrdersFilters } from "./query-helpers";
import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";

const ADMIN_COOKIE_NAME = "carvipix_admin_session";

function isAdminRequest(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value === "1";
}

export async function GET(request: NextRequest) {
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

  const filters = parseOrdersFilters(request.nextUrl.searchParams);

  if (!backendDatabase.enabled) {
    const [payments, users] = await Promise.all([listPayments(), listUsers()]);
    const data = filterLocalPayments(payments, users, filters);

    return NextResponse.json({ ok: true, data }, { status: 200 });
  }

  const built = buildOrdersWhereClause(filters);
  const queryParams: Array<string | number | Date> = [...built.params, filters.limit];

  const { rows } = await backendDatabase.query<{
    order_id: string;
    order_status: string;
    transaction_status: string | null;
    user_id: string;
    user_email: string | null;
    amount_total: number;
    currency: string;
    provider: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT
      po.id AS order_id,
      po.order_status,
      pt.status AS transaction_status,
      po.user_id,
      u.email AS user_email,
      po.amount_total,
      po.currency,
      pt.provider,
      po.created_at,
      po.updated_at
    FROM payment_orders po
    LEFT JOIN payment_transactions pt ON pt.payment_order_id = po.id
    LEFT JOIN users u ON u.id = po.user_id
    ${built.whereClause}
    ORDER BY po.created_at DESC
    LIMIT $${queryParams.length}
    `,
    queryParams
  );

  const data = rows.map((row) => ({
    orderId: row.order_id,
    orderStatus: row.order_status,
    transactionStatus: row.transaction_status,
    userId: row.user_id,
    userEmail: row.user_email,
    amountTotal: Number(row.amount_total),
    currency: row.currency,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ ok: true, data }, { status: 200 });
}
