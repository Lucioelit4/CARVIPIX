/**
 * POST /api/beta/apply-code
 * Aplica un código de invitación de fundador:
 * 1. Valida el código
 * 2. Marca como usado
 * 3. Activa membresía FOUNDERS_BETA (90 días, marca clara)
 * 4. Crea licencia EA (DEMO_ONLY=true)
 * 5. Registra evento de correo para backend
 * 6. Registra evento
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { initializeBetaSchema } from "@/app/backend/schema/beta-schema";

async function ensureSchema() {
  try { await initializeBetaSchema(); } catch { /* may already exist */ }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      code?: string;
      product_id?: string;
      user_id?: string;
      user_email?: string;
    };

    const code = String(body.code ?? "").trim().toUpperCase();
    const product_id = String(body.product_id ?? "").trim() || "beta-founder";
    const user_id = String(body.user_id ?? "").trim() || null;
    const user_email = String(body.user_email ?? "").trim().toLowerCase() || null;

    if (!code) {
      return NextResponse.json({ ok: false, error: "Código requerido" }, { status: 400 });
    }

    // ── Sin BD: fallback para desarrollo ─────────────────────────────────
    if (!backendDatabase.enabled) {
      const isValid = /^FOUNDER-[A-Z0-9]{2,10}$/.test(code);
      if (!isValid) return NextResponse.json({ ok: false, error: "Código inválido" }, { status: 403 });
      return NextResponse.json({
        ok: true,
        order_id: `BETA-${code}-${Date.now()}`,
        message: "Acceso beta activado (modo desarrollo)",
      });
    }

    await ensureSchema();

    // ── Validar código ────────────────────────────────────────────────────
    const codeResult = await backendDatabase.query<{
      code: string;
      max_uses: number;
      used_count: number;
      is_active: boolean;
      expires_at: Date | null;
    }>(
      `SELECT code, max_uses, used_count, is_active, expires_at
       FROM beta_invitation_codes WHERE code = $1 LIMIT 1`,
      [code]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Código no encontrado" }, { status: 404 });
    }

    const row = codeResult.rows[0];

    if (!row.is_active) {
      return NextResponse.json({ ok: false, error: "Código inactivo" }, { status: 403 });
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: "Código expirado" }, { status: 403 });
    }
    if (row.used_count >= row.max_uses) {
      return NextResponse.json({ ok: false, error: "Código agotado" }, { status: 403 });
    }

    // ── Registrar uso ─────────────────────────────────────────────────────
    const useId = randomUUID();
    const orderId = `BETA-${code}-${Date.now()}`;

    await backendDatabase.query(
      `INSERT INTO beta_code_uses (id, code, user_id, user_email, checkout_id, discount_applied, used_at)
       VALUES ($1, $2, $3, $4, $5, 100.0, NOW())`,
      [useId, code, user_id, user_email, orderId]
    );

    // ── Incrementar usado_count ───────────────────────────────────────────
    await backendDatabase.query(
      `UPDATE beta_invitation_codes SET used_count = used_count + 1 WHERE code = $1`,
      [code]
    );

    // ── Activar membresía FOUNDERS_BETA directamente (si user_id conocido) ───
    if (user_id) {
      console.log(`[BETA] Creating membership for user_id: ${user_id}`);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90); // 90 días de acceso beta

      // ── Upsert membership con marca FOUNDERS_BETA ─────────────────────
      // Note: memberships has user_id as PRIMARY KEY (no 'id' column)
      try {
        await backendDatabase.query(
          `INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, origen, codigo_beta)
           VALUES ($1, $2, $3, NOW(), $4, false, $5, $6)
           ON CONFLICT (user_id) DO UPDATE
             SET plan = EXCLUDED.plan, estado = EXCLUDED.estado, fecha_fin = EXCLUDED.fecha_fin, 
                 renovacion_automatica = EXCLUDED.renovacion_automatica, origen = EXCLUDED.origen, codigo_beta = EXCLUDED.codigo_beta`,
          [user_id, 'pro', 'activo', expiresAt, 'FOUNDERS_BETA', code]
        );
        console.log(`[BETA] Membership created successfully for ${user_id}`);
      } catch (err) {
        console.error(`[BETA] Membresía insert/update falló:`, err instanceof Error ? err.message : err);
      }
    } else {
      console.log(`[BETA] user_id no proporcionado, no se creará membresía`);
    }

    // ── Crear licencia EA automáticamente (DEMO_ONLY=true) ────────────
    if (user_id) {
      const licenseId = `BETA-${randomUUID().toString().split('-')[0].toUpperCase()}-${Date.now()}`;
      const licenseExpiresAt = new Date();
      licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 90);

      await backendDatabase.query(
        `INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, expires_at, max_installations, subscription_tier, activated_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6, NOW())
         ON CONFLICT (license_id) DO NOTHING`,
        [
          randomUUID(),
          licenseId,
          user_id,
          'ACTIVE',
          licenseExpiresAt,
          'BASIC' // Demo license
        ]
      ).catch((err) => {
        console.warn("[BETA] MT5 Licencia insert falló:", err);
      });
    }

    // ── Registrar evento de correo a enviar (para backend service) ─────
    if (user_id) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      
      await backendDatabase.query(
        `INSERT INTO beta_events (id, user_id, user_email, event_type, module, metadata, created_at)
         VALUES ($1, $2, $3, 'email_sent', 'founder_welcome', $4, NOW())`,
        [randomUUID(), user_id, user_email, JSON.stringify({
          subject: '🎯 Bienvenido al Programa Fundadores CARVIPIX',
          expiresAt: expiresAt.toLocaleDateString("es-ES"),
        })]
      ).catch(() => { /* non-critical */ });

      // ── Crear record de pago $0 para auditoría ────────────────────────
      await backendDatabase.query(
        `INSERT INTO payments (id, user_id, product_id, amount, currency, status, method, metadata, fecha)
         VALUES ($1, $2, $3, 0, 'USD', 'completed', 'founder_code_zero_value', $4, NOW())`,
        [randomUUID(), user_id, product_id, JSON.stringify({ order_id: orderId, codigo: code, tipo: 'BETA_FOUNDER', ingresos: false })]
      ).catch((err) => {
        console.warn("[BETA] Pago $0 insert falló:", err);
      });
    }

    // ── Registrar evento ──────────────────────────────────────────────────
    await backendDatabase.query(
      `INSERT INTO beta_events (id, user_id, user_email, event_type, module, metadata, created_at)
       VALUES ($1, $2, $3, 'codigo_aplicado', 'checkout', $4, NOW())`,
      [randomUUID(), user_id, user_email, JSON.stringify({ code, product_id, order_id: orderId })]
    ).catch(() => { /* non-critical */ });

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      message: "¡Acceso Beta activado! Bienvenido al Programa Fundadores.",
    });
  } catch (error) {
    console.error("[BETA/APPLY-CODE]", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
