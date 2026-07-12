"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CancelacionPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#D4AF37] hover:text-[#F5DEB3] transition">
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Política de Cancelación</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 9 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Cancelación de membresías</h2>
              <p>Las membresías recurrentes pueden cancelarse antes de la siguiente renovación. La cancelación detiene cobros futuros, pero no revierte automáticamente periodos ya facturados.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Momento efectivo</h2>
              <p>La cancelación se hace efectiva al cierre del periodo vigente, salvo que CARVIPIX indique otra fecha por escrito en casos especiales de soporte o cumplimiento.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Productos de pago único</h2>
              <p>Los productos de pago único, como licencias o servicios puntuales, no se consideran suscripciones recurrentes y no generan cancelación periódica. Cualquier revisión posterior se rige por la política de reembolsos y por los términos particulares del servicio.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Solicitudes</h2>
              <p>La cancelación debe solicitarse mediante soporte oficial o el canal administrativo habilitado por CARVIPIX. Se recomienda conservar el comprobante de solicitud.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Efecto sobre accesos</h2>
              <p>Una vez concluido el periodo pagado, los accesos premium, alertas, bots y otros beneficios asociados al plan podrán ser limitados o desactivados.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}