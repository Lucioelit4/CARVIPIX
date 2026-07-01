import BackToDashboard from "../../components/BackToDashboard";

export default function ServiciosAcademiaPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Academia CARVIPIX
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Próximamente</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Estamos preparando la academia CARVIPIX para ofrecer formación estratégica y soporte en trading, gestión de riesgo y análisis de mercado.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Estado</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">En desarrollo</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Formato</h2>
              <p className="mt-4 text-zinc-300">Contenido estructurado con módulos, casos prácticos y seguimiento.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Objetivo</h2>
              <p className="mt-4 text-zinc-300">Elevar tu capacidad para operar mercados con disciplina y análisis profesional.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Advertencia</h2>
              <p className="mt-4 text-zinc-300">No hay promesas de resultados garantizados; el aprendizaje es la base del éxito responsable.</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#D4AF37]">Inscripción</p>
            <p className="mt-4 text-zinc-300">Notificaré cuando la academia esté disponible y el contenido sea liberado.</p>
            <button
              disabled
              className="mt-6 rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-400"
            >
              Notificarme
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
