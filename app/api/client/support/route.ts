import { NextRequest, NextResponse } from "next/server";

import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { listSupportTickets } from "@/app/backend/commercial/portal-service";
import { backendDatabase } from "@/app/backend/core/database";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const data = await listSupportTickets(auth.user.id);
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as { subject?: string; category?: string; priority?: string; message?: string };
  const subject = String(body.subject ?? "").trim();
  const category = String(body.category ?? "general").trim();
  const priority = String(body.priority ?? "medium").trim();
  const message = String(body.message ?? "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "subject y message son requeridos" }, { status: 400 });
  }

  const id = createId("ticket");
  await backendDatabase.query(
    `
    INSERT INTO support_tickets (id, user_id, subject, category, status, priority, message, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 'open', $5, $6, NOW(), NOW())
    `,
    [id, auth.user.id, subject, category, priority, message]
  );
  await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "support.ticket.create", resource: id, result: "success" });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}