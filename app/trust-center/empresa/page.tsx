import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Empresa | CARVIPIX Transparency & Trust Center",
  description: "Identidad corporativa de CARVIPIX: historia, filosofia, mision, vision y valores.",
  alternates: { canonical: "https://carvipix.com/trust-center/empresa" },
};

export default function TrustEmpresaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/empresa" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Empresa</h1>
          <p className="mt-3 text-zinc-300">
            CARVIPIX es una empresa tecnologica enfocada en construir herramientas operativas para traders.
          </p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Historia</h2>
            <p className="mt-2 text-zinc-300">
              CARVIPIX acumula mas de siete anos de trayectoria desarrollando servicios relacionados con mercados financieros.
              La plataforma actual representa una evolucion tecnologica de ese trabajo: mas estructura, mas trazabilidad y mas claridad operativa.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Filosofia de empresa</h2>
            <p className="mt-2 text-zinc-300">
              El enfoque de CARVIPIX combina disciplina operativa, criterio de riesgo y mejora continua del producto. La prioridad es construir una
              plataforma util, estable y honesta para usuarios que buscan estructura de trabajo, no promesas.
            </p>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-lg font-semibold text-white">Mision</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Desarrollar tecnologia para traders con estandares de claridad, estabilidad y control operativo.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-lg font-semibold text-white">Vision</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Consolidar un ecosistema tecnico y transparente que evolucione de forma sostenible en el tiempo.
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Valores</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Transparencia operativa.</li>
              <li>Responsabilidad tecnica.</li>
              <li>Disciplina y control del riesgo.</li>
              <li>Respeto por el usuario y sus decisiones.</li>
              <li>Mejora continua del producto.</li>
            </ul>
          </section>
        </article>
      </section>
    </main>
  );
}
