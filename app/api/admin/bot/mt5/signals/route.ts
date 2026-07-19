import { backendDatabase } from "@/app/backend/core/database";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signalsResult = await backendDatabase.query(
      `SELECT signal_id, symbol, decision, entry, stop_loss, take_profit, status, created_at, expires_at
       FROM bot_mt5_signals
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const statsResult = await backendDatabase.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::integer as count FROM bot_mt5_signals GROUP BY status`
    );

    const signals = signalsResult.rows ?? [];
    const statusStats = statsResult.rows ?? [];

    return Response.json({
      success: true,
      totalSignals: signals.length,
      signals,
      statusStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: string }).code
      : undefined;
    const message = error instanceof Error ? error.message : "Internal error";

    return Response.json({
      success: false,
      error: message,
      code
    }, { status: 500 });
  }
}
