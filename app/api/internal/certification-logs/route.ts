import { NextRequest, NextResponse } from "next/server";
import {
  loadCertificationLogs,
  getCertificationSummary,
  logCertificationCycle,
  exportCertificationAct,
  getCompletedCycleCount,
} from "@/app/lib/services/certificationLogService";

// GET: obtener todos los logs y resumen
export async function GET(request: NextRequest) {
  try {
    // Solo permitir acceso administrativo
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = loadCertificationLogs();
    const summary = getCertificationSummary();

    return NextResponse.json({
      logs,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Certification logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch certification logs" },
      { status: 500 }
    );
  }
}

// POST: registrar nuevo ciclo
export async function POST(request: NextRequest) {
  try {
    // Solo permitir acceso administrativo
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validaciones básicas
    if (!body.analysis_id || !body.signal_id || !body.instrument) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry = logCertificationCycle(body);

    return NextResponse.json({
      success: true,
      entry,
      summary: getCertificationSummary(),
    });
  } catch (error) {
    console.error("[API] Certification logs POST error:", error);
    return NextResponse.json(
      { error: "Failed to log certification cycle" },
      { status: 500 }
    );
  }
}
