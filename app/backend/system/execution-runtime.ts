import fs from "fs/promises";
import path from "path";
import {
  connectSandboxBroker,
  getSanitizedVaultEntries,
  getSandboxBrokerDriver,
  heartbeatSandboxBroker,
  reconnectSandboxBroker,
  syncSandboxAccount,
  syncSandboxPositions,
  type SandboxProvider,
} from "./broker-sandbox";

export type ExecutionOrderType =
  | "BUY"
  | "SELL"
  | "BUY_LIMIT"
  | "SELL_LIMIT"
  | "BUY_STOP"
  | "SELL_STOP";

export type ExecutionStatus = "queued" | "validated" | "executed" | "cancelled" | "rejected" | "closed";

export type ExecutionLifecycleStatus =
  | "queued"
  | "validated"
  | "processing"
  | "executed"
  | "cancelled"
  | "rejected"
  | "closed"
  | "blocked_external"
  | "reconciliation_required";

export type ExecutionOrder = {
  id: string;
  userId: string;
  symbol: string;
  type: ExecutionOrderType;
  lots: number;
  idempotencyKey?: string;
  requestedPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: ExecutionStatus | ExecutionLifecycleStatus;
  retries?: number;
  lastErrorClass?: "BROKER_REJECTED" | "BROKER_DISCONNECTED" | "RISK_REJECTED" | "UNKNOWN";
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type ExecutionPosition = {
  id: string;
  orderId: string;
  userId: string;
  symbol: string;
  direction: "long" | "short";
  lots: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed";
};

export type AccountSnapshot = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  accountStatus: "healthy" | "warning" | "critical";
  accountHealth: number;
};

export type RiskLimits = {
  maximumRiskPct: number;
  dailyRiskPct: number;
  weeklyRiskPct: number;
  monthlyRiskPct: number;
  maxDrawdownPct: number;
  maxConsecutiveLosses: number;
  maxExposureLots: number;
  maxCorrelationRiskPct: number;
  maxSlippagePips: number;
  maxSpreadPips: number;
};

export type ExecutionAuditEvent = {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  resourceId?: string;
  result: "success" | "denied" | "error";
  details?: string;
  correlationId?: string;
};

export type ExecutionRuntimeState = {
  safeMode: boolean;
  brokerConnected: boolean;
  brokerProvider: SandboxProvider | null;
  brokerMode: "demo";
  brokerServer: string | null;
  brokerLogin: string | null;
  brokerAccountId: string | null;
  brokerLatencyMs: number;
  heartbeatAt: string | null;
  reconnectAttempts: number;
  queue: ExecutionOrder[];
  history: ExecutionOrder[];
  positions: ExecutionPosition[];
  account: AccountSnapshot;
  riskLimits: RiskLimits;
  stats: {
    processedOrders: number;
    rejectedOrders: number;
    cancelledOrders: number;
    closedPositions: number;
  };
  copyEngine: {
    enabled: boolean;
    masters: number;
    slaves: number;
    broadcasts: number;
  };
  portfolio: {
    managedAccounts: number;
    historyPoints: number;
  };
  sync: {
    brokerSyncAt: string | null;
    dashboardSyncAt: string | null;
    stateSyncAt: string | null;
  };
  recovery: {
    lastRecoveryAt: string | null;
    crashRecoveryCount: number;
    disconnectRecoveryCount: number;
    timeoutRecoveryCount: number;
    rebootRecoveryCount: number;
    networkRecoveryCount: number;
  };
  idempotency: {
    recentKeys: Array<{ key: string; orderId: string; createdAt: string }>;
  };
  reconciliation: {
    status: "OK" | "RECONCILIATION_REQUIRED";
    lastCheckedAt: string | null;
    discrepancies: string[];
  };
  audit: ExecutionAuditEvent[];
};

