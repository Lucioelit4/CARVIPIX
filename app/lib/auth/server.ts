import "server-only";

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";
import {
  consumePasswordResetToken as consumeLocalPasswordResetToken,
  consumeVerificationToken as consumeLocalVerificationToken,
  createPasswordResetToken as createLocalPasswordResetToken,
  createSession as createLocalSession,
  createVerificationToken as createLocalVerificationToken,
  findMembershipByUserId as findLocalMembershipByUserId,
  findUserByEmail as findLocalUserByEmail,
  hashPassword as hashLocalPassword,
  listSessions as listLocalSessions,
  readSessionUser as readLocalSessionUser,
  revokeSessionByHash as revokeLocalSessionByHash,
  revokeSession as revokeLocalSession,
  seedDemoStore,
  updateUser as updateLocalUser,
  upsertMembership as upsertLocalMembership,
} from "@/app/backend/core/local-auth-store";

export const AUTH_SESSION_COOKIE = "carvipix_auth_session";
export const AUTH_ROLE_COOKIE = "carvipix_auth_role";

const SESSION_HOURS = 12;
const TOKEN_HOURS = 2;

export type AuthUserRow = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  plan: string;
  estado: string;
  verificado: boolean;
  password_hash: string | null;
};

export type AuthMembershipStatus = "activo" | "cancelado" | "vencido" | "inactivo";

export type AuthMembershipRow = {
  user_id: string;
  plan: string;
  estado: AuthMembershipStatus;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  renovacion_automatica: boolean;
};

export type AuthMembershipSnapshot = {
  plan: string;
  estado: AuthMembershipStatus;
  fechaInicio: Date;
  fechaFin?: Date;
  renovacionAutomatica: boolean;
  active: boolean;
};

function nowPlusHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [algorithm, salt, storedKey] = hash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");
  if (storedBuffer.length !== key.length) {
    return false;
  }

  return timingSafeEqual(key, storedBuffer);
}

export async function findUserByEmail(email: string): Promise<AuthUserRow | null> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const user = await findLocalUserByEmail(email);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      plan: user.plan,
      estado: user.estado,
      verificado: user.verificado,
      password_hash: user.passwordHash ?? null,
    };
  }

  const { rows } = await backendDatabase.query<AuthUserRow>(
    `
    SELECT id, email, nombre, apellido, plan, estado, verificado, password_hash
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email.toLowerCase().trim()]
  );

  return rows[0] ?? null;
}

export async function findMembershipByUserId(userId: string): Promise<AuthMembershipSnapshot | null> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const membership = await findLocalMembershipByUserId(userId);
    if (!membership) {
      return null;
    }

    const active = membership.estado === "activo" && (!membership.fechaFin || new Date(membership.fechaFin) > new Date());
    return {
      plan: membership.plan,
      estado: active ? "activo" : membership.estado === "activo" ? "vencido" : membership.estado,
      fechaInicio: new Date(membership.fechaInicio),
      fechaFin: membership.fechaFin ? new Date(membership.fechaFin) : undefined,
      renovacionAutomatica: membership.renovacionAutomatica,
      active,
    };
  }

  const { rows } = await backendDatabase.query<AuthMembershipRow>(
    `
    SELECT user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica
    FROM memberships
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const active = row.estado === "activo" && (!row.fecha_fin || row.fecha_fin > new Date());
  const resolvedStatus: AuthMembershipStatus = active ? "activo" : row.estado === "activo" ? "vencido" : row.estado;

  return {
    plan: row.plan,
    estado: resolvedStatus,
    fechaInicio: new Date(row.fecha_inicio),
    fechaFin: row.fecha_fin ? new Date(row.fecha_fin) : undefined,
    renovacionAutomatica: row.renovacion_automatica,
    active,
  };
}

