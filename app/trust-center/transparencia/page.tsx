import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Como funciona CARVIPIX | CARVIPIX Transparency & Trust Center",
  description: "Explicacion clara del modelo de servicio de CARVIPIX y sus limites operativos.",
  alternates: { canonical: "https://carvipix.com/trust-center/transparencia" },
};

export default function TrustTransparenciaPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/transparencia" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Como funciona CARVIPIX</h1>
          <p className="mt-3 text-zinc-300">
            CARVIPIX es una plataforma tecnologica para traders. Su funcion es ofrecer herramientas, automatizacion, contenido y recursos operativos.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Alertas</h2>
              <p className="mt-2 text-sm text-zinc-300">Se publican cuando el sistema valida condiciones operativas definidas.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Bot</h2>
              <p className="mt-2 text-sm text-zinc-300">Se entrega como software descargable para entornos compatibles y configuracion del usuario.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Dashboard</h2>
              <p className="mt-2 text-sm text-zinc-300">Concentra datos de servicio, historial operativo y herramientas del ecosistema CARVIPIX.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold text-white">Socios estrategicos</h2>
              <p className="mt-2 text-sm text-zinc-300">Es un proceso privado de evaluacion comercial para posibles colaboraciones.</p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Que obtiene el usuario</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Acceso a servicios segun su plan o producto activo.</li>
              <li>Herramientas y contenido operativo.</li>
              <li>Documentacion publica de alcance y politicas.</li>
              <li>Soporte por canales oficiales.</li>
            </ul>
          </section>

          <section className="mt-8 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-5">
            <h2 className="text-xl font-semibold text-white">Que NO hace CARVIPIX</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-200">
              <li>No recibe dinero para invertir por cuenta de usuarios.</li>
              <li>No administra fondos de clientes.</li>
              <li>No tiene acceso al dinero del usuario en su broker o cuenta externa.</li>
              <li>No promete resultados ni ganancias.</li>
            </ul>
          </section>
        </article>
      </section>
    </main>
  );
}
