import BackToDashboard from "../components/BackToDashboard";

export default function AcademiaPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <BackToDashboard />        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 px-8 py-12 shadow-2xl shadow-black/30">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Academia CARVIPIX
          </p>
          <h1 className="mt-8 text-5xl font-bold text-[#D4AF37] sm:text-6xl">
            La academia CARVIPIX estará disponible próximamente
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            Estamos preparando una experiencia formativa profesional con contenido de trading, gestión de riesgo y análisis de mercado. Regresa pronto para acceso prioritario.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">En desarrollo</p>
              <p className="mt-4 text-3xl font-bold text-white">Cursos</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Orientado a</p>
              <p className="mt-4 text-3xl font-bold text-[#D4AF37]">Traders</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Enfoque</p>
              <p className="mt-4 text-3xl font-bold text-white">Riesgo y disciplina</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-6 text-left text-sm text-zinc-400">
            <p className="font-semibold text-white">Nota</p>
            <p className="mt-3 leading-7">
              Esta es una página de lanzamiento con contenido de vista previa. La academia ofrecerá formación estructurada y soporte sólido, sin promesas de resultados garantizados.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
