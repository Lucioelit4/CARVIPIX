import { masterSignalStore, type MasterSignalRecord } from "@/app/ai/cadpV2/masterSignalStore";
import { backendDatabase } from "../core/database";

export type RealSignalDecision =
  | "ENTER_BUY"
  | "ENTER_SELL"
  | "CONDITIONAL_ENTRY"
  | "WAIT"
  | "NO_TRADE"
  | "DATA_INSUFFICIENT"
  | "ENTRY_MISSED"
  | "NEWS_VERIFICATION_REQUIRED";

export type RealSignalLifecycleStatus =
  | "CREATED"
  | "CONDITIONAL"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "TP_HIT"
  | "SL_HIT"
  | "CLOSED";

export type RealSignalTrackingAccount = "FOUNDER" | "CLIENT" | "INTERNAL" | "UNASSIGNED";

export interface RealSignalLifecycleRecord {
  signalId: string;
  analysisId: string;
  symbol: string;
  decision: RealSignalDecision;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  strategyId: string;
  status: RealSignalLifecycleStatus;
  source: string;
  dataOrigin: "REAL" | "SANDBOX" | "DEMO" | "MOCK";
  trackingAccount: RealSignalTrackingAccount;
  classification: "REAL_SIGNAL_RESULT";
  signalTimestamp: Date;
  activatedAt?: Date | null;
  closedAt?: Date | null;
  realizedPnl: number;
  metadata: Record<string, unknown>;
}

type LifecycleRow = {
  signal_id: string;
  analysis_id: string;
  symbol: string;
  decision: RealSignalDecision;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  strategy_id: string;
  signal_status: RealSignalLifecycleStatus;
  source: string;
  data_origin: "REAL" | "SANDBOX" | "DEMO" | "MOCK";
  tracking_account: RealSignalTrackingAccount;
  classification: "REAL_SIGNAL_RESULT";
  signal_timestamp: Date;
  activated_at: Date | null;
  closed_at: Date | null;
  realized_pnl: number;
  metadata: unknown;
};

const TERMINAL_STATUSES = new Set<RealSignalLifecycleStatus>(["CANCELLED", "EXPIRED", "TP_HIT", "SL_HIT", "CLOSED"]);
const AUDIT_ONLY_DECISIONS = new Set<RealSignalDecision>(["WAIT", "NO_TRADE", "DATA_INSUFFICIENT"]);

export function isEntryDecision(decision: RealSignalDecision): boolean {
  return !AUDIT_ONLY_DECISIONS.has(decision);
}

export function buildLifecycleFixture(seed: {
  signalId: string;
  analysisId: string;
  symbol: string;
  decision: RealSignalDecision;
  strategyId: string;
}): Array<{ status: RealSignalLifecycleStatus; realizedPnl: number }> {
  if (!seed.signalId || !seed.analysisId || !seed.symbol || !seed.strategyId) {
    return [];
  }

  if (!isEntryDecision(seed.decision)) {
    return [{ status: "CLOSED", realizedPnl: 0 }];
  }

  if (seed.decision === "CONDITIONAL_ENTRY") {
    return [
      { status: "CREATED", realizedPnl: 0 },
      { status: "CONDITIONAL", realizedPnl: 0 },
      { status: "ACTIVE", realizedPnl: 0 },
      { status: "TP_HIT", realizedPnl: 125.5 },
    ];
  }

  return [
    { status: "CREATED", realizedPnl: 0 },
    { status: "ACTIVE", realizedPnl: 0 },
    { status: "TP_HIT", realizedPnl: 125.5 },
  ];
}

