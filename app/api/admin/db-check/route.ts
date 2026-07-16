import { NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";

export async function GET() {
  try {
    // Verificar conexión a BD
    const result = await backendDatabase.query(
      "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('master_events')"
    );
    
    return NextResponse.json({
      success: true,
      dbEnabled: backendDatabase.enabled,
      masterEventsExists: result.rows.length > 0 && result.rows[0].table_count > 0,
      tables: result.rows,
      envAvailable: !!process.env.DATABASE_URL
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      envAvailable: !!process.env.DATABASE_URL
    }, { status: 500 });
  }
}
