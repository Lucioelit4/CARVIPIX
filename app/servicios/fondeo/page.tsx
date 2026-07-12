import BackToDashboard from "../../components/BackToDashboard";

export default function ServiciosFondeoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Cuentas Fondeadas
          </p>
          <h1 className="mt-6 text-4xl font-bold text-white">Servicio próximamente</h1>
          <p className="mt-4 text-zinc-300">
            Esta sección permanece visible solo como presentación. No hay precio, formulario ni checkout activo en esta fase.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Estado</p>
              <p className="mt-3 text-2xl font-bold text-[#D4AF37]">Próximamente</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Checkout</p>
              <p className="mt-3 text-2xl font-bold text-white">Deshabilitado</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Formulario</p>
              <p className="mt-3 text-2xl font-bold text-white">No disponible</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
