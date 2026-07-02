"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Política de Privacidad</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 2 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Información que Recopilamos</h2>
              <p>
                CARVIPIX recopila información que nos proporcionas directamente al usar nuestra plataforma:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nombre, correo electrónico y datos de contacto</li>
                <li>Información de perfil y preferencias de cuenta</li>
                <li>Datos de transacciones y solicitudes de servicios</li>
                <li>Comunicaciones y mensajes enviados a través de nuestra plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Cómo Usamos Tu Información</h2>
              <p>Utilizamos la información recopilada para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Comunicarnos contigo sobre tu cuenta y actualizaciones</li>
                <li>Procesar solicitudes y transacciones</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraude y garantizar seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Compartición de Datos</h2>
              <p>
                No compartimos tu información personal con terceros sin tu consentimiento, excepto cuando sea necesario para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cumplir con la ley o requerimientos legales</li>
                <li>Proveedores de servicios esenciales para operar nuestra plataforma</li>
                <li>Proteger derechos, privacidad y seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Seguridad de Datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado, alteración o divulgación. Sin embargo, ninguna transmisión por internet es 100% segura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies y Tecnologías Similares</h2>
              <p>
                Utilizamos cookies para mejorar la experiencia del usuario. Puedes controlar cookies a través de tu navegador. Consulta nuestra <Link href="/cookies" className="text-[#D4AF37] hover:underline">Política de Cookies</Link> para más detalles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Derechos del Usuario</h2>
              <p>
                Tienes derecho a acceder, corregir o eliminar tu información personal. Para ejercer estos derechos, contacta a través de nuestro formulario de soporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cambios en Esta Política</h2>
              <p>
                Podemos actualizar esta política ocasionalmente. Los cambios significativos serán notificados por correo o aviso prominente en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contacto</h2>
              <p>
                Para consultas sobre privacidad, contacta a través de la sección de Soporte en la plataforma.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              Esta política se proporciona únicamente con fines informativos. CARVIPIX se reserva el derecho de actualizar estos términos en cualquier momento.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
