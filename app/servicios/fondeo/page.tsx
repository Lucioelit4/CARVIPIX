import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

export default function ServiciosFondeoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Cuentas Fondeadas
          </p>
          <h1 className="mt-6 text-4xl font-bold text-white">Programa de evaluación y seguimiento</h1>
          <p className="mt-4 text-zinc-300">
            El servicio opera con revisión manual: solicitud por soporte, validación comercial y seguimiento desde el panel del cliente.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Estado</p>
              <p className="mt-3 text-2xl font-bold text-[#D4AF37]">Activo por soporte</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Ingreso</p>
              <p className="mt-3 text-2xl font-bold text-white">Solicitud con ticket</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Seguimiento</p>
              <p className="mt-3 text-2xl font-bold text-white">Panel y soporte</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-300">
            <p className="font-semibold text-white">Flujo operativo actual</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>El cliente abre solicitud de evaluación desde soporte.</li>
              <li>El equipo revisa elegibilidad, riesgo y datos de cuenta.</li>
              <li>La respuesta y estado se registran en historial del ticket.</li>
              <li>Los siguientes pasos se comunican por soporte oficial CARVIPIX.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/soporte" className="rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#f5d76e]">
              Iniciar solicitud
            </Link>
            <Link href="/comunidad" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/5">
              Ver canal interno
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
