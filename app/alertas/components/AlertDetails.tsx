"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "../../design-system";
import {
  formatRelativeAgeLabel,
  formatLevel,
  getActionabilityBadgeVariant,
  getFreshnessTone,
  getLifecycleBadgeVariant,
  type AlertSignal,
} from "../alertas-view-model";

type AlertDetailsProps = {
  alert?: AlertSignal;
};

export default function AlertDetails({ alert }: AlertDetailsProps) {
  const [copied, setCopied] = useState(false);

  if (!alert) {
    return (
      <CARVIPIXCard variant="elevated" padding="24" hover={false}>
        <p className="text-sm text-white/65">Selecciona una alerta para ver el detalle operativo.</p>
      </CARVIPIXCard>
    );
  }

  const copySignal = async () => {
    const text = [
      `${alert.symbol} · ${alert.direction}`,
      `Estado de alerta: ${alert.lifecycleLabel}`,
      `Acción recomendada: ${alert.actionabilityLabel}`,
      `Entrada: ${formatLevel(alert.entry)}`,
      `TP: ${formatLevel(alert.takeProfit)}`,
      `SL: ${formatLevel(alert.stopLoss)}`,
      `R/B: ${alert.riskReward > 0 ? alert.riskReward.toFixed(2) : "Pendiente"}`,
      `Confianza: ${alert.confidence}%`,
      `Temporalidad: ${alert.timeframe}`,
      `Estado: ${alert.lifecycleLabel}`,
      `Vigencia: ${alert.validUntilLabel}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const freshness = getFreshnessTone(alert.freshnessState);

  return (
    <CARVIPIXCard variant="premium" padding="24" hover={false}>
      <div className={`mb-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${freshness.className}`}>
        {freshness.label}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Panel de detalle</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {alert.symbol} · {alert.direction}
          </h2>
          <p className="text-xs text-white/60">{alert.timestampLabel} · {formatRelativeAgeLabel(alert.timestampMs)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CARVIPIXBadge variant={getLifecycleBadgeVariant(alert.lifecycleState)}>{alert.lifecycleLabel}</CARVIPIXBadge>
          <CARVIPIXBadge variant={getActionabilityBadgeVariant(alert.actionability)}>{alert.actionabilityLabel}</CARVIPIXBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">¿Puede entrar?</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.canEnter ? "Sí, ventana válida" : "No, esperar/no entrar"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Estado operativo</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.actionabilityNote}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Entrada válida</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatLevel(alert.entry)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Take Profit</p>
          <p className="mt-1 text-sm font-semibold text-emerald-300">{formatLevel(alert.takeProfit)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Stop Loss</p>
          <p className="mt-1 text-sm font-semibold text-rose-300">{formatLevel(alert.stopLoss)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Riesgo/Beneficio</p>
          <p className="mt-1 text-sm font-semibold text-[#D4AF37]">
            {alert.riskReward > 0 ? alert.riskReward.toFixed(2) : "Pendiente"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Confianza</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.confidence}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Temporalidad</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.timeframe}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Vigencia</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.validUntilLabel}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Análisis breve</p>
        <p className="mt-1 text-sm leading-relaxed text-white/85">{alert.analysis}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <CARVIPIXButton type="button" variant="premium" onClick={copySignal} leftIcon={<Copy size={14} />}>
          {copied ? "Señal copiada" : "Copiar señal"}
        </CARVIPIXButton>
        <Link href={`/resultados?symbol=${alert.symbol}`} className="block">
          <CARVIPIXButton type="button" variant="secondary" fullWidth leftIcon={<ExternalLink size={14} />}>
            Ver resultados del símbolo
          </CARVIPIXButton>
        </Link>
      </div>
    </CARVIPIXCard>
  );
}
