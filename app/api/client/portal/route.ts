import { NextRequest, NextResponse } from "next/server";

import { buildClientPortalSnapshot } from "@/app/backend/commercial/portal-service";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await buildClientPortalSnapshot(auth.user.id);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el portal del cliente" },
      { status: 500 }
    );
  }
}