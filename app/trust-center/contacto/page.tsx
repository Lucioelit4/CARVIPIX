import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Contacto oficial | CARVIPIX Trust Center",
  description: "Canales oficiales de contacto de CARVIPIX para soporte, legal y partners.",
  alternates: { canonical: "https://carvipix.com/trust-center/contacto" },
};

export default function TrustContactoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/contacto" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Contacto oficial</h1>
          <p className="mt-3 text-zinc-300">Usa solo canales corporativos oficiales para soporte, temas legales y alianzas.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Soporte</h2>
              <p className="mt-2 text-sm text-zinc-300">soporte@carvipix.com</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Legal</h2>
              <p className="mt-2 text-sm text-zinc-300">legal@carvipix.com</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Partners</h2>
              <p className="mt-2 text-sm text-zinc-300">partners@carvipix.com</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Privacidad</h2>
              <p className="mt-2 text-sm text-zinc-300">privacy@carvipix.com</p>
            </div>
          </div>

          <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-lg font-semibold text-white">Telefono</h2>
            <p className="mt-2 text-sm text-zinc-300">Se publicara en esta seccion cuando sea incorporado oficialmente por la empresa.</p>
          </section>
        </article>
      </section>
    </main>
  );
}
