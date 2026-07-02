"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Download } from "lucide-react";

const growthData = [
  { date: "Jan", value: 100 },
  { date: "Feb", value: 108 },
  { date: "Mar", value: 115 },
  { date: "Apr", value: 123 },
  { date: "May", value: 129 },
  { date: "Jun", value: 136 },
  { date: "Jul", value: 144 },
  { date: "Aug", value: 151 },
  { date: "Sep", value: 157 },
  { date: "Oct", value: 162 },
  { date: "Nov", value: 168 },
  { date: "Dec", value: 176 },
];

const topMembers = [
  { pos: 1, name: "Lucio", plan: "ELITE", perf: "+32.8%", ops: 42, streak: "+8" },
  { pos: 2, name: "María", plan: "PRO", perf: "+28.1%", ops: 38, streak: "+6" },
  { pos: 3, name: "Andrés", plan: "PRO", perf: "+24.5%", ops: 33, streak: "+5" },
  { pos: 4, name: "Camila", plan: "PRO", perf: "+19.4%", ops: 29, streak: "+3" },
  { pos: 5, name: "Diego", plan: "BASIC", perf: "+16.2%", ops: 26, streak: "+2" },
  { pos: 6, name: "Sofia", plan: "PRO", perf: "+15.1%", ops: 24, streak: "+1" },
  { pos: 7, name: "Pablo", plan: "BASIC", perf: "+13.8%", ops: 21, streak: "-1" },
  { pos: 8, name: "Laura", plan: "PRO", perf: "+12.6%", ops: 19, streak: "+2" },
  { pos: 9, name: "Mario", plan: "BASIC", perf: "+11.3%", ops: 17, streak: "-2" },
  { pos: 10, name: "Eva", plan: "PRO", perf: "+10.2%", ops: 15, streak: "+1" },
];

const recentTrades = [
  { date: "2026-06-30", activo: "XAUUSD", tipo: "Compra", resultado: "Ganada", value: "+68 pips" },
  { date: "2026-06-29", activo: "BTCUSD", tipo: "Venta", resultado: "Perdida", value: "-420 pts" },
  { date: "2026-06-28", activo: "EURUSD", tipo: "Venta", resultado: "Ganada", value: "+22 pips" },
  { date: "2026-06-27", activo: "GBPUSD", tipo: "Compra", resultado: "Break Even", value: "0 pips" },
  { date: "2026-06-26", activo: "XAUUSD", tipo: "Venta", resultado: "Ganada", value: "+34 pips" },
];

export default function ResultadosPage() {
  const [reportStatus, setReportStatus] = useState("");

  const downloadReport = () => {
    setReportStatus("preparing");
    setTimeout(() => setReportStatus("ready"), 900);
    setTimeout(() => setReportStatus(""), 3500);
  };

  return (
    <main className="min-h-screen bg-[#05070B] text-white px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <section className="mb-8 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#06070B] to-[#0E1118] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold">Resultados CARVIPIX</h1>
                <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">Vista demo</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300 max-w-2xl">Resumen de rendimiento, operaciones cerradas y desempeño general de la comunidad.</p>
              <p className="mt-2 text-xs text-zinc-400">Los datos reales se conectarán en la fase de cuenta/API.</p>
            </div>
            <div className="mt-3 md:mt-0">
              <button
                onClick={downloadReport}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-black shadow-sm"
              >
                <Download size={16} /> Descargar reporte demo
              </button>
              {reportStatus === "preparing" ? (
                <span className="ml-3 text-sm text-zinc-300">Preparando reporte...</span>
              ) : reportStatus === "ready" ? (
                <span className="ml-3 text-sm text-green-300">Reporte demo preparado</span>
              ) : null}
            </div>
          </div>
        </section>

        {/* Cards + Chart */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Ganancia mensual</p>
                <p className="mt-1 text-lg font-semibold text-white">+18.4%</p>
                <p className="mt-1 text-xs text-zinc-400">Cambio neto respecto mes anterior</p>
              </div>
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Win Rate</p>
                <p className="mt-1 text-lg font-semibold text-white">72.4%</p>
                <p className="mt-1 text-xs text-zinc-400">% de operaciones ganadas</p>
              </div>
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Operaciones cerradas</p>
                <p className="mt-1 text-lg font-semibold text-white">186</p>
                <p className="mt-1 text-xs text-zinc-400">Total en periodo mostrado</p>
              </div>
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Drawdown máximo</p>
                <p className="mt-1 text-lg font-semibold text-white">6.8%</p>
                <p className="mt-1 text-xs text-zinc-400">Retroceso máximo observado</p>
              </div>
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Riesgo/Beneficio</p>
                <p className="mt-1 text-lg font-semibold text-white">1.92</p>
                <p className="mt-1 text-xs text-zinc-400">Ratio promedio riesgo/beneficio</p>
              </div>
              <div className="rounded-2xl bg-[#0B111A]/90 p-3">
                <p className="text-[10px] uppercase text-zinc-500">Mejor activo del mes</p>
                <p className="mt-1 text-lg font-semibold text-white">XAUUSD</p>
                <p className="mt-1 text-xs text-zinc-400">Activo con mejor rendimiento</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-[#0B111A]/90 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evolución de resultados</h3>
              <p className="text-xs text-zinc-400">Vista previa con datos simulados.</p>
            </div>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#0A0F16" />
                  <XAxis dataKey="date" tick={{ fill: "#9CA3AF" }} />
                  <YAxis tick={{ fill: "#9CA3AF" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Top members + recent trades */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-[#0B111A]/90 p-4">
            <h3 className="text-lg font-semibold mb-3">Top 10 miembros</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="text-xs text-zinc-400">
                    <th className="py-2">Posición</th>
                    <th>Miembro</th>
                    <th>Plan</th>
                    <th>Rendimiento</th>
                    <th>Operaciones</th>
                    <th>Racha</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {topMembers.map((m) => (
                    <tr key={m.pos} className={`border-t border-white/5 ${m.pos <= 3 ? "bg-gradient-to-r from-[#2b220d]/10 to-transparent" : ""}`}>
                      <td className={`py-2 ${m.pos === 1 ? "text-[#D4AF37] font-semibold" : ""}`}>{m.pos}</td>
                      <td className="py-2">{m.name}</td>
                      <td className="py-2">{m.plan}</td>
                      <td className="py-2">{m.perf}</td>
                      <td className="py-2">{m.ops}</td>
                      <td className="py-2">{m.streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0B111A]/90 p-4">
            <h3 className="text-lg font-semibold mb-3">Últimas operaciones cerradas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto text-sm">
                <thead className="text-xs text-zinc-400">
                  <tr>
                    <th className="py-2">Fecha</th>
                    <th>Activo</th>
                    <th>Tipo</th>
                    <th>Resultado</th>
                    <th>Pips / %</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-2 text-xs text-zinc-300">{t.date}</td>
                      <td className="py-2">{t.activo}</td>
                      <td className="py-2">{t.tipo}</td>
                      <td className={`py-2 font-semibold ${t.resultado === "Ganada" ? "text-green-400" : t.resultado === "Perdida" ? "text-red-400" : "text-zinc-300"}`}>{t.resultado}</td>
                      <td className="py-2">{t.value}</td>
                      <td className="py-2 text-xs text-zinc-400">{t.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quick guide removed per request */}
      </div>
    </main>
  );
}
