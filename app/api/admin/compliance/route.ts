import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import {
  appendAdminAuditLog,
  listComplianceAuditLogs,
  listLegalDocuments,
  listVideos,
  saveLegalDocuments,
  saveVideos,
} from "@/app/backend/compliance/compliance-service";
import { latestActiveLegalDocuments, type LegalDocument, type MultimediaVideo } from "@/app/lib/legal/compliance-catalog";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

function extractActor(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";
  return `admin@${ip}`;
}

async function buildPayload() {
  const [documents, videos, auditLogs] = await Promise.all([listLegalDocuments(), listVideos(), listComplianceAuditLogs(120)]);

  return {
    generatedAt: new Date().toISOString(),
    legalDocuments: documents,
    latestActiveLegalDocuments: latestActiveLegalDocuments(documents),
    videos,
    auditLogs,
    domains: [
      "FAQ",
      "Agente AI",
      "Comunidad y Moderacion",
      "Videos Multimedia",
      "Documentos Legales",
      "Soporte y Tickets",
      "Configuracion del Sistema",
    ],
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, data: await buildPayload() }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar el modulo de cumplimiento" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "save-legal-documents" | "save-videos";
    legalDocuments?: LegalDocument[];
    videos?: MultimediaVideo[];
  };

  try {
    const action = String(body.action ?? "").trim();
    const actorId = extractActor(request);

    if (action === "save-legal-documents") {
      const legalDocuments = Array.isArray(body.legalDocuments) ? body.legalDocuments : [];
      const saved = await saveLegalDocuments(legalDocuments);
      await appendAdminAuditLog({
        actorId,
        action,
        resource: "compliance:legal-documents",
        metadata: { total: saved.length },
      });
      return NextResponse.json({ ok: true, data: await buildPayload() }, { status: 200 });
    }

    if (action === "save-videos") {
      const videos = Array.isArray(body.videos) ? body.videos : [];
      const saved = await saveVideos(videos);
      await appendAdminAuditLog({
        actorId,
        action,
        resource: "compliance:videos",
        metadata: { total: saved.length },
      });
      return NextResponse.json({ ok: true, data: await buildPayload() }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el modulo de cumplimiento" }, { status: 500 });
  }
}
