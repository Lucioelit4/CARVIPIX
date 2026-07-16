/**
 * POST /api/beta/event
 * Registra un evento de métricas del programa de fundadores
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";

const VALID_EVENTS = [
  "registro", "login", "checkout", "activacion", "descarga",
  "instalacion", "conexion_bot", "telegram", "operacion_demo",
  "reporte", "satisfaccion", "codigo_aplicado",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      event_type?: string;
      module?: string;
      user_id?: string;
      user_email?: string;
      metadata?: Record<string, unknown>;
    };

    const event_type = String(body.event_type ?? "").toLowerCase();
    const module_name = String(body.module ?? "").toLowerCase() || null;
    const user_id = String(body.user_id ?? "").trim() || null;
    const user_email = String(body.user_email ?? "").trim().toLowerCase() || null;
    const metadata = body.metadata ?? null;

    if (!VALID_EVENTS.includes(event_type as typeof VALID_EVENTS[number])) {
      return NextResponse.json({ ok: false, error: "event_type inválido" }, { status: 400 });
    }

    if (backendDatabase.enabled) {
      await backendDatabase.query(
        `INSERT INTO beta_events (id, user_id, user_email, event_type, module, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [randomUUID(), user_id, user_email, event_type, module_name, metadata ? JSON.stringify(metadata) : null]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[BETA/EVENT]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
