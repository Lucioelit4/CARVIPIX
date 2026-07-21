import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

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
      error: "Database check failed"
    }, { status: 500 });
  }
}
