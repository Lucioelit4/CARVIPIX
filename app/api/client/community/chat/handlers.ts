import { NextRequest, NextResponse } from "next/server";

import {
  addLocalCommunityMessage,
  addLocalCommunityReport,
  addLocalModerationLog,
  buildCommunityId,
  getCurrentIso,
  getLocalCommunityMessage,
  listLocalCommunityMessages,
  listLocalCommunitySanctions,
  listLocalModerationLogs,
  listLocalTypingPresence,
  updateLocalCommunityMessage,
  upsertLocalCommunitySanction,
  upsertLocalTypingPresence,
} from "@/app/backend/core/local-community-store";

const BAD_WORDS = ["idiota", "imbecil", "estafa", "mierda", "pendejo", "cabron", "fuck", "shit", "puto"];
const MALICIOUS_DOMAINS = ["grabify", "iplogger", "tinyurl", "bit.ly", "discord.gift", "phish", "scam"];
const AD_KEYWORDS = ["vendo", "compra", "promocion", "telegram", "whatsapp", "referido", "gana dinero rapido"];

const CHANNELS = [
  { id: "chat-principal", label: "chat-principal", visibility: "all" },
  { id: "alertas-en-vivo", label: "alertas-en-vivo", visibility: "membership" },
  { id: "gestion-de-senales", label: "gestion-de-senales", visibility: "membership" },
  { id: "dudas-de-miembros", label: "dudas-de-miembros", visibility: "all" },
  { id: "noticias-importantes", label: "noticias-importantes", visibility: "membership" },
  { id: "resultados-operativos", label: "resultados-operativos", visibility: "membership" },
  { id: "pro-exclusivo", label: "pro-exclusivo", visibility: "pro" },
  { id: "bot-exclusivo", label: "bot-exclusivo", visibility: "bot" },
  { id: "gestion-exclusivo", label: "gestion-exclusivo", visibility: "capital" },
  { id: "admin-anuncios", label: "admin-anuncios", visibility: "admin" },
] as const;

type CommunityChannel = (typeof CHANNELS)[number]["id"];

type CommunityAuthSuccess = {
  ok: true;
  user: {
    id: string;
    nombre?: string;
    email?: string;
    user_role?: string;
  };
};

type CommunityAuthFailure = {
  ok: false;
  response: NextResponse;
};

type CommunityUserProfile = {
  plan: "free" | "basic" | "advanced";
  membershipActive: boolean;
  hasBot: boolean;
  hasCapital: boolean;
  isAdmin: boolean;
};

export type CommunityChatDependencies = {
  requireAuth: (request: NextRequest) => Promise<CommunityAuthSuccess | CommunityAuthFailure>;
  resolveProfile: (userId: string, authUser?: CommunityAuthSuccess["user"]) => Promise<CommunityUserProfile>;
  db: {
    enabled: boolean;
    query: <T extends Record<string, unknown>>(
      sql: string,
      params?: Array<string | number | boolean | Date | null | string[]>
    ) => Promise<{ rows: T[] }>;
  };
};

type MessageRateWindow = {
  timestamps: number[];
};

const messageRateMap = new Map<string, MessageRateWindow>();

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeForModeration(text: string): string {
  return removeAccents(text.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

function channelConfig(channelId: string) {
  return CHANNELS.find((entry) => entry.id === channelId) ?? null;
}

function canAccessChannel(channelId: CommunityChannel, profile: CommunityUserProfile): { allowed: boolean; reason?: string } {
  const config = channelConfig(channelId);
  if (!config) {
    return { allowed: false, reason: "Canal no valido" };
  }

  if (config.visibility === "all") return { allowed: true };
  if (config.visibility === "membership" && profile.membershipActive) return { allowed: true };
  if (config.visibility === "pro" && profile.plan === "advanced" && profile.membershipActive) return { allowed: true };
  if (config.visibility === "bot" && profile.hasBot && profile.membershipActive) return { allowed: true };
  if (config.visibility === "capital" && profile.hasCapital) return { allowed: true };
  if (config.visibility === "admin" && profile.isAdmin) return { allowed: true };

  return { allowed: false, reason: "Tu perfil no tiene permisos para este canal." };
}

function parseMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_\-.]{2,40})/g) ?? [];
  return Array.from(new Set(matches.map((value) => value.replace("@", "")))).slice(0, 20);
}

