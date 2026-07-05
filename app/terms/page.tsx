"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-[#D4AF37] hover:text-[#F5DEB3] transition"
        >
          <ArrowLeft size={18} />
          Volver al Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Términos y Condiciones</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 2 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptación de Términos</h2>
              <p>
                Al acceder y usar CARVIPIX, aceptas estar vinculado por estos términos y condiciones. Si no estás de acuerdo, no uses la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Descripción del Servicio</h2>
              <p>
                CARVIPIX proporciona herramientas, información y servicios relacionados con trading, automatización y gestión de capital. Nuestros servicios incluyen:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Alertas de trading en vivo</li>
                <li>Automatización mediante Bot</li>
                <li>Gestión de capital privada</li>
                <li>Servicios de fondeo de cuentas</li>
                <li>Herramientas analíticas y calculadoras</li>
                <li>Soporte y asesoramiento operativo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Responsabilidades del Usuario</h2>
              <p>El usuario es responsable de:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mantener la confidencialidad de sus credenciales</li>
                <li>Usar la plataforma únicamente para fines legales</li>
                <li>Proporcionar información exacta y actualizada</li>
                <li>Cumplir con las leyes locales y regulaciones de trading</li>
                <li>Aceptar los riesgos asociados con trading e inversión</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Limitación de Responsabilidad</h2>
              <p>
                CARVIPIX proporciona sus servicios &quot;tal como están&quot;. No garantizamos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rendimientos específicos o ganancias</li>
                <li>Disponibilidad ininterrumpida de servicios</li>
                <li>Ausencia de errores o interrupciones</li>
                <li>Que los servicios cumplirán con tus expectativas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Datos Demo y Contenido</h2>
              <p>
                Mientras la plataforma se integra con datos reales, ciertos contenidos incluyen datos simulados claramente marcados como &quot;demo&quot; o &quot;vista demo&quot;. Estos no representan datos reales de mercado ni resultados garantizados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibiciones</h2>
              <p>El usuario acepta NO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usar la plataforma para actividades ilegales</li>
                <li>Intentar acceder sin autorización</li>
                <li>Reproducir, distribuir o reutilizar contenido sin permiso</li>
                <li>Interferir con la operación o seguridad de la plataforma</li>
                <li>Usar información para actividades fraudulentas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Modificación de Términos</h2>
              <p>
                CARVIPIX se reserva el derecho de modificar estos términos en cualquier momento. El uso continuado de la plataforma implica aceptación de cambios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Resolución de Disputas</h2>
              <p>
                Cualquier disputa se resolverá de conformidad con las leyes aplicables. Para reclamaciones, contacta a través de nuestra sección de Soporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Suspensión de Cuenta</h2>
              <p>
                CARVIPIX puede suspender o cerrar tu cuenta si viola estos términos o si detecta actividad fraudulenta o ilegal.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              Al usar CARVIPIX, confirmas que has leído y aceptas estos términos. Para consultas, contacta a través de Soporte.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
