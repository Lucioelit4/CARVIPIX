/**
 * POST /api/setup/beta-codes
 * ⚠️ TEMPORAL: Solo para setup inicial de certificación
 * Genera los 5 códigos FOUNDER-001 a FOUNDER-005
 * 
 * IMPORTANTE: Este endpoint debe desactivarse después de la certificación
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { initializeBetaSchema } from "@/app/backend/schema/beta-schema";

const INITIAL_CODES = ["FOUNDER-001", "FOUNDER-002", "FOUNDER-003", "FOUNDER-004", "FOUNDER-005"];

export async function POST(request: NextRequest) {
  // ── Validación simple (en produc ción, esto será más estricto)
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.includes("Bearer")) {
    // Para desarrollo local, permitir sin token
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({
      ok: true,
      message: "Modo sin BD. Códigos de ejemplo generados (en memoria):",
      codes: INITIAL_CODES,
      warning: "Estos códigos no persistirán si el servidor se reinicia",
    });
  }

  try {
    await initializeBetaSchema();

    // ── Verificar si ya existen códigos (para evitar duplicados)
    const existingResult = await backendDatabase.query<{ code_count: string }>(
      `SELECT COUNT(*)::text as code_count FROM beta_invitation_codes WHERE code LIKE 'FOUNDER-%'`
    );

    const existingCount = parseInt(existingResult.rows[0]?.code_count ?? "0", 10);

    if (existingCount > 0) {
      return NextResponse.json({
        ok: true,
        message: "Los códigos de fundador ya han sido generados previamente",
        existing_codes: existingCount,
        warning: "Este endpoint no puede ejecutarse dos veces",
      });
    }

    const created = [];
    const failed = [];

    for (const code of INITIAL_CODES) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60); // 60 días

        await backendDatabase.query(
          `INSERT INTO beta_invitation_codes (id, code, max_uses, used_count, is_active, notes, expires_at, created_at)
           VALUES ($1, $2, 1, 0, true, $3, $4, NOW())`,
          [
            randomUUID(),
            code,
            `Fundador inicial — Programa Privado Beta CARVIPIX`,
            expiresAt,
          ]
        );
        created.push(code);
        console.log(`[BETA-SETUP] Código creado: ${code}`);
      } catch (error) {
        failed.push({ code, reason: error instanceof Error ? error.message : "unknown" });
        console.warn(`[BETA-SETUP] Error creando ${code}:`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${created.length} códigos creados exitosamente para la certificación`,
      created,
      failed: failed.length > 0 ? failed : undefined,
      expires_in_days: 60,
      warning: "⚠️ ESTA API ES TEMPORAL — DEBE DESACTIVARSE TRAS CERTIFICACIÓN",
    });
  } catch (error) {
    console.error("[BETA-SETUP]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