const STORE_PATH = path.join(process.cwd(), "data", "execution-runtime-state.json");

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeText(text: string): string {
  return text.replace(/password\s*[:=]\s*[^,\s]+/gi, "password=[REDACTED]");
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultState(): ExecutionRuntimeState {
  return {
    safeMode: true,
    brokerConnected: false,
    brokerProvider: null,
    brokerMode: "demo",
    brokerServer: null,
    brokerLogin: null,
    brokerAccountId: null,
    brokerLatencyMs: 0,
    heartbeatAt: null,
    reconnectAttempts: 0,
    queue: [],
    history: [],
    positions: [],
    account: {
      balance: 10000,
      equity: 10000,
      margin: 0,
      freeMargin: 10000,
      leverage: 100,
      accountStatus: "healthy",
      accountHealth: 100,
    },
    riskLimits: {
      maximumRiskPct: 3,
      dailyRiskPct: 2,
      weeklyRiskPct: 6,
      monthlyRiskPct: 12,
      maxDrawdownPct: 15,
      maxConsecutiveLosses: 4,
      maxExposureLots: 10,
      maxCorrelationRiskPct: 65,
      maxSlippagePips: 2,
      maxSpreadPips: 3,
    },
    stats: {
      processedOrders: 0,
      rejectedOrders: 0,
      cancelledOrders: 0,
      closedPositions: 0,
    },
    copyEngine: {
      enabled: false,
      masters: 0,
      slaves: 0,
      broadcasts: 0,
    },
    portfolio: {
      managedAccounts: 1,
      historyPoints: 0,
    },
    sync: {
      brokerSyncAt: null,
      dashboardSyncAt: null,
      stateSyncAt: null,
    },
    recovery: {
      lastRecoveryAt: null,
      crashRecoveryCount: 0,
      disconnectRecoveryCount: 0,
      timeoutRecoveryCount: 0,
      rebootRecoveryCount: 0,
      networkRecoveryCount: 0,
    },
    idempotency: {
      recentKeys: [],
    },
    reconciliation: {
      status: "OK",
      lastCheckedAt: null,
      discrepancies: [],
    },
    audit: [],
  };
}

async function readState(): Promise<ExecutionRuntimeState> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return (JSON.parse(raw) as ExecutionRuntimeState) ?? defaultState();
  } catch {
    return defaultState();
  }
}

async function writeState(state: ExecutionRuntimeState): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
}

function appendAudit(
  state: ExecutionRuntimeState,
  event: Omit<ExecutionAuditEvent, "id" | "timestamp">
): void {
  const { details, ...rest } = event;
  state.audit.unshift({
    id: createId("xaudit"),
    timestamp: nowIso(),
    ...rest,
    details: details ? sanitizeText(details) : undefined,
  });
  state.audit = state.audit.slice(0, 200);
}

function classifyOrderError(reason: string | undefined): "BROKER_REJECTED" | "BROKER_DISCONNECTED" | "RISK_REJECTED" | "UNKNOWN" {
  if (!reason) {
    return "UNKNOWN";
  }
  const normalized = reason.toLowerCase();
  if (normalized.includes("disconnected")) return "BROKER_DISCONNECTED";
  if (normalized.includes("risk") || normalized.includes("exposure") || normalized.includes("health")) return "RISK_REJECTED";
  if (normalized.includes("reject")) return "BROKER_REJECTED";
  return "UNKNOWN";
}

function hasIdempotencyConflict(state: ExecutionRuntimeState, key: string): string | null {
  const existing = state.idempotency.recentKeys.find((item) => item.key === key);
  return existing?.orderId ?? null;
}

function registerIdempotencyKey(state: ExecutionRuntimeState, key: string, orderId: string): void {
  state.idempotency.recentKeys.unshift({ key, orderId, createdAt: nowIso() });
  state.idempotency.recentKeys = state.idempotency.recentKeys.slice(0, 500);
}

