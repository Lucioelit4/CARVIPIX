import { createHash, randomUUID } from "crypto";
import type { PoolClient } from "pg";

import { backendDatabase } from "@/app/backend/core/database";
import { ensureFounderAccessSchema } from "./schema";
import { generateFounderCode, hashFounderCode } from "./security";
import { resolveFounderCodeClaim } from "./policy";
import {
  FOUNDER_ACCESS_SOURCE,
  FOUNDER_CODE_LIMIT,
  FOUNDER_ENTITLEMENTS,
  FOUNDER_LICENSE_TYPE,
  isFounderAccessSnapshotActive,
  isFounderAccessEnabled,
  normalizeFounderEmail,
  type FounderAccessStatus,
  type FounderCodeStatus,
} from "./types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

type FounderCodeRow = {
  id: string;
  code_hash: string;
  status: FounderCodeStatus;
  assigned_email: string;
  redeemed_by_user_id: string | null;
  redeemed_at: Date | null;
  revoked_at: Date | null;
  replacement_count: number;
  created_at: Date;
  updated_at: Date;
};

export type FounderAdminCode = Omit<FounderCodeRow, "code_hash">;

export type FounderAccessSnapshot = {
  userId: string;
  codeId: string;
  status: FounderAccessStatus;
  activatedAt: Date;
  entitlements: string[];
  licenseId: string | null;
  licenseStatus: "ACTIVE" | "REVOKED" | "BLOCKED" | null;
};

export type FounderActivationResult =
  | { ok: true; status: "ACTIVATED" | "ALREADY_ACTIVE"; access: FounderAccessSnapshot }
  | { ok: false; code: "DISABLED" | "LOCKED" | "INVALID_OR_UNAVAILABLE" | "DATABASE_REQUIRED"; retryAfterSeconds?: number };

function auditId(): string {
  return `fnd-audit-${randomUUID()}`;
}

export function hashFounderActorKey(userId: string): string {
  return createHash("sha256").update(userId).digest("hex");
}

