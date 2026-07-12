import { createHash } from "crypto";

import { ecosystemServices } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";
import { listActiveSessions } from "@/app/lib/auth/server";

import { OFFICIAL_PLAN_LABELS } from "./catalog";
import { listCommercialAuditEvents } from "./audit-store";
import { resolveUserCommercialAccess } from "./plan-entitlements-store";

export type ClientPortalSnapshot = {
  plan: {
    officialPlan: "FREE" | "BASIC" | "PRO";
    membershipActive: boolean;
    renewalDate?: string;
    entitlements: {
      maxAlertsPerDay: number;
      maxPairs: number;
      maxBots: number;
      historyLimit: number;
      allowedPairs: string[] | null;
      tradingWindowsUtc: Array<{ startHourUtc: number; endHourUtc: number }>;
    };
  };
  alerts: {
    remainingToday: number;
    createdToday: number;
    stats: Awaited<ReturnType<typeof ecosystemServices.alerts.getAlertStats>>;
    rules: Awaited<ReturnType<typeof ecosystemServices.alerts.getAlertRules>>;
    recent: Awaited<ReturnType<typeof ecosystemServices.alerts.getAlerts>>;
    history: Array<{ id: string; alertId: string; action: string; timestamp: string }>;
  };
  bot: {
    license: Awaited<ReturnType<typeof ecosystemServices.bot.getLicense>>;
    instances: Awaited<ReturnType<typeof ecosystemServices.bot.getBotInstances>>;
    connections: Array<Record<string, unknown>>;
    logs: Array<Record<string, unknown>>;
  };
  capital: {
    account: Awaited<ReturnType<typeof ecosystemServices.capital.getCapitalAccount>>;
    reports: Awaited<ReturnType<typeof ecosystemServices.capital.getMonthlyReports>>;
    movements: Awaited<ReturnType<typeof ecosystemServices.capital.getCapitalMovements>>;
    requests: Array<Record<string, unknown>>;
  };
  payments: {
    orders: Awaited<ReturnType<typeof ecosystemServices.payments.getOrderHistory>>;
  };
  operations: Awaited<ReturnType<typeof ecosystemServices.operations.getOperations>>;
  devices: Array<Record<string, unknown>>;
  support: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
};

