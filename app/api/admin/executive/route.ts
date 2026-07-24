import { NextRequest, NextResponse } from 'next/server';

import { backendDatabase } from '@/app/backend/core/database';
import { masterEventDispatcher } from '@/app/backend/services/master-event-dispatcher';
import { recordCommercialAuditEvent } from '@/app/backend/commercial/audit-store';
import { isValidAdminSession } from '@/app/lib/auth/admin-server';

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

  const [
    usersResult,
    paymentsResult,
    supportResult,
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
        SELECT po.created_at, po.amount_total, po.currency
        FROM payment_orders po
        WHERE po.user_id = u.id
          AND po.order_status IN ('paid', 'captured', 'completed', 'settled')
        ORDER BY po.created_at DESC
        LIMIT 1
      ) p_last ON true
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY u.created_at DESC NULLS LAST, u.id DESC
      `
    ),
    backendDatabase.query<{
      order_id: string;
      user_id: string;
      client_name: string;
      email: string;
      amount_total: number;
      currency: string;
      created_at: Date;
      order_status: string;
      membership_plan: string | null;
      membership_end: Date | null;
    }>(
      `
      SELECT
        po.id AS order_id,
        po.user_id,
        CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, '')) AS client_name,
        u.email,
        po.amount_total,
        po.currency,
        po.created_at,
        po.order_status,
        m.plan AS membership_plan,
        m.fecha_fin AS membership_end
      FROM payment_orders po
      INNER JOIN users u ON u.id = po.user_id
      LEFT JOIN memberships m ON m.user_id = po.user_id
      WHERE COALESCE(u.exclude_from_commercial_metrics, false) = false
      ORDER BY po.created_at DESC
      LIMIT 300
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
  ]);

  const brainStatus = masterEventDispatcher.getBrainStatus();
  const serviceState = mapServiceState(brainStatus.state);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeMemberships = usersResult.rows.filter(
    (row) => row.membership_state === 'activo' && (!row.membership_end || row.membership_end > now)
  );

  const monthRevenue = paymentsResult.rows
    .filter((row) => row.created_at >= monthStart && ['paid', 'captured', 'completed', 'settled'].includes(row.order_status.toLowerCase()))
    .reduce((sum, row) => sum + Number(row.amount_total ?? 0), 0);

  const failedPaymentsCount = paymentsResult.rows.filter((row) => ['failed', 'cancelled', 'chargeback', 'expired'].includes(row.order_status.toLowerCase())).length;

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
    orderId: row.order_id,
    userId: row.user_id,
    client: String(row.client_name).trim() || row.email,
    email: row.email,
    amount: Number(row.amount_total),
    currency: row.currency,
    plan: String(row.membership_plan ?? 'sin-plan').toLowerCase(),
    createdAt: row.created_at.toISOString(),
    status: row.order_status,
    nextRenewalAt: row.membership_end ? row.membership_end.toISOString() : null,
  }));

  const failedPayments = payments.filter((row) => ['failed', 'cancelled', 'chargeback', 'expired'].includes(row.status.toLowerCase()));

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

  return {
    overview,
    clients,
    memberships,
    payments,
    failedPayments,
    service,
    support,
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
