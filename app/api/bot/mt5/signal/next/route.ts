import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";

type DbQueryResult<T> = {
  rows: T[];
};

/**
 * GET /api/bot/mt5/signal/next?license=...
 * El EA V2 llama este endpoint en cada polling para obtener
 * la próxima señal PENDING y marcarla como PROCESSING.
 */
export async function GET(request: NextRequest) {
  try {
    const licenseId = request.nextUrl.searchParams.get("license_id") || "";

    // Enforce the same auth pattern used by other MT5 endpoints.
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Sin autorización" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!licenseId || token !== licenseId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const license = await backendDatabase.query(
      `SELECT id FROM bot_mt5_licenses WHERE license_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [licenseId]
    );

    const licenseResult = license as unknown as DbQueryResult<{ id: string }>;
    if (licenseResult.rows.length === 0) {
      return NextResponse.json({ has_signal: false, error: "Licencia inválida o inactiva" }, { status: 403 });
    }

    // Obtener una señal PENDING no expirada
    // Prioridad: más reciente primero
    const signals = await backendDatabase.query(
      `SELECT id, signal_id, symbol, decision, entry, stop_loss, take_profit, risk_reward, created_at, expires_at
       FROM bot_mt5_signals
       WHERE license_id = $1
         AND status = 'PENDING'
         AND expires_at > NOW()
       ORDER BY created_at ASC
       LIMIT 1`,
      [licenseId]
    );

    const signalResult = signals as unknown as DbQueryResult<{
      id: string;
      signal_id: string;
      event_id?: string;
      symbol: string;
      decision: string;
      entry: string;
      stop_loss: string;
      take_profit: string;
      risk_reward?: string;
      created_at: string;
      expires_at: string;
    }>;
    const rows = signalResult.rows;

    if (rows.length === 0) {
      return NextResponse.json({
        has_signal: false,
        message: "No hay señales pendientes"
      });
    }

    const signal = rows[0];

    // Marcar como DELIVERED para evitar doble ejecución
    await backendDatabase.query(
      `UPDATE bot_mt5_signals SET status = 'DELIVERED', delivered_at = NOW() WHERE id = $1`,
      [signal.id]
    );

    // El event_id puede estar en admin_state_persistence o master_events
    // Por ahora, usar el signal_id como event_id si no hay vinculación directa
    const event_id = signal.event_id || signal.signal_id;

    return NextResponse.json({
      has_signal: true,
      signal_id: signal.signal_id,
      event_id: event_id,
      symbol: signal.symbol,
      decision: signal.decision,
      entry: parseFloat(signal.entry),
      stop_loss: parseFloat(signal.stop_loss),
      take_profit: parseFloat(signal.take_profit),
      risk_reward: parseFloat(signal.risk_reward || "1.5"),
      created_at: signal.created_at,
      expires_at: signal.expires_at
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SIGNAL-NEXT]", errorMessage);
    return NextResponse.json({
      has_signal: false,
      error: errorMessage
    }, { status: 500 });
  }
}
