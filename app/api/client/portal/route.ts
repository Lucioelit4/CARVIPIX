import { NextRequest, NextResponse } from "next/server";

import { buildClientPortalSnapshot } from "@/app/backend/commercial/portal-service";
import { requireClientSession } from "@/app/api/client/_auth";

function normalizeOrigin(raw: string | undefined): "REAL" | "SANDBOX" | "DEMO" | "MOCK" {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "REAL" || value === "SANDBOX" || value === "DEMO" || value === "MOCK") {
    return value;
  }
  if (value === "PLACEHOLDER" || value === "EMPTY") {
    return "MOCK";
  }
  return "MOCK";
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await buildClientPortalSnapshot(auth.user.id);
    const classification = normalizeOrigin(process.env.CARVIPIX_DATA_CLASSIFICATION);
    const snapshot = new Date().toISOString();
    return NextResponse.json(
      {
        data,
        dataSource: {
          origin: classification,
          status: classification === "REAL" ? "active" : "non-production",
          capturedAt: snapshot,
          validUntil: snapshot,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el portal del cliente" },
      { status: 500 }
    );
  }
}