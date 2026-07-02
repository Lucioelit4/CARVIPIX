'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react';
import { useState } from 'react';

export default function AdminUtilidades() {
  const [period, setPeriod] = useState('mes');

  // Métricas principales según el período seleccionado
  const getMetricas = () => {
    const metricas = {
      dia: {
        ganancia: '$2,340',
        membresias: '$890',
        bot: '$450',
        capital: '$800',
        fondeo: '$200',
      },
      semana: {
        ganancia: '$15,670',
        membresias: '$6,230',
        bot: '$3,140',
        capital: '$5,100',
        fondeo: '$1,200',
      },
      mes: {
        ganancia: '$67,450',
        membresias: '$26,890',
        bot: '$14,230',
        capital: '$20,500',
        fondeo: '$5,830',
      },
      año: {
        ganancia: '$787,340',
        membresias: '$312,450',
        bot: '$165,280',
        capital: '$245,610',
        fondeo: '$64,000',
      },
      historico: {
        ganancia: '$1,247,890',
        membresias: '$495,120',
        bot: '$261,450',
        capital: '$389,230',
        fondeo: '$101,990',
      },
    };
    return metricas[period as keyof typeof metricas];
  };

  const metrics = getMetricas();

  // Datos de gráfica de ingresos por mes
  const ingresosPorMes = [
    { mes: 'Enero', ingresos: 45000 },
    { mes: 'Febrero', ingresos: 52000 },
    { mes: 'Marzo', ingresos: 58000 },
    { mes: 'Abril', ingresos: 63000 },
    { mes: 'Mayo', ingresos: 71000 },
    { mes: 'Junio', ingresos: 67450 },
  ];

  // Datos de altas vs bajas
  const altasVsBajas = [
    { mes: 'Enero', altas: 120, bajas: 15 },
    { mes: 'Febrero', altas: 145, bajas: 18 },
    { mes: 'Marzo', altas: 167, bajas: 22 },
    { mes: 'Abril', altas: 189, bajas: 25 },
    { mes: 'Mayo', altas: 203, bajas: 28 },
    { mes: 'Junio', altas: 187, bajas: 31 },
  ];

  // Datos de ingresos por categoría
  const ingresosPorCategoria = [
    { name: 'Membresías', value: 26890, color: '#D4AF37' },
    { name: 'Bot', value: 14230, color: '#10B981' },
    { name: 'Capital', value: 20500, color: '#3B82F6' },
    { name: 'Fondeo', value: 5830, color: '#8B5CF6' },
  ];

  // Últimos pagos demo
  const ultimosPagos = [
    { id: 'PAG-20260702001', fecha: '2026-07-02 14:32', cliente: 'Juan Pérez', producto: 'Membership PRO', monto: '$99.00', metodo: 'Tarjeta', estado: 'completado' },
    { id: 'PAG-20260702002', fecha: '2026-07-02 13:15', cliente: 'María García', producto: 'Bot CARVIPIX Pro', monto: '$999.00', metodo: 'Crypto', estado: 'completado' },
    { id: 'PAG-20260702003', fecha: '2026-07-02 11:42', cliente: 'Carlos López', producto: 'Capital Gestionado', monto: '$50,000.00', metodo: 'Transferencia', estado: 'completado' },
    { id: 'PAG-20260701001', fecha: '2026-07-01 16:20', cliente: 'Ana Martínez', producto: 'Membership PRO', monto: '$99.00', metodo: 'Tarjeta', estado: 'completado' },
    { id: 'PAG-20260701002', fecha: '2026-07-01 14:10', cliente: 'Roberto Silva', producto: 'Bot CARVIPIX Pro', monto: '$999.00', metodo: 'Crypto', estado: 'completado' },
  ];

  // Métricas de suscriptores
  const suscriptores = {
    activos: 389,
    nuevosEsteMes: 87,
    cancelacionesEsteMes: 12,
    tasaRetencion: '96.9%',
    ticketPromedio: '$173.20',
  };

  const tarjetas = [
    { icon: DollarSign, label: 'Ganancia ' + (period === 'dia' ? 'hoy' : period === 'semana' ? 'semana' : period === 'mes' ? 'mes' : period === 'año' ? 'año' : 'histórica'), value: metrics.ganancia, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { icon: TrendingUp, label: 'Suscriptores activos', value: suscriptores.activos, color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Users, label: 'Nuevos este mes', value: suscriptores.nuevosEsteMes, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Activity, label: 'Tasa de retención', value: suscriptores.tasaRetencion, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Utilidades Generales</h2>
        <p className="text-white/60">Ingresos, utilidades y análisis de suscriptores</p>
      </motion.div>

      {/* Period Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        {['dia', 'semana', 'mes', 'año', 'historico'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              period === p
                ? 'bg-[#D4AF37] text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {p === 'dia' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : p === 'año' ? 'Año' : 'Histórico'}
          </button>
        ))}
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tarjetas.map((tarjeta, i) => {
          const Icon = tarjeta.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border border-white/10 ${tarjeta.bg} p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${tarjeta.color}`} />
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">Demo</span>
              </div>
              <p className="text-white/70 text-xs mb-1">{tarjeta.label}</p>
              <p className={`text-2xl font-bold ${tarjeta.color}`}>{tarjeta.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Ingresos detallados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Ingresos Membresías</p>
          <p className="text-xl font-bold text-[#D4AF37]">{metrics.membresias}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Ingresos Bot</p>
          <p className="text-xl font-bold text-green-400">{metrics.bot}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Ingresos Capital</p>
          <p className="text-xl font-bold text-blue-400">{metrics.capital}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Ingresos Fondeo</p>
          <p className="text-xl font-bold text-purple-400">{metrics.fondeo}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Ticket Promedio</p>
          <p className="text-xl font-bold text-yellow-400">{suscriptores.ticketPromedio}</p>
        </div>
      </motion.div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <h3 className="text-lg font-bold mb-4">Ingresos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ingresosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#05070B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#D4AF37' }}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ fill: '#D4AF37', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Altas vs Bajas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <h3 className="text-lg font-bold mb-4">Altas vs Bajas de Suscriptores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={altasVsBajas}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.6)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#05070B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'white' }}
              />
              <Legend />
              <Bar dataKey="altas" fill="#10B981" />
              <Bar dataKey="bajas" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ingresos por categoría */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <h3 className="text-lg font-bold mb-4">Ingresos por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ingresosPorCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ingresosPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#05070B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'white' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Métricas de suscriptores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <h3 className="text-lg font-bold mb-4">Resumen de Suscriptores</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-white/70">Suscriptores activos</span>
              <span className="text-xl font-bold text-green-400">{suscriptores.activos}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-white/70">Nuevos este mes</span>
              <span className="text-xl font-bold text-blue-400">+{suscriptores.nuevosEsteMes}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-white/70">Cancelaciones este mes</span>
              <span className="text-xl font-bold text-red-400">-{suscriptores.cancelacionesEsteMes}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-white/70">Tasa de retención</span>
              <span className="text-xl font-bold text-purple-400">{suscriptores.tasaRetencion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Ticket promedio</span>
              <span className="text-xl font-bold text-[#D4AF37]">{suscriptores.ticketPromedio}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Últimos pagos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold">Últimos Pagos Demo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Método</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPagos.map((pago, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm text-white/70">{pago.fecha}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{pago.cliente}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{pago.producto}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#D4AF37]">{pago.monto}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{pago.metodo}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-300">
                      {pago.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-lg border border-white/10 bg-white/5 p-4"
      >
        <p className="text-sm text-white/70">
          Todas las métricas mostradas son datos de demostración. 
          Panel privado solo para dueño/administrador de CARVIPIX.
        </p>
      </motion.div>
    </div>
  );
}
