/**
 * Admin API — Programa Fundadores Beta
 * GET  /api/admin/beta          — Estadísticas y datos del panel
 * POST /api/admin/beta          — Crear código, resolver reporte
 */
import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { initializeBetaSchema } from "@/app/backend/schema/beta-schema";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

async function ensureSchema() {
  try {
    await initializeBetaSchema();
  } catch {
    // Schema may already exist
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({
      ok: true,
      data: {
        codes: [], reports: [], events: [],
        stats: { registered: 0, active: 0, installed: 0, bot_active: 0, open_reports: 0, resolved_reports: 0 },
        founders: [],
      },
    });
  }

  await ensureSchema();

  const [codesResult, reportsResult, statsResult, foundersResult] = await Promise.all([
    backendDatabase.query(
      `SELECT code, max_uses, used_count, is_active, notes, created_at, expires_at
       FROM beta_invitation_codes ORDER BY created_at DESC`
    ),
    backendDatabase.query(
      `SELECT id, user_email, category, priority, description, status, created_at, resolved_at
       FROM beta_reports ORDER BY created_at DESC LIMIT 200`
    ),
    backendDatabase.query<{ event_type: string; cnt: string }>(
      `SELECT event_type, COUNT(*)::text AS cnt FROM beta_events GROUP BY event_type`
    ),
    backendDatabase.query<{ user_email: string; events: string }>(
      `SELECT user_email, json_agg(DISTINCT event_type) AS events
       FROM beta_events WHERE user_email IS NOT NULL
       GROUP BY user_email ORDER BY MIN(created_at) ASC LIMIT 20`
    ),
  ]);

  const eventCounts = Object.fromEntries(
    statsResult.rows.map((r) => [r.event_type, parseInt(r.cnt, 10)])
  );

  const openReports = (reportsResult.rows as Array<{ status: string }>).filter((r) => r.status === "abierto").length;
  const resolvedReports = (reportsResult.rows as Array<{ status: string }>).filter((r) => r.status === "resuelto").length;

  return NextResponse.json({
    ok: true,
    data: {
      codes: codesResult.rows,
      reports: reportsResult.rows,
      stats: {
        registered: eventCounts["registro"] ?? 0,
        logins: eventCounts["login"] ?? 0,
        checkouts: eventCounts["checkout"] ?? 0,
        installed: eventCounts["instalacion"] ?? 0,
        bot_active: eventCounts["conexion_bot"] ?? 0,
        telegram_active: eventCounts["telegram"] ?? 0,
        demo_trades: eventCounts["operacion_demo"] ?? 0,
        open_reports: openReports,
        resolved_reports: resolvedReports,
        total_events: Object.values(eventCounts).reduce((a, b) => a + b, 0),
      },
      founders: foundersResult.rows,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ ok: false, error: "DB no configurada" }, { status: 409 });
  }

  await ensureSchema();

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    code?: string;
    max_uses?: number;
    notes?: string;
    expires_in_days?: number;
    report_id?: string;
    status?: string;
    admin_notes?: string;
  };

  const action = String(body.action ?? "").trim();

  // ─── Crear código de invitación ───────────────────────────────────────────
  if (action === "create_code") {
    const code = String(body.code ?? "").trim().toUpperCase() ||
      `FOUNDER-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const max_uses = Math.max(1, parseInt(String(body.max_uses ?? "1"), 10));
    const notes = String(body.notes ?? "").trim() || null;
    const expires_at = body.expires_in_days
      ? new Date(Date.now() + body.expires_in_days * 86400000)
      : null;

    // Validate format
    if (!/^FOUNDER-[A-Z0-9]{2,10}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Formato inválido. Use FOUNDER-XXXX" }, { status: 400 });
    }

    await backendDatabase.query(
      `INSERT INTO beta_invitation_codes (id, code, max_uses, notes, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO NOTHING`,
      [randomUUID(), code, max_uses, notes, expires_at]
    );

    return NextResponse.json({ ok: true, code, max_uses, notes });
  }

  // ─── Desactivar código ────────────────────────────────────────────────────
  if (action === "deactivate_code") {
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, error: "code requerido" }, { status: 400 });

    await backendDatabase.query(
      `UPDATE beta_invitation_codes SET is_active = false WHERE code = $1`, [code]
    );
    return NextResponse.json({ ok: true });
  }

  // ─── Actualizar estado de reporte ─────────────────────────────────────────
  if (action === "resolve_report") {
    const report_id = String(body.report_id ?? "").trim();
    const status = String(body.status ?? "resuelto").trim();
    const admin_notes = String(body.admin_notes ?? "").trim() || null;

    if (!report_id) return NextResponse.json({ ok: false, error: "report_id requerido" }, { status: 400 });

    await backendDatabase.query(
      `UPDATE beta_reports
       SET status = $2, admin_notes = $3, resolved_at = CASE WHEN $2 = 'resuelto' THEN NOW() ELSE resolved_at END
       WHERE id = $1`,
      [report_id, status, admin_notes]
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Acción no reconocida" }, { status: 400 });
}
