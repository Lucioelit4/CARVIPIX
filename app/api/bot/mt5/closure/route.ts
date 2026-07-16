/**
 * Endpoint para retorno de cierre desde MT5
 * 
 * Ruta: app/api/bot/mt5/closure/route.ts
 * 
 * Uso:
 * POST /api/bot/mt5/closure
 * {
 *   "event_id": "EVT-20260715-0001",
 *   "status": "CLOSED",
 *   "close_type": "TAKE_PROFIT",
 *   "close_price": 2035.00,
 *   "pips": 10.48,
 *   "profit_loss": 69.87
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { masterEventDispatcher } from "@/app/backend/services/master-event-dispatcher";

/**
 * POST /api/bot/mt5/closure
 * Retorno de cierre desde MT5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos
    const required = [
      "event_id",
      "status",
      "close_type",
      "close_price",
      "pips",
      "profit_loss"
    ];
    
    for (const field of required) {
      if (!(field in body)) {
        return NextResponse.json({
          success: false,
          error: `Campo requerido: ${field}`
        }, { status: 400 });
      }
    }
    
    // Validar status
    if (body.status !== "CLOSED") {
      return NextResponse.json({
        success: false,
        error: "status debe ser CLOSED"
      }, { status: 400 });
    }
    
    // Validar close_type
    if (!["TAKE_PROFIT", "STOP_LOSS", "MANUAL"].includes(body.close_type)) {
      return NextResponse.json({
        success: false,
        error: "close_type debe ser TAKE_PROFIT, STOP_LOSS o MANUAL"
      }, { status: 400 });
    }
    
    // Enviar al Dispatcher
    await masterEventDispatcher.receiveClosureFromMT5({
      event_id: body.event_id,
      status: body.status as "CLOSED",
      close_type: body.close_type,
      close_price: body.close_price,
      pips: body.pips,
      profit_loss: body.profit_loss
    });
    
    return NextResponse.json({
      success: true,
      message: "Cierre recibido y procesado",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
