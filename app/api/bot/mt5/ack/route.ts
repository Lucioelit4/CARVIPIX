import { NextRequest, NextResponse } from "next/server";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";

// ============================================================================
// POST /api/bot/mt5/ack
// EA confirma recepción de signal
// ============================================================================

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const licenseId = String(body.license_id ?? "").trim();
  const signalId = String(body.signal_id ?? "").trim();
  const status = String(body.status ?? "").trim();

  // Validar auth
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sin autorización" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (token !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (!licenseId || !signalId || !status) {
    return NextResponse.json(
      { error: "Parámetros requeridos: license_id, signal_id, status" },
      { status: 400 }
    );
  }

  // Log de ACK (en BD si es necesario)
  // Por ahora, solo confirmar receipt

  return NextResponse.json({ success: true, signal_id: signalId, ack_status: status }, { status: 200 });
}
