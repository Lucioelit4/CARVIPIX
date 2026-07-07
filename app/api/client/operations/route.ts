import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const data = await ecosystemServices.operations.getOperations(auth.user.id, Number.isFinite(limit) && limit > 0 ? limit : 50);
  return NextResponse.json({ data }, { status: 200 });
}