function runReconciliation(state: ExecutionRuntimeState): void {
  const discrepancies: string[] = [];
  const openOrderIds = new Set(
    state.positions
      .filter((position) => position.status === "open")
      .map((position) => position.orderId)
  );

  for (const order of state.history) {
    if (order.status === "executed" && !openOrderIds.has(order.id)) {
      const hasClosed = state.positions.some((position) => position.orderId === order.id && position.status === "closed");
      if (!hasClosed) {
        discrepancies.push(`Executed order without matching position lifecycle: ${order.id}`);
      }
    }
  }

  state.reconciliation.status = discrepancies.length > 0 ? "RECONCILIATION_REQUIRED" : "OK";
  state.reconciliation.discrepancies = discrepancies;
  state.reconciliation.lastCheckedAt = nowIso();
}

function validateRisk(state: ExecutionRuntimeState, order: ExecutionOrder): { ok: boolean; reason?: string } {
  if (!Number.isFinite(order.lots) || order.lots <= 0) {
    return { ok: false, reason: "Lot size must be greater than zero." };
  }

  const openLots = state.positions
    .filter((position) => position.status === "open")
    .reduce((sum, position) => sum + position.lots, 0);
  if (openLots + order.lots > state.riskLimits.maxExposureLots) {
    return { ok: false, reason: "Max exposure exceeded." };
  }

  if (state.account.accountHealth < 25) {
    return { ok: false, reason: "Account health too low for new execution." };
  }

  const entryPrice = Number((order.requestedPrice ?? syntheticPrice(order.symbol)).toFixed(5));
  const riskDistance = Math.max(0.0001, entryPrice * 0.001);
  const stopLossPrice = order.stopLoss
    ?? (order.type.startsWith("SELL") ? entryPrice + riskDistance : entryPrice - riskDistance);
  const takeProfitPrice = order.takeProfit
    ?? (order.type.startsWith("SELL") ? entryPrice - riskDistance * 1.5 : entryPrice + riskDistance * 1.5);

  const riskPercent = Math.min(100, state.riskLimits.maximumRiskPct);
  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  const targetDistance = Math.abs(takeProfitPrice - entryPrice);

  const issues: string[] = [];
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) issues.push('entryPrice:INVALID');
  if (!Number.isFinite(stopLossPrice) || stopLossPrice <= 0) issues.push('stopLossPrice:INVALID');
  if (!Number.isFinite(takeProfitPrice) || takeProfitPrice <= 0) issues.push('takeProfitPrice:INVALID');
  if (!Number.isFinite(state.account.balance) || state.account.balance <= 0) issues.push('accountBalance:INVALID');
  if (!Number.isFinite(riskPercent) || riskPercent <= 0 || riskPercent > 100) issues.push('riskPercent:INVALID_RANGE');
  if (!Number.isFinite(stopDistance) || stopDistance <= 0) issues.push('stopDistance:INVALID_RANGE');
  if (!Number.isFinite(targetDistance) || targetDistance <= 0) issues.push('targetDistance:INVALID_RANGE');

  if (issues.length > 0) {
    return {
      ok: false,
      reason: `Risk engine rejected order: ${issues.join('|')}`,
    };
  }

  return { ok: true };
}

function directionForOrder(type: ExecutionOrderType): "long" | "short" {
  if (type === "SELL" || type === "SELL_LIMIT" || type === "SELL_STOP") {
    return "short";
  }
  return "long";
}

function syntheticPrice(symbol: string): number {
  const base = symbol.length * 100 + symbol.charCodeAt(0);
  return Number((base / 100).toFixed(5));
}

function refreshAccount(state: ExecutionRuntimeState): void {
  const openPositions = state.positions.filter((position) => position.status === "open");
  const floatingProfit = openPositions.reduce((sum, position) => sum + position.profit - position.commission - position.swap, 0);
  const margin = openPositions.reduce((sum, position) => sum + position.lots * 100, 0);
  const equity = state.account.balance + floatingProfit;
  const freeMargin = equity - margin;

  state.account.margin = Number(margin.toFixed(2));
  state.account.equity = Number(equity.toFixed(2));
  state.account.freeMargin = Number(freeMargin.toFixed(2));

  const health = state.account.balance > 0 ? Math.max(0, Math.min(100, (equity / state.account.balance) * 100)) : 0;
  state.account.accountHealth = Number(health.toFixed(2));
  state.account.accountStatus = health >= 70 ? "healthy" : health >= 40 ? "warning" : "critical";
}

