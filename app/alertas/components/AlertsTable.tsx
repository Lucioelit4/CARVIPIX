"use client";

import { CARVIPIXBadge, CARVIPIXCard } from "../../design-system";
import {
  formatLevel,
  getActionabilityBadgeVariant,
  getLifecycleBadgeVariant,
  type AlertSignal,
} from "../alertas-view-model";

type AlertsTableProps = {
  alerts: AlertSignal[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function AlertsTable({ alerts, selectedId, onSelect }: AlertsTableProps) {
  return (
    <CARVIPIXCard variant="elevated" padding="16" hover={false}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Lista de alertas</h2>
          <p className="text-xs text-white/60">Selecciona una señal para abrir el panel de detalle.</p>
        </div>
        <CARVIPIXBadge variant="premium">{alerts.length} visibles</CARVIPIXBadge>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/65">
          No hay alertas para los filtros actuales. Cuando exista una señal real válida aparecerá aquí con su `signal_id` y `analysis_id`.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isSelected = selectedId === alert.id;

            return (
              <article
                key={alert.id}
                className={`rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-[#D4AF37]/50 bg-[#111C2B] shadow-[0_0_0_1px_rgba(212,175,55,0.15)]"
                    : "border-white/10 bg-[#0D1624]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {alert.symbol} · {alert.direction}
                    </p>
                    <p className="text-xs text-white/60">
                      {alert.market} · {alert.time} · hace {alert.minutesAgo} min · {alert.timeframe}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CARVIPIXBadge variant={getLifecycleBadgeVariant(alert.lifecycleState)}>{alert.lifecycleLabel}</CARVIPIXBadge>
                    <CARVIPIXBadge variant={getActionabilityBadgeVariant(alert.actionability)}>{alert.actionabilityLabel}</CARVIPIXBadge>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">strategy_id</p>
                    <p className="truncate text-xs font-semibold text-white">{alert.strategyId}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">signal_id / analysis_id</p>
                    <p className="truncate text-xs font-semibold text-white">{alert.signalId} · {alert.analysisId}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Entrada</p>
                    <p className="text-sm font-semibold text-white">{formatLevel(alert.entry)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">TP</p>
                    <p className="text-sm font-semibold text-emerald-300">{formatLevel(alert.takeProfit)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">SL</p>
                    <p className="text-sm font-semibold text-rose-300">{formatLevel(alert.stopLoss)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">R/B</p>
                    <p className="text-sm font-semibold text-[#D4AF37]">
                      {alert.riskReward > 0 ? alert.riskReward.toFixed(2) : "Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="space-y-1 text-xs text-white/60">
                    <p>{alert.actionabilityNote}</p>
                    <p>Vigencia: {alert.validUntilLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(alert.id)}
                    className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black transition hover:brightness-105"
                  >
                    Ver señal
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CARVIPIXCard>
  );
}
