import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Seguridad | CARVIPIX Trust Center",
  description: "Medidas reales de seguridad, proteccion de datos y buenas practicas en CARVIPIX.",
  alternates: { canonical: "https://carvipix.com/trust-center/seguridad" },
};

export default function TrustSeguridadPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/seguridad" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Seguridad</h1>
          <p className="mt-3 text-zinc-300">Esta seccion describe medidas reales actualmente aplicadas por la plataforma.</p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Proteccion del transporte</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Acceso web por HTTPS.</li>
              <li>Canal cifrado entre navegador y plataforma.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Proteccion de cuenta</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Flujos de autenticacion y cierre de sesion en plataforma.</li>
              <li>Verificacion por correo para procesos de cuenta cuando aplica.</li>
              <li>Politicas de acceso interno separadas por roles administrativos.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Proteccion de datos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Uso de base de datos con controles de acceso del entorno de despliegue.</li>
              <li>Registro de eventos operativos para trazabilidad tecnica.</li>
              <li>Politicas publicas de privacidad, cookies y cumplimiento disponibles para consulta.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-white">Infraestructura y respaldo</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Despliegue en infraestructura cloud con monitoreo operativo.</li>
              <li>Control de estado de servicios y revisiones de logs en produccion.</li>
              <li>Mecanismos de restauracion y continuidad segun configuraciones de la plataforma.</li>
            </ul>
          </section>

          <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-xl font-semibold text-white">Buenas practicas recomendadas al usuario</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-300">
              <li>Usar contrasena robusta y unica para su cuenta.</li>
              <li>No compartir credenciales ni codigos de verificacion.</li>
              <li>Verificar siempre dominio y canales oficiales de CARVIPIX.</li>
              <li>Reportar actividad sospechosa por soporte oficial.</li>
            </ul>
          </section>
        </article>
      </section>
    </main>
  );
}
