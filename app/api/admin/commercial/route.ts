import { NextRequest, NextResponse } from "next/server";

import { listCommercialAuditEvents, recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { listPlanEntitlements, updatePlanEntitlements } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [usersResult, capitalRequests, supportTickets, audit, entitlements] = await Promise.all([
    backendDatabase.query<{
      id: string;
      email: string;
      nombre: string;
      apellido: string;
      plan: string;
      estado: string;
      verificado: boolean;
      created_at: Date | null;
      membership_estado: string | null;
      membership_plan: string | null;
      exclude_from_commercial_metrics: boolean;
      user_type: string | null;
    }>(
      `
      SELECT u.id, u.email, u.nombre, u.apellido, u.plan, u.estado, u.verificado, u.created_at, m.estado AS membership_estado, m.plan AS membership_plan, COALESCE(u.exclude_from_commercial_metrics, false) AS exclude_from_commercial_metrics, u.user_type
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
      ORDER BY u.created_at DESC NULLS LAST, u.id DESC
      `
    ),
    backendDatabase.query<{
      id: string;
      user_id: string;
      target_capital: number;
      status: string;
      risk_profile: string;
      notes: string | null;
      contract_signed: boolean;
      admin_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT id, user_id, target_capital, status, risk_profile, notes, contract_signed, admin_notes, created_at, updated_at FROM capital_requests ORDER BY created_at DESC`),
    backendDatabase.query<{
      id: string;
      user_id: string;
      subject: string;
      category: string;
      status: string;
      priority: string;
      message: string;
      admin_reply: string | null;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT id, user_id, subject, category, status, priority, message, admin_reply, created_at, updated_at FROM support_tickets ORDER BY created_at DESC`),
    listCommercialAuditEvents(50),
    listPlanEntitlements(),
  ]);

  const users = usersResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: `${row.nombre} ${row.apellido}`.trim(),
    officialPlan: row.membership_plan ?? row.plan,
    status: row.estado,
    membershipStatus: row.membership_estado ?? "inactivo",
    verified: row.verificado,
    registeredAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    excludedFromCommercialMetrics: row.exclude_from_commercial_metrics,
    userType: row.user_type ?? "STANDARD",
  }));

  const commercialUsers = users.filter((user) => !user.excludedFromCommercialMetrics);

  return NextResponse.json(
    {
      ok: true,
      data: {
        overview: {
          users: commercialUsers.length,
          activeMemberships: commercialUsers.filter((user) => user.membershipStatus === "activo").length,
          pendingCapitalRequests: capitalRequests.rows.filter((row) => row.status === "pending").length,
          openTickets: supportTickets.rows.filter((row) => row.status === "open" || row.status === "in_progress").length,
          blockedAttempts: audit.filter((row) => row.result === "denied").length,
        },
        users,
        capitalRequests: capitalRequests.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          targetCapital: Number(row.target_capital),
          status: row.status,
          riskProfile: row.risk_profile,
          notes: row.notes,
          contractSigned: row.contract_signed,
          adminNotes: row.admin_notes,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        })),
        supportTickets: supportTickets.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          subject: row.subject,
          category: row.category,
          status: row.status,
          priority: row.priority,
          message: row.message,
          adminReply: row.admin_reply,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        })),
        entitlements,
        audit,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();

  if (action === "updateCapitalRequest") {
    const requestId = String(body.requestId ?? "").trim();
    const status = String(body.status ?? "pending").trim();
    const adminNotes = String(body.adminNotes ?? "").trim();
    await backendDatabase.query(
      `
      UPDATE capital_requests
      SET status = $2, admin_notes = $3, contract_signed = CASE WHEN $2 = 'contract_signed' THEN true ELSE contract_signed END, updated_at = NOW(), accepted_at = CASE WHEN $2 = 'accepted' THEN NOW() ELSE accepted_at END, rejected_at = CASE WHEN $2 = 'rejected' THEN NOW() ELSE rejected_at END
      WHERE id = $1
      `,
      [requestId, status, adminNotes]
    );
    await recordCommercialAuditEvent({ actorType: "admin", action: "capital.request.update", resource: requestId, result: "success", metadata: { status } });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "updateSupportTicket") {
    const ticketId = String(body.ticketId ?? "").trim();
    const status = String(body.status ?? "open").trim();
    const adminReply = String(body.adminReply ?? "").trim();
    await backendDatabase.query(
      `
      UPDATE support_tickets
      SET status = $2, admin_reply = $3, updated_at = NOW()
      WHERE id = $1
      `,
      [ticketId, status, adminReply]
    );
    await recordCommercialAuditEvent({ actorType: "admin", action: "support.ticket.update", resource: ticketId, result: "success", metadata: { status } });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "updateEntitlements") {
    await updatePlanEntitlements(body.plan as never, body.patch as never);
    await recordCommercialAuditEvent({ actorType: "admin", action: "entitlements.update", resource: String(body.plan ?? "unknown"), result: "success" });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}