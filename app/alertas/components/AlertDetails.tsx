"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "../../design-system";

type SignalStateKey = "can-enter" | "wait" | "no-enter" | "closed";

type AlertSignal = {
  id: string;
  symbol: string;
  market: string;
  direction: "Compra" | "Venta";
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward: number;
  stateKey: SignalStateKey;
  stateLabel: string;
  stateNote: string;
  time: string;
  minutesAgo: number;
  canEnter: boolean;
  confidence: number;
  timeframe: string;
  strategy: string;
  analysis: string;
};

type AlertDetailsProps = {
  alert?: AlertSignal;
};

function formatLevel(value?: number): string {
  if (typeof value !== "number") {
    return "Pendiente";
  }

  if (value >= 100) {
    return value.toFixed(2);
  }

  return value.toFixed(5);
}

function getBadgeVariant(stateKey: SignalStateKey) {
  if (stateKey === "can-enter") return "success";
  if (stateKey === "wait") return "warning";
  if (stateKey === "no-enter") return "danger";
  return "info";
}

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
      `Estado: ${alert.stateLabel}`,
      `Entrada: ${formatLevel(alert.entry)}`,
      `TP: ${formatLevel(alert.takeProfit)}`,
      `SL: ${formatLevel(alert.stopLoss)}`,
      `R/B: ${alert.riskReward > 0 ? alert.riskReward.toFixed(2) : "Pendiente"}`,
      `Confianza: ${alert.confidence}%`,
      `Temporalidad: ${alert.timeframe}`,
      `Estrategia: ${alert.strategy}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <CARVIPIXCard variant="premium" padding="24" hover={false}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Panel de detalle</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {alert.symbol} · {alert.direction}
          </h2>
          <p className="text-xs text-white/60">
            {alert.time} · hace {alert.minutesAgo} min
          </p>
        </div>
        <CARVIPIXBadge variant={getBadgeVariant(alert.stateKey)}>{alert.stateLabel}</CARVIPIXBadge>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">¿Puede entrar?</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.canEnter ? "Sí, ventana válida" : "No, esperar/no entrar"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Estado actual</p>
          <p className="mt-1 text-sm font-semibold text-white">{alert.stateNote}</p>
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
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Estrategia</p>
        <p className="mt-1 text-sm font-semibold text-white">{alert.strategy}</p>
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
            Ver gráfico y análisis
          </CARVIPIXButton>
        </Link>
      </div>
    </CARVIPIXCard>
  );
}
