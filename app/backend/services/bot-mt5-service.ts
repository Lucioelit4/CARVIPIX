import "server-only";

import { backendDatabase } from "@/app/backend/core/database";

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

// ============================================================================
// SERVICIO BOT MT5
// ============================================================================

export class BotMT5Service {
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
    eaVersion: string
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

    await backendDatabase.query(
      `
      INSERT INTO bot_mt5_installations 
        (id, user_id, license_id, installation_id, account_hash, account_number, 
         broker_server, magic_number, ea_version, status, created_at, is_revoked, 
         max_open_trades, max_daily_trades, max_daily_loss_percent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), false, 3, 10, 5)
      ON CONFLICT (license_id, installation_id) DO UPDATE 
      SET last_heartbeat = NOW(), status = $10
      `,
      [
        id,
        userId,
        licenseId,
        installationId,
        accountHash,
        accountNumber,
        brokerServer,
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

  // Crear signal (NEW)
  async createSignal(signal: {
    signalId: string;
    analysisId: string;
    licenseId: string;
    symbol: string;
    direction: "BUY" | "SELL" | "NONE";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
  }): Promise<void> {
    if (!backendDatabase.enabled) {
      console.log(`[BOT-MT5] Signal en memoria: ${signal.signalId}`);
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
      const signature = `SIG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Intenta crear si la tabla existe
      try {
        await backendDatabase.query(
          `
          INSERT INTO bot_mt5_signals 
            (signal_id, analysis_id, license_id, symbol, decision, entry, 
             stop_loss, take_profit, risk_reward, signature, expires_at, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NOW())
          `,
          [
            signal.signalId,
            signal.analysisId,
            signal.licenseId,
            signal.symbol,
            signal.direction,
            signal.entry,
            signal.stopLoss,
            signal.takeProfit,
            signal.riskReward,
            signature,
            expiresAt
          ]
        );

        console.log(`[BOT-MT5] ✓ Signal insertada: ${signal.signalId} para ${signal.symbol} ${signal.direction}`);
      } catch (tableError) {
        const tableErrorMessage = tableError instanceof Error ? tableError.message : String(tableError);
        if (tableErrorMessage.includes('does not exist')) {
          console.log(`[BOT-MT5] ⚠️  Tabla bot_mt5_signals no existe, signal en memoria: ${signal.signalId}`);
        } else {
          throw tableError;
        }
      }
    } catch (error) {
      console.error(`[BOT-MT5] Error creando signal: ${error}`);
      // No lanzar error para no afectar el flujo principal
    }
  }
}

export const botMT5Service = new BotMT5Service();
