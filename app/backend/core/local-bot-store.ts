import "server-only";

import fs from "fs/promises";
import path from "path";

export type LocalBotLicense = {
  userId: string;
  licenseKey: string;
  purchaseDate: string;
  expiryDate?: string | null;
  active: boolean;
  brokerConnected?: "MT4" | "MT5" | null;
};

export type LocalBotStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
};

export type LocalBotInstance = {
  id: string;
  userId: string;
  name: string;
  strategy: "grid" | "momentum" | "breakout" | "scalping";
  status: "inactive" | "running" | "paused" | "error";
  symbol: string;
  riskLevel: "low" | "medium" | "high";
  configuration: Record<string, unknown>;
  createdAt: string;
  startedAt?: string | null;
  stats: LocalBotStats;
};

export type LocalBotConnection = {
  id: string;
  userId: string;
  botInstanceId: string;
  brokerType: "MT4" | "MT5";
  server: string;
  login: string;
  mode: string;
  connectionStatus: string;
  lastSyncedAt?: string | null;
  heartbeatAt?: string | null;
  reconnectAttempts: number;
  diagnosticSummary?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LocalBotLog = {
  id: string;
  userId: string;
  botInstanceId: string | null;
  level: "info" | "warning" | "error";
  eventType: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type LocalBotUpdate = {
  version: string;
  releaseDate: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
};

type LocalBotStore = {
  licenses: LocalBotLicense[];
  instances: LocalBotInstance[];
  connections: LocalBotConnection[];
  logs: LocalBotLog[];
  updates: LocalBotUpdate[];
};

const STORE_PATH = path.join(process.cwd(), "data", "bot-state.json");

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blankStore(): LocalBotStore {
  return {
    licenses: [],
    instances: [],
    connections: [],
    logs: [],
    updates: [
      {
        version: "1.0.0",
        releaseDate: nowIso(),
        features: ["Consola operativa premium", "Lectura de Master Signal", "Bloqueo por licencia y broker"],
        improvements: ["Persistencia local en desarrollo", "Visibilidad de conexiones y diagnósticos"],
        bugFixes: [],
      },
    ],
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<LocalBotStore> {
  await ensureStoreDir();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await fs.readFile(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalBotStore> | null;
      return {
        ...blankStore(),
        ...(parsed ?? {}),
      };
    } catch (error) {
      const maybeFsError = error as NodeJS.ErrnoException;
      if (maybeFsError?.code === "ENOENT") {
        const store = blankStore();
        await writeStore(store);
        return store;
      }

      const transientFsIssue = ["EBUSY", "EPERM", "EACCES"].includes(String(maybeFsError?.code));
      const jsonRace = error instanceof SyntaxError;
      if (attempt < 2 && (transientFsIssue || jsonRace)) {
        await sleep(30 * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Bot store unavailable");
}

async function writeStore(store: LocalBotStore) {
  await ensureStoreDir();
  const payload = JSON.stringify(store, null, 2);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const tempPath = `${STORE_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    try {
      await fs.writeFile(tempPath, payload, "utf8");
      await fs.rename(tempPath, STORE_PATH);
      return;
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // noop
      }
      const maybeFsError = error as NodeJS.ErrnoException;
      const transientFsIssue = ["EBUSY", "EPERM", "EACCES"].includes(String(maybeFsError?.code));
      if (attempt < 2 && transientFsIssue) {
        await sleep(30 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
}

export async function getLocalBotLicense(userId: string) {
  const store = await readStore();
  return store.licenses.find((item) => item.userId === userId) ?? null;
}

export async function upsertLocalBotLicense(license: LocalBotLicense) {
  const store = await readStore();
  store.licenses = [license, ...store.licenses.filter((item) => item.userId !== license.userId)];
  await writeStore(store);
  return license;
}

export async function listLocalBotInstances(userId: string) {
  const store = await readStore();
  return store.instances.filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLocalBotInstanceById(botId: string) {
  const store = await readStore();
  return store.instances.find((item) => item.id === botId) ?? null;
}

export async function upsertLocalBotInstance(instance: LocalBotInstance) {
  const store = await readStore();
  store.instances = [instance, ...store.instances.filter((item) => item.id !== instance.id)];
  await writeStore(store);
  return instance;
}

export async function updateLocalBotInstance(userId: string, botId: string, patch: Partial<LocalBotInstance>) {
  const store = await readStore();
  const index = store.instances.findIndex((item) => item.id === botId && item.userId === userId);
  if (index < 0) return null;
  store.instances[index] = { ...store.instances[index], ...patch };
  await writeStore(store);
  return store.instances[index];
}

export async function listLocalBotConnections(userId: string) {
  const store = await readStore();
  return store.connections.filter((item) => item.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertLocalBotConnection(connection: LocalBotConnection) {
  const store = await readStore();
  store.connections = [connection, ...store.connections.filter((item) => item.id !== connection.id && !(item.botInstanceId === connection.botInstanceId && item.userId === connection.userId))];
  await writeStore(store);
  return connection;
}

export async function updateLocalBotConnection(userId: string, botInstanceId: string, patch: Partial<LocalBotConnection>) {
  const store = await readStore();
  const index = store.connections.findIndex((item) => item.userId === userId && item.botInstanceId === botInstanceId);
  if (index < 0) return null;
  store.connections[index] = { ...store.connections[index], ...patch, updatedAt: nowIso() };
  await writeStore(store);
  return store.connections[index];
}

export async function listLocalBotLogs(userId: string, limit = 25) {
  const store = await readStore();
  return store.logs.filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function recordLocalBotLog(log: LocalBotLog) {
  const store = await readStore();
  store.logs = [log, ...store.logs.filter((item) => item.id !== log.id)].slice(0, 200);
  await writeStore(store);
  return log;
}

export async function listLocalBotUpdates() {
  const store = await readStore();
  return store.updates.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}