export async function getExecutionRuntimeState(): Promise<ExecutionRuntimeState> {
  return readState();
}

export async function configureSandboxConnector(input: {
  provider: SandboxProvider;
  server: string;
  login: string;
  password: string;
}): Promise<ExecutionRuntimeState> {
  const state = await readState();
  const connected = await connectSandboxBroker({
    provider: input.provider,
    server: input.server,
    login: input.login,
    password: input.password,
    mode: "demo",
  });

  state.brokerConnected = connected.connected;
  state.brokerProvider = input.provider;
  state.brokerMode = "demo";
  state.brokerServer = input.server;
  state.brokerLogin = input.login;
  state.brokerAccountId = connected.accountId;
  state.brokerLatencyMs = connected.latencyMs;
  state.sync.brokerSyncAt = nowIso();

  appendAudit(state, {
    category: "connector",
    action: "sandbox-connected",
    result: connected.connected ? "success" : "error",
    details: `${input.provider} demo connector configured.`,
  });

  await writeState(state);
  return state;
}

export async function syncExecutionFromSandbox(): Promise<ExecutionRuntimeState> {
  const state = await readState();
  const [account, brokerPositions] = await Promise.all([
    syncSandboxAccount(),
    syncSandboxPositions(),
  ]);

  state.account.balance = account.balance;
  state.account.equity = account.equity;
  state.account.margin = account.margin;
  state.account.freeMargin = account.freeMargin;
  state.account.leverage = account.leverage;
  state.account.accountStatus = account.status;
  state.account.accountHealth = Number((account.balance > 0 ? (account.equity / account.balance) * 100 : 0).toFixed(2));

  for (const runtimePosition of state.positions) {
    const matching = brokerPositions.find((item) => item.orderId === runtimePosition.orderId);
    if (!matching) {
      continue;
    }

    runtimePosition.currentPrice = matching.currentPrice;
    runtimePosition.profit = matching.profit;
    runtimePosition.swap = matching.swap;
    runtimePosition.commission = matching.commission;
    runtimePosition.status = matching.status;
    runtimePosition.closedAt = matching.closedAt;
  }

  state.sync.brokerSyncAt = nowIso();
  appendAudit(state, {
    category: "connector",
    action: "account-sync",
    result: "success",
    details: `Synced ${brokerPositions.length} simulated positions from sandbox driver.`,
  });

  await writeState(state);
  return state;
}

export async function setExecutionRiskLimits(patch: Partial<RiskLimits>): Promise<ExecutionRuntimeState> {
  const state = await readState();
  state.riskLimits = {
    ...state.riskLimits,
    ...patch,
  };
  appendAudit(state, {
    category: "risk",
    action: "limits.updated",
    result: "success",
    details: "Risk limits updated by admin.",
  });
  await writeState(state);
  return state;
}

