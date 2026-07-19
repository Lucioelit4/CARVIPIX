/**
 * API Endpoints para CARVIPIX Brain Controller
 * 
 * Ruta: app/api/admin/brain?action=...
 */

import { NextRequest, NextResponse } from "next/server";
import { masterEventDispatcher } from "@/app/backend/services/master-event-dispatcher";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

/**
 * GET /api/admin/brain
 * Obtener estado del cerebro
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = masterEventDispatcher.getBrainStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/brain?action=...
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get('action') || 'unknown';
    const body = await request.json().catch(() => ({}));
    const userId = (body as { userId?: string }).userId || 'admin';
    
    let status;
    let message = "";
    
    switch (action) {
      case 'activate':
        status = await masterEventDispatcher.activate(userId);
        message = "Cerebro activado";
        break;
        
      case 'deactivate':
        status = await masterEventDispatcher.deactivate(userId);
        message = "Cerebro detenido";
        break;
        
      case 'pause':
        status = await masterEventDispatcher.pause();
        message = "Operaciones pausadas";
        break;
        
      case 'resume':
        status = await masterEventDispatcher.resume();
        message = "Operaciones reanudadas";
        break;
        
      case 'maintenance':
        status = await masterEventDispatcher.maintenance();
        message = "Modo mantenimiento activado";
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Acción desconocida: ${action}`
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      status,
      message,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
