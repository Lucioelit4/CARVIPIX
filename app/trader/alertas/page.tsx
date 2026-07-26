"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useGlobalAlertsCenter } from "@/app/components/alerts/GlobalAlertsCenterProvider";
import { formatRelativeAgeLabel, getFreshnessTone, getOutcomeTone } from "@/app/alertas/alertas-view-model";

export default function TraderAlertasPage() {
  const searchParams = useSearchParams();
  const { alerts, unreadIds, markAlertViewed, viewAlertFromAnywhere } = useGlobalAlertsCenter();

  const selectedId = searchParams.get("alert") ?? "";

  useEffect(() => {
    if (selectedId) {
      markAlertViewed(selectedId);
    }
  }, [selectedId, markAlertViewed]);

  const dominantAlert = useMemo(() => {
    return alerts.find((item) => item.canEnter) ?? alerts[0] ?? null;
  }, [alerts]);

  const historyAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const unreadA = unreadIds.includes(a.id) ? 0 : 1;
      const unreadB = unreadIds.includes(b.id) ? 0 : 1;
      if (unreadA !== unreadB) {
        return unreadA - unreadB;
      }
      return a.timestampMs < b.timestampMs ? 1 : -1;
    });
  }, [alerts, unreadIds]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Alertas</h1>
      <p className="text-sm text-white/70">La alerta dominante siempre aparece primero. Historial limpio debajo.</p>

      {dominantAlert ? (
        <article className="rounded-xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#121212] to-[#0F1C2E] p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF37]">Alerta activa dominante</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold sm:text-3xl">
                {dominantAlert.symbol} · {dominantAlert.direction}
              </p>
              <p className="text-xs text-white/65">
                Emitida {formatRelativeAgeLabel(dominantAlert.timestampMs)} · Vigencia {dominantAlert.validUntilLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => viewAlertFromAnywhere(dominantAlert.id)}
              className="w-full rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-4 py-3 text-sm font-bold text-black sm:w-auto"
            >
              Ver ahora
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="border-white/20 bg-white/10 text-white/80">Hora: {dominantAlert.timestampLabel}</Badge>
            <Badge tone="border-white/20 bg-white/10 text-white/80">{formatRelativeAgeLabel(dominantAlert.timestampMs)}</Badge>
            <Badge tone={getOutcomeTone(dominantAlert.lifecycleState).className}>
              {getOutcomeTone(dominantAlert.lifecycleState).label}
            </Badge>
            <Badge tone={getFreshnessTone(dominantAlert.freshnessState).className}>
              {getFreshnessTone(dominantAlert.freshnessState).label}
            </Badge>
            <Badge tone="border-white/20 bg-white/10 text-white/80">{dominantAlert.validUntilLabel}</Badge>
          </div>
        </article>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          No hay alertas disponibles en este momento.
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Historial</h2>
        {historyAlerts.map((alert) => {
          const isNew = unreadIds.includes(alert.id);
          const highlighted = selectedId === alert.id;
          const freshness = getFreshnessTone(alert.freshnessState);
          const outcome = getOutcomeTone(alert.lifecycleState);

          return (
            <article
              key={alert.id}
              className={`rounded-xl border p-3 ${
                highlighted ? "border-[#D4AF37]/45 bg-[#142133]" : "border-white/10 bg-[#0D1624]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{alert.symbol} · {alert.direction}</p>
                  <p className="text-xs text-white/65">Hora: {alert.timestampLabel}</p>
                  <p className="text-xs text-white/65">{formatRelativeAgeLabel(alert.timestampMs)}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                    isNew ? "border-rose-300/50 bg-rose-500/20 text-rose-100" : "border-white/20 bg-white/10 text-white/75"
                  }`}
                >
                  {isNew ? "Nueva" : "Vista"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="border-white/20 bg-white/10 text-white/80">Estado: {alert.lifecycleLabel}</Badge>
                <Badge tone={outcome.className}>{outcome.label}</Badge>
                <Badge tone={freshness.className}>{freshness.label}</Badge>
                <Badge tone="border-white/20 bg-white/10 text-white/80">{alert.validUntilLabel}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => viewAlertFromAnywhere(alert.id)}
                  className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black"
                >
                  Ver ahora
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${tone}`}>{children}</span>;
}
