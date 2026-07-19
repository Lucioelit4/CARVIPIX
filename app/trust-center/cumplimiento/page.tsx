import type { Metadata } from "next";
import Link from "next/link";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Cumplimiento | CARVIPIX Trust Center",
  description: "Centro legal y de cumplimiento de CARVIPIX con politicas publicas activas.",
  alternates: { canonical: "https://carvipix.com/trust-center/cumplimiento" },
};

const docs = [
  { href: "/legal", label: "Aviso legal" },
  { href: "/terms", label: "Terminos y condiciones" },
  { href: "/privacy", label: "Politica de privacidad" },
  { href: "/cookies", label: "Politica de cookies" },
  { href: "/risk-disclosure", label: "Divulgacion de riesgos" },
  { href: "/cancelacion", label: "Politica de cancelacion" },
  { href: "/pagos-recurrentes", label: "Renovaciones y pagos recurrentes" },
  { href: "/reembolsos", label: "Politica de reembolsos" },
];

export default function TrustCumplimientoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/cumplimiento" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Cumplimiento</h1>
          <p className="mt-3 text-zinc-300">
            Aqui se centraliza la documentacion legal publica que rige el uso de la plataforma y sus servicios.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {docs.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 transition hover:border-[#D4AF37]/40 hover:text-[#F4C542]"
              >
                {doc.label}
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-semibold text-white">Criterio operativo de reembolsos</h2>
            <p className="mt-2 text-sm text-zinc-300">
              CARVIPIX opera bajo modelo de servicios digitales. Una vez habilitado el acceso a contenido, alertas, herramientas,
              licencias o servicios digitales, no hay reembolso automatico. Solo se analizan excepciones verificables atribuibles
              a la plataforma, como cobro duplicado o fallo tecnico confirmado que impida entregar el servicio pagado.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
