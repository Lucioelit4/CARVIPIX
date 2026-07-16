import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import fs from "fs/promises";
import path from "path";

// ============================================================================
// GET /api/bot/mt5/download
// Cliente descarga archivo EA instalable
// ============================================================================

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const token = request.nextUrl.searchParams.get("token") || "";
  const userId = auth.user.id;

  if (!token) {
    return NextResponse.json({ error: "Token de descarga requerido" }, { status: 400 });
  }

  // Validar token de descarga en BD
  if (!backendDatabase.enabled) {
    // Local mode - permitir siempre
  } else {
    const { rows } = await backendDatabase.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      downloaded_at: Date | null;
    }>(
      `
      SELECT id, user_id, expires_at, downloaded_at
      FROM bot_mt5_downloads
      WHERE download_token = $1 AND user_id = $2
      LIMIT 1
      `,
      [token, userId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }

    const record = rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }

    // Registrar descarga
    await backendDatabase.query(
      `
      UPDATE bot_mt5_downloads
      SET downloaded_at = NOW()
      WHERE download_token = $1
      `,
      [token]
    );
  }

  // Leer archivo compilado
  const eaFileName = "CARVIPIX_EA_MT5_V1.ex5";
  const eaPath = path.join(process.cwd(), "scripts", eaFileName);

  try {
    const fileContent = await fs.readFile(eaPath);
    return new NextResponse(fileContent, {
      headers: {
        "Content-Disposition": `attachment; filename="${eaFileName}"`,
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    // Si el archivo compilado no existe, retornar el .mq5 como placeholder
    try {
      const mqFile = await fs.readFile(path.join(process.cwd(), "scripts", "CARVIPIX_EA_MT5_V1.mq5"));
      return new NextResponse(mqFile, {
        headers: {
          "Content-Disposition": `attachment; filename="CARVIPIX_EA_MT5_V1.mq5"`,
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (mqError) {
      return NextResponse.json(
        { error: "Archivo EA no disponible. Contacta soporte." },
        { status: 404 }
      );
    }
  }
}
