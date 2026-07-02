'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function AdminResultados() {
  const metricas = [
    { label: 'ROI Total', value: '127.4%', color: 'text-green-400', icon: TrendingUp },
    { label: 'Win Rate', value: '68.5%', color: 'text-blue-400', icon: TrendingUp },
    { label: 'Operaciones cerradas', value: '342', color: 'text-white', icon: TrendingUp },
    { label: 'Ganancia neta demo', value: '$23,450', color: 'text-[#D4AF37]', icon: TrendingUp },
    { label: 'Promedio ganancia', value: '$234.50', color: 'text-green-400', icon: TrendingUp },
    { label: 'Mayor drawdown', value: '-8.2%', color: 'text-red-400', icon: TrendingUp },
  ];

  const topResultados = [
    { rank: 1, activo: 'XAUUSD', ganancias: '$4,230', operaciones: 45, winRate: '75%' },
    { rank: 2, activo: 'EURUSD', ganancias: '$3,890', operaciones: 52, winRate: '71%' },
    { rank: 3, activo: 'BTCUSD', ganancias: '$3,560', operaciones: 38, winRate: '68%' },
    { rank: 4, activo: 'GBPUSD', ganancias: '$3,120', operaciones: 41, winRate: '66%' },
    { rank: 5, activo: 'AUDUSD', ganancias: '$2,890', operaciones: 35, winRate: '63%' },
  ];

  const sesiones = [
    { nombre: 'Sesión NY', ganancias: '$8,920', operaciones: 156, promedio: '$57.18' },
    { nombre: 'Sesión Londres', ganancias: '$9,230', operaciones: 142, promedio: '$65.07' },
    { nombre: 'Sesión Asia', ganancias: '$5,300', operaciones: 44, promedio: '$120.45' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Resultados de Trading Demo</h2>
        <p className="text-white/60">Métricas y análisis de operaciones</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricas.map((metrica, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <p className="text-xs text-white/60 mb-2">{metrica.label}</p>
            <p className={`text-2xl font-bold ${metrica.color}`}>{metrica.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Activos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-white/10 bg-white/5"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Top 5 Activos por Ganancia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Ranking</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Activo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Ganancias</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Operaciones</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {topResultados.map((resultado, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">
                      {resultado.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{resultado.activo}</td>
                  <td className="px-6 py-4 text-sm text-green-400 font-semibold">{resultado.ganancias}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{resultado.operaciones}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-blue-400">{resultado.winRate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Por Sesión */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {sesiones.map((sesion, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm font-semibold text-white mb-3">{sesion.nombre}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Ganancias</span>
                <span className="text-sm font-bold text-green-400">{sesion.ganancias}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Operaciones</span>
                <span className="text-sm font-bold text-white">{sesion.operaciones}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Promedio</span>
                <span className="text-sm font-bold text-[#D4AF37]">{sesion.promedio}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg border border-white/10 bg-white/5 p-4"
      >
        <p className="text-sm text-white/70">
          Todas las métricas son datos de demostración. No representan resultados reales de trading. 
          El trading implica riesgo significativo de pérdida.
        </p>
      </motion.div>
    </div>
  );
}
