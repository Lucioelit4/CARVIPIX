import fs from "fs/promises";
import path from "path";

export type LocalCommunityMessage = {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  role: string;
  content: string;
  parentMessageId: string | null;
  mentions: string[];
  readBy: string[];
  editedAt: string | null;
  deletedAt: string | null;
  isPinned: boolean;
  pinnedBy: string | null;
  moderated: boolean;
  moderationReason: string | null;
  createdAt: string;
};

export type LocalCommunityReport = {
  id: string;
  messageId: string;
  channelId: string;
  reportedBy: string;
  reason: string;
  createdAt: string;
};

export type LocalModerationLog = {
  id: string;
  userId: string;
  channelId: string;
  action: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type LocalTypingPresence = {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  expiresAt: string;
  createdAt: string;
};

export type LocalCommunitySanction = {
  id: string;
  userId: string;
  channelId: string | null;
  sanctionType: "mute" | "temporary_block" | "kick";
  reason: string;
  active: boolean;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type LocalCommunityStore = {
  messages: LocalCommunityMessage[];
  reports: LocalCommunityReport[];
  moderationLogs: LocalModerationLog[];
  typingPresence: LocalTypingPresence[];
  sanctions: LocalCommunitySanction[];
};

const STORE_PATH = path.join(process.cwd(), "data", "community-state.json");

function nowIso() {
  return new Date().toISOString();
}

function blankStore(): LocalCommunityStore {
  return {
    messages: [],
    reports: [],
    moderationLogs: [],
    typingPresence: [],
    sanctions: [],
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<LocalCommunityStore> {
  try {
    await ensureStoreDir();
  } catch {
    return blankStore();
  }

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = (JSON.parse(raw) as Partial<LocalCommunityStore>) ?? {};
    return {
      ...blankStore(),
      ...parsed,
    };
  } catch {
    return blankStore();
  }
}

async function writeStore(store: LocalCommunityStore) {
  try {
    await ensureStoreDir();
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Best-effort local cache for environments with writable filesystem.
  }
}

export async function listLocalCommunityMessages(channelId: string, limit: number) {
  const store = await readStore();
  return store.messages
    .filter((item) => item.channelId === channelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .reverse();
}

export async function addLocalCommunityMessage(message: LocalCommunityMessage) {
  const store = await readStore();
  store.messages = [...store.messages.filter((item) => item.id !== message.id), message].slice(-2000);
  await writeStore(store);
  return message;
}

export async function updateLocalCommunityMessage(
  messageId: string,
  patch: Partial<Pick<LocalCommunityMessage, "content" | "editedAt" | "deletedAt" | "isPinned" | "pinnedBy" | "readBy">>
) {
  const store = await readStore();
  const index = store.messages.findIndex((item) => item.id === messageId);
  if (index < 0) return null;
  store.messages[index] = { ...store.messages[index], ...patch };
  await writeStore(store);
  return store.messages[index];
}

export async function getLocalCommunityMessage(messageId: string) {
  const store = await readStore();
  return store.messages.find((item) => item.id === messageId) ?? null;
}

export async function addLocalCommunityReport(report: LocalCommunityReport) {
  const store = await readStore();
  store.reports = [...store.reports.filter((item) => item.id !== report.id), report].slice(-2000);
  await writeStore(store);
  return report;
}

export async function addLocalModerationLog(log: LocalModerationLog) {
  const store = await readStore();
  store.moderationLogs = [...store.moderationLogs.filter((item) => item.id !== log.id), log].slice(-4000);
  await writeStore(store);
  return log;
}

export async function listLocalModerationLogs(channelId: string, limit: number) {
  const store = await readStore();
  return store.moderationLogs
    .filter((item) => item.channelId === channelId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function upsertLocalTypingPresence(entry: LocalTypingPresence) {
  const store = await readStore();
  const now = new Date();
  store.typingPresence = store.typingPresence.filter((item) => new Date(item.expiresAt) > now);
  store.typingPresence = [
    entry,
    ...store.typingPresence.filter((item) => !(item.channelId === entry.channelId && item.userId === entry.userId)),
  ].slice(0, 2000);
  await writeStore(store);
  return entry;
}

export async function listLocalTypingPresence(channelId: string) {
  const store = await readStore();
  const now = new Date();
  const filtered = store.typingPresence.filter((item) => item.channelId === channelId && new Date(item.expiresAt) > now);
  if (filtered.length !== store.typingPresence.length) {
    store.typingPresence = store.typingPresence.filter((item) => new Date(item.expiresAt) > now);
    await writeStore(store);
  }
  return filtered;
}

export async function upsertLocalCommunitySanction(sanction: LocalCommunitySanction) {
  const store = await readStore();
  store.sanctions = [
    sanction,
    ...store.sanctions.filter((item) => item.id !== sanction.id),
  ].slice(0, 2000);
  await writeStore(store);
  return sanction;
}

export async function listLocalCommunitySanctions(userId: string) {
  const store = await readStore();
  return store.sanctions
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildCommunityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getCurrentIso(): string {
  return nowIso();
}
