import { NextRequest, NextResponse } from "next/server";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";
import { requireActiveMt5License } from "../_auth";

// ============================================================================
// POST /api/bot/mt5/heartbeat
// EA envía heartbeat periódico
// ============================================================================

export async function POST(request: NextRequest) {
  const auth = await requireActiveMt5License(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const licenseId = String(body.license_id ?? "").trim();
  const installationId = String(body.installation_id ?? "").trim();
  const eaVersion = String(body.ea_version ?? "").trim();
  const status = String(body.status ?? "").trim();
  const openPositions = Number(body.open_positions ?? 0);
  const equity = Number(body.equity ?? 0);
  const balance = Number(body.balance ?? 0);
  const accountHash = String(body.account_hash ?? "").trim();
  const brokerServer = String(body.broker_server ?? "").trim();

  if (auth.licenseKey !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (!licenseId || !installationId) {
    return NextResponse.json(
      { error: "Parámetros requeridos: license_id, installation_id" },
      { status: 400 }
    );
  }

  try {
    await botMT5Service.recordHeartbeat(
      licenseId,
      installationId,
      eaVersion,
      status,
      openPositions,
      equity,
      balance,
      accountHash,
      brokerServer
    );

    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error registrando heartbeat", success: false },
      { status: 500 }
    );
  }
}
