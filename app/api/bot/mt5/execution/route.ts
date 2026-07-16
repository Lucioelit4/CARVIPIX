/**
 * Endpoint para retorno de ejecución desde MT5
 * 
 * Ruta: app/api/bot/mt5/execution/route.ts
 * 
 * Uso:
 * POST /api/bot/mt5/execution
 * {
 *   "event_id": "EVT-20260715-0001",
 *   "signal_id": "SIG-XAUUSD-0001",
 *   "execution_id": "EXE-0001",
 *   "status": "EXECUTED",
 *   "ticket": 123456789,
 *   "entry_price": 2024.52
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { masterEventDispatcher } from "@/app/backend/services/master-event-dispatcher";
import { backendDatabase } from "@/app/backend/core/database";

/**
 * POST /api/bot/mt5/execution
 * Retorno de ejecución desde MT5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos
    if (!body.event_id || !body.status) {
      return NextResponse.json({
        success: false,
        error: "event_id y status son requeridos"
      }, { status: 400 });
    }
    
    // Validar status
    if (!["EXECUTED", "REJECTED", "FAILED"].includes(body.status)) {
      return NextResponse.json({
        success: false,
        error: "status debe ser EXECUTED, REJECTED o FAILED"
      }, { status: 400 });
    }
    
    // Actualizar bot_mt5_signals si viene signal_id
    if (body.signal_id && backendDatabase.enabled) {
      const new_status = body.status === "EXECUTED" ? "EXECUTED" : "REJECTED";
      try {
        await backendDatabase.query(
          `UPDATE bot_mt5_signals SET status = $1 WHERE signal_id = $2`,
          [new_status, body.signal_id]
        );
        console.log(`[EXECUTION] bot_mt5_signals.status → ${new_status} para ${body.signal_id}`);
      } catch (err) {
        console.warn(`[EXECUTION] No se pudo actualizar bot_mt5_signals:`, err);
      }
    }

    // Enviar al Dispatcher
    try {
      await masterEventDispatcher.receiveExecutionFromMT5({
        event_id: body.event_id,
        status: body.status,
        ticket: body.ticket,
        entry_price: body.entry_price
      });
    } catch (dispatcherErr) {
      // Si el evento no existe en BD es porque la señal fue de prueba directa (sin event maestro)
      console.warn(`[EXECUTION] Dispatcher: ${(dispatcherErr as Error).message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: "Ejecución recibida y procesada",
      signal_id: body.signal_id,
      status: body.status,
      ticket: body.ticket,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
