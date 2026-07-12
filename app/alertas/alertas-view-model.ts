export type AlertLifecycleState = "ACTIVE" | "CONDITIONAL" | "TP_HIT" | "SL_HIT" | "CANCELLED" | "EXPIRED" | "CLOSED";

export type StatusFilterValue = "all" | "ACTIVE" | "CONDITIONAL" | "TP_HIT" | "SL_HIT" | "CANCELLED" | "EXPIRED" | "CLOSED";

export type AlertActionability = "can-enter" | "watch" | "closed";

export type AlertSignal = {
  id: string;
  signalId: string;
  analysisId: string;
  symbol: string;
  market: string;
  direction: "Compra" | "Venta" | "Pendiente";
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward: number;
  lifecycleState: AlertLifecycleState;
  lifecycleLabel: string;
  actionability: AlertActionability;
  actionabilityLabel: string;
  actionabilityNote: string;
  statusRaw: string;
  time: string;
  timestampMs: number;
  timestampLabel: string;
  minutesAgo: number;
  canEnter: boolean;
  confidence: number;
  timeframe: string;
  strategy: string;
  strategyId: string;
  analysis: string;
  validUntil: string | null;
  validUntilLabel: string;
  source: string;
  dataOrigin: string;
};

export const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: "ACTIVE", label: "ACTIVA" },
  { value: "CONDITIONAL", label: "CONDICIONAL" },
  { value: "TP_HIT", label: "TP" },
  { value: "SL_HIT", label: "SL" },
  { value: "CANCELLED", label: "CANCELADA" },
  { value: "EXPIRED", label: "EXPIRADA" },
  { value: "CLOSED", label: "CERRADA" },
];

