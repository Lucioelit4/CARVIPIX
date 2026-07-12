import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export type SandboxProvider = "MT5_SANDBOX" | "SIMULATED_BROKER";

export type SandboxConnectionStatus = "disconnected" | "connecting" | "connected" | "degraded" | "error";

export type SandboxConnectInput = {
  provider: SandboxProvider;
  server: string;
  login: string;
  password: string;
  mode: "demo";
};

export type SandboxAccountState = {
  accountId: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  status: "healthy" | "warning" | "critical";
};

export type SandboxOrderInput = {
  orderId: string;
  symbol: string;
  type: "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP";
  lots: number;
  requestedPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
};

export type SandboxOrderResult = {
  brokerOrderId: string;
  executionPrice: number;
  slippagePips: number;
  spreadPips: number;
  filledLots: number;
  status: "filled" | "rejected";
  reason?: string;
};

export type SandboxPositionState = {
  brokerPositionId: string;
  orderId: string;
  symbol: string;
  direction: "long" | "short";
  lots: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt?: string;
};

export type BrokerConnectorInterface = {
  connect(input: SandboxConnectInput): Promise<{ connected: boolean; accountId: string; latencyMs: number }>;
  heartbeat(): Promise<{ connected: boolean; latencyMs: number; timestamp: string }>;
  reconnect(): Promise<{ connected: boolean; attempts: number }>;
  syncAccount(): Promise<SandboxAccountState>;
  placeOrder(order: SandboxOrderInput): Promise<SandboxOrderResult>;
  syncPositions(): Promise<SandboxPositionState[]>;
  closePosition(positionId: string, ratio?: number): Promise<{ ok: boolean; realizedPnl: number; closedLots: number }>;
};

type VaultEntry = {
  id: string;
  provider: SandboxProvider;
  server: string;
  login: string;
  encryptedSecret: string;
  nonce: string;
  tag: string;
  mode: "demo";
  createdAt: string;
  updatedAt: string;
};

type DriverState = {
  activeVaultId: string | null;
  connected: boolean;
  reconnectAttempts: number;
  account: SandboxAccountState;
  positions: SandboxPositionState[];
};

