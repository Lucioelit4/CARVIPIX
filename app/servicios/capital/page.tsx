"use client";

import { useState } from "react";
import { X, Check, TrendingUp, BarChart3, Lock, Clock, FileText, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { validateCapitalForm } from "@/app/lib/form-validators";
import DisclaimerNote from "@/app/components/DisclaimerNote";

const capitalData: Array<{ month: string; value: number }> = [];

export default function CapitalPage() {
  const [showModal, setShowModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", amount: "", method: "USDT TRC20" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const validationErrors = validateCapitalForm(formData);
    
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(errorMap);
      return;
    }
    
    setErrors({});
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowModal(false);
      setFormData({ name: "", email: "", amount: "", method: "USDT TRC20" });
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      {/* Hero Comercial */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Contenido izquierdo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Gestión Privada
              </span>
              <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white leading-tight">Capital Gestionado <span className="text-[#D4AF37]">CARVIPIX</span></h1>
              <p className="mt-6 text-lg leading-relaxed text-white/80">
                Asigna capital a una gestión privada con seguimiento visual, reportes claros y participación alineada a resultados.
              </p>

              {/* Badges */}
              <div className="mt-8 flex flex-wrap gap-3">
                {["Desde 10,000 USD", "Hasta 1,000,000 USD", "Asignación en crypto", "40% solo sobre utilidades", "Seguimiento privado"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2 text-xs font-semibold text-[#D4AF37]"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  href="/checkout?product=capital"
                  className="block w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30 text-center"
                >
                  Solicitar inversión
                </Link>
                <button
                  onClick={() => setShowHowItWorks(true)}
                  className="w-full rounded-lg border-2 border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5">
                  Ver cómo funciona
                </button>
              </div>
            </motion.div>

            {/* Card derecho */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#11161E] via-[#0B0B0B] to-[#030303] p-8 shadow-2xl shadow-[#D4AF37]/20"
            >
              <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Rango de asignación</h3>
              <p className="mt-4 text-4xl font-bold text-white">10,000 - 1,000,000 USD</p>
              <p className="mt-3 text-sm text-white/60">BTC, USDT TRC20 y opciones compatibles</p>
              <div className="mt-8 space-y-3 border-t border-white/10 pt-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Monto mínimo: 10,000 USD</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Pago en crypto seguro</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Participación 40% utilidades</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Por qué confiar */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-8"
        >
          Por qué confiar
        </motion.h2>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { title: "Balance visual", desc: "Consulta evolución y movimientos.", icon: BarChart3 },
            { title: "Reportes claros", desc: "Información por periodo.", icon: FileText },
            { title: "Control exposición", desc: "Gestión disciplinada de riesgo.", icon: Lock },
            { title: "Gestión disciplinada", desc: "Metodología interna supervisada.", icon: Zap },
            { title: "Comunicación privada", desc: "Acompañamiento directo.", icon: Clock },
            { title: "Solo sobre utilidad", desc: "CARVIPIX participa si hay utilidad.", icon: TrendingUp },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-lg border border-white/10 bg-[#11161E] p-4 hover:border-[#D4AF37]/40 transition"
              >
                <Icon className="w-6 h-6 mx-auto text-[#D4AF37] mb-2" />
                <p className="font-semibold text-xs mb-1">{item.title}</p>
                <p className="text-xs text-white/60">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modelo de participación */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8">Modelo de participación</h2>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-white/10 bg-[#11161E] p-6"
          >
            <h3 className="text-lg font-bold mb-4">Cómo funciona</h3>
            <div className="space-y-3 text-sm text-white/80">
              <div>
                <p className="font-semibold text-white">El capital pertenece al cliente</p>
                <p className="text-xs mt-1">Tu dinero siempre es tuyo.</p>
              </div>
              <div>
                <p className="font-semibold text-white">CARVIPIX gestiona el proceso</p>
                <p className="text-xs mt-1">Aplicamos metodología operativa interna.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Utilidades pueden variar</p>
                <p className="text-xs mt-1">Según condiciones de mercado.</p>
              </div>
              <div>
                <p className="font-semibold text-white">Participación sobre utilidad</p>
                <p className="text-xs mt-1">CARVIPIX cobra 40%, cliente recibe 60%.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B0B0B] p-6"
          >
            <h3 className="text-lg font-bold mb-6">Distribución de utilidades</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/60">Capital asignado</span>
                <span className="font-bold">Se confirma al activar el servicio</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/60">Utilidad generada</span>
                <span className="font-bold text-green-400">Se refleja tras cierre operativo</span>
              </div>
              
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden my-4 border border-white/10">
                <div className="flex-1 bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white text-center">60%</span>
                </div>
                <div className="flex-0 w-2/5 bg-gradient-to-r from-[#D4AF37] to-[#c19817] flex items-center justify-center">
                  <span className="text-xs font-bold text-black text-center">40%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-green-400/20 bg-green-400/5 px-3 py-2 rounded">
                <span className="text-sm font-semibold text-green-400">Cliente recibe (60%)</span>
                <span className="font-bold text-green-400">Según utilidad verificada</span>
              </div>
              <div className="flex justify-between items-center pt-2 px-3 py-2 bg-[#D4AF37]/5 rounded">
                <span className="text-sm font-semibold text-[#D4AF37]">CARVIPIX (40%)</span>
                <span className="font-bold text-[#D4AF37]">Según utilidad verificada</span>
              </div>
              <p className="text-xs text-white/40 mt-4 text-center">Distribución sujeta a resultados reales y términos vigentes.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Estado de cuenta */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Estado de cuenta</h2>

        <div className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B0B0B] p-6">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Capital asignado", value: "Disponible al activar", color: "text-white" },
              { label: "Balance actual", value: "Se muestra con datos operativos", color: "text-green-400" },
              { label: "Utilidad flotante", value: "Se actualiza en tiempo real", color: "text-green-400" },
              { label: "Cliente 60%", value: "Calculado por periodo", color: "text-green-400" },
              { label: "CARVIPIX 40%", value: "Calculado por periodo", color: "text-[#D4AF37]" },
              { label: "Rendimiento", value: "Disponible al consolidar resultados", color: "text-green-400" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-lg bg-[#0B0B0B]/80 border border-[#D4AF37]/20 p-4 text-center hover:border-[#D4AF37]/40 transition"
              >
                <p className="text-xs uppercase text-zinc-400 mb-2 font-semibold">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfica de evolución */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8">Evolución de capital</h2>

        <div className="rounded-lg border border-white/10 bg-[#11161E] p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={capitalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0B0B",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-white/40 text-center mt-4">
            El gráfico se habilita automáticamente cuando existan reportes operativos consolidados.
          </p>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Cómo funciona</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "1", title: "Solicitud", desc: "Completa formulario de revisión" },
            { step: "2", title: "Confirmación", desc: "Confirma monto y método crypto" },
            { step: "3", title: "Cuenta activa", desc: "Se activa seguimiento privado" },
            { step: "4", title: "Gestión", desc: "CARVIPIX maneja la operativa" },
            { step: "5", title: "Reportes", desc: "Revisa balance y movimientos" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-4 text-center"
            >
              <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-[#D4AF37]">{item.step}</span>
              </div>
              <p className="font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-xs text-white/60">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Métodos de asignación */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8">Métodos de asignación</h2>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { name: "BTC", symbol: "₿" },
            { name: "USDT TRC20", symbol: "⚡" },
            { name: "USDT ERC20", symbol: "◆" },
            { name: "USDC", symbol: "U" },
          ].map((method) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-6 text-center hover:border-[#D4AF37]/40 transition"
            >
              <div className="text-4xl text-[#D4AF37] mb-2 opacity-60">{method.symbol}</div>
              <p className="font-bold text-sm text-white">{method.name}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-white/40 text-center mt-4">Métodos sujetos a disponibilidad operativa.</p>
      </div>

      {/* Transparencia */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Transparencia</h2>

        <div className="grid gap-4 md:grid-cols-5">
          {[
            "Sin cobro sobre capital inicial",
            "Participación solo en utilidades",
            "Reportes visibles",
            "Seguimiento privado",
            "Control operativo",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-[#11161E] p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg border border-[#D4AF37]/30 bg-gradient-to-r from-[#11161E] to-[#0B0B0B] p-8 text-center"
        >
          <h3 className="text-3xl font-bold mb-3">¿Listo para solicitar revisión?</h3>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Envía una solicitud y revisaremos monto, método y disponibilidad.
          </p>
          <Link
            href="/checkout?product=capital"
            className="inline-block rounded-lg bg-[#D4AF37] px-8 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30 text-lg"
          >
            Solicitar inversión
          </Link>
        </motion.div>
      </div>

      {/* Legal */}
      <div className="border-t border-white/10 text-center py-12">
        <div className="max-w-2xl mx-auto">
          <DisclaimerNote variant="capital" className="justify-center" />
        </div>
      </div>

      {/* Modal Ver cómo funciona */}
      {showHowItWorks && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#11161E] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-[#D4AF37]">Ver cómo funciona</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-white/40 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* 5 Pasos */}
            <div className="space-y-6 mb-8">
              {[
                {
                  step: 1,
                  title: "Solicitud de inversión",
                  desc: "Completas el formulario con tu nombre, correo, monto (10k-1M USD) y método de pago en crypto."
                },
                {
                  step: 2,
                  title: "Revisión y confirmación",
                  desc: "CARVIPIX valida tu solicitud, confirma disponibilidad y te contacta con detalles del proceso."
                },
                {
                  step: 3,
                  title: "Asignación en crypto",
                  desc: "Transfieres el capital en BTC, USDT u otra cripto soportada. Tu dinero es recibido en cuenta de gestión."
                },
                {
                  step: 4,
                  title: "Gestión privada",
                  desc: "CARVIPIX aplica su metodología operativa. Tienes seguimiento visual y reportes periódicos privados."
                },
                {
                  step: 5,
                  title: "Reportes y seguimiento",
                  desc: "Accedes a balance actual, evolución, utilidades y movimientos. Recibes participación del 60% en utilidades generadas."
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="rounded-lg border border-white/10 bg-[#0B0B0B] p-5"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-[#D4AF37]">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">{item.title}</p>
                      <p className="text-sm text-white/70">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Información clave */}
            <div className="border-t border-white/10 pt-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-white">Información clave</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-[#0B0B0B] border border-white/10 p-4">
                  <p className="text-xs text-white/60 mb-2">Montos permitidos</p>
                  <p className="text-xl font-bold text-[#D4AF37]">10,000 - 1,000,000 USD</p>
                </div>
                <div className="rounded-lg bg-[#0B0B0B] border border-white/10 p-4">
                  <p className="text-xs text-white/60 mb-2">Tu participación</p>
                  <p className="text-xl font-bold text-green-400">60% de utilidades</p>
                </div>
                <div className="rounded-lg bg-[#0B0B0B] border border-white/10 p-4">
                  <p className="text-xs text-white/60 mb-2">CARVIPIX participa</p>
                  <p className="text-xl font-bold text-[#D4AF37]">40% solo sobre utilidades</p>
                </div>
                <div className="rounded-lg bg-[#0B0B0B] border border-white/10 p-4">
                  <p className="text-xs text-white/60 mb-2">Tu capital inicial</p>
                  <p className="text-xl font-bold text-white">Sin cobros, siempre tuyo</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 mb-6">
              <DisclaimerNote variant="capital" />
            </div>

            {/* Botón */}
            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal Solicitud */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#11161E] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">¡Solicitud enviada!</h3>
                <p className="text-white/70 mb-4">CARVIPIX se contactará pronto para confirmar los detalles de tu inversión.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowModal(false);
                    setFormData({ name: "", email: "", amount: "", method: "USDT TRC20" });
                  }}
                  className="w-full rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#f5d76e]"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#D4AF37]">Solicitar inversión</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setErrors({});
                    }}
                    className="text-white/40 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Nombre */}
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      className={`w-full bg-[#0B0B0B] border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                        errors.name
                          ? "border-red-500/50 focus:border-red-400"
                          : "border-white/10 focus:border-[#D4AF37]"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      className={`w-full bg-[#0B0B0B] border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                        errors.email
                          ? "border-red-500/50 focus:border-red-400"
                          : "border-white/10 focus:border-[#D4AF37]"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Monto */}
                  <div>
                    <input
                      type="number"
                      placeholder="Monto (mínimo 10,000 USD)"
                      value={formData.amount}
                      onChange={(e) => {
                        setFormData({ ...formData, amount: e.target.value });
                        if (errors.amount) setErrors({ ...errors, amount: "" });
                      }}
                      className={`w-full bg-[#0B0B0B] border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                        errors.amount
                          ? "border-red-500/50 focus:border-red-400"
                          : "border-white/10 focus:border-[#D4AF37]"
                      }`}
                    />
                    {errors.amount && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Método */}
                  <div>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className={`w-full bg-[#0B0B0B] border rounded-lg px-4 py-3 text-white focus:outline-none transition ${
                        errors.method
                          ? "border-red-500/50 focus:border-red-400"
                          : "border-white/10 focus:border-[#D4AF37]"
                      }`}
                    >
                      <option>BTC</option>
                      <option>USDT TRC20</option>
                      <option>USDT ERC20</option>
                      <option>USDC</option>
                    </select>
                  </div>

                  {/* Checkbox de términos */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4"
                      defaultChecked
                    />
                    <span className="text-sm text-white/70">
                      Entiendo que los resultados pueden variar según condiciones de mercado.
                    </span>
                  </label>
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex gap-3">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-semibold mb-1">Hay errores en el formulario</p>
                      <ul className="text-xs text-red-400/80 space-y-0.5">
                        {Object.values(errors).map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] mb-3 disabled:opacity-50"
                  disabled={Object.keys(errors).length > 0}
                >
                  Enviar solicitud
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-white/30"
                >
                  Cancelar
                </button>

                <p className="text-xs text-white/40 text-center mt-6">
                  CARVIPIX se contactará para confirmar detalles y próximos pasos.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