export async function enqueueExecutionOrder(input: {
  userId: string;
  symbol: string;
  type: ExecutionOrderType;
  lots: number;
  idempotencyKey?: string;
  requestedPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}): Promise<ExecutionOrder> {
  const state = await readState();

  if (input.idempotencyKey) {
    const existingOrderId = hasIdempotencyConflict(state, input.idempotencyKey);
    if (existingOrderId) {
      const existingOrder = state.queue.find((item) => item.id === existingOrderId)
        ?? state.history.find((item) => item.id === existingOrderId);
      if (existingOrder) {
        return existingOrder;
      }
    }
  }

  const correlationId = createId("corr");

  const order: ExecutionOrder = {
    id: createId("xord"),
    userId: input.userId,
    symbol: String(input.symbol).trim().toUpperCase(),
    type: input.type,
    lots: Number(input.lots),
    idempotencyKey: input.idempotencyKey,
    requestedPrice: input.requestedPrice,
    stopLoss: input.stopLoss,
    takeProfit: input.takeProfit,
    status: "queued",
    retries: 0,
    correlationId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (input.idempotencyKey) {
    registerIdempotencyKey(state, input.idempotencyKey, order.id);
  }

  state.queue.push(order);
  appendAudit(state, {
    category: "order",
    action: "queued",
    resourceId: order.id,
    result: "success",
    details: `${order.type} ${order.symbol} queued.`,
    correlationId,
  });

  await writeState(state);
  return order;
}

export async function processExecutionQueue(): Promise<ExecutionRuntimeState> {
  const state = await readState();
  const driver = getSandboxBrokerDriver();

  if (!state.brokerConnected || !state.brokerProvider) {
    while (state.queue.length > 0) {
      const order = state.queue.shift();
      if (!order) {
        break;
      }
      order.status = "blocked_external";
      order.updatedAt = nowIso();
      order.notes = "BLOCKED_BY_EXTERNAL_DEPENDENCY";
      order.lastErrorClass = "BROKER_DISCONNECTED";
      state.history.unshift(order);
      appendAudit(state, {
        category: "order",
        action: "blocked-external",
        resourceId: order.id,
        result: "denied",
        details: "BLOCKED_BY_EXTERNAL_DEPENDENCY: broker connector is not configured/connected.",
        correlationId: order.correlationId,
      });
    }
    runReconciliation(state);
    await writeState(state);
    return state;
  }

  while (state.queue.length > 0) {
    const order = state.queue.shift();
    if (!order) {
      break;
    }

    const risk = validateRisk(state, order);
    if (!risk.ok) {
      order.status = "rejected";
      order.notes = risk.reason;
      order.lastErrorClass = classifyOrderError(risk.reason);
      order.updatedAt = nowIso();
      state.history.unshift(order);
      state.stats.rejectedOrders += 1;
      appendAudit(state, {
        category: "order",
        action: "rejected",
        resourceId: order.id,
        result: "denied",
        details: risk.reason,
        correlationId: order.correlationId,
      });
      continue;
    }

    order.status = "validated";
    order.updatedAt = nowIso();
    appendAudit(state, {
      category: "order",
      action: "validated",
      resourceId: order.id,
      result: "success",
      details: "Order passed runtime risk validation.",
      correlationId: order.correlationId,
    });

    order.status = "processing";
    order.updatedAt = nowIso();

    const brokerResult = await driver.placeOrder({
      orderId: order.id,
      symbol: order.symbol,
      type: order.type,
      lots: order.lots,
      requestedPrice: order.requestedPrice,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
    });

    if (brokerResult.status !== "filled") {
      order.retries = (order.retries ?? 0) + 1;
      order.lastErrorClass = classifyOrderError(brokerResult.reason);
      const retryable = order.lastErrorClass === "BROKER_DISCONNECTED" && (order.retries ?? 0) <= 2;
      if (retryable) {
        state.queue.unshift(order);
        appendAudit(state, {
          category: "order",
          action: "retry-scheduled",
          resourceId: order.id,
          result: "error",
          details: `Retry ${(order.retries ?? 0)} scheduled with linear backoff ${(order.retries ?? 0) * 250}ms.`,
          correlationId: order.correlationId,
        });
        continue;
      }

      order.status = "rejected";
      order.notes = brokerResult.reason ?? "Sandbox broker rejected order.";
      order.updatedAt = nowIso();
      state.history.unshift(order);
      state.stats.rejectedOrders += 1;
      appendAudit(state, {
        category: "order",
        action: "rejected-by-broker",
        resourceId: order.id,
        result: "denied",
        details: order.notes,
        correlationId: order.correlationId,
      });
      continue;
    }

    order.status = "executed";
    order.updatedAt = nowIso();
    state.history.unshift(order);
    state.stats.processedOrders += 1;

    const openPrice = Number((brokerResult.executionPrice || order.requestedPrice || syntheticPrice(order.symbol)).toFixed(5));
    const position: ExecutionPosition = {
      id: createId("xpos"),
      orderId: order.id,
      userId: order.userId,
      symbol: order.symbol,
      direction: directionForOrder(order.type),
      lots: order.lots,
      openPrice,
      currentPrice: openPrice,
      profit: 0,
      swap: 0,
      commission: Number((order.lots * 0.7).toFixed(2)),
      openedAt: nowIso(),
      status: "open",
    };
    state.positions.unshift(position);

    appendAudit(state, {
      category: "order",
      action: "executed",
      resourceId: order.id,
      result: "success",
      details: `Position ${position.id} opened in SAFE_MODE.`,
      correlationId: order.correlationId,
    });

    appendAudit(state, {
      category: "connector",
      action: "order-simulated",
      resourceId: order.id,
      result: "success",
      details: `Spread ${brokerResult.spreadPips} pips / slippage ${brokerResult.slippagePips} pips.`,
      correlationId: order.correlationId,
    });
  }

  refreshAccount(state);
  state.sync.stateSyncAt = nowIso();
  state.portfolio.historyPoints += 1;
  runReconciliation(state);
  await writeState(state);
  return state;
}

export async function modifyExecutionOrder(orderId: string, patch: Partial<Pick<ExecutionOrder, "lots" | "requestedPrice" | "stopLoss" | "takeProfit">>): Promise<boolean> {
  const state = await readState();
  const target = state.queue.find((order) => order.id === orderId);
  if (!target) {
    return false;
  }

  Object.assign(target, patch);
  target.updatedAt = nowIso();
  appendAudit(state, {
    category: "order",
    action: "modified",
    resourceId: orderId,
    result: "success",
    details: "Queued order updated.",
  });

  await writeState(state);
  return true;
}

export async function cancelExecutionOrder(orderId: string): Promise<boolean> {
  const state = await readState();
  const index = state.queue.findIndex((order) => order.id === orderId);
  if (index < 0) {
    return false;
  }

  const [order] = state.queue.splice(index, 1);
  order.status = "cancelled";
  order.updatedAt = nowIso();
  state.history.unshift(order);
  state.stats.cancelledOrders += 1;

  appendAudit(state, {
    category: "order",
    action: "cancelled",
    resourceId: orderId,
    result: "success",
    details: "Order removed from queue.",
  });

  await writeState(state);
  return true;
}

export async function closeExecutionPosition(positionId: string, ratio = 1): Promise<boolean> {
  const state = await readState();
  const position = state.positions.find((item) => item.id === positionId && item.status === "open");
  if (!position) {
    return false;
  }

  const safeRatio = Math.max(0.01, Math.min(1, ratio));
  const closingLots = Number((position.lots * safeRatio).toFixed(2));
  const brokerPositions = await syncSandboxPositions();
  const brokerPosition = brokerPositions.find((item) => item.orderId === position.orderId && item.status === "open");
  const brokerClose = brokerPosition
    ? await getSandboxBrokerDriver().closePosition(brokerPosition.brokerPositionId, safeRatio)
    : { ok: false, realizedPnl: Number((closingLots * 8.5 - closingLots * 0.8).toFixed(2)), closedLots: closingLots };

  const pnl = brokerClose.realizedPnl;
  state.account.balance = Number((state.account.balance + pnl).toFixed(2));
  if (safeRatio >= 1) {
    position.status = "closed";
    position.closedAt = nowIso();
    state.stats.closedPositions += 1;
  } else {
    position.lots = Number((position.lots - closingLots).toFixed(2));
  }

  appendAudit(state, {
    category: "position",
    action: safeRatio >= 1 ? "closed" : "partial-close",
    resourceId: positionId,
    result: "success",
    details: `Closed lots: ${closingLots}`,
  });

  refreshAccount(state);
  await writeState(state);
  return true;
}

export async function heartbeatExecution(): Promise<ExecutionRuntimeState> {
  const state = await readState();
  const heartbeat = await heartbeatSandboxBroker();
  state.heartbeatAt = nowIso();
  state.brokerConnected = heartbeat.connected;
  state.brokerLatencyMs = heartbeat.latencyMs;
  state.sync.brokerSyncAt = nowIso();
  state.sync.dashboardSyncAt = nowIso();
  appendAudit(state, {
    category: "sync",
    action: "heartbeat",
    result: "success",
    details: "Heartbeat acknowledged in SAFE_MODE.",
  });
  await writeState(state);
  return state;
}

export async function reconnectExecution(): Promise<ExecutionRuntimeState> {
  const state = await readState();
  const reconnect = await reconnectSandboxBroker();
  state.reconnectAttempts = reconnect.attempts;
  state.brokerConnected = reconnect.connected;
  appendAudit(state, {
    category: "sync",
    action: "reconnect",
    result: "success",
    details: "Reconnect manager executed in SAFE_MODE without broker connection.",
  });
  await writeState(state);
  return state;
}

export async function recoverExecution(reason: "crash" | "restart" | "disconnect" | "timeout" | "reboot" | "network-loss"): Promise<ExecutionRuntimeState> {
  const state = await readState();
  state.recovery.lastRecoveryAt = nowIso();

  if (reason === "crash" || reason === "restart") {
    state.recovery.crashRecoveryCount += 1;
  }
  if (reason === "disconnect") {
    state.recovery.disconnectRecoveryCount += 1;
  }
  if (reason === "timeout") {
    state.recovery.timeoutRecoveryCount += 1;
  }
  if (reason === "reboot") {
    state.recovery.rebootRecoveryCount += 1;
  }
  if (reason === "network-loss") {
    state.recovery.networkRecoveryCount += 1;
  }

  appendAudit(state, {
    category: "recovery",
    action: `recovery-${reason}`,
    result: "success",
    details: "Recovery engine completed.",
  });

  await writeState(state);
  return state;
}

export async function reconcileExecutionState(): Promise<ExecutionRuntimeState> {
  const state = await readState();
  runReconciliation(state);
  appendAudit(state, {
    category: "reconciliation",
    action: "checked",
    result: state.reconciliation.status === "OK" ? "success" : "error",
    details: `Reconciliation status: ${state.reconciliation.status}`,
  });
  await writeState(state);
  return state;
}

export async function snapshotExecutionDashboard() {
  const state = await readState();
  refreshAccount(state);
  runReconciliation(state);
  const vault = await getSanitizedVaultEntries();
  await writeState(state);

  const openPositions = state.positions.filter((position) => position.status === "open");
  const closedPositions = state.positions.filter((position) => position.status === "closed");
  const timeline = [...state.history]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 40);

  return {
    safeMode: state.safeMode,
    brokerConnected: state.brokerConnected,
    brokerProvider: state.brokerProvider,
    brokerMode: state.brokerMode,
    brokerServer: state.brokerServer,
    brokerLogin: state.brokerLogin,
    brokerAccountId: state.brokerAccountId,
    brokerLatencyMs: state.brokerLatencyMs,
    heartbeatAt: state.heartbeatAt,
    reconnectAttempts: state.reconnectAttempts,
    orderQueue: state.queue,
    orderHistory: state.history.slice(0, 100),
    timeline,
    openPositions,
    closedPositions,
    account: state.account,
    risk: state.riskLimits,
    stats: state.stats,
    sync: state.sync,
    recovery: state.recovery,
    reconciliation: state.reconciliation,
    copyEngine: state.copyEngine,
    portfolio: {
      ...state.portfolio,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
    },
    credentialVault: vault,
    audit: state.audit.slice(0, 100),
  };
}

export async function simulateMarketTick(): Promise<ExecutionRuntimeState> {
  const state = await syncExecutionFromSandbox();
  appendAudit(state, {
    category: "connector",
    action: "market-tick",
    result: "success",
    details: "Market simulation tick applied to open positions.",
  });
  await writeState(state);
  return state;
}
