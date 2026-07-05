"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Gauge, ShieldCheck, Signal } from "lucide-react";
import AlertFilters, { type StatusFilterValue } from "./components/AlertFilters";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import { getAlerts } from "@/app/lib/data-helpers";
import { CARVIPIXCard } from "../design-system";

type SignalStateKey = "can-enter" | "wait" | "no-enter" | "closed";

type AlertSignal = {
  id: string;
  symbol: string;
  market: string;
  direction: "Compra" | "Venta";
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward: number;
  stateKey: SignalStateKey;
  stateLabel: string;
  stateNote: string;
  statusRaw: string;
  time: string;
  minutesAgo: number;
  canEnter: boolean;
  confidence: number;
  timeframe: string;
  strategy: string;
  analysis: string;
};

const DEFAULT_ALERTS: AlertSignal[] = [
  {
    id: "xauusd-01",
    symbol: "XAUUSD",
    market: "Oro",
    direction: "Compra",
    entry: 2338.45,
    stopLoss: 2332.0,
    takeProfit: 2345.0,
    riskReward: 2.31,
    stateKey: "can-enter",
    stateLabel: "🟢 PUEDES ENTRAR",
    stateNote: "Ventana de entrada aún válida.",
    statusRaw: "active",
    time: "14:32",
    minutesAgo: 6,
    canEnter: true,
    confidence: 88,
    timeframe: "M15",
    strategy: "Ruptura + retesteo",
    analysis: "Rompimiento limpio de estructura y retesteo válido de zona institucional.",
  },
  {
    id: "eurusd-02",
    symbol: "EURUSD",
    market: "Forex",
    direction: "Venta",
    entry: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    riskReward: 0,
    stateKey: "wait",
    stateLabel: "🟡 ESPERA CONFIRMACIÓN",
    stateNote: "Todavía no hay niveles completos de ejecución.",
    statusRaw: "active",
    time: "14:21",
    minutesAgo: 17,
    canEnter: false,
    confidence: 74,
    timeframe: "M5",
    strategy: "Confirmación de momentum",
    analysis: "Dirección probable bajista, pero falta confirmación de entrada y niveles finales.",
  },
  {
    id: "btcusd-03",
    symbol: "BTCUSD",
    market: "Crypto",
    direction: "Compra",
    entry: 61520,
    stopLoss: 60780,
    takeProfit: 62880,
    riskReward: 1.84,
    stateKey: "no-enter",
    stateLabel: "🔴 YA NO ENTRAR",
    stateNote: "Precio fuera de ventana óptima de entrada.",
    statusRaw: "active",
    time: "13:58",
    minutesAgo: 43,
    canEnter: false,
    confidence: 81,
    timeframe: "M15",
    strategy: "Continuación de tendencia",
    analysis: "La señal fue válida, pero el desplazamiento ya reduce relación riesgo/beneficio para nueva entrada.",
  },
  {
    id: "gbpusd-04",
    symbol: "GBPUSD",
    market: "Forex",
    direction: "Venta",
    entry: 1.2684,
    stopLoss: 1.272,
    takeProfit: 1.262,
    riskReward: 1.77,
    stateKey: "closed",
    stateLabel: "⚫ FINALIZADA",
    stateNote: "Señal cerrada por objetivo o gestión.",
    statusRaw: "triggered",
    time: "12:15",
    minutesAgo: 106,
    canEnter: false,
    confidence: 95,
    timeframe: "M30",
    strategy: "Rechazo en resistencia",
    analysis: "Operación cerrada según plan. No corresponde una nueva entrada en esta señal.",
  },
];

const DEMO_LEVELS_BY_SYMBOL: Record<string, { entry: number; stopLoss: number; takeProfit: number; riskReward: number; direction: "Compra" | "Venta"; strategy: string; timeframe: string }> = {
  XAUUSD: { entry: 2338.45, stopLoss: 2332.0, takeProfit: 2345.0, riskReward: 2.31, direction: "Compra", strategy: "Ruptura + retesteo", timeframe: "M15" },
  EURUSD: { entry: 1.07153, stopLoss: 1.0732, takeProfit: 1.069, riskReward: 1.8, direction: "Venta", strategy: "Pullback de continuación", timeframe: "M5" },
  GBPUSD: { entry: 1.2684, stopLoss: 1.272, takeProfit: 1.262, riskReward: 1.77, direction: "Venta", strategy: "Rechazo de resistencia", timeframe: "M15" },
  USDJPY: { entry: 159.145, stopLoss: 159.46, takeProfit: 158.62, riskReward: 1.66, direction: "Venta", strategy: "Quiebre intradía", timeframe: "M15" },
  AUDUSD: { entry: 0.68021, stopLoss: 0.6787, takeProfit: 0.68295, riskReward: 1.81, direction: "Compra", strategy: "Reanudación alcista", timeframe: "M15" },
  NZDUSD: { entry: 0.61135, stopLoss: 0.60988, takeProfit: 0.61372, riskReward: 1.61, direction: "Compra", strategy: "Impulso sobre soporte", timeframe: "M15" },
  BTCUSD: { entry: 61520, stopLoss: 60780, takeProfit: 62880, riskReward: 1.84, direction: "Compra", strategy: "Continuación de tendencia", timeframe: "M15" },
};

