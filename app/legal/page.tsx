"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-[#D4AF37] hover:text-[#F5DEB3] transition"
        >
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Aviso Legal</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 2 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Identidad y Contacto</h2>
              <p>
                CARVIPIX es una plataforma de trading, automatización y educación financiera. Para consultas legales o comerciales, contacta a través de la sección de Soporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Naturaleza de los Servicios</h2>
              <p>
                CARVIPIX proporciona:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Herramientas analíticas y calculadoras financieras</li>
                <li>Alertas y señales operativas informativas</li>
                <li>Servicios de automatización y gestión de capital</li>
                <li>Contenido educativo y asesoramiento operativo</li>
              </ul>
              <p className="mt-4">
                <strong>Aclaración importante:</strong> Los servicios de CARVIPIX son informativos y operativos. CARVIPIX NO es un asesor financiero regulado ni gestor de inversiones autorizado. No garantizamos retornos ni resultados específicos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Exención de Responsabilidad - Riesgos de Trading</h2>
              <p>
                <strong>El trading e inversión implican riesgo significativo, incluida la pérdida potencial de capital. CARVIPIX no garantiza:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ganancias o rendimientos específicos</li>
                <li>Resultados futuros basados en desempeño pasado</li>
                <li>Que las alertas o señales serán precisas o exitosas</li>
                <li>Protección contra pérdidas en operaciones</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Disponibilidad de la Información</h2>
              <p>
                La información mostrada en CARVIPIX depende de la activación de servicios y de la disponibilidad operativa de cada módulo.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Los datos se publican una vez validados por el sistema</li>
                <li>La ausencia de métricas no implica error de la plataforma</li>
                <li>Los estados de preparación indican próximos pasos para el usuario</li>
                <li>La actualización de información se realiza de forma progresiva por servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Conformidad Legal</h2>
              <p>
                El usuario es responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cumplir con leyes locales de trading e inversión</li>
                <li>Verificar regulaciones en su jurisdicción</li>
                <li>Consultar asesores financieros autorizados antes de decisiones críticas</li>
                <li>Declarar ingresos de trading según lo requerido por autoridades fiscales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Limitación de Responsabilidad</h2>
              <p>
                En ningún caso CARVIPIX será responsable por pérdidas financieras, daños directos o indirectos, incluso si ha sido advertida de la posibilidad de tales daños, derivados de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Uso de nuestros servicios o herramientas</li>
                <li>Información o alertas proporcionadas</li>
                <li>Errores, interrupciones o indisponibilidad</li>
                <li>Decisiones de trading basadas en nuestro contenido</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Política de Cookies</h2>
              <p>
                CARVIPIX utiliza cookies para mejorar experiencia. Consulta nuestra <Link href="/cookies" className="text-[#D4AF37] hover:underline">Política de Cookies</Link> para detalles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Propiedad Intelectual</h2>
              <p>
                Todo contenido, herramientas y materiales en CARVIPIX son propiedad intelectual de CARVIPIX o sus licensiantes. Queda prohibida la reproducción sin autorización.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Actualización de Aviso Legal</h2>
              <p>
                CARVIPIX puede actualizar este aviso en cualquier momento. Se recomienda revisar periódicamente.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              <strong>Disclaimer final:</strong> Este aviso legal se proporciona únicamente para información. No constituye asesoramiento legal ni financiero. Consulta profesionales autorizados antes de tomar decisiones de inversión.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
