import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import { hashPassword, verifyPassword } from "@/app/lib/auth/server";

const ADMIN_ACCESS_CODE_ROW_ID = "primary";

async function ensureTable(): Promise<void> {
  if (!backendDatabase.enabled) {
    return;
  }

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS admin_security_settings (
      id TEXT PRIMARY KEY,
      access_code_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function verifyAdminAccessCode(candidateCode: string): Promise<boolean> {
  if (!backendDatabase.enabled) {
    return false;
  }

  await ensureTable();
  const result = await backendDatabase.query<{ access_code_hash: string }>(
    `SELECT access_code_hash FROM admin_security_settings WHERE id = $1 LIMIT 1`,
    [ADMIN_ACCESS_CODE_ROW_ID]
  );

  const row = result.rows[0];
  if (!row?.access_code_hash) {
    return false;
  }

  return verifyPassword(candidateCode, row.access_code_hash);
}

export async function setAdminAccessCode(newCode: string): Promise<void> {
  if (!backendDatabase.enabled) {
    throw new Error("La base de datos no está disponible para actualizar el código admin.");
  }

  await ensureTable();
  const hash = hashPassword(newCode);

  await backendDatabase.query(
    `
    INSERT INTO admin_security_settings (id, access_code_hash, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (id)
    DO UPDATE SET access_code_hash = EXCLUDED.access_code_hash, updated_at = NOW()
    `,
    [ADMIN_ACCESS_CODE_ROW_ID, hash]
  );
}