type ExternalAlert = {
  id?: string;
  symbol?: string;
  status?: string;
  description?: string;
  priority?: string;
  timestamp?: Date | string | number;
  data?: {
    direction?: string;
    entryPrice?: number | string;
    stopLossPrice?: number | string;
    takeProfitPrice?: number | string;
    riskRewardRatio?: number | string;
    timeframe?: string;
    confidence?: number | string;
    strategy?: string;
    strategyId?: string;
    signalId?: string;
    analysisId?: string;
    signalStatus?: string;
    source?: string;
    dataOrigin?: string;
    expiresAt?: string;
  };
};

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized || normalized.toUpperCase() === "N/A") {
      return undefined;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function parseDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLevel(value?: number): string {
  if (typeof value !== "number") {
    return "Pendiente";
  }

  if (value >= 100) {
    return value.toFixed(2);
  }

  return value.toFixed(5);
}

export function formatDateTimeLabel(value: Date | null): string {
  if (!value) {
    return "Sin vigencia definida";
  }

  return value.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLifecycleBadgeVariant(state: AlertLifecycleState) {
  if (state === "ACTIVE") return "success";
  if (state === "CONDITIONAL") return "warning";
  if (state === "TP_HIT") return "success";
  if (state === "SL_HIT") return "danger";
  if (state === "CANCELLED" || state === "EXPIRED") return "warning";
  return "info";
}

export function getActionabilityBadgeVariant(state: AlertActionability) {
  if (state === "can-enter") return "premium";
  if (state === "watch") return "warning";
  return "info";
}

function resolveLifecycleState(rawStatus: string | undefined): { state: AlertLifecycleState; label: string } {
  const normalized = String(rawStatus ?? "").trim().toUpperCase();

  if (normalized === "ACTIVE" || normalized === "CREATED") {
    return { state: "ACTIVE", label: "ACTIVA" };
  }
  if (normalized === "CONDITIONAL") {
    return { state: "CONDITIONAL", label: "CONDICIONAL" };
  }
  if (normalized === "TP_HIT" || normalized === "TP" || normalized === "TRIGGERED") {
    return { state: "TP_HIT", label: "TP" };
  }
  if (normalized === "SL_HIT" || normalized === "SL") {
    return { state: "SL_HIT", label: "SL" };
  }
  if (normalized === "CANCELLED" || normalized === "CANCELADA") {
    return { state: "CANCELLED", label: "CANCELADA" };
  }
  if (normalized === "EXPIRED" || normalized === "CADUCADA") {
    return { state: "EXPIRED", label: "EXPIRADA" };
  }

  return { state: "CLOSED", label: "CERRADA" };
}

function resolveActionability(input: {
  lifecycleState: AlertLifecycleState;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  validUntil: Date | null;
}): { state: AlertActionability; label: string; note: string; canEnter: boolean } {
  const hasFullLevels =
    typeof input.entry === "number" &&
    typeof input.stopLoss === "number" &&
    typeof input.takeProfit === "number";

  if (input.lifecycleState === "TP_HIT") {
    return { state: "closed", label: "Objetivo alcanzado", note: "La alerta terminó por Take Profit.", canEnter: false };
  }

  if (input.lifecycleState === "SL_HIT") {
    return { state: "closed", label: "Stop ejecutado", note: "La alerta terminó por Stop Loss.", canEnter: false };
  }

  if (input.lifecycleState === "CANCELLED") {
    return { state: "closed", label: "Cancelada", note: "La señal fue cancelada y ya no es operable.", canEnter: false };
  }

  if (input.lifecycleState === "EXPIRED" || input.lifecycleState === "CLOSED") {
    return { state: "closed", label: "Cerrada", note: "La señal ya no tiene vigencia operativa.", canEnter: false };
  }

  if (input.lifecycleState === "CONDITIONAL") {
    return { state: "watch", label: "Esperar confirmación", note: "La condición de activación aún no se cumple.", canEnter: false };
  }

  if (!hasFullLevels) {
    return { state: "watch", label: "Datos incompletos", note: "Faltan niveles técnicos para operar con precisión.", canEnter: false };
  }

  if (input.validUntil && input.validUntil.getTime() < Date.now()) {
    return { state: "closed", label: "Vencida", note: "La vigencia técnica expiró.", canEnter: false };
  }

  return { state: "can-enter", label: "Lista para entrar", note: "La alerta mantiene vigencia y niveles completos.", canEnter: true };
}

function resolveDirection(rawDirection: string | undefined): AlertSignal["direction"] {
  const normalized = String(rawDirection ?? "").trim().toLowerCase();
  if (normalized === "venta" || normalized === "sell") {
    return "Venta";
  }
  if (normalized === "compra" || normalized === "buy") {
    return "Compra";
  }
  return "Pendiente";
}

function resolveMarket(symbol: string): string {
  if (symbol === "XAUUSD") return "Oro";
  if (symbol.includes("BTC") || symbol.includes("ETH")) return "Crypto";
  return "Forex";
}

function resolveConfidence(raw: unknown, priority: string | undefined): number {
  const numeric = parseNumber(raw);
  if (typeof numeric === "number") {
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }
  if (priority === "critical") return 92;
  if (priority === "high") return 84;
  if (priority === "medium") return 72;
  return 60;
}

export function mapExternalAlerts(rawAlerts: unknown[]): AlertSignal[] {
  const now = Date.now();

  return rawAlerts
    .map((item, index) => {
      const source = item as ExternalAlert;
      const timestamp = parseDate(source.timestamp) ?? new Date(now - (index + 1) * 9 * 60000);
      const entry = parseNumber(source.data?.entryPrice);
      const stopLoss = parseNumber(source.data?.stopLossPrice);
      const takeProfit = parseNumber(source.data?.takeProfitPrice);
      const riskReward = parseNumber(source.data?.riskRewardRatio) ?? 0;
      const signalId = String(source.data?.signalId ?? source.id ?? `signal-${index + 1}`).trim();
      const analysisId = String(source.data?.analysisId ?? "Sin analysis_id").trim();
      const lifecycle = resolveLifecycleState(source.data?.signalStatus ?? source.status);
      const validUntilDate = parseDate(source.data?.expiresAt);
      const actionability = resolveActionability({
        lifecycleState: lifecycle.state,
        entry,
        stopLoss,
        takeProfit,
        validUntil: validUntilDate,
      });

      return {
        id: signalId,
        signalId,
        analysisId,
        symbol: String(source.symbol ?? `ALERTA-${index + 1}`).trim(),
        market: resolveMarket(String(source.symbol ?? "")),
        direction: resolveDirection(source.data?.direction),
        entry,
        stopLoss,
        takeProfit,
        riskReward,
        lifecycleState: lifecycle.state,
        lifecycleLabel: lifecycle.label,
        actionability: actionability.state,
        actionabilityLabel: actionability.label,
        actionabilityNote: actionability.note,
        statusRaw: String(source.data?.signalStatus ?? source.status ?? lifecycle.state),
        time: timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        timestampMs: timestamp.getTime(),
        timestampLabel: formatDateTimeLabel(timestamp),
        minutesAgo: Math.max(0, Math.round((now - timestamp.getTime()) / 60000)),
        canEnter: actionability.canEnter,
        confidence: resolveConfidence(source.data?.confidence, source.priority),
        timeframe: String(source.data?.timeframe ?? "Sin timeframe").trim(),
        strategy: String(source.data?.strategyId ?? source.data?.strategy ?? "Sin estrategia").trim(),
        strategyId: String(source.data?.strategyId ?? source.data?.strategy ?? "Sin estrategia").trim(),
        analysis: String(source.description ?? "Sin análisis disponible").trim(),
        validUntil: validUntilDate ? validUntilDate.toISOString() : null,
        validUntilLabel: formatDateTimeLabel(validUntilDate),
        source: String(source.data?.source ?? "N/A").trim(),
        dataOrigin: String(source.data?.dataOrigin ?? "N/A").trim(),
      } satisfies AlertSignal;
    })
    .sort((a, b) => b.timestampMs - a.timestampMs);
}

export function paginateAlerts(alerts: AlertSignal[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(alerts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: alerts.slice(start, start + pageSize),
  };
}
