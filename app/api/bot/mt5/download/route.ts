import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// GET /api/bot/mt5/download
// Cliente descarga archivo EA instalable
// ============================================================================

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const requestedFile = request.nextUrl.searchParams.get("file") || "ea";

  if (!token) {
    return NextResponse.json({ error: "Token de descarga requerido" }, { status: 400 });
  }

  // Validar token de descarga en BD
  if (!backendDatabase.enabled) {
    // Local mode - permitir siempre
  } else {
    const { rows } = await backendDatabase.query<{
      id: string;
      expires_at: Date;
      downloaded_at: Date | null;
    }>(
      `
      SELECT id, expires_at, downloaded_at
      FROM bot_mt5_downloads
      WHERE download_token = $1
      LIMIT 1
      `,
      [token]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }

    const record = rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }

    if (requestedFile === "ea") {
      await backendDatabase.query(
        `
        UPDATE bot_mt5_downloads
        SET downloaded_at = NOW()
        WHERE download_token = $1
        `,
        [token]
      );
    }
  }

  if (requestedFile === "manual") {
    const manualPath = path.join(process.cwd(), "EA_MT5_INSTALLATION_PROCEDURE.md");

    try {
      const manualContent = await fs.readFile(manualPath);
      return new NextResponse(manualContent, {
        headers: {
          "Content-Disposition": "attachment; filename=CARVIPIX_EA_MT5_INSTALLATION_PROCEDURE.md",
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json({ error: "Manual de instalacion no disponible. Contacta soporte." }, { status: 404 });
    }
  }

  if (requestedFile !== "ea") {
    return NextResponse.json({ error: "Archivo de entrega no valido" }, { status: 400 });
  }

  const eaFileName = "CARVIPIX_EA_MT5_V1.ex5";
  const eaPath = path.join(process.cwd(), "public", "downloads", eaFileName);

  try {
    const fileContent = await fs.readFile(eaPath);
    return new NextResponse(fileContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${eaFileName}"`,
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Archivo EA no disponible. Contacta soporte." },
      { status: 404 }
    );
  }
}
