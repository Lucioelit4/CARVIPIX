'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, DollarSign, AlertCircle, HelpCircle } from 'lucide-react';

export default function AdminResumen() {
  const stats = [
    {
      icon: Users,
      label: 'Usuarios registrados',
      value: '1,247',
      change: '+12% este mes',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CheckCircle,
      label: 'Membresías activas',
      value: '389',
      change: 'PRO: 156 | ELITE: 233',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      icon: Clock,
      label: 'Solicitudes pendientes',
      value: '23',
      change: '8 Capital | 15 Fondeo',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      icon: DollarSign,
      label: 'Pagos demo procesados',
      value: '$156,340',
      change: '+$23,450 esta semana',
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10',
    },
    {
      icon: AlertCircle,
      label: 'Alertas activas',
      value: '127',
      change: '45 ganadas | 82 en seguimiento',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: HelpCircle,
      label: 'Tickets abiertos',
      value: '18',
      change: '5 críticos | 13 normales',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Resumen General</h2>
        <p className="text-white/60">Vista general del estado del sistema y actividad</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-white/10 bg-white/5 p-5 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-lg ${stat.bg} p-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  Demo
                </span>
              </div>
              <p className="text-white/70 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.change}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-bold mb-4">Actividad reciente</h3>
        <div className="space-y-3">
          {[
            { time: '14:32', action: 'Nueva solicitud de capital de usuario #1247', status: 'pending' },
            { time: '13:28', action: 'Pago demo procesado: Bot CARVIPIX Pro', status: 'completed' },
            { time: '12:15', action: 'Ticket de soporte creado: Sistema de alertas', status: 'open' },
            { time: '11:42', action: 'Usuario registrado: juan.perez@email.com', status: 'completed' },
            { time: '10:30', action: 'Solicitud de fondeo aprobada', status: 'completed' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 pb-3 border-b border-white/5 last:border-0">
              <div className="text-xs text-white/50 min-w-fit pt-0.5">{item.time}</div>
              <div className="flex-1">
                <p className="text-sm text-white">{item.action}</p>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${
                item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                item.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {item.status === 'pending' ? 'Pendiente' : item.status === 'completed' ? 'Completado' : 'Abierto'}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
