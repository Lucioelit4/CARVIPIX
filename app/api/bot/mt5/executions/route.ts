import { NextRequest, NextResponse } from "next/server";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";

// ============================================================================
// POST /api/bot/mt5/executions
// EA reporta ejecución de orden
// ============================================================================

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const licenseId = String(body.license_id ?? "").trim();
  const installationId = String(body.installation_id ?? "").trim();
  const signalId = String(body.signal_id ?? "").trim();
  const symbol = String(body.symbol ?? "").trim();
  const directionStr = String(body.direction ?? "").trim();
  const direction = (directionStr === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL";
  const requestedEntry = Number(body.requested_entry ?? 0);
  const executedEntry = Number(body.executed_entry ?? 0);
  const stopLoss = Number(body.stop_loss ?? 0);
  const takeProfit = Number(body.take_profit ?? 0);
  const lotSize = Number(body.lot_size ?? 0);
  const magicNumber = Number(body.magic_number ?? 0);
  const brokerOrderId = Number(body.broker_order_id ?? 0);
  const statusStr = String(body.status ?? "EXECUTED").trim();
  const status = (statusStr === "FAILED" ? "FAILED" : "EXECUTED") as "EXECUTED" | "FAILED";

  // Validar auth
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sin autorización" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (token !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (!licenseId || !signalId || !symbol || !direction) {
    return NextResponse.json(
      { error: "Parámetros requeridos: license_id, signal_id, symbol, direction, status" },
      { status: 400 }
    );
  }

  try {
    const execution = await botMT5Service.recordExecution(
      signalId,
      licenseId,
      installationId,
      symbol,
      direction,
      requestedEntry,
      executedEntry,
      stopLoss,
      takeProfit,
      lotSize,
      magicNumber,
      brokerOrderId,
      status
    );

    if (status === "EXECUTED") {
      await botMT5Service.markSignalExecuted(signalId);
    }

    return NextResponse.json(
      {
        success: true,
        execution_id: execution.id,
        signal_id: signalId,
        status: status,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error registrando ejecución", success: false },
      { status: 500 }
    );
  }
}
