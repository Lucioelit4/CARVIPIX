"use client";

import { Search } from "lucide-react";
import { CARVIPIXButton, CARVIPIXCard } from "../../design-system";
import { STATUS_FILTER_OPTIONS, type StatusFilterValue } from "../alertas-view-model";

type AlertFiltersProps = {
  search: string;
  selectedSymbol: string;
  selectedStatus: StatusFilterValue;
  symbolOptions: string[];
  isRefreshing?: boolean;
  onSearchChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
  onStatusChange: (value: StatusFilterValue) => void;
  onRefresh: () => void;
  onClear: () => void;
};

export default function AlertFilters({
  search,
  selectedSymbol,
  selectedStatus,
  symbolOptions,
  isRefreshing = false,
  onSearchChange,
  onSymbolChange,
  onStatusChange,
  onRefresh,
  onClear,
}: AlertFiltersProps) {
  return (
    <CARVIPIXCard variant="elevated" padding="16" hover={false}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar símbolo, strategy_id, signal_id o analysis_id"
            className="h-11 w-full rounded-lg border border-white/15 bg-[#0C1522] pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
          />
        </label>

        <label className="min-w-[180px] flex-1 sm:flex-none">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/55">Activo</span>
          <select
            value={selectedSymbol}
            onChange={(event) => onSymbolChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-white/15 bg-[#0C1522] px-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
          >
            {symbolOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Todos los activos" : option}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[210px] flex-1 sm:flex-none">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-white/55">Estado</span>
          <select
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value as StatusFilterValue)}
            className="h-11 w-full rounded-lg border border-white/15 bg-[#0C1522] px-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <CARVIPIXButton type="button" variant="secondary" size="sm" onClick={onRefresh} isLoading={isRefreshing}>
          Actualizar
        </CARVIPIXButton>

        <CARVIPIXButton type="button" variant="ghost" size="sm" onClick={onClear}>
          Limpiar filtros
        </CARVIPIXButton>
      </div>
    </CARVIPIXCard>
  );
}
