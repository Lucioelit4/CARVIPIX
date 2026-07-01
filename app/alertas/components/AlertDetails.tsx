"use client";

import TradingViewChart from "./TradingViewChart";

export default function AlertDetails() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Detalle de la alerta</h2>
          <p className="mt-2 text-sm text-zinc-400">Revisión completa del riesgo, objetivos y contexto de la señal.</p>
        </div>

        <span className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
          ACTIVA
        </span>
      </div>

      <TradingViewChart />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-black/20 p-5">
          <p className="text-sm text-zinc-500">Entrada</p>
          <p className="mt-2 text-2xl font-semibold text-white">2338.45</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-5">
          <p className="text-sm text-zinc-500">SL</p>
          <p className="mt-2 text-2xl font-semibold text-red-400">2332.00</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-5">
          <p className="text-sm text-zinc-500">TP1</p>
          <p className="mt-2 text-2xl font-semibold text-green-400">2345.00</p>
        </div>
        <div className="rounded-2xl bg-black/20 p-5">
          <p className="text-sm text-zinc-500">Probabilidad</p>
          <p className="mt-2 text-2xl font-semibold text-[#D4AF37]">88%</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#0C1017] p-6">
        <h3 className="text-lg font-bold text-[#D4AF37]">Análisis</h3>
        <p className="mt-4 leading-8 text-zinc-300">
          Compra confirmada después de un rompimiento de estructura en H1. El precio mitigó una zona institucional y tomó liquidez antes de continuar el movimiento. Se recomienda mantener la operación mientras la estructura permanezca intacta.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase text-zinc-500">Distancia al SL</p>
            <p className="mt-2 font-semibold text-white">6.45 pts</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase text-zinc-500">Relación riesgo/beneficio</p>
            <p className="mt-2 font-semibold text-[#D4AF37]">1:2.31</p>
          </div>
        </div>
      </div>

      <button className="mt-8 w-full rounded-2xl bg-[#D4AF37] py-5 text-lg font-bold text-black transition hover:scale-[1.02] hover:bg-[#F5D76E]">
        COPIAR ALERTA
      </button>
    </div>
  );
}
