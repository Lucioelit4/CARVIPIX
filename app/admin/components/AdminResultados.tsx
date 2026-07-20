'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getPlatformResults, getResultsHistory } from '@/app/lib/client-data-helpers';

export default function AdminResultados() {
  const [results, setResults] = useState<Awaited<ReturnType<typeof getPlatformResults>> | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getResultsHistory>>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [platform, monthlyHistory] = await Promise.all([
          getPlatformResults('monthly'),
          getResultsHistory(6),
        ]);
        setResults(platform);
        setHistory(monthlyHistory ?? []);
      } catch {
        setResults(null);
        setHistory([]);
      }
    };

    load();
  }, []);

  const metricas = useMemo(
    () => [
      { label: 'ROI Total', value: `${Number(results?.combinedStats.totalProfit ?? 0).toFixed(2)}%`, color: 'text-green-400', icon: TrendingUp },
      { label: 'Win Rate', value: `${Number(results?.combinedStats.avgWinRate ?? 0).toFixed(1)}%`, color: 'text-blue-400', icon: TrendingUp },
      { label: 'Operaciones cerradas', value: String(results?.combinedStats.totalTrades ?? 0), color: 'text-white', icon: TrendingUp },
      { label: 'Ganancia neta', value: `$${Number(results?.combinedStats.totalProfit ?? 0).toLocaleString()}`, color: 'text-[#D4AF37]', icon: TrendingUp },
      {
        label: 'Promedio ganancia',
        value: Number(results?.combinedStats.totalTrades ?? 0) > 0
          ? `$${(Number(results?.combinedStats.totalProfit ?? 0) / Number(results?.combinedStats.totalTrades ?? 1)).toFixed(2)}`
          : '$0',
        color: 'text-green-400',
        icon: TrendingUp,
      },
      {
        label: 'Mayor drawdown',
        value: Number((results?.combinedStats as Record<string, unknown> | undefined)?.maxDrawdown ?? 0).toFixed(2) + '%',
        color: 'text-red-400',
        icon: TrendingUp,
      },
    ],
    [results]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Resultados de Trading</h2>
        <p className="text-white/60">Métricas y análisis de operaciones</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricas.map((metrica, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60 mb-2">{metrica.label}</p>
            <p className={`text-2xl font-bold ${metrica.color}`}>{metrica.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-white/10 bg-white/5">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Histórico por periodo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Mes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Operaciones</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr className="border-b border-white/5">
                  <td className="px-6 py-4 text-sm text-white/60" colSpan={4}>Sin reportes</td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm text-white">{item.month}</td>
                    <td className="px-6 py-4 text-sm text-white/80">{item.metrics.alertas.totalTrades}</td>
                    <td className="px-6 py-4 text-sm text-white/80">{item.metrics.alertas.winRate.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-white/80">${item.metrics.alertas.profitLoss.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
