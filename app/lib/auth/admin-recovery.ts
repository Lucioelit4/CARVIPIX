import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";

const ADMIN_RECOVERY_TOKEN_TTL_SECONDS = 60 * 10;

type AdminRecoveryPayload = {
  exp: number;
  jti: string;
  purpose: "admin-recovery";
};

const consumedLocalTokens = new Set<string>();

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSigningSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("CARVIPIX_STARTUP_BLOCKED: Missing required environment variable: ADMIN_SECRET");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

export function getAdminRecoveryEmail(): string | null {
  const email = process.env.ADMIN_RECOVERY_EMAIL?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  return email;
}

export function createAdminRecoveryToken(): string {
  const payload: AdminRecoveryPayload = {
    exp: Date.now() + ADMIN_RECOVERY_TOKEN_TTL_SECONDS * 1000,
    jti: randomBytes(16).toString("hex"),
    purpose: "admin-recovery",
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminRecoveryToken(token: string): boolean {
  const raw = token.trim();
  if (!raw) {
    return false;
  }

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const encodedPayload = raw.slice(0, separator);
  const providedSignature = raw.slice(separator + 1);
  const expectedSignature = sign(encodedPayload);

  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminRecoveryPayload;
    return Boolean(payload?.purpose === "admin-recovery" && payload?.exp && payload?.jti && Date.now() < payload.exp);
  } catch {
    return false;
  }
}

export async function consumeAdminRecoveryToken(token: string): Promise<boolean> {
  if (!verifyAdminRecoveryToken(token)) {
    return false;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (!backendDatabase.enabled) {
    if (consumedLocalTokens.has(tokenHash)) {
      return false;
    }
    consumedLocalTokens.add(tokenHash);
    return true;
  }

  await backendDatabase.query(`
    CREATE TABLE IF NOT EXISTS admin_recovery_token_uses (
      token_hash TEXT PRIMARY KEY,
      consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const result = await backendDatabase.query<{ token_hash: string }>(
    `
    INSERT INTO admin_recovery_token_uses (token_hash)
    VALUES ($1)
    ON CONFLICT (token_hash) DO NOTHING
    RETURNING token_hash
    `,
    [tokenHash]
  );

  return Boolean(result.rows[0]);
}
