import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

const sampleMembers = [
  { name: "Trader Pro", score: "+48%" },
  { name: "CARVIPIX X", score: "+41%" },
  { name: "Strategy 9", score: "+37%" },
  { name: "Sólido 24", score: "+33%" },
  { name: "Rendimiento 8", score: "+29%" },
];

export default function ServiciosResultadosPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Transparencia CARVIPIX
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Resultados generales</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Presentamos un panorama claro del rendimiento comunitario con ejemplos demo, métricas y rankings de los mejores traders.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Vista demo</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">Top 10</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Beneficio</p>
              <h2 className="mt-4 text-3xl font-bold text-[#D4AF37]">Consistencia</h2>
              <p className="mt-3 text-zinc-300">Análisis y métricas simuladas para entender la cobertura del equipo.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Enfoque</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Claridad</h2>
              <p className="mt-3 text-zinc-300">Visualiza tendencias y resultados con información fácil de valorar.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Cobertura</p>
              <h2 className="mt-4 text-3xl font-bold text-white">Ranking</h2>
              <p className="mt-3 text-zinc-300">Top 10 de miembros destacados con resultados simulados.</p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            <div className="bg-[#10141D]/95 px-6 py-5 text-sm uppercase tracking-[0.2em] text-[#D4AF37]">Vista previa ranking</div>
            <div className="p-6">
              <div className="grid grid-cols-[2fr_1fr] gap-4 text-zinc-400 text-sm font-semibold uppercase">
                <span>Miembro</span>
                <span>Retorno estimado</span>
              </div>
              <div className="mt-4 space-y-3">
                {sampleMembers.map((member) => (
                  <div key={member.name} className="grid grid-cols-[2fr_1fr] gap-4 rounded-2xl bg-[#0B1220] p-4 text-sm text-white">
                    <span>{member.name}</span>
                    <span className="text-right text-[#D4AF37]">{member.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-zinc-300">La transparencia es clave para evaluar rendimiento sin falsas promesas.</p>
            </div>
            <Link
              href="/resultados"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Ver resultados completos
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
