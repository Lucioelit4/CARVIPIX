/**
 * Endpoint para recibir Señales Maestras
 * 
 * Ruta: app/api/signals/master/route.ts
 * 
 * Uso:
 * POST /api/signals/master
 * {
 *   "signal_id": "SIG-XAUUSD-0001",
 *   "analysis_id": "ANA-XAUUSD-001",
 *   "symbol": "XAUUSD",
 *   "direction": "BUY",
 *   "entry": 2024.50,
 *   "stop_loss": 2020.00,
 *   "take_profit": 2035.00,
 *   "quality": "A",
 *   "confidence": 84,
 *   "risk_reward": 1.55
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { masterEventDispatcher } from "@/app/backend/services/master-event-dispatcher";
import { isInternalIngestRequest } from "@/app/api/admin/_shared/security";

export async function POST(request: NextRequest) {
  if (!isInternalIngestRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validar campos
    const required = [
      "signal_id",
      "analysis_id",
      "symbol",
      "direction",
      "entry",
      "stop_loss",
      "take_profit",
      "quality",
      "confidence",
      "risk_reward"
    ];
    
    for (const field of required) {
      if (!(field in body)) {
        console.log(`[SIGNALS-MASTER] Campo faltante: ${field}`);
        return NextResponse.json({
          success: false,
          error: `Campo requerido: ${field}`
        }, { status: 400 });
      }
    }
    
    console.log('[SIGNALS-MASTER] Llamando receiveMasterSignal...');
    
    // Enviar al Dispatcher
    const result = await masterEventDispatcher.receiveMasterSignal({
      signal_id: body.signal_id,
      analysis_id: body.analysis_id,
      symbol: body.symbol,
      direction: body.direction as "BUY" | "SELL" | "NONE",
      entry: body.entry,
      stop_loss: body.stop_loss,
      take_profit: body.take_profit,
      quality: body.quality as "A+" | "A" | "B" | "C",
      confidence: body.confidence,
      risk_reward: body.risk_reward
    });
    
    console.log('[SIGNALS-MASTER] Resultado:', JSON.stringify(result));
    
    return NextResponse.json({
      success: result.success,
      event_id: result.eventId,
      error: result.error,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 200 : 500
    });
    
  } catch (error) {
    console.error('[SIGNALS-MASTER] Error capturado:', error);
    return NextResponse.json({
      success: false,
      error: "No se pudo procesar la señal"
    }, { status: 500 });
  }
}
