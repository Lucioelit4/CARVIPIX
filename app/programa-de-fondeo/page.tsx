import { DollarSign, Flag, Shield } from "lucide-react";

export default function ProgramaDeFondeoPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Programa de Fondeo
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Tu camino al fondeo</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Vista previa de programa de fondeo con la estructura básica para una experiencia completa.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Nivel</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">Evaluación</p>
            <p className="mt-1 text-sm text-zinc-500">Contenido disponible pronto.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <DollarSign size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Agenda</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">3 pasos</p>
            <p className="mt-3 text-sm text-zinc-400">Preparación, examen y fondeo.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Flag size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Meta</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">$100k</p>
            <p className="mt-3 text-sm text-zinc-400">Objetivo de fondeo modelado.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Shield size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Seguridad</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Reglas claras</p>
            <p className="mt-3 text-sm text-zinc-400">Estructura conservadora de evaluación.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold">Estado del fondeo</h2>
          <p className="mt-2 text-sm text-zinc-400">La plataforma está lista para conectar información de programas reales.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Próximo paso</p>
              <p className="mt-2 text-lg font-semibold text-white">Completar evaluación</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Requisitos</p>
              <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Reglas de riesgo</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
