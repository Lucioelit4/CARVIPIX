import { NextRequest, NextResponse } from "next/server";
import { exportCertificationAct } from "@/app/lib/services/certificationLogService";

export async function GET(request: NextRequest) {
  try {
    // Solo permitir acceso administrativo
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const markdown = exportCertificationAct();

    // Retornar como descarga
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="acta-certificacion-v3-${new Date().toISOString().split("T")[0]}.md"`,
      },
    });
  } catch (error) {
    console.error("[API] Certification export error:", error);
    return NextResponse.json(
      { error: "Failed to export certification act" },
      { status: 500 }
    );
  }
}
