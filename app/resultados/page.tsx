"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, TrendingUp, Zap, Target, AlertCircle, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getResultsHistory, getPlatformResults } from "@/app/lib/data-helpers";
import type { PlatformResults, ResultsHistory } from "@/app/lib/modules/results/types";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, colors } from "@/app/design-system";

// Default demo data (fallback)
const defaultMonthlyData = [
  { month: "Ene", value: 100 },
  { month: "Feb", value: 108 },
  { month: "Mar", value: 118 },
  { month: "Abr", value: 124 },
  { month: "May", value: 135 },
  { month: "Jun", value: 145 },
  { month: "Jul", value: 152 },
  { month: "Ago", value: 158 },
  { month: "Sep", value: 168 },
  { month: "Oct", value: 175 },
  { month: "Nov", value: 182 },
  { month: "Dic", value: 194 },
];

const topMembers = [
  { pos: 1, name: "Lucio", plan: "PRO", perf: "+48%", ops: 342, streak: 12 },
  { pos: 2, name: "María", plan: "PRO", perf: "+41%", ops: 289, streak: 8 },
  { pos: 3, name: "Andrés", plan: "ELITE", perf: "+37%", ops: 267, streak: 6 },
  { pos: 4, name: "Camila", plan: "PRO", perf: "+33%", ops: 245, streak: 5 },
  { pos: 5, name: "Diego", plan: "LITE", perf: "+29%", ops: 198, streak: 9 },
  { pos: 6, name: "Sofía", plan: "PRO", perf: "+26%", ops: 176, streak: 4 },
  { pos: 7, name: "Pablo", plan: "ELITE", perf: "+22%", ops: 154, streak: 7 },
  { pos: 8, name: "Laura", plan: "LITE", perf: "+18%", ops: 132, streak: 3 },
  { pos: 9, name: "Mario", plan: "PRO", perf: "+15%", ops: 118, streak: 5 },
  { pos: 10, name: "Ana", plan: "LITE", perf: "+12%", ops: 94, streak: 2 },
];

const recentTrades = [
  { date: "01 Dic", asset: "XAUUSD", type: "Compra", result: "Ganada", value: "+68 pips", status: "success" },
  { date: "30 Nov", asset: "BTCUSD", type: "Venta", result: "Perdida", value: "-420 pts", status: "loss" },
  { date: "29 Nov", asset: "EURUSD", type: "Venta", result: "Ganada", value: "+22 pips", status: "success" },
  { date: "28 Nov", asset: "GBPUSD", type: "Compra", result: "Break Even", value: "0 pips", status: "neutral" },
  { date: "27 Nov", asset: "USDJPY", type: "Compra", result: "Ganada", value: "+145 pips", status: "success" },
];

export default function ResultadosPage() {
  const [monthlyData, setMonthlyData] = useState(defaultMonthlyData);
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
        console.log("Usando datos demo de resultados");
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
              <CARVIPIXBadge variant="premium">Vista demo</CARVIPIXBadge>
              <h1 className="mt-6 text-4xl font-bold text-[#D4AF37]">Resultados CARVIPIX</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Resumen de rendimiento, operaciones cerradas y desempeño general de la comunidad.
              </p>
              <p className="mt-2 text-sm text-white/50">
                Los datos reales se conectarán en la fase de cuenta/API.
              </p>
            </div>
            <Link href="/soporte" style={{ display: 'inline-flex' }}>
              <CARVIPIXButton variant="premium" leftIcon={<Download size={18} />}>
                Solicitar reporte demo
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
              value: `${platformResults ? (platformResults.bySource.alertas.profitLoss >= 0 ? "+" : "") : "+"}${platformResults ? platformResults.bySource.alertas.profitLoss.toFixed(2) : "18.4"}`,
              color: "text-[#00D084]",
              icon: TrendingUp,
            },
            {
              label: "Win Rate",
              value: `${platformResults ? platformResults.bySource.alertas.winRate.toFixed(1) : "72.4"}%`,
              color: "text-[#D4AF37]",
              icon: Zap,
            },
            {
              label: "Operaciones cerradas",
              value: `${platformResults ? platformResults.bySource.alertas.totalTrades : "186"}`,
              color: "text-white",
              icon: Target,
            },
            { label: "Drawdown máximo", value: "6.8%", color: "text-[#D4AF37]", icon: AlertCircle },
            { label: "Riesgo/Beneficio", value: "1.92", color: "text-[#D4AF37]", icon: Scale },
            { label: "Mejor activo del mes", value: "XAUUSD", color: "text-white", icon: TrendingUp },
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
              <p className="mt-2 text-sm text-white/50">Vista previa con datos simulados.</p>
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
                  {topMembers.map((member) => (
                    <tr key={member.pos} className="hover:bg-white/5 transition">
                      <td className="py-3.5 font-bold text-[#D4AF37]">{member.pos}</td>
                      <td className="py-3.5 font-medium">{member.name}</td>
                      <td className="py-3.5 text-xs font-medium text-white/60">{member.plan}</td>
                      <td className="py-3.5 font-semibold text-green-400">{member.perf}</td>
                      <td className="py-3.5 text-white/70">{member.ops}</td>
                      <td className="py-3.5 text-white/70">{member.streak}d</td>
                    </tr>
                  ))}
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
                  {recentTrades.map((trade, i) => (
                    <tr key={i} className="hover:bg-white/5 transition">
                      <td className="py-3.5 text-white/70">{trade.date}</td>
                      <td className="py-3.5 font-medium">{trade.asset}</td>
                      <td className="py-3.5 text-white/70">{trade.type}</td>
                      <td className="py-3.5">
                        <span style={{ display: 'inline-flex' }}>
                          <CARVIPIXBadge
                            variant={trade.status === "success" ? "success" : trade.status === "loss" ? "danger" : "default"}
                          >
                          {trade.result}
                          </CARVIPIXBadge>
                        </span>
                      </td>
                      <td
                        className={`py-3.5 font-semibold ${
                          trade.status === "success"
                            ? "text-green-400"
                            : trade.status === "loss"
                              ? "text-red-400"
                              : "text-gray-300"
                        }`}
                      >
                        {trade.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </div>
      </div>

      {/* Footer pequeño */}
      <div className="cv-workspace mt-8 border-t border-white/5 py-16 text-center">
        <p className="text-xs text-white/40">
          Vista demo. Los datos reales se conectarán desde tu cuenta CARVIPIX cuando se integre la API.
        </p>
      </div>
    </main>
  );
}
