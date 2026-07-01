import { Cpu, Rocket, ShieldCheck } from "lucide-react";

export default function BotCarvipixPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Bot CARVIPIX
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Automatización de trading</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Configuración y evaluación del bot con información de estado sobre la plataforma.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Versión</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">Demo 1.0</p>
            <p className="mt-1 text-sm text-zinc-500">Integración futura para ejecución automática.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Cpu size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Control</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Activa</p>
            <p className="mt-3 text-sm text-zinc-400">Simulación de estado del bot en tiempo real.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Rocket size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Performance</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">+12.8%</p>
            <p className="mt-3 text-sm text-zinc-400">Estimado basado en reglas.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <ShieldCheck size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Seguridad</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Gestión avanzada</p>
            <p className="mt-3 text-sm text-zinc-400">Controles de riesgo previos a la ejecución.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold">Descripción del bot</h2>
          <p className="mt-2 text-sm text-zinc-400">Componente funcional con interfaz de diseño. La integración de órdenes en vivo se agregará cuando se conecte el backend.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">Modo</p>
              <p className="mt-2 text-lg font-semibold text-white">Conservador</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-zinc-400">Estado</p>
              <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Listo</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
