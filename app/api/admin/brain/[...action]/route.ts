import { NextRequest, NextResponse } from "next/server";
import { masterEventDispatcher } from "@/app/backend/services/master-event-dispatcher";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string[] }> }
) {
  const { action: actionArray } = await params;
  const action = actionArray?.[0];
  
  try {
    switch (action) {
      case 'activate': {
        const body = await request.json();
        const userId = body.userId || 'admin';
        const status = await masterEventDispatcher.activate(userId);
        return NextResponse.json({ success: true, status, message: "Cerebro activado" });
      }
      
      case 'deactivate': {
        const body = await request.json();
        const userId = body.userId || 'admin';
        const status = await masterEventDispatcher.deactivate(userId);
        return NextResponse.json({ success: true, status, message: "Cerebro detenido" });
      }
      
      case 'pause': {
        const status = await masterEventDispatcher.pause();
        return NextResponse.json({ success: true, status, message: "Operaciones pausadas" });
      }
      
      case 'resume': {
        const status = await masterEventDispatcher.resume();
        return NextResponse.json({ success: true, status, message: "Operaciones reanudadas" });
      }
      
      case 'maintenance': {
        const status = await masterEventDispatcher.maintenance();
        return NextResponse.json({ success: true, status, message: "Modo mantenimiento activado" });
      }
      
      default:
        return NextResponse.json({ success: false, error: "Acción no encontrada" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
