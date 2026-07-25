"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Gauge, ShieldCheck, Signal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AlertFilters from "./components/AlertFilters";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import { CARVIPIXButton, CARVIPIXCard } from "../design-system";
import DataSourceBanner from "@/app/components/DataSourceBanner";
import { useGlobalAlertsCenter } from "@/app/components/alerts/GlobalAlertsCenterProvider";
import {
  formatRelativeAgeLabel,
  formatLevel,
  getFreshnessTone,
  paginateAlerts,
  type StatusFilterValue,
} from "./alertas-view-model";

export default function AlertasPage() {
  const searchParams = useSearchParams();
  const {
    alerts,
    isLoading,
    loadError,
    markAlertViewed,
    lastSyncLabel,
  } = useGlobalAlertsCenter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const requestedAlertId = searchParams.get("alert");

  const handleSelectAlert = useCallback(
    (id: string) => {
      setSelectedId(id);
      markAlertViewed(id);
    },
    [markAlertViewed]
  );

  useEffect(() => {
    if (!requestedAlertId || !alerts.some((item) => item.id === requestedAlertId)) {
      return;
    }

    markAlertViewed(requestedAlertId);
  }, [alerts, markAlertViewed, requestedAlertId]);

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
          : `${item.symbol} ${item.market} ${item.direction} ${item.lifecycleLabel} ${item.actionabilityLabel}`
              .toLowerCase()
              .includes(search.toLowerCase());

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

  const activeSelectedId = useMemo(() => {
    if (selectedId && filteredAlerts.some((item) => item.id === selectedId)) {
      return selectedId;
    }

    if (requestedAlertId && filteredAlerts.some((item) => item.id === requestedAlertId)) {
      return requestedAlertId;
    }

    return filteredAlerts[0]?.id ?? "";
  }, [filteredAlerts, requestedAlertId, selectedId]);

  const selectedAlert = useMemo(() => {
    const picked = filteredAlerts.find((item) => item.id === activeSelectedId);
    return picked ?? protagonist;
  }, [activeSelectedId, filteredAlerts, protagonist]);

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
          <p className="mt-2 max-w-3xl text-sm text-white/70 sm:text-base">
            Oportunidades priorizadas con lectura inmediata para decidir en segundos.
          </p>
          <p className="mt-2 text-xs text-white/55">
            {isLoading
              ? "Actualizando alertas..."
              : lastSyncLabel
                ? `Ultima actualizacion: ${lastSyncLabel}`
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

        {protagonist ? (
          <section className="rounded-2xl border border-[#D4AF37]/35 bg-[#0A131F] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Alerta protagonista</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {protagonist.symbol} · {protagonist.direction}
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  {protagonist.timestampLabel} · {formatRelativeAgeLabel(protagonist.timestampMs)} · {protagonist.actionabilityLabel}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getFreshnessTone(protagonist.freshnessState).className}`}>
                {getFreshnessTone(protagonist.freshnessState).label}
              </span>
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
                onClick={() => handleSelectAlert(protagonist.id)}
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
                setPage(1);
              }}
              lastSyncLabel={lastSyncLabel}
            />

            {loadError ? (
              <CARVIPIXCard variant="risk" padding="16" hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-red-100">{loadError}</p>
                  <p className="text-xs text-red-200/80">La sincronizacion automatica seguira intentando en segundo plano.</p>
                </div>
              </CARVIPIXCard>
            ) : null}

            <AlertsTable alerts={paginatedAlerts.items} selectedId={activeSelectedId} onSelect={handleSelectAlert} />

            {filteredAlerts.length > 0 ? (
              <CARVIPIXCard variant="elevated" padding="16" hover={false}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/70">
                    Página {paginatedAlerts.page} de {paginatedAlerts.totalPages} · {filteredAlerts.length} alertas filtradas
                  </p>
                  <div className="flex gap-2">
                    <CARVIPIXButton type="button" variant="ghost" size="sm" disabled={paginatedAlerts.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      Anterior
                    </CARVIPIXButton>
                    <CARVIPIXButton type="button" variant="secondary" size="sm" disabled={paginatedAlerts.page >= paginatedAlerts.totalPages} onClick={() => setPage((current) => Math.min(paginatedAlerts.totalPages, current + 1))}>
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
