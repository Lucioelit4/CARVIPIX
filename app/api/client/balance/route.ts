import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json(
    { error: "Este endpoint de balance fue retirado. Usa /socios-estrategicos." },
    { status: 410 }
  );
}
