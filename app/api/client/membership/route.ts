import { NextRequest, NextResponse } from "next/server";
import { findMembershipByUserId } from "@/app/lib/auth/server";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const membership = await findMembershipByUserId(auth.user.id);
  const data = membership ?? {
    userId: auth.user.id,
    plan: auth.user.plan,
    estado: "inactivo" as const,
    fechaInicio: new Date(0),
    renovacionAutomatica: false,
    active: false,
  };

  return NextResponse.json({ data }, { status: 200 });
}
