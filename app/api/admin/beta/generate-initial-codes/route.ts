/**
 * POST /api/admin/beta/generate-initial-codes
 * Genera los 5 códigos de invitación iniciales para el Programa Fundadores
 * SOLO para setup inicial. No es reutilizable.
 */
import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { initializeBetaSchema } from "@/app/backend/schema/beta-schema";

const INITIAL_CODES = ["FOUNDER-001", "FOUNDER-002", "FOUNDER-003", "FOUNDER-004", "FOUNDER-005"];

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({
      ok: true,
      message: "Modo sin BD. Códigos de ejemplo:",
      codes: INITIAL_CODES,
    });
  }

  try {
    await initializeBetaSchema();

    const created = [];
    const failed = [];

    for (const code of INITIAL_CODES) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60); // 60 días

        await backendDatabase.query(
          `INSERT INTO beta_invitation_codes (id, code, max_uses, used_count, is_active, notes, expires_at, created_at)
           VALUES ($1, $2, 1, 0, true, $3, $4, NOW())
           ON CONFLICT (code) DO NOTHING`,
          [
            randomUUID(),
            code,
            `Fundador inicial — Programa Privado Beta`,
            expiresAt,
          ]
        );
        created.push(code);
      } catch (error) {
        failed.push({ code, reason: error instanceof Error ? error.message : "unknown" });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${created.length} códigos creados exitosamente`,
      created,
      failed: failed.length > 0 ? failed : undefined,
    });
  } catch (error) {
    console.error("[BETA/GEN-CODES]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