const VAULT_PATH = path.join(process.cwd(), "data", "sandbox-credential-vault.json");
const DRIVER_STATE_PATH = path.join(process.cwd(), "data", "sandbox-driver-state.json");

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function keyMaterial(): Buffer {
  const source = process.env.SANDBOX_VAULT_KEY?.trim();
  if (!source) {
    throw new Error("CARVIPIX_STARTUP_BLOCKED: Missing required environment variable: SANDBOX_VAULT_KEY");
  }
  return crypto.createHash("sha256").update(source).digest();
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedSecret: encrypted.toString("base64"),
    nonce: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decryptSecret(entry: VaultEntry): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    keyMaterial(),
    Buffer.from(entry.nonce, "base64")
  );
  decipher.setAuthTag(Buffer.from(entry.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(entry.encryptedSecret, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

async function readVault(): Promise<VaultEntry[]> {
  try {
    const raw = await fs.readFile(VAULT_PATH, "utf8");
    return (JSON.parse(raw) as VaultEntry[]) ?? [];
  } catch {
    return [];
  }
}

async function writeVault(entries: VaultEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(VAULT_PATH), { recursive: true });
  await fs.writeFile(VAULT_PATH, JSON.stringify(entries.slice(0, 50), null, 2), "utf8");
}

async function upsertVaultCredential(input: SandboxConnectInput): Promise<VaultEntry> {
  const entries = await readVault();
  const existing = entries.find((item) => item.provider === input.provider && item.server === input.server && item.login === input.login) ?? null;
  const encrypted = encryptSecret(input.password);

  if (existing) {
    existing.encryptedSecret = encrypted.encryptedSecret;
    existing.nonce = encrypted.nonce;
    existing.tag = encrypted.tag;
    existing.updatedAt = nowIso();
    await writeVault(entries);
    return existing;
  }

  const created: VaultEntry = {
    id: createId("vault"),
    provider: input.provider,
    server: input.server,
    login: input.login,
    encryptedSecret: encrypted.encryptedSecret,
    nonce: encrypted.nonce,
    tag: encrypted.tag,
    mode: "demo",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  entries.unshift(created);
  await writeVault(entries);
  return created;
}

async function getVaultCredential(vaultId: string): Promise<VaultEntry | null> {
  const entries = await readVault();
  return entries.find((item) => item.id === vaultId) ?? null;
}

function defaultDriverState(): DriverState {
  return {
    activeVaultId: null,
    connected: false,
    reconnectAttempts: 0,
    account: {
      accountId: "SIM-DEMO-001",
      balance: 10000,
      equity: 10000,
      margin: 0,
      freeMargin: 10000,
      leverage: 100,
      status: "healthy",
    },
    positions: [],
  };
}

async function readDriverState(): Promise<DriverState> {
  try {
    const raw = await fs.readFile(DRIVER_STATE_PATH, "utf8");
    return (JSON.parse(raw) as DriverState) ?? defaultDriverState();
  } catch {
    return defaultDriverState();
  }
}

async function writeDriverState(state: DriverState): Promise<void> {
  await fs.mkdir(path.dirname(DRIVER_STATE_PATH), { recursive: true });
  await fs.writeFile(DRIVER_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

function priceSeed(symbol: string): number {
  const base = symbol
    .toUpperCase()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return base / 100;
}

function simulatedPrice(symbol: string): number {
  const seed = priceSeed(symbol);
  const wave = Math.sin(Date.now() / 60000) * 0.0007;
  return Number((seed + wave).toFixed(5));
}

function simulatedSpreadPips(symbol: string): number {
  const spread = symbol.includes("USD") ? 1.2 : 2.1;
  return Number(spread.toFixed(2));
}

function simulatedSlippagePips(lots: number): number {
  const slippage = Math.max(0.1, Math.min(2.5, lots * 0.35));
  return Number(slippage.toFixed(2));
}

class SandboxBrokerDriver implements BrokerConnectorInterface {
  async connect(input: SandboxConnectInput): Promise<{ connected: boolean; accountId: string; latencyMs: number }> {
    const startedAt = Date.now();
    const vaultEntry = await upsertVaultCredential(input);
    const state = await readDriverState();

    state.activeVaultId = vaultEntry.id;
    state.connected = true;
    state.reconnectAttempts = 0;
    state.account.accountId = `${input.provider}-DEMO-${input.login}`;

    await writeDriverState(state);

    return {
      connected: true,
      accountId: state.account.accountId,
      latencyMs: Math.max(30, Date.now() - startedAt),
    };
  }

  async heartbeat(): Promise<{ connected: boolean; latencyMs: number; timestamp: string }> {
    const startedAt = Date.now();
    const state = await readDriverState();

    const connected = state.connected && Boolean(state.activeVaultId);
    return {
      connected,
      latencyMs: Math.max(20, Date.now() - startedAt),
      timestamp: nowIso(),
    };
  }

  async reconnect(): Promise<{ connected: boolean; attempts: number }> {
    const state = await readDriverState();
    state.reconnectAttempts += 1;

    if (!state.activeVaultId) {
      state.connected = false;
      await writeDriverState(state);
      return { connected: false, attempts: state.reconnectAttempts };
    }

    const credential = await getVaultCredential(state.activeVaultId);
    if (!credential) {
      state.connected = false;
      await writeDriverState(state);
      return { connected: false, attempts: state.reconnectAttempts };
    }

    try {
      decryptSecret(credential);
      state.connected = true;
      await writeDriverState(state);
      return { connected: true, attempts: state.reconnectAttempts };
    } catch {
      state.connected = false;
      await writeDriverState(state);
      return { connected: false, attempts: state.reconnectAttempts };
    }
  }

  async syncAccount(): Promise<SandboxAccountState> {
    const state = await readDriverState();
    const openProfit = state.positions
      .filter((position) => position.status === "open")
      .reduce((sum, position) => sum + position.profit - position.commission - position.swap, 0);

    const openMargin = state.positions
      .filter((position) => position.status === "open")
      .reduce((sum, position) => sum + position.lots * 100, 0);

    state.account.equity = Number((state.account.balance + openProfit).toFixed(2));
    state.account.margin = Number(openMargin.toFixed(2));
    state.account.freeMargin = Number((state.account.equity - openMargin).toFixed(2));

    const health = state.account.balance > 0
      ? (state.account.equity / state.account.balance) * 100
      : 0;

    state.account.status = health >= 70 ? "healthy" : health >= 40 ? "warning" : "critical";

    await writeDriverState(state);
    return { ...state.account };
  }

  async placeOrder(order: SandboxOrderInput): Promise<SandboxOrderResult> {
    const state = await readDriverState();
    if (!state.connected) {
      return {
        brokerOrderId: createId("brk-order"),
        executionPrice: 0,
        slippagePips: 0,
        spreadPips: 0,
        filledLots: 0,
        status: "rejected",
        reason: "Sandbox broker is disconnected.",
      };
    }

    const marketPrice = simulatedPrice(order.symbol);
    const spreadPips = simulatedSpreadPips(order.symbol);
    const slippagePips = simulatedSlippagePips(order.lots);
    const pipValue = 0.0001;
    const signedMove = order.type.startsWith("SELL") ? -1 : 1;
    const executionPrice = Number((marketPrice + signedMove * (slippagePips * pipValue)).toFixed(5));

    const position: SandboxPositionState = {
      brokerPositionId: createId("brk-pos"),
      orderId: order.orderId,
      symbol: order.symbol,
      direction: order.type.startsWith("SELL") ? "short" : "long",
      lots: order.lots,
      openPrice: executionPrice,
      currentPrice: executionPrice,
      profit: 0,
      swap: 0,
      commission: Number((order.lots * 0.7).toFixed(2)),
      status: "open",
      openedAt: nowIso(),
    };

    state.positions.unshift(position);
    await writeDriverState(state);

    return {
      brokerOrderId: createId("brk-order"),
      executionPrice,
      slippagePips,
      spreadPips,
      filledLots: order.lots,
      status: "filled",
    };
  }

  async syncPositions(): Promise<SandboxPositionState[]> {
    const state = await readDriverState();

    for (const position of state.positions) {
      if (position.status !== "open") {
        continue;
      }

      const nextPrice = simulatedPrice(position.symbol);
      position.currentPrice = nextPrice;
      const directional = position.direction === "long" ? 1 : -1;
      const delta = (nextPrice - position.openPrice) * directional;
      position.profit = Number((delta * 100000 * position.lots).toFixed(2));
      position.swap = Number((position.lots * 0.03).toFixed(2));
    }

    await writeDriverState(state);
    return state.positions.map((position) => ({ ...position }));
  }

  async closePosition(positionId: string, ratio = 1): Promise<{ ok: boolean; realizedPnl: number; closedLots: number }> {
    const state = await readDriverState();
    const position = state.positions.find((item) => item.brokerPositionId === positionId && item.status === "open");
    if (!position) {
      return { ok: false, realizedPnl: 0, closedLots: 0 };
    }

    const safeRatio = Math.max(0.01, Math.min(1, ratio));
    const closedLots = Number((position.lots * safeRatio).toFixed(2));
    const realizedPnl = Number(((position.profit - position.commission - position.swap) * safeRatio).toFixed(2));

    state.account.balance = Number((state.account.balance + realizedPnl).toFixed(2));

    if (safeRatio >= 1) {
      position.status = "closed";
      position.closedAt = nowIso();
    } else {
      position.lots = Number((position.lots - closedLots).toFixed(2));
      position.profit = Number((position.profit * (1 - safeRatio)).toFixed(2));
      position.commission = Number((position.commission * (1 - safeRatio)).toFixed(2));
      position.swap = Number((position.swap * (1 - safeRatio)).toFixed(2));
    }

    await writeDriverState(state);
    return { ok: true, realizedPnl, closedLots };
  }
}

const sandboxBrokerDriver = new SandboxBrokerDriver();

export function getSandboxBrokerDriver(): BrokerConnectorInterface {
  return sandboxBrokerDriver;
}

export async function connectSandboxBroker(input: SandboxConnectInput) {
  return sandboxBrokerDriver.connect(input);
}

export async function heartbeatSandboxBroker() {
  return sandboxBrokerDriver.heartbeat();
}

export async function reconnectSandboxBroker() {
  return sandboxBrokerDriver.reconnect();
}

export async function syncSandboxAccount() {
  return sandboxBrokerDriver.syncAccount();
}

export async function syncSandboxPositions() {
  return sandboxBrokerDriver.syncPositions();
}

export async function getSanitizedVaultEntries() {
  const entries = await readVault();
  return entries.map((entry) => ({
    id: entry.id,
    provider: entry.provider,
    server: entry.server,
    login: entry.login,
    mode: entry.mode,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}
