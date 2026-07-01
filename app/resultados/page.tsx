"use client";

import BackToDashboard from "../components/BackToDashboard";
import { ArrowUpRight, Trophy } from "lucide-react";

export default function ResultadosPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Resultados
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Performance y métricas</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Resumen visual de resultados de trading con datos de vista previa bien etiquetados.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Estado</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">Demo</p>
            <p className="mt-1 text-sm text-zinc-500">Datos simulados para diseño y navegación.</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <p>Ganancia mensual</p>
              <span className="rounded-full bg-white/5 px-3 py-1 text-[#D4AF37]">Demo</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-[#D4AF37]">+18.4%</p>
            <p className="mt-3 text-sm text-zinc-500">Cifras basadas en perspectiva.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <p>Trades ganadores</p>
              <span className="text-sm text-green-400">Realista</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-white">72</p>
            <p className="mt-3 text-sm text-zinc-500">Operaciones con mejor ejecución.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <p>Riesgo / Beneficio</p>
              <Trophy size={18} className="text-[#D4AF37]" />
            </div>
            <p className="mt-6 text-4xl font-bold text-[#D4AF37]">1.92</p>
            <p className="mt-3 text-sm text-zinc-500">Estándar de calidad CARVIPIX.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Resumen de performance</h2>
                <p className="mt-2 text-sm text-zinc-400">Tendencia histórica de resultados con vista previa de métricas.</p>
              </div>
              <ArrowUpRight size={20} className="text-[#D4AF37]" />
            </div>
            <div className="space-y-4 rounded-3xl border border-white/5 bg-black/20 p-5">
              <div className="flex items-center justify-between text-sm text-zinc-300">
                <span>Balance histórico</span>
                <span className="font-semibold text-white">+46%</span>
              </div>
              <div className="h-64 rounded-3xl bg-gradient-to-b from-[#0B1220] to-[#05070B] p-4">
                <p className="pt-24 text-center text-sm text-zinc-500">Gráfico simulado</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-bold">Exportar resultados</h2>
            <p className="mt-3 text-sm text-zinc-400">Funcionalidad disponible cuando se conecte la cuenta real de seguimiento.</p>
            <div className="mt-6 space-y-4">
              <button className="w-full rounded-full bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F5D76E]">
                Descargar reporte demo
              </button>
              <div className="rounded-3xl border border-white/10 bg-[#070A0F]/80 p-4 text-sm text-zinc-300">
                Esta vista está configurada para la fase de diseño. Cuando haya API en back-end, se mostrará el reporte real.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
