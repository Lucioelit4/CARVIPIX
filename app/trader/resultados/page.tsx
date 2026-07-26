"use client";

import { useEffect, useMemo, useState } from "react";
import { getOperations } from "@/app/lib/client-data-helpers";

type PeriodKey = "today" | "week" | "month" | "year" | "all";

type OperationRecord = {
  pnl: number;
  executedAt: number;
};

type PeriodSummary = {
  gain: number;
  operations: number;
  winRate: number;
};

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Ano" },
  { key: "all", label: "Historico" },
];

function startOfPeriod(period: PeriodKey): number {
  const now = new Date();
  if (period === "all") return 0;

  if (period === "today") {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  if (period === "week") {
    const date = new Date(now);
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return new Date(now.getFullYear(), 0, 1).getTime();
}

function summarize(records: OperationRecord[]): PeriodSummary {
  if (records.length === 0) {
    return { gain: 0, operations: 0, winRate: 0 };
  }

  const operations = records.length;
  const gain = records.reduce((acc, item) => acc + item.pnl, 0);
  const wins = records.filter((item) => item.pnl > 0).length;
  const winRate = operations > 0 ? (wins / operations) * 100 : 0;

  return {
    gain: Number(gain.toFixed(2)),
    operations,
    winRate: Number(winRate.toFixed(1)),
  };
}

export default function TraderResultadosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<OperationRecord[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const operations = await getOperations(800);

        if (!active) {
          return;
        }

        setRecords(
          (operations ?? []).map((item) => ({
            pnl: Number(item.pnl ?? 0),
            executedAt: new Date(item.executedAt).getTime(),
          }))
        );
      } catch {
        if (!active) {
          return;
        }
        setError("No fue posible cargar resultados en este momento.");
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

  const cards = useMemo(() => {
    return PERIODS.map((period) => {
      const start = startOfPeriod(period.key);
      const filtered = records.filter((item) => item.executedAt >= start);
      return { label: period.label, data: summarize(filtered) };
    });
  }, [records]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Resultados</h1>
        <p className="text-sm text-white/70">Entiende tu desempeno en segundos: ganancia, operaciones y acierto.</p>
      </div>

      {loading ? <p className="text-sm text-white/70">Cargando resultados...</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-[#0D1624] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">{card.label}</p>

              <div className="mt-3 grid gap-2">
                <Metric label="Ganancia" value={`${card.data.gain >= 0 ? "+" : ""}${card.data.gain.toFixed(2)}`} positive={card.data.gain >= 0} />
                <Metric label="Operaciones" value={String(card.data.operations)} />
                <Metric label="Acierto" value={`${card.data.winRate.toFixed(1)}%`} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const tone = positive === undefined ? "text-white" : positive ? "text-emerald-300" : "text-rose-300";

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">{label}</p>
      <p className={`text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
