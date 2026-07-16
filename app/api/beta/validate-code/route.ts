/**
 * POST /api/beta/validate-code
 * Valida un código de invitación de fundador
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    const code = String(body.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ ok: false, error: "Código requerido" }, { status: 400 });
    }

    if (!backendDatabase.enabled) {
      // Fallback para desarrollo sin BD: aceptar cualquier FOUNDER-XXXX
      const isValid = /^FOUNDER-[A-Z0-9]{4}$/.test(code);
      return NextResponse.json({ ok: isValid, valid: isValid, discount: isValid ? 100 : 0 });
    }

    const result = await backendDatabase.query<{
      code: string;
      max_uses: number;
      used_count: number;
      is_active: boolean;
      expires_at: Date | null;
    }>(
      `SELECT code, max_uses, used_count, is_active, expires_at
       FROM beta_invitation_codes
       WHERE code = $1
       LIMIT 1`,
      [code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, valid: false, error: "Código no encontrado" }, { status: 404 });
    }

    const row = result.rows[0];

    if (!row.is_active) {
      return NextResponse.json({ ok: false, valid: false, error: "Código inactivo" }, { status: 403 });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, valid: false, error: "Código expirado" }, { status: 403 });
    }

    if (row.used_count >= row.max_uses) {
      return NextResponse.json({ ok: false, valid: false, error: "Código ya fue usado" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      discount: 100,
      message: "Código válido — 100% de descuento aplicado",
    });
  } catch (error) {
    console.error("[BETA/VALIDATE-CODE]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
