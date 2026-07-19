import type { Metadata } from "next";
import Link from "next/link";
import TrustNav from "../_components/TrustNav";
import { TRUST_EVIDENCE_ITEMS } from "../trust-registry";

export const metadata: Metadata = {
  title: "Centro de evidencias | CARVIPIX Transparency & Trust Center",
  description: "Repositorio de evidencia verificable con fuente, estado y fecha de actualizacion.",
  alternates: { canonical: "https://carvipix.com/trust-center/respaldos" },
};

export default function TrustRespaldosPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/respaldos" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Centro de evidencias</h1>
          <p className="mt-3 text-zinc-300">
            Aqui vive la evidencia del sistema de confianza: cada elemento incluye estado, fuente y fecha de actualizacion.
          </p>

          <div className="mt-8 space-y-3">
            {TRUST_EVIDENCE_ITEMS.map((item) => (
              <section key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-white">{item.label}</h2>
                  <p className={`text-xs font-semibold ${item.status === "verified" ? "text-emerald-300" : "text-amber-300"}`}>
                    {item.status === "verified" ? "VERIFICADO" : "PENDIENTE"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
                <p className="mt-2 text-xs text-zinc-500">Actualizado: {item.updatedAt}</p>
                <Link href={item.sourceHref} className="mt-2 inline-flex text-sm font-medium text-[#D4AF37] hover:underline">
                  Ver fuente: {item.sourceLabel}
                </Link>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-semibold text-white">Politica de evidencia</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Toda afirmacion publicada en CARVIPIX debe poder respaldarse documental o tecnicamente. Si un elemento no puede verificarse,
              no se presenta como respaldo.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
