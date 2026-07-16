/**
 * CARVIPIX Beta Schema — Programa Fundadores V1
 *
 * Tablas: beta_invitation_codes, beta_code_uses, beta_events, beta_reports
 * Alters: memberships (agrega origen, codigo_beta)
 */

import { backendDatabase } from "../core/database";

export async function initializeBetaSchema(): Promise<void> {
  if (!backendDatabase.enabled) return;

  // ── Agregar columnas a memberships si no existen ──────────────────────
  await backendDatabase.query(`
    ALTER TABLE memberships
    ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'regular',
    ADD COLUMN IF NOT EXISTS codigo_beta TEXT
  `).catch(() => {
    // May fail if columns already exist
  });

  // ── Tablas beta ────────────────────────────────────────────────────────
  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS beta_invitation_codes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL DEFAULT 'admin',
      max_uses INT NOT NULL DEFAULT 1,
      used_count INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    )
  `);

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS beta_code_uses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT,
      checkout_id TEXT,
      discount_applied DECIMAL(10,4) NOT NULL DEFAULT 100.0,
      used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS beta_events (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      user_email TEXT,
      event_type TEXT NOT NULL,
      module TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS beta_reports (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      user_email TEXT,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'media',
      description TEXT NOT NULL,
      screenshot_url TEXT,
      status TEXT NOT NULL DEFAULT 'abierto',
      admin_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `);

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      recipient TEXT NOT NULL,
      template TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      result TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await backendDatabase.query(`CREATE INDEX IF NOT EXISTS idx_beta_codes_code ON beta_invitation_codes(code)`);
  await backendDatabase.query(`CREATE INDEX IF NOT EXISTS idx_beta_events_user ON beta_events(user_id)`);
  await backendDatabase.query(`CREATE INDEX IF NOT EXISTS idx_beta_events_type ON beta_events(event_type)`);
  await backendDatabase.query(`CREATE INDEX IF NOT EXISTS idx_beta_reports_status ON beta_reports(status)`);
  await backendDatabase.query(`CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient)`);

  console.log("[BETA] Schema initialized");
}