export function hashCredentialSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function listCapitalRequests(userId: string) {
  const { rows } = await backendDatabase.query<{
    id: string;
    target_capital: number;
    status: string;
    risk_profile: string;
    notes: string | null;
    contract_signed: boolean;
    admin_notes: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT id, target_capital, status, risk_profile, notes, contract_signed, admin_notes, created_at, updated_at
    FROM capital_requests
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    targetCapital: Number(row.target_capital),
    status: row.status,
    riskProfile: row.risk_profile,
    notes: row.notes,
    contractSigned: row.contract_signed,
    adminNotes: row.admin_notes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function listSupportTickets(userId: string) {
  const { rows } = await backendDatabase.query<{
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    message: string;
    admin_reply: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT id, subject, category, status, priority, message, admin_reply, created_at, updated_at
    FROM support_tickets
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    category: row.category,
    status: row.status,
    priority: row.priority,
    message: row.message,
    adminReply: row.admin_reply,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function listBotConnections(userId: string) {
  const { rows } = await backendDatabase.query<{
    id: string;
    bot_instance_id: string;
    broker_type: string;
    server: string;
    login: string;
    mode: string;
    connection_status: string;
    last_synced_at: Date | null;
    heartbeat_at: Date | null;
    reconnect_attempts: number;
    diagnostic_summary: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
    SELECT id, bot_instance_id, broker_type, server, login, mode, connection_status, last_synced_at, heartbeat_at, reconnect_attempts, diagnostic_summary, created_at, updated_at
    FROM bot_connection_profiles
    WHERE user_id = $1
    ORDER BY updated_at DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    botInstanceId: row.bot_instance_id,
    brokerType: row.broker_type,
    server: row.server,
    login: row.login,
    mode: row.mode,
    connectionStatus: row.connection_status,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at).toISOString() : null,
    heartbeatAt: row.heartbeat_at ? new Date(row.heartbeat_at).toISOString() : null,
    reconnectAttempts: Number(row.reconnect_attempts ?? 0),
    diagnosticSummary: row.diagnostic_summary,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function listBotLogs(userId: string, limit = 25) {
  const { rows } = await backendDatabase.query<{
    id: string;
    bot_instance_id: string | null;
    level: string;
    event_type: string;
    message: string;
    metadata: unknown;
    created_at: Date;
  }>(
    `
    SELECT id, bot_instance_id, level, event_type, message, metadata, created_at
    FROM bot_event_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [userId, Math.max(1, Math.min(limit, 100))]
  );

  return rows.map((row) => ({
    id: row.id,
    botInstanceId: row.bot_instance_id,
    level: row.level,
    eventType: row.event_type,
    message: row.message,
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function listAlertHistory(userId: string, limit: number) {
  const { rows } = await backendDatabase.query<{
    id: string;
    alert_id: string;
    action: string;
    timestamp: Date;
  }>(
    `
    SELECT id, alert_id, action, timestamp
    FROM alert_history
    WHERE user_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
    `,
    [userId, Math.max(1, Math.min(limit, 500))]
  );

  return rows.map((row) => ({
    id: row.id,
    alertId: row.alert_id,
    action: row.action,
    timestamp: new Date(row.timestamp).toISOString(),
  }));
}

export async function getAlertsCreatedToday(userId: string): Promise<number> {
  const { rows } = await backendDatabase.query<{ total: number }>(
    `
    SELECT COUNT(*)::int AS total
    FROM alert_rules
    WHERE user_id = $1 AND created_at >= DATE_TRUNC('day', NOW())
    `,
    [userId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function buildClientPortalSnapshot(userId: string): Promise<ClientPortalSnapshot> {
  const commercialAccess = await resolveUserCommercialAccess(userId);
  const [
    membership,
    alertStats,
    alertRules,
    recentAlerts,
    alertsCreatedToday,
    alertHistory,
    license,
    botInstances,
    botConnections,
    botLogs,
    capitalAccount,
    capitalRequests,
    payments,
    operations,
    sessions,
    supportTickets,
    audit,
  ] = await Promise.all([
    ecosystemServices.memberships.getCurrentMembership(),
    ecosystemServices.alerts.getAlertStats(userId),
    ecosystemServices.alerts.getAlertRules(userId),
    ecosystemServices.alerts.getAlerts({ userId, limit: commercialAccess.entitlements.historyLimit }),
    getAlertsCreatedToday(userId),
    listAlertHistory(userId, commercialAccess.entitlements.historyLimit),
    ecosystemServices.bot.getLicense(userId),
    ecosystemServices.bot.getBotInstances(userId),
    listBotConnections(userId),
    listBotLogs(userId),
    ecosystemServices.capital.getCapitalAccount(userId),
    listCapitalRequests(userId),
    ecosystemServices.payments.getOrderHistory(userId),
    ecosystemServices.operations.getOperations(userId, commercialAccess.entitlements.historyLimit),
    listActiveSessions(userId),
    listSupportTickets(userId),
    listCommercialAuditEvents(20),
  ]);

  const [capitalMovements, capitalReports] = await Promise.all([
    capitalAccount ? ecosystemServices.capital.getCapitalMovements(capitalAccount.accountId) : Promise.resolve([]),
    capitalAccount ? ecosystemServices.capital.getMonthlyReports(capitalAccount.accountId) : Promise.resolve([]),
  ]);

  return {
    plan: {
      officialPlan: OFFICIAL_PLAN_LABELS[commercialAccess.subscriptionPlan],
      membershipActive: commercialAccess.membershipActive,
      renewalDate: membership.fechaFin ? new Date(membership.fechaFin).toISOString() : undefined,
      entitlements: {
        maxAlertsPerDay: commercialAccess.entitlements.maxAlertsPerDay,
        maxPairs: commercialAccess.entitlements.maxPairs,
        maxBots: commercialAccess.entitlements.maxBots,
        historyLimit: commercialAccess.entitlements.historyLimit,
        allowedPairs: commercialAccess.entitlements.allowedPairs,
        tradingWindowsUtc: commercialAccess.entitlements.tradingWindowsUtc,
      },
    },
    alerts: {
      remainingToday: Math.max(0, commercialAccess.entitlements.maxAlertsPerDay - alertsCreatedToday),
      createdToday: alertsCreatedToday,
      stats: alertStats,
      rules: alertRules.slice(0, commercialAccess.entitlements.historyLimit),
      recent: recentAlerts.slice(0, commercialAccess.entitlements.historyLimit),
      history: alertHistory,
    },
    bot: {
      license,
      instances: botInstances,
      connections: botConnections,
      logs: botLogs,
    },
    capital: {
      account: capitalAccount,
      reports: capitalReports,
      movements: capitalMovements,
      requests: capitalRequests,
    },
    payments: {
      orders: payments,
    },
    operations,
    devices: sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      userAgent: session.userAgent ?? "No disponible",
      ipAddress: session.ipAddress ?? "No disponible",
      deviceLabel: session.deviceLabel ?? "Sesion web",
    })),
    support: supportTickets,
    audit: audit.filter((item) => !item.userId || item.userId === userId),
  };
}