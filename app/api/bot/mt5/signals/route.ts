import { NextRequest, NextResponse } from "next/server";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";
import { requireActiveMt5License } from "../_auth";

// ============================================================================
// GET /api/bot/mt5/signals
// EA obtiene signal pendiente
// ============================================================================

export async function GET(request: NextRequest) {
  const auth = await requireActiveMt5License(request);
  if (!auth.ok) return auth.response;

  const licenseId = request.nextUrl.searchParams.get("license_id") || "";
  const installationId = request.nextUrl.searchParams.get("installation_id") || "";
  const accountHash = request.nextUrl.searchParams.get("account_hash") || "";

  if (auth.licenseKey !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (!licenseId || !installationId || !accountHash) {
    return NextResponse.json(
      { error: "Parámetros requeridos: license_id, installation_id, account_hash" },
      { status: 400 }
    );
  }

  // Validar instalación
  const installation = await botMT5Service.getInstallation(licenseId, installationId);
  if (!installation) {
    return NextResponse.json({ error: "Instalación no encontrada" }, { status: 404 });
  }

  if (installation.accountHash !== accountHash) {
    return NextResponse.json({ error: "Instalación no válida" }, { status: 403 });
  }

  if (installation.isRevoked || installation.status === "SUSPENDED" || installation.status === "ERROR") {
    return NextResponse.json({ error: "EA suspendido o error", signal: null }, { status: 403 });
  }

  // Obtener signal pendiente
  const signal = await botMT5Service.getPendingSignal(licenseId);

  if (!signal) {
    return NextResponse.json({ signal: null }, { status: 200 });
  }

  // Marcar como entregada
  await botMT5Service.markSignalDelivered(signal.signalId);

  return NextResponse.json(
    {
      signal: {
        signal_id: signal.signalId,
        analysis_id: signal.analysisId,
        symbol: signal.symbol,
        decision: signal.decision,
        entry: signal.entry,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        risk_reward: signal.riskReward,
        expires_at: signal.expiresAt.toISOString(),
        signature: signal.signature,
      },
    },
    { status: 200 }
  );
}
