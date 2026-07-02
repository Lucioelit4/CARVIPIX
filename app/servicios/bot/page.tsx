"use client";

import { useState } from "react";
import { X, Check, Zap, BarChart3, Shield, Clock, Bot as BotIcon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function BotPage() {
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      {/* Hero Comercial */}
      <div className="border-b border-white/10 bg-gradient-to-b from-[#0B111A] to-[#05070B] px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Contenido izquierdo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Producto Premium
              </span>
              <h1 className="mt-6 text-5xl font-bold text-[#D4AF37]">Bot CARVIPIX</h1>
              <p className="mt-6 text-lg leading-relaxed text-white/80">
                Automatización premium para MT4/MT5, diseñada para ejecutar reglas operativas con gestión de riesgo y seguimiento estructurado.
              </p>

              {/* Badges */}
              <div className="mt-8 flex flex-wrap gap-3">
                {["MT4 / MT5", "Pago único", "Gestión de riesgo", "Actualizaciones Elite"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-2 text-xs font-semibold text-[#D4AF37]"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Card de precio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-10 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-8"
              >
                <p className="text-sm uppercase text-[#D4AF37] tracking-wider">Precio</p>
                <p className="mt-3 text-5xl font-bold text-[#D4AF37]">999.00 USD</p>
                <p className="mt-2 text-sm text-white/60">Pago único - Acceso permanente</p>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] text-lg"
                  >
                    Comprar Bot CARVIPIX
                  </button>
                  <button className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-4 font-semibold text-white transition hover:border-[#D4AF37]/40 hover:bg-white/10">
                    Ver funcionamiento demo
                  </button>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual derecho - Panel futurista */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-96 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B111A] p-8 overflow-hidden"
            >
              {/* Líneas de background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#D4AF37]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#D4AF37]/5 rounded-full blur-3xl" />
              </div>

              {/* Contenido del panel */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-sm font-semibold text-[#D4AF37]">SISTEMA ACTIVO</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg bg-[#0B111A]/80 border border-white/10 p-4">
                    <p className="text-xs text-white/50 uppercase">Rendimiento simulado</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">+12.8%</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#0B111A]/80 border border-white/10 p-3">
                      <p className="text-xs text-white/50">Operaciones</p>
                      <p className="text-xl font-bold mt-1">64</p>
                    </div>
                    <div className="rounded-lg bg-[#0B111A]/80 border border-white/10 p-3">
                      <p className="text-xs text-white/50">Win Rate</p>
                      <p className="text-xl font-bold text-[#D4AF37] mt-1">71%</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/40 mt-4">Modo: Simulación premium</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Qué hace el bot */}
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Qué hace el Bot CARVIPIX
        </motion.h2>

        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { title: "Ejecuta reglas", icon: Zap },
            { title: "Gestiona riesgo", icon: Shield },
            { title: "Busca oportunidades", icon: TrendingUp },
            { title: "Registra actividad", icon: BarChart3 },
            { title: "MT4 / MT5", icon: BotIcon },
            { title: "Actualizaciones futuras", icon: Clock },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-xl border border-white/10 bg-[#11161E] p-6 text-center hover:border-[#D4AF37]/40 transition"
              >
                <Icon className="w-8 h-8 mx-auto text-[#D4AF37] mb-4" />
                <p className="font-semibold text-sm">{item.title}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Resultados Demo */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold text-[#D4AF37] uppercase">
            Datos demo
          </span>
          <h2 className="mt-6 text-4xl font-bold">Resultados Demo del Bot</h2>
        </motion.div>

        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Rendimiento", value: "+12.8%", color: "text-green-400" },
            { label: "Operaciones", value: "64", color: "text-[#D4AF37]" },
            { label: "Win Rate", value: "71%", color: "text-[#D4AF37]" },
            { label: "Drawdown", value: "5.4%", color: "text-white" },
            { label: "Estado", value: "Activo", color: "text-green-400" },
            { label: "Modo", value: "Simulación", color: "text-white/70" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-xl border border-white/10 bg-[#11161E] p-6 text-center hover:border-[#D4AF37]/40 transition"
            >
              <p className="text-xs uppercase text-zinc-400 mb-3">{item.label}</p>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Panel de Control */}
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="text-4xl font-bold mb-12 text-center">Panel de Control Demo</h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-[#D4AF37]/20 bg-[#11161E]/80 p-8"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Estado del bot", value: "Operando", status: "success" },
              { title: "Última operación", value: "XAUUSD", status: "neutral" },
              { title: "Riesgo actual", value: "Bajo", status: "success" },
              { title: "Mercado", value: "En seguimiento", status: "success" },
              { title: "Próxima revisión", value: "12:45 UTC", status: "neutral" },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-[#0B111A] border border-white/10 p-6">
                <p className="text-xs uppercase text-zinc-400 mb-3">{item.title}</p>
                <p className={`text-lg font-bold ${
                  item.status === "success" ? "text-green-400" : "text-[#D4AF37]"
                }`}>
                  {item.value}
                </p>
                <div className={`mt-3 w-2 h-2 rounded-full ${
                  item.status === "success" ? "bg-green-400" : "bg-[#D4AF37]"
                } animate-pulse`} />
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 mt-8 text-center">
            Simulación de demostración. El bot trabajaría automáticamente en una cuenta real conectada a MT4/MT5.
          </p>
        </motion.div>
      </div>

      {/* Compra y Actualizaciones */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="text-4xl font-bold mb-12">Compra y Actualizaciones</h2>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-white/10 bg-[#11161E] p-8"
          >
            <h3 className="text-xl font-bold mb-6">El Bot Cuesta</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm"><strong>999.00 USD pago único</strong> - Acceso permanente al bot.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm"><strong>Se compra por separado</strong> de la membresía.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm"><strong>Membresía Elite</strong> (150 USD/mes) NO incluye el bot.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-white/10 bg-[#11161E] p-8"
          >
            <h3 className="text-xl font-bold mb-6">Actualizaciones</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <p className="text-sm"><strong>Sin membresía:</strong> Conservas el bot fijo adquirido.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <p className="text-sm"><strong>Con membresía Elite:</strong> Acceso a actualizaciones continuas.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <p className="text-sm"><strong>Cambios críticos de mercado:</strong> CARVIPIX puede liberar actualización sin membresía.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="text-4xl font-bold mb-12 text-center">Preguntas Frecuentes</h2>

        <div className="space-y-6 max-w-3xl mx-auto">
          {[
            {
              q: "¿Funciona en MT4 y MT5?",
              a: "Sí. El Bot CARVIPIX está diseñado para ambas plataformas. Compatible con la mayoría de brokers.",
            },
            {
              q: "¿La membresía Elite incluye el bot?",
              a: "No. El bot es un producto separado con pago único de 999 USD. La membresía Elite (150 USD/mes) añade acceso a actualizaciones continuas.",
            },
            {
              q: "¿Necesito estar conectado todo el día?",
              a: "No. El bot corre en tu servidor de MT4/MT5. Si está instalado correctamente, ejecuta reglas automáticamente.",
            },
            {
              q: "¿Qué pasa con las actualizaciones?",
              a: "Sin membresía conservas el bot fijo. Con Elite recibes actualizaciones continuas. Cambios críticos del mercado pueden distribuirse sin membresía.",
            },
            {
              q: "¿El bot garantiza ganancias?",
              a: "No. El bot automatiza reglas operativas, pero el mercado implica riesgo. Los resultados pueden variar según condiciones y uso.",
            },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-6"
            >
              <h3 className="text-lg font-bold text-[#D4AF37] mb-3">{faq.q}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Legal */}
      <div className="border-t border-white/10 text-center py-12">
        <p className="text-xs text-white/40 max-w-2xl mx-auto">
          Vista demo. El Bot CARVIPIX automatiza reglas operativas y no garantiza resultados específicos. El trading implica riesgo. Consulta nuestros términos y condiciones antes de comprar.
        </p>
      </div>

      {/* Modal de Compra */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#11161E] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]">Bot CARVIPIX</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-3xl font-bold text-white mb-2">999.00 USD</p>
              <p className="text-sm text-white/60">Pago único - Acceso permanente</p>
            </div>

            <div className="space-y-4 mb-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-white/70">
                  Acepto los <span className="text-[#D4AF37] font-semibold">términos y condiciones</span> y confirmo que entiendo que el bot automatiza reglas y no garantiza ganancias.
                </span>
              </label>
            </div>

            <button
              disabled={!accepted}
              className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-3"
            >
              Continuar compra demo
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-white/30"
            >
              Cancelar
            </button>

            <p className="text-xs text-white/40 text-center mt-6">
              Esto es una demostración. No se procesa pago real en este momento.
            </p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
