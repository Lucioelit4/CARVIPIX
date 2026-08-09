import "server-only";

import { createHash } from "node:crypto";
import { backendDatabase } from "@/app/backend/core/database";
import {
  type ResolvedUserCommercialAccess,
  resolveUserCommercialAccess,
} from "@/app/backend/commercial/plan-entitlements-store";

const MT5_DAILY_LIMIT_BY_PLAN = {
  basic: 7,
  advanced: 25,
} as const;

type Mt5OperableDecision = "BUY" | "SELL";
type Mt5NonOperableDecision = "WAIT" | "NO_TRADE" | "CONDITIONAL_ENTRY" | "ENTRY_MISSED" | "NONE";

export type Mt5CommercialDecision = Mt5OperableDecision | Mt5NonOperableDecision;

export type Mt5CommercialGateResult = {
  allowed: boolean;
  reason:
    | "ALLOWED"
    | "NON_OPERABLE_DECISION"
    | "LICENSE_INACTIVE"
    | "MEMBERSHIP_INACTIVE"
    | "PLAN_NOT_ALLOWED"
    | "PAIR_NOT_ALLOWED"
    | "PLAN_DAILY_LIMIT_REACHED";
  userId?: string;
  subscriptionPlan?: ResolvedUserCommercialAccess["subscriptionPlan"];
  dailyLimit?: number;
  consumedToday?: number;
  alreadyCountedSignal?: boolean;
};

// ============================================================================
// BOT MT5 EXECUTION SERVICE
// ============================================================================

export type BotMT5Installation = {
  id: string;
  userId: string;
  licenseId: string;
  installationId: string;
  accountHash: string;
  accountNumber: number;
  brokerServer: string;
  magicNumber: number;
  eaVersion: string;
  status: "VALIDATING" | "ACTIVE" | "READ_ONLY" | "SUSPENDED" | "ERROR";
  createdAt: Date;
  lastHeartbeat: Date | null;
  isRevoked: boolean;
  maxOpenTrades: number;
  maxDailyTrades: number;
  maxDailyLossPercent: number;
};

export type BotMT5Signal = {
  id: string;
  signalId: string;
  analysisId: string;
  licenseId: string;
  symbol: string;
  decision: "BUY" | "SELL" | "NONE";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  signature: string;
  expiresAt: Date;
  createdAt: Date;
  deliveredAt: Date | null;
  status: "PENDING" | "DELIVERED" | "EXECUTED" | "EXPIRED" | "REJECTED";
};

