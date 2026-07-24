import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { hasInternalOwnerAccess } from "@/app/backend/commercial/owner-access";
import { createOwnerDemoCertificationSignal, provisionOwnerBotCertification } from "@/app/backend/services/owner-bot-certification-service";

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) return auth.response;

  if (!(await hasInternalOwnerAccess(auth.user.id))) {
    return NextResponse.json({ error: "Acceso interno de propietario requerido" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim();

  try {
    if (action === "provision") {
      const data = await provisionOwnerBotCertification({ userId: auth.user.id });
      return NextResponse.json({ data }, { status: 201 });
    }

    if (action === "create-demo-signal") {
      const decision = String(body.decision ?? "").toUpperCase();
      if (decision !== "BUY" && decision !== "SELL") {
        return NextResponse.json({ error: "decision invalida" }, { status: 400 });
      }

      const data = await createOwnerDemoCertificationSignal({
        userId: auth.user.id,
        licenseId: String(body.licenseId ?? "").trim(),
        accountNumber: String(body.accountNumber ?? "").trim(),
        brokerServer: String(body.brokerServer ?? "").trim(),
        symbol: String(body.symbol ?? "").trim(),
        decision,
        entry: Number(body.entry),
        stopLoss: Number(body.stopLoss),
        takeProfit: Number(body.takeProfit),
      });
      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar la certificacion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}