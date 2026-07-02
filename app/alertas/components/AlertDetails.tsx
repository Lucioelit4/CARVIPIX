"use client";

import { motion } from "framer-motion";
import { Check, Copy, Eye } from "lucide-react";
import { useState } from "react";

interface AlertDetailsProps {
  alert?: {
    id: string;
    symbol: string;
    market: string;
    tipo: string;
    entrada: string;
    sl: string;
    tp: string;
    rr: string;
    estado: string;
    hora: string;
    session: string;
    risk: string;
    probability: string;
    analysis: string;
    plan: string;
    direction: string;
  };
}

const defaultAlert = {
  id: "default",
  symbol: "XAUUSD",
  market: "Oro",
  tipo: "Compra",
  entrada: "2338.45",
  sl: "2332.00",
  tp: "2345.00",
  rr: "2.31",
  estado: "Activa",
  hora: "14:32",
  session: "Londres",
  risk: "Medio",
  probability: "88%",
  analysis:
    "Compra confirmada después de un rompimiento de estructura en H1. El precio mitigó una zona institucional y tomó liquidez antes de continuar el movimiento.",
  plan: "PRO",
  direction: "Compra",
};

export default function AlertDetails({ alert = defaultAlert }: AlertDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [managementMessage, setManagementMessage] = useState("");

  const copyAlert = async () => {
    const text = `${alert.symbol} ${alert.tipo} | Entrada ${alert.entrada} | SL ${alert.sl} | TP ${alert.tp} | RR ${alert.rr}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFollow = () => {
    setFollowed((value) => !value);
  };

  const viewManagement = () => {
    setManagementMessage("Gestión registrada: revisa la señal y ajusta niveles si es necesario.");
    window.setTimeout(() => setManagementMessage(""), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Detalle operativo</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{alert.symbol}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {alert.tipo} • {alert.market} • Sesión {alert.session}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            {alert.plan}
          </span>
          <span className={`inline-flex min-w-max items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${alert.estado.includes("Activa") ? "bg-green-500/10 text-green-300" : "bg-white/5 text-zinc-300"}`}>
            {alert.estado}
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B111B]/95 p-6">
        <div className="relative h-56 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#071018] via-[#0A101E] to-[#101424] p-6">
          <div className="absolute left-8 right-8 top-9 h-px bg-white/10" />
          <div className="absolute left-8 right-8 top-20 h-px bg-[#D4AF37]/20" />
          <div className="absolute left-8 right-8 top-31 h-px bg-white/10" />
          <div className="absolute left-8 right-8 top-42 h-px bg-[#D4AF37]/20" />

          <div className="absolute left-10 top-12 flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37]" /> Entrada
          </div>
          <div className="absolute right-10 top-20 flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-green-400" /> TP
          </div>
          <div className="absolute right-10 top-44 flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-red-400" /> SL
          </div>

          <div className="absolute left-16 top-24 h-2 w-56 rounded-full bg-[#D4AF37]/20" />
          <div className="absolute left-16 top-38 h-2 w-36 rounded-full bg-red-400/20" />
          <div className="absolute left-16 top-10 h-2 w-72 rounded-full bg-green-400/20" />

          <div className="absolute inset-x-0 bottom-5 flex justify-between text-xs text-zinc-500">
            <span>Gráfica real se conectará en fase de datos</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Demo</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-[#0C1118]/90 p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Entrada</p>
          <p className="mt-2 text-lg font-semibold text-white overflow-hidden text-ellipsis min-w-0">{alert.entrada}</p>
        </div>
        <div className="rounded-3xl bg-[#0C1118]/90 p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">SL</p>
          <p className="mt-2 text-lg font-semibold text-red-400 overflow-hidden text-ellipsis min-w-0">{alert.sl}</p>
        </div>
        <div className="rounded-3xl bg-[#0C1118]/90 p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">TP</p>
          <p className="mt-2 text-lg font-semibold text-green-400 overflow-hidden text-ellipsis min-w-0">{alert.tp}</p>
        </div>
        <div className="rounded-3xl bg-[#0C1118]/90 p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">RR</p>
          <p className="mt-2 text-lg font-semibold text-[#D4AF37] overflow-hidden text-ellipsis min-w-0">{alert.rr}</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#0D121A]/95 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#D4AF37]">Análisis</h3>
            <p className="mt-2 text-sm text-zinc-400">Evaluación demo para la señal seleccionada.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-zinc-400">
            Probabilidad {alert.probability}
          </span>
        </div>

        <p className="mt-4 leading-7 text-zinc-300">{alert.analysis}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-[#10151E]/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sesión</p>
            <p className="mt-2 text-white">{alert.session}</p>
          </div>
          <div className="rounded-3xl bg-[#10151E]/90 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Riesgo</p>
            <p className="mt-2 text-white">{alert.risk}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={copyAlert}
          className="rounded-3xl bg-[#D4AF37] px-4 py-3 text-xs font-semibold text-black transition hover:bg-[#F5D76E]"
        >
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <Copy size={16} /> {copied ? "Copiado" : "Copiar alerta"}
          </div>
        </button>
        <button
          type="button"
          onClick={toggleFollow}
          className={`rounded-3xl border px-4 py-3 text-xs font-semibold transition ${
            followed
              ? "border-green-500/20 bg-green-500/10 text-green-300 hover:bg-green-500/15"
              : "border border-white/10 bg-[#10141D]/90 text-white hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
          }`}
        >
          <span className="flex items-center justify-center gap-2 whitespace-nowrap">
            {followed ? <><Check size={16} /> Seguimiento activo</> : "Marcar como seguida"}
          </span>
        </button>
        <button
          type="button"
          onClick={viewManagement}
          className="rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
        >
          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
            <Eye size={16} /> Ver gestión
          </div>
        </button>
      </div>

      {managementMessage ? (
        <div className="mt-4 rounded-3xl bg-green-500/10 p-4 text-sm text-green-200">{managementMessage}</div>
      ) : null}
    </motion.div>
  );
}
