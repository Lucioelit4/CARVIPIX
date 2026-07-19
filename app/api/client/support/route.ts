import { NextRequest, NextResponse } from "next/server";

import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { listSupportTickets } from "@/app/backend/commercial/portal-service";
import { createLocalSupportTicket } from "@/app/backend/commercial/local-support-store";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function notifyTicketCreated(input: {
  recipientEmail?: string;
  recipientName?: string;
  ticketId: string;
  subject: string;
}) {
  if (!input.recipientEmail) {
    return;
  }

  const dashboardUrl = `${(process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "")}/dashboard`;
  await emailNotificationService.sendEmail({
    senderRole: "soporte",
    to: { email: input.recipientEmail, name: input.recipientName || input.recipientEmail },
    replyTo: { email: process.env.EMAIL_SUPPORT_ADDRESS || "support@carvipix.com", name: "CARVIPIX Soporte" },
    subject: `Recibimos tu ticket ${input.ticketId}`,
    html: `<p>Tu ticket de soporte fue registrado correctamente.</p><p><strong>Asunto:</strong> ${input.subject}</p><p><strong>ID:</strong> ${input.ticketId}</p><p>Puedes revisar futuras respuestas desde tu panel.</p><p><a href="${dashboardUrl}">Abrir dashboard</a></p>`,
    text: `Tu ticket de soporte fue registrado correctamente. Asunto: ${input.subject}. ID: ${input.ticketId}. Revisa futuras respuestas en tu dashboard: ${dashboardUrl}`,
    headers: {
      "X-CARVIPIX-Template": "support-ticket-created",
    },
  }).catch(() => null);
}

async function ensureSupportSchema() {
  if (!backendDatabase.enabled) {
    return;
  }

  try {
    await backendDatabase.query(
      `
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        message TEXT NOT NULL,
        admin_reply TEXT,
        responsible TEXT,
        conversation_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `
    );

    await backendDatabase.query(
      `
      ALTER TABLE support_tickets
      ADD COLUMN IF NOT EXISTS responsible TEXT
      `
    );

    await backendDatabase.query(
      `
      ALTER TABLE support_tickets
      ADD COLUMN IF NOT EXISTS conversation_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb
      `
    );

    await backendDatabase.query(
      `
      ALTER TABLE support_tickets
      DROP CONSTRAINT IF EXISTS support_tickets_status_check
      `
    );

    await backendDatabase.query(
      `
      ALTER TABLE support_tickets
      ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'pending_customer', 'resolved', 'closed'))
      `
    );

    await backendDatabase.query(
      `
      CREATE TABLE IF NOT EXISTS support_ticket_events (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        action TEXT NOT NULL,
        note TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `
    );
  } catch {
    // Best effort: continue without schema bootstrap.
  }
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

  const body = (await request.json().catch(() => ({}))) as {
    subject?: string;
    category?: string;
    priority?: string;
    message?: string;
    conversation?: Array<{ role?: string; content?: string }>;
  };
  const subject = String(body.subject ?? "").trim();
  const category = String(body.category ?? "general").trim();
  const priority = String(body.priority ?? "medium").trim();
  const message = String(body.message ?? "").trim();
  const conversation = Array.isArray(body.conversation)
    ? body.conversation
        .map((item) => ({
          role: String(item.role ?? "user").slice(0, 20),
          content: String(item.content ?? "").slice(0, 1200),
        }))
        .slice(-20)
    : [];

  if (!subject || !message) {
    return NextResponse.json({ error: "subject y message son requeridos" }, { status: 400 });
  }

  let id = createId("ticket");
  let storedIn = "db";

  if (backendDatabase.enabled) {
    await ensureSupportSchema();

    try {
      await backendDatabase.query(
        `
        INSERT INTO support_tickets (
          id,
          user_id,
          subject,
          category,
          status,
          priority,
          message,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'open', $5, $6, NOW(), NOW())
        `,
        [id, auth.user.id, subject, category, priority, message]
      );

      try {
        await backendDatabase.query(
          `
          INSERT INTO support_ticket_events (id, ticket_id, actor_type, action, note, metadata, created_at)
          VALUES ($1, $2, 'client', 'ticket_created_manual', $3, $4::jsonb, NOW())
          `,
          [createId("ticket-event"), id, "Ticket creado por cliente", JSON.stringify({ category, priority })]
        );
      } catch {
        // Ticket already persisted; event is optional.
      }
    } catch {
      try {
        // If event insertion fails, keep ticket persistence in DB as best effort.
        await backendDatabase.query(
          `
          INSERT INTO support_tickets (
            id,
            user_id,
            subject,
            category,
            status,
            priority,
            message,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, 'open', $5, $6, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
          `,
          [id, auth.user.id, subject, category, priority, message]
        );
      } catch {
        storedIn = "fallback";
        try {
          const localTicket = await createLocalSupportTicket({
            userId: auth.user.id,
            subject,
            category,
            priority,
            message,
            conversationSnapshot: conversation,
            responsible: "support-admin-queue",
          });
          id = localTicket.id;
        } catch {
          id = createId("ticket-fallback");
        }
      }
    }
  } else {
    storedIn = "fallback";
    const localTicket = await createLocalSupportTicket({
      userId: auth.user.id,
      subject,
      category,
      priority,
      message,
      conversationSnapshot: conversation,
      responsible: "support-admin-queue",
    });
    id = localTicket.id;
  }

  await recordCommercialAuditEvent({
    userId: auth.user.id,
    actorType: "client",
    action: "support.ticket.create",
    resource: id,
    result: "success",
    metadata: {
      subject,
      category,
      priority,
      message,
      fallback: storedIn !== "db" || id.startsWith("ticket-fallback"),
      storage: storedIn,
    },
  });

  await notifyTicketCreated({
    recipientEmail: auth.user.email,
    recipientName: [auth.user.nombre, auth.user.apellido].filter(Boolean).join(" ").trim() || auth.user.email,
    ticketId: id,
    subject,
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}