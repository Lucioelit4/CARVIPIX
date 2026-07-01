"use client";

import { Search, SlidersHorizontal } from "lucide-react";

const filters = [
  "Todas",
  "Oro",
  "Forex",
  "Crypto",
  "Índices",
];

export default function AlertFilters() {
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-lg shadow-[#D4AF37]/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          {filters.map((item, index) => (
            <button
              key={item}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                index === 0
                  ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30"
                  : "border border-white/10 bg-[#10141D] text-zinc-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
          <SlidersHorizontal size={18} />
          Filtros avanzados
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_auto]">
        <label className="relative block">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Buscar activo..."
            className="w-full rounded-2xl border border-white/10 bg-[#0A0F16] py-4 pl-14 pr-5 text-white outline-none transition focus:border-[#D4AF37]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <select className="w-full rounded-2xl border border-white/10 bg-[#0A0F16] px-4 py-4 text-white outline-none transition focus:border-[#D4AF37]">
            <option>Estado: Todas</option>
            <option>Activas</option>
            <option>Ganadas</option>
            <option>Perdidas</option>
          </select>
          <button className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20">
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