function containsMaliciousLink(content: string): boolean {
  const links = content.match(/(https?:\/\/|www\.)[^\s]+/gi) ?? [];
  if (links.length === 0) {
    return false;
  }

  const normalizedLinks = links.map((link) => link.toLowerCase());
  return normalizedLinks.some((link) => MALICIOUS_DOMAINS.some((domain) => link.includes(domain)));
}

function detectOffensiveWord(content: string): string | null {
  const rawNormalized = removeAccents(content.toLowerCase());
  const compact = normalizeForModeration(content);

  for (const word of BAD_WORDS) {
    const normalizedWord = removeAccents(word);
    if (rawNormalized.includes(normalizedWord) || compact.includes(normalizedWord.replace(/[^a-z0-9]/g, ""))) {
      return word;
    }
  }

  return null;
}

function detectAdvertising(content: string): boolean {
  const normalized = removeAccents(content.toLowerCase());
  return AD_KEYWORDS.some((keyword) => normalized.includes(removeAccents(keyword)));
}

function detectPhishing(content: string): boolean {
  const normalized = removeAccents(content.toLowerCase());
  return (
    normalized.includes("verifica tu cuenta") ||
    normalized.includes("ingresa tu clave") ||
    normalized.includes("token de seguridad") ||
    normalized.includes("recupera acceso aqui")
  );
}

function detectFlood(userId: string): boolean {
  const now = Date.now();
  const bucket = messageRateMap.get(userId) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp <= 30_000);
  const isFlood = bucket.timestamps.length >= 8;
  bucket.timestamps.push(now);
  messageRateMap.set(userId, bucket);
  return isFlood;
}

