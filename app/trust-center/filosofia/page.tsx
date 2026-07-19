import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Por que existe CARVIPIX | CARVIPIX Transparency & Trust Center",
  description: "Proposito fundacional de CARVIPIX y principios que justifican su existencia.",
  alternates: { canonical: "https://carvipix.com/trust-center/filosofia" },
};

export default function TrustFilosofiaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/filosofia" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Por que existe CARVIPIX</h1>
          <p className="mt-3 text-zinc-300">
            CARVIPIX existe para reducir opacidad en servicios de trading y ofrecer una plataforma con mas claridad, trazabilidad y disciplina.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Problema que enfrenta</h2>
              <p className="mt-2 text-sm text-zinc-300">Desinformacion, promesas ambiguas y falta de evidencia en experiencias de usuario.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Respuesta de producto</h2>
              <p className="mt-2 text-sm text-zinc-300">Convertir transparencia y estado operativo en una capa publica permanente.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Compromiso operacional</h2>
              <p className="mt-2 text-sm text-zinc-300">Solo publicar estados, evidencia y modulos que puedan sostenerse con hechos verificables.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Vision</h2>
              <p className="mt-2 text-sm text-zinc-300">Construir una relacion de largo plazo basada en evidencia, no en discurso comercial.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
