"use client";

import { useState } from "react";
import { X, Check, Zap, BarChart3, Shield, Clock, Bot as BotIcon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import DisclaimerNote from "@/app/components/DisclaimerNote";

export default function BotPage() {
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState(false);

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
                className="mt-10 rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-8 shadow-2xl shadow-[#D4AF37]/20"
              >
                <p className="text-xs uppercase text-[#D4AF37] tracking-widest font-semibold">Precio de compra</p>
                <p className="mt-4 text-6xl font-black text-[#D4AF37]">999.00</p>
                <p className="text-sm text-white/60 mt-1">USD - Pago único - Acceso permanente</p>

                <div className="mt-8 space-y-3">
                  <Link
                    href="/checkout?product=bot"
                    className="block w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-base shadow-lg shadow-[#D4AF37]/30 text-center"
                  >
                    Comprar Bot CARVIPIX
                  </Link>
                  <Link href="#resultados-demo" className="block w-full rounded-lg border-2 border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 text-center">
                    Ver funcionamiento demo
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual derecho - Robot Trader Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-96 rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#11161E] via-[#0B0B0B] to-[#030303] p-8 overflow-hidden shadow-2xl shadow-[#D4AF37]/20"
            >
              {/* Glow effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-20 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              </div>

              {/* Líneas de mercado doradas */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-[#D4AF37] via-transparent to-[#D4AF37]" />
                <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
              </div>

              {/* Contenido del panel */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                  <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Sistema Activo</p>
                </div>

                {/* Robot visual (ASCII-inspired) */}
                <div className="flex items-center justify-center py-6">
                  <div className="relative w-20 h-20">
                    {/* Robot head */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 border-2 border-[#D4AF37] rounded-lg flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      </div>
                    </div>
                    {/* Robot body */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-[#D4AF37] rounded shadow-lg shadow-[#D4AF37]/20" />
                  </div>
                </div>

                {/* Control panels */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "BUY", color: "border-green-400 text-green-400" },
                    { label: "SELL", color: "border-red-400 text-red-400" },
                    { label: "RISK", color: "border-[#D4AF37] text-[#D4AF37]" },
                    { label: "MT5", color: "border-blue-400 text-blue-400" },
                  ].map((btn) => (
                    <div
                      key={btn.label}
                      className={`border ${btn.color} rounded px-2 py-1 text-xs font-bold text-center cursor-pointer hover:shadow-lg transition`}
                    >
                      {btn.label}
                    </div>
                  ))}
                </div>

                {/* Bottom metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="border border-white/10 rounded bg-[#0B0B0B]/60 px-2 py-1">
                    <p className="text-white/50">Operaciones</p>
                    <p className="font-bold text-[#D4AF37]">64</p>
                  </div>
                  <div className="border border-white/10 rounded bg-[#0B0B0B]/60 px-2 py-1">
                    <p className="text-white/50">Win Rate</p>
                    <p className="font-bold text-green-400">71%</p>
                  </div>
                  <div className="border border-white/10 rounded bg-[#0B0B0B]/60 px-2 py-1">
                    <p className="text-white/50">Rendimiento</p>
                    <p className="font-bold text-green-400">+12.8%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Qué hace el bot */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-8"
        >
          Qué hace el Bot CARVIPIX
        </motion.h2>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
                className="rounded-lg border border-white/10 bg-[#11161E] p-4 text-center hover:border-[#D4AF37]/40 transition"
              >
                <Icon className="w-6 h-6 mx-auto text-[#D4AF37] mb-2" />
                <p className="font-semibold text-xs">{item.title}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Resultados Demo */}
      <div id="resultados-demo" className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold text-[#D4AF37] uppercase">
            Datos demo
          </span>
          <h2 className="mt-4 text-3xl font-bold">Resultados Demo del Bot</h2>
        </motion.div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Rendimiento", value: "+12.8%", color: "text-green-400" },
            { label: "Operaciones", value: "64", color: "text-[#D4AF37]" },
            { label: "Win Rate", value: "71%", color: "text-[#D4AF37]" },
            { label: "Drawdown", value: "5.4%", color: "text-white" },
            { label: "Estado", value: "Activo", color: "text-green-400" },
            { label: "Modo", value: "Demo", color: "text-white/70" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-4 text-center hover:border-[#D4AF37]/40 transition"
            >
              <p className="text-xs uppercase text-zinc-400 mb-2">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Panel de Control */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Panel de Control Demo</h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-b from-[#11161E] to-[#0B0B0B] p-6"
        >
          {/* Mini gráfico */}
          <div className="mb-6 h-20 rounded-lg border border-white/10 bg-[#0B0B0B] p-4 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
              <polyline
                points="0,45 20,40 40,35 60,30 80,25 100,20 120,18 140,22 160,20 180,15 200,10"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              <polyline
                points="0,50 20,48 40,45 60,40 80,35 100,32 120,35 140,38 160,35 180,32 200,30"
                fill="none"
                stroke="#00D084"
                strokeWidth="1"
                opacity="0.5"
              />
            </svg>
            <p className="absolute bottom-1 right-2 text-xs text-white/40">Mercado simulado</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Estado del bot", value: "Operando", status: "success" },
              { title: "Última operación", value: "XAUUSD", status: "neutral" },
              { title: "Riesgo actual", value: "Bajo", status: "success" },
              { title: "Mercado", value: "En seguimiento", status: "success" },
              { title: "Próxima revisión", value: "12:45 UTC", status: "neutral" },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-[#0B0B0B] border border-white/10 p-4">
                <p className="text-xs uppercase text-zinc-400 mb-2">{item.title}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${
                    item.status === "success" ? "text-green-400" : "text-[#D4AF37]"
                  }`}>
                    {item.value}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === "success" ? "bg-green-400" : "bg-[#D4AF37]"
                  } animate-pulse`} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 mt-6 text-center">
            Simulación de demostración. El bot trabajaría automáticamente en MT4/MT5 conectado a una cuenta real.
          </p>
        </motion.div>
      </div>

      {/* Compra y Actualizaciones */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8">Compra y Actualizaciones</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-white/10 bg-[#11161E] p-6"
          >
            <h3 className="text-lg font-bold mb-4">El Bot Cuesta</h3>
            <div className="space-y-3 text-white/80">
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>999.00 USD</strong> - Acceso permanente.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>Compra separada</strong> de membresía.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>Elite NO incluye</strong> el bot.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-white/10 bg-[#11161E] p-6"
          >
            <h3 className="text-lg font-bold mb-4">Actualizaciones</h3>
            <div className="space-y-3 text-white/80">
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>Sin membresía:</strong> Bot fijo.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>Con Elite:</strong> Actualizaciones continuas.</p>
              </div>
              <div className="flex gap-3">
                <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-sm"><strong>Cambios críticos:</strong> Sin membresía.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sección de operación sin pantalla */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-r from-[#11161E] to-[#0B0B0B] p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-3">
            Diseñado para operar sin estar pegado a la pantalla
          </h3>
          <p className="text-white/70 max-w-2xl mx-auto">
            El bot ejecuta reglas configuradas en MT4/MT5 mientras mantiene parámetros de riesgo definidos por el usuario.
          </p>
        </motion.div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Preguntas Frecuentes</h2>

        <div className="space-y-3 max-w-3xl mx-auto">
          {[
            {
              q: "¿Funciona en MT4 y MT5?",
              a: "Sí. Diseñado para ambas plataformas. Compatible con mayoría de brokers.",
            },
            {
              q: "¿La membresía Elite incluye el bot?",
              a: "No. Producto separado (999 USD). Elite (150/mes) añade actualizaciones.",
            },
            {
              q: "¿Necesito estar conectado todo el día?",
              a: "No. Corre en tu servidor MT4/MT5. Ejecuta reglas automáticamente.",
            },
            {
              q: "¿Qué pasa con las actualizaciones?",
              a: "Sin membresía: bot fijo. Con Elite: actualizaciones continuas. Cambios críticos sin membresía.",
            },
            {
              q: "¿El bot garantiza ganancias?",
              a: "No. Automatiza reglas pero el mercado implica riesgo. Resultados varían.",
            },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-4"
            >
              <h3 className="text-sm font-bold text-[#D4AF37] mb-2">{faq.q}</h3>
              <p className="text-white/70 text-xs leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Legal */}
      <div className="border-t border-white/10 text-center py-12">
        <div className="max-w-2xl mx-auto">
          <DisclaimerNote variant="bot" className="justify-center" />
        </div>
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

            {accepted ? (
              <Link
                href="/checkout?product=bot"
                className="block w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] text-lg mb-3 text-center"
              >
                Continuar compra demo
              </Link>
            ) : (
              <button
                disabled
                className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-3"
              >
                Continuar compra demo
              </button>
            )}

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