function enforceRateLimit(userId: string, profile: CommunityUserProfile): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const maxByPlan = profile.plan === "advanced" ? 30 : profile.plan === "basic" ? 14 : 6;
  const window = messageRateMap.get(userId) ?? { timestamps: [] };
  window.timestamps = window.timestamps.filter((timestamp) => timestamp >= oneMinuteAgo);

  if (window.timestamps.length >= maxByPlan) {
    const retryAfterMs = 60_000 - (now - window.timestamps[0]);
    messageRateMap.set(userId, window);
    return { ok: false, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  window.timestamps.push(now);
  messageRateMap.set(userId, window);
  return { ok: true };
}

async function logModeration(
  deps: CommunityChatDependencies,
  payload: { userId: string; channelId: string; action: string; reason: string; metadata?: Record<string, unknown> }
) {
  const id = buildCommunityId("mod");
  const createdAt = getCurrentIso();
  const metadata = payload.metadata ?? {};

  if (!deps.db.enabled) {
    await addLocalModerationLog({ id, userId: payload.userId, channelId: payload.channelId, action: payload.action, reason: payload.reason, metadata, createdAt });
    return;
  }

  try {
    await deps.db.query(
      `
      INSERT INTO community_moderation_logs (id, user_id, channel_id, action, reason, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      `,
      [id, payload.userId, payload.channelId, payload.action, payload.reason, JSON.stringify(metadata)]
    );
  } catch {
    await addLocalModerationLog({ id, userId: payload.userId, channelId: payload.channelId, action: payload.action, reason: payload.reason, metadata, createdAt });
  }
}

async function applySanction(
  deps: CommunityChatDependencies,
  payload: {
    userId: string;
    channelId: string;
    type: "mute" | "temporary_block" | "kick";
    reason: string;
    durationMinutes: number;
    metadata?: Record<string, unknown>;
  }
) {
  const id = buildCommunityId("sanction");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + payload.durationMinutes * 60_000).toISOString();

  if (!deps.db.enabled) {
    await upsertLocalCommunitySanction({
      id,
      userId: payload.userId,
      channelId: payload.channelId,
      sanctionType: payload.type,
      reason: payload.reason,
      active: true,
      expiresAt,
      metadata: payload.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    return;
  }

  try {
    await deps.db.query(
      `
      INSERT INTO community_user_sanctions (id, user_id, channel_id, sanction_type, reason, active, expires_at, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, $6, $7::jsonb, NOW(), NOW())
      `,
      [id, payload.userId, payload.channelId, payload.type, payload.reason, expiresAt, JSON.stringify(payload.metadata ?? {})]
    );
  } catch {
    await upsertLocalCommunitySanction({
      id,
      userId: payload.userId,
      channelId: payload.channelId,
      sanctionType: payload.type,
      reason: payload.reason,
      active: true,
      expiresAt,
      metadata: payload.metadata ?? {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }
}

async function hasActiveSanction(
  deps: CommunityChatDependencies,
  userId: string,
  channelId: string
): Promise<{ active: boolean; type?: string; reason?: string }> {
  const now = new Date();

  if (!deps.db.enabled) {
    const sanctions = await listLocalCommunitySanctions(userId);
    const active = sanctions.find((item) => {
      if (!item.active) return false;
      if (item.channelId && item.channelId !== channelId) return false;
      if (!item.expiresAt) return true;
      return new Date(item.expiresAt) > now;
    });

    return active ? { active: true, type: active.sanctionType, reason: active.reason } : { active: false };
  }

  try {
    const result = await deps.db.query<{ sanction_type: string; reason: string }>(
      `
      SELECT sanction_type, reason
      FROM community_user_sanctions
      WHERE user_id = $1
        AND active = true
        AND (channel_id IS NULL OR channel_id = $2)
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, channelId]
    );

    const row = result.rows[0];
    return row ? { active: true, type: row.sanction_type, reason: row.reason } : { active: false };
  } catch {
    return { active: false };
  }
}

async function listMessages(deps: CommunityChatDependencies, channelId: string) {
  if (!deps.db.enabled) {
    return listLocalCommunityMessages(channelId, 150);
  }

  try {
    const result = await deps.db.query<{
      id: string;
      channel_id: string;
      user_id: string;
      user_name: string;
      user_role: string;
      content: string;
      parent_message_id: string | null;
      mentions: unknown;
      read_by: unknown;
      edited_at: Date | null;
      deleted_at: Date | null;
      is_pinned: boolean;
      pinned_by: string | null;
      moderated: boolean;
      moderation_reason: string | null;
      created_at: Date;
    }>(
      `
      SELECT
        id,
        channel_id,
        user_id,
        user_name,
        user_role,
        content,
        parent_message_id,
        mentions,
        read_by,
        edited_at,
        deleted_at,
        is_pinned,
        pinned_by,
        moderated,
        moderation_reason,
        created_at
      FROM community_messages
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT 150
      `,
      [channelId]
    );

    return result.rows
      .map((row) => ({
        id: row.id,
        channelId: row.channel_id,
        userId: row.user_id,
        userName: row.user_name,
        role: row.user_role,
        content: row.content,
        parentMessageId: row.parent_message_id,
        mentions: Array.isArray(row.mentions) ? (row.mentions as string[]) : [],
        readBy: Array.isArray(row.read_by) ? (row.read_by as string[]) : [],
        editedAt: row.edited_at ? row.edited_at.toISOString() : null,
        deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
        isPinned: row.is_pinned,
        pinnedBy: row.pinned_by,
        moderated: row.moderated,
        moderationReason: row.moderation_reason,
        createdAt: row.created_at.toISOString(),
      }))
      .reverse();
  } catch {
    return listLocalCommunityMessages(channelId, 150);
  }
}

async function listModerationLogs(deps: CommunityChatDependencies, channelId: string) {
  if (!deps.db.enabled) {
    return listLocalModerationLogs(channelId, 30);
  }

  try {
    const result = await deps.db.query<{
      id: string;
      user_id: string;
      channel_id: string;
      action: string;
      reason: string;
      metadata: unknown;
      created_at: Date;
    }>(
      `
      SELECT id, user_id, channel_id, action, reason, metadata, created_at
      FROM community_moderation_logs
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT 30
      `,
      [channelId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      channelId: row.channel_id,
      action: row.action,
      reason: row.reason,
      metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return listLocalModerationLogs(channelId, 30);
  }
}

async function listTyping(deps: CommunityChatDependencies, channelId: string) {
  if (!deps.db.enabled) {
    return listLocalTypingPresence(channelId);
  }

  try {
    await deps.db.query(
      `
      DELETE FROM community_typing_presence
      WHERE expires_at <= NOW()
      `
    );

    const result = await deps.db.query<{
      id: string;
      channel_id: string;
      user_id: string;
      user_name: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `
      SELECT id, channel_id, user_id, user_name, expires_at, created_at
      FROM community_typing_presence
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [channelId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      channelId: row.channel_id,
      userId: row.user_id,
      userName: row.user_name,
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return listLocalTypingPresence(channelId);
  }
}

async function saveTyping(
  deps: CommunityChatDependencies,
  payload: { channelId: string; userId: string; userName: string; expiresInSeconds: number }
) {
  const id = buildCommunityId("typing");
  const nowIso = getCurrentIso();
  const expiresAt = new Date(Date.now() + payload.expiresInSeconds * 1000).toISOString();

  if (!deps.db.enabled) {
    await upsertLocalTypingPresence({
      id,
      channelId: payload.channelId,
      userId: payload.userId,
      userName: payload.userName,
      expiresAt,
      createdAt: nowIso,
    });
    return;
  }

  try {
    await deps.db.query(
      `
      DELETE FROM community_typing_presence
      WHERE user_id = $1 AND channel_id = $2
      `,
      [payload.userId, payload.channelId]
    );

    await deps.db.query(
      `
      INSERT INTO community_typing_presence (id, channel_id, user_id, user_name, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [id, payload.channelId, payload.userId, payload.userName, expiresAt]
    );
  } catch {
    await upsertLocalTypingPresence({
      id,
      channelId: payload.channelId,
      userId: payload.userId,
      userName: payload.userName,
      expiresAt,
      createdAt: nowIso,
    });
  }
}

async function saveMessage(
  deps: CommunityChatDependencies,
  payload: {
    channelId: string;
    userId: string;
    userName: string;
    userRole: string;
    content: string;
    parentMessageId: string | null;
    mentions: string[];
  }
) {
  const id = buildCommunityId("msg");
  const createdAt = getCurrentIso();

  if (!deps.db.enabled) {
    await addLocalCommunityMessage({
      id,
      channelId: payload.channelId,
      userId: payload.userId,
      userName: payload.userName,
      role: payload.userRole,
      content: payload.content,
      parentMessageId: payload.parentMessageId,
      mentions: payload.mentions,
      readBy: [payload.userId],
      editedAt: null,
      deletedAt: null,
      isPinned: false,
      pinnedBy: null,
      moderated: false,
      moderationReason: null,
      createdAt,
    });
    return { id, createdAt };
  }

  try {
    await deps.db.query(
      `
      INSERT INTO community_messages (
        id,
        channel_id,
        user_id,
        user_name,
        user_role,
        content,
        parent_message_id,
        mentions,
        read_by,
        edited_at,
        deleted_at,
        is_pinned,
        pinned_by,
        moderated,
        moderation_reason,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, NULL, NULL, false, NULL, false, NULL, NOW())
      `,
      [id, payload.channelId, payload.userId, payload.userName, payload.userRole, payload.content, payload.parentMessageId, JSON.stringify(payload.mentions), JSON.stringify([payload.userId])]
    );
    return { id, createdAt };
  } catch {
    await addLocalCommunityMessage({
      id,
      channelId: payload.channelId,
      userId: payload.userId,
      userName: payload.userName,
      role: payload.userRole,
      content: payload.content,
      parentMessageId: payload.parentMessageId,
      mentions: payload.mentions,
      readBy: [payload.userId],
      editedAt: null,
      deletedAt: null,
      isPinned: false,
      pinnedBy: null,
      moderated: false,
      moderationReason: null,
      createdAt,
    });
    return { id, createdAt };
  }
}

async function markMessageRead(
  deps: CommunityChatDependencies,
  payload: { messageId: string; userId: string }
) {
  if (!deps.db.enabled) {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current) return null;
    const readBy = Array.from(new Set([...(current.readBy ?? []), payload.userId]));
    return updateLocalCommunityMessage(payload.messageId, { readBy });
  }

  try {
    await deps.db.query(
      `
      UPDATE community_messages
      SET read_by = (
        SELECT to_jsonb(array_agg(DISTINCT entry))
        FROM jsonb_array_elements_text(COALESCE(read_by, '[]'::jsonb) || to_jsonb($2::text)) AS entry
      )
      WHERE id = $1
      `,
      [payload.messageId, payload.userId]
    );
    return true;
  } catch {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current) return null;
    const readBy = Array.from(new Set([...(current.readBy ?? []), payload.userId]));
    return updateLocalCommunityMessage(payload.messageId, { readBy });
  }
}

async function editMessage(
  deps: CommunityChatDependencies,
  payload: { messageId: string; userId: string; content: string }
) {
  const editedAt = getCurrentIso();

  if (!deps.db.enabled) {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current || current.userId !== payload.userId || current.deletedAt) return null;
    return updateLocalCommunityMessage(payload.messageId, { content: payload.content, editedAt });
  }

  try {
    const result = await deps.db.query<{ id: string }>(
      `
      UPDATE community_messages
      SET content = $3, edited_at = NOW()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
      `,
      [payload.messageId, payload.userId, payload.content]
    );

    return result.rows[0] ?? null;
  } catch {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current || current.userId !== payload.userId || current.deletedAt) return null;
    return updateLocalCommunityMessage(payload.messageId, { content: payload.content, editedAt });
  }
}

async function deleteMessage(
  deps: CommunityChatDependencies,
  payload: { messageId: string; userId: string; isAdmin: boolean }
) {
  const deletedAt = getCurrentIso();

  if (!deps.db.enabled) {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current || (!payload.isAdmin && current.userId !== payload.userId) || current.deletedAt) return null;
    return updateLocalCommunityMessage(payload.messageId, { deletedAt, content: "[Mensaje eliminado]" });
  }

  try {
    const result = await deps.db.query<{ id: string }>(
      `
      UPDATE community_messages
      SET deleted_at = NOW(), content = '[Mensaje eliminado]'
      WHERE id = $1
        AND deleted_at IS NULL
        AND ($2::boolean = true OR user_id = $3)
      RETURNING id
      `,
      [payload.messageId, payload.isAdmin, payload.userId]
    );

    return result.rows[0] ?? null;
  } catch {
    const current = await getLocalCommunityMessage(payload.messageId);
    if (!current || (!payload.isAdmin && current.userId !== payload.userId) || current.deletedAt) return null;
    return updateLocalCommunityMessage(payload.messageId, { deletedAt, content: "[Mensaje eliminado]" });
  }
}

async function pinMessage(
  deps: CommunityChatDependencies,
  payload: { messageId: string; userId: string; isAdmin: boolean; pin: boolean }
) {
  if (!payload.isAdmin) return null;

  if (!deps.db.enabled) {
    return updateLocalCommunityMessage(payload.messageId, { isPinned: payload.pin, pinnedBy: payload.pin ? payload.userId : null });
  }

  try {
    const result = await deps.db.query<{ id: string }>(
      `
      UPDATE community_messages
      SET is_pinned = $2, pinned_by = CASE WHEN $2 THEN $3 ELSE NULL END
      WHERE id = $1
      RETURNING id
      `,
      [payload.messageId, payload.pin, payload.userId]
    );
    return result.rows[0] ?? null;
  } catch {
    return updateLocalCommunityMessage(payload.messageId, { isPinned: payload.pin, pinnedBy: payload.pin ? payload.userId : null });
  }
}

async function saveReport(
  deps: CommunityChatDependencies,
  payload: {
    channelId: string;
    messageId: string;
    reportedBy: string;
    reason: string;
  }
) {
  const id = buildCommunityId("report");
  const createdAt = getCurrentIso();

  if (!deps.db.enabled) {
    await addLocalCommunityReport({ id, messageId: payload.messageId, channelId: payload.channelId, reportedBy: payload.reportedBy, reason: payload.reason, createdAt });
    return { id };
  }

  try {
    await deps.db.query(
      `
      INSERT INTO community_message_reports (id, message_id, channel_id, reported_by, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [id, payload.messageId, payload.channelId, payload.reportedBy, payload.reason]
    );
    return { id };
  } catch {
    await addLocalCommunityReport({ id, messageId: payload.messageId, channelId: payload.channelId, reportedBy: payload.reportedBy, reason: payload.reason, createdAt });
    return { id };
  }
}

function userRole(profile: CommunityUserProfile): string {
  if (profile.isAdmin) return "Administrador";
  if (profile.hasCapital) return "Socio Estrategico";
  if (profile.hasBot) return "Usuario Bot";
  if (profile.plan === "advanced") return "Miembro PRO";
  if (profile.plan === "basic") return "Miembro BASIC";
  return "Miembro";
}

function quickRepliesForChannel(channelId: string): string[] {
  if (channelId === "alertas-en-vivo") {
    return [
      "Gracias por la alerta, reviso gestion de riesgo.",
      "Confirmo entrada con lote reducido.",
      "Espero confirmacion adicional en M15.",
    ];
  }

  if (channelId === "dudas-de-miembros") {
    return [
      "Comparto mi duda con contexto y timeframe.",
      "Gracias, quedo atento a soporte.",
      "Ya lo resolvi, confirmo cierre.",
    ];
  }

  return [
    "Gracias equipo.",
    "Confirmado.",
    "Revisado y en seguimiento.",
  ];
}

export function createCommunityChatHandlers(deps: CommunityChatDependencies) {
  return {
    GET: async function GET(request: NextRequest) {
      const auth = await deps.requireAuth(request);
      if (!auth.ok) {
        return auth.response;
      }

      const channel = normalizeText(request.nextUrl.searchParams.get("channel") ?? "chat-principal") as CommunityChannel;
      const channelMeta = channelConfig(channel);
      if (!channelMeta) {
        return NextResponse.json({ error: "Canal no valido" }, { status: 400 });
      }

      const profile = await deps.resolveProfile(auth.user.id, auth.user);
      const access = canAccessChannel(channel, profile);
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason ?? "Sin acceso a canal" }, { status: 403 });
      }

      const [messages, moderationLogs, typingUsers, sanction] = await Promise.all([
        listMessages(deps, channel),
        listModerationLogs(deps, channel),
        listTyping(deps, channel),
        hasActiveSanction(deps, auth.user.id, channel),
      ]);

      const connectedUsers = new Set(
        messages
          .filter((item) => !item.deletedAt)
          .slice(-40)
          .map((item) => item.userId)
      );

      typingUsers.forEach((item) => connectedUsers.add(item.userId));

      return NextResponse.json(
        {
          data: {
            channel,
            availableChannels: CHANNELS.filter((entry) => canAccessChannel(entry.id, profile).allowed).map((entry) => entry.id),
            messages,
            typingUsers,
            moderationLogs,
            quickReplies: quickRepliesForChannel(channel),
            connectedUsers: connectedUsers.size,
            sanction,
            profile,
          },
        },
        { status: 200 }
      );
    },

    POST: async function POST(request: NextRequest) {
      const auth = await deps.requireAuth(request);
      if (!auth.ok) {
        return auth.response;
      }

      const body = (await request.json().catch(() => ({}))) as {
        action?: "send" | "report" | "edit" | "delete" | "pin" | "read" | "typing";
        channelId?: string;
        message?: string;
        messageId?: string;
        reason?: string;
        parentMessageId?: string;
        pin?: boolean;
      };

      const action = normalizeText(body.action || "send") as "send" | "report" | "edit" | "delete" | "pin" | "read" | "typing";
      const channelId = normalizeText(body.channelId || "chat-principal") as CommunityChannel;
      const channelMeta = channelConfig(channelId);
      if (!channelMeta) {
        return NextResponse.json({ error: "Canal no valido" }, { status: 400 });
      }

      const profile = await deps.resolveProfile(auth.user.id, auth.user);
      const access = canAccessChannel(channelId, profile);
      if (!access.allowed) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_permission",
          reason: access.reason ?? "Sin acceso",
        });
        return NextResponse.json({ error: access.reason ?? "Sin acceso al canal" }, { status: 403 });
      }

      const sanction = await hasActiveSanction(deps, auth.user.id, channelId);
      if (sanction.active && action !== "read" && action !== "typing") {
        return NextResponse.json(
          { error: `Tu cuenta tiene sancion activa (${sanction.type ?? "bloqueo"}). Motivo: ${sanction.reason ?? "moderacion"}` },
          { status: 403 }
        );
      }

      if (action === "typing") {
        await saveTyping(deps, {
          channelId,
          userId: auth.user.id,
          userName: auth.user.nombre || auth.user.email || "Miembro",
          expiresInSeconds: 12,
        });
        return NextResponse.json({ data: { typing: true } }, { status: 200 });
      }

      if (action === "read") {
        const messageId = normalizeText(body.messageId);
        if (!messageId) {
          return NextResponse.json({ error: "messageId es requerido" }, { status: 400 });
        }

        await markMessageRead(deps, { messageId, userId: auth.user.id });
        return NextResponse.json({ data: { read: true, messageId } }, { status: 200 });
      }

      if (action === "edit") {
        const messageId = normalizeText(body.messageId);
        const content = normalizeText(body.message);
        if (!messageId || !content) {
          return NextResponse.json({ error: "messageId y message son requeridos" }, { status: 400 });
        }

        const result = await editMessage(deps, { messageId, userId: auth.user.id, content });
        if (!result) {
          return NextResponse.json({ error: "No fue posible editar el mensaje" }, { status: 403 });
        }

        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "message_edit",
          reason: "Edicion de mensaje propio",
          metadata: { messageId },
        });

        return NextResponse.json({ data: { edited: true, messageId } }, { status: 200 });
      }

      if (action === "delete") {
        const messageId = normalizeText(body.messageId);
        if (!messageId) {
          return NextResponse.json({ error: "messageId es requerido" }, { status: 400 });
        }

        const result = await deleteMessage(deps, { messageId, userId: auth.user.id, isAdmin: profile.isAdmin });
        if (!result) {
          return NextResponse.json({ error: "No fue posible eliminar el mensaje" }, { status: 403 });
        }

        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "message_delete",
          reason: profile.isAdmin ? "Eliminacion administrativa" : "Eliminacion de mensaje propio",
          metadata: { messageId },
        });

        return NextResponse.json({ data: { deleted: true, messageId } }, { status: 200 });
      }

      if (action === "pin") {
        const messageId = normalizeText(body.messageId);
        if (!messageId) {
          return NextResponse.json({ error: "messageId es requerido" }, { status: 400 });
        }

        const result = await pinMessage(deps, {
          messageId,
          userId: auth.user.id,
          isAdmin: profile.isAdmin,
          pin: Boolean(body.pin),
        });

        if (!result) {
          return NextResponse.json({ error: "Solo administradores pueden anclar mensajes" }, { status: 403 });
        }

        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: Boolean(body.pin) ? "message_pin" : "message_unpin",
          reason: "Anclado administrativo",
          metadata: { messageId },
        });

        return NextResponse.json({ data: { pinned: Boolean(body.pin), messageId } }, { status: 200 });
      }

      if (action === "report") {
        const messageId = normalizeText(body.messageId);
        const reason = normalizeText(body.reason) || "Reporte manual";
        if (!messageId) {
          return NextResponse.json({ error: "messageId es requerido para reportar" }, { status: 400 });
        }

        const report = await saveReport(deps, {
          channelId,
          messageId,
          reportedBy: auth.user.id,
          reason,
        });

        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "report",
          reason,
          metadata: { messageId, reportId: report.id },
        });

        return NextResponse.json({ data: { reported: true, reportId: report.id } }, { status: 201 });
      }

      const content = normalizeText(body.message);
      if (!content) {
        return NextResponse.json({ error: "message es requerido" }, { status: 400 });
      }

      if (content.length > 500) {
        return NextResponse.json({ error: "El mensaje supera el limite de 500 caracteres" }, { status: 400 });
      }

      const badWord = detectOffensiveWord(content);
      if (badWord) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_offensive",
          reason: `Lenguaje ofensivo detectado: ${badWord}`,
        });

        await applySanction(deps, {
          userId: auth.user.id,
          channelId,
          type: "mute",
          reason: "Lenguaje ofensivo",
          durationMinutes: 10,
          metadata: { badWord },
        });

        return NextResponse.json({ error: "Mensaje bloqueado por lenguaje no permitido" }, { status: 400 });
      }

      if (detectAdvertising(content)) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_advertising",
          reason: "Publicidad no permitida",
        });

        await applySanction(deps, {
          userId: auth.user.id,
          channelId,
          type: "temporary_block",
          reason: "Publicidad no permitida",
          durationMinutes: 15,
        });

        return NextResponse.json({ error: "Mensaje bloqueado por publicidad no permitida" }, { status: 400 });
      }

      if (detectPhishing(content) || containsMaliciousLink(content)) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_phishing",
          reason: "Patron de phishing/enlace peligroso detectado",
        });

        await applySanction(deps, {
          userId: auth.user.id,
          channelId,
          type: "temporary_block",
          reason: "Phishing o enlace peligroso",
          durationMinutes: 30,
        });

        return NextResponse.json({ error: "Mensaje bloqueado por riesgo de seguridad" }, { status: 400 });
      }

      const isFlood = detectFlood(auth.user.id);
      if (isFlood) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_flood",
          reason: "Flood detectado",
        });

        await applySanction(deps, {
          userId: auth.user.id,
          channelId,
          type: "mute",
          reason: "Flood detectado",
          durationMinutes: 5,
        });

        return NextResponse.json({ error: "Flood detectado. Espera antes de enviar mas mensajes." }, { status: 429 });
      }

      const recentMessages = await listMessages(deps, channelId);
      const duplicated = recentMessages
        .filter((item) => item.userId === auth.user.id)
        .slice(-2)
        .some((item) => item.content.trim().toLowerCase() === content.toLowerCase());

      if (duplicated) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_spam_duplicate",
          reason: "Mensaje duplicado consecutivo",
        });
        return NextResponse.json({ error: "No puedes enviar mensajes duplicados consecutivos" }, { status: 429 });
      }

      const rateResult = enforceRateLimit(auth.user.id, profile);
      if (!rateResult.ok) {
        await logModeration(deps, {
          userId: auth.user.id,
          channelId,
          action: "blocked_rate_limit",
          reason: "Limite de mensajes por minuto excedido",
          metadata: { retryAfter: rateResult.retryAfter },
        });

        return NextResponse.json(
          { error: "Limite de mensajes por minuto excedido", retryAfter: rateResult.retryAfter },
          { status: 429 }
        );
      }

      const mentions = parseMentions(content);
      const parentMessageId = normalizeText(body.parentMessageId) || null;
      const result = await saveMessage(deps, {
        channelId,
        userId: auth.user.id,
        userName: auth.user.nombre || auth.user.email || "Miembro",
        userRole: userRole(profile),
        content,
        parentMessageId,
        mentions,
      });

      return NextResponse.json(
        {
          data: {
            id: result.id,
            channelId,
            userId: auth.user.id,
            userName: auth.user.nombre || auth.user.email || "Miembro",
            role: userRole(profile),
            content,
            mentions,
            parentMessageId,
            createdAt: result.createdAt,
          },
        },
        { status: 201 }
      );
    },
  };
}
