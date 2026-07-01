"use client";

import BackToDashboard from "../components/BackToDashboard";
import { useMemo } from "react";

export default function AnalisisPage() {
  const recent = useMemo(() => {
    const samples = [
      { id: 1, symbol: "EURUSD", result: "+2.4%", note: "Entrada en ruptura, objetivo alcanzado" },
      { id: 2, symbol: "GBPJPY", result: "-1.2%", note: "Stop alcanzado tras alta volatilidad" },
      { id: 3, symbol: "BTCUSD", result: "+5.8%", note: "Reversión tras noticia macro" },
      { id: 4, symbol: "USDCAD", result: "+0.9%", note: "Operación de seguimiento de tendencia" },
      { id: 5, symbol: "AUDUSD", result: "-0.6%", note: "Operación revertida, gestión de riesgo aplicada" },
    ];
    return samples;
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Análisis Diario</h1>
          <p className="text-sm text-zinc-400">Historial de análisis recientes — Vista demo</p>
        </div>
        <div className="text-sm text-green-300">Miembro activo: tienes acceso a Análisis Diario</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {recent.slice(0, 3).map((r) => (
          <div key={r.id} className="rounded-xl bg-[#0B1220] p-4">
            <p className="text-sm text-zinc-400">{r.symbol}</p>
            <p className="mt-2 text-xl font-bold text-[#D4AF37]">{r.result}</p>
            <p className="mt-2 text-sm text-zinc-300">{r.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-[#0B1220] p-4">
        <h2 className="text-lg font-bold text-white">Historial completo</h2>
        <ul className="mt-3 space-y-3 text-sm text-zinc-300">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between border-t border-white/5 pt-3">
              <div>
                <div className="text-white">{r.symbol}</div>
                <div className="text-zinc-400 text-sm">{r.note}</div>
              </div>
              <div className={`text-sm font-bold ${r.result.startsWith("+") ? "text-green-300" : "text-rose-400"}`}>
                {r.result}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-sm text-zinc-400">
        Nota: ejemplos simulados para demostración. Operar conlleva riesgos.
      </div>
    </div>
  );
}