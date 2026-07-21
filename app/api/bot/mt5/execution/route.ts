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
import { requireActiveMt5License } from "../_auth";

/**
 * POST /api/bot/mt5/execution
 * Retorno de ejecución desde MT5
 */
export async function POST(request: NextRequest) {
  const auth = await requireActiveMt5License(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    
    // Validar campos
    if (!body.event_id || !body.status) {
      return NextResponse.json({
        success: false,
        error: "event_id y status son requeridos"
      }, { status: 400 });
    }

    if (!body.signal_id) {
      return NextResponse.json({ success: false, error: "signal_id es requerido" }, { status: 400 });
    }

    const ownedSignal = await backendDatabase.query<{ id: string }>(
      `SELECT id FROM bot_mt5_signals WHERE signal_id = $1 AND license_id = $2 LIMIT 1`,
      [body.signal_id, auth.licenseKey],
    );
    if (!ownedSignal.rows[0]) {
      return NextResponse.json({ success: false, error: "Signal not found" }, { status: 404 });
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
          `UPDATE bot_mt5_signals SET status = $1 WHERE signal_id = $2 AND license_id = $3`,
          [new_status, body.signal_id, auth.licenseKey]
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
      error: "No se pudo procesar la ejecución"
    }, { status: 500 });
  }
}
