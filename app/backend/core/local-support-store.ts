import fs from "fs/promises";
import path from "path";

export type SupportConversationTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type SupportConversation = {
  conversationId: string;
  userId: string | null;
  lastIntentId: string | null;
  turns: SupportConversationTurn[];
  createdAt: string;
  updatedAt: string;
};

type LocalSupportStore = {
  conversations: SupportConversation[];
};

const STORE_PATH = path.join(process.cwd(), "data", "support-ai-state.json");

function nowIso(): string {
  return new Date().toISOString();
}

function blankStore(): LocalSupportStore {
  return {
    conversations: [],
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<LocalSupportStore> {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = (JSON.parse(raw) as Partial<LocalSupportStore>) ?? {};
    return {
      ...blankStore(),
      ...parsed,
    };
  } catch {
    const store = blankStore();
    await writeStore(store);
    return store;
  }
}

async function writeStore(store: LocalSupportStore) {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function buildSupportConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildSupportTurnId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getSupportConversation(conversationId: string): Promise<SupportConversation | null> {
  const store = await readStore();
  return store.conversations.find((item) => item.conversationId === conversationId) ?? null;
}

export async function upsertSupportConversation(input: {
  conversationId: string;
  userId: string | null;
  lastIntentId: string | null;
  turns: SupportConversationTurn[];
}): Promise<SupportConversation> {
  const store = await readStore();
  const existing = store.conversations.find((item) => item.conversationId === input.conversationId) ?? null;
  const now = nowIso();

  const next: SupportConversation = {
    conversationId: input.conversationId,
    userId: input.userId,
    lastIntentId: input.lastIntentId,
    turns: input.turns.slice(-30),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.conversations = [next, ...store.conversations.filter((item) => item.conversationId !== input.conversationId)].slice(0, 1000);
  await writeStore(store);
  return next;
}