export type BotMT5Execution = {
  id: string;
  signalId: string;
  licenseId: string;
  installationId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  requestedEntry: number;
  executedEntry: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  magicNumber: number;
  brokerOrderId: number;
  brokerServerResponse: string;
  status: "PENDING" | "EXECUTED" | "FAILED" | "CLOSED";
  openedAt: Date;
  closedAt: Date | null;
  exitPrice: number | null;
  grossPnL: number | null;
  netPnL: number | null;
  commission: number | null;
  swap: number | null;
  slippage: number | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type BotMT5Heartbeat = {
  id: string;
  licenseId: string;
  installationId: string;
  eaVersion: string;
  status: string;
  openPositions: number;
  equity: number;
  balance: number;
  accountHash: string;
  brokerServer: string;
  receivedAt: Date;
};

let mt5RoutingSchemaReady: Promise<void> | null = null;

async function ensureMt5RoutingSchema(): Promise<void> {
  if (!backendDatabase.enabled) {
    return;
  }

  if (!mt5RoutingSchemaReady) {
    mt5RoutingSchemaReady = (async () => {
      await backendDatabase.query("ALTER TABLE bot_mt5_installations ADD COLUMN IF NOT EXISTS broker_symbol TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_installations ADD COLUMN IF NOT EXISTS canonical_symbol TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS canonical_symbol TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS signal_mode TEXT NOT NULL DEFAULT 'SHORT'");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS validity_minutes INTEGER");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS source TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS event_id TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals DROP CONSTRAINT IF EXISTS valid_entry_levels");
      await backendDatabase.query(
        `ALTER TABLE bot_mt5_signals ADD CONSTRAINT valid_entry_levels CHECK (
          (decision = 'BUY' AND take_profit > entry AND entry > stop_loss)
          OR (decision = 'SELL' AND stop_loss > entry AND entry > take_profit)
          OR decision = 'NONE'
        ) NOT VALID`
      );
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS delivered_installation_id TEXT");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ");
      await backendDatabase.query(
        `CREATE TABLE IF NOT EXISTS bot_mt5_signal_runtime_events (
          id TEXT PRIMARY KEY,
          signal_id TEXT NOT NULL,
          license_id TEXT NOT NULL,
          installation_id TEXT,
          stage TEXT NOT NULL,
          ack_status TEXT,
          detail TEXT,
          payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      );
      await backendDatabase.query("CREATE INDEX IF NOT EXISTS idx_mt5_signal_runtime_signal ON bot_mt5_signal_runtime_events(signal_id, created_at)");
      await backendDatabase.query("CREATE INDEX IF NOT EXISTS idx_mt5_signal_runtime_stage ON bot_mt5_signal_runtime_events(stage, created_at)");
      await backendDatabase.query("DROP INDEX IF EXISTS idx_bot_mt5_signals_signal_license_unique");
      await backendDatabase.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_mt5_signals_signal_license_unique ON bot_mt5_signals(signal_id, license_id)");
      await backendDatabase.query("CREATE INDEX IF NOT EXISTS idx_bot_mt5_signals_route_queue ON bot_mt5_signals(license_id, canonical_symbol, status, created_at)");
      await backendDatabase.query("UPDATE bot_mt5_signals SET canonical_symbol = symbol WHERE canonical_symbol IS NULL");
      await backendDatabase.query("ALTER TABLE bot_mt5_signals VALIDATE CONSTRAINT valid_entry_levels");
    })();
  }

  await mt5RoutingSchemaReady;
}

// ============================================================================
// SERVICIO BOT MT5
// ============================================================================

export class BotMT5Service {
  constructor(
    private readonly commercialAccessResolver: (
      userId: string
    ) => Promise<ResolvedUserCommercialAccess> = resolveUserCommercialAccess
  ) {}

  // Obtener instalación
  async getInstallation(
    licenseId: string,
    installationId: string
  ): Promise<BotMT5Installation | null> {
    if (!backendDatabase.enabled) {
      // Implementar con local store si es necesario
      return null;
    }

    const { rows } = await backendDatabase.query<{
      id: string;
      user_id: string;
      license_id: string;
      installation_id: string;
      account_hash: string;
      account_number: number;
      broker_server: string;
      magic_number: number;
      ea_version: string;
      status: string;
      created_at: Date;
      last_heartbeat: Date | null;
      is_revoked: boolean;
      max_open_trades: number;
      max_daily_trades: number;
      max_daily_loss_percent: number;
    }>(
      `
      SELECT id, user_id, license_id, installation_id, account_hash, account_number, 
             broker_server, magic_number, ea_version, status, created_at, last_heartbeat, 
             is_revoked, max_open_trades, max_daily_trades, max_daily_loss_percent
      FROM bot_mt5_installations
      WHERE license_id = $1 AND installation_id = $2
      LIMIT 1
      `,
      [licenseId, installationId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      licenseId: row.license_id,
      installationId: row.installation_id,
      accountHash: row.account_hash,
      accountNumber: row.account_number,
      brokerServer: row.broker_server,
      magicNumber: row.magic_number,
      eaVersion: row.ea_version,
      status: row.status as BotMT5Installation["status"],
      createdAt: new Date(row.created_at),
      lastHeartbeat: row.last_heartbeat ? new Date(row.last_heartbeat) : null,
      isRevoked: row.is_revoked,
      maxOpenTrades: row.max_open_trades,
      maxDailyTrades: row.max_daily_trades,
      maxDailyLossPercent: row.max_daily_loss_percent,
    };
  }

  // Registrar instalación (handshake)
  async registerInstallation(
    userId: string,
    licenseId: string,
    installationId: string,
    accountHash: string,
    accountNumber: number,
    brokerServer: string,
    magicNumber: number,
    eaVersion: string,
    brokerSymbol?: string,
    canonicalSymbol?: string
  ): Promise<BotMT5Installation> {
    const id = `mt5-inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!backendDatabase.enabled) {
      // Implementar con local store
      return {
        id,
        userId,
        licenseId,
        installationId,
        accountHash,
        accountNumber,
        brokerServer,
        magicNumber,
        eaVersion,
        status: "ACTIVE",
        createdAt: new Date(),
        lastHeartbeat: null,
        isRevoked: false,
        maxOpenTrades: 3,
        maxDailyTrades: 10,
        maxDailyLossPercent: 5,
      };
    }

    await ensureMt5RoutingSchema();

    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_installations 
        (id, user_id, license_id, installation_id, account_hash, account_number, 
         broker_server, broker_symbol, canonical_symbol, magic_number, ea_version, status, created_at, is_revoked,
         max_open_trades, max_daily_trades, max_daily_loss_percent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), false, 3, 10, 5)
      ON CONFLICT (license_id, installation_id) DO UPDATE 
      SET account_hash = EXCLUDED.account_hash,
          account_number = EXCLUDED.account_number,
          broker_server = EXCLUDED.broker_server,
          broker_symbol = EXCLUDED.broker_symbol,
          canonical_symbol = EXCLUDED.canonical_symbol,
          magic_number = EXCLUDED.magic_number,
          ea_version = EXCLUDED.ea_version,
          last_heartbeat = NOW(),
          status = EXCLUDED.status
      `,
      [
        id,
        userId,
        licenseId,
        installationId,
        accountHash,
        accountNumber,
        brokerServer,
        brokerSymbol?.trim() || null,
        canonicalSymbol?.trim().toUpperCase() || null,
        magicNumber,
        eaVersion,
        "ACTIVE",
      ]
    );

    return {
      id,
      userId,
      licenseId,
      installationId,
      accountHash,
      accountNumber,
      brokerServer,
      magicNumber,
      eaVersion,
      status: "ACTIVE",
      createdAt: new Date(),
      lastHeartbeat: null,
      isRevoked: false,
      maxOpenTrades: 3,
      maxDailyTrades: 10,
      maxDailyLossPercent: 5,
    };
  }

  // Obtener signal pendiente
  async getPendingSignal(licenseId: string): Promise<BotMT5Signal | null> {
    if (!backendDatabase.enabled) {
      return null;
    }

    const { rows } = await backendDatabase.query<{
      id: string;
      signal_id: string;
      analysis_id: string;
      license_id: string;
      symbol: string;
      decision: string;
      entry: number;
      stop_loss: number;
      take_profit: number;
      risk_reward: number;
      signature: string;
      expires_at: Date;
      created_at: Date;
      delivered_at: Date | null;
      status: string;
    }>(
      `
      SELECT id, signal_id, analysis_id, license_id, symbol, decision, entry, 
             stop_loss, take_profit, risk_reward, signature, expires_at, created_at, 
             delivered_at, status
      FROM bot_mt5_signals
      WHERE license_id = $1 AND status = 'PENDING' AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [licenseId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      signalId: row.signal_id,
      analysisId: row.analysis_id,
      licenseId: row.license_id,
      symbol: row.symbol,
      decision: row.decision as BotMT5Signal["decision"],
      entry: row.entry,
      stopLoss: row.stop_loss,
      takeProfit: row.take_profit,
      riskReward: row.risk_reward,
      signature: row.signature,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : null,
      status: row.status as BotMT5Signal["status"],
    };
  }

  // Registrar ejecución
  async recordExecution(
    signalId: string,
    licenseId: string,
    installationId: string,
    symbol: string,
    direction: "BUY" | "SELL",
    requestedEntry: number,
    executedEntry: number,
    stopLoss: number,
    takeProfit: number,
    lotSize: number,
    magicNumber: number,
    brokerOrderId: number,
    status: "EXECUTED" | "FAILED"
  ): Promise<BotMT5Execution> {
    const id = `mt5-exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!backendDatabase.enabled) {
      return {
        id,
        signalId,
        licenseId,
        installationId,
        symbol,
        direction,
        requestedEntry,
        executedEntry,
        stopLoss,
        takeProfit,
        lotSize,
        magicNumber,
        brokerOrderId,
        brokerServerResponse: "OK",
        status,
        openedAt: new Date(),
        closedAt: null,
        exitPrice: null,
        grossPnL: null,
        netPnL: null,
        commission: null,
        swap: null,
        slippage: null,
        errorCode: null,
        errorMessage: null,
      };
    }

    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_executions
        (id, signal_id, license_id, installation_id, symbol, direction, requested_entry, 
         executed_entry, stop_loss, take_profit, lot_size, magic_number, broker_order_id, 
         status, opened_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      `,
      [
        id,
        signalId,
        licenseId,
        installationId,
        symbol,
        direction,
        requestedEntry,
        executedEntry,
        stopLoss,
        takeProfit,
        lotSize,
        magicNumber,
        brokerOrderId,
        status,
      ]
    );

    return {
      id,
      signalId,
      licenseId,
      installationId,
      symbol,
      direction,
      requestedEntry,
      executedEntry,
      stopLoss,
      takeProfit,
      lotSize,
      magicNumber,
      brokerOrderId,
      brokerServerResponse: "OK",
      status,
      openedAt: new Date(),
      closedAt: null,
      exitPrice: null,
      grossPnL: null,
      netPnL: null,
      commission: null,
      swap: null,
      slippage: null,
      errorCode: null,
      errorMessage: null,
    };
  }

  // Registrar heartbeat
  async recordHeartbeat(
    licenseId: string,
    installationId: string,
    eaVersion: string,
    status: string,
    openPositions: number,
    equity: number,
    balance: number,
    accountHash: string,
    brokerServer: string
  ): Promise<void> {
    const id = `mt5-hb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!backendDatabase.enabled) {
      return;
    }

    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_heartbeats
        (id, license_id, installation_id, ea_version, status, open_positions, equity, balance, account_hash, broker_server, received_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `,
      [
        id,
        licenseId,
        installationId,
        eaVersion,
        status,
        openPositions,
        equity,
        balance,
        accountHash,
        brokerServer,
      ]
    );

    // Actualizar último heartbeat en instalación
    await backendDatabase.query(
      `
      UPDATE bot_mt5_installations
      SET last_heartbeat = NOW()
      WHERE license_id = $1 AND installation_id = $2
      `,
      [licenseId, installationId]
    );
  }

  // Marcar signal como entregada
  async markSignalDelivered(signalId: string): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    await backendDatabase.query(
      `
      UPDATE bot_mt5_signals
      SET status = 'DELIVERED', delivered_at = NOW()
      WHERE signal_id = $1
      `,
      [signalId]
    );
  }

  // Marcar signal como ejecutada
  async markSignalExecuted(signalId: string): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    await backendDatabase.query(
      `
      UPDATE bot_mt5_signals
      SET status = 'EXECUTED'
      WHERE signal_id = $1
      `,
      [signalId]
    );
  }

  async acknowledgeSignal(input: {
    signalId: string;
    licenseId: string;
    status: string;
    installationId?: string;
  }): Promise<"PENDING" | "DELIVERED" | "EXECUTED" | "EXPIRED" | "REJECTED"> {
    if (!backendDatabase.enabled) {
      return "DELIVERED";
    }

    await ensureMt5RoutingSchema();

    const ackStatus = String(input.status ?? "").trim().toUpperCase();
    let nextStatus: "PENDING" | "DELIVERED" | "EXECUTED" | "EXPIRED" | "REJECTED" = "DELIVERED";

    if (ackStatus === "EXECUTED" || ackStatus === "DRY_RUN_EXECUTED") {
      nextStatus = "EXECUTED";
    } else if (ackStatus === "EXPIRED") {
      nextStatus = "EXPIRED";
    } else if (ackStatus.startsWith("REJECT") || ackStatus.includes("FAILED") || ackStatus.includes("MISMATCH")) {
      nextStatus = "REJECTED";
    }

    const result = await backendDatabase.query(
      `
      UPDATE bot_mt5_signals
      SET
        status = CASE
          WHEN status = 'EXECUTED' THEN status
          ELSE $1
        END,
        delivered_at = COALESCE(delivered_at, NOW()),
        acknowledged_at = COALESCE(acknowledged_at, NOW()),
        delivered_installation_id = COALESCE($4, delivered_installation_id)
      WHERE signal_id = $2
        AND license_id = $3
      `,
      [nextStatus, input.signalId, input.licenseId, input.installationId ?? null]
    );

    if (!result.rowCount) {
      throw new Error(`ACK_NOT_PERSISTED signal_id=${input.signalId} license_id=${input.licenseId}`);
    }

    return nextStatus;
  }

  async recordSignalRuntimeEvent(input: {
    signalId: string;
    licenseId: string;
    stage: string;
    installationId?: string;
    ackStatus?: string;
    detail?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    await ensureMt5RoutingSchema();

    const id = `mt5-evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_signal_runtime_events
        (id, signal_id, license_id, installation_id, stage, ack_status, detail, payload, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
      `,
      [
        id,
        input.signalId,
        input.licenseId,
        input.installationId ?? null,
        String(input.stage ?? "").trim().toUpperCase(),
        input.ackStatus ? String(input.ackStatus).trim().toUpperCase() : null,
        input.detail ?? null,
        JSON.stringify(input.payload ?? {}),
      ]
    );
  }

  async evaluateCommercialGate(input: {
    licenseId: string;
    signalId: string;
    symbol: string;
    decision: Mt5CommercialDecision;
  }): Promise<Mt5CommercialGateResult> {
    if (!backendDatabase.enabled) {
      return { allowed: true, reason: "ALLOWED" };
    }

    const normalizedDecision = String(input.decision ?? "").trim().toUpperCase();
    const isOperableDecision = normalizedDecision === "BUY" || normalizedDecision === "SELL";
    if (!isOperableDecision) {
      return { allowed: true, reason: "NON_OPERABLE_DECISION" };
    }

    const { rows: licenseRows } = await backendDatabase.query<{
      user_id: string | null;
      status: string | null;
      expires_at: Date | null;
    }>(
      `
      SELECT user_id, status, expires_at
      FROM bot_mt5_licenses
      WHERE license_id = $1
      LIMIT 1
      `,
      [input.licenseId]
    );

    const license = licenseRows[0];
    if (!license || !license.user_id) {
      return { allowed: false, reason: "LICENSE_INACTIVE" };
    }

    const licenseActive =
      String(license.status ?? "").toUpperCase() === "ACTIVE" &&
      (!license.expires_at || new Date(license.expires_at) > new Date());

    if (!licenseActive) {
      return { allowed: false, reason: "LICENSE_INACTIVE", userId: license.user_id };
    }

    const commercialAccess = await this.commercialAccessResolver(license.user_id);
    if (!commercialAccess.membershipActive) {
      return {
        allowed: false,
        reason: "MEMBERSHIP_INACTIVE",
        userId: commercialAccess.userId,
        subscriptionPlan: commercialAccess.subscriptionPlan,
      };
    }

    const planKey = commercialAccess.subscriptionPlan === "basic" || commercialAccess.subscriptionPlan === "advanced"
      ? commercialAccess.subscriptionPlan
      : "basic";
    const dailyLimit = MT5_DAILY_LIMIT_BY_PLAN[planKey];
    if (!dailyLimit) {
      return {
        allowed: false,
        reason: "PLAN_NOT_ALLOWED",
        userId: commercialAccess.userId,
        subscriptionPlan: commercialAccess.subscriptionPlan,
      };
    }

    const normalizedSymbol = String(input.symbol ?? "").trim().toUpperCase();
    const allowedPairs = commercialAccess.entitlements.allowedPairs?.map((pair) => pair.toUpperCase()) ?? null;
    if (allowedPairs && !allowedPairs.includes(normalizedSymbol)) {
      return {
        allowed: false,
        reason: "PAIR_NOT_ALLOWED",
        userId: commercialAccess.userId,
        subscriptionPlan: commercialAccess.subscriptionPlan,
        dailyLimit,
      };
    }

    const { rows: usageRows } = await backendDatabase.query<{
      consumed_today: number;
      already_counted_signal: boolean;
    }>(
      `
      SELECT
        COUNT(DISTINCT s.signal_id)::int AS consumed_today,
        COALESCE(BOOL_OR(s.signal_id = $2), false) AS already_counted_signal
      FROM bot_mt5_signals s
      INNER JOIN bot_mt5_licenses l ON l.license_id = s.license_id
      WHERE l.user_id = $1
        AND s.created_at >= DATE_TRUNC('day', NOW())
        AND s.decision IN ('BUY', 'SELL')
      `,
      [commercialAccess.userId, input.signalId]
    );

    const consumedToday = Number(usageRows[0]?.consumed_today ?? 0);
    const alreadyCountedSignal = Boolean(usageRows[0]?.already_counted_signal);

    if (!alreadyCountedSignal && consumedToday >= dailyLimit) {
      return {
        allowed: false,
        reason: "PLAN_DAILY_LIMIT_REACHED",
        userId: commercialAccess.userId,
        subscriptionPlan: commercialAccess.subscriptionPlan,
        dailyLimit,
        consumedToday,
        alreadyCountedSignal,
      };
    }

    return {
      allowed: true,
      reason: "ALLOWED",
      userId: commercialAccess.userId,
      subscriptionPlan: commercialAccess.subscriptionPlan,
      dailyLimit,
      consumedToday,
      alreadyCountedSignal,
    };
  }

  async recordCommercialGateBlock(input: {
    licenseId: string;
    signalId: string;
    analysisId: string;
    symbol: string;
    decision: string;
    reason: Mt5CommercialGateResult["reason"];
    userId?: string;
    subscriptionPlan?: string;
    dailyLimit?: number;
    consumedToday?: number;
  }): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    const auditId = `mt5-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_audit (id, installation_id, license_id, event_type, event_data, created_at)
      VALUES ($1, NULL, $2, $3, $4::jsonb, NOW())
      `,
      [
        auditId,
        input.licenseId,
        "COMMERCIAL_GATE_BLOCKED",
        JSON.stringify({
          reason: input.reason,
          signal_id: input.signalId,
          analysis_id: input.analysisId,
          symbol: input.symbol,
          decision: input.decision,
          user_id: input.userId ?? null,
          subscription_plan: input.subscriptionPlan ?? null,
          daily_limit: input.dailyLimit ?? null,
          consumed_today: input.consumedToday ?? null,
        }),
      ]
    );
  }

  // Crear signal (NEW)
  async createSignal(signal: {
    signalId: string;
    analysisId: string;
    eventId: string;
    licenseId: string;
    symbol: string;
    direction: "BUY" | "SELL" | "NONE";
    horizon: "SHORT" | "MEDIUM" | "EXTENDED" | null;
    validityMinutes: number | null;
    expiresAt: string | null;
    source: "CADP_V2" | "CADP_V3_HISTORICAL_BRAIN";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
  }): Promise<void> {
    if (!backendDatabase.enabled) {
      console.log(`[BOT-MT5] Signal en memoria: ${signal.signalId}`);
      return;
    }

    await ensureMt5RoutingSchema();

    if (!signal.expiresAt || !Number.isFinite(Date.parse(signal.expiresAt))) {
      throw new Error(`MT5_SIGNAL_EXPIRY_REQUIRED:${signal.signalId}`);
    }

    const canonicalSymbol = signal.symbol.trim().toUpperCase();
    const expiresAt = new Date(signal.expiresAt);
    const identity = [
      signal.signalId,
      signal.analysisId,
      signal.eventId,
      signal.licenseId,
      canonicalSymbol,
      signal.direction,
      signal.entry,
      signal.stopLoss,
      signal.takeProfit,
      signal.horizon ?? "",
      signal.validityMinutes ?? "",
      expiresAt.toISOString(),
      signal.source,
    ].join("|");
    const digest = createHash("sha256").update(identity).digest("hex");
    const id = `mt5-sig-${digest.slice(0, 24)}`;
    const signature = `SHA256:${digest}`;

    const inserted = await backendDatabase.query<{ license_id: string }>(
      `
      INSERT INTO bot_mt5_signals
        (id, signal_id, analysis_id, event_id, license_id, symbol, canonical_symbol,
         decision, entry, stop_loss, take_profit, risk_reward, signature, expires_at,
         signal_mode, validity_minutes, source, status, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, 'PENDING', NOW())
      ON CONFLICT (signal_id) DO NOTHING
      RETURNING license_id
      `,
      [
        id,
        signal.signalId,
        signal.analysisId,
        signal.eventId,
        signal.licenseId,
        canonicalSymbol,
        signal.direction,
        signal.entry,
        signal.stopLoss,
        signal.takeProfit,
        signal.riskReward,
        signature,
        expiresAt,
        signal.horizon ?? "SHORT",
        signal.validityMinutes,
        signal.source,
      ]
    );

    if (!inserted.rowCount) {
      const existing = await backendDatabase.query<{ license_id: string }>(
        "SELECT license_id FROM bot_mt5_signals WHERE signal_id = $1 LIMIT 1",
        [signal.signalId]
      );
      if (existing.rows[0]?.license_id !== signal.licenseId) {
        throw new Error(`MT5_SIGNAL_LICENSE_CONFLICT:${signal.signalId}`);
      }
    }
  }
}

export const botMT5Service = new BotMT5Service();
