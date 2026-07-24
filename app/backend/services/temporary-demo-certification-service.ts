import "server-only";

import { createHash, randomBytes } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";

const TABLE = "bot_mt5_temporary_certifications";
const ACCOUNT_NUMBER = "1715547693";
const BROKER_SERVER = "OANDA_Global-Demo-1";
const SYMBOL = "XAUUSD.sml";

type CertificationRow = {
  id: string;
  user_id: string;
  license_id: string;
  installation_id: string | null;
  status: string;
  signal_id: string | null;
  expires_at: Date;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function publicUrl(): string {
  return String(process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "");
}

async function ensureTable(): Promise<void> {
  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      license_id TEXT NOT NULL UNIQUE REFERENCES bot_mt5_licenses(license_id) ON DELETE CASCADE,
      account_number TEXT NOT NULL,
      broker_server TEXT NOT NULL,
      symbol TEXT NOT NULL,
      installation_id TEXT UNIQUE,
      signal_id TEXT UNIQUE,
      status TEXT NOT NULL CHECK (status IN ('READY', 'CONNECTED', 'SIGNAL_ISSUED', 'RECEIVED_MARKET_CLOSED', 'REVOKED', 'EXPIRED')),
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      connected_at TIMESTAMPTZ,
      signal_issued_at TIMESTAMPTZ,
      received_at TIMESTAMPTZ,
      revoke_reason TEXT
    )
  `);
}

async function loadCertification(licenseId: string): Promise<CertificationRow | null> {
  await ensureTable();
  const result = await backendDatabase.query<CertificationRow>(
    `SELECT id, user_id, license_id, installation_id, status, signal_id, expires_at FROM ${TABLE} WHERE license_id = $1 LIMIT 1`,
    [licenseId]
  );
  return result.rows[0] ?? null;
}

export async function provisionTemporaryDemoCertification(userId: string): Promise<{
  licenseId: string;
  downloadUrl: string;
  manualUrl: string;
  expiresAt: Date;
}> {
  if (!backendDatabase.enabled) throw new Error("La certificacion temporal requiere base de datos");
  await ensureTable();

  const existingResult = await backendDatabase.query<CertificationRow>(
    `SELECT id, user_id, license_id, installation_id, status, signal_id, expires_at FROM ${TABLE} WHERE user_id = $1 AND status IN ('READY', 'CONNECTED', 'SIGNAL_ISSUED', 'RECEIVED_MARKET_CLOSED') AND expires_at > NOW() LIMIT 1`,
    [userId]
  );
  const existing = existingResult.rows[0];
  const licenseId = existing?.license_id || `CVPX-TEMP-${randomBytes(12).toString("hex").toUpperCase()}`;
  const expiresAt = existing?.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (!existing) {
    await backendDatabase.withTransaction(async (client) => {
      await client.query(
        `INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, created_at, activated_at, expires_at, max_installations, subscription_tier)
         VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW(), $4, 1, 'BASIC')`,
        [createId("mt5temp"), licenseId, userId, expiresAt]
      );
      await client.query(
        `INSERT INTO ${TABLE} (id, user_id, license_id, account_number, broker_server, symbol, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'READY', $7)`,
        [createId("temp-cert"), userId, licenseId, ACCOUNT_NUMBER, BROKER_SERVER, SYMBOL, expiresAt]
      );
    });
  }

  const token = randomBytes(32).toString("hex");
  await backendDatabase.query(
    `INSERT INTO bot_mt5_downloads (id, user_id, license_id, file_hash, download_token, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [createId("temp-download"), userId, licenseId, "CARVIPIX_EA_MT5_V1.ex5", token, new Date(Date.now() + 24 * 60 * 60 * 1000)]
  );

  const downloadUrl = `${publicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(token)}`;
  return { licenseId, downloadUrl, manualUrl: `${downloadUrl}&file=manual`, expiresAt };
}

