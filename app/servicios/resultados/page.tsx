"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CheckCircle2,
  Zap,
  Bot,
  Wallet,
  Target,
  Activity,
  AlertCircle,
} from "lucide-react";
import DataSourceBanner from "@/app/components/DataSourceBanner";

const globalGrowthData = [
  { month: "Mes 1", value: 100 },
  { month: "Mes 2", value: 110 },
  { month: "Mes 3", value: 125 },
  { month: "Mes 4", value: 136 },
  { month: "Mes 5", value: 148 },
  { month: "Mes 6", value: 161 },
];

const serviceResults = [
  {
    name: "Bot CARVIPIX",
    icon: Bot,
    result: "Pendiente",
    status: "En configuración",
    description: "Automatización MT4/MT5 con publicación al activar el servicio.",
  },
  {
    name: "Alertas en Vivo",
    icon: Zap,
    result: "Pendiente",
    status: "Disponible",
    description: "Señales operativas con seguimiento.",
  },
  {
    name: "Gestión de Capital",
    icon: Wallet,
    result: "Pendiente",
    status: "En validación",
    description: "Balance y movimientos de capital asignado.",
  },
  {
    name: "Cuenta Fondeada",
    icon: Target,
    result: "200K",
    status: "Disponible",
    description: "Proceso de evaluación con empresas externas.",
  },
];

const recentActivity = [
  "Bot CARVIPIX actualizará métricas al activarse el servicio",
  "Alertas publicará cierres cuando exista historial operativo",
  "Gestión de Capital mostrará balance tras validación de cuenta",
  "Fondeo recibió nueva solicitud de revisión",
  "Comunidad activa con seguimiento operativo",
];

const topMembers = [
  { pos: 1, name: "Lucio", perf: "+32.8%" },
  { pos: 2, name: "María", perf: "+28.1%" },
  { pos: 3, name: "Andrés", perf: "+24.5%" },
  { pos: 4, name: "Camila", perf: "+19.4%" },
  { pos: 5, name: "Diego", perf: "+16.2%" },
];

export default function ResultadosComercialPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <DataSourceBanner />
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B0B0B] to-[#030303] border-b border-white/5 px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4"
          >
            Resultados CARVIPIX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-white/80 mb-6"
          >
            Panorama general del rendimiento, actividad y servicios principales de la plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {[
              "Estado operativo",
              "Resultados globales",
              "Transparencia",
              "Plataforma activa",
            ].map((badge, i) => (
              <span
                key={i}
                className="bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-medium border border-[#D4AF37]/30"
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              label: "Rendimiento global",
              value: "Disponible al consolidar actividad",
              icon: TrendingUp,
            },
            { label: "Alertas cerradas", value: "Pendiente", icon: CheckCircle2 },
            {
              label: "Win rate general",
              value: "Pendiente",
              icon: Zap,
            },
            {
              label: "Bot CARVIPIX resultado",
              value: "Pendiente",
              icon: Bot,
            },
            {
              label: "Capital gestionado",
              value: "Pendiente",
              icon: Wallet,
            },
            {
              label: "Cuentas fondeadas objetivo",
              value: "200K",
              icon: Target,
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                  <p className="text-sm text-white/70">{card.label}</p>
                </div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Rendimiento por Servicio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Rendimiento por servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceResults.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-[#D4AF37]" />
                      <h3 className="font-bold text-lg">{service.name}</h3>
                    </div>
                    <span className="text-[#D4AF37] text-sm font-semibold">
                      {service.result}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">{service.status}</span>
                  </div>
                  <p className="text-sm text-white/70">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Global Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6 mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Evolución global de la plataforma</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={globalGrowthData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1a2535" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: "#D4AF37", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          {/* Activity */}
          <div className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold">Actividad reciente</h2>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 pb-4 border-b border-white/10 last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2 flex-shrink-0" />
                  <p className="text-sm text-white/80">{activity}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transparency */}
          <div className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold">Transparencia CARVIPIX</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                <h3 className="font-bold text-sm mb-2">Resultados por servicio</h3>
                <p className="text-xs text-white/70">
                  Cada servicio (Bot, Alertas, Capital, Fondeo) mantiene métricas separadas y claras.
                </p>
              </div>
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                <h3 className="font-bold text-sm mb-2">Métricas separadas</h3>
                <p className="text-xs text-white/70">
                  No mezclamos resultados. Cada producto es independiente y reporta su rendimiento.
                </p>
              </div>
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                <h3 className="font-bold text-sm mb-2">Datos listos para publicación</h3>
                <p className="text-xs text-white/70">
                  Las métricas se publican automáticamente cuando el servicio correspondiente esté activo.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Activity - Reduced and Secondary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6 mb-12"
        >
          <h3 className="text-lg font-bold mb-4">Top de actividad</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-white/60 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Miembro</th>
                  <th className="pb-3 font-semibold">Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {topMembers.map((member) => (
                  <tr key={member.pos} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3">{member.pos}</td>
                    <td className="py-3">{member.name}</td>
                    <td className="py-3 text-green-400 font-semibold">
                      {member.perf}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-white/50 mt-4">
            Este listado se consolida con actividad real y validada de la plataforma.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-white/50"
        >
          <p>
            Las métricas se muestran únicamente cuando los servicios estén activos y con datos operativos validados.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
