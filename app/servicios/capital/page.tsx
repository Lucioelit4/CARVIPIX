"use client";

import { useState } from "react";
import { X, Check, TrendingUp, BarChart3, Lock, Clock, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const capitalData = [
  { month: "Ene", value: 10000 },
  { month: "Feb", value: 10850 },
  { month: "Mar", value: 11420 },
  { month: "Abr", value: 11100 },
  { month: "May", value: 11920 },
  { month: "Jun", value: 12500 },
  { month: "Jul", value: 12850 },
  { month: "Ago", value: 12450 },
  { month: "Sep", value: 13200 },
  { month: "Oct", value: 13920 },
  { month: "Nov", value: 13650 },
  { month: "Dic", value: 14200 },
];

export default function CapitalPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", amount: "", method: "USDT TRC20" });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!formData.amount || parseInt(formData.amount) < 10000) {
      setError("El monto mínimo para gestión de capital es 10,000 USD.");
      return;
    }
    if (!formData.name || !formData.email) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    alert("Solicitud enviada. CARVIPIX se contactará pronto.");
    setShowModal(false);
    setFormData({ name: "", email: "", amount: "", method: "USDT TRC20" });
  };

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
                Gestión Privada
              </span>
              <h1 className="mt-6 text-5xl font-bold text-white">Capital gestionado CARVIPIX</h1>
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
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30"
                >
                  Solicitar inversión
                </button>
                <button className="w-full rounded-lg border-2 border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5">
                  Ver cómo funciona
                </button>
              </div>
            </motion.div>

            {/* Card derecho */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#11161E] via-[#0B111A] to-[#05070B] p-8 shadow-2xl shadow-[#D4AF37]/20"
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
            { title: "Balance visual", icon: BarChart3 },
            { title: "Reportes claros", icon: FileText },
            { title: "Control exposición", icon: Lock },
            { title: "Gestión disciplinada", icon: Zap },
            { title: "Comunicación privada", icon: Clock },
            { title: "Solo sobre utilidad", icon: TrendingUp },
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
            className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B111A] p-6"
          >
            <h3 className="text-lg font-bold mb-6">Ejemplo demo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/60">Capital asignado</span>
                <span className="font-bold">10,000 USD</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-sm text-white/60">Utilidad generada (demo)</span>
                <span className="font-bold text-green-400">1,000 USD</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-green-400/20 bg-green-400/5 px-3 py-2 rounded">
                <span className="text-sm font-semibold text-green-400">Cliente recibe (60%)</span>
                <span className="font-bold text-green-400">600 USD</span>
              </div>
              <div className="flex justify-between items-center pt-2 px-3 py-2">
                <span className="text-sm font-semibold text-[#D4AF37]">CARVIPIX (40%)</span>
                <span className="font-bold text-[#D4AF37]">400 USD</span>
              </div>
              <p className="text-xs text-white/40 mt-4 text-center">Ejemplo demo para explicar el modelo.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cuenta de ejemplo */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Cuenta de ejemplo</h2>

        <div className="rounded-lg border border-[#D4AF37]/20 bg-[#11161E] p-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Capital asignado", value: "$12,500", color: "text-white" },
              { label: "Balance actual", value: "$13,920", color: "text-green-400" },
              { label: "Utilidad flotante", value: "+$1,420", color: "text-green-400" },
              { label: "Cliente 60%", value: "$852", color: "text-[#D4AF37]" },
              { label: "CARVIPIX 40%", value: "$568", color: "text-white/70" },
              { label: "Rendimiento", value: "+11.36%", color: "text-green-400" },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-[#0B111A] border border-white/10 p-4 text-center">
                <p className="text-xs uppercase text-zinc-400 mb-2">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
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
                  backgroundColor: "#0B111A",
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
            Simulación de crecimiento realista con variaciones normales de mercado.
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
          {["BTC", "USDT TRC20", "USDT ERC20", "USDC"].map((method) => (
            <div key={method} className="rounded-lg border border-white/10 bg-[#11161E] p-6 text-center">
              <p className="font-bold text-lg text-[#D4AF37]">{method}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 text-center mt-4">Métodos demo sujetos a disponibilidad.</p>
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

      {/* Legal */}
      <div className="border-t border-white/10 text-center py-12">
        <p className="text-xs text-white/40 max-w-2xl mx-auto">
          Vista demo. La gestión de capital implica riesgo y los resultados pueden variar. CARVIPIX no garantiza rendimientos específicos. La participación del 40% aplica únicamente sobre utilidades generadas bajo los términos publicados.
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#11161E] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#D4AF37]">Solicitar inversión</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="text-white/40 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0B111A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0B111A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
              />
              <input
                type="number"
                placeholder="Monto (mínimo 10,000 USD)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-[#0B111A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
              />
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full bg-[#0B111A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option>BTC</option>
                <option>USDT TRC20</option>
                <option>USDT ERC20</option>
                <option>USDC</option>
              </select>
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

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] mb-3"
            >
              Enviar solicitud demo
            </button>

            <button
              onClick={() => {
                setShowModal(false);
                setError("");
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-white/30"
            >
              Cancelar
            </button>

            <p className="text-xs text-white/40 text-center mt-6">
              Esto es una demostración. CARVIPIX se contactará para confirmar detalles.
            </p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
