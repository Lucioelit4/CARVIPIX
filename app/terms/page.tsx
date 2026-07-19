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
          Volver al inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm"
        >
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Terminos y Condiciones</h1>
          <p className="text-zinc-400 mb-8">Ultima actualizacion: 18 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptacion</h2>
              <p>
                Al acceder o usar CARVIPIX aceptas estos terminos y las politicas vinculadas al servicio contratado o consultado. Si no estas de acuerdo, no debes usar la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Descripcion del servicio</h2>
              <p>
                CARVIPIX proporciona herramientas, software, informacion operativa, soporte de uso y servicios comerciales relacionados con trading y automatizacion. Segun el plan o producto, la plataforma puede incluir:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>alertas y paneles informativos;</li>
                <li>software y automatizacion mediante bot descargable;</li>
                <li>herramientas analiticas y calculadoras;</li>
                <li>proceso privado de evaluacion comercial para Socios Estrategicos;</li>
                <li>servicios marcados como proximamente o en preparacion.</li>
              </ul>
              <p className="mt-4">
                Salvo publicacion expresa en el checkout o en la pagina oficial correspondiente, una seccion en preparacion no constituye oferta activa, promesa de disponibilidad ni derecho adquirido.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Responsabilidades del usuario</h2>
              <p>El usuario es responsable de:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>mantener la confidencialidad de sus credenciales;</li>
                <li>usar la plataforma solo para fines legales y conforme a estas condiciones;</li>
                <li>proporcionar informacion exacta y actualizada;</li>
                <li>evaluar sus propias decisiones operativas y asumir los riesgos del trading.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Alcance y limites del servicio</h2>
              <p>
                CARVIPIX ofrece una plataforma tecnologica y contenidos informativos. No presta gestion de dinero, no ofrece asesoria financiera personalizada y no promete desempeno futuro.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>no garantizamos ganancias, rendimientos ni porcentajes de acierto;</li>
                <li>no garantizamos disponibilidad ininterrumpida de servicios o terceros;</li>
                <li>no garantizamos que una herramienta o informacion se adapte a todos los perfiles o escenarios.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Socios Estrategicos</h2>
              <p>
                El programa de Socios Estrategicos es un proceso de evaluacion comercial para posibles colaboraciones. No constituye captacion de inversion, administracion de capital, relacion laboral, sociedad ni contrato automatico.
              </p>
              <p className="mt-4">
                Cualquier colaboracion futura solo existira cuando ambas partes suscriban un acuerdo independiente por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Pagos, suscripciones y activaciones</h2>
              <p>
                Los productos de pago unico, suscripciones y politicas de cobro, cancelacion y reembolso se rigen por el checkout oficial y por las politicas publicadas en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Prohibiciones</h2>
              <p>El usuario acepta NO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>usar la plataforma para actividades ilegales o fraudulentas;</li>
                <li>intentar acceder sin autorizacion a cuentas, sistemas o datos;</li>
                <li>reproducir, distribuir o reutilizar contenido protegido sin permiso;</li>
                <li>presentar a CARVIPIX como si ofreciera servicios regulatorios, promesas de beneficio o administracion de dinero cuando ello no exista.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Modificacion de terminos</h2>
              <p>
                CARVIPIX puede modificar estos terminos para reflejar cambios comerciales, operativos, legales o tecnicos. El uso continuado de la plataforma despues de su publicacion implica aceptacion de la version vigente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Ley aplicable y disputas</h2>
              <p>
                Cualquier controversia se tratara conforme a la ley aplicable y a los canales de soporte o reclamacion oficialmente publicados por CARVIPIX.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Suspension o cierre de cuenta</h2>
              <p>
                CARVIPIX puede suspender o cerrar una cuenta si detecta incumplimiento de estos terminos, fraude, abuso tecnico, suplantacion o riesgo operativo relevante.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              Al usar CARVIPIX, confirmas que has leido y aceptas estos terminos y las politicas vinculadas al servicio contratado.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
