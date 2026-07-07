import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

export default function ServiciosAlertasPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Servicio CARVIPIX
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Alertas en Vivo</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Miembro activo: ya tienes acceso a señales y seguimiento operativo. Este servicio te permite recibir alertas estratégicas con foco en gestión de riesgo.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Acceso</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">Miembro activo</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Beneficios clave</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                <li>Señales oportunas para pares principales.</li>
                <li>Seguimiento operativo en tiempo real.</li>
                <li>Alertas con objetivos y stops claros.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Enfoque</h2>
              <p className="mt-4 text-zinc-300">
                Diseño para miembros que buscan información accionable y una supervisión constante sin prometer rendimientos garantizados.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Estado del servicio</h2>
              <p className="mt-4 text-zinc-400">La información operativa se actualizará automáticamente cuando el servicio esté activo en tu cuenta.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm leading-7 text-zinc-400">
              <p className="font-semibold text-white">Uso actual</p>
              <p className="mt-4">
                Si ya eres miembro, utiliza este servicio para ver las alertas en tu panel operativo. Si aún no eres miembro, aquí se presentaría el plan de suscripción y sus beneficios.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm leading-7 text-zinc-400">
              <p className="font-semibold text-white">Riesgo</p>
              <p className="mt-4">
                Operar con señales implica riesgos y no hay garantía de resultados. Todas las decisiones deben considerar gestión de riesgo y condiciones de mercado.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-lg text-zinc-300">Disponible como parte de la membresía activa.</p>
            </div>
            <Link
              href="/alertas"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Ir a mis alertas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
