"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";

interface AlertRow {
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
}

interface AlertsTableProps {
  alerts?: AlertRow[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function getStatusStyles(status: string) {
  if (status.includes("Activa")) {
    return "bg-green-500/10 text-green-300 border border-green-500/10";
  }

  if (status.includes("TP")) {
    return "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/10";
  }

  if (status.includes("Cerrada")) {
    return "bg-white/5 text-zinc-200 border border-white/10";
  }

  return "bg-white/5 text-zinc-200 border border-white/10";
}

export default function AlertsTable({ alerts, selectedId, onSelect }: AlertsTableProps) {
  const safeAlerts = alerts ?? [];
  const safeSelectedId = selectedId ?? "";
  const safeOnSelect = onSelect ?? (() => {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-4 shadow-xl shadow-[#D4AF37]/10"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Alertas en vivo</h2>
          <p className="mt-1 text-sm text-zinc-400">Señales con niveles de entrada, stop y objetivo.</p>
        </div>
        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[#D4AF37]">
          {safeAlerts.length} señales activas
        </span>
      </div>

      <div className="grid gap-4">
        {safeAlerts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0B111A]/90 p-8 text-center text-sm text-zinc-400">
            No hay alertas con los filtros seleccionados.
          </div>
        ) : (
          safeAlerts.map((alert) => {
            const isSelected = safeSelectedId === alert.id;

            return (
              <motion.button
                type="button"
                key={alert.id}
                onClick={() => safeOnSelect(alert.id)}
                whileHover={{ y: -2 }}
                className={`group w-full rounded-[1.75rem] border border-white/10 bg-[#0B111A]/90 p-4 text-left shadow-sm transition duration-300 hover:border-[#D4AF37]/40 hover:shadow-[#D4AF37]/10 ${
                  isSelected ? "border-[#D4AF37]/50 bg-[#141A24] shadow-lg shadow-[#D4AF37]/15" : ""
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-semibold text-white">{alert.symbol}</p>
                      <span className="rounded-full bg-[#11171F] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                        {alert.market}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-zinc-400">
                      <span>{alert.hora}</span>
                      <span>•</span>
                      <span>{alert.session}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        alert.tipo === "Compra"
                          ? "bg-green-500/10 text-green-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {alert.tipo === "Compra" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {alert.tipo}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        alert.plan === "ELITE"
                          ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "bg-white/5 text-zinc-200"
                      }`}
                    >
                      {alert.plan}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl bg-[#131923]/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Entrada</p>
                    <p className="mt-2 text-base font-semibold text-white overflow-hidden text-ellipsis min-w-0">{alert.entrada}</p>
                  </div>
                  <div className="rounded-3xl bg-[#131923]/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">SL</p>
                    <p className="mt-2 text-base font-semibold text-red-400 overflow-hidden text-ellipsis min-w-0">{alert.sl}</p>
                  </div>
                  <div className="rounded-3xl bg-[#131923]/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">TP</p>
                    <p className="mt-2 text-base font-semibold text-green-400 overflow-hidden text-ellipsis min-w-0">{alert.tp}</p>
                  </div>
                  <div className="rounded-3xl bg-[#131923]/90 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">RR</p>
                    <p className="mt-2 text-base font-semibold text-[#D4AF37] overflow-hidden text-ellipsis min-w-0">{alert.rr}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
                  <span className={`inline-flex min-w-max items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold ${getStatusStyles(alert.estado)}`}>
                    {alert.estado}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{alert.direction}</span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-[#0A0F16]/90 p-4 text-sm text-zinc-400">
        Selecciona una alerta para ver el detalle operativo o usa los filtros para refinar tu sala premium.
      </div>
    </motion.div>
  );
}
