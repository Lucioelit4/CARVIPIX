import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";
import StatusBoard from "./StatusBoard";

export const metadata: Metadata = {
  title: "Estado de la plataforma | CARVIPIX Trust Center",
  description: "Estado publico de disponibilidad de modulos principales de CARVIPIX.",
  alternates: { canonical: "https://carvipix.com/trust-center/estado" },
};

export default function TrustEstadoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/estado" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Estado de la plataforma</h1>
          <StatusBoard />
        </article>
      </section>
    </main>
  );
}
