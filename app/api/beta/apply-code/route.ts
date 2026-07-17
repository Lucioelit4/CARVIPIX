/**
 * POST /api/beta/apply-code
 * Flujo TRANSACCIÓN REAL — Aplica código FOUNDER de forma atómica:
 *
 * PASOS ATOMICOS:
 * 1. BEGIN TRANSACTION
 * 2. Validar código (no agotado, activo, no expirado)
 * 3. INSERT orden en tabla orders
 * 4. INSERT uso en beta_code_uses
 * 5. UPDATE used_count en beta_invitation_codes
 * 6. INSERT membresía FOUNDERS_BETA (90 días)
 * 7. INSERT licencia EA en bot_licenses (CORRECTED)
 * 8. INSERT evento (para email backend)
 * 9. INSERT pago $0 para auditoría (sin metadata column)
 * 10. COMMIT TRANSACTION
 *
 * SI CUALQUIER PASO FALLA → ROLLBACK
 * NO hay catch silenciosos - todos los errores se propagan
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { randomUUID } from "crypto";
import { initializeBetaSchema } from "@/app/backend/schema/beta-schema";

async function ensureSchema() {
  await initializeBetaSchema();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    code?: string;
    product_id?: string;
    user_id?: string;
    user_email?: string;
  };

  const code = String(body.code ?? "").trim().toUpperCase();
  const product_id = String(body.product_id ?? "").trim() || "bot-carvipix-license";
  const user_id = String(body.user_id ?? "").trim() || null;
  const user_email = String(body.user_email ?? "").trim().toLowerCase() || null;

  // ── Validación de entrada ────────────────────────────────────────────
  if (!code) {
    return NextResponse.json({ ok: false, error: "Código requerido" }, { status: 400 });
  }

  if (!user_id) {
    return NextResponse.json({ ok: false, error: "Usuario requerido" }, { status: 400 });
  }

  // ── Fallback para desarrollo sin BD ──────────────────────────────────
  if (!backendDatabase.enabled) {
    const isValid = /^FOUNDER-\d{3}$/.test(code);
    if (!isValid) return NextResponse.json({ ok: false, error: "Código inválido" }, { status: 403 });
    return NextResponse.json({
      ok: true,
      order_id: `BETA-${code}-${Date.now()}`,
      license_id: `DEMO-${randomUUID().toString().split('-')[0].toUpperCase()}`,
      message: "Acceso beta activado (modo desarrollo)",
    });
  }

  try {
    await ensureSchema();

    // ── TRANSACCIÓN ATÓMICA ──────────────────────────────────────────────
    const result = await backendDatabase.withTransaction(async (client) => {
      // ── 1. VALIDAR CÓDIGO ────────────────────────────────────────────────
      const codeValidation = await client.query(
        `SELECT code, max_uses, used_count, is_active, expires_at
         FROM beta_invitation_codes WHERE code = $1 LIMIT 1`,
        [code]
      );

      if (codeValidation.rows.length === 0) {
        throw new Error(`Código no encontrado: ${code}`);
      }

      const codeRow = codeValidation.rows[0];

      if (!codeRow.is_active) {
        throw new Error("Código inactivo");
      }

      if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
        throw new Error("Código expirado");
      }

      if (codeRow.used_count >= codeRow.max_uses) {
        throw new Error("Código agotado");
      }

      // ── 2-3. CREAR ORDEN + REGISTRAR USO ─────────────────────────────────
      const orderId = `BETA-${code}-${Date.now()}`;
      const useId = randomUUID();

      // INSERT orden
      const orderInsert = await client.query(
        `INSERT INTO orders (id, user_id, product_id, quantity, total, currency, status, payment_id, fecha_creacion)
         VALUES ($1, $2, $3, 1, 0, 'USD', 'completed', $4, NOW())
         RETURNING id`,
        [orderId, user_id, product_id, code]
      );

      if (orderInsert.rows.length === 0) {
        throw new Error("Order insert returned no rows");
      }

      // INSERT uso
      await client.query(
        `INSERT INTO beta_code_uses (id, code, user_id, user_email, checkout_id, discount_applied, used_at)
         VALUES ($1, $2, $3, $4, $5, 100.0, NOW())`,
        [useId, code, user_id, user_email, orderId]
      );

      // ── 4. UPDATE used_count ─────────────────────────────────────────────
      const updateResult = await client.query(
        `UPDATE beta_invitation_codes SET used_count = used_count + 1 WHERE code = $1
         RETURNING used_count, max_uses`,
        [code]
      );

      if (updateResult.rows.length === 0) {
        throw new Error("Code update returned no rows");
      }

      // ── 5. INSERT MEMBRESÍA FOUNDERS_BETA ────────────────────────────────
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await client.query(
        `INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, origen, codigo_beta)
         VALUES ($1, $2, $3, NOW(), $4, false, $5, $6)
         ON CONFLICT (user_id) DO UPDATE
           SET plan = EXCLUDED.plan, estado = EXCLUDED.estado, fecha_fin = EXCLUDED.fecha_fin, 
               renovacion_automatica = EXCLUDED.renovacion_automatica, origen = EXCLUDED.origen, codigo_beta = EXCLUDED.codigo_beta
         RETURNING user_id`,
        [user_id, 'PRO', 'activo', expiresAt, 'FOUNDERS_BETA', code]
      );

      // ── 6. INSERT LICENCIA EA EN bot_licenses ─────────────────────────
      const licenseKey = `BOTKEY-${randomUUID().toString().split('-')[0].toUpperCase()}-${Date.now()}`;
      const licenseExpiry = new Date();
      licenseExpiry.setDate(licenseExpiry.getDate() + 90);

      const licenseInsert = await client.query(
        `INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
         VALUES ($1, $2, NOW(), $3, true, 'pending')
         ON CONFLICT (user_id) DO UPDATE
           SET license_key = EXCLUDED.license_key, purchase_date = NOW(), expiry_date = EXCLUDED.expiry_date, active = true
         RETURNING license_key, user_id`,
        [user_id, licenseKey, licenseExpiry]
      );

      if (licenseInsert.rows.length === 0) {
        throw new Error("License insert returned no rows");
      }

      // ── 7. INSERT EVENTO PARA EMAIL ──────────────────────────────────────
      await client.query(
        `INSERT INTO beta_events (id, user_id, user_email, event_type, module, metadata, created_at)
         VALUES ($1, $2, $3, 'license_created', 'checkout', $4, NOW())`,
        [
          randomUUID(),
          user_id,
          user_email,
          JSON.stringify({
            order_id: orderId,
            license_key: licenseKey,
            code: code,
            expires_at: licenseExpiry.toISOString(),
            action: "send_welcome_email",
          }),
        ]
      );

      // ── 8. INSERT PAGO $0 ────────────────────────────────────────────────
      await client.query(
        `INSERT INTO payments (id, user_id, product_id, amount, currency, status, method, reference_id, fecha)
         VALUES ($1, $2, $3, 0, 'USD', 'completed', 'founder_code', $4, NOW())`,
        [
          randomUUID(),
          user_id,
          product_id,
          orderId,
        ]
      );

      // ✅ Retornar datos verificados
      return {
        ok: true,
        order_id: orderId,
        license_key: licenseKey,
        expires_at: licenseExpiry.toISOString(),
      };
    });

    return NextResponse.json({
      ...result,
      message: "✅ Compra completada — Orden creada, Licencia activada, Email pendiente",
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLog = {
      error: errorMessage,
      code,
      user_id,
      user_email,
      operation: "beta_apply_code_transaction",
      timestamp: new Date().toISOString(),
    };

    console.error("[BETA-APPLY-CODE-ERROR]", errorLog);

    // ── Retornar error claro SIN silenciarlo ─────────────────────────────
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo procesar la compra",
        details: errorMessage,
        debug: process.env.NODE_ENV === "development" ? errorLog : undefined,
      },
      { status: 500 }
    );
  }
}
