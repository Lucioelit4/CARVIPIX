import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

const previewAnalyses = [
  { symbol: "EURUSD", result: "+2.4%", note: "Entrada en ruptura, objetivo claro." },
  { symbol: "BTCUSD", result: "+5.8%", note: "Reacción tras noticia macro." },
  { symbol: "GBPJPY", result: "-1.2%", note: "Stop ejecutado con disciplina." },
];

export default function ServiciosAnalisisPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Servicio CARVIPIX
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Análisis Diario</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                El análisis diario es un beneficio de membresía diseñado para presentar escenarios del día y facilitar decisiones con gestión de riesgo.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Miembro activo</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">Acceso a análisis</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Beneficios</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                <li>Análisis de oportunidades y riesgos.</li>
                <li>Registros con ganancias y pérdidas reales.</li>
                <li>Soporte para decisiones informadas.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Aplicación</h2>
              <p className="mt-4 text-zinc-300">Uso profesional orientado a traders con gestión de riesgos disciplinada.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Visión</h2>
              <p className="mt-4 text-zinc-300">Verás estructuras de mercado que apoyan la toma de decisiones sin promesas de ganancias.</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-white">Últimos análisis</h2>
            <div className="mt-6 space-y-4">
              {previewAnalyses.map((item) => (
                <div key={item.symbol} className="rounded-3xl border border-white/5 bg-[#10141D]/90 p-4">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>{item.symbol}</span>
                    <span className={item.result.startsWith("+") ? "text-green-300" : "text-rose-400"}>{item.result}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-zinc-300">El análisis diario mejora tu visión de mercado y ayuda a preparar operaciones con un marco de riesgo.</p>
            </div>
            <Link
              href="/analisis"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Ver análisis del día
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
