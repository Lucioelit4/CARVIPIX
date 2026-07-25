import { NextRequest } from "next/server";

export type AlertsQaScenario = "empty" | "single-new" | "multi-mixed";

export type AlertsQaAction = {
  alertId: string;
  action: "viewed" | "dismissed" | "triggered";
  createdAt: string;
};

type QaState = {
  scenario: AlertsQaScenario;
  actions: AlertsQaAction[];
};

type QaAlertRecord = {
  id: string;
  type: "signal";
  symbol: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  timestamp: string;
  actionUrl: string;
  data: {
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice: number;
    riskRewardRatio: number;
    timeframe: string;
    direction: "Compra" | "Venta" | "Pendiente";
    confidence: number;
    approvalCount: number;
    strategyId: string;
    signalId: string;
    analysisId: string;
    signalStatus: string;
    source: string;
    dataOrigin: "DEMO";
    expiresAt: string | null;
  };
};

export type AlertsQaPayload = {
  scenario: AlertsQaScenario;
  alerts: QaAlertRecord[];
  history: Array<{ alertId: string; action: string }>;
  stats: {
    total: number;
    active: number;
    triggered: number;
    resolved: number;
  };
};

const QA_STATE_BY_USER = new Map<string, QaState>();
const QA_CONTROL_TOKEN_HEADER = "x-carvipix-alerts-qa-token";

const SUPPORTED_SCENARIOS: AlertsQaScenario[] = ["empty", "single-new", "multi-mixed"];

function nowIsoPlusMinutes(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

function nowIsoMinusSeconds(secondsAgo: number): string {
  return new Date(Date.now() - secondsAgo * 1_000).toISOString();
}

function buildAlert(input: {
  id: string;
  symbol: string;
  direction: "Compra" | "Venta" | "Pendiente";
  status: string;
  secondsAgo: number;
  expiresInMinutes: number | null;
  confidence: number;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
}): QaAlertRecord {
  return {
    id: input.id,
    type: "signal",
    symbol: input.symbol,
    title: `${input.direction} ${input.symbol}`,
    description: input.description,
    priority: input.priority,
    status: input.status,
    timestamp: nowIsoMinusSeconds(input.secondsAgo),
    actionUrl: "/alertas",
    data: {
      entryPrice: 1.245,
      stopLossPrice: 1.239,
      takeProfitPrice: 1.258,
      riskRewardRatio: 2.17,
      timeframe: "M15",
      direction: input.direction,
      confidence: input.confidence,
      approvalCount: 3,
      strategyId: "QA_STRAT_M15",
      signalId: input.id,
      analysisId: `qa-analysis-${input.id}`,
      signalStatus: input.status,
      source: "QA_CONTROLLED_DATASET",
      dataOrigin: "DEMO",
      expiresAt: input.expiresInMinutes === null ? null : nowIsoPlusMinutes(input.expiresInMinutes),
    },
  };
}

function buildScenarioAlerts(scenario: AlertsQaScenario): QaAlertRecord[] {
  if (scenario === "empty") {
    return [];
  }

  if (scenario === "single-new") {
    return [
      buildAlert({
        id: "qa-single-new",
        symbol: "EURUSD",
        direction: "Compra",
        status: "ACTIVE",
        secondsAgo: 20,
        expiresInMinutes: 20,
        confidence: 91,
        description: "Escenario QA: alerta nueva y vigente para validacion de toast y contador.",
        priority: "high",
      }),
    ];
  }

  return [
    buildAlert({
      id: "qa-new-vigente",
      symbol: "XAUUSD",
      direction: "Compra",
      status: "ACTIVE",
      secondsAgo: 12,
      expiresInMinutes: 35,
      confidence: 93,
      description: "Escenario QA: alerta nueva vigente.",
      priority: "critical",
    }),
    buildAlert({
      id: "qa-active",
      symbol: "GBPUSD",
      direction: "Venta",
      status: "ACTIVE",
      secondsAgo: 75,
      expiresInMinutes: 18,
      confidence: 84,
      description: "Escenario QA: alerta activa en seguimiento.",
      priority: "high",
    }),
    buildAlert({
      id: "qa-soon-expire",
      symbol: "EURUSD",
      direction: "Compra",
      status: "CONDITIONAL",
      secondsAgo: 120,
      expiresInMinutes: 3,
      confidence: 79,
      description: "Escenario QA: alerta proxima a expirar.",
      priority: "medium",
    }),
    buildAlert({
      id: "qa-expired",
      symbol: "BTCUSD",
      direction: "Venta",
      status: "ACTIVE",
      secondsAgo: 180,
      expiresInMinutes: -2,
      confidence: 71,
      description: "Escenario QA: alerta tecnicamente expirada por vigencia.",
      priority: "medium",
    }),
    buildAlert({
      id: "qa-winner",
      symbol: "XAUUSD",
      direction: "Compra",
      status: "TP_HIT",
      secondsAgo: 240,
      expiresInMinutes: null,
      confidence: 88,
      description: "Escenario QA: alerta ganadora cerrada en TP.",
      priority: "high",
    }),
    buildAlert({
      id: "qa-loser",
      symbol: "EURUSD",
      direction: "Venta",
      status: "SL_HIT",
      secondsAgo: 300,
      expiresInMinutes: null,
      confidence: 67,
      description: "Escenario QA: alerta perdedora cerrada en SL.",
      priority: "medium",
    }),
    buildAlert({
      id: "qa-cancelled",
      symbol: "GBPUSD",
      direction: "Pendiente",
      status: "CANCELLED",
      secondsAgo: 360,
      expiresInMinutes: null,
      confidence: 62,
      description: "Escenario QA: alerta cancelada.",
      priority: "low",
    }),
    buildAlert({
      id: "qa-viewed",
      symbol: "XAUUSD",
      direction: "Compra",
      status: "ACTIVE",
      secondsAgo: 420,
      expiresInMinutes: 30,
      confidence: 77,
      description: "Escenario QA: alerta previamente vista.",
      priority: "low",
    }),
  ];
}

function defaultActionsForScenario(scenario: AlertsQaScenario): AlertsQaAction[] {
  if (scenario !== "multi-mixed") {
    return [];
  }

  return [
    {
      alertId: "qa-viewed",
      action: "viewed",
      createdAt: new Date().toISOString(),
    },
  ];
}

function ensureUserState(userId: string): QaState {
  const existing = QA_STATE_BY_USER.get(userId);
  if (existing) {
    return existing;
  }

  const initial: QaState = {
    scenario: "empty",
    actions: [],
  };
  QA_STATE_BY_USER.set(userId, initial);
  return initial;
}

function computeStats(alerts: QaAlertRecord[]): AlertsQaPayload["stats"] {
  const statusOf = (alert: QaAlertRecord) => String(alert.data.signalStatus || alert.status).toUpperCase();
  return {
    total: alerts.length,
    active: alerts.filter((alert) => {
      const status = statusOf(alert);
      return status === "CREATED" || status === "ACTIVE" || status === "CONDITIONAL";
    }).length,
    triggered: alerts.filter((alert) => {
      const status = statusOf(alert);
      return status === "TP_HIT" || status === "SL_HIT";
    }).length,
    resolved: alerts.filter((alert) => {
      const status = statusOf(alert);
      return status === "CANCELLED" || status === "EXPIRED" || status === "CLOSED";
    }).length,
  };
}

export function listAlertsQaScenarios(): AlertsQaScenario[] {
  return [...SUPPORTED_SCENARIOS];
}

export function isAlertsQaModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.CARVIPIX_RUNTIME_ENV === "qa" && process.env.CARVIPIX_ALERTS_QA_MODE === "true";
}

export function isAlertsQaControlAuthorized(request: NextRequest): boolean {
  if (!isAlertsQaModeEnabled()) {
    return false;
  }

  const host = request.nextUrl.hostname.toLowerCase();
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocalHost) {
    return false;
  }

  const expectedToken = String(process.env.CARVIPIX_ALERTS_QA_TOKEN ?? "").trim();
  const providedToken = String(request.headers.get(QA_CONTROL_TOKEN_HEADER) ?? "").trim();
  if (!expectedToken) {
    return false;
  }

  return providedToken === expectedToken;
}

export function setAlertsQaScenario(userId: string, scenario: AlertsQaScenario): AlertsQaPayload {
  const state = ensureUserState(userId);
  state.scenario = scenario;
  state.actions = defaultActionsForScenario(scenario);
  QA_STATE_BY_USER.set(userId, state);
  return getAlertsQaPayload(userId);
}

export function recordAlertsQaAction(
  userId: string,
  alertId: string,
  action: AlertsQaAction["action"]
): void {
  const state = ensureUserState(userId);
  const exists = state.actions.some((item) => item.alertId === alertId && item.action === action);
  if (!exists) {
    state.actions.push({
      alertId,
      action,
      createdAt: new Date().toISOString(),
    });
  }
}

export function getAlertsQaPayload(userId: string): AlertsQaPayload {
  const state = ensureUserState(userId);
  const alerts = buildScenarioAlerts(state.scenario);
  const history = state.actions.map((item) => ({
    alertId: item.alertId,
    action: item.action,
  }));

  return {
    scenario: state.scenario,
    alerts,
    history,
    stats: computeStats(alerts),
  };
}

export function isAlertsQaAlertId(alertId: string): boolean {
  return String(alertId).startsWith("qa-");
}
