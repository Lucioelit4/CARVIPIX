import { backendDatabase } from "@/app/backend/core/database";

export async function GET() {
  try {
    // Obtener todas las señales
    const signals = await backendDatabase.query(
      `SELECT signal_id, symbol, decision, entry, stop_loss, take_profit, status, created_at, expires_at
       FROM bot_mt5_signals
       ORDER BY created_at DESC
       LIMIT 20`
    );

    // Obtener count por estado
    const stats = await backendDatabase.query(
      `SELECT status, COUNT(*)::integer as count FROM bot_mt5_signals GROUP BY status`
    );

    return Response.json({
      success: true,
      totalSignals: (signals as any).length || 0,
      signals: signals,
      statusStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}
