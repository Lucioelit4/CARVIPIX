import "server-only";

import { createHash, randomBytes } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";

const OWNER_CERTIFICATION_SOURCE = "owner_demo_certification";
const OWNER_CERTIFICATION_TABLE = "bot_mt5_owner_certifications";

type OwnerRow = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
};

type LicenseRow = {
  license_key: string;
};

type InstallationRow = {
  installation_id: string;
};

type CertificationRow = {
  id: string;
  license_id: string;
  status: string;
  signal_id: string | null;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function resolveAppPublicUrl(): string {
  return String(process.env.APP_PUBLIC_URL || "https://carvipix.com").replace(/\/$/, "");
}

function resolveOwnerName(owner: OwnerRow): string {
  return `${owner.nombre ?? ""} ${owner.apellido ?? ""}`.trim() || owner.email;
}

async function ensureCertificationTable(): Promise<void> {
  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS ${OWNER_CERTIFICATION_TABLE} (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      license_id TEXT NOT NULL UNIQUE REFERENCES bot_mt5_licenses(license_id) ON DELETE RESTRICT,
      status TEXT NOT NULL CHECK (status IN ('PROVISIONED', 'SIGNAL_CREATED', 'EXECUTED', 'CLOSED', 'REVOKED')),
      signal_id TEXT UNIQUE,
      installation_id TEXT,
      account_number TEXT,
      broker_server TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      signal_created_at TIMESTAMPTZ,
      executed_at TIMESTAMPTZ,
      closed_at TIMESTAMPTZ
    )
  `);
}

async function getOwner(userId: string): Promise<OwnerRow> {
  const result = await backendDatabase.query<OwnerRow>(
    `SELECT id, email, nombre, apellido FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const owner = result.rows[0];
  if (!owner) {
    throw new Error("Propietario no encontrado");
  }
  return owner;
}

export async function provisionOwnerBotCertification(input: { userId: string }): Promise<{
  licenseId: string;
  downloadUrl: string;
  manualUrl: string;
  emailDelivered: boolean;
}> {
  if (!backendDatabase.enabled) {
    throw new Error("La certificacion requiere base de datos de produccion");
  }

  await ensureCertificationTable();
  const owner = await getOwner(input.userId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const licenseId = await backendDatabase.withTransaction(async (client) => {
    const existing = await client.query<LicenseRow>(
      `SELECT license_key FROM bot_licenses WHERE user_id = $1 FOR UPDATE`,
      [owner.id]
    );
    const licenseKey = existing.rows[0]?.license_key || `CVPX-OWNER-${randomBytes(12).toString("hex").toUpperCase()}`;

    await client.query(
      `
      INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
      VALUES ($1, $2, $3, NULL, true, 'MT5')
      ON CONFLICT (user_id) DO UPDATE
      SET license_key = EXCLUDED.license_key,
          purchase_date = COALESCE(bot_licenses.purchase_date, EXCLUDED.purchase_date),
          expiry_date = NULL,
          active = true,
          broker_connected = 'MT5'
      `,
      [owner.id, licenseKey, now]
    );

    await client.query(
      `
      INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, created_at, activated_at, expires_at, max_installations, subscription_tier)
      VALUES ($1, $2, $3, 'ACTIVE', $4, $4, $5, 1, 'ENTERPRISE')
      ON CONFLICT (license_id) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          status = 'ACTIVE',
          activated_at = EXCLUDED.activated_at,
          expires_at = EXCLUDED.expires_at,
          max_installations = 1,
          subscription_tier = 'ENTERPRISE'
      `,
      [createId("mt5lic"), licenseKey, owner.id, now, expiresAt]
    );

    await client.query(
      `
      INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, source, updated_at)
      VALUES ($1, 'advanced', 'activo', $2, NULL, false, $3, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET plan = 'advanced', estado = 'activo', fecha_fin = NULL, renovacion_automatica = false,
          source = $3, updated_at = $2
      `,
      [owner.id, now, OWNER_CERTIFICATION_SOURCE]
    );

    await client.query(
      `UPDATE users SET plan = 'advanced', estado = 'activo', fecha_vencimiento = NULL WHERE id = $1`,
      [owner.id]
    );

    await client.query(
      `
      INSERT INTO ${OWNER_CERTIFICATION_TABLE} (id, user_id, license_id, status)
      VALUES ($1, $2, $3, 'PROVISIONED')
      ON CONFLICT (user_id) DO UPDATE
      SET license_id = EXCLUDED.license_id,
          status = CASE WHEN ${OWNER_CERTIFICATION_TABLE}.status = 'PROVISIONED' THEN 'PROVISIONED' ELSE ${OWNER_CERTIFICATION_TABLE}.status END
      `,
      [createId("ocert"), owner.id, licenseKey]
    );

    return licenseKey;
  });

  const downloadToken = randomBytes(32).toString("hex");
  await backendDatabase.query(
    `
    INSERT INTO bot_mt5_downloads (id, user_id, license_id, file_hash, download_token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `,
    [createId("mt5dl"), owner.id, licenseId, "CARVIPIX_EA_MT5_V1.ex5", downloadToken, new Date(Date.now() + 24 * 60 * 60 * 1000)]
  );

  const downloadUrl = `${resolveAppPublicUrl()}/api/bot/mt5/download?token=${encodeURIComponent(downloadToken)}`;
  const manualUrl = `${downloadUrl}&file=manual`;
  const email = await emailNotificationService.sendPaymentTransactional({
    templateId: "bot-license-delivery-ready",
    recipientEmail: owner.email,
    recipientName: resolveOwnerName(owner),
    paymentOrderId: `OWNER-CERT-${now.getTime()}`,
    amount: 0,
    currency: "USD",
    provider: "owner-certification",
    productId: "bot-carvipix-license",
    productType: "bot-license",
    licenseKey: licenseId,
    downloadUrl,
    manualUrl,
  });

  return { licenseId, downloadUrl, manualUrl, emailDelivered: email.accepted };
}

export async function createOwnerDemoCertificationSignal(input: {
  userId: string;
  licenseId: string;
  accountNumber: string;
  brokerServer: string;
  symbol: string;
  decision: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;
}): Promise<{ signalId: string; expiresAt: Date }> {
  if (!backendDatabase.enabled) {
    throw new Error("La certificacion requiere base de datos de produccion");
  }

  if (![input.entry, input.stopLoss, input.takeProfit].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Precios de certificacion invalidos");
  }
  if (input.decision === "BUY" && !(input.stopLoss < input.entry && input.takeProfit > input.entry)) {
    throw new Error("SL y TP invalidos para compra");
  }
  if (input.decision === "SELL" && !(input.stopLoss > input.entry && input.takeProfit < input.entry)) {
    throw new Error("SL y TP invalidos para venta");
  }

  await ensureCertificationTable();
  const signalId = `OWNER-DEMO-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await backendDatabase.withTransaction(async (client) => {
    const certificationResult = await client.query<CertificationRow>(
      `SELECT id, license_id, status, signal_id FROM ${OWNER_CERTIFICATION_TABLE} WHERE user_id = $1 FOR UPDATE`,
      [input.userId]
    );
    const certification = certificationResult.rows[0];
    if (!certification || certification.license_id !== input.licenseId || certification.status !== "PROVISIONED" || certification.signal_id) {
      throw new Error("La certificacion no esta disponible para una nueva senal");
    }

    const installationResult = await client.query<InstallationRow>(
      `
      SELECT installation_id
      FROM bot_mt5_installations
      WHERE user_id = $1 AND license_id = $2 AND account_number = $3 AND broker_server = $4
        AND status = 'ACTIVE' AND is_revoked = false AND last_heartbeat > NOW() - INTERVAL '2 minutes'
      LIMIT 1
      FOR UPDATE
      `,
      [input.userId, input.licenseId, input.accountNumber, input.brokerServer]
    );
    const installation = installationResult.rows[0];
    if (!installation) {
      throw new Error("La instalacion MT5 DEMO autorizada no esta activa o no coincide");
    }

    await client.query(
      `
      INSERT INTO bot_mt5_signals (id, signal_id, analysis_id, license_id, symbol, decision, entry, stop_loss, take_profit, risk_reward, signature, expires_at, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1.5, $10, $11, 'PENDING', NOW())
      `,
      [createId("mtsig"), signalId, "OWNER-DEMO-CERTIFICATION", input.licenseId, input.symbol, input.decision, input.entry, input.stopLoss, input.takeProfit, createHash("sha256").update(signalId).digest("hex"), expiresAt]
    );

    await client.query(
      `
      UPDATE ${OWNER_CERTIFICATION_TABLE}
      SET status = 'SIGNAL_CREATED', signal_id = $2, installation_id = $3, account_number = $4, broker_server = $5, signal_created_at = NOW()
      WHERE id = $1
      `,
      [certification.id, signalId, installation.installation_id, input.accountNumber, input.brokerServer]
    );
  });

  return { signalId, expiresAt };
}