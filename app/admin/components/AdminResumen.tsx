'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, DollarSign, AlertCircle, HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CARVIPIXBadge, CARVIPIXCard } from '@/app/design-system';
import {
  getAlertStats,
  getCurrentMembership,
  getCurrentUser,
  getOperations,
  getPaymentOrderHistory,
  getPlatformResults,
} from '@/app/lib/client-data-helpers';

export default function AdminResumen() {
  const [summary, setSummary] = useState({
    users: 0,
    memberships: 0,
    pendingOrders: 0,
    paidTotal: 0,
    activeAlerts: 0,
    openTickets: 0,
    operations: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [user, membership, orders, alerts, results, operations] = await Promise.all([
          getCurrentUser(),
          getCurrentMembership(),
          getPaymentOrderHistory(),
          getAlertStats(),
          getPlatformResults('monthly'),
          getOperations(10),
        ]);

        const completedOrders = orders.filter((o) => o.status === 'completed');
        const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing');

        setSummary({
          users: user?.id ? 1 : 0,
          memberships: membership?.estado === 'activo' ? 1 : 0,
          pendingOrders: pendingOrders.length,
          paidTotal: completedOrders.reduce((acc, item) => acc + Number(item.total ?? 0), 0),
          activeAlerts: Number(alerts.active ?? 0),
          openTickets: 0,
          operations: Number(results.combinedStats.totalTrades ?? operations.length ?? 0),
        });
      } catch {
        setSummary({ users: 0, memberships: 0, pendingOrders: 0, paidTotal: 0, activeAlerts: 0, openTickets: 0, operations: 0 });
      }
    };

    load();
  }, []);

  const stats = useMemo(
    () => [
      { icon: Users, label: 'Usuarios registrados', value: String(summary.users), change: summary.users > 0 ? 'Con registro' : 'Sin datos', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { icon: CheckCircle, label: 'Membresías activas', value: String(summary.memberships), change: summary.memberships > 0 ? 'Estado activo' : 'Sin datos', color: 'text-green-400', bg: 'bg-green-500/10' },
      { icon: Clock, label: 'Solicitudes pendientes', value: String(summary.pendingOrders), change: summary.pendingOrders > 0 ? 'Órdenes pendientes' : 'Sin datos', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      { icon: DollarSign, label: 'Pagos procesados', value: `$${summary.paidTotal.toLocaleString()}`, change: summary.paidTotal > 0 ? 'Órdenes completadas' : 'Sin datos', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
      { icon: AlertCircle, label: 'Alertas activas', value: String(summary.activeAlerts), change: summary.activeAlerts > 0 ? 'Con actividad' : 'Sin alertas', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { icon: HelpCircle, label: 'Operaciones', value: String(summary.operations), change: summary.operations > 0 ? 'Operaciones cerradas' : 'Sin operaciones', color: 'text-red-400', bg: 'bg-red-500/10' },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Resumen General</h2>
        <p className="text-white/60">Vista general del estado del sistema y actividad</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CARVIPIXCard variant="admin" padding="16" hover={false}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-lg ${stat.bg} p-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <CARVIPIXBadge variant="admin">Live</CARVIPIXBadge>
                </div>
                <p className="text-white/70 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.change}</p>
              </CARVIPIXCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
