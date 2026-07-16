/**
 * POST /api/beta/report
 * Registra un reporte de problema de un fundador
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";

const VALID_CATEGORIES = [
  "instalacion", "plataforma", "telegram", "bot",
  "alertas", "licencia", "pago", "rendimiento", "otro",
] as const;

const VALID_PRIORITIES = ["baja", "media", "alta", "critica"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      category?: string;
      priority?: string;
      description?: string;
      screenshot_url?: string;
      user_id?: string;
      user_email?: string;
    };

    const category = String(body.category ?? "").toLowerCase();
    const priority = String(body.priority ?? "media").toLowerCase();
    const description = String(body.description ?? "").trim();
    const user_id = String(body.user_id ?? "").trim() || null;
    const user_email = String(body.user_email ?? "").trim().toLowerCase() || null;
    const screenshot_url = String(body.screenshot_url ?? "").trim() || null;

    if (!description || description.length < 10) {
      return NextResponse.json({ ok: false, error: "Descripción muy corta (mín. 10 caracteres)" }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json({ ok: false, error: "Categoría inválida" }, { status: 400 });
    }

    if (!VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number])) {
      return NextResponse.json({ ok: false, error: "Prioridad inválida" }, { status: 400 });
    }

    const id = randomUUID();

    if (backendDatabase.enabled) {
      await backendDatabase.query(
        `INSERT INTO beta_reports (id, user_id, user_email, category, priority, description, screenshot_url, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'abierto', NOW())`,
        [id, user_id, user_email, category, priority, description, screenshot_url]
      );

      // Track the event
      await backendDatabase.query(
        `INSERT INTO beta_events (id, user_id, user_email, event_type, module, metadata, created_at)
         VALUES ($1, $2, $3, 'reporte', $4, $5, NOW())`,
        [randomUUID(), user_id, user_email, category, JSON.stringify({ report_id: id, priority })]
      );
    }

    return NextResponse.json({
      ok: true,
      report_id: id,
      message: "Reporte registrado. El equipo lo revisará pronto.",
    });
  } catch (error) {
    console.error("[BETA/REPORT]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
