import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Parámetros por defecto para prueba
    const id = randomUUID();
    const signalId = body.signalId || `TEST-${Date.now()}`;
    const symbol = body.symbol || "XAUUSD";
    const decision = body.decision || "BUY";
    const entry = parseFloat(body.entry?.toString() || "2450.50");
    const stopLoss = parseFloat(body.stopLoss?.toString() || "2445.00");
    const takeProfit = parseFloat(body.takeProfit?.toString() || "2465.00");
    const licenseId = body.licenseId || "DEFAULT_LICENSE";
    const analysisId = body.analysisId || "MANUAL-TEST";

    // Crear signal directamente
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const signature = `TEST-${Date.now()}`;

    await backendDatabase.query(
      `INSERT INTO bot_mt5_signals 
        (id, signal_id, analysis_id, license_id, symbol, decision, entry, 
         stop_loss, take_profit, risk_reward, signature, expires_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', NOW())`,
      [
        id,
        signalId,
        analysisId,
        licenseId,
        symbol,
        decision,
        entry,
        stopLoss,
        takeProfit,
        1.5,
        signature,
        expiresAt
      ]
    );

    return Response.json({
      success: true,
      message: "Signal creada para prueba",
      id: id,
      signalId: signalId,
      symbol: symbol,
      decision: decision,
      entry: entry,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      status: "PENDING",
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TEST-SIGNAL]", errorMessage);
    return Response.json({
      success: false,
      error: "No se pudo crear la señal de prueba"
    }, { status: 500 });
  }
}