export async function bindTemporaryDemoInstallation(input: {
  userId: string;
  licenseId: string;
  installationId: string;
  accountNumber: number;
  brokerServer: string;
}): Promise<void> {
  const certification = await loadCertification(input.licenseId);
  if (!certification) return;
  if (
    certification.user_id !== input.userId ||
    input.accountNumber !== Number(ACCOUNT_NUMBER) ||
    input.brokerServer !== BROKER_SERVER ||
    certification.expires_at <= new Date() ||
    !["READY", "CONNECTED"].includes(certification.status) ||
    (certification.installation_id && certification.installation_id !== input.installationId)
  ) {
    throw new Error("La instalacion no coincide con la certificacion temporal autorizada");
  }

  await backendDatabase.query(
    `UPDATE ${TABLE} SET installation_id = $2, status = 'CONNECTED', connected_at = COALESCE(connected_at, NOW()) WHERE id = $1`,
    [certification.id, input.installationId]
  );
}

export async function issueTemporaryMarketClosedSignal(input: {
  userId: string;
  licenseId: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
}): Promise<{ signalId: string; expiresAt: Date }> {
  if (![input.entry, input.stopLoss, input.takeProfit].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Precios de certificacion invalidos");
  }
  if (!(input.stopLoss < input.entry && input.takeProfit > input.entry)) {
    throw new Error("SL y TP invalidos para la certificacion BUY");
  }

  const signalId = `TEMP-MARKET-CLOSED-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await backendDatabase.withTransaction(async (client) => {
    const result = await client.query<CertificationRow>(
      `SELECT id, user_id, license_id, installation_id, status, signal_id, expires_at FROM ${TABLE} WHERE license_id = $1 FOR UPDATE`,
      [input.licenseId]
    );
    const certification = result.rows[0];
    if (
      !certification || certification.user_id !== input.userId || certification.status !== "CONNECTED" ||
      !certification.installation_id || certification.signal_id || certification.expires_at <= new Date()
    ) {
      throw new Error("La certificacion temporal no esta lista para emitir una senal");
    }

    await client.query(
      `INSERT INTO bot_mt5_signals (id, signal_id, analysis_id, license_id, symbol, decision, entry, stop_loss, take_profit, risk_reward, signature, expires_at, status, created_at)
       VALUES ($1, $2, 'TEMPORARY_MARKET_CLOSED_CERTIFICATION', $3, $4, 'BUY', $5, $6, $7, 1.5, $8, $9, 'PENDING', NOW())`,
      [createId("temp-signal"), signalId, input.licenseId, SYMBOL, input.entry, input.stopLoss, input.takeProfit, createHash("sha256").update(signalId).digest("hex"), expiresAt]
    );
    await client.query(
      `UPDATE ${TABLE} SET status = 'SIGNAL_ISSUED', signal_id = $2, signal_issued_at = NOW() WHERE id = $1`,
      [certification.id, signalId]
    );
  });

  return { signalId, expiresAt };
}

export async function getTemporaryCertificationMode(licenseId: string, signalId: string): Promise<string | null> {
  const certification = await loadCertification(licenseId);
  return certification?.signal_id === signalId && certification.status === "SIGNAL_ISSUED"
    ? "RECEIPT_ONLY_MARKET_CLOSED"
    : null;
}

export async function recordTemporaryMarketClosedReceipt(input: { licenseId: string; signalId: string; installationId: string }): Promise<boolean> {
  const certification = await loadCertification(input.licenseId);
  if (!certification || certification.signal_id !== input.signalId || certification.installation_id !== input.installationId || certification.status !== "SIGNAL_ISSUED") {
    return false;
  }
  await backendDatabase.query(
    `UPDATE ${TABLE} SET status = 'RECEIVED_MARKET_CLOSED', received_at = NOW() WHERE id = $1`,
    [certification.id]
  );
  return true;
}

export async function revokeTemporaryDemoCertification(userId: string, licenseId: string): Promise<void> {
  const certification = await loadCertification(licenseId);
  if (!certification || certification.user_id !== userId) throw new Error("Certificacion temporal no encontrada");
  await backendDatabase.withTransaction(async (client) => {
    await client.query(`UPDATE ${TABLE} SET status = 'REVOKED', revoke_reason = 'OWNER_REQUEST', expires_at = NOW() WHERE id = $1`, [certification.id]);
    await client.query(`UPDATE bot_mt5_licenses SET status = 'REVOKED', expires_at = NOW() WHERE license_id = $1`, [licenseId]);
  });
}