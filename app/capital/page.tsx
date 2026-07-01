import BackToDashboard from "../components/BackToDashboard";
import { Briefcase, Percent, Shield } from "lucide-react";

export default function CapitalPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <BackToDashboard />        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Gestión de Capital
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Protege tu patrimonio</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Estrategias de capital y control de riesgo con datos demo bien presentados.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Apalancamiento</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">1:10</p>
            <p className="mt-1 text-sm text-zinc-500">Simulado.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Briefcase size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Capital</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">$12,500</p>
            <p className="mt-3 text-sm text-zinc-400">Balance disponible.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Percent size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Riesgo</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">1.8%</p>
            <p className="mt-3 text-sm text-zinc-400">Por operación recomendado.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Shield size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Control</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Estricto</p>
            <p className="mt-3 text-sm text-zinc-400">Gestión disciplinada.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
