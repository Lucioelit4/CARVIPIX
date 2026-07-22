"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Gauge, ShieldCheck, Signal } from "lucide-react";
import AlertFilters from "./components/AlertFilters";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import { getAlerts, getGlobalResults, type GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";
import { CARVIPIXButton, CARVIPIXCard } from "../design-system";
import DataSourceBanner from "@/app/components/DataSourceBanner";
import {
  formatLevel,
  mapExternalAlerts,
  paginateAlerts,
  type AlertSignal,
  type StatusFilterValue,
} from "./alertas-view-model";

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<AlertSignal[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [globalResults, setGlobalResults] = useState<GlobalResultsSnapshot | null>(null);

  const refreshAlerts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [result, centralResults] = await Promise.all([getAlerts(16), getGlobalResults()]);
      setGlobalResults(centralResults);

      if (!Array.isArray(result)) {
        setAlerts([]);
        setSelectedId("");
        setLoadError("Formato inesperado al consultar alertas.");
        return;
      }

      const mapped = mapExternalAlerts(result);
      if (mapped.length === 0) {
        setAlerts([]);
        setSelectedId("");
      } else {
        setAlerts(mapped);
        setSelectedId((current) => (mapped.some((item) => item.id === current) ? current : mapped[0].id));
      }
      setPage(1);

      setLastUpdated(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar las alertas.";
      const lowered = message.toLowerCase();

      if (lowered.includes("403") || lowered.includes("access") || lowered.includes("forbidden")) {
        setLoadError("Tu membresia actual no tiene permiso para consultar alertas en este entorno.");
      } else {
        setLoadError("No se pudieron cargar las alertas en este momento. Intenta nuevamente.");
      }

      setAlerts([]);
      setSelectedId("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refreshAlerts();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [refreshAlerts]);

  const symbolOptions = useMemo(() => {
    const symbols = Array.from(new Set(alerts.map((item) => item.symbol)));
    return ["all", ...symbols];
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      const matchesState = statusFilter === "all" ? true : item.lifecycleState === statusFilter;
      const matchesSymbol = symbolFilter === "all" ? true : item.symbol === symbolFilter;
      const matchesSearch =
        search.trim().length === 0
          ? true
          : `${item.symbol} ${item.market} ${item.strategyId} ${item.signalId} ${item.analysisId}`.toLowerCase().includes(search.toLowerCase());

      return matchesState && matchesSymbol && matchesSearch;
    });
  }, [alerts, search, statusFilter, symbolFilter]);

  const protagonist = useMemo(() => {
    if (filteredAlerts.length === 0) {
      return undefined;
    }

    return [...filteredAlerts].sort((a, b) => {
      if (a.canEnter !== b.canEnter) {
        return a.canEnter ? -1 : 1;
      }
      return a.minutesAgo - b.minutesAgo;
    })[0];
  }, [filteredAlerts]);

  const paginatedAlerts = useMemo(() => paginateAlerts(filteredAlerts, page, 8), [filteredAlerts, page]);

  const selectedAlert = useMemo(() => {
    const picked = filteredAlerts.find((item) => item.id === selectedId);
    return picked ?? protagonist;
  }, [filteredAlerts, protagonist, selectedId]);

  const summary = useMemo(() => {
    const canEnter = filteredAlerts.filter((item) => item.actionability === "can-enter").length;
    const waiting = filteredAlerts.filter((item) => item.lifecycleState === "CONDITIONAL").length;
    const noEnter = filteredAlerts.filter((item) => item.actionability === "closed").length;
    const avgConfidence =
      filteredAlerts.length === 0
        ? 0
        : Math.round(filteredAlerts.reduce((acc, item) => acc + item.confidence, 0) / filteredAlerts.length);

    return { canEnter, waiting, noEnter, avgConfidence };
  }, [filteredAlerts]);

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DataSourceBanner />
        <section className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0B0B0B] to-[#0E1622] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1">Sala en vivo</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">Modo premium</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Alertas en Vivo</h1>
          <p className="mt-2 max-w-3xl break-words text-sm text-white/70 sm:text-base">
            Señales comerciales con `signal_id`, `analysis_id`, estado real del lifecycle y niveles exactos de ejecución sin reconstrucciones ambiguas.
          </p>
          <p className="mt-2 text-xs text-white/55">
            {isLoading
              ? "Actualizando alertas..."
              : lastUpdated
                ? `Ultima actualizacion: ${lastUpdated}`
                : "Sin sincronizacion todavia."}
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

        <section className="border-y border-white/10 py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Historial oficial</p>
              <h2 className="mt-2 text-xl font-bold">Desempeño de alertas cerradas</h2>
            </div>
            <p className="text-xs text-white/55">Sin resultados monetarios de usuarios.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Activadas", globalResults?.alerts.activated ?? 0],
              ["TP", globalResults?.alerts.takeProfits ?? 0],
              ["SL", globalResults?.alerts.stopLosses ?? 0],
              ["Pips netos", globalResults?.alerts.netPips.toFixed(1) ?? "0.0"],
              ["Win rate", `${globalResults?.alerts.winRate.toFixed(1) ?? "0.0"}%`],
            ].map(([label, value]) => (
              <CARVIPIXCard key={String(label)} variant="statistics" padding="16" hover={false}>
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </CARVIPIXCard>
            ))}
          </div>
          {globalResults?.enabled && globalResults.simulation ? (
            <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/60">
              La simulación probabilística histórica usa los cierres oficiales solo como sustituciones observadas y nunca los duplica.
            </div>
          ) : null}
        </section>

        {protagonist ? (
          <section className="rounded-2xl border border-[#D4AF37]/35 bg-[#0A131F] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Alerta protagonista</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="break-words text-2xl font-bold sm:text-3xl">
                  {protagonist.symbol} · {protagonist.direction}
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  {protagonist.timestampLabel} · {protagonist.lifecycleLabel} · {protagonist.actionabilityLabel}
                </p>
                <p className="mt-2 break-all text-xs text-white/55">signal_id: {protagonist.signalId} · analysis_id: {protagonist.analysisId}</p>
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
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">strategy_id</p>
                <p className="mt-1 text-sm font-semibold text-white break-all">{protagonist.strategyId}</p>
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
          <section className="min-w-0 space-y-4">
            <AlertFilters
              search={search}
              selectedSymbol={symbolFilter}
              selectedStatus={statusFilter}
              symbolOptions={symbolOptions}
              isRefreshing={isLoading}
              onSearchChange={setSearch}
              onSymbolChange={setSymbolFilter}
              onStatusChange={setStatusFilter}
              onRefresh={() => {
                void refreshAlerts();
              }}
              onClear={() => {
                setSearch("");
                setSymbolFilter("all");
                setStatusFilter("all");
                setPage(1);
              }}
            />

            {loadError ? (
              <CARVIPIXCard variant="risk" padding="16" hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-red-100">{loadError}</p>
                  <CARVIPIXButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isLoading}
                    onClick={() => {
                      void refreshAlerts();
                    }}
                  >
                    Reintentar
                  </CARVIPIXButton>
                </div>
              </CARVIPIXCard>
            ) : null}

            <AlertsTable alerts={paginatedAlerts.items} selectedId={selectedId} onSelect={setSelectedId} />

            {filteredAlerts.length > 0 ? (
              <CARVIPIXCard variant="elevated" padding="16" hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/70">
                    Página {paginatedAlerts.page} de {paginatedAlerts.totalPages} · {filteredAlerts.length} alertas filtradas
                  </p>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <CARVIPIXButton type="button" variant="ghost" size="sm" fullWidth disabled={paginatedAlerts.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      Anterior
                    </CARVIPIXButton>
                    <CARVIPIXButton type="button" variant="secondary" size="sm" fullWidth disabled={paginatedAlerts.page >= paginatedAlerts.totalPages} onClick={() => setPage((current) => Math.min(paginatedAlerts.totalPages, current + 1))}>
                      Siguiente
                    </CARVIPIXButton>
                  </div>
                </div>
              </CARVIPIXCard>
            ) : null}
          </section>

          <AlertDetails alert={selectedAlert} />
        </div>
      </div>
    </main>
  );
}
