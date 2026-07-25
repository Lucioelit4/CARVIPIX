"use client";

import { BellRing, X } from "lucide-react";
import { useGlobalAlertsCenter } from "./GlobalAlertsCenterProvider";
import { formatRelativeAgeLabel, getFreshnessTone } from "@/app/alertas/alertas-view-model";

export default function GlobalAlertsToast() {
  const { toastAlert, dismissToast, viewAlertFromAnywhere } = useGlobalAlertsCenter();

  if (!toastAlert) {
    return null;
  }

  const freshness = getFreshnessTone(toastAlert.freshnessState);

  return (
    <div className="pointer-events-none fixed right-4 top-[86px] z-[80] w-[min(92vw,420px)] lg:top-6">
      <div className="pointer-events-auto rounded-2xl border border-[#D4AF37]/45 bg-[#0B1320]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              <BellRing size={14} /> Nueva alerta disponible
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {toastAlert.symbol} · {toastAlert.direction}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {formatRelativeAgeLabel(toastAlert.timestampMs)} · {freshness.label}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="rounded-full border border-white/15 p-1.5 text-white/70 transition hover:border-white/35 hover:text-white"
            aria-label="Cerrar notificacion"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismissToast}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/35 hover:text-white"
          >
            Mas tarde
          </button>
          <button
            type="button"
            onClick={() => viewAlertFromAnywhere(toastAlert.id)}
            className="rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black transition hover:brightness-105"
          >
            Ver ahora
          </button>
        </div>
      </div>
    </div>
  );
}
