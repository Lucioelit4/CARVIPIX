import type {
  IAlertsDomainService,
  ServiceAlertHistory,
  ServiceAlertRecord,
  ServiceAlertRule,
  ServiceAlertStats,
} from "../contracts";
import { AlertLimitGuard, PairAccessGuard } from "../commercial/access-control";
import { resolveUserCommercialAccess } from "../commercial/plan-entitlements-store";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";
import { realSignalLifecycleService, type RealSignalLifecycleRecord } from "./real-signal-lifecycle-service";

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

function mapLifecycleStatusToAlertStatus(status: RealSignalLifecycleRecord["status"]): ServiceAlertRecord["status"] {
  if (status === "CREATED" || status === "CONDITIONAL" || status === "ACTIVE") {
    return "active";
  }

  if (status === "TP_HIT" || status === "SL_HIT") {
    return "triggered";
  }

  return "resolved";
}

function mapLifecycleRecordToAlert(record: RealSignalLifecycleRecord): ServiceAlertRecord {
  const direction = record.decision === "ENTER_SELL" ? "Venta" : record.decision === "ENTER_BUY" ? "Compra" : "Condicional";
  const modelConfidence = Number(record.metadata.modelConfidence ?? (record.status === "ACTIVE" ? 84 : record.status === "CONDITIONAL" ? 72 : 60));

  return {
    id: record.signalId,
    type: "signal",
    symbol: record.symbol,
    title: `${direction} ${record.symbol}`,
    description: `Señal real ${record.classification} (${record.analysisId})`,
    priority: record.status === "ACTIVE" ? "high" : record.status === "CONDITIONAL" ? "medium" : "low",
    status: mapLifecycleStatusToAlertStatus(record.status),
    timestamp: record.signalTimestamp,
    actionUrl: "/alertas",
    data: {
      entryPrice: record.entry ?? 0,
      stopLossPrice: record.stopLoss ?? 0,
      takeProfitPrice: record.takeProfit ?? 0,
      riskRewardRatio:
        record.entry && record.stopLoss && record.takeProfit
          ? Number((Math.abs((record.takeProfit - record.entry) / (record.entry - record.stopLoss || 1))).toFixed(2))
          : 0,
      timeframe: String(record.metadata.analysisProfile ?? "N/A"),
      direction,
      confidence: modelConfidence,
      approvalCount: 1,
      signalStatus: record.status,
      source: record.source,
      dataOrigin: record.dataOrigin,
      signalId: record.signalId,
      analysisId: record.analysisId,
      strategyId: record.strategyId,
      expiresAt: typeof record.metadata.expiresAt === "string" ? record.metadata.expiresAt : null,
    },
  };
}

export class AlertsDomainService implements IAlertsDomainService {
  private readonly alertLimitGuard = new AlertLimitGuard();

  private readonly pairAccessGuard = new PairAccessGuard();

  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getAlerts(query?: { userId?: string; limit?: number }): Promise<ServiceAlertRecord[]> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();

    const lifecycleSignals = await realSignalLifecycleService.getRecentSignals({
      limit: query?.limit,
      includeAuditOnly: false,
    });
    if (lifecycleSignals.length > 0) {
      const mappedSignals = lifecycleSignals.map(mapLifecycleRecordToAlert);
      this.eventBus.publish("alerts.read", {
        count: mappedSignals.length,
        queriedAt: new Date(),
      });
      return mappedSignals;
    }

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
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();

    const lifecycleStats = await realSignalLifecycleService.getAlertStats();
    if (lifecycleStats.total > 0) {
      return lifecycleStats;
    }

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
    const commercialAccess = await resolveUserCommercialAccess(userId);
    const guardContext = {
      membershipActive: commercialAccess.membershipActive,
      entitlements: commercialAccess.entitlements,
    };
    const normalizedSymbols = Array.from(
      new Set(rule.symbols.map((item) => String(item ?? "").trim().toUpperCase()).filter(Boolean))
    );
    const [{ rows: countRows }, existingRules] = await Promise.all([
      backendDatabase.query<{ total: number }>(
        `
        SELECT COUNT(*)::int AS total
        FROM alert_rules
        WHERE user_id = $1 AND created_at >= DATE_TRUNC('day', NOW())
        `,
        [userId]
      ),
      this.getAlertRules(userId),
    ]);
    this.alertLimitGuard.assertCanCreateAlert(guardContext, Number(countRows[0]?.total ?? 0));

    const existingPairs = existingRules.flatMap((item) => item.symbols);
    for (const symbol of normalizedSymbols) {
      this.pairAccessGuard.assertPairAccess(guardContext, {
        feature: "alertas",
        pair: symbol,
        existingPairs,
      });
      existingPairs.push(symbol);
    }

    const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();

    await backendDatabase.query(
      `
      INSERT INTO alert_rules (id, user_id, name, enabled, condition, symbols, alert_types, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
      `,
      [id, userId, rule.name, rule.enabled, rule.condition, JSON.stringify(normalizedSymbols), JSON.stringify(rule.alertTypes), now]
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
      symbols: [...normalizedSymbols],
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
