"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, TrendingUp, Zap, Target, AlertCircle, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getGlobalResults, getResultsHistory, getPlatformResults, type GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";
import type { PlatformResults, ResultsHistory } from "@/app/lib/modules/results/types";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, colors } from "@/app/design-system";
import DataSourceBanner from "@/app/components/DataSourceBanner";

export default function ResultadosPage() {
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; value: number }>>([]);
  const [platformResults, setPlatformResults] = useState<PlatformResults | null>(null);
  const [globalResults, setGlobalResults] = useState<GlobalResultsSnapshot | null>(null);
  const featuredSimulationProfile = globalResults?.profiles.featured[0];

  // Load results data from modules on mount
  useEffect(() => {
    const loadResultsData = async () => {
      try {
        const [history, currentResults, centralResults] = await Promise.all([
          getResultsHistory(12),
          getPlatformResults("monthly"),
          getGlobalResults(),
        ]);

        setPlatformResults(currentResults);
        setGlobalResults(centralResults);

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
        setGlobalResults(null);
      }
    };

    loadResultsData();
  }, []);

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="cv-workspace max-w-7xl pt-6">
        <DataSourceBanner />
      </div>
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] py-10 sm:py-12">
        <div className="cv-workspace max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CARVIPIXBadge variant="premium">Resultados</CARVIPIXBadge>
              <h1 className="mt-6 break-words text-4xl font-bold text-[#D4AF37]">Resultados CARVIPIX</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Resultados verificables de alertas oficiales y simulaciones históricas identificadas por separado.
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Pips del mes",
              value: `${globalResults?.alerts.monthlyPips && globalResults.alerts.monthlyPips > 0 ? "+" : ""}${globalResults?.alerts.monthlyPips.toFixed(1) ?? "0.0"}`,
              color: "text-[#00D084]",
              icon: TrendingUp,
            },
            {
              label: "Win Rate",
              value: `${globalResults?.alerts.winRate.toFixed(1) ?? "0.0"}%`,
              color: "text-[#D4AF37]",
              icon: Zap,
            },
            {
              label: "Operaciones cerradas",
              value: `${globalResults?.alerts.activated ?? platformResults?.bySource.alertas.totalTrades ?? 0}`,
              color: "text-white",
              icon: Target,
            },
            { label: "Take profits", value: `${globalResults?.alerts.takeProfits ?? 0}`, color: "text-[#00D084]", icon: AlertCircle },
            { label: "Riesgo/Beneficio", value: globalResults?.alerts.averageRiskReward.toFixed(2) ?? "0.00", color: "text-[#D4AF37]", icon: Scale },
            { label: "Stop losses", value: `${globalResults?.alerts.stopLosses ?? 0}`, color: "text-white", icon: TrendingUp },
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
          <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="break-words pr-2 text-2xl font-bold">Evolución de resultados</h2>
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
          {/* Probabilistic simulation profiles */}
          <CARVIPIXCard variant="info" padding="24" hover={false}>
            <h2 className="text-2xl font-bold">Resultados probabilísticos históricos</h2>
            <p className="mb-8 mt-2 text-sm text-white/55">
              Escenarios calculados mediante probabilidades, condiciones históricas del mercado y reglas operativas de CARVIPIX.
            </p>
            <div className="cv-table-wrap">
              <table className="cv-readable-table cv-mobile-table w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/50">
                  <tr>
                    <th className="pb-4 font-semibold">#</th>
                    <th className="pb-4 font-semibold">Perfil</th>
                    <th className="pb-4 font-semibold">Riesgo</th>
                    <th className="pb-4 font-semibold">Balance simulado</th>
                    <th className="pb-4 font-semibold">Ops</th>
                    <th className="pb-4 font-semibold">Drawdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {globalResults?.enabled && globalResults.simulation && globalResults.profiles.featured.length > 0 ? (
                    globalResults.profiles.featured.map((profile, index) => (
                      <tr key={profile.profileId} className="hover:bg-white/5 transition">
                        <td data-label="#" className="py-3.5 text-white/65">{index + 1}</td>
                        <td data-label="Perfil" className="py-3.5 font-medium">{profile.displayName}</td>
                        <td data-label="Riesgo" className="py-3.5 text-white/65">{profile.riskType}</td>
                        <td data-label="Balance simulado" className="py-3.5">${profile.currentBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        <td data-label="Ops" className="py-3.5">{profile.operationsApplied}</td>
                        <td data-label="Drawdown" className="py-3.5">{profile.maxDrawdownPct.toFixed(2)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-white/5 transition">
                      <td data-label="Estado" className="py-3.5 text-white/65" colSpan={6}>La simulación probabilística está desactivada. Las métricas oficiales continúan disponibles por separado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>

          {/* Últimas Operaciones */}
          <CARVIPIXCard variant="info" padding="24" hover={false}>
            <h2 className="mb-8 text-2xl font-bold">Últimas operaciones cerradas</h2>
            <div className="cv-table-wrap">
              <table className="cv-readable-table cv-mobile-table w-full text-left text-sm">
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
                    <td data-label="Estado" className="py-3.5 text-white/65" colSpan={5}>Cuando se registren cierres operativos, verás aquí el historial con detalle.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </div>
      </div>

      {featuredSimulationProfile?.equityCurve.length ? (
        <div className="cv-workspace max-w-7xl py-8">
          <CARVIPIXCard variant="info" padding="24" hover={false}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Curva de balance simulada</h2>
              <p className="mt-2 text-sm text-white/55">
                {featuredSimulationProfile.displayName} · {featuredSimulationProfile.simulatedComponentPct.toFixed(1)}% modelado · {featuredSimulationProfile.observedComponentPct.toFixed(1)}% observado
              </p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={featuredSimulationProfile.equityCurve} margin={{ top: 16, right: 32, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2535" />
                  <XAxis dataKey="occurredAt" tickFormatter={(value: string) => new Date(value).toLocaleDateString("es-MX", { month: "short" })} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: colors.black.dark, border: "1px solid #D4AF37", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="balance" stroke="#D4AF37" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CARVIPIXCard>
        </div>
      ) : null}

      {/* Footer pequeño */}
      <div className="cv-workspace mt-8 border-t border-white/5 py-16 text-center">
        <p className="text-xs text-white/40">
          Resultados simulados. No corresponden a operaciones ejecutadas ni garantizan resultados futuros.
        </p>
      </div>
    </main>
  );
}
