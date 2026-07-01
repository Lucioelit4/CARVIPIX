import { Toolbox, Wrench, Zap } from "lucide-react";

export default function HerramientasPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Herramientas
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Utilidades de trading</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Accede a utilidades integradas para tu operativa, con diseño completo y contenido demo donde sea necesario.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Lanzamiento</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">Próximamente</p>
            <p className="mt-1 text-sm text-zinc-500">Herramientas en desarrollo.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {[
            {
              title: "Calculadora de riesgo",
              icon: Toolbox,
              description: "Define riesgo y tamaño de posición con facilidad.",
            },
            {
              title: "Cronograma de mercado",
              icon: Wrench,
              description: "Sigue eventos clave y sesiones activas.",
            },
            {
              title: "Escáner rápido",
              icon: Zap,
              description: "Identifica oportunidades de alta probabilidad.",
            },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.title} className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center gap-3 text-[#D4AF37]">
                  <Icon size={22} />
                  <span className="text-sm uppercase tracking-[0.16em]">{tool.title}</span>
                </div>
                <p className="mt-6 text-lg font-semibold text-white">{tool.description}</p>
                <p className="mt-3 text-sm text-zinc-400">Modo demo hasta integración real.</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold">Estado</h2>
          <p className="mt-2 text-sm text-zinc-400">Sección preparada para conectar widgets públicos y cálculos en tiempo real.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Widget en vivo</p>
              <p className="mt-2 text-lg font-semibold text-white">Listo</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Cálculos</p>
              <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Simulados</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
