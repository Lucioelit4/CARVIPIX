import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";
import { requireActiveMt5License } from "../_auth";

// ============================================================================
// POST /api/bot/mt5/ack
// EA confirma recepción de signal
// ============================================================================

export async function POST(request: NextRequest) {
  const auth = await requireActiveMt5License(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const bodyLicenseId = String(body.license_id ?? "").trim();
  const licenseId = bodyLicenseId || auth.licenseKey;
  const signalId = String(body.signal_id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const installationId = String(body.installation_id ?? "").trim() || undefined;

  if (bodyLicenseId && auth.licenseKey !== bodyLicenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (!licenseId || !signalId || !status) {
    return NextResponse.json(
      { error: "Parámetros requeridos: license_id, signal_id, status" },
      { status: 400 }
    );
  }

  const signalStatus = await botMT5Service.acknowledgeSignal({
    signalId,
    licenseId,
    status,
    installationId,
  });

  await botMT5Service.recordSignalRuntimeEvent({
    signalId,
    licenseId,
    installationId,
    stage: "SIGNAL_ACK",
    ackStatus: status,
    detail: "ack callback received",
    payload: { normalizedStatus: signalStatus },
  });

  await backendDatabase.query(
    `
    UPDATE master_events
    SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
        updated_at = NOW()
    WHERE signal_id = $2
    `,
    [
      JSON.stringify({
        distribution_state: signalStatus === "EXECUTED" ? "DELIVERED_CONFIRMED" : "MT5_ACKNOWLEDGED",
        mt5_acknowledged_at: new Date().toISOString(),
        mt5_ack_status: status,
        mt5_signal_status: signalStatus,
        mt5_installation_id: installationId ?? null,
      }),
      signalId,
    ]
  );

  return NextResponse.json(
    { success: true, signal_id: signalId, ack_status: status, signal_status: signalStatus },
    { status: 200 }
  );
}
