"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function RiskDisclosurePage() {
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
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-orange-500" />
            <h1 className="text-4xl font-bold text-[#D4AF37]">Divulgacion de Riesgos</h1>
          </div>
          <p className="text-zinc-400 mb-8">Ultima actualizacion: 18 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-lg font-semibold text-orange-400">
                ADVERTENCIA: operar en mercados financieros implica riesgo significativo de perdida. Los resultados historicos no garantizan resultados futuros.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Alcance de esta divulgacion</h2>
              <p>
                Esta divulgacion aplica al uso de alertas, herramientas, resultados, contenidos educativos, software descargable y demas recursos operativos ofrecidos por CARVIPIX.
                CARVIPIX actua como plataforma tecnologica para traders. No recibe dinero del usuario para administrarlo, no ejecuta operaciones en nombre del usuario y no promete resultados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Riesgos generales del trading</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Riesgo de mercado:</strong> los precios pueden moverse en contra de la posicion de forma rapida e impredecible.</li>
                <li><strong>Riesgo de liquidez:</strong> puede no existir ejecucion inmediata al precio esperado.</li>
                <li><strong>Riesgo de apalancamiento:</strong> usar margen aumenta la exposicion y puede acelerar perdidas.</li>
                <li><strong>Riesgo operativo:</strong> errores de configuracion, fallos tecnicos, latencia o desconexiones pueden afectar la ejecucion.</li>
                <li><strong>Riesgo de proveedor externo:</strong> brokers, plataformas, pasarelas, servidores o terceros pueden presentar incidencias fuera del control de CARVIPIX.</li>
                <li><strong>Riesgo de criterio del usuario:</strong> cada usuario decide si usa, interpreta o ignora la informacion mostrada en la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Lo que CARVIPIX no garantiza</h2>
              <p>
                CARVIPIX no garantiza:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ganancias, rentabilidad o porcentaje de acierto especifico;</li>
                <li>que una alerta, analisis o configuracion del bot resulte adecuada para todos los usuarios o para todas las condiciones de mercado;</li>
                <li>que un resultado historico se repita en el futuro;</li>
                <li>proteccion contra perdidas, llamadas de margen o errores de ejecucion de terceros;</li>
                <li>ingresos pasivos, dinero facil o resultados sin supervision del usuario.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Responsabilidad del usuario</h2>
              <p>
                El usuario es responsable de sus propias decisiones y de la forma en que utiliza la plataforma.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>definir si una operacion es apropiada para su experiencia, objetivos y tolerancia al riesgo;</li>
                <li>configurar y supervisar su broker, cuenta, terminal y parametros de ejecucion;</li>
                <li>aplicar controles de riesgo razonables, incluidos stop loss, tamano de posicion y limites de exposicion cuando corresponda;</li>
                <li>cumplir con las leyes, reglas fiscales y restricciones aplicables en su jurisdiccion.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Sobre resultados y contenido informativo</h2>
              <p>
                Los resultados, ejemplos, paneles, historiales y estadisticas publicados por CARVIPIX tienen caracter informativo y descriptivo.
                No deben interpretarse como garantia, oferta individual, recomendacion personalizada ni compromiso de desempeno futuro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Programa de Socios Estrategicos</h2>
              <p>
                El programa de Socios Estrategicos es un proceso privado de evaluacion comercial para posibles alianzas de distribucion, marca, comunidad o colaboracion empresarial.
                No constituye captacion de inversion, administracion de dinero, fondo colectivo, promesa de retorno ni relacion contractual automatica.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>presentar una solicitud no garantiza aprobacion ni contacto posterior;</li>
                <li>la evaluacion se limita a compatibilidad comercial, reputacional y operativa;</li>
                <li>cualquier colaboracion futura requerira validacion adicional y acuerdo independiente por escrito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Programa de fondeo</h2>
              <p>
                Cualquier referencia al programa de fondeo debe entenderse como informacion preliminar sobre un servicio en preparacion.
                Mientras no exista lanzamiento formal, no hay oferta activa, venta abierta, garantia de acceso ni derecho adquirido por visitar la pagina o registrarse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Soporte y orientacion</h2>
              <p>
                El soporte de CARVIPIX se limita a aspectos tecnicos, operativos, comerciales y de uso de la plataforma.
                No sustituye asesoramiento legal, fiscal o financiero independiente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contacto para consultas</h2>
              <p>
                Si tienes dudas sobre esta divulgacion o sobre el alcance de un servicio, utiliza los canales oficiales de soporte antes de contratar.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-400 font-semibold">
              Este documento forma parte del marco informativo y contractual de CARVIPIX. Al continuar con el uso de la plataforma, reconoces haber leido esta divulgacion y entiendes que operar siempre implica riesgo.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
