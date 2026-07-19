import type { Metadata } from "next";
import Link from "next/link";
import { TRUST_TIMELINE } from "../trust-registry";

export const metadata: Metadata = {
  title: "Cronologia | CARVIPIX Transparency & Trust Center",
  description: "Linea del tiempo 2019-2026 con hitos respaldados por modulos y evidencia publica.",
};

export default function TrustCenterCronologiaPage() {
  return (
    <main className="min-h-screen bg-[#030305] text-white px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Cronologia 2019-2026</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Evolucion documentada de CARVIPIX</h1>
          <p className="mt-3 text-sm text-white/75 md:text-base">
            Esta cronologia muestra hitos de evolucion con referencia directa a modulos publicos del producto.
          </p>
        </section>

        <section className="space-y-4">
          {TRUST_TIMELINE.map((event) => (
            <article key={`${event.year}-${event.title}`} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">{event.year}</p>
              <h2 className="mt-2 text-xl font-semibold">{event.title}</h2>
              <p className="mt-2 text-sm text-white/75">{event.detail}</p>
              <Link href={event.sourceHref} className="mt-3 inline-flex text-sm font-medium text-[#D4AF37] hover:underline">
                Ver fuente: {event.sourceLabel}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
