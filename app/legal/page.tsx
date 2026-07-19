"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { LEGAL_DOCUMENTS_BASE, latestActiveLegalDocuments } from "@/app/lib/legal/compliance-catalog";

export default function LegalPage() {
  const legalMatrix = latestActiveLegalDocuments(LEGAL_DOCUMENTS_BASE);

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
          <p className="text-zinc-400 mb-8">Ultima actualizacion: 18 de julio de 2026</p>

          <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold text-white mb-3">Versionado legal activo</h2>
            <p className="text-sm text-zinc-400 mb-4">Estas son las versiones activas que rigen actualmente para uso de la plataforma y procesos de pago.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {legalMatrix.map((doc) => (
                <div key={`${doc.slug}-${doc.version}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <Link href={doc.route} className="font-medium text-white hover:text-[#D4AF37] transition">{doc.title}</Link>
                  <p className="mt-1 text-xs text-zinc-400">Version {doc.version}</p>
                  <p className="mt-1 text-xs text-zinc-500">Estado: {doc.status}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Identidad y alcance general</h2>
              <p>
                CARVIPIX es una plataforma tecnologica orientada a traders. Ofrece software, herramientas de analisis, alertas, contenidos educativos, soporte de uso y procesos privados de evaluacion comercial.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Naturaleza de los servicios</h2>
              <p>
                CARVIPIX proporciona:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>herramientas analiticas y calculadoras operativas;</li>
                <li>alertas y contenido informativo para traders;</li>
                <li>software y automatizacion descargable para entornos compatibles;</li>
                <li>procesos privados de evaluacion comercial para Socios Estrategicos;</li>
                <li>documentacion, soporte y materiales de uso de plataforma.</li>
              </ul>
              <p className="mt-4">
                <strong>Aclaracion importante:</strong> CARVIPIX no capta dinero del usuario para administrarlo, no ejecuta operaciones por cuenta del usuario, no actua como broker y no ofrece asesoria financiera personalizada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Informacion operativa y riesgos</h2>
              <p>
                <strong>Operar en mercados financieros implica riesgo significativo, incluida la posible perdida parcial o total del capital utilizado por el usuario. CARVIPIX no garantiza:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ganancias o resultados especificos;</li>
                <li>resultados futuros a partir de resultados historicos;</li>
                <li>que una alerta, herramienta o automatizacion resulte adecuada para todos los usuarios o todos los contextos de mercado;</li>
                <li>proteccion contra perdidas, errores de terceros o incidencias operativas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Disponibilidad de informacion</h2>
              <p>
                La informacion mostrada en CARVIPIX depende de la activacion de servicios, del estado tecnico de cada modulo y de la disponibilidad de proveedores externos cuando aplique.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>los datos se publican cuando el sistema los valida o consolida;</li>
                <li>la ausencia temporal de metricas no implica error ni promesa incumplida;</li>
                <li>los estados de preparacion o proximamente no equivalen a venta activa ni acceso garantizado;</li>
                <li>la informacion puede actualizarse de forma progresiva segun el servicio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Socios Estrategicos y colaboraciones</h2>
              <p>
                El programa de Socios Estrategicos es un proceso privado de evaluacion comercial para posibles colaboraciones de distribucion, marca, comunidad o relacion empresarial.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>no constituye captacion de inversion, fondo colectivo ni administracion de dinero;</li>
                <li>no genera una relacion laboral, societaria o contractual por el simple envio de solicitud;</li>
                <li>cualquier colaboracion futura requerira revision adicional y acuerdo independiente por escrito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Responsabilidad del usuario</h2>
              <p>
                El usuario es responsable de evaluar si un servicio es adecuado para su perfil, configurar correctamente sus herramientas y cumplir con las leyes, obligaciones fiscales y restricciones de su jurisdiccion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitacion de responsabilidad</h2>
              <p>
                En la medida permitida por la ley aplicable, CARVIPIX no sera responsable por perdidas financieras, danos directos o indirectos derivados de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>uso de herramientas, contenido o automatizaciones por parte del usuario;</li>
                <li>errores, interrupciones, retrasos o indisponibilidad de terceros;</li>
                <li>decisiones operativas tomadas por el usuario con base en informacion de la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Politica de cookies</h2>
              <p>
                CARVIPIX utiliza cookies y tecnologias similares para funciones tecnicas, seguridad, medicion y experiencia de usuario. Consulta nuestra <Link href="/cookies" className="text-[#D4AF37] hover:underline">Politica de Cookies</Link> para mas detalle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Propiedad intelectual</h2>
              <p>
                Todo contenido, software, diseno, materiales y marcas de CARVIPIX son propiedad de CARVIPIX o de sus respectivos titulares. Su uso no autorizado esta prohibido.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Actualizacion del aviso</h2>
              <p>
                CARVIPIX puede actualizar este aviso para reflejar cambios operativos, contractuales o regulatorios. Se recomienda revisarlo periodicamente.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-400">
              <strong>Nota final:</strong> Este aviso resume el alcance legal general de la plataforma. Si necesitas una valoracion legal, fiscal o financiera especifica, debes acudir a un profesional independiente.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
