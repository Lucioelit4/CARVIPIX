import { NextRequest, NextResponse } from "next/server";

import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type StrategicPartnerSubmission = {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  companyOrBrand?: string;
  mainActivity?: string;
  yearsExperience?: number;
  profileDescription?: string;
  platforms?: string[];
  links?: string[];
  followersApprox?: string;
  primaryCountries?: string;
  communityType?: string;
  motivation?: string;
  contribution?: string;
  presentationStrategy?: string;
  confirmTrueInfo?: boolean;
  confirmPrivacy?: boolean;
  confirmNonGuarantee?: boolean;
  confirmContactAuth?: boolean;
  legalDisclaimerAck?: boolean;
  legalNonContractAck?: boolean;
};

function cleanText(value: unknown, max = 2000): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanList(value: unknown, maxItems = 8, maxItemLength = 180): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanText(item, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderReceivedEmailHtml(input: { fullName: string; applicationId: string; dashboardUrl: string }) {
  return [
    `<p>Estimado/a ${input.fullName},</p>`,
    "<p>Hemos recibido correctamente tu solicitud para <strong>Socios Estrategicos CARVIPIX</strong>.</p>",
    "<p>Tu perfil entrara en un proceso de evaluacion interna. Si necesitamos informacion adicional, te contactaremos por correo o WhatsApp.</p>",
    `<p><strong>ID de solicitud:</strong> ${input.applicationId}</p>`,
    `<p>Referencia de seguimiento: <a href=\"${input.dashboardUrl}\">${input.dashboardUrl}</a></p>`,
    "<p>CARVIPIX se reserva el derecho de aceptar o rechazar cualquier solicitud, sin obligacion de expresar las razones de su decision.</p>",
    "<p>La aprobacion de una solicitud no constituye una relacion laboral, societaria, financiera ni contractual hasta la firma del acuerdo correspondiente.</p>",
  ].join("");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as StrategicPartnerSubmission;

  const fullName = cleanText(body.fullName, 120);
  const email = cleanText(body.email, 180).toLowerCase();
  const whatsapp = cleanText(body.whatsapp, 50);
  const country = cleanText(body.country, 80);
  const city = cleanText(body.city, 80);
  const companyOrBrand = cleanText(body.companyOrBrand, 160);
  const mainActivity = cleanText(body.mainActivity, 160);
  const yearsExperience = Number(body.yearsExperience ?? 0);
  const profileDescription = cleanText(body.profileDescription, 3000);
  const platforms = cleanList(body.platforms, 10, 80);
  const links = cleanList(body.links, 10, 240);
  const followersApprox = cleanText(body.followersApprox, 120);
  const primaryCountries = cleanText(body.primaryCountries, 240);
  const communityType = cleanText(body.communityType, 200);
  const motivation = cleanText(body.motivation, 3000);
  const contribution = cleanText(body.contribution, 3000);
  const presentationStrategy = cleanText(body.presentationStrategy, 3000);

  const confirmTrueInfo = body.confirmTrueInfo === true;
  const confirmPrivacy = body.confirmPrivacy === true;
  const confirmNonGuarantee = body.confirmNonGuarantee === true;
  const confirmContactAuth = body.confirmContactAuth === true;
  const legalDisclaimerAck = body.legalDisclaimerAck === true;
  const legalNonContractAck = body.legalNonContractAck === true;

  if (!fullName || !email || !whatsapp || !country || !city) {
    return NextResponse.json({ error: "Faltan datos personales obligatorios" }, { status: 400 });
  }

  if (!companyOrBrand || !mainActivity || !profileDescription) {
    return NextResponse.json({ error: "Faltan datos del perfil profesional" }, { status: 400 });
  }

  if (!followersApprox || !primaryCountries || !communityType) {
    return NextResponse.json({ error: "Faltan datos de comunidad" }, { status: 400 });
  }

  if (!motivation || !contribution || !presentationStrategy) {
    return NextResponse.json({ error: "Faltan respuestas de evaluacion" }, { status: 400 });
  }

  if (!confirmTrueInfo || !confirmPrivacy || !confirmNonGuarantee || !confirmContactAuth || !legalDisclaimerAck || !legalNonContractAck) {
    return NextResponse.json({ error: "Debes aceptar todas las confirmaciones y clausulas" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Correo invalido" }, { status: 400 });
  }

  const applicationId = createId("spartner");

  await backendDatabase.query(
    `
    INSERT INTO strategic_partner_applications (
      id,
      full_name,
      email,
      whatsapp,
      country,
      city,
      company_or_brand,
      main_activity,
      years_experience,
      profile_description,
      platforms,
      links,
      followers_approx,
      primary_countries,
      community_type,
      motivation,
      contribution,
      presentation_strategy,
      confirm_true_info,
      confirm_privacy,
      confirm_non_guarantee,
      confirm_contact_auth,
      legal_disclaimer_ack,
      legal_non_contract_ack,
      status,
      created_at,
      updated_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,'new',NOW(),NOW()
    )
    `,
    [
      applicationId,
      fullName,
      email,
      whatsapp,
      country,
      city,
      companyOrBrand,
      mainActivity,
      Math.max(0, Math.floor(yearsExperience)),
      profileDescription,
      JSON.stringify(platforms),
      JSON.stringify(links),
      followersApprox,
      primaryCountries,
      communityType,
      motivation,
      contribution,
      presentationStrategy,
      confirmTrueInfo,
      confirmPrivacy,
      confirmNonGuarantee,
      confirmContactAuth,
      legalDisclaimerAck,
      legalNonContractAck,
    ]
  );

  await backendDatabase.query(
    `
    INSERT INTO strategic_partner_application_events (id, application_id, actor_type, action, note, metadata, created_at)
    VALUES ($1, $2, 'applicant', 'application_submitted', $3, $4::jsonb, NOW())
    `,
    [createId("spartner-event"), applicationId, "Solicitud registrada desde formulario publico", JSON.stringify({ email, country, city })]
  ).catch(() => null);

  await recordCommercialAuditEvent({
    actorType: "client",
    action: "strategic_partner.application.create",
    resource: applicationId,
    result: "success",
    metadata: {
      email,
      country,
      city,
      companyOrBrand,
    },
  }).catch(() => null);

  const appPublicUrl = (process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "");
  const dashboardUrl = `${appPublicUrl}/socios-estrategicos`;

  await emailNotificationService.sendEmail({
    senderRole: "soporte",
    to: { email, name: fullName },
    replyTo: { email: process.env.EMAIL_SUPPORT_ADDRESS || "support@carvipix.com", name: "CARVIPIX Relaciones" },
    subject: `Solicitud recibida - Socios Estrategicos CARVIPIX (${applicationId})`,
    html: renderReceivedEmailHtml({ fullName, applicationId, dashboardUrl }),
    text: [
      `Estimado/a ${fullName},`,
      "Hemos recibido correctamente tu solicitud para Socios Estrategicos CARVIPIX.",
      `ID de solicitud: ${applicationId}`,
      "Tu perfil sera evaluado por el equipo interno.",
      "CARVIPIX se reserva el derecho de aceptar o rechazar cualquier solicitud sin obligacion de justificar su decision.",
      "La aprobacion no constituye relacion laboral, societaria, financiera ni contractual hasta firma del acuerdo correspondiente.",
      `Referencia: ${dashboardUrl}`,
    ].join("\n"),
    headers: {
      "X-CARVIPIX-Template": "strategic-partner-submitted",
    },
  }).catch((error) => {
    console.error("[STRATEGIC-PARTNER-EMAIL-SUBMITTED-FAILED]", {
      applicationId,
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  return NextResponse.json({ ok: true, id: applicationId }, { status: 201 });
}
