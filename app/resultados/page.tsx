"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download, TrendingUp } from "lucide-react";

const monthlyData = [
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
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B111A] to-[#05070B] px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Vista demo
              </span>
              <h1 className="mt-6 text-4xl font-bold text-[#D4AF37]">Resultados CARVIPIX</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">
                Resumen de rendimiento, operaciones cerradas y desempeño general de la comunidad.
              </p>
              <p className="mt-2 text-sm text-white/50">
                Los datos reales se conectarán en la fase de cuenta/API.
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 font-semibold text-black transition hover:bg-[#f5d76e]">
              <Download size={18} />
              Descargar reporte demo
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Laterales */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Ganancia mensual", value: "+18.4%", color: "text-green-400" },
            { label: "Win Rate", value: "72.4%", color: "text-blue-400" },
            { label: "Operaciones cerradas", value: "186", color: "text-white" },
            { label: "Drawdown máximo", value: "6.8%", color: "text-yellow-400" },
            { label: "Riesgo/Beneficio", value: "1.92", color: "text-[#D4AF37]" },
            { label: "Mejor activo del mes", value: "XAUUSD", color: "text-purple-400" },
          ].map((metric, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-[#0B111A] p-4">
              <p className="text-xs uppercase text-white/60">{metric.label}</p>
              <p className={`mt-3 text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica Grande */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="rounded-lg border border-white/10 bg-[#0B111A] p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Evolución de resultados</h2>
              <p className="mt-1 text-sm text-white/60">Vista previa con datos simulados.</p>
            </div>
            <TrendingUp className="text-[#D4AF37]" size={24} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid stroke="#1a2535" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: "#D4AF37", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secciones Inferiores */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top 10 Miembros */}
          <div className="rounded-lg border border-white/10 bg-[#0B111A] p-6">
            <h2 className="mb-6 text-2xl font-bold">Top 10 miembros</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="pb-3 font-semibold">#</th>
                    <th className="pb-3 font-semibold">Miembro</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Rendimiento</th>
                    <th className="pb-3 font-semibold">Ops</th>
                    <th className="pb-3 font-semibold">Racha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topMembers.map((member) => (
                    <tr key={member.pos} className="hover:bg-white/5">
                      <td className="py-3 font-bold text-[#D4AF37]">{member.pos}</td>
                      <td className="py-3">{member.name}</td>
                      <td className="py-3 text-xs text-white/70">{member.plan}</td>
                      <td className="py-3 font-semibold text-green-400">{member.perf}</td>
                      <td className="py-3 text-white/70">{member.ops}</td>
                      <td className="py-3 text-white/70">{member.streak}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Últimas Operaciones */}
          <div className="rounded-lg border border-white/10 bg-[#0B111A] p-6">
            <h2 className="mb-6 text-2xl font-bold">Últimas operaciones cerradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/60">
                  <tr>
                    <th className="pb-3 font-semibold">Fecha</th>
                    <th className="pb-3 font-semibold">Activo</th>
                    <th className="pb-3 font-semibold">Tipo</th>
                    <th className="pb-3 font-semibold">Resultado</th>
                    <th className="pb-3 font-semibold">Pips / %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTrades.map((trade, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="py-3 text-white/70">{trade.date}</td>
                      <td className="py-3 font-semibold">{trade.asset}</td>
                      <td className="py-3 text-white/70">{trade.type}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            trade.status === "success"
                              ? "bg-green-400/20 text-green-400"
                              : trade.status === "loss"
                                ? "bg-red-400/20 text-red-400"
                                : "bg-gray-400/20 text-gray-300"
                          }`}
                        >
                          {trade.result}
                        </span>
                      </td>
                      <td
                        className={`py-3 font-semibold ${
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
          </div>
        </div>
      </div>

      {/* Footer pequeño */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 text-center">
        <p className="text-xs text-white/40">
          Vista demo. Los datos reales se conectarán desde tu cuenta CARVIPIX cuando se integre la API.
        </p>
      </div>
    </main>
  );
}
