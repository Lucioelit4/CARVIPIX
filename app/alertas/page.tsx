import BackToDashboard from "../components/BackToDashboard";
import AlertFilters from "./components/AlertFilters";
import AlertStats from "./components/AlertStats";
import AlertsTable from "./components/AlertsTable";
import AlertDetails from "./components/AlertDetails";
import AlertHistory from "./components/AlertHistory";
import TradingViewCalendar from "./components/TradingViewCalendar";

export default function AlertasPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <section className="mb-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                CARVIPIX Live
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#D4AF37] sm:text-5xl">
                Alertas en Vivo
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                Todas las operaciones activas del equipo CARVIPIX, con métricas clave, tendencias y análisis de riesgo en un solo tablero.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-[#10141D]/80 p-5 shadow-xl shadow-[#D4AF37]/10">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Resumen rápido</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Alertas activas</p>
                  <p className="mt-2 text-2xl font-semibold text-white">4</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Rendimiento</p>
                  <p className="mt-2 text-2xl font-semibold text-[#D4AF37]">+72%</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-8">
          <AlertFilters />
          <AlertStats />
          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <AlertsTable />
              <AlertDetails />
            </div>
            <div className="space-y-6">
              <TradingViewCalendar />
              <AlertHistory />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}