"use client";

import { useEffect, useState } from "react";
import { getBotInstances, getBotLicense, getOperations } from "@/app/lib/client-data-helpers";

type BotSummary = {
  status: string;
  gain: string;
  lastOperation: string;
  lastConnection: string;
  performance: string;
};

function formatDateTime(value: Date | string | number | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES");
}

export default function TraderBotPage() {
  const [loading, setLoading] = useState(true);
  const [licenseActive, setLicenseActive] = useState(false);
  const [summary, setSummary] = useState<BotSummary>({
    status: "Sin bot activo",
    gain: "0.00",
    lastOperation: "-",
    lastConnection: "-",
    performance: "0%",
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [license, instances, operations] = await Promise.all([
          getBotLicense(),
          getBotInstances().catch(() => []),
          getOperations(200).catch(() => []),
        ]);

        if (!active) {
          return;
        }

        setLicenseActive(Boolean(license?.active));

        const current = instances.find((item) => item.status === "running") ?? instances[0] ?? null;
        const botOperations = (operations ?? []).filter((item) => {
          if (!item.metadata || typeof item.metadata !== "object") {
            return false;
          }
          const source = String((item.metadata as Record<string, unknown>).module ?? "").toLowerCase();
          return source.includes("bot");
        });
        const latestOperation = botOperations[0] ?? null;

        if (!current) {
          setSummary({
            status: "Sin bot activo",
            gain: "0.00",
            lastOperation: "-",
            lastConnection: "-",
            performance: "0%",
          });
          return;
        }

        const gain = Number(current.stats.profitLoss ?? 0);
        setSummary({
          status: current.status === "running" ? "Activo" : current.status === "paused" ? "Pausado" : current.status,
          gain: `${gain >= 0 ? "+" : ""}${gain.toFixed(2)}`,
          lastOperation: latestOperation
            ? `${latestOperation.symbol} · ${latestOperation.side} · ${Number(latestOperation.pnl ?? 0).toFixed(2)}`
            : "Sin operaciones recientes",
          lastConnection: formatDateTime(current.startedAt ?? current.createdAt),
          performance: `${Number(current.stats.winRate ?? 0).toFixed(1)}% acierto`,
        });
      } catch {
        if (!active) {
          return;
        }
        setLicenseActive(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-white/70">Cargando estado del bot...</p>;
  }

  if (!licenseActive) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
        Este modulo aparece cuando tu membresia incluye Bot activo.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Bot</h1>
        <p className="text-sm text-white/70">Panel simple para revisar estado y desempeno en segundos.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Estado del Bot" value={summary.status} />
        <Card label="Ganancia" value={summary.gain} />
        <Card label="Ultima operacion" value={summary.lastOperation} />
        <Card label="Ultima conexion" value={summary.lastConnection} />
        <Card label="Rendimiento" value={summary.performance} />
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0D1624] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </article>
  );
}
