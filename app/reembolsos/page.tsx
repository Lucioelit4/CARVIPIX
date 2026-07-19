"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ReembolsosPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#D4AF37] hover:text-[#F5DEB3] transition">
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Política de Reembolso</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 9 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Regla general</h2>
              <p>
                Una vez habilitado el acceso a contenido, alertas, herramientas, licencias o servicios digitales,
                no existen reembolsos automaticos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Excepciones evaluables por error verificable</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cobro duplicado confirmado.</li>
                <li>Fallo confirmado del sistema de pago atribuible al flujo de CARVIPIX.</li>
                <li>Pago correcto sin acceso al servicio contratado por error tecnico verificable de la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Casos normalmente no reembolsables</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Perdidas de trading o expectativas de resultado no cumplidas.</li>
                <li>Servicios digitales entregados o activados correctamente.</li>
                <li>Licencias, accesos o procesos consumidos sin error tecnico atribuible a CARVIPIX.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Plazo y canal</h2>
              <p>
                Las solicitudes deben presentarse por soporte oficial con identificador de orden, fecha, motivo y evidencia.
                CARVIPIX puede requerir informacion adicional para validar el caso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Resolución</h2>
              <p>
                Si una excepcion es aprobada, el ajuste se procesara por el mismo proveedor o canal compatible,
                sujeto a tiempos de pasarela, banco o procesador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Marco de consumidor</h2>
              <p>
                Esta politica se aplica de forma coherente con los derechos del consumidor y la normativa aplicable
                en las jurisdicciones donde CARVIPIX opere.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}