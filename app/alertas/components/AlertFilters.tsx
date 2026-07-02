"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";

interface AlertFiltersProps {
  categories?: string[];
  activeCategory?: string;
  status?: string;
  search?: string;
  advancedOpen?: boolean;
  session?: string;
  risk?: string;
  direction?: string;
  rrMin?: string;
  statusOptions?: string[];
  sessionOptions?: string[];
  riskOptions?: string[];
  directionOptions?: string[];
  onCategoryChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onToggleAdvanced?: () => void;
  onSessionChange?: (value: string) => void;
  onRiskChange?: (value: string) => void;
  onDirectionChange?: (value: string) => void;
  onRrMinChange?: (value: string) => void;
  onClear?: () => void;
}

export default function AlertFilters({
  categories = ["Todas", "Oro", "Forex", "Crypto"],
  activeCategory = "Todas",
  status = "Todas",
  search = "",
  advancedOpen = false,
  session = "Todas",
  risk = "Todas",
  direction = "Todas",
  rrMin = "0",
  statusOptions = ["Todas", "Activas", "TP cerca", "Cerradas"],
  sessionOptions = ["Todas", "Londres", "NY", "Asia"],
  riskOptions = ["Todas", "Bajo", "Medio", "Alto"],
  directionOptions = ["Todas", "Compra", "Venta"],
  onCategoryChange = () => {},
  onSearchChange = () => {},
  onStatusChange = () => {},
  onToggleAdvanced = () => {},
  onSessionChange = () => {},
  onRiskChange = () => {},
  onDirectionChange = () => {},
  onRrMinChange = () => {},
  onClear = () => {},
}: AlertFiltersProps) {
  const safeCategories = categories ?? ["Todas", "Oro", "Forex", "Crypto"];
  const safeStatusOptions = statusOptions ?? ["Todas", "Activas", "TP cerca", "Cerradas"];
  const safeSessionOptions = sessionOptions ?? ["Todas", "Londres", "NY", "Asia"];
  const safeRiskOptions = riskOptions ?? ["Todas", "Bajo", "Medio", "Alto"];
  const safeDirectionOptions = directionOptions ?? ["Todas", "Compra", "Venta"];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Filtros rápidos</p>
          <h2 className="mt-3 text-2xl font-semibold">Encuentra tu señal ideal</h2>
        </div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
        >
          <SlidersHorizontal size={18} />
          {advancedOpen ? "Ocultar filtros avanzados" : "Filtros avanzados"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {safeCategories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-300 ${
              activeCategory === item
                ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30"
                : "border border-white/10 bg-[#0A0F16] text-zinc-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_auto]">
        <label className="relative block">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar activo..."
            className="w-full rounded-2xl border border-white/10 bg-[#0A0F16] py-4 pl-14 pr-5 text-white outline-none transition focus:border-[#D4AF37]"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#0A0F16] px-3 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
          >
            {safeStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            Limpiar
          </button>
        </div>
      </div>

      {advancedOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#0B1019]/95 p-5"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#090D14]/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Sesión</p>
              <div className="flex flex-wrap gap-2">
                {safeSessionOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSessionChange(item)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      session === item
                        ? "bg-[#D4AF37] text-black"
                        : "border border-white/10 bg-[#10141D] text-zinc-300 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#090D14]/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Riesgo</p>
              <div className="flex flex-wrap gap-2">
                {safeRiskOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onRiskChange(item)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      risk === item
                        ? "bg-[#D4AF37] text-black"
                        : "border border-white/10 bg-[#10141D] text-zinc-300 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#090D14]/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Dirección</p>
              <div className="flex flex-wrap gap-2">
                {safeDirectionOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onDirectionChange(item)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      direction === item
                        ? "bg-[#D4AF37] text-black"
                        : "border border-white/10 bg-[#10141D] text-zinc-300 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#090D14]/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">RR mínimo</p>
              <input
                type="number"
                min="0"
                step="0.1"
                value={rrMin}
                onChange={(event) => onRrMinChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#10141D] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            Los filtros avanzados son demostrativos y actualizan la selección de alertas en tiempo real.
          </p>
        </motion.div>
      ) : null}
    </div>
  );
}
