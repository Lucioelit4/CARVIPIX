import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";

/**
 * GET /api/bot/mt5/signal/next?license=...
 * El EA V2 llama este endpoint en cada polling para obtener
 * la próxima señal PENDING y marcarla como PROCESSING.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const licenseKey = url.searchParams.get("license") || "";

    // Obtener una señal PENDING no expirada
    // Prioridad: más reciente primero
    const signals = await backendDatabase.query(
      `SELECT id, signal_id, symbol, decision, entry, stop_loss, take_profit, risk_reward, created_at, expires_at
       FROM bot_mt5_signals
       WHERE status = 'PENDING'
         AND expires_at > NOW()
       ORDER BY created_at ASC
       LIMIT 1`
    );

    const rows = (signals as any).rows || [];

    if (rows.length === 0) {
      return Response.json({
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

    return Response.json({
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

  } catch (error: any) {
    console.error("[SIGNAL-NEXT]", error.message);
    return Response.json({
      has_signal: false,
      error: error.message
    }, { status: 500 });
  }
}
