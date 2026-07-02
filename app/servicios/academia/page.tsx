"use client";

import BackToDashboard from "../../components/BackToDashboard";
import { motion } from "framer-motion";
import { useState } from "react";
import { BookOpen, Target, Shield, Brain, TrendingUp, Check, X, CheckCircle, AlertCircle } from "lucide-react";
import { validateAcademiaForm } from "@/app/lib/form-validators";
import DisclaimerNote from "@/app/components/DisclaimerNote";

export default function ServiciosAcademiaPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", correo: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const validationErrors = validateAcademiaForm(formData);
    
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
      setFormData({ nombre: "", correo: "" });
    }, 2500);
  };

  const modules = [
    {
      icon: BookOpen,
      title: "Fundamentos de Trading",
      desc: "Conceptos esenciales, terminología y principios de mercado.",
    },
    {
      icon: Shield,
      title: "Gestión de Riesgo",
      desc: "Stop loss, position sizing, ruina del jugador y capital preservation.",
    },
    {
      icon: TrendingUp,
      title: "Lectura de Alertas",
      desc: "Cómo interpretar señales, contexto operativo y decisiones de entrada.",
    },
    {
      icon: Target,
      title: "Uso de CARVIPIX",
      desc: "Herramientas, automatización, bot y optimización de workflow.",
    },
    {
      icon: Brain,
      title: "Psicología Operativa",
      desc: "Gestión emocional, disciplina, drawdowns y recuperación mental.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <BackToDashboard />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#05070B] p-8 sm:p-12 shadow-2xl shadow-black/40">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Contenido Izquierdo */}
              <div>
                <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37] mb-6">
                  Academia CARVIPIX
                </p>
                <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                  Formación Profesional en Trading
                </h1>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  Aprende los fundamentos, gestión de riesgo, análisis de mercado y psicología operativa con un enfoque práctico, disciplinado y sin promesas falsas.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => setShowModal(true)}
                    className="rounded-lg bg-[#D4AF37] px-8 py-4 font-bold text-black transition hover:bg-[#F5DEB3] shadow-lg shadow-[#D4AF37]/30"
                  >
                    Únete a la Lista de Espera
                  </button>
                  <button className="rounded-lg border-2 border-[#D4AF37]/40 bg-white/5 px-8 py-4 font-semibold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/5">
                    Ver Roadmap
                  </button>
                </div>
              </div>

              {/* Card Derecha */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/15 to-[#D4AF37]/5 p-8 backdrop-blur-sm"
              >
                <div className="mb-6">
                  <p className="text-sm uppercase tracking-widest text-[#D4AF37] font-semibold">
                    Estado
                  </p>
                  <p className="mt-2 text-4xl font-bold text-[#D4AF37]">Próximamente</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-400">Apertura anticipada</p>
                    <p className="text-lg font-semibold text-white mt-1">Q3 2026</p>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-zinc-400">Modalidad</p>
                    <p className="text-lg font-semibold text-white mt-1">100% Online</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Módulos Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8">Módulos de Contenido</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-[#0B1220]/80 p-6 hover:border-[#D4AF37]/50 transition group"
                >
                  <Icon className="w-8 h-8 text-[#D4AF37] mb-3 group-hover:scale-110 transition" />
                  <h3 className="text-lg font-semibold text-white mb-3">{mod.title}</h3>
                  <p className="text-sm text-zinc-400">{mod.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Detalles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid gap-6 md:grid-cols-3 mb-12"
        >
          <div className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-8">
            <h3 className="text-xl font-semibold text-white mb-4">Enfoque</h3>
            <p className="text-zinc-300 leading-relaxed">
              Educación sin promesas falsas. Énfasis en disciplina, gestión de riesgo y desarrollo de habilidades reales.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-8">
            <h3 className="text-xl font-semibold text-white mb-4">Estructura</h3>
            <p className="text-zinc-300 leading-relaxed">
              Módulos progresivos con casos prácticos, ejercicios operativos y seguimiento personalizado.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-8">
            <h3 className="text-xl font-semibold text-white mb-4">Objetivo</h3>
            <p className="text-zinc-300 leading-relaxed">
              Prepararte como operador disciplinado, con herramientas CARVIPIX integradas y mentalidad correcta.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 p-12 text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Lista de Espera Abierta</h2>
          <p className="text-zinc-300 max-w-2xl mx-auto mb-8">
            Sé de los primeros en acceder a CARVIPIX Academia. Recibirás actualizaciones de desarrollo, oportunidades de testeo y ofertas especiales.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-[#D4AF37] px-8 py-4 font-bold text-black transition hover:bg-[#F5DEB3] shadow-lg shadow-[#D4AF37]/30"
          >
            Registrarse Ahora
          </button>
        </motion.div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
          <DisclaimerNote variant="academy" className="justify-center" />
        </div>
      </div>

      {/* Modal Notificarme */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Únete a la Lista</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
                className="rounded-full p-1 hover:bg-white/10 transition"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="mb-4 flex justify-center"
                >
                  <div className="rounded-full bg-green-500/20 p-3">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  ¡Registro Confirmado!
                </h3>
                <p className="text-zinc-300 mb-6">
                  Recibirás actualizaciones sobre CARVIPIX Academia en tu correo.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowModal(false);
                    setFormData({ nombre: "", correo: "" });
                  }}
                  className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-bold text-black transition hover:bg-[#F5DEB3]"
                >
                  Entendido
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    errors.nombre ? "text-red-400" : "text-zinc-300"
                  }`}>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      if (errors.nombre) setErrors({ ...errors, nombre: "" });
                    }}
                    placeholder="Abraham B."
                    className={`w-full rounded-lg bg-white/5 border px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                      errors.nombre
                        ? "border-red-500/50 focus:border-red-400"
                        : "border-white/10 focus:border-[#D4AF37]"
                    }`}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.nombre}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    errors.correo ? "text-red-400" : "text-zinc-300"
                  }`}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => {
                      setFormData({ ...formData, correo: e.target.value });
                      if (errors.correo) setErrors({ ...errors, correo: "" });
                    }}
                    placeholder="tu@email.com"
                    className={`w-full rounded-lg bg-white/5 border px-4 py-3 text-white placeholder-white/40 focus:outline-none transition ${
                      errors.correo
                        ? "border-red-500/50 focus:border-red-400"
                        : "border-white/10 focus:border-[#D4AF37]"
                    }`}
                  />
                  {errors.correo && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.correo}
                    </p>
                  )}
                </div>

                {Object.keys(errors).length > 0 && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex gap-3">
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
                  className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-bold text-black transition hover:bg-[#F5DEB3] shadow-lg shadow-[#D4AF37]/30 mt-6 disabled:opacity-50"
                  disabled={Object.keys(errors).length > 0}
                >
                  Confirmar Registro
                </button>

                <p className="text-xs text-zinc-500 text-center">
                  Recibirás actualizaciones sobre Academia CARVIPIX.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  );
}
