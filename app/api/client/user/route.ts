import { NextRequest, NextResponse } from "next/server";
import { findMembershipByUserId } from "@/app/lib/auth/server";
import { requireClientSession } from "@/app/api/client/_auth";

function getPlanPermissions(plan: string) {
  switch (plan) {
    case "enterprise":
      return {
        alertas: true,
        bot: true,
        capital: true,
        fondeo: true,
        reportes: true,
        soporte: true,
        aiBriefing: true,
        maxAlerts: 1000,
        maxBots: 10,
      };
    case "premium":
      return {
        alertas: true,
        bot: true,
        capital: true,
        fondeo: false,
        reportes: true,
        soporte: true,
        aiBriefing: true,
        maxAlerts: 100,
        maxBots: 3,
      };
    case "pro":
      return {
        alertas: true,
        bot: true,
        capital: false,
        fondeo: false,
        reportes: true,
        soporte: true,
        aiBriefing: false,
        maxAlerts: 50,
        maxBots: 1,
      };
    default:
      return {
        alertas: true,
        bot: false,
        capital: false,
        fondeo: false,
        reportes: false,
        soporte: false,
        aiBriefing: false,
        maxAlerts: 5,
        maxBots: 0,
      };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const membership = await findMembershipByUserId(auth.user.id);
  const plan = membership?.active ? membership.plan : "demo";
  const data = {
    id: auth.user.id,
    email: auth.user.email,
    nombre: auth.user.nombre,
    apellido: auth.user.apellido,
    plan,
    estado: auth.user.estado,
    fechaActivacion: new Date(0),
    permisos: getPlanPermissions(plan),
    verificado: auth.user.verificado,
  };

  return NextResponse.json({ data }, { status: 200 });
}
