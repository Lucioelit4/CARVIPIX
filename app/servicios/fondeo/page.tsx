import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

export default function ServiciosFondeoPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Cuenta fondeada
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Servicio de fondeo gestionado</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                CARVIPIX no es empresa de fondeo. Proveemos gestión del proceso para pasar pruebas de fondeo y entregar credenciales al cliente.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Pago único</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">5,000 USD</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Objetivo</h2>
              <p className="mt-4 text-zinc-300">Capital fondeado objetivo: 200,000 USD.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Empresas</h2>
              <p className="mt-4 text-zinc-300">FTMO y TopTier. Otras empresas se revisan según políticas y permiso para gestión por terceros.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Duración</h2>
              <p className="mt-4 text-zinc-300">Entre 1 mes y 1 mes y medio, según evaluación y progreso.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">Cómo funciona</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                <li>Gestión del proceso para pasar la prueba de fondeo.</li>
                <li>Seguimiento y soporte en cada fase.</li>
                <li>Entrega de credenciales al cliente al completar la prueba.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">Compatibilidad</h2>
              <p className="mt-4 text-zinc-300">El capital fondeado puede combinarse con alertas CARVIPIX para mayor señalización y análisis.</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6 text-zinc-300">
            <h2 className="text-xl font-semibold text-white">Términos y condiciones</h2>
            <p className="mt-4 leading-7">
              Este servicio no implica fondeo directo por parte de CARVIPIX. Se ofrece gestión del proceso para superar pruebas de fondeo, con FTMO y TopTier como opciones principales.
            </p>
            <p className="mt-4 leading-7">
              Al completar el proceso, se entregan credenciales al cliente para usar la cuenta fondeada. No hay garantías de resultados ni rendimientos fijos.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-zinc-300">Diseñado para quienes buscan acceso a capital fondeado con gestión profesional del proceso.</p>
            </div>
            <Link
              href="/fondeo"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Solicitar cuenta fondeada
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
