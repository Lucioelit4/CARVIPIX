import type {
  IAIDomainService,
  IAdminDomainService,
  IDashboardDomainService,
  IFundingDomainService,
  IHistoryDomainService,
  IStatsDomainService,
  ServiceAIContext,
  ServiceAdminSnapshot,
  ServiceDashboardSnapshot,
  ServiceFundingSnapshot,
  ServiceHistoryEntry,
  ServiceStatsSnapshot,
} from "../contracts";
import { backendDatabase } from "../core/database";

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
    const [alertsResult, operationsResult] = await Promise.all([
      backendDatabase.query<{ active_alerts: number }>(
        `SELECT COUNT(*) AS active_alerts FROM alert_rules WHERE enabled = true`
      ),
      backendDatabase.query<{ recent_signals: number }>(
        `
        SELECT COUNT(*) AS recent_signals
        FROM operations
        WHERE executed_at >= NOW() - INTERVAL '24 hours'
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

export class AdminDomainService implements IAdminDomainService {
  async getSnapshot(): Promise<ServiceAdminSnapshot> {
    const [activeUsersResult, incidentsResult] = await Promise.all([
      backendDatabase.query<{ active_users: number }>(`SELECT COUNT(*) AS active_users FROM users WHERE estado = 'activo'`),
      backendDatabase.query<{ pending_incidents: number }>(
        `SELECT COUNT(*) AS pending_incidents FROM alert_history WHERE action = 'triggered' AND timestamp >= NOW() - INTERVAL '48 hours'`
      ),
    ]);

    return {
      generatedAt: new Date(),
      engineStatus: "healthy",
      activeUsers: Number(activeUsersResult.rows[0]?.active_users ?? 0),
      pendingIncidents: Number(incidentsResult.rows[0]?.pending_incidents ?? 0),
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
    const params: Array<string | number> = [];
    let where = "";

    if (userId) {
      params.push(userId);
      where = `WHERE user_id = $${params.length}`;
    }

    params.push(Math.max(1, Math.min(limit, 200)));

    const { rows } = await backendDatabase.query<{ id: string; user_id: string; action: string; timestamp: Date }>(
      `
      SELECT id, user_id, action, timestamp
      FROM alert_history
      ${where}
      ORDER BY timestamp DESC
      LIMIT $${params.length}
      `,
      params
    );

    return rows.map((row) => ({
      id: row.id,
      module: "alerts",
      timestamp: new Date(row.timestamp),
      title: `Alerta ${row.action}`,
      detail: `Usuario ${row.user_id}`,
    }));
  }
}

export class StatsDomainService implements IStatsDomainService {
  async getSnapshot(): Promise<ServiceStatsSnapshot> {
    const [eventsResult, usersResult] = await Promise.all([
      backendDatabase.query<{ total_events: number }>(`SELECT COUNT(*) AS total_events FROM operations`),
      backendDatabase.query<{ active_users: number }>(`SELECT COUNT(*) AS active_users FROM users WHERE estado = 'activo'`),
    ]);

    return {
      generatedAt: new Date(),
      totalEvents: Number(eventsResult.rows[0]?.total_events ?? 0),
      activeUsers: Number(usersResult.rows[0]?.active_users ?? 0),
      avgLatencyMs: 0,
    };
  }
}