const STATE_PRIORITY: Record<SignalStateKey, number> = {
  "can-enter": 0,
  wait: 1,
  "no-enter": 2,
  closed: 3,
};

function parseNumber(value: unknown): number | undefined {
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

function resolveSignalState(input: {
  statusRaw: string;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  minutesAgo: number;
}): { key: SignalStateKey; label: string; note: string; canEnter: boolean } {
  const status = input.statusRaw.toLowerCase();
  const hasFullLevels =
    typeof input.entry === "number" &&
    typeof input.stopLoss === "number" &&
    typeof input.takeProfit === "number";

  if (status.includes("closed") || status.includes("triggered") || status.includes("resolved")) {
    return {
      key: "closed",
      label: "⚫ FINALIZADA",
      note: "Señal cerrada por objetivo o gestión.",
      canEnter: false,
    };
  }

  if (!hasFullLevels) {
    return {
      key: "wait",
      label: "🟡 ESPERA CONFIRMACIÓN",
      note: "Faltan niveles completos para ejecutar.",
      canEnter: false,
    };
  }

  if (input.minutesAgo > 35) {
    return {
      key: "no-enter",
      label: "🔴 YA NO ENTRAR",
      note: "La ventana óptima de entrada ya pasó.",
      canEnter: false,
    };
  }

  return {
    key: "can-enter",
    label: "🟢 PUEDES ENTRAR",
    note: "Entrada aún válida según plan.",
    canEnter: true,
  };
}

function mapExternalAlerts(rawAlerts: unknown[]): AlertSignal[] {
  const now = Date.now();

  return rawAlerts
    .map((item, index) => {
      const source = item as {
        id?: string;
        symbol?: string;
        status?: string;
        description?: string;
        priority?: string;
        timestamp?: Date | string | number;
        data?: {
          direction?: string;
          entryPrice?: number;
          stopLossPrice?: number;
          takeProfitPrice?: number;
          riskRewardRatio?: number;
          timeframe?: string;
          confidence?: number;
          strategy?: string;
        };
      };

      const timestamp = source.timestamp ? new Date(source.timestamp) : new Date(now - (index + 1) * 9 * 60000);
      const minutesAgo = Math.max(1, Math.round((now - timestamp.getTime()) / 60000));
      const symbol = source.symbol ?? `ALERTA-${index + 1}`;
      const fallbackLevels = DEMO_LEVELS_BY_SYMBOL[symbol];

      const entry = parseNumber(source.data?.entryPrice) ?? fallbackLevels?.entry;
      const stopLoss = parseNumber(source.data?.stopLossPrice) ?? fallbackLevels?.stopLoss;
      const takeProfit = parseNumber(source.data?.takeProfitPrice) ?? fallbackLevels?.takeProfit;
      const riskReward = parseNumber(source.data?.riskRewardRatio) ?? fallbackLevels?.riskReward ?? 0;

      const direction =
        source.data?.direction?.toLowerCase() === "venta"
          ? "Venta"
          : source.data?.direction?.toLowerCase() === "compra"
            ? "Compra"
            : fallbackLevels?.direction ?? "Compra";
      const state = resolveSignalState({
        statusRaw: source.status ?? "active",
        entry,
        stopLoss,
        takeProfit,
        minutesAgo,
      });

      const market =
        symbol === "XAUUSD"
          ? "Oro"
          : symbol.includes("BTC") || symbol.includes("ETH")
            ? "Crypto"
            : "Forex";

      return {
        id: source.id ?? `${symbol.toLowerCase()}-${index}`,
        symbol,
        market,
        direction,
        entry,
        stopLoss,
        takeProfit,
        riskReward,
        stateKey: state.key,
        stateLabel: state.label,
        stateNote: state.note,
        statusRaw: source.status ?? "active",
        time: timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        minutesAgo,
        canEnter: state.canEnter,
        confidence: Number(source.data?.confidence ?? (source.priority === "critical" ? 90 : 78)),
        timeframe: source.data?.timeframe ?? fallbackLevels?.timeframe ?? "M15",
        strategy: source.data?.strategy ?? fallbackLevels?.strategy ?? "Gestión institucional",
        analysis:
          source.description ??
          "Señal demo preparada para evaluación rápida del contexto y ejecución disciplinada.",
      } satisfies AlertSignal;
    })
    .sort((a, b) => a.minutesAgo - b.minutesAgo);
}

function formatLevel(value?: number): string {
  if (typeof value !== "number") {
    return "Pendiente";
  }

  if (value >= 100) {
    return value.toFixed(2);
  }

  return value.toFixed(5);
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<AlertSignal[]>(DEFAULT_ALERTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ALERTS[0].id);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      try {
        const result = await getAlerts(16);
        if (!mounted || !Array.isArray(result) || result.length === 0) {
          return;
        }

        const mapped = mapExternalAlerts(result);
        if (mapped.length === 0) {
          return;
        }

        setAlerts(mapped);
        setSelectedId(mapped[0].id);
      } catch {
        // Keep default demo data when module data is not available.
      }
    };

    loadAlerts();

    return () => {
      mounted = false;
    };
  }, []);

  const symbolOptions = useMemo(() => {
    const symbols = Array.from(new Set(alerts.map((item) => item.symbol)));
    return ["all", ...symbols];
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      const matchesState = statusFilter === "all" ? true : item.stateKey === statusFilter;
      const matchesSymbol = symbolFilter === "all" ? true : item.symbol === symbolFilter;
      const matchesSearch =
        search.trim().length === 0
          ? true
          : `${item.symbol} ${item.market}`.toLowerCase().includes(search.toLowerCase());

      return matchesState && matchesSymbol && matchesSearch;
    });
  }, [alerts, search, statusFilter, symbolFilter]);

  const protagonist = useMemo(() => {
    if (filteredAlerts.length === 0) {
      return undefined;
    }

    return [...filteredAlerts].sort((a, b) => {
      if (STATE_PRIORITY[a.stateKey] !== STATE_PRIORITY[b.stateKey]) {
        return STATE_PRIORITY[a.stateKey] - STATE_PRIORITY[b.stateKey];
      }
      return a.minutesAgo - b.minutesAgo;
    })[0];
  }, [filteredAlerts]);

  const selectedAlert = useMemo(() => {
    const picked = filteredAlerts.find((item) => item.id === selectedId);
    return picked ?? protagonist;
  }, [filteredAlerts, protagonist, selectedId]);

  const summary = useMemo(() => {
    const canEnter = filteredAlerts.filter((item) => item.stateKey === "can-enter").length;
    const waiting = filteredAlerts.filter((item) => item.stateKey === "wait").length;
    const noEnter = filteredAlerts.filter((item) => item.stateKey === "no-enter").length;
    const avgConfidence =
      filteredAlerts.length === 0
        ? 0
        : Math.round(filteredAlerts.reduce((acc, item) => acc + item.confidence, 0) / filteredAlerts.length);

    return { canEnter, waiting, noEnter, avgConfidence };
  }, [filteredAlerts]);

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0B0B0B] to-[#0E1622] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1">Sala en vivo</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">Modo premium</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Alertas en Vivo</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70 sm:text-base">
            En menos de 2 segundos identifica la señal activa, si aún puedes entrar y los niveles exactos de ejecución.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CARVIPIXCard variant="statistics" padding="16" hover={false}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Puedes entrar</p>
                <Signal className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-emerald-300">{summary.canEnter}</p>
            </CARVIPIXCard>
            <CARVIPIXCard variant="statistics" padding="16" hover={false}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Espera confirmación</p>
                <Clock3 className="h-4 w-4 text-amber-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-amber-300">{summary.waiting}</p>
            </CARVIPIXCard>
            <CARVIPIXCard variant="statistics" padding="16" hover={false}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Ya no entrar</p>
                <ShieldCheck className="h-4 w-4 text-rose-300" />
              </div>
              <p className="mt-3 text-3xl font-bold text-rose-300">{summary.noEnter}</p>
            </CARVIPIXCard>
            <CARVIPIXCard variant="statistics" padding="16" hover={false}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Confianza media</p>
                <Gauge className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <p className="mt-3 text-3xl font-bold text-[#D4AF37]">{summary.avgConfidence}%</p>
            </CARVIPIXCard>
          </div>
        </section>

        {protagonist ? (
          <section className="rounded-2xl border border-[#D4AF37]/35 bg-[#0A131F] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Alerta protagonista</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {protagonist.symbol} · {protagonist.direction}
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  {protagonist.time} · hace {protagonist.minutesAgo} min · {protagonist.stateLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Entrada</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatLevel(protagonist.entry)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">TP</p>
                <p className="mt-1 text-lg font-semibold text-emerald-300">{formatLevel(protagonist.takeProfit)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">SL</p>
                <p className="mt-1 text-lg font-semibold text-rose-300">{formatLevel(protagonist.stopLoss)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Riesgo/Beneficio</p>
                <p className="mt-1 text-lg font-semibold text-[#D4AF37]">
                  {protagonist.riskReward > 0 ? protagonist.riskReward.toFixed(2) : "Pendiente"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105"
                onClick={() => setSelectedId(protagonist.id)}
              >
                Ver señal
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-4">
            <AlertFilters
              search={search}
              selectedSymbol={symbolFilter}
              selectedStatus={statusFilter}
              symbolOptions={symbolOptions}
              onSearchChange={setSearch}
              onSymbolChange={setSymbolFilter}
              onStatusChange={setStatusFilter}
              onClear={() => {
                setSearch("");
                setSymbolFilter("all");
                setStatusFilter("all");
              }}
            />

            <AlertsTable alerts={filteredAlerts} selectedId={selectedId} onSelect={setSelectedId} />
          </section>

          <AlertDetails alert={selectedAlert} />
        </div>
      </div>
    </main>
  );
}
