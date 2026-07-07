"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, TrendingUp, Zap, Target, AlertCircle, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getResultsHistory, getPlatformResults } from "@/app/lib/client-data-helpers";
import type { PlatformResults, ResultsHistory } from "@/app/lib/modules/results/types";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, colors } from "@/app/design-system";

export default function ResultadosPage() {
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; value: number }>>([]);
  const [platformResults, setPlatformResults] = useState<PlatformResults | null>(null);

  // Load results data from modules on mount
  useEffect(() => {
    const loadResultsData = async () => {
      try {
        const [history, currentResults] = await Promise.all([getResultsHistory(12), getPlatformResults("monthly")]);

        setPlatformResults(currentResults);

        if (history && history.length > 0) {
          const transformedData = history.map((h: ResultsHistory, index: number) => {
            const monthName = (h.month ?? "").toString();
            const metricValue = Number(h.metrics?.alertas?.totalTrades ?? 0) + Number(h.metrics?.bot?.totalTrades ?? 0);

            return {
              month: monthName.substring(0, 3) || `${index + 1}`,
              value: metricValue,
            };
          });

          setMonthlyData(transformedData);
        }
      } catch {
        setMonthlyData([]);
        setPlatformResults(null);
      }
    };

    loadResultsData();
  }, []);

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] py-10 sm:py-12">
        <div className="cv-workspace max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CARVIPIXBadge variant="premium">Resultados</CARVIPIXBadge>
              <h1 className="mt-6 text-4xl font-bold text-[#D4AF37]">Resultados CARVIPIX</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Resumen de rendimiento, operaciones cerradas y desempeño general de la comunidad.
              </p>
            </div>
            <Link href="/soporte" style={{ display: 'inline-flex' }}>
              <CARVIPIXButton variant="premium" leftIcon={<Download size={18} />}>
                Solicitar reporte
              </CARVIPIXButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Métricas Horizontales */}
      <div className="cv-workspace max-w-7xl py-14 sm:py-16">
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Ganancia mensual",
              value: `${platformResults ? (platformResults.bySource.alertas.profitLoss >= 0 ? "+" : "") : ""}${platformResults ? platformResults.bySource.alertas.profitLoss.toFixed(2) : "0"}%`,
              color: "text-[#00D084]",
              icon: TrendingUp,
            },
            {
              label: "Win Rate",
              value: `${platformResults ? platformResults.bySource.alertas.winRate.toFixed(1) : "0"}%`,
              color: "text-[#D4AF37]",
              icon: Zap,
            },
            {
              label: "Operaciones cerradas",
              value: `${platformResults ? platformResults.bySource.alertas.totalTrades : "0"}`,
              color: "text-white",
              icon: Target,
            },
            { label: "Drawdown máximo", value: "0%", color: "text-[#D4AF37]", icon: AlertCircle },
            { label: "Riesgo/Beneficio", value: "0", color: "text-[#D4AF37]", icon: Scale },
            { label: "Mejor activo del mes", value: "Disponible al cerrar el primer ciclo", color: "text-white", icon: TrendingUp },
          ].map((metric, i) => {
            const IconComponent = metric.icon;
            return (
              <CARVIPIXCard key={i} variant="statistics" padding="16" hover={false}>
                <div className="absolute top-4 right-4 text-[#D4AF37]/40">
                  <IconComponent size={18} />
                </div>
                <p className="text-xs uppercase text-zinc-400 tracking-wider">{metric.label}</p>
                <p className={`mt-4 text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </CARVIPIXCard>
            );
          })}
        </div>
      </div>

      {/* Gráfica Grande - Ancho Completo */}
      <div className="cv-workspace max-w-7xl py-8">
        <CARVIPIXCard variant="info" padding="24" hover={false}>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Evolución de resultados</h2>
              <p className="mt-2 text-sm text-white/50">Serie consolidada de resultados.</p>
            </div>
            <TrendingUp className="text-[#D4AF37]" size={28} />
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 16, right: 32, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1a2535" strokeDasharray="0" />
                <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: colors.black.dark,
                    border: "1px solid #D4AF37/30",
                    borderRadius: "8px"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: "#D4AF37", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {monthlyData.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">Aún no hay cierres suficientes para construir esta serie. Se actualizará automáticamente con actividad real.</p>
          ) : null}
        </CARVIPIXCard>
      </div>

      {/* Secciones Inferiores - Dos Columnas */}
      <div className="cv-workspace max-w-7xl py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top 10 Miembros */}
          <CARVIPIXCard variant="info" padding="24" hover={false}>
            <h2 className="mb-8 text-2xl font-bold">Top 10 miembros</h2>
            <div className="overflow-x-auto">
              <table className="cv-readable-table w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/50">
                  <tr>
                    <th className="pb-4 font-semibold">#</th>
                    <th className="pb-4 font-semibold">Miembro</th>
                    <th className="pb-4 font-semibold">Plan</th>
                    <th className="pb-4 font-semibold">Rendimiento</th>
                    <th className="pb-4 font-semibold">Ops</th>
                    <th className="pb-4 font-semibold">Racha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition">
                    <td className="py-3.5 text-white/65" colSpan={6}>El ranking aparecerá cuando se consoliden resultados verificables de miembros.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>

          {/* Últimas Operaciones */}
          <CARVIPIXCard variant="info" padding="24" hover={false}>
            <h2 className="mb-8 text-2xl font-bold">Últimas operaciones cerradas</h2>
            <div className="overflow-x-auto">
              <table className="cv-readable-table w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/50">
                  <tr>
                    <th className="pb-4 font-semibold">Fecha</th>
                    <th className="pb-4 font-semibold">Activo</th>
                    <th className="pb-4 font-semibold">Tipo</th>
                    <th className="pb-4 font-semibold">Resultado</th>
                    <th className="pb-4 font-semibold">Pips / %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition">
                    <td className="py-3.5 text-white/65" colSpan={5}>Cuando se registren cierres operativos, verás aquí el historial con detalle.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </div>
      </div>

      {/* Footer pequeño */}
      <div className="cv-workspace mt-8 border-t border-white/5 py-16 text-center">
        <p className="text-xs text-white/40">
          Datos cargados desde servicios de plataforma.
        </p>
      </div>
    </main>
  );
}
