"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

const alerts = [
  {
    activo: "XAUUSD",
    tipo: "Compra",
    entrada: "2338.45",
    sl: "2332.00",
    tp: "2345.00",
    rr: "2.31",
    estado: "Activa",
    hora: "14:32",
  },
  {
    activo: "BTCUSD",
    tipo: "Compra",
    entrada: "61520.00",
    sl: "60780.00",
    tp: "62880.00",
    rr: "3.12",
    estado: "Activa",
    hora: "14:28",
  },
  {
    activo: "EURUSD",
    tipo: "Venta",
    entrada: "1.07153",
    sl: "1.07320",
    tp: "1.06900",
    rr: "1.80",
    estado: "TP cerca",
    hora: "13:55",
  },
  {
    activo: "GBPUSD",
    tipo: "Venta",
    entrada: "1.26840",
    sl: "1.27200",
    tp: "1.26200",
    rr: "1.77",
    estado: "Cerrada TP",
    hora: "12:15",
  },
];

function getStatusStyles(status: string) {
  if (status.includes("Activa")) {
    return "bg-green-500/10 text-green-300 border border-green-500/10";
  }

  if (status.includes("TP")) {
    return "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/10";
  }

  return "bg-white/5 text-zinc-200 border border-white/5";
}

export default function AlertsTable() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertas en vivo</h2>
          <p className="mt-1 text-sm text-zinc-400">Monitorea las señales activas con detalles de riesgo y resultados.</p>
        </div>
        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
          Actualizado hace 2 min
        </span>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-black/30 text-zinc-400">
            <tr>
              <th className="p-4">Activo</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Entrada</th>
              <th className="p-4">SL</th>
              <th className="p-4">TP</th>
              <th className="p-4">RR</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Hora</th>
            </tr>
          </thead>

          <tbody>
            {alerts.map((alert) => (
              <tr
                key={`${alert.activo}-${alert.hora}`}
                className="cursor-pointer border-t border-white/10 transition hover:bg-[#D4AF37]/10"
              >
                <td className="p-4 font-semibold text-white">{alert.activo}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                      alert.tipo === "Compra"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {alert.tipo === "Compra" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {alert.tipo}
                  </span>
                </td>
                <td className="p-4 text-zinc-100">{alert.entrada}</td>
                <td className="p-4 text-red-400">{alert.sl}</td>
                <td className="p-4 text-green-400">{alert.tp}</td>
                <td className="p-4 text-[#D4AF37]">{alert.rr}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(alert.estado)}`}>
                    {alert.estado}
                  </span>
                </td>
                <td className="p-4 text-zinc-400">{alert.hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {alerts.map((alert) => (
          <div key={`${alert.activo}-${alert.hora}`} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{alert.activo}</p>
                <p className="text-sm text-zinc-400">{alert.hora}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(alert.estado)}`}>
                {alert.estado}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-xs uppercase text-zinc-500">Tipo</p>
                <p className="mt-2 font-semibold text-white">{alert.tipo}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-xs uppercase text-zinc-500">RR</p>
                <p className="mt-2 font-semibold text-[#D4AF37]">{alert.rr}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-zinc-400">
              <div>
                <p>SL</p>
                <p className="mt-1 text-white">{alert.sl}</p>
              </div>
              <div>
                <p>TP</p>
                <p className="mt-1 text-white">{alert.tp}</p>
              </div>
              <div>
                <p>Entrada</p>
                <p className="mt-1 text-white">{alert.entrada}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
