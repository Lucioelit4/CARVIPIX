import { BookOpen, Clock, Sparkles } from "lucide-react";

export default function AnalisisDiarioPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Análisis Diario
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Ideas y contexto para el día</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Recomendaciones de trading diseñadas para mantener la plataforma coherente hasta que la integración de señal sea completa.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Actualizado</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">Hoy</p>
            <p className="mt-1 text-sm text-zinc-500">Vista previa de análisis diario.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Sparkles size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Oportunidad principal</span>
            </div>
            <h2 className="mt-6 text-2xl font-bold">EUR/USD</h2>
            <p className="mt-3 text-sm text-zinc-400">Tendencia bajista en el intradía con zona de soporte clave en 1.071.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Clock size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Horario</span>
            </div>
            <h2 className="mt-6 text-2xl font-bold">Sesión europea</h2>
            <p className="mt-3 text-sm text-zinc-400">Eventos macro y reportes en los próximos 6 horas.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <BookOpen size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Tema clave</span>
            </div>
            <h2 className="mt-6 text-2xl font-bold">Jerarquía de noticias</h2>
            <p className="mt-3 text-sm text-zinc-400">Controla fusiones de datos y eventos macro con disciplina.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-bold">Resumen de análisis</h2>
            <p className="mt-2 text-sm text-zinc-400">Comentarios de mercado con status demo.</p>
            <div className="mt-6 space-y-5">
              {[
                {
                  label: "Mercado",
                  value: "XAUUSD",
                  detail: "Esperando confirmación de ruptura del nivel 2340.",
                },
                {
                  label: "Setup",
                  value: "BTCUSD",
                  detail: "Zona de compra entre 61000 y 61500.",
                },
                {
                  label: "Gestión",
                  value: "Riesgo moderado",
                  detail: "Buscar 1.8 R/R con stops ajustados.",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-zinc-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold">Notas rápidas</p>
              <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-sm text-[#D4AF37]">Demo</span>
            </div>
            <ul className="mt-6 space-y-4 text-sm text-zinc-400">
              <li className="rounded-3xl border border-white/10 bg-black/10 p-4">Cotizaciones con divergencia visible.</li>
              <li className="rounded-3xl border border-white/10 bg-black/10 p-4">Confirmar datos de volumen antes de entrada.</li>
              <li className="rounded-3xl border border-white/10 bg-black/10 p-4">Priorizar eventos macro de alto impacto.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
