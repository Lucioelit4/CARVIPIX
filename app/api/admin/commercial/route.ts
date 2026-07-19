import { NextRequest, NextResponse } from "next/server";

import { listCommercialAuditEvents, recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { listAllLocalSupportTickets, updateLocalSupportTicket } from "@/app/backend/commercial/local-support-store";
import { listPlanEntitlements, updatePlanEntitlements } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function notifySupportTicketUpdated(input: {
  recipientEmail: string;
  recipientName: string;
  ticketId: string;
  status: string;
  adminReply: string;
}) {
  const dashboardUrl = `${(process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "")}/dashboard`;
  const templateId = input.status === "resolved" || input.status === "closed" ? "support-ticket-closed" : "support-ticket-replied";
  const subject = templateId === "support-ticket-closed"
    ? `Tu ticket ${input.ticketId} fue cerrado`
    : `Tu ticket ${input.ticketId} tiene una respuesta`;
  const body = templateId === "support-ticket-closed"
    ? `<p>Tu caso fue marcado como ${input.status}.</p>`
    : `<p>El equipo de soporte agrego una respuesta a tu ticket.</p><p>${input.adminReply}</p>`;

  await emailNotificationService.sendEmail({
    senderRole: "soporte",
    to: { email: input.recipientEmail, name: input.recipientName || input.recipientEmail },
    replyTo: { email: process.env.EMAIL_SUPPORT_ADDRESS || "support@carvipix.com", name: "CARVIPIX Soporte" },
    subject,
    html: `${body}<p><strong>ID:</strong> ${input.ticketId}</p><p><a href="${dashboardUrl}">Abrir dashboard</a></p>`,
    text: `${templateId === "support-ticket-closed" ? `Tu ticket fue marcado como ${input.status}.` : `Tu ticket tiene una respuesta: ${input.adminReply}`}\nID: ${input.ticketId}\nDashboard: ${dashboardUrl}`,
    headers: {
      "X-CARVIPIX-Template": templateId,
    },
  }).catch(() => null);
}

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [usersResult, strategicPartnerRequests, supportTickets, localSupportTickets, audit, entitlements] = await Promise.all([
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
      full_name: string;
      email: string;
      whatsapp: string;
      country: string;
      company_or_brand: string;
      platforms: unknown;
      followers_approx: string;
      status: string;
      internal_notes: string | null;
      assigned_admin: string | null;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT id, full_name, email, whatsapp, country, company_or_brand, platforms, followers_approx, status, internal_notes, assigned_admin, created_at, updated_at FROM strategic_partner_applications ORDER BY created_at DESC`),
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
    listAllLocalSupportTickets(),
    listCommercialAuditEvents(50),
    listPlanEntitlements(),
  ]);

  const mergedSupportTickets = new Map(
    supportTickets.rows.map((row) => [
      row.id,
      {
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
      },
    ])
  );

  for (const localTicket of localSupportTickets) {
    if (!mergedSupportTickets.has(localTicket.id)) {
      mergedSupportTickets.set(localTicket.id, {
        id: localTicket.id,
        userId: localTicket.userId,
        subject: localTicket.subject,
        category: localTicket.category,
        status: localTicket.status,
        priority: localTicket.priority,
        message: localTicket.message,
        adminReply: localTicket.adminReply,
        createdAt: localTicket.createdAt,
        updatedAt: localTicket.updatedAt,
      });
    }
  }

  for (const event of audit) {
    if (event.action !== "support.ticket.create") {
      continue;
    }

    if (!mergedSupportTickets.has(event.resource)) {
      mergedSupportTickets.set(event.resource, {
        id: event.resource,
        userId: event.userId ?? "unknown",
        subject: String(event.metadata?.subject ?? "Ticket de soporte"),
        category: String(event.metadata?.category ?? "general"),
        status: "open",
        priority: String(event.metadata?.priority ?? "medium"),
        message: String(event.metadata?.message ?? "Ticket registrado en cola de soporte"),
        adminReply: null,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
      });
    }
  }

  const supportTicketList = Array.from(mergedSupportTickets.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );

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
          pendingStrategicPartnerRequests: strategicPartnerRequests.rows.filter((row) => row.status === "new").length,
          openTickets: supportTicketList.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length,
          blockedAttempts: audit.filter((row) => row.result === "denied").length,
        },
        users,
        strategicPartnerRequests: strategicPartnerRequests.rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          whatsapp: row.whatsapp,
          country: row.country,
          companyOrBrand: row.company_or_brand,
          platforms: Array.isArray(row.platforms) ? row.platforms : [],
          followersApprox: row.followers_approx,
          status: row.status,
          internalNotes: row.internal_notes,
          assignedAdmin: row.assigned_admin,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        })),
        supportTickets: supportTicketList,
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

  if (action === "updateStrategicPartnerRequest") {
    const requestId = String(body.requestId ?? "").trim();
    const status = String(body.status ?? "new").trim();
    const adminNotes = String(body.adminNotes ?? "").trim();
    await backendDatabase.query(
      `
      UPDATE strategic_partner_applications
      SET status = $2, internal_notes = $3, updated_at = NOW()
      WHERE id = $1
      `,
      [requestId, status, adminNotes]
    );
    await recordCommercialAuditEvent({ actorType: "admin", action: "strategic_partner.request.update", resource: requestId, result: "success", metadata: { status } });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "updateSupportTicket") {
    const ticketId = String(body.ticketId ?? "").trim();
    const status = String(body.status ?? "open").trim();
    const adminReply = String(body.adminReply ?? "").trim();

    if (!ticketId) {
      return NextResponse.json({ ok: false, error: "ticketId es requerido" }, { status: 400 });
    }

    const allowedStatus = new Set(["open", "in_progress", "pending_customer", "resolved", "closed"]);
    if (!allowedStatus.has(status)) {
      return NextResponse.json({ ok: false, error: "status invalido" }, { status: 400 });
    }

    let dbUpdated = 0;
    let recipientEmail = "";
    let recipientName = "";
    if (backendDatabase.enabled) {
      const result = await backendDatabase.query(
        `
        UPDATE support_tickets
        SET status = $2, admin_reply = $3, updated_at = NOW()
        WHERE id = $1
        `,
        [ticketId, status, adminReply]
      );
      dbUpdated = result.rowCount ?? 0;

      if (dbUpdated > 0) {
        const recipientResult = await backendDatabase.query<{
          email: string;
          nombre: string | null;
          apellido: string | null;
        }>(
          `
          SELECT u.email, u.nombre, u.apellido
          FROM support_tickets st
          INNER JOIN users u ON u.id = st.user_id
          WHERE st.id = $1
          LIMIT 1
          `,
          [ticketId]
        ).catch(() => ({ rows: [] as Array<{ email: string; nombre: string | null; apellido: string | null }> }));

        recipientEmail = recipientResult.rows[0]?.email ?? "";
        recipientName = `${recipientResult.rows[0]?.nombre ?? ""} ${recipientResult.rows[0]?.apellido ?? ""}`.trim();

        await backendDatabase.query(
          `
          INSERT INTO support_ticket_events (id, ticket_id, actor_type, action, note, metadata, created_at)
          VALUES ($1, $2, 'admin', 'ticket_updated', $3, $4::jsonb, NOW())
          `,
          [
            createId("ticket-event"),
            ticketId,
            adminReply ? "Respuesta administrativa registrada" : "Estado actualizado",
            JSON.stringify({ status }),
          ]
        ).catch(() => null);
      }
    }

    let localUpdated = false;
    if (dbUpdated === 0) {
      const updatedLocalTicket = await updateLocalSupportTicket({
        ticketId,
        status,
        adminReply,
      });
      localUpdated = Boolean(updatedLocalTicket);
    }

    if (dbUpdated === 0 && !localUpdated) {
      return NextResponse.json({ ok: false, error: "Ticket no encontrado" }, { status: 404 });
    }

    await recordCommercialAuditEvent({
      actorType: "admin",
      action: "support.ticket.update",
      resource: ticketId,
      result: "success",
      metadata: { status, storage: dbUpdated > 0 ? "db" : "fallback" },
    });

    if (dbUpdated > 0 && recipientEmail) {
      await notifySupportTicketUpdated({
        recipientEmail,
        recipientName: recipientName || recipientEmail,
        ticketId,
        status,
        adminReply,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "updateEntitlements") {
    await updatePlanEntitlements(body.plan as never, body.patch as never);
    await recordCommercialAuditEvent({ actorType: "admin", action: "entitlements.update", resource: String(body.plan ?? "unknown"), result: "success" });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "sendPromotionCampaign") {
    const campaignName = String(body.campaignName ?? "Campana comercial").trim();
    const headline = String(body.headline ?? "").trim();
    const campaignBody = String(body.body ?? "").trim();
    const ctaLabel = String(body.ctaLabel ?? "").trim();
    const ctaUrl = String(body.ctaUrl ?? "").trim();
    const recipientIds = Array.isArray(body.recipientIds)
      ? body.recipientIds.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!headline || !campaignBody) {
      return NextResponse.json({ ok: false, error: "Headline y body son requeridos" }, { status: 400 });
    }

    const recipientsResult = recipientIds.length > 0
      ? await backendDatabase.query<{
          id: string;
          email: string;
          nombre: string;
        }>(
          `
          SELECT u.id, u.email, u.nombre
          FROM users u
          WHERE u.id = ANY($1::text[])
            AND u.verificado = true
            AND COALESCE(u.exclude_from_commercial_metrics, false) = false
          `,
          [recipientIds]
        )
      : await backendDatabase.query<{
          id: string;
          email: string;
          nombre: string;
        }>(
          `
          SELECT u.id, u.email, u.nombre
          FROM users u
          LEFT JOIN memberships m ON m.user_id = u.id
          WHERE u.verificado = true
            AND COALESCE(u.exclude_from_commercial_metrics, false) = false
            AND COALESCE(m.estado, 'inactivo') = 'activo'
          ORDER BY u.created_at DESC NULLS LAST
          LIMIT 5000
          `
        );

    const appPublicUrl = process.env.APP_PUBLIC_URL?.trim() || "http://localhost:3000";

    const sendResults = await Promise.allSettled(
      recipientsResult.rows.map((recipient) =>
        emailNotificationService.sendPromotionCampaign({
          recipientEmail: recipient.email,
          recipientName: recipient.nombre || recipient.email,
          campaignName,
          headline,
          body: campaignBody,
          ctaLabel: ctaLabel || undefined,
          ctaUrl: ctaUrl || undefined,
          unsubscribeUrl: `${appPublicUrl.replace(/\/$/, "")}/perfil/notificaciones`,
        })
      )
    );

    const sent = sendResults.filter(
      (result) => result.status === "fulfilled" && result.value.accepted && result.value.provider === "smtp"
    ).length;
    const failed = sendResults.length - sent;

    await recordCommercialAuditEvent({
      actorType: "admin",
      action: "campaign.promotion.send",
      resource: campaignName,
      result: failed > 0 ? "error" : "success",
      metadata: { recipients: sendResults.length, sent, failed },
    });

    return NextResponse.json(
      {
        ok: true,
        campaignName,
        recipients: sendResults.length,
        sent,
        failed,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}