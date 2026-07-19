import { NextRequest, NextResponse } from "next/server";

import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ALLOWED_STATUS = new Set([
  "new",
  "in_review",
  "info_required",
  "approved_for_contact",
  "rejected",
  "archived",
]);

const STATUS_LABEL: Record<string, string> = {
  new: "Nueva",
  in_review: "En revision",
  info_required: "Informacion requerida",
  approved_for_contact: "Aprobada para contacto",
  rejected: "Rechazada",
  archived: "Archivada",
};

function adminGuard(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function formatApplicationRow(row: {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  company_or_brand: string;
  main_activity: string;
  years_experience: number;
  profile_description: string;
  platforms: unknown;
  links: unknown;
  followers_approx: string;
  primary_countries: string;
  community_type: string;
  motivation: string;
  contribution: string;
  presentation_strategy: string;
  status: string;
  assigned_admin: string | null;
  internal_notes: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    whatsapp: row.whatsapp,
    country: row.country,
    city: row.city,
    companyOrBrand: row.company_or_brand,
    mainActivity: row.main_activity,
    yearsExperience: Number(row.years_experience ?? 0),
    profileDescription: row.profile_description,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    links: Array.isArray(row.links) ? row.links : [],
    followersApprox: row.followers_approx,
    primaryCountries: row.primary_countries,
    communityType: row.community_type,
    motivation: row.motivation,
    contribution: row.contribution,
    presentationStrategy: row.presentation_strategy,
    status: row.status,
    statusLabel: STATUS_LABEL[row.status] ?? row.status,
    assignedAdmin: row.assigned_admin,
    internalNotes: row.internal_notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function sendStatusEmail(input: {
  email: string;
  fullName: string;
  applicationId: string;
  status: string;
  customMessage?: string;
}) {
  const baseUrl = (process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "");
  const sectionUrl = `${baseUrl}/socios-estrategicos`;
  const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "support@carvipix.com";

  const templates: Record<string, { subject: string; html: string; text: string; templateId: string }> = {
    info_required: {
      subject: `Informacion adicional requerida - Solicitud ${input.applicationId}`,
      html: `<p>Estimado/a ${input.fullName},</p><p>Gracias por tu interes en Socios Estrategicos CARVIPIX. Para continuar con la evaluacion necesitamos informacion adicional.</p><p>${input.customMessage || "Nuestro equipo te escribira en breve con el detalle requerido."}</p><p><strong>ID:</strong> ${input.applicationId}</p><p><a href=\"${sectionUrl}\">Socios Estrategicos CARVIPIX</a></p>`,
      text: `Estimado/a ${input.fullName},\nNecesitamos informacion adicional para continuar la evaluacion de tu solicitud.\n${input.customMessage || "Nuestro equipo te contactara en breve."}\nID: ${input.applicationId}\n${sectionUrl}`,
      templateId: "strategic-partner-info-required",
    },
    approved_for_contact: {
      subject: `Solicitud aprobada para contacto - ${input.applicationId}`,
      html: `<p>Estimado/a ${input.fullName},</p><p>Tu perfil fue <strong>aprobado para continuar el proceso de contacto</strong> dentro de Socios Estrategicos CARVIPIX.</p><p>Un representante de CARVIPIX se pondra en contacto contigo para la siguiente etapa.</p><p><strong>ID:</strong> ${input.applicationId}</p><p>La aprobacion de esta etapa no constituye una relacion laboral, societaria ni contractual hasta firma del acuerdo correspondiente.</p>`,
      text: `Estimado/a ${input.fullName},\nTu perfil fue aprobado para contacto. Un representante de CARVIPIX te contactara para la siguiente etapa.\nID: ${input.applicationId}\nLa aprobacion no constituye relacion laboral, societaria, financiera ni contractual hasta firma del acuerdo correspondiente.`,
      templateId: "strategic-partner-approved-contact",
    },
    rejected: {
      subject: `Resultado de evaluacion - ${input.applicationId}`,
      html: `<p>Estimado/a ${input.fullName},</p><p>Agradecemos tu interes en Socios Estrategicos CARVIPIX y el tiempo invertido en tu solicitud.</p><p>En esta etapa, tu perfil no fue seleccionado para continuar el proceso.</p><p>Valoramos tu iniciativa y conservaremos el registro para futuras revisiones internas.</p><p><strong>ID:</strong> ${input.applicationId}</p>`,
      text: `Estimado/a ${input.fullName},\nGracias por tu interes en Socios Estrategicos CARVIPIX. En esta etapa tu perfil no fue seleccionado para continuar.\nID: ${input.applicationId}`,
      templateId: "strategic-partner-not-selected",
    },
  };

  const tpl = templates[input.status];
  if (!tpl) {
    return;
  }

  await emailNotificationService.sendEmail({
    senderRole: "soporte",
    to: { email: input.email, name: input.fullName },
    replyTo: { email: supportEmail, name: "CARVIPIX Relaciones" },
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    headers: {
      "X-CARVIPIX-Template": tpl.templateId,
    },
  }).catch((error) => {
    console.error("[STRATEGIC-PARTNER-STATUS-EMAIL-FAILED]", {
      applicationId: input.applicationId,
      status: input.status,
      email: input.email,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });
}

export async function GET(request: NextRequest) {
  const unauthorized = adminGuard(request);
  if (unauthorized) {
    return unauthorized;
  }

  const [applicationsResult, eventsResult] = await Promise.all([
    backendDatabase.query<{
      id: string;
      full_name: string;
      email: string;
      whatsapp: string;
      country: string;
      city: string;
      company_or_brand: string;
      main_activity: string;
      years_experience: number;
      profile_description: string;
      platforms: unknown;
      links: unknown;
      followers_approx: string;
      primary_countries: string;
      community_type: string;
      motivation: string;
      contribution: string;
      presentation_strategy: string;
      status: string;
      assigned_admin: string | null;
      internal_notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `
      SELECT
        id, full_name, email, whatsapp, country, city, company_or_brand, main_activity,
        years_experience, profile_description, platforms, links, followers_approx,
        primary_countries, community_type, motivation, contribution, presentation_strategy,
        status, assigned_admin, internal_notes, created_at, updated_at
      FROM strategic_partner_applications
      ORDER BY created_at DESC
      `
    ),
    backendDatabase.query<{
      id: string;
      application_id: string;
      actor_type: string;
      action: string;
      note: string | null;
      metadata: unknown;
      created_at: Date;
    }>(
      `
      SELECT id, application_id, actor_type, action, note, metadata, created_at
      FROM strategic_partner_application_events
      ORDER BY created_at DESC
      LIMIT 1200
      `
    ),
  ]);

  const eventsByApplication = new Map<string, Array<{
    id: string;
    actorType: string;
    action: string;
    note: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>>();

  for (const event of eventsResult.rows) {
    const list = eventsByApplication.get(event.application_id) ?? [];
    list.push({
      id: event.id,
      actorType: event.actor_type,
      action: event.action,
      note: event.note,
      metadata: typeof event.metadata === "object" && event.metadata ? (event.metadata as Record<string, unknown>) : {},
      createdAt: new Date(event.created_at).toISOString(),
    });
    eventsByApplication.set(event.application_id, list);
  }

  const applications = applicationsResult.rows.map((row) => ({
    ...formatApplicationRow(row),
    history: eventsByApplication.get(row.id) ?? [],
  }));

  const overview = {
    total: applications.length,
    new: applications.filter((item) => item.status === "new").length,
    inReview: applications.filter((item) => item.status === "in_review").length,
    infoRequired: applications.filter((item) => item.status === "info_required").length,
    approvedForContact: applications.filter((item) => item.status === "approved_for_contact").length,
  };

  return NextResponse.json({ ok: true, data: { overview, applications } }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const unauthorized = adminGuard(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "assign" | "setStatus" | "addNote";
    applicationId?: string;
    assignedAdmin?: string;
    status?: string;
    note?: string;
    notifyMessage?: string;
  };

  const action = String(body.action ?? "").trim();
  const applicationId = String(body.applicationId ?? "").trim();
  if (!applicationId) {
    return NextResponse.json({ ok: false, error: "applicationId es requerido" }, { status: 400 });
  }

  if (action === "assign") {
    const assignedAdmin = String(body.assignedAdmin ?? "admin").trim() || "admin";
    await backendDatabase.query(
      `
      UPDATE strategic_partner_applications
      SET assigned_admin = $2, updated_at = NOW()
      WHERE id = $1
      `,
      [applicationId, assignedAdmin]
    );

    await backendDatabase.query(
      `
      INSERT INTO strategic_partner_application_events (id, application_id, actor_type, action, note, metadata, created_at)
      VALUES ($1, $2, 'admin', 'application_assigned', $3, $4::jsonb, NOW())
      `,
      [createId("spartner-event"), applicationId, `Solicitud asignada a ${assignedAdmin}`, JSON.stringify({ assignedAdmin })]
    ).catch(() => null);

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "addNote") {
    const note = String(body.note ?? "").trim();
    await backendDatabase.query(
      `
      UPDATE strategic_partner_applications
      SET internal_notes = CASE
          WHEN COALESCE(internal_notes, '') = '' THEN $2
          ELSE internal_notes || E'\n\n' || $2
        END,
        updated_at = NOW()
      WHERE id = $1
      `,
      [applicationId, note]
    );

    await backendDatabase.query(
      `
      INSERT INTO strategic_partner_application_events (id, application_id, actor_type, action, note, metadata, created_at)
      VALUES ($1, $2, 'admin', 'internal_note_added', $3, $4::jsonb, NOW())
      `,
      [createId("spartner-event"), applicationId, "Nota interna agregada", JSON.stringify({ note })]
    ).catch(() => null);

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === "setStatus") {
    const status = String(body.status ?? "").trim();
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ ok: false, error: "Estado invalido" }, { status: 400 });
    }

    const updateResult = await backendDatabase.query<{
      id: string;
      email: string;
      full_name: string;
    }>(
      `
      UPDATE strategic_partner_applications
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, full_name
      `,
      [applicationId, status]
    );

    const row = updateResult.rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "Solicitud no encontrada" }, { status: 404 });
    }

    await backendDatabase.query(
      `
      INSERT INTO strategic_partner_application_events (id, application_id, actor_type, action, note, metadata, created_at)
      VALUES ($1, $2, 'admin', 'status_changed', $3, $4::jsonb, NOW())
      `,
      [createId("spartner-event"), applicationId, `Estado actualizado a ${status}`, JSON.stringify({ status })]
    ).catch(() => null);

    await sendStatusEmail({
      email: row.email,
      fullName: row.full_name,
      applicationId,
      status,
      customMessage: String(body.notifyMessage ?? "").trim() || undefined,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "Accion no soportada" }, { status: 400 });
}
