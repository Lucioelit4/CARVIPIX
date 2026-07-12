import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

export default function CapitalPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Gestión de Capital
          </p>
          <h1 className="mt-6 text-4xl font-bold text-white">Flujo oficial de depósitos y retiros</h1>
          <p className="mt-4 text-zinc-300">
            Este servicio opera con proceso manual de solicitud. Los depósitos y retiros se realizan únicamente mediante USDT en red TRC20.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Método</p>
              <p className="mt-3 text-2xl font-bold text-[#D4AF37]">USDT TRC20</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">KYC</p>
              <p className="mt-3 text-2xl font-bold text-white">Requerido &gt; 50,000 USD</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Contrato</p>
              <p className="mt-3 text-2xl font-bold text-white">Firmado &gt; 50,000 USD</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-300">
            <p className="font-semibold text-white">Términos y Condiciones Operativos</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Todos los movimientos se procesan exclusivamente por USDT en red TRC20.</li>
              <li>Para montos mayores a 50,000 USD se activa verificación de identidad.</li>
              <li>Para montos mayores a 50,000 USD se requiere contrato firmado antes de operar.</li>
              <li>No existe automatización de este proceso en esta fase.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/soporte" className="rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#f5d76e]">
              Solicitar revisión manual
            </Link>
            <Link href="/legal" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/5">
              Ver marco legal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
