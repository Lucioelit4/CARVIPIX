import { NextRequest, NextResponse } from "next/server";

import { requireClientSession } from "@/app/api/client/_auth";
import { getFounderAccess } from "@/app/backend/founder-access/service";
import { isFounderAccessSnapshotActive } from "@/app/backend/founder-access/types";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok || auth.isAdminSession) {
    return auth.ok
      ? NextResponse.json({ ok: false, error: "Client session required" }, { status: 401 })
      : auth.response;
  }

  const access = await getFounderAccess(auth.user.id);
  return NextResponse.json({
    ok: true,
    active: isFounderAccessSnapshotActive(access),
    status: access?.status ?? null,
    role: access ? "FOUNDER" : null,
    accessLevel: access ? "ALL_ACCESS" : null,
    expiresAt: null,
    licenseStatus: access?.licenseStatus ?? null,
  });
}