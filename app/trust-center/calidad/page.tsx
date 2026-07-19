import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de calidad | CARVIPIX Transparency & Trust Center",
  description: "Controles de calidad, validaciones y disciplina operativa aplicados en CARVIPIX.",
};

const controls = [
  "Compilacion y validacion tecnica antes de cambios criticos.",
  "Chequeos de coherencia entre contenido comercial, legal y producto.",
  "Monitoreo de salud publica y degradacion visible cuando aplica.",
  "Documentacion de estados activos, borradores y proximamente.",
  "Actualizacion continua del centro de evidencia con trazabilidad.",
];

export default function TrustCenterCalidadPage() {
  return (
    <main className="min-h-screen bg-[#030305] text-white px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Centro de calidad</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Calidad visible, no promesas vacias</h1>
          <p className="mt-3 text-sm text-white/75 md:text-base">
            Cada control existe para reducir incertidumbre y sostener una operacion consistente en el tiempo.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-6">
          <ul className="space-y-3 text-sm text-white/80">
            {controls.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
