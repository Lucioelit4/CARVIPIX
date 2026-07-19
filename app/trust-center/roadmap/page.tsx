import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Roadmap | CARVIPIX Trust Center",
  description: "Hoja de ruta publica de CARVIPIX con estado de capacidades actuales y proximas.",
  alternates: { canonical: "https://carvipix.com/trust-center/roadmap" },
};

const roadmap = {
  exists: [
    "Servicios y planes operativos en produccion.",
    "Marco legal publico y centro de cumplimiento.",
    "Modulo de socios estrategicos con flujo de evaluacion.",
    "Estructura de soporte y comunicacion oficial.",
  ],
  building: [
    "Mejora continua de estabilidad y consistencia documental.",
    "Refinamiento de monitoreo publico de estado de servicios.",
    "Consolidacion de transparencia operativa en Trust Center.",
  ],
  next: [
    "Publicacion progresiva de reportes metodologicos verificables.",
    "Mayor automatizacion de indicadores de estado publico.",
    "Evolucion de modulo de fondeo cuando exista lanzamiento formal.",
  ],
};

export default function TrustRoadmapPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/roadmap" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Roadmap publico</h1>
          <p className="mt-3 text-zinc-300">Estado actual y evolucion prevista del ecosistema CARVIPIX.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <section className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Ya existe</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {roadmap.exists.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">En desarrollo</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {roadmap.building.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Proximamente</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {roadmap.next.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
