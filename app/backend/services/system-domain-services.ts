import type {
  IAIDomainService,
  IAdminDomainService,
  IDashboardDomainService,
  IMasterSignalDomainService,
  IFundingDomainService,
  IHistoryDomainService,
  IStatsDomainService,
  ServiceAIContext,
  ServiceAdminSnapshot,
  ServiceDashboardSnapshot,
  ServiceFundingSnapshot,
  ServiceHistoryEntry,
  ServiceStatsSnapshot,
  ServiceMasterSignal,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { realSignalLifecycleService } from "./real-signal-lifecycle-service";

export class FundingDomainService implements IFundingDomainService {
  async getSnapshot(): Promise<ServiceFundingSnapshot> {
    const { rows } = await backendDatabase.query<{ active_programs: number; approved_accounts: number; total_capital: number }>(
      `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('active', 'pending')) AS active_programs,
        COUNT(*) FILTER (WHERE status = 'active') AS approved_accounts,
        COALESCE(SUM(initial_capital), 0) AS total_capital
      FROM capital_accounts
      `
    );

    const row = rows[0];
    return {
      generatedAt: new Date(),
      activePrograms: Number(row?.active_programs ?? 0),
      approvedAccounts: Number(row?.approved_accounts ?? 0),
      totalCapital: Number(row?.total_capital ?? 0),
    };
  }
}

export class DashboardDomainService implements IDashboardDomainService {
  async getSnapshot(): Promise<ServiceDashboardSnapshot> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const [alertsResult, operationsResult] = await Promise.all([
      backendDatabase.query<{ active_alerts: number }>(
        `
        SELECT COUNT(*)::int AS active_alerts
        FROM real_signal_lifecycle
        WHERE signal_status IN ('CREATED', 'CONDITIONAL', 'ACTIVE')
          AND decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT')
        `
      ),
      backendDatabase.query<{ recent_signals: number }>(
        `
        SELECT COUNT(*)::int AS recent_signals
        FROM real_signal_lifecycle
        WHERE signal_timestamp >= NOW() - INTERVAL '24 hours'
        `
      ),
    ]);

    return {
      generatedAt: new Date(),
      activeAlerts: Number(alertsResult.rows[0]?.active_alerts ?? 0),
      recentSignals: Number(operationsResult.rows[0]?.recent_signals ?? 0),
      engineHealth: "healthy",
    };
  }
}

export class MasterSignalDomainService implements IMasterSignalDomainService {
  async getLatestSignal(): Promise<ServiceMasterSignal | null> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const latest = await realSignalLifecycleService.getLatestSignal();
    if (!latest) {
      return null;
    }

    return {
      signalId: latest.signalId,
      analysisId: latest.analysisId,
      symbol: latest.symbol,
      analysisProfile: String(latest.metadata.analysisProfile ?? "N/A"),
      selectedStrategyId: latest.strategyId,
      direction: latest.decision === "ENTER_BUY" ? "BUY" : latest.decision === "ENTER_SELL" ? "SELL" : "NONE",
      entry: latest.entry,
      stopLoss: latest.stopLoss,
      takeProfit: latest.takeProfit,
      grossRR: typeof latest.metadata.grossRR === "number" ? latest.metadata.grossRR : null,
      netRR: typeof latest.metadata.netRR === "number" ? latest.metadata.netRR : null,
      expiresAt: typeof latest.metadata.expiresAt === "string" ? latest.metadata.expiresAt : null,
      status: "SHADOW",
      humanReviewRequired: latest.metadata.humanReviewRequired !== false,
      autoExecutionEligible: latest.metadata.autoExecutionEligible === true,
      createdAt: latest.signalTimestamp.toISOString(),
    };
  }
}

export class AdminDomainService implements IAdminDomainService {
  async getSnapshot(): Promise<ServiceAdminSnapshot> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const latestSignal = await realSignalLifecycleService.getLatestSignal();
    const [activeUsersResult, incidentsResult] = await Promise.all([
      backendDatabase.query<{ active_users: number }>(`SELECT COUNT(*) AS active_users FROM users WHERE estado = 'activo' AND COALESCE(exclude_from_commercial_metrics, false) = false`),
      backendDatabase.query<{ pending_incidents: number }>(
        `SELECT COUNT(*) AS pending_incidents FROM alert_history WHERE action = 'triggered' AND timestamp >= NOW() - INTERVAL '48 hours'`
      ),
    ]);

    return {
      generatedAt: new Date(),
      engineStatus: "healthy",
      activeUsers: Number(activeUsersResult.rows[0]?.active_users ?? 0),
      pendingIncidents: Number(incidentsResult.rows[0]?.pending_incidents ?? 0),
      masterSignal: latestSignal
        ? {
            signalId: latestSignal.signalId,
            analysisId: latestSignal.analysisId,
            decision: latestSignal.decision === "ENTER_BUY" ? "BUY" : latestSignal.decision === "ENTER_SELL" ? "SELL" : "NONE",
            strategyId: latestSignal.strategyId,
            status: "SHADOW",
            source: "CADP_V2",
            validationStatus: "VALIDATED",
            mode: "SHADOW",
            humanReviewRequired: latestSignal.metadata.humanReviewRequired !== false,
            autoExecutionEligible: latestSignal.metadata.autoExecutionEligible === true,
          }
        : null,
    };
  }
}

export class AIDomainService implements IAIDomainService {
  async getContext(): Promise<ServiceAIContext> {
    const { rows } = await backendDatabase.query<{ total_alert_rules: number; total_operations: number }>(
      `
      SELECT
        (SELECT COUNT(*) FROM alert_rules) AS total_alert_rules,
        (SELECT COUNT(*) FROM operations) AS total_operations
      `
    );

    const row = rows[0];
    const summary =
      Number(row?.total_operations ?? 0) > 0
        ? `Contexto operativo: ${Number(row?.total_operations ?? 0)} operaciones registradas.`
        : "Sin datos";

    return {
      generatedAt: new Date(),
      summary,
      contextVersion: `db-${Number(row?.total_alert_rules ?? 0)}`,
    };
  }
}

export class HistoryDomainService implements IHistoryDomainService {
  async getHistory(userId?: string, limit = 20): Promise<ServiceHistoryEntry[]> {
    void userId;
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const signals = await realSignalLifecycleService.getRecentSignals({ limit, includeAuditOnly: true });

    return signals.map((record) => ({
      id: record.signalId,
      module: "ai",
      timestamp: record.signalTimestamp,
      title: `Señal ${record.signalId}`,
      detail: `${record.decision} · ${record.status} · ${record.classification}`,
      signalId: record.signalId,
      analysisId: record.analysisId,
      legacy: false,
    }));
  }
}

export class StatsDomainService implements IStatsDomainService {
  async getSnapshot(): Promise<ServiceStatsSnapshot> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const [eventsResult, usersResult] = await Promise.all([
      backendDatabase.query<{ total_events: number }>(`SELECT COUNT(*)::int AS total_events FROM real_signal_lifecycle`),
      backendDatabase.query<{ active_users: number }>(`SELECT COUNT(*) AS active_users FROM users WHERE estado = 'activo' AND COALESCE(exclude_from_commercial_metrics, false) = false`),
    ]);

    return {
      generatedAt: new Date(),
      totalEvents: Number(eventsResult.rows[0]?.total_events ?? 0),
      activeUsers: Number(usersResult.rows[0]?.active_users ?? 0),
      avgLatencyMs: 0,
    };
  }
}