function mapRow(row: LifecycleRow): RealSignalLifecycleRecord {
  return {
    signalId: row.signal_id,
    analysisId: row.analysis_id,
    symbol: row.symbol,
    decision: row.decision,
    entry: row.entry_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    strategyId: row.strategy_id,
    status: row.signal_status,
    source: row.source,
    dataOrigin: row.data_origin,
    trackingAccount: row.tracking_account,
    classification: row.classification,
    signalTimestamp: new Date(row.signal_timestamp),
    activatedAt: row.activated_at ? new Date(row.activated_at) : null,
    closedAt: row.closed_at ? new Date(row.closed_at) : null,
    realizedPnl: Number(row.realized_pnl ?? 0),
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
  };
}

function normalizeDataOrigin(raw: string | undefined): "REAL" | "SANDBOX" | "DEMO" | "MOCK" {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "REAL" || value === "SANDBOX" || value === "DEMO" || value === "MOCK") {
    return value;
  }
  if (value === "PLACEHOLDER" || value === "EMPTY") {
    return "MOCK";
  }
  return "MOCK";
}

function decisionFromDirection(direction: "BUY" | "SELL" | "NONE"): RealSignalDecision {
  if (direction === "BUY") {
    return "ENTER_BUY";
  }

  if (direction === "SELL") {
    return "ENTER_SELL";
  }

  return "WAIT";
}

function defaultStatusForDecision(decision: RealSignalDecision): RealSignalLifecycleStatus {
  if (decision === "CONDITIONAL_ENTRY") {
    return "CONDITIONAL";
  }

  if (decision === "ENTER_BUY" || decision === "ENTER_SELL") {
    return "CREATED";
  }

  return "CLOSED";
}

export class RealSignalLifecycleService {
  async upsertFromMasterSignalRecord(record: MasterSignalRecord): Promise<RealSignalLifecycleRecord | null> {
    const decision = decisionFromDirection(record.signal.direction);
    return this.upsertSignal({
      signalId: record.signal_id,
      analysisId: record.analysis_id,
      symbol: record.signal.symbol,
      decision,
      entry: record.signal.entry,
      stopLoss: record.signal.stop_loss,
      takeProfit: record.signal.take_profit,
      strategyId: record.signal.selected_strategy_id,
      status: defaultStatusForDecision(decision),
      source: "CADP_V2_MASTER_SIGNAL",
      dataOrigin: normalizeDataOrigin(process.env.CARVIPIX_DATA_CLASSIFICATION),
      trackingAccount: "UNASSIGNED",
      signalTimestamp: new Date(record.created_at),
      metadata: {
        grossRR: record.signal.calculated_gross_rr,
        netRR: record.signal.calculated_net_rr,
        analysisProfile: record.signal.analysis_profile,
        expiresAt: record.signal.expires_at,
        shadowStatus: record.signal.status,
        tags: ["TEST_ONLY", "SHADOW", "NON_EXECUTABLE", "NOT_FOR_CLIENTS"],
      },
    });
  }

  async ensureLatestMasterSignalRegistered(): Promise<RealSignalLifecycleRecord | null> {
    const latest = masterSignalStore.getLatest();
    if (!latest) {
      return null;
    }

    return this.upsertFromMasterSignalRecord(latest);
  }

