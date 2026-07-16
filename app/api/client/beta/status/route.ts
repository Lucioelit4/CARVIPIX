/**
 * GET /api/client/beta/status
 * Devuelve el estado de la Beta Privada para el usuario autenticado
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { requireClientSession } from "@/app/api/client/_auth";

export const dynamic = "force-dynamic";

const EMPTY_RESPONSE = {
  ok: true,
  data: {
    isFounder: false,
    membershipPlan: "",
    membershipStatus: "",
    daysRemaining: 0,
    expiresAt: "",
    codeUsed: "",
    licenseKey: null,
    telegramUrl: null,
  },
};

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) return auth.response;

  const userId = auth.user.id;

  try {
    const membershipResult = await backendDatabase.query<{
      plan: string;
      estado: string;
      fecha_fin: Date;
      codigo_beta: string;
    }>(
      `SELECT plan, estado, fecha_fin, codigo_beta
       FROM memberships
       WHERE user_id = $1 AND origen = 'FOUNDERS_BETA'
       LIMIT 1`,
      [userId]
    );

    if (!membershipResult.rows || membershipResult.rows.length === 0) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const membership = membershipResult.rows[0];
    const now = new Date();
    const expiresAt = new Date(membership.fecha_fin);
    const daysRemaining = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const licenseKey: string | null = await backendDatabase.query<{ license_id: string }>(
      `SELECT license_id FROM bot_mt5_licenses
       WHERE user_id = $1 AND status = 'ACTIVE'
       LIMIT 1`,
      [userId]
    ).then((r) => r.rows?.[0]?.license_id ?? null).catch(() => null);

    return NextResponse.json({
      ok: true,
      data: {
        isFounder: true,
        membershipPlan: membership.plan === "pro" ? "Pro Beta" : "Plan Beta",
        membershipStatus: membership.estado,
        daysRemaining,
        expiresAt: expiresAt.toLocaleDateString("es-ES"),
        codeUsed: membership.codigo_beta,
        licenseKey,
        telegramUrl: "https://t.me/+carvipix_beta_test",
      },
    });
  } catch (error) {
    console.error("[CLIENT/BETA/STATUS] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "unknown error",
      data: EMPTY_RESPONSE.data,
    });
  }
}
