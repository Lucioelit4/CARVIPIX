import type { IOperationsDomainService, ServiceOperationRecord, ServiceOperationSummary } from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";

type OperationRow = {
  id: string;
  user_id: string;
  account_id: string | null;
  symbol: string;
  side: string;
  status: string;
  pnl: number;
  executed_at: Date;
  metadata: unknown;
};

function mapOperation(row: OperationRow): ServiceOperationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id ?? undefined,
    symbol: row.symbol,
    side: row.side,
    status: row.status,
    pnl: Number(row.pnl ?? 0),
    executedAt: new Date(row.executed_at),
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
  };
}

export class OperationsDomainService implements IOperationsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getOperations(userId?: string, limit = 100): Promise<ServiceOperationRecord[]> {
    const params: Array<string | number> = [];
    let where = "";

    if (userId) {
      params.push(userId);
      where = `WHERE user_id = $${params.length}`;
    }

    params.push(Math.max(1, Math.min(limit, 500)));

    const { rows } = await backendDatabase.query<OperationRow>(
      `
      SELECT id, user_id, account_id, symbol, side, status, pnl, executed_at, metadata
      FROM operations
      ${where}
      ORDER BY executed_at DESC
      LIMIT $${params.length}
      `,
      params
    );

    const operations = rows.map(mapOperation);

    this.eventBus.publish("operations.read", {
      userId,
      count: operations.length,
      queriedAt: new Date(),
    });

    return operations;
  }

  async createOperation(
    operation: Omit<ServiceOperationRecord, "id" | "executedAt"> & { id?: string; executedAt?: Date }
  ): Promise<ServiceOperationRecord> {
    const id = operation.id ?? `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const executedAt = operation.executedAt ?? new Date();

    await backendDatabase.query(
      `
      INSERT INTO operations (id, user_id, account_id, symbol, side, status, pnl, executed_at, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      `,
      [
        id,
        operation.userId,
        operation.accountId ?? null,
        operation.symbol,
        operation.side,
        operation.status,
        operation.pnl,
        executedAt,
        JSON.stringify(operation.metadata ?? {}),
      ]
    );

    const created: ServiceOperationRecord = {
      id,
      userId: operation.userId,
      accountId: operation.accountId,
      symbol: operation.symbol,
      side: operation.side,
      status: operation.status,
      pnl: Number(operation.pnl ?? 0),
      executedAt,
      metadata: operation.metadata ?? {},
    };

    this.eventBus.publish("operations.created", {
      operationId: id,
      userId: operation.userId,
      queriedAt: new Date(),
    });

    return created;
  }

  async getSummary(userId?: string): Promise<ServiceOperationSummary> {
    const params: string[] = [];
    let where = "";

    if (userId) {
      params.push(userId);
      where = `WHERE user_id = $${params.length}`;
    }

    const { rows } = await backendDatabase.query<{
      total_operations: number;
      winning_operations: number;
      losing_operations: number;
      total_pnl: number;
    }>(
      `
      SELECT
        COUNT(*) AS total_operations,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_operations,
        COUNT(*) FILTER (WHERE pnl < 0) AS losing_operations,
        COALESCE(SUM(pnl), 0) AS total_pnl
      FROM operations
      ${where}
      `,
      params
    );

    const row = rows[0];
    const total = Number(row?.total_operations ?? 0);

    return {
      totalOperations: total,
      winningOperations: Number(row?.winning_operations ?? 0),
      losingOperations: Number(row?.losing_operations ?? 0),
      totalPnl: Number(row?.total_pnl ?? 0),
      winRate: total > 0 ? Number(((Number(row?.winning_operations ?? 0) / total) * 100).toFixed(2)) : 0,
    };
  }
}