  async getLatestSignal(): Promise<RealSignalLifecycleRecord | null> {
    const { rows } = await backendDatabase.query<LifecycleRow>(
      `
      SELECT
        signal_id,
        analysis_id,
        symbol,
        decision,
        entry_price,
        stop_loss,
        take_profit,
        strategy_id,
        signal_status,
        source,
        data_origin,
        tracking_account,
        classification,
        signal_timestamp,
        activated_at,
        closed_at,
        realized_pnl,
        metadata
      FROM real_signal_lifecycle
      ORDER BY signal_timestamp DESC
      LIMIT 1
      `
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async upsertSignal(input: {
    signalId: string;
    analysisId: string;
    symbol: string;
    decision: RealSignalDecision;
    entry: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    strategyId: string;
    status: RealSignalLifecycleStatus;
    source: string;
    dataOrigin: "REAL" | "SANDBOX" | "DEMO" | "MOCK";
    trackingAccount: RealSignalTrackingAccount;
    signalTimestamp: Date;
    metadata?: Record<string, unknown>;
  }): Promise<RealSignalLifecycleRecord | null> {
    await backendDatabase.query(
      `
      INSERT INTO real_signal_lifecycle (
        signal_id,
        analysis_id,
        symbol,
        decision,
        entry_price,
        stop_loss,
        take_profit,
        strategy_id,
        signal_status,
        source,
        data_origin,
        tracking_account,
        classification,
        signal_timestamp,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, 'REAL_SIGNAL_RESULT',
        $13, $14::jsonb, NOW(), NOW()
      )
      ON CONFLICT (signal_id)
      DO UPDATE SET
        analysis_id = EXCLUDED.analysis_id,
        symbol = EXCLUDED.symbol,
        decision = EXCLUDED.decision,
        entry_price = EXCLUDED.entry_price,
        stop_loss = EXCLUDED.stop_loss,
        take_profit = EXCLUDED.take_profit,
        strategy_id = EXCLUDED.strategy_id,
        signal_status = CASE
          WHEN real_signal_lifecycle.signal_status IN ('CANCELLED', 'EXPIRED', 'TP_HIT', 'SL_HIT', 'CLOSED') THEN real_signal_lifecycle.signal_status
          ELSE EXCLUDED.signal_status
        END,
        source = EXCLUDED.source,
        data_origin = EXCLUDED.data_origin,
        tracking_account = EXCLUDED.tracking_account,
        signal_timestamp = EXCLUDED.signal_timestamp,
        metadata = COALESCE(real_signal_lifecycle.metadata, '{}'::jsonb) || EXCLUDED.metadata,
        updated_at = NOW()
      `,
      [
        input.signalId,
        input.analysisId,
        input.symbol,
        input.decision,
        input.entry,
        input.stopLoss,
        input.takeProfit,
        input.strategyId,
        input.status,
        input.source,
        input.dataOrigin,
        input.trackingAccount,
        input.signalTimestamp,
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    return this.getBySignalId(input.signalId);
  }

  async transitionSignal(input: {
    signalId: string;
    status: RealSignalLifecycleStatus;
    realizedPnl?: number;
    metadata?: Record<string, unknown>;
  }): Promise<RealSignalLifecycleRecord | null> {
    const current = await this.getBySignalId(input.signalId);
    if (!current) {
      return null;
    }

    if (TERMINAL_STATUSES.has(current.status) && current.status !== input.status) {
      return current;
    }

    const activatedAt = input.status === "ACTIVE" && !current.activatedAt ? new Date() : current.activatedAt;
    const closedAt = TERMINAL_STATUSES.has(input.status) ? new Date() : current.closedAt;

    await backendDatabase.query(
      `
      UPDATE real_signal_lifecycle
      SET
        signal_status = $2,
        realized_pnl = COALESCE($3, realized_pnl),
        activated_at = $4,
        closed_at = $5,
        metadata = COALESCE(metadata, '{}'::jsonb) || $6::jsonb,
        updated_at = NOW()
      WHERE signal_id = $1
      `,
      [
        input.signalId,
        input.status,
        input.realizedPnl ?? null,
        activatedAt ?? null,
        closedAt ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    return this.getBySignalId(input.signalId);
  }

  async getBySignalId(signalId: string): Promise<RealSignalLifecycleRecord | null> {
    const { rows } = await backendDatabase.query<LifecycleRow>(
      `
      SELECT
        signal_id,
        analysis_id,
        symbol,
        decision,
        entry_price,
        stop_loss,
        take_profit,
        strategy_id,
        signal_status,
        source,
        data_origin,
        tracking_account,
        classification,
        signal_timestamp,
        activated_at,
        closed_at,
        realized_pnl,
        metadata
      FROM real_signal_lifecycle
      WHERE signal_id = $1
      LIMIT 1
      `,
      [signalId]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async getRecentSignals(options?: { limit?: number; includeAuditOnly?: boolean }): Promise<RealSignalLifecycleRecord[]> {
    const includeAuditOnly = options?.includeAuditOnly ?? false;
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 500));

    const { rows } = await backendDatabase.query<LifecycleRow>(
      `
      SELECT
        signal_id,
        analysis_id,
        symbol,
        decision,
        entry_price,
        stop_loss,
        take_profit,
        strategy_id,
        signal_status,
        source,
        data_origin,
        tracking_account,
        classification,
        signal_timestamp,
        activated_at,
        closed_at,
        realized_pnl,
        metadata
      FROM real_signal_lifecycle
      WHERE ($1::boolean = true OR decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT'))
      ORDER BY signal_timestamp DESC
      LIMIT $2
      `,
      [includeAuditOnly, limit]
    );

    return rows.map(mapRow);
  }

  async getAlertStats(): Promise<{ total: number; active: number; triggered: number; resolved: number }> {
    const { rows } = await backendDatabase.query<{
      total: number;
      active: number;
      triggered: number;
      resolved: number;
    }>(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE signal_status IN ('CREATED', 'CONDITIONAL', 'ACTIVE'))::int AS active,
        COUNT(*) FILTER (WHERE signal_status IN ('TP_HIT', 'SL_HIT'))::int AS triggered,
        COUNT(*) FILTER (WHERE signal_status IN ('CANCELLED', 'EXPIRED', 'CLOSED'))::int AS resolved
      FROM real_signal_lifecycle
      WHERE decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT')
      `
    );

    const row = rows[0];
    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      triggered: Number(row?.triggered ?? 0),
      resolved: Number(row?.resolved ?? 0),
    };
  }

  async getResultsAggregate(): Promise<{ totalTrades: number; winRate: number; profitLoss: number }> {
    const { rows } = await backendDatabase.query<{
      total_trades: number;
      winning_trades: number;
      profit_loss: number;
    }>(
      `
      SELECT
        COUNT(*) FILTER (WHERE signal_status IN ('TP_HIT', 'SL_HIT', 'CLOSED'))::int AS total_trades,
        COUNT(*) FILTER (WHERE signal_status = 'TP_HIT' OR realized_pnl > 0)::int AS winning_trades,
        COALESCE(SUM(realized_pnl), 0) AS profit_loss
      FROM real_signal_lifecycle
      WHERE decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT')
      `
    );

    const row = rows[0];
    const totalTrades = Number(row?.total_trades ?? 0);
    const winningTrades = Number(row?.winning_trades ?? 0);

    return {
      totalTrades,
      winRate: totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0,
      profitLoss: Number(row?.profit_loss ?? 0),
    };
  }

  async getMonthlyResults(months = 12): Promise<Array<{ month: string; totalTrades: number; winningTrades: number; profitLoss: number }>> {
    const { rows } = await backendDatabase.query<{
      month: string;
      total_trades: number;
      winning_trades: number;
      profit_loss: number;
    }>(
      `
      SELECT
        TO_CHAR(COALESCE(closed_at, signal_timestamp), 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE signal_status IN ('TP_HIT', 'SL_HIT', 'CLOSED'))::int AS total_trades,
        COUNT(*) FILTER (WHERE signal_status = 'TP_HIT' OR realized_pnl > 0)::int AS winning_trades,
        COALESCE(SUM(realized_pnl), 0) AS profit_loss
      FROM real_signal_lifecycle
      WHERE decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT')
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT $1
      `,
      [Math.max(1, Math.min(months, 36))]
    );

    return rows.map((row) => ({
      month: row.month,
      totalTrades: Number(row.total_trades ?? 0),
      winningTrades: Number(row.winning_trades ?? 0),
      profitLoss: Number(row.profit_loss ?? 0),
    }));
  }

  isAuditOnlyDecision(decision: RealSignalDecision): boolean {
    return AUDIT_ONLY_DECISIONS.has(decision);
  }
}

export const realSignalLifecycleService = new RealSignalLifecycleService();
