import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

export default function ServiciosCapitalPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Gestión de Capital
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Capital gestionado</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Servicio comercial para inversiones desde 1,000 hasta 1,000,000 USD. Pago futuro en crypto, principalmente USDT TRC20.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Rango</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">1,000 - 1,000,000 USD</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Panel demo</h2>
              <p className="mt-4 text-zinc-300">Visualiza cómo se vería un crecimiento de cuenta con seguimiento y control disciplinado.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Crypto</h2>
              <p className="mt-4 text-zinc-300">Pago futuro en USDT TRC20 y otras opciones de crypto bajo evaluación.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Riesgo</h2>
              <p className="mt-4 text-zinc-300">Las utilidades son variables y no existen rendimientos garantizados.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">Cuenta de ejemplo</h2>
              <div className="mt-6 space-y-3 text-zinc-300">
                <div className="rounded-3xl bg-[#10141D]/90 p-4">
                  <p className="text-sm text-zinc-400">Capital invertido</p>
                  <p className="mt-2 text-3xl font-bold text-white">$12,500</p>
                </div>
                <div className="rounded-3xl bg-[#10141D]/90 p-4">
                  <p className="text-sm text-zinc-400">Utilidad flotante</p>
                  <p className="mt-2 text-3xl font-bold text-[#D4AF37]">$1,420</p>
                </div>
                <div className="rounded-3xl bg-[#10141D]/90 p-4">
                  <p className="text-sm text-zinc-400">Rendimiento mensual</p>
                  <p className="mt-2 text-3xl font-bold text-white">+8.4%</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">Estado de cuenta</h2>
              <p className="mt-6 text-zinc-300 leading-7">
                Estrategia manual de capital con informes claros y objetivos. El crecimiento ejemplo no representa resultados garantizados.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-zinc-300">Solicita inversiones con gestión manual y enfoque en riesgo controlado.</p>
            </div>
            <Link
              href="/capital"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Solicitar inversión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
