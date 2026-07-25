import { NextRequest, NextResponse } from 'next/server';

import { backendDatabase } from '@/app/backend/core/database';
import { masterEventDispatcher } from '@/app/backend/services/master-event-dispatcher';
import { recordCommercialAuditEvent } from '@/app/backend/commercial/audit-store';
import { isValidAdminSession } from '@/app/lib/auth/admin-server';
import { ensurePayPalTables } from '@/app/backend/paypal/sandbox';

type ExecutiveAction =
  | 'suspend-client'
  | 'reactivate-client'
  | 'suspend-service'
  | 'reactivate-service'
  | 'respond-support'
  | 'close-support';

type Overview = {
  registeredPeople: number;
  activePeople: number;
  newToday: number;
  activeMemberships: number;
  monthRevenue: number;
  failedPayments: number;
  serviceState: 'ACTIVO' | 'SUSPENDIDO';
  importantNotices: string[];
};

type ServiceSnapshot = {
  serviceState: 'ACTIVO' | 'SUSPENDIDO';
  brainState: string;
  telegramConnected: boolean;
  lastActivityAt: string | null;
  lastImportantError: string | null;
};

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

function ensureDatabaseEnabled() {
  if (!backendDatabase.enabled) {
    throw new Error('ADMIN_REAL_DATA_REQUIRED: DATABASE_URL no configurado.');
  }
}

function mapServiceState(brainState: string): 'ACTIVO' | 'SUSPENDIDO' {
  return brainState === 'ACTIVE' ? 'ACTIVO' : 'SUSPENDIDO';
}

