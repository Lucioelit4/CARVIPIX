"use client";

import { useState } from "react";
import { X, Check, CheckCircle, FileText, ClipboardList, Zap, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { validateFondeoForm } from "@/app/lib/form-validators";
import DisclaimerNote from "@/app/components/DisclaimerNote";

export default function FondeoPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", company: "FTMO", agreed: false });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const validationErrors = validateFondeoForm(formData);
    
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
      setFormData({ name: "", email: "", company: "FTMO", agreed: false });
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
                Alto Capital
              </span>
              <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white leading-tight">
                Cuenta Fondeada <span className="text-[#D4AF37]">Gestionada</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-white/80">
                CARVIPIX gestiona el proceso para buscar una cuenta fondeada de alto capital mediante evaluación, seguimiento y control operativo.
              </p>

              {/* Badges */}
              <div className="mt-8 flex flex-wrap gap-3">
                {["Pago único 5,000 USD", "Capital objetivo 200K", "FTMO / TopTier", "30 a 45 días", "Gestión del proceso"].map((badge) => (
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
                  href="/checkout?product=fondeo"
                  className="block w-full rounded-lg bg-[#D4AF37] px-6 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30 text-center"
                >
                  Solicitar revisión
                </Link>
                <a
                  href="#proceso-fondeo"
                  className="block w-full rounded-lg border-2 border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 text-center"
                >
                  Ver proceso
                </a>
              </div>
            </motion.div>

            {/* Card derecho */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="rounded-2xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#11161E] via-[#0B0B0B] to-[#030303] p-8 shadow-2xl shadow-[#D4AF37]/20"
            >
              <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Capital objetivo</h3>
              <p className="mt-4 text-5xl font-black text-white">200,000 USD</p>
              <p className="mt-3 text-sm text-white/60">Servicio de gestión: <span className="font-bold text-[#D4AF37]">5,000 USD</span></p>
              <div className="mt-8 space-y-3 border-t border-white/10 pt-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Evaluación supervisada</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Seguimiento del proceso</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/80">Entrega de credenciales</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Qué recibes */}
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-8"
        >
          Qué recibes
        </motion.h2>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { title: "Revisión inicial", desc: "Análisis de perfil", icon: FileText },
            { title: "Selección", desc: "Empresa compatible", icon: CheckCircle },
            { title: "Análisis", desc: "De reglas operativas", icon: ClipboardList },
            { title: "Seguimiento", desc: "Durante evaluación", icon: TrendingUp },
            { title: "Reportes", desc: "De avance", icon: Zap },
            { title: "Credenciales", desc: "Al completar", icon: Shield },
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
                <p className="font-semibold text-xs mb-1 text-center">{item.title}</p>
                <p className="text-xs text-white/60 text-center">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Proceso CARVIPIX */}
      <div id="proceso-fondeo" className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Proceso CARVIPIX</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "1", title: "Solicitud", desc: "Completa formulario" },
            { step: "2", title: "Revisión", desc: "De políticas" },
            { step: "3", title: "Confirmación", desc: "De empresa" },
            { step: "4", title: "Gestión", desc: "De evaluación" },
            { step: "5", title: "Entrega", desc: "De credenciales" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-4 text-center relative"
            >
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-[#D4AF37]">{item.step}</span>
              </div>
              <p className="font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-xs text-white/60">{item.desc}</p>
              {i < 4 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empresas disponibles */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Empresas disponibles</h2>
        <p className="text-white/60 text-center mb-8 max-w-2xl mx-auto">
          Cada empresa tiene reglas propias. CARVIPIX revisa compatibilidad antes de aceptar el proceso.
        </p>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { name: "FTMO", badge: "Principal" },
            { name: "TopTier Trader", badge: "Principal" },
            { name: "Otra empresa", badge: "Revisión" },
            { name: "Compatibles", badge: "En evaluación" },
          ].map((company) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-6 text-center hover:border-[#D4AF37]/40 transition"
            >
              <p className="font-bold text-lg text-white mb-2">{company.name}</p>
              <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold text-[#D4AF37]">
                {company.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Resultado esperado */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Resultado esperado</h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg border border-[#D4AF37]/20 bg-gradient-to-br from-[#11161E] to-[#0B0B0B] p-8"
        >
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Capital objetivo", value: "200,000 USD", color: "text-[#D4AF37]" },
              { label: "Servicio", value: "5,000 USD", color: "text-white" },
              { label: "Duración", value: "30-45 días", color: "text-green-400" },
              { label: "Entrega", value: "Credenciales", color: "text-[#D4AF37]" },
              { label: "Compatible", value: "Alertas CARVIPIX", color: "text-green-400" },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-[#0B0B0B]/80 border border-[#D4AF37]/20 p-4 text-center">
                <p className="text-xs uppercase text-zinc-400 mb-2 font-semibold">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/70 mt-8 text-center">
            Al completar exitosamente la evaluación, el cliente recibe credenciales para utilizar la cuenta fondeada, sujeto a las reglas de la empresa seleccionada.
          </p>
        </motion.div>
      </div>

      {/* Por qué hacerlo con CARVIPIX */}
      <div className="border-t border-white/10 mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Por qué hacerlo con CARVIPIX</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Seguimiento estructurado", desc: "Proceso supervisado en cada etapa." },
            { title: "Revisión de reglas", desc: "Análisis completo antes de comenzar." },
            { title: "Acompañamiento", desc: "Soporte durante la evaluación." },
            { title: "Disciplina operativa", desc: "Enfoque coherente con CARVIPIX." },
            { title: "Comunicación clara", desc: "Reportes de avance regulares." },
            { title: "Compatible", desc: "Usa alertas CARVIPIX en la evaluación." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/10 bg-[#11161E] p-6 hover:border-[#D4AF37]/40 transition"
            >
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold mb-1">{item.title}</p>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              </div>
            </motion.div>
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
          <h3 className="text-3xl font-bold mb-3">¿Quieres buscar una cuenta fondeada?</h3>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Solicita revisión y CARVIPIX evaluará tu perfil para compatibilidad con empresas de fondeo.
          </p>
          <Link
            href="/checkout?product=fondeo"
            className="inline-block rounded-lg bg-[#D4AF37] px-8 py-4 font-bold text-black transition hover:bg-[#f5d76e] hover:shadow-lg hover:shadow-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/30 text-lg"
          >
            Solicitar revisión
          </Link>
        </motion.div>
      </div>

      {/* Legal */}
      <div className="border-t border-white/10 text-center py-12">
        <div className="max-w-2xl mx-auto">
          <DisclaimerNote variant="payment" className="justify-center" />
        </div>
      </div>

      {/* Modal */}
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
                <p className="text-white/70 mb-4">CARVIPIX evaluará tu perfil y se contactará para revisar compatibilidad con programas de fondeo.</p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowModal(false);
                    setFormData({ name: "", email: "", company: "FTMO", agreed: false });
                  }}
                  className="w-full rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#f5d76e]"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#D4AF37]">Solicitar revisión</h2>
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

                  {/* Empresa */}
                  <div>
                    <select
                      value={formData.company}
                      onChange={(e) => {
                        setFormData({ ...formData, company: e.target.value });
                        if (errors.company) setErrors({ ...errors, company: "" });
                      }}
                      className={`w-full bg-[#0B0B0B] border rounded-lg px-4 py-3 text-white focus:outline-none transition ${
                        errors.company
                          ? "border-red-500/50 focus:border-red-400"
                          : "border-white/10 focus:border-[#D4AF37]"
                      }`}
                    >
                      <option>FTMO</option>
                      <option>TopTier Trader</option>
                      <option>Otra empresa</option>
                    </select>
                  </div>

                  {/* Checkbox de términos */}
                  <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border ${
                    errors.agreed
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-white/5 border-white/10"
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.agreed}
                      onChange={(e) => {
                        setFormData({ ...formData, agreed: e.target.checked });
                        if (errors.agreed) setErrors({ ...errors, agreed: "" });
                      }}
                      className="mt-1 w-4 h-4"
                    />
                    <span className={`text-sm ${errors.agreed ? "text-red-400" : "text-white/70"}`}>
                      Entiendo que la aprobación depende de reglas externas de la empresa seleccionada.
                    </span>
                  </label>
                  {errors.agreed && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.agreed}
                    </p>
                  )}
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
                  Enviar solicitud demo
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
                  Esto es una demostración. CARVIPIX se contactará para revisar compatibilidad.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