export async function ensureInactiveMembership(
  userId: string,
  options?: { preferredPlan?: string; userStatus?: string }
): Promise<AuthMembershipSnapshot> {
  const normalizedPlan = String(options?.preferredPlan ?? "demo").trim().toLowerCase();
  const normalizedUserStatus = String(options?.userStatus ?? "").trim().toLowerCase();
  const shouldForceActive =
    normalizedUserStatus === "activo" &&
    (normalizedPlan === "pro" || normalizedPlan === "premium" || normalizedPlan === "enterprise");

  const fallbackPlan =
    normalizedPlan === "pro" || normalizedPlan === "premium" || normalizedPlan === "enterprise" || normalizedPlan === "demo"
      ? normalizedPlan
      : "demo";

  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const membership = await upsertLocalMembership({
      userId,
      plan: fallbackPlan,
      estado: shouldForceActive ? "activo" : "inactivo",
      fechaInicio: new Date().toISOString(),
      fechaFin: shouldForceActive ? null : null,
      renovacionAutomatica: shouldForceActive ? true : false,
    });

    const active = membership.estado === "activo" && (!membership.fechaFin || new Date(membership.fechaFin) > new Date());
    return {
      plan: membership.plan,
      estado: active ? "activo" : membership.estado,
      fechaInicio: new Date(membership.fechaInicio),
      fechaFin: membership.fechaFin ? new Date(membership.fechaFin) : undefined,
      renovacionAutomatica: membership.renovacionAutomatica,
      active,
    };
  }

  await backendDatabase.query(
    `
    INSERT INTO memberships (user_id, plan, estado, fecha_inicio, renovacion_automatica)
    VALUES ($1, $2, $3, NOW(), $4)
    ON CONFLICT (user_id) DO NOTHING
    `,
    [userId, fallbackPlan, shouldForceActive ? "activo" : "inactivo", shouldForceActive]
  );

  const snapshot = await findMembershipByUserId(userId);
  if (snapshot) {
    return snapshot;
  }

  return {
    plan: "demo",
    estado: "inactivo",
    fechaInicio: new Date(),
    renovacionAutomatica: false,
    active: false,
  };
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    return createLocalSession(userId);
  }

  const token = createRawToken();
  const tokenHash = hashToken(token);
  const expiresAt = nowPlusHours(SESSION_HOURS);

  await backendDatabase.query(
    `
    INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    `,
    [`sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

export async function readSessionUser(token: string): Promise<AuthUserRow | null> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const user = await readLocalSessionUser(token);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      plan: user.plan,
      estado: user.estado,
      verificado: user.verificado,
      password_hash: user.passwordHash ?? null,
    };
  }

  const tokenHash = hashToken(token);

  const { rows } = await backendDatabase.query<AuthUserRow>(
    `
    SELECT u.id, u.email, u.nombre, u.apellido, u.plan, u.estado, u.verificado, u.password_hash
    FROM auth_sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1
      AND s.expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash]
  );

  if (rows[0]) {
    await backendDatabase.query(
      `UPDATE auth_sessions SET last_seen_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  return rows[0] ?? null;
}

export async function revokeSession(token: string): Promise<void> {
  if (!backendDatabase.enabled) {
    await revokeLocalSession(token);
    return;
  }

  const tokenHash = hashToken(token);
  await backendDatabase.query(`DELETE FROM auth_sessions WHERE token_hash = $1`, [tokenHash]);
}

export async function listActiveSessions(userId: string): Promise<Array<{
  id: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastSeenAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceLabel?: string | null;
}>> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const sessions = await listLocalSessions(userId);
    return sessions.map((session) => ({
      id: session.tokenHash,
      tokenHash: session.tokenHash,
      expiresAt: new Date(session.expiresAt),
      createdAt: new Date(session.createdAt),
      lastSeenAt: new Date(session.lastSeenAt ?? session.createdAt),
      userAgent: session.userAgent ?? null,
      ipAddress: session.ipAddress ?? null,
      deviceLabel: session.deviceLabel ?? null,
    }));
  }

  const { rows } = await backendDatabase.query<{
    id: string;
    token_hash: string;
    expires_at: Date;
    created_at: Date;
    last_seen_at: Date;
    user_agent: string | null;
    ip_address: string | null;
    device_label: string | null;
  }>(
    `
    SELECT id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_address, device_label
    FROM auth_sessions
    WHERE user_id = $1 AND expires_at > NOW()
    ORDER BY last_seen_at DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    lastSeenAt: new Date(row.last_seen_at),
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    deviceLabel: row.device_label,
  }));
}

export async function revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    return revokeLocalSessionByHash(userId, sessionId);
  }

  const result = await backendDatabase.query<{ id: string }>(
    `DELETE FROM auth_sessions WHERE user_id = $1 AND id = $2 RETURNING id`,
    [userId, sessionId]
  );

  return result.rows.length > 0;
}

export async function createVerificationToken(userId: string): Promise<string> {
  if (!backendDatabase.enabled) {
    return createLocalVerificationToken(userId);
  }

  const token = createRawToken();
  const tokenHash = hashToken(token);

  await backendDatabase.query(
    `
    INSERT INTO auth_verification_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
    VALUES ($1, $2, $3, $4, NULL, NOW())
    `,
    [`verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, tokenHash, nowPlusHours(TOKEN_HOURS)]
  );

  return token;
}

export async function consumeVerificationToken(token: string): Promise<boolean> {
  if (!backendDatabase.enabled) {
    const ok = await consumeLocalVerificationToken(token);
    return ok;
  }

  const tokenHash = hashToken(token);

  return backendDatabase.withTransaction<boolean>(async (client) => {
    const result = await client.query<{ user_id: string }>(
      `
      SELECT user_id
      FROM auth_verification_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      return false;
    }

    await client.query(`UPDATE users SET verificado = true WHERE id = $1`, [row.user_id]);
    await client.query(`UPDATE auth_verification_tokens SET used_at = NOW() WHERE token_hash = $1`, [tokenHash]);
    return true;
  });
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  if (!backendDatabase.enabled) {
    return createLocalPasswordResetToken(userId);
  }

  const token = createRawToken();
  const tokenHash = hashToken(token);

  await backendDatabase.query(
    `
    INSERT INTO auth_password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
    VALUES ($1, $2, $3, $4, NULL, NOW())
    `,
    [`reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId, tokenHash, nowPlusHours(TOKEN_HOURS)]
  );

  return token;
}

export async function consumePasswordResetToken(token: string, newPasswordHash: string): Promise<boolean> {
  if (!backendDatabase.enabled) {
    const ok = await consumeLocalPasswordResetToken(token, newPasswordHash);
    return ok;
  }

  const tokenHash = hashToken(token);

  return backendDatabase.withTransaction<boolean>(async (client) => {
    const result = await client.query<{ user_id: string }>(
      `
      SELECT user_id
      FROM auth_password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      return false;
    }

    await client.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [row.user_id, newPasswordHash]);
    await client.query(`UPDATE auth_password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`, [tokenHash]);
    return true;
  });
}
