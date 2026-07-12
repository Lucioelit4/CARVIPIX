import BackToDashboard from "../../components/BackToDashboard";

export default function ServiciosAcademiaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40 text-center">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Academia CARVIPIX
          </p>
          <h1 className="mt-8 text-5xl font-bold text-white sm:text-6xl">Próximamente</h1>
          <p className="mt-6 max-w-2xl mx-auto text-base leading-8 text-zinc-400 sm:text-lg">
            La academia está en preparación. En esta etapa no se muestran cursos, precios ni checkout.
          </p>
        </section>
      </div>
    </main>
  );
}