async function loadExecutiveSnapshot() {
  ensureDatabaseEnabled();
  await ensurePayPalTables();

  const [
    usersResult,
    paymentsResult,
    supportResult,
    botLicensesResult,
  ] = await Promise.all([
    backendDatabase.query<{
      id: string;
      email: string;
      nombre: string;
      apellido: string;
      telefono: string | null;
      created_at: Date | null;
      plan: string;
      estado: string;
      membership_plan: string | null;
      membership_state: string | null;
      membership_start: Date | null;
      membership_end: Date | null;
      last_payment_at: Date | null;
      last_payment_amount: number | null;
      last_payment_currency: string | null;
    }>(
      `
      SELECT
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.telefono,
        u.created_at,
        u.plan,
        u.estado,
        m.plan AS membership_plan,
        m.estado AS membership_state,
        m.fecha_inicio AS membership_start,
        m.fecha_fin AS membership_end,
        p_last.created_at AS last_payment_at,
        p_last.amount_total AS last_payment_amount,
        p_last.currency AS last_payment_currency
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT paid_at AS created_at, amount_total, currency
        FROM (
          SELECT COALESCE(pt.captured_at, pt.settled_at, po.created_at) AS paid_at,
                 po.amount_total, po.currency
          FROM payment_orders po
          LEFT JOIN LATERAL (
            SELECT captured_at, settled_at
            FROM payment_transactions
            WHERE payment_order_id = po.id
            ORDER BY created_at DESC
            LIMIT 1
          ) pt ON true
          WHERE po.user_id = u.id
            AND po.order_status IN ('paid', 'captured', 'completed', 'settled')
          UNION ALL
          SELECT ppt.paid_at, ppt.gross_amount, ppt.currency
          FROM paypal_payment_transactions ppt
          WHERE ppt.user_id = u.id AND ppt.status = 'COMPLETED'
          UNION ALL
          SELECT pbr.last_payment_at, pbr.amount, pbr.currency
          FROM paypal_billing_records pbr
          WHERE pbr.user_id = u.id
            AND pbr.last_payment_at IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM paypal_payment_transactions ppt
              WHERE ppt.paypal_subscription_id = pbr.paypal_subscription_id
            )
        ) payment_history
        ORDER BY paid_at DESC
        LIMIT 1
      ) p_last ON true
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY u.created_at DESC NULLS LAST, u.id DESC
      `
    ),
    backendDatabase.query<{
      payment_id: string;
      user_id: string;
      client_name: string;
      email: string;
      gross_amount: number;
      fee_amount: number | null;
      net_amount: number | null;
      refunded_amount: number;
      currency: string;
      paid_at: Date;
      payment_status: string;
      provider: string;
      provider_transaction_id: string | null;
      provider_subscription_id: string | null;
      product_id: string;
      membership_plan: string | null;
      membership_state: string | null;
      membership_end: Date | null;
      auto_renew: boolean | null;
      subscription_status: string | null;
      cancelled_at: Date | null;
      failure_reason: string | null;
      source: string;
    }>(
      `
      WITH canonical_payments AS (
        SELECT
          po.id AS payment_id, po.user_id, po.amount_total AS gross_amount,
          NULL::numeric AS fee_amount,
          GREATEST(po.amount_total - COALESCE(pt.amount_refunded, 0), 0) AS net_amount,
          COALESCE(pt.amount_refunded, 0) AS refunded_amount,
          po.currency, COALESCE(pt.captured_at, pt.settled_at, pt.failed_at, po.created_at) AS paid_at,
          COALESCE(pt.status, po.order_status) AS payment_status,
          COALESCE(pt.provider, po.provider_preferred, 'custom') AS provider,
          pt.provider_payment_id AS provider_transaction_id,
          ps.provider_subscription_id, po.product_id,
          pt.failure_reason, 'payment_orders'::text AS source
        FROM payment_orders po
        LEFT JOIN LATERAL (
          SELECT provider, provider_payment_id, status, amount_refunded, captured_at, settled_at, failed_at, failure_reason
          FROM payment_transactions
          WHERE payment_order_id = po.id
          ORDER BY created_at DESC
          LIMIT 1
        ) pt ON true
        LEFT JOIN LATERAL (
          SELECT provider_subscription_id
          FROM payment_subscriptions
          WHERE user_id = po.user_id AND product_id = po.product_id
          ORDER BY updated_at DESC
          LIMIT 1
        ) ps ON true
      ),
      paypal_payments AS (
        SELECT
          ppt.id AS payment_id, ppt.user_id, ppt.gross_amount, ppt.fee_amount, ppt.net_amount,
          0::numeric AS refunded_amount, ppt.currency, ppt.paid_at,
          LOWER(ppt.status) AS payment_status, 'paypal'::text AS provider,
          ppt.paypal_transaction_id AS provider_transaction_id,
          ppt.paypal_subscription_id AS provider_subscription_id,
          ppt.product_id, NULL::text AS failure_reason,
          'paypal_payment_transactions'::text AS source
        FROM paypal_payment_transactions ppt
      ),
      paypal_unreconciled AS (
        SELECT
          pbr.id AS payment_id, pbr.user_id, pbr.amount AS gross_amount,
          NULL::numeric AS fee_amount, NULL::numeric AS net_amount,
          0::numeric AS refunded_amount, pbr.currency, pbr.last_payment_at AS paid_at,
          'reconciliation_pending'::text AS payment_status, 'paypal'::text AS provider,
          pbr.paypal_order_id AS provider_transaction_id,
          pbr.paypal_subscription_id AS provider_subscription_id,
          pbr.product_id, NULL::text AS failure_reason,
          'paypal_billing_records'::text AS source
        FROM paypal_billing_records pbr
        WHERE pbr.last_payment_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM paypal_payment_transactions ppt
            WHERE ppt.paypal_subscription_id = pbr.paypal_subscription_id
          )
      ),
      ledger AS (
        SELECT * FROM canonical_payments
        UNION ALL SELECT * FROM paypal_payments
        UNION ALL SELECT * FROM paypal_unreconciled
      )
      SELECT
        ledger.*,
        CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, '')) AS client_name,
        u.email,
        m.plan AS membership_plan,
        m.estado AS membership_state,
        m.fecha_fin AS membership_end,
        m.renovacion_automatica AS auto_renew,
        COALESCE(pps.status, ps.status) AS subscription_status,
        COALESCE(pps.cancelled_at, ps.cancelled_at) AS cancelled_at
      FROM ledger
      INNER JOIN users u ON u.id = ledger.user_id
      LEFT JOIN memberships m ON m.user_id = ledger.user_id
      LEFT JOIN paypal_subscriptions pps ON pps.paypal_subscription_id = ledger.provider_subscription_id
      LEFT JOIN payment_subscriptions ps ON ps.provider_subscription_id = ledger.provider_subscription_id
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY ledger.paid_at DESC
      LIMIT 1000
      `
    ),
    backendDatabase.query<{
      id: string;
      user_id: string;
      subject: string;
      status: string;
      admin_reply: string | null;
      created_at: Date;
      nombre: string | null;
      apellido: string | null;
    }>(
      `
      SELECT
        st.id,
        st.user_id,
        st.subject,
        st.status,
        st.admin_reply,
        st.created_at,
        u.nombre,
        u.apellido
      FROM support_tickets st
      LEFT JOIN users u ON u.id = st.user_id
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY st.created_at DESC
      LIMIT 200
      `
    ),
    backendDatabase.query<{
      user_id: string;
      email: string;
      nombre: string;
      apellido: string;
      bot_active: boolean;
      membership_plan: string | null;
      membership_state: string | null;
    }>(
      `
      SELECT
        u.id AS user_id,
        u.email,
        u.nombre,
        u.apellido,
        (bl.active = true AND (bl.expiry_date IS NULL OR bl.expiry_date > NOW())) AS bot_active,
        m.plan AS membership_plan,
        m.estado AS membership_state
      FROM bot_licenses bl
      INNER JOIN users u ON u.id = bl.user_id
      LEFT JOIN memberships m ON m.user_id = u.id
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY bl.purchase_date DESC, u.id DESC
      `
    ),
  ]);

  const brainStatus = masterEventDispatcher.getBrainStatus();
  const serviceState = mapServiceState(brainStatus.state);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeMemberships = usersResult.rows.filter(
    (row) => row.membership_state === 'activo' && (!row.membership_end || row.membership_end > now)
  );

  const monthRevenue = paymentsResult.rows
    .filter((row) => row.paid_at >= monthStart && ['paid', 'captured', 'completed', 'settled'].includes(row.payment_status.toLowerCase()))
    .reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0);

  const failedPaymentsCount = paymentsResult.rows.filter((row) => ['failed', 'payment_failed', 'declined', 'chargeback'].includes(row.payment_status.toLowerCase())).length;

  const openSupportCount = supportResult.rows.filter((row) => row.status !== 'closed' && row.status !== 'resolved').length;

  const notices: string[] = [];
  if (failedPaymentsCount > 0) {
    notices.push(`Hay ${failedPaymentsCount} pago(s) fallido(s) por revisar.`);
  }
  if (openSupportCount > 0) {
    notices.push(`Hay ${openSupportCount} solicitud(es) de soporte pendiente(s).`);
  }
  if (serviceState === 'SUSPENDIDO') {
    notices.push('El servicio está suspendido y requiere reactivación.');
  }
  if (brainStatus.errorMessage) {
    notices.push(`Último error del servicio: ${brainStatus.errorMessage}`);
  }

  const overview: Overview = {
    registeredPeople: usersResult.rows.length,
    activePeople: activeMemberships.length,
    newToday: usersResult.rows.filter((row) => row.created_at && row.created_at.toDateString() === now.toDateString()).length,
    activeMemberships: activeMemberships.length,
    monthRevenue,
    failedPayments: failedPaymentsCount,
    serviceState,
    importantNotices: notices,
  };

  const clients = usersResult.rows.map((row) => ({
    id: row.id,
    name: `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim() || row.email,
    email: row.email,
    phone: row.telefono,
    registeredAt: row.created_at ? row.created_at.toISOString() : null,
    plan: String(row.membership_plan ?? row.plan ?? 'sin-plan').toLowerCase(),
    status: row.estado,
    membershipStatus: String(row.membership_state ?? 'inactivo').toLowerCase(),
    lastPaymentAt: row.last_payment_at ? row.last_payment_at.toISOString() : null,
    lastPaymentAmount: row.last_payment_amount !== null ? Number(row.last_payment_amount) : null,
    lastPaymentCurrency: row.last_payment_currency,
  }));

  const memberships = usersResult.rows.map((row) => ({
    userId: row.id,
    name: `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim() || row.email,
    email: row.email,
    plan: String(row.membership_plan ?? row.plan ?? 'sin-plan').toLowerCase(),
    state: String(row.membership_state ?? 'inactivo').toLowerCase(),
    startedAt: row.membership_start ? row.membership_start.toISOString() : null,
    endsAt: row.membership_end ? row.membership_end.toISOString() : null,
    nextRenewalAt: row.membership_end ? row.membership_end.toISOString() : null,
    lastPaymentAt: row.last_payment_at ? row.last_payment_at.toISOString() : null,
    lastPaymentAmount: row.last_payment_amount !== null ? Number(row.last_payment_amount) : null,
    currency: row.last_payment_currency,
  }));

  const payments = paymentsResult.rows.map((row) => ({
    paymentId: row.payment_id,
    userId: row.user_id,
    client: String(row.client_name).trim() || row.email,
    email: row.email,
    grossAmount: Number(row.gross_amount),
    feeAmount: row.fee_amount === null ? null : Number(row.fee_amount),
    netAmount: row.net_amount === null ? null : Number(row.net_amount),
    refundedAmount: Number(row.refunded_amount ?? 0),
    currency: row.currency,
    plan: String(row.membership_plan ?? row.product_id ?? 'sin-plan').toLowerCase(),
    productId: row.product_id,
    paidAt: row.paid_at.toISOString(),
    paymentStatus: row.payment_status,
    provider: row.provider,
    providerTransactionId: row.provider_transaction_id,
    providerSubscriptionId: row.provider_subscription_id,
    membershipStatus: String(row.membership_state ?? 'inactivo').toLowerCase(),
    renewalStatus: row.auto_renew
      ? 'active'
      : String(row.subscription_status ?? '').toLowerCase() === 'cancelled'
        ? 'cancelled_at_period_end'
        : 'provider_action_required',
    validUntil: row.membership_end ? row.membership_end.toISOString() : null,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    failureReason: row.failure_reason,
    source: row.source,
  }));

  const failedPayments = payments.filter((row) => ['failed', 'payment_failed', 'declined', 'chargeback'].includes(row.paymentStatus.toLowerCase()));

  const service: ServiceSnapshot = {
    serviceState,
    brainState: brainStatus.state,
    telegramConnected: Boolean(brainStatus.telegramConnected),
    lastActivityAt: brainStatus.lastSignalTime ? new Date(brainStatus.lastSignalTime).toISOString() : null,
    lastImportantError: brainStatus.errorMessage ?? null,
  };

  const support = supportResult.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    clientName: `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim() || row.user_id,
    subject: row.subject,
    createdAt: row.created_at.toISOString(),
    status: row.status,
    adminReply: row.admin_reply,
  }));

  const botLicenses = botLicensesResult.rows.map((row) => ({
    userId: row.user_id,
    name: `${row.nombre ?? ''} ${row.apellido ?? ''}`.trim() || row.email,
    email: row.email,
    botActive: row.bot_active,
    membershipPlan: String(row.membership_plan ?? 'sin-plan').toLowerCase(),
    membershipStatus: String(row.membership_state ?? 'inactivo').toLowerCase(),
  }));

  return {
    overview,
    clients,
    memberships,
    payments,
    failedPayments,
    service,
    support,
    botLicenses,
  };
}

async function suspendOrReactivateClient(userId: string, activate: boolean) {
  ensureDatabaseEnabled();

  await backendDatabase.withTransaction(async (client) => {
    await client.query(
      `
      UPDATE users
      SET estado = $2
      WHERE id = $1
      `,
      [userId, activate ? 'activo' : 'inactivo']
    );

    await client.query(
      `
      UPDATE memberships
      SET estado = $2,
          updated_at = NOW()
      WHERE user_id = $1
      `,
      [userId, activate ? 'activo' : 'cancelado']
    );
  });

  await recordCommercialAuditEvent({
    actorType: 'admin',
    action: activate ? 'admin.client.reactivate' : 'admin.client.suspend',
    resource: userId,
    result: 'success',
  });
}

async function handleServiceAction(activate: boolean) {
  const current = masterEventDispatcher.getBrainStatus();

  if (activate) {
    if (current.state === 'PAUSED') {
      await masterEventDispatcher.resume();
    } else if (current.state === 'STOPPED' || current.state === 'ERROR' || current.state === 'MAINTENANCE') {
      await masterEventDispatcher.activate('admin-executive');
    }
  } else {
    if (current.state === 'ACTIVE' || current.state === 'STARTING') {
      await masterEventDispatcher.pause();
    }
  }

  await recordCommercialAuditEvent({
    actorType: 'admin',
    action: activate ? 'admin.service.reactivate' : 'admin.service.suspend',
    resource: 'carvipix-service',
    result: 'success',
  });
}

async function updateSupport(ticketId: string, status: string, adminReply: string | null) {
  ensureDatabaseEnabled();

  await backendDatabase.query(
    `
    UPDATE support_tickets
    SET status = $2,
        admin_reply = COALESCE($3, admin_reply),
        updated_at = NOW()
    WHERE id = $1
    `,
    [ticketId, status, adminReply]
  );

  await recordCommercialAuditEvent({
    actorType: 'admin',
    action: status === 'closed' ? 'admin.support.close' : 'admin.support.respond',
    resource: ticketId,
    result: 'success',
  });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await loadExecutiveSnapshot();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el panel ejecutivo.';
    const status = String(message).startsWith('ADMIN_REAL_DATA_REQUIRED') ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: ExecutiveAction;
      userId?: string;
      ticketId?: string;
      reply?: string;
    };

    const action = String(body.action ?? '').trim() as ExecutiveAction;

    if (action === 'suspend-client') {
      const userId = String(body.userId ?? '').trim();
      if (!userId) {
        return NextResponse.json({ ok: false, error: 'userId requerido.' }, { status: 400 });
      }
      await suspendOrReactivateClient(userId, false);
      return NextResponse.json({ ok: true, message: 'Cliente suspendido.' }, { status: 200 });
    }

    if (action === 'reactivate-client') {
      const userId = String(body.userId ?? '').trim();
      if (!userId) {
        return NextResponse.json({ ok: false, error: 'userId requerido.' }, { status: 400 });
      }
      await suspendOrReactivateClient(userId, true);
      return NextResponse.json({ ok: true, message: 'Cliente reactivado.' }, { status: 200 });
    }

    if (action === 'suspend-service') {
      await handleServiceAction(false);
      return NextResponse.json({ ok: true, message: 'Servicio suspendido.' }, { status: 200 });
    }

    if (action === 'reactivate-service') {
      await handleServiceAction(true);
      return NextResponse.json({ ok: true, message: 'Servicio reactivado.' }, { status: 200 });
    }

    if (action === 'respond-support') {
      const ticketId = String(body.ticketId ?? '').trim();
      const reply = String(body.reply ?? '').trim();
      if (!ticketId || !reply) {
        return NextResponse.json({ ok: false, error: 'ticketId y reply requeridos.' }, { status: 400 });
      }
      await updateSupport(ticketId, 'in_progress', reply);
      return NextResponse.json({ ok: true, message: 'Respuesta enviada.' }, { status: 200 });
    }

    if (action === 'close-support') {
      const ticketId = String(body.ticketId ?? '').trim();
      if (!ticketId) {
        return NextResponse.json({ ok: false, error: 'ticketId requerido.' }, { status: 400 });
      }
      await updateSupport(ticketId, 'closed', null);
      return NextResponse.json({ ok: true, message: 'Solicitud cerrada.' }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: 'Acción no soportada.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo completar la acción.';
    const status = String(message).startsWith('ADMIN_REAL_DATA_REQUIRED') ? 503 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
