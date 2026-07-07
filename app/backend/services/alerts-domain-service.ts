import type {
  IAlertsDomainService,
  ServiceAlertHistory,
  ServiceAlertRecord,
  ServiceAlertRule,
  ServiceAlertStats,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";

function mapStateToStatus(state: string): ServiceAlertRecord["status"] {
  if (state === "activa" || state === "pendiente" || state === "active" || state === "pending") {
    return "active";
  }

  if (state === "tp" || state === "sl" || state === "breakeven" || state === "triggered") {
    return "triggered";
  }

  return "resolved";
}

function mapConfidenceToPriority(confidence: number): ServiceAlertRecord["priority"] {
  if (confidence >= 90) {
    return "critical";
  }

  if (confidence >= 80) {
    return "high";
  }

  if (confidence >= 65) {
    return "medium";
  }

  return "low";
}

export class AlertsDomainService implements IAlertsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getAlerts(query?: { userId?: string; limit?: number }): Promise<ServiceAlertRecord[]> {
    const params: Array<string | number> = [];
    let where = "WHERE COALESCE(metadata->>'module', '') IN ('alerts', 'trading')";

    if (query?.userId) {
      params.push(query.userId);
      where += ` AND user_id = $${params.length}`;
    }

    params.push(Math.max(1, Math.min(query?.limit ?? 50, 200)));

    const { rows } = await backendDatabase.query<{
      id: string;
      symbol: string;
      side: string;
      status: string;
      executed_at: Date;
      metadata: unknown;
    }>(
      `
      SELECT id, symbol, side, status, executed_at, metadata
      FROM operations
      ${where}
      ORDER BY executed_at DESC
      LIMIT $${params.length}
      `,
      params
    );

    const mapped = rows.map((row) => {
      const metadata = typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {};
      const confidence = Number(metadata.confidence ?? 0);
      const numericSide = String(row.side ?? "compra").toLowerCase();
      const normalizedState = String(row.status ?? "resolved").toLowerCase();

      return {
        id: row.id,
        type: "signal" as const,
        symbol: row.symbol,
        title: `${numericSide === "venta" ? "Venta" : "Compra"} ${row.symbol}`,
        description: String(metadata.reasoning ?? "Sin datos"),
        priority: mapConfidenceToPriority(confidence),
        status: mapStateToStatus(normalizedState),
        timestamp: new Date(row.executed_at),
        actionUrl: "/alertas",
        data: {
          entryPrice: Number(metadata.entryPrice ?? 0),
          stopLossPrice: Number(metadata.stopLossPrice ?? 0),
          takeProfitPrice: Number(metadata.takeProfitPrice ?? 0),
          riskRewardRatio: Number(metadata.riskRewardRatio ?? 0),
          timeframe: String(metadata.timeframe ?? "Sin datos"),
          direction: numericSide === "venta" ? "Venta" : "Compra",
          confidence,
          approvalCount: Number(metadata.approvalCount ?? 0),
        },
      };
    });

    this.eventBus.publish("alerts.read", {
      count: mapped.length,
      queriedAt: new Date(),
    });

    return mapped;
  }

  async getAlertStats(_userId?: string): Promise<ServiceAlertStats> {
    const params: string[] = [];
    let where = "WHERE COALESCE(metadata->>'module', '') IN ('alerts', 'trading')";

    if (_userId) {
      params.push(_userId);
      where += ` AND user_id = $${params.length}`;
    }

    const { rows } = await backendDatabase.query<{
      total: number;
      active: number;
      triggered: number;
      resolved: number;
    }>(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status IN ('active', 'pending')) AS active,
        COUNT(*) FILTER (WHERE status IN ('triggered', 'tp', 'sl', 'breakeven')) AS triggered,
        COUNT(*) FILTER (WHERE status IN ('resolved', 'closed', 'cancelada', 'caducada')) AS resolved
      FROM operations
      ${where}
      `,
      params
    );

    const row = rows[0];

    const stats: ServiceAlertStats = {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      triggered: Number(row?.triggered ?? 0),
      resolved: Number(row?.resolved ?? 0),
    };

    this.eventBus.publish("alerts.stats.read", {
      stats,
      queriedAt: new Date(),
    });

    return stats;
  }

  async getAlertRules(userId: string): Promise<ServiceAlertRule[]> {
    const { rows } = await backendDatabase.query<{
      id: string;
      user_id: string;
      name: string;
      enabled: boolean;
      condition: string;
      symbols: unknown;
      alert_types: unknown;
      created_at: Date;
    }>(
      `
      SELECT id, user_id, name, enabled, condition, symbols, alert_types, created_at
      FROM alert_rules
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const rules = rows.map((item) => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      enabled: item.enabled,
      condition: item.condition,
      symbols: Array.isArray(item.symbols) ? (item.symbols as string[]) : [],
      alertTypes: Array.isArray(item.alert_types) ? (item.alert_types as ServiceAlertRule["alertTypes"]) : [],
      createdAt: new Date(item.created_at),
    }));

    this.eventBus.publish("alerts.rules.read", {
      userId,
      count: rules.length,
      queriedAt: new Date(),
    });

    return rules;
  }

  async createAlertRule(
    userId: string,
    rule: Omit<ServiceAlertRule, "id" | "userId" | "createdAt">
  ): Promise<ServiceAlertRule> {
    const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();

    await backendDatabase.query(
      `
      INSERT INTO alert_rules (id, user_id, name, enabled, condition, symbols, alert_types, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
      `,
      [id, userId, rule.name, rule.enabled, rule.condition, JSON.stringify(rule.symbols), JSON.stringify(rule.alertTypes), now]
    );

    this.eventBus.publish("alerts.rule.created", {
      id,
      userId,
      queriedAt: new Date(),
    });

    return {
      id,
      userId,
      name: rule.name,
      enabled: rule.enabled,
      condition: rule.condition,
      symbols: [...rule.symbols],
      alertTypes: [...rule.alertTypes],
      createdAt: now,
    };
  }

  async logAlertAction(userId: string, alertId: string, action: ServiceAlertHistory["action"]): Promise<void> {
    const id = `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await backendDatabase.query(
      `
      INSERT INTO alert_history (id, user_id, alert_id, action, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [id, userId, alertId, action]
    );

    this.eventBus.publish("alerts.action.logged", {
      userId,
      alertId,
      action,
      queriedAt: new Date(),
    });
  }
}
