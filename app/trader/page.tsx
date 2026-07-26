"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGlobalAlertsCenter } from "@/app/components/alerts/GlobalAlertsCenterProvider";
import { getBotInstances, getCurrentMembership, getOperations } from "@/app/lib/client-data-helpers";
import { formatRelativeAgeLabel, getFreshnessTone } from "@/app/alertas/alertas-view-model";

type TraderSnapshot = {
  membership: string;
  membershipState: string;
  botState: string;
  resultsToday: string;
};

const DEFAULT_PROMO_KEY = "carvipix-trader-promo-dismissed-v1";

export default function TraderHomePage() {
  const { alerts, viewAlertFromAnywhere } = useGlobalAlertsCenter();
  const [snapshot, setSnapshot] = useState<TraderSnapshot>({
    membership: "Cargando...",
    membershipState: "-",
    botState: "Sin bot activo",
    resultsToday: "0",
  });
  const [promoDismissed, setPromoDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(DEFAULT_PROMO_KEY) === "1";
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [membership, botInstances] = await Promise.all([
          getCurrentMembership(),
          getBotInstances().catch(() => []),
        ]);

        const operations = await getOperations(200).catch(() => []);

        if (!active) {
          return;
        }

        const runningBot = Array.isArray(botInstances) ? botInstances.find((item) => item.status === "running") : undefined;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayProfit = (Array.isArray(operations) ? operations : [])
          .filter((item) => new Date(item.executedAt).getTime() >= todayStart.getTime())
          .reduce((acc, item) => acc + Number(item.pnl ?? 0), 0);

        setSnapshot({
          membership: String(membership?.plan ?? "sin membresia").toUpperCase(),
          membershipState: String(membership?.estado ?? "inactivo"),
          botState: runningBot ? `Activo en ${runningBot.symbol}` : "Sin bot activo",
          resultsToday: `${todayProfit >= 0 ? "+" : ""}${todayProfit.toFixed(2)}`,
        });
      } catch {
        if (!active) {
          return;
        }
        setSnapshot({
          membership: "SIN MEMBRESIA",
          membershipState: "inactivo",
          botState: "Sin bot activo",
          resultsToday: "0",
        });
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const dominantAlert = useMemo(() => {
    return alerts.find((item) => item.canEnter) ?? alerts[0] ?? null;
  }, [alerts]);

  const alertFreshness = dominantAlert ? getFreshnessTone(dominantAlert.freshnessState) : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#121212] via-[#101520] to-[#0C1A2A] p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">Alerta activa</p>

        {dominantAlert ? (
          <div className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-black/35 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-white sm:text-3xl">
                  {dominantAlert.symbol} · {dominantAlert.direction}
                </p>
                <p className="mt-2 text-xs text-white/80">Hora: {dominantAlert.timestampLabel}</p>
                <p className="mt-1 text-xs text-white/80">Tiempo transcurrido: {formatRelativeAgeLabel(dominantAlert.timestampMs)}</p>
                <p className="mt-1 text-xs text-white/80">Estado: {dominantAlert.lifecycleLabel}</p>
                <p className="mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold text-white/90">
                  <span className={alertFreshness?.className ? `rounded-full px-1.5 py-0.5 ${alertFreshness.className}` : ""}>
                    Vigencia: {alertFreshness?.label ?? dominantAlert.validUntilLabel}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => viewAlertFromAnywhere(dominantAlert.id)}
                className="w-full rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-4 py-3 text-base font-bold text-black sm:w-auto"
              >
                Ver ahora
              </button>
            </div>

          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Esperando alertas nuevas. En cuanto llegue una senal aparecera aqui.
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Membresia" value={snapshot.membership} note={snapshot.membershipState} />
        <StatCard label="Resultados del dia" value={snapshot.resultsToday} />
        <StatCard label="Estado del bot" value={snapshot.botState} />
      </section>

      {!promoDismissed ? (
        <section className="rounded-xl border border-white/15 bg-[#0D1624] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">Promocion relevante</p>
              <p className="mt-1 text-sm text-white">Activa tu plan superior y recibe prioridad de alertas y beneficios ampliados.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/trader/membresia" className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black">
                Ver plan
              </Link>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem(DEFAULT_PROMO_KEY, "1");
                  setPromoDismissed(true);
                }}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80"
              >
                Cerrar
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0E1522] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
      {note ? <p className="mt-1 text-xs text-white/65">{note}</p> : null}
    </article>
  );
}
