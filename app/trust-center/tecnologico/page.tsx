import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro tecnologico | CARVIPIX Transparency & Trust Center",
  description: "Base tecnologica de CARVIPIX: arquitectura, operacion y principios tecnicos verificables.",
};

const blocks = [
  {
    title: "Arquitectura por capas",
    text: "Trading Engine, backend de dominio, APIs cliente y capa UI separadas para trazabilidad y escalabilidad.",
  },
  {
    title: "Observabilidad",
    text: "Monitoreo de salud, validacion y estado de componentes para visibilidad operativa continua.",
  },
  {
    title: "Infraestructura",
    text: "Entornos local, staging y produccion con guias de despliegue controlado y enfoque enterprise.",
  },
  {
    title: "Proteccion de datos",
    text: "Controles de verificacion de identidad, retencion definida y almacenamiento segregado.",
  },
];

export default function TrustCenterTecnologicoPage() {
  return (
    <main className="min-h-screen bg-[#030305] text-white px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Centro tecnologico</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Tecnologia al servicio de la confianza</h1>
          <p className="mt-3 text-sm text-white/75 md:text-base">
            CARVIPIX publica como esta construido su sistema para que usuarios y aliados entiendan su operacion real.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {blocks.map((block) => (
            <article key={block.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="mt-2 text-sm text-white/75">{block.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
