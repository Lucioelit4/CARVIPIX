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
            <h1 className="text-4xl font-bold text-[#D4AF37]">Divulgación de Riesgos</h1>
          </div>
          <p className="text-zinc-400 mb-8">Última actualización: 2 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-lg font-semibold text-orange-400">
                ⚠️ ADVERTENCIA: El trading e inversión en mercados financieros implica riesgo substancial de pérdida. Los resultados pasados no garantizan resultados futuros.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Naturaleza de los Riesgos</h2>
              <p>
                El trading y la inversión implican diversos riesgos que incluyen pero no se limitan a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Riesgo de Mercado:</strong> Los precios fluctúan impredeciblemente. Puedes perder tu inversión completa.</li>
                <li><strong>Riesgo de Liquidez:</strong> Puede que no puedas cerrar posiciones cuando lo desees.</li>
                <li><strong>Riesgo de Apalancamiento:</strong> Si usas margen, las pérdidas pueden exceder tu depósito inicial.</li>
                <li><strong>Riesgo de Broker:</strong> Riesgo de quiebra o problemas del proveedor de servicios.</li>
                <li><strong>Riesgo de Operación:</strong> Errores técnicos, fallos de sistema o desconexiones pueden causar pérdidas.</li>
                <li><strong>Riesgo de Modelo:</strong> Nuestras alertas y estrategias pueden fallar en ciertos escenarios de mercado.</li>
                <li><strong>Riesgo Geopolítico:</strong> Eventos mundiales pueden causar volatilidad extrema.</li>
                <li><strong>Riesgo Regulatorio:</strong> Cambios legales pueden afectar mercados y acceso.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Lo Que CARVIPIX NO Garantiza</h2>
              <p>
                CARVIPIX es transparente: NO garantizamos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rendimientos específicos o porcentajes de ganancia</li>
                <li>Que nuestras alertas serán precisas o exitosas</li>
                <li>Que nuestras estrategias funcionarán en todas condiciones de mercado</li>
                <li>Protección contra cualquier tipo de pérdida</li>
                <li>Que no perderás dinero usando nuestros servicios</li>
                <li>Ingresos pasivos o &quot;dinero fácil&quot;</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Responsabilidad del Usuario</h2>
              <p>
                Como usuario de CARVIPIX, TIENES RESPONSABILIDAD TOTAL POR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tus decisiones de trading e inversión</li>
                <li>Monitoreo constante de tus posiciones</li>
                <li>Gestión de riesgo en cada operación</li>
                <li>Verificar que eres legalmente elegible para trading</li>
                <li>Cumplimiento fiscal y legal en tu jurisdicción</li>
                <li>Usar stop losses y gestión de capital disciplinada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Recomendaciones Críticas</h2>
              <p>
                Antes de usar servicios de CARVIPIX o cualquier plataforma de trading:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Edúcate en trading y gestión de riesgo</li>
                <li>Comienza con capital que puedas permitirte perder</li>
                <li>Usa stop losses en TODAS las operaciones</li>
                <li>Practica en entorno de bajo riesgo antes de operar capital real</li>
                <li>Diversifica y no apuestes todo a una estrategia</li>
                <li>Consulta asesores financieros si es necesario</li>
                <li>Lee y entiende todos los términos y condiciones</li>
                <li>Mantén registros completos para impuestos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Disponibilidad de Datos Operativos</h2>
              <p>
                CARVIPIX puede mostrar estados de preparación en módulos dependientes de activación operativa:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>La ausencia temporal de métricas no implica fallo técnico</li>
                <li>El rendimiento solo se publica cuando existe operación validada</li>
                <li>No debe inferirse desempeño futuro a partir de estados preliminares</li>
                <li>La información se actualiza conforme a disponibilidad del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Servicios de Gestión de Capital</h2>
              <p>
                Si usas servicios de gestión de capital o fondeo de CARVIPIX:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tu capital asignado ESTÁ EN RIESGO</li>
                <li>CARVIPIX no garantiza retornos</li>
                <li>Las pérdidas pueden ser totales</li>
                <li>Asegúrate de entender completamente los términos específicos del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Conflictos de Interés</h2>
              <p>
                CARVIPIX puede beneficiarse si:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Compras nuestros productos (Bot, membresías)</li>
                <li>Usas servicios de gestión de capital (ganamos comisión sobre ganancias)</li>
                <li>Participas en programas de fondeo</li>
              </ul>
              <p className="mt-4">
                Transparencia: Estos incentivos pueden influir en nuestras recomendaciones. Usa servicios voluntariamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contacto para Consultas</h2>
              <p>
                Si tienes dudas sobre estos riesgos o nuestros servicios, contacta a través de la sección de Soporte antes de invertir.
              </p>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-400 font-semibold">
              🔔 Este documento de divulgación de riesgos es vinculante. Al usar CARVIPIX, reconoces y aceptas TODOS estos riesgos y la falta de garantías aquí expuesta.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
