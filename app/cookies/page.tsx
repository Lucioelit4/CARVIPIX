"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
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
          className="rounded-2xl border border-white/10 bg-[#0B111A]/80 p-8 backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Política de Cookies</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 2 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. ¿Qué son las Cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto almacenados en tu dispositivo que ayudan a CARVIPIX a recordar preferencias y mejorar tu experiencia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Tipos de Cookies que Usamos</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cookies Esenciales</h3>
                  <p>
                    Necesarias para que la plataforma funcione correctamente:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Autenticación de usuario y seguridad de sesión</li>
                    <li>Preferencias de idioma y región</li>
                    <li>Configuración de interfaz (tema, layout)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cookies de Funcionalidad</h3>
                  <p>
                    Mejoran la experiencia del usuario:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Recordar datos de formularios</li>
                    <li>Guardar filtros y búsquedas recientes</li>
                    <li>Mantener historial de navegación</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cookies Analíticas</h3>
                  <p>
                    Nos ayudan a entender cómo usas la plataforma:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Páginas visitadas y tiempo en cada página</li>
                    <li>Características más utilizadas</li>
                    <li>Errores o problemas experimentados</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cookies de Marketing</h3>
                  <p>
                    Para personalización y ofertas (si aplica):
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Preferencias de productos</li>
                    <li>Historial de servicios visitados</li>
                    <li>Personalización de contenido y ofertas</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Cookies de Terceros</h2>
              <p>
                Podemos usar servicios de terceros que establecen sus propias cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proveedores de análisis (Google Analytics, etc.)</li>
                <li>Servicios de mapas y ubicación</li>
                <li>Integraciones de redes sociales</li>
              </ul>
              <p className="mt-4">
                No controlamos estas cookies. Consulta las políticas de privacidad de terceros para más información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Cómo Controlar Cookies</h2>
              <p>
                Puedes controlar cookies en tu navegador:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios</li>
                <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web</li>
                <li><strong>Edge:</strong> Configuración → Privacidad, búsqueda y servicios → Borrar datos de exploración</li>
              </ul>
              <p className="mt-4">
                <strong>Nota:</strong> Desactivar cookies esenciales puede afectar la funcionalidad de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Do Not Track (DNT)</h2>
              <p>
                Si tu navegador tiene DNT habilitado, CARVIPIX respeta esta preferencia y limita ciertos tipos de tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Retención de Cookies</h2>
              <p>
                Las cookies se retienen según su tipo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cookies de Sesión:</strong> Se eliminan al cerrar el navegador</li>
                <li><strong>Cookies Persistentes:</strong> Se retienen hasta 12 meses</li>
                <li>Puedes eliminar cookies manualmente en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Consentimiento</h2>
              <p>
                Al usar CARVIPIX, aceptas el uso de cookies conforme a esta política. Puedes retirar consentimiento en cualquier momento a través de configuración del navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Cambios en Esta Política</h2>
              <p>
                CARVIPIX puede actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contacto</h2>
              <p>
                Para preguntas sobre cookies, contacta a través de la sección de Soporte.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              Esta política cumple con regulaciones de privacidad incluyendo GDPR (Unión Europea) y CCPA (California, USA). Tu privacidad es importante para nosotros.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
