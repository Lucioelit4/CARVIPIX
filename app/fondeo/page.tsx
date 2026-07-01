import BackToDashboard from "../components/BackToDashboard";
import { DollarSign, Flag, Shield } from "lucide-react";

export default function FondeoPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <BackToDashboard />        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Servicio de Fondeo
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Gestión de prueba de fondeo</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              CARVIPIX no es una empresa de fondeo. Ofrecemos gestión del proceso para pasar pruebas de fondeo.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Pago único</p>
            <p className="mt-2 text-3xl font-bold text-[#D4AF37]">5,000 USD</p>
            <p className="mt-1 text-sm text-zinc-500">Gestión completa del proceso.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <DollarSign size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Inversión</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Pago único</p>
            <p className="mt-3 text-sm text-zinc-400">5,000 USD para gestionar la prueba de fondeo.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Flag size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Objetivo</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">200,000 USD</p>
            <p className="mt-3 text-sm text-zinc-400">Capital fondeado objetivo al completar la prueba.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Shield size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Alcance</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">FTMO + TopTier</p>
            <p className="mt-3 text-sm text-zinc-400">Otras empresas solo bajo revisión de políticas.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-bold text-white">Cómo funciona</h2>
            <p className="mt-4 text-zinc-400">
              Gestión del proceso para pasar pruebas de fondeo. Al completar el proceso, se entregan las credenciales al cliente para usar la cuenta fondeada.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-zinc-300">
              <li>1. Selección de la empresa: FTMO o TopTier.</li>
              <li>2. Revisión de políticas y documentación.</li>
              <li>3. Gestión de la cuenta de prueba y seguimiento.</li>
              <li>4. Entrega de credenciales al cliente al aprobar la evaluación.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-bold text-white">Duración estimada</h2>
            <p className="mt-4 text-zinc-400">
              El proceso suele durar entre 1 mes y 1 mes y medio, según la empresa y el desempeño durante la evaluación.
            </p>
            <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div>
                <p className="text-sm text-zinc-400">Pase avanzado</p>
                <p className="mt-2 text-2xl font-bold text-[#D4AF37]">5,000 USD</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Capital objetivo</p>
                <p className="mt-2 text-2xl font-bold text-[#D4AF37]">200,000 USD</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Compatibilidad</p>
                <p className="mt-2 text-base text-white">Se puede combinar con alertas CARVIPIX.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-[#0B1220]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold text-white">Términos y condiciones</h2>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            CARVIPIX no es empresa de fondeo. Ofrecemos un servicio de gestión para ayudar en pruebas de fondeo con FTMO y TopTier. Otras empresas se aceptan solo tras revisión de sus políticas para confirmar que permiten gestión por terceros.
          </p>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            El capital fondeado se ofrece a modo de gestión de cuentas de prueba y la entrega de credenciales al cliente se realiza una vez superada la evaluación. Las utilidades no son fijas y el desempeño depende de las condiciones de mercado y la evolución de la prueba.
          </p>
        </div>
      </div>
    </main>
  );
}
