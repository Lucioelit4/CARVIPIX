import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Centro de transparencia | CARVIPIX Transparency & Trust Center",
  description: "Flujo paso a paso de como se genera, valida, publica y audita una salida operativa.",
  alternates: { canonical: "https://carvipix.com/trust-center/metodologia" },
};

const STEPS = [
  {
    step: "Paso 1",
    title: "Captura de datos",
    detail: "El sistema recibe datos de mercado desde fuentes definidas por la arquitectura de datos oficial.",
  },
  {
    step: "Paso 2",
    title: "Filtrado y consistencia",
    detail: "Se validan estructura, temporalidades y coherencia antes de que el dato pase a evaluacion operativa.",
  },
  {
    step: "Paso 3",
    title: "Evaluacion metodologica",
    detail: "El motor contrasta condiciones internas y solo emite salida si los criterios minimos se cumplen.",
  },
  {
    step: "Paso 4",
    title: "Publicacion controlada",
    detail: "Las salidas se reflejan en modulos habilitados con estado y metadatos trazables.",
  },
  {
    step: "Paso 5",
    title: "Monitoreo y auditoria",
    detail: "Eventos y estado tecnico quedan registrados para diagnostico, revision y mejora continua.",
  },
];

export default function TrustMetodologiaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/metodologia" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Centro de transparencia</h1>
          <p className="mt-3 text-zinc-300">
            Este flujo muestra como opera CARVIPIX de principio a fin para que cualquier usuario entienda que ocurre en cada etapa.
          </p>

          <div className="mt-8 space-y-4">
            {STEPS.map((item) => (
              <section key={item.step} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">{item.step}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-zinc-300">{item.detail}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
