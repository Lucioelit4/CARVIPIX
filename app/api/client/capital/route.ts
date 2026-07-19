import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json(
    {
      error: "Este endpoint fue retirado y reemplazado por el modulo de Socios Estrategicos CARVIPIX.",
      route: "/socios-estrategicos",
    },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json(
    {
      error: "Este endpoint fue retirado y reemplazado por el modulo de Socios Estrategicos CARVIPIX.",
      route: "/socios-estrategicos/solicitud",
    },
    { status: 410 }
  );
}
