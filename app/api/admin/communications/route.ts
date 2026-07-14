import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { listCommercialAuditEvents, recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { backendDatabase } from "@/app/backend/core/database";
import { getEmailNotificationConfig, hasValidResendCredentials, hasValidSmtpCredentials } from "@/app/backend/notifications/config";
import { emailNotificationService } from "@/app/backend/notifications";
import { COMMUNICATION_EMAIL_COPY_CATALOG } from "@/app/backend/notifications/email-copy-catalog";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

type OutboxStatus = {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
};

function randomToken(): string {
  return randomBytes(24).toString("hex");
}

async function readOutboxStatus(): Promise<OutboxStatus> {
  if (!backendDatabase.enabled) {
    return { pending: 0, processing: 0, processed: 0, failed: 0 };
  }

  const result = await backendDatabase.query<{
    status: string;
    total: string;
  }>(
    `
    SELECT status, COUNT(*)::text AS total
    FROM payment_outbox_events
    WHERE event_name = 'email.transactional.requested'
    GROUP BY status
    `
  );

  const base: OutboxStatus = { pending: 0, processing: 0, processed: 0, failed: 0 };
  for (const row of result.rows) {
    const key = String(row.status) as keyof OutboxStatus;
    if (key in base) {
      base[key] = Number(row.total ?? "0");
    }
  }

  return base;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emailConfig = getEmailNotificationConfig();
    const smtpReady = hasValidSmtpCredentials(emailConfig);
    const resendReady = hasValidResendCredentials(emailConfig);
    const outboxStatus = await readOutboxStatus();
    const audit = await listCommercialAuditEvents(300);

    const communicationEvents = audit.filter(
      (item) => item.action.startsWith("communications.email.") || item.action === "campaign.promotion.send"
    );

    const metrics = {
      sent: communicationEvents.filter((item) => item.action === "communications.email.sent").length,
      failed: communicationEvents.filter((item) => item.action === "communications.email.failed").length,
      noop: communicationEvents.filter((item) => item.action === "communications.email.noop").length,
      campaigns: communicationEvents.filter((item) => item.action === "campaign.promotion.send").length,
      queuedPending: outboxStatus.pending,
      queuedProcessing: outboxStatus.processing,
      queuedFailed: outboxStatus.failed,
    };

    return NextResponse.json(
      {
        ok: true,
        data: {
          transport: {
            mode: emailConfig.transport,
            smtpReady,
            resendReady,
            fromName: emailConfig.fromName,
            appPublicUrl: emailConfig.appPublicUrl,
            addresses: emailConfig.addresses,
          },
          metrics,
          outboxStatus,
          recentEvents: communicationEvents.slice(0, 80),
          templates: COMMUNICATION_EMAIL_COPY_CATALOG,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo cargar el centro de comunicaciones",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "retryOutboxEmail" | "sendTestEmail";
      outboxEventId?: string;
      recipientEmail?: string;
      template?: "welcome" | "password-reset" | "promotion" | "identity-received" | "identity-approved" | "identity-rejected" | "identity-new-document";
    };

    if (body.action === "retryOutboxEmail") {
      if (!backendDatabase.enabled) {
        return NextResponse.json({ ok: false, error: "DATABASE_URL no configurado" }, { status: 409 });
      }

      const eventId = String(body.outboxEventId ?? "").trim();
      if (!eventId) {
        return NextResponse.json({ ok: false, error: "outboxEventId requerido" }, { status: 400 });
      }

      const update = await backendDatabase.query<{ id: string }>(
        `
        UPDATE payment_outbox_events
        SET status = 'pending',
            available_at = NOW(),
            last_error = NULL,
            processed_at = NULL
        WHERE id = $1
          AND event_name = 'email.transactional.requested'
          AND status = 'failed'
        RETURNING id
        `,
        [eventId]
      );

      if (!update.rows[0]) {
        return NextResponse.json({ ok: false, error: "No se encontro un outbox fallido para reintentar" }, { status: 404 });
      }

      await recordCommercialAuditEvent({
        actorType: "admin",
        action: "communications.email.retry",
        resource: eventId,
        result: "success",
      });

      return NextResponse.json({ ok: true, message: "Evento encolado para reintento" }, { status: 200 });
    }

    if (body.action === "sendTestEmail") {
      const recipientEmail = String(body.recipientEmail ?? "").trim().toLowerCase();
      const template = String(body.template ?? "welcome").trim().toLowerCase();

      if (!recipientEmail) {
        return NextResponse.json({ ok: false, error: "recipientEmail requerido" }, { status: 400 });
      }

      if (template === "password-reset") {
        const result = await emailNotificationService.sendPasswordReset({
          recipientEmail,
          recipientName: "Admin QA",
          resetToken: randomToken(),
        });

        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      if (template === "promotion") {
        const result = await emailNotificationService.sendPromotionCampaign({
          recipientEmail,
          recipientName: "Admin QA",
          campaignName: "test-campaign",
          headline: "Prueba de campana CARVIPIX",
          body: "Este es un correo de prueba del centro de comunicaciones.",
          ctaLabel: "Abrir plataforma",
          ctaUrl: `${getEmailNotificationConfig().appPublicUrl.replace(/\/$/, "")}/dashboard`,
          unsubscribeUrl: `${getEmailNotificationConfig().appPublicUrl.replace(/\/$/, "")}/perfil/notificaciones`,
        });

        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      if (template === "identity-received") {
        const result = await emailNotificationService.sendIdentityVerificationReceived({
          recipientEmail,
          recipientName: "Admin QA",
        });
        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      if (template === "identity-approved") {
        const result = await emailNotificationService.sendIdentityVerificationApproved({
          recipientEmail,
          recipientName: "Admin QA",
        });
        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      if (template === "identity-rejected") {
        const result = await emailNotificationService.sendIdentityVerificationRejected({
          recipientEmail,
          recipientName: "Admin QA",
          reason: "Documento ilegible",
        });
        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      if (template === "identity-new-document") {
        const result = await emailNotificationService.sendIdentityVerificationNewDocumentRequest({
          recipientEmail,
          recipientName: "Admin QA",
          reason: "Necesitamos una nueva fotografia",
        });
        return NextResponse.json({ ok: true, result }, { status: 200 });
      }

      const result = await emailNotificationService.sendWelcomeRegistration({
        recipientEmail,
        recipientName: "Admin QA",
        verificationToken: randomToken(),
      });

      return NextResponse.json({ ok: true, result }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo ejecutar la accion",
      },
      { status: 500 }
    );
  }
}
