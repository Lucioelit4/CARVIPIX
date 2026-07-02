"use client";

const history = [
  { activo: "XAUUSD", resultado: "Ganada", pips: "+68 pips", fecha: "Hoy 11:20" },
  { activo: "BTCUSD", resultado: "Ganada", pips: "+420 pts", fecha: "Hoy 09:45" },
  { activo: "GBPUSD", resultado: "Perdida", pips: "-36 pips", fecha: "Ayer 18:10" },
  { activo: "EURUSD", resultado: "Ganada", pips: "+22 pips", fecha: "Ayer 14:05" },
];

export default function AlertHistory() {
  const safeHistory = history ?? [];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Historial reciente</h2>
          <p className="mt-1 text-xs text-zinc-400">Últimas operaciones cerradas.</p>
        </div>
        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]">
          Último 7 días
        </span>
      </div>

      <div className="space-y-2">
        {safeHistory.map((item) => (
          <div
            key={`${item.activo}-${item.fecha}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-[#D4AF37]/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{item.activo}</p>
                <p className="text-xs text-zinc-400">{item.fecha}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${item.resultado === "Ganada" ? "text-green-400" : "text-red-400"}`}>
                  {item.resultado}
                </p>
                <p className="text-xs text-zinc-400">{item.pips}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
