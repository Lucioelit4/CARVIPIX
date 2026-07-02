'use client';

import { motion } from 'framer-motion';
import { Settings, DollarSign, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function AdminConfiguracion() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const precios = [
    { producto: 'Bot CARVIPIX Pro', precio: '$999.00', currency: 'USD', tipo: 'one-time' },
    { producto: 'Membership PRO', precio: '$99.00', currency: 'USD', tipo: 'subscription' },
    { producto: 'Capital Gestionado', precio: 'Desde $10,000', currency: 'USD', tipo: 'variable' },
    { producto: 'Fondeo de Cuenta', precio: 'Gratuito', currency: 'N/A', tipo: 'free' },
    { producto: 'Academia', precio: 'Gratuito', currency: 'N/A', tipo: 'free' },
  ];

  const servicios = [
    { nombre: 'Sala de Alertas', estado: 'activo', usuarios: 389 },
    { nombre: 'Análisis de Trading', estado: 'activo', usuarios: 1247 },
    { nombre: 'Perfiles de Usuario', estado: 'activo', usuarios: 1247 },
    { nombre: 'Soporte Técnico', estado: 'activo', usuarios: 87 },
    { nombre: 'Academia (Beta)', estado: 'activo', usuarios: 45 },
    { nombre: 'Bot Automation', estado: 'activo', usuarios: 23 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Configuración del Sistema</h2>
        <p className="text-white/60">Gestión de precios, servicios y estados</p>
      </motion.div>

      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4"
      >
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D4AF37]" />
          Configuración Global
        </h3>

        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* Demo Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <p className="font-semibold text-white mb-1">Modo Demostración</p>
              <p className="text-sm text-white/60">Todos los datos son demo, sin pagos reales</p>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-4 py-2 rounded font-bold transition ${
                demoMode
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {demoMode ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div>
              <p className="font-semibold text-white mb-1">Modo Mantenimiento</p>
              <p className="text-sm text-white/60">Suspende acceso para usuarios regulares</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`px-4 py-2 rounded font-bold transition ${
                maintenanceMode
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-green-500/20 text-green-300'
              }`}
            >
              {maintenanceMode ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>

        {maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-300 mb-1">Modo de mantenimiento activo</p>
              <p className="text-sm text-yellow-300/70">Los usuarios verán un mensaje de mantenimiento</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Precios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-lg font-bold">Precios de Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Precio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Moneda</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody>
              {precios.map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm font-medium text-white">{item.producto}</td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">{item.precio}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{item.currency}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">{item.tipo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 text-xs rounded bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Servicios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-bold mb-4">Estado de Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicios.map((servicio, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-start justify-between"
            >
              <div>
                <p className="font-semibold text-white mb-1">{servicio.nombre}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    {servicio.estado}
                  </span>
                  <span className="text-white/60">{servicio.usuarios} usuarios</span>
                </div>
              </div>
              <button className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition">
                Ver
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-white/10 bg-white/5 p-4"
      >
        <p className="text-sm text-white/70">
          Todas las configuraciones mostradas son datos demo. Los cambios se guardan en localStorage por sesión.
        </p>
      </motion.div>
    </div>
  );
}