async function appendAudit(
  client: PoolClient,
  input: {
    actorType: "FOUNDER" | "ADMIN" | "SYSTEM";
    actorId?: string | null;
    userId?: string | null;
    codeId?: string | null;
    action: string;
    result: "SUCCESS" | "DENIED" | "ERROR";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO founder_access_audit
      (id, actor_type, actor_id, user_id, code_id, action, result, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())`,
    [auditId(), input.actorType, input.actorId ?? null, input.userId ?? null, input.codeId ?? null,
      input.action, input.result, JSON.stringify(input.metadata ?? {})],
  );
}

async function loadSnapshot(client: PoolClient, userId: string): Promise<FounderAccessSnapshot | null> {
  const profile = await client.query<{
    code_id: string;
    status: FounderAccessStatus;
    activated_at: Date;
    license_id: string | null;
    license_status: "ACTIVE" | "REVOKED" | "BLOCKED" | null;
  }>(
    `SELECT p.code_id, p.status, p.activated_at, l.license_id, l.license_status
     FROM founder_access_profiles p
     LEFT JOIN founder_bot_licenses l ON l.user_id = p.user_id
     WHERE p.user_id = $1 LIMIT 1`,
    [userId],
  );
  if (!profile.rows[0]) return null;

  const entitlements = await client.query<{ entitlement: string }>(
    `SELECT entitlement FROM user_entitlements
     WHERE user_id = $1 AND source = 'FOUNDER' AND status = 'ACTIVE' AND expires_at IS NULL
     ORDER BY entitlement`,
    [userId],
  );
  const row = profile.rows[0];
  return {
    userId,
    codeId: row.code_id,
    status: row.status,
    activatedAt: new Date(row.activated_at),
    entitlements: entitlements.rows.map((item) => item.entitlement),
    licenseId: row.license_id,
    licenseStatus: row.license_status,
  };
}

export async function getFounderAccess(userId: string): Promise<FounderAccessSnapshot | null> {
  if (!backendDatabase.enabled) return null;
  try {
    await ensureFounderAccessSchema();
    return backendDatabase.withTransaction((client) => loadSnapshot(client, userId));
  } catch {
    return null;
  }
}

export async function hasActiveFounderAccess(userId: string): Promise<boolean> {
  const access = await getFounderAccess(userId);
  return isFounderAccessSnapshotActive(access);
}

export async function initializeFounderCodes(
  assignedEmails: string[],
  adminActorId: string,
): Promise<{ created: boolean; codes: Array<{ codeId: string; assignedEmail: string; code: string }> }> {
  if (!backendDatabase.enabled) throw new Error("DATABASE_REQUIRED");
  const normalizedEmails = assignedEmails.map(normalizeFounderEmail);
  if (assignedEmails.length !== FOUNDER_CODE_LIMIT || normalizedEmails.some((email) => !email)) {
    throw new Error("EXACTLY_THREE_UNIQUE_EMAILS_REQUIRED");
  }
  const emails = Array.from(new Set(normalizedEmails as string[]));
  if (emails.length !== FOUNDER_CODE_LIMIT) throw new Error("EXACTLY_THREE_UNIQUE_EMAILS_REQUIRED");
  await ensureFounderAccessSchema();

  return backendDatabase.withTransaction(async (client) => {
    const count = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM founder_access_codes");
    const currentCount = Number(count.rows[0]?.count ?? 0);
    if (currentCount === FOUNDER_CODE_LIMIT) return { created: false, codes: [] };
    if (currentCount !== 0) throw new Error("FOUNDER_CODE_SLOT_COUNT_INVALID");

    const codes = emails.map((assignedEmail) => ({ codeId: `fnd-code-${randomUUID()}`, assignedEmail, code: generateFounderCode() }));
    for (const item of codes) {
      await client.query(
        `INSERT INTO founder_access_codes
          (id, code_hash, status, assigned_email, created_at, updated_at)
         VALUES ($1, $2, 'AVAILABLE', $3, NOW(), NOW())`,
        [item.codeId, hashFounderCode(item.code), item.assignedEmail],
      );
      await appendAudit(client, {
        actorType: "ADMIN", actorId: adminActorId, codeId: item.codeId,
        action: "FOUNDER_CODE_CREATED", result: "SUCCESS", metadata: { assignedEmail: item.assignedEmail },
      });
    }
    return { created: true, codes };
  });
}

export async function activateFounderAccess(input: {
  userId: string;
  userEmail: string;
  rawCode: string;
  actorKeyHash: string;
}): Promise<FounderActivationResult> {
  if (!isFounderAccessEnabled()) return { ok: false, code: "DISABLED" };
  if (!backendDatabase.enabled) return { ok: false, code: "DATABASE_REQUIRED" };
  await ensureFounderAccessSchema();

  return backendDatabase.withTransaction(async (client) => {
    await client.query(
      `INSERT INTO founder_activation_security (actor_key_hash, failed_attempts, updated_at)
       VALUES ($1, 0, NOW()) ON CONFLICT (actor_key_hash) DO NOTHING`,
      [input.actorKeyHash],
    );
    const security = await client.query<{ failed_attempts: number; locked_until: Date | null }>(
      `SELECT failed_attempts, locked_until FROM founder_activation_security
       WHERE actor_key_hash = $1 FOR UPDATE`,
      [input.actorKeyHash],
    );
    const lockedUntil = security.rows[0]?.locked_until;
    if (lockedUntil && lockedUntil > new Date()) {
      return { ok: false, code: "LOCKED", retryAfterSeconds: Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)) };
    }

    const codeRows = await client.query<FounderCodeRow>(
      `SELECT id, code_hash, status, assigned_email, redeemed_by_user_id, redeemed_at,
              revoked_at, replacement_count, created_at, updated_at
       FROM founder_access_codes ORDER BY id FOR UPDATE`,
    );
    const existing = await loadSnapshot(client, input.userId);
    const claim = resolveFounderCodeClaim({
      candidates: codeRows.rows.map((row) => ({
        id: row.id,
        codeHash: row.code_hash,
        status: row.status,
        assignedEmail: row.assigned_email,
        redeemedByUserId: row.redeemed_by_user_id,
      })),
      rawCode: input.rawCode,
      userId: input.userId,
      userEmail: input.userEmail,
      existingAccessActive: existing?.status === "ACTIVE",
    });
    if (claim.kind === "IDEMPOTENT" && existing) {
      return { ok: true, status: "ALREADY_ACTIVE", access: existing };
    }

    if (claim.kind !== "CLAIM") {
      const nextAttempts = Number(security.rows[0]?.failed_attempts ?? 0) + 1;
      await client.query(
        `UPDATE founder_activation_security
         SET failed_attempts = $2,
             locked_until = CASE WHEN $2 >= $3 THEN NOW() + ($4 * INTERVAL '1 minute') ELSE NULL END,
             updated_at = NOW()
         WHERE actor_key_hash = $1`,
        [input.actorKeyHash, nextAttempts, MAX_FAILED_ATTEMPTS, LOCK_MINUTES],
      );
      await appendAudit(client, {
        actorType: "FOUNDER", actorId: input.userId, userId: input.userId,
        action: "FOUNDER_ACTIVATION", result: "DENIED", metadata: { reason: "INVALID_OR_UNAVAILABLE" },
      });
      return { ok: false, code: "INVALID_OR_UNAVAILABLE" };
    }
    const matched = codeRows.rows.find((row) => row.id === claim.codeId);
    if (!matched) throw new Error("FOUNDER_CODE_CLAIM_MISSING");

    const claimed = await client.query(
      `UPDATE founder_access_codes
       SET status = 'REDEEMED', redeemed_by_user_id = $2, redeemed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'AVAILABLE'`,
      [matched.id, input.userId],
    );
    if (claimed.rowCount !== 1) return { ok: false, code: "INVALID_OR_UNAVAILABLE" };

    const userState = await client.query<{
      user_type: string;
      exclude_from_commercial_metrics: boolean;
    }>(
      `SELECT user_type, exclude_from_commercial_metrics FROM users WHERE id = $1 FOR UPDATE`,
      [input.userId],
    );
    if (!userState.rows[0]) throw new Error("FOUNDER_USER_NOT_FOUND");

    await client.query(
      `INSERT INTO founder_access_profiles
        (user_id, code_id, status, previous_user_type, previous_exclude_from_commercial_metrics, activated_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', $3, $4, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET code_id = EXCLUDED.code_id, status = 'ACTIVE',
         revoked_at = NULL, blocked_at = NULL, updated_at = NOW()`,
      [input.userId, matched.id, userState.rows[0].user_type, userState.rows[0].exclude_from_commercial_metrics],
    );
    for (const entitlement of FOUNDER_ENTITLEMENTS) {
      await client.query(
        `INSERT INTO user_entitlements (user_id, entitlement, source, status, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'ACTIVE', NULL, NOW(), NOW())
         ON CONFLICT (user_id, entitlement, source) DO UPDATE SET status = 'ACTIVE', expires_at = NULL, updated_at = NOW()`,
        [input.userId, entitlement, FOUNDER_ACCESS_SOURCE],
      );
    }
    await client.query(
      `INSERT INTO founder_bot_licenses
        (user_id, license_id, license_type, license_status, payment_required, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'ACTIVE', false, NULL, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET license_status = 'ACTIVE', payment_required = false,
         expires_at = NULL, updated_at = NOW()`,
      [input.userId, `CVX-BOT-FND-${randomUUID()}`, FOUNDER_LICENSE_TYPE],
    );
    await client.query(
      `UPDATE users SET user_type = 'FOUNDER', exclude_from_commercial_metrics = true WHERE id = $1`,
      [input.userId],
    );
    await client.query(
      `UPDATE founder_activation_security SET failed_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE actor_key_hash = $1`,
      [input.actorKeyHash],
    );
    await appendAudit(client, {
      actorType: "FOUNDER", actorId: input.userId, userId: input.userId, codeId: matched.id,
      action: "FOUNDER_ACTIVATED", result: "SUCCESS", metadata: { entitlementCount: FOUNDER_ENTITLEMENTS.length },
    });
    const access = await loadSnapshot(client, input.userId);
    if (!access) throw new Error("FOUNDER_ACTIVATION_INCOMPLETE");
    return { ok: true, status: "ACTIVATED", access };
  });
}

export async function listFounderAdminState(): Promise<{
  codes: FounderAdminCode[];
  profiles: FounderAccessSnapshot[];
  audit: Array<Record<string, unknown>>;
}> {
  await ensureFounderAccessSchema();
  const codes = await backendDatabase.query<FounderCodeRow>(
    `SELECT id, code_hash, status, assigned_email, redeemed_by_user_id, redeemed_at,
            revoked_at, replacement_count, created_at, updated_at
     FROM founder_access_codes ORDER BY created_at`,
  );
  const profileRows = await backendDatabase.query<{ user_id: string }>(
    "SELECT user_id FROM founder_access_profiles ORDER BY activated_at",
  );
  const profiles = (await Promise.all(profileRows.rows.map((row) => getFounderAccess(row.user_id))))
    .filter((item): item is FounderAccessSnapshot => Boolean(item));
  const audit = await backendDatabase.query<Record<string, unknown>>(
    `SELECT id, actor_type, actor_id, user_id, code_id, action, result, metadata, created_at
     FROM founder_access_audit ORDER BY created_at DESC LIMIT 200`,
  );
  return {
    codes: codes.rows.map((row) => ({
      id: row.id,
      status: row.status,
      assigned_email: row.assigned_email,
      redeemed_by_user_id: row.redeemed_by_user_id,
      redeemed_at: row.redeemed_at,
      revoked_at: row.revoked_at,
      replacement_count: row.replacement_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    profiles,
    audit: audit.rows,
  };
}

export async function setFounderAccessStatus(input: {
  userId: string;
  status: "REVOKED" | "BLOCKED";
  adminActorId: string;
}): Promise<boolean> {
  await ensureFounderAccessSchema();
  return backendDatabase.withTransaction(async (client) => {
    const profile = await client.query<{
      code_id: string;
      previous_user_type: string;
      previous_exclude_from_commercial_metrics: boolean;
    }>(
      `SELECT code_id, previous_user_type, previous_exclude_from_commercial_metrics
       FROM founder_access_profiles WHERE user_id = $1 FOR UPDATE`,
      [input.userId],
    );
    if (!profile.rows[0]) return false;
    await client.query(
      `UPDATE founder_access_profiles SET status = $2,
       revoked_at = CASE WHEN $2 = 'REVOKED' THEN NOW() ELSE revoked_at END,
       blocked_at = CASE WHEN $2 = 'BLOCKED' THEN NOW() ELSE blocked_at END, updated_at = NOW()
       WHERE user_id = $1`,
      [input.userId, input.status],
    );
    await client.query("UPDATE user_entitlements SET status = $2, updated_at = NOW() WHERE user_id = $1 AND source = 'FOUNDER'", [input.userId, input.status]);
    await client.query("UPDATE founder_bot_licenses SET license_status = $2, updated_at = NOW() WHERE user_id = $1", [input.userId, input.status]);
    await client.query("UPDATE founder_access_codes SET status = 'REVOKED', revoked_at = NOW(), updated_at = NOW() WHERE id = $1", [profile.rows[0].code_id]);
    await client.query(
      "UPDATE users SET user_type = $2, exclude_from_commercial_metrics = $3 WHERE id = $1",
      [input.userId, profile.rows[0].previous_user_type, profile.rows[0].previous_exclude_from_commercial_metrics],
    );
    await appendAudit(client, {
      actorType: "ADMIN", actorId: input.adminActorId, userId: input.userId, codeId: profile.rows[0].code_id,
      action: input.status === "BLOCKED" ? "FOUNDER_BLOCKED" : "FOUNDER_REVOKED", result: "SUCCESS",
    });
    return true;
  });
}

export async function replaceFounderCode(input: {
  codeId: string;
  assignedEmail: string;
  adminActorId: string;
}): Promise<{ codeId: string; assignedEmail: string; code: string }> {
  await ensureFounderAccessSchema();
  const code = generateFounderCode();
  const assignedEmail = normalizeFounderEmail(input.assignedEmail);
  if (!assignedEmail) throw new Error("INVALID_FOUNDER_EMAIL");
  return backendDatabase.withTransaction(async (client) => {
    const current = await client.query<{ status: FounderCodeStatus }>(
      "SELECT status FROM founder_access_codes WHERE id = $1 FOR UPDATE",
      [input.codeId],
    );
    if (!current.rows[0] || current.rows[0].status !== "REVOKED") throw new Error("CODE_MUST_BE_REVOKED_BEFORE_REPLACEMENT");
    await client.query(
      `UPDATE founder_access_codes SET code_hash = $2, status = 'AVAILABLE', assigned_email = $3,
       redeemed_by_user_id = NULL, redeemed_at = NULL, revoked_at = NULL,
       replacement_count = replacement_count + 1, updated_at = NOW() WHERE id = $1`,
      [input.codeId, hashFounderCode(code), assignedEmail],
    );
    await appendAudit(client, {
      actorType: "ADMIN", actorId: input.adminActorId, codeId: input.codeId,
      action: "FOUNDER_CODE_REPLACED", result: "SUCCESS", metadata: { assignedEmail },
    });
    return { codeId: input.codeId, assignedEmail, code };
  });
}