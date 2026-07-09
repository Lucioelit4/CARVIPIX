"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PagosRecurrentesPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#D4AF37] hover:text-[#F5DEB3] transition">
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-8 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">Consentimiento para Pagos Recurrentes</h1>
          <p className="text-zinc-400 mb-8">Última actualización: 9 de julio de 2026</p>

          <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Autorización</h2>
              <p>Al contratar una membresía recurrente, el cliente autoriza a CARVIPIX y a la pasarela de pago correspondiente a realizar cobros periódicos según la frecuencia, moneda y precio informados en el checkout oficial.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Información visible antes del cobro</h2>
              <p>Antes de confirmar una suscripción recurrente, CARVIPIX debe mostrar precio, periodicidad, moneda, producto y condiciones relevantes de cancelación.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Renovaciones</h2>
              <p>Las renovaciones se ejecutan conforme al proveedor de pago seleccionado y a la disponibilidad del método autorizado. Cualquier fallo de cobro puede suspender o limitar el acceso premium hasta regularización.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Revocación</h2>
              <p>El consentimiento para cobros futuros puede revocarse mediante cancelación de la suscripción antes de la siguiente fecha de renovación, conforme a la política de cancelación vigente.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Comprobantes y soporte</h2>
              <p>CARVIPIX podrá emitir comprobantes, confirmaciones o notificaciones relacionadas con cobros recurrentes a través de los canales de contacto registrados por el cliente.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}