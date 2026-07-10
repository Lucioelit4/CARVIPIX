'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, DollarSign, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { fetchAdminOrders, formatMoney, type AdminPaymentOrderRow } from '@/app/admin/lib/payments-admin';

type CommercialPayload = {
  overview: {
    users: number;
    activeMemberships: number;
    pendingCapitalRequests: number;
    openTickets: number;
    blockedAttempts: number;
  };
};

export default function AdminUtilidades() {
  const [orders, setOrders] = useState<AdminPaymentOrderRow[]>([]);
  const [overview, setOverview] = useState<CommercialPayload['overview'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersData, commercialResponse] = await Promise.all([
        fetchAdminOrders({ orderStatus: '', provider: '', from: '', to: '', q: '' }),
        fetch('/api/admin/commercial', { cache: 'no-store' }),
      ]);

      const commercialPayload = (await commercialResponse.json().catch(() => ({}))) as { ok?: boolean; data?: CommercialPayload; error?: string };
      if (!commercialResponse.ok || !commercialPayload.ok || !commercialPayload.data) {
        throw new Error(commercialPayload.error || 'No se pudo cargar utilidades.');
      }

      setOrders(ordersData);
      setOverview(commercialPayload.data.overview);
    } catch (caught) {
      setOrders([]);
      setOverview(null);
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar utilidades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const metrics = useMemo(() => {
    const paidOrders = orders.filter((order) => ['paid', 'completed', 'captured', 'settled'].includes(order.orderStatus.toLowerCase()));
    const refundedOrders = orders.filter((order) => order.orderStatus.toLowerCase().includes('refund'));
    const pendingOrders = orders.filter((order) => ['created', 'pending_provider', 'awaiting_confirmation'].includes(order.orderStatus.toLowerCase()));
    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.amountTotal), 0);

    return {
      totalRevenue,
      paidOrders: paidOrders.length,
      refundedOrders: refundedOrders.length,
      pendingOrders: pendingOrders.length,
    };
  }, [orders]);

  const providerBreakdown = useMemo(() => {
    const counters = new Map<string, number>();
    for (const order of orders) {
      const key = order.provider || 'sin_proveedor';
      counters.set(key, (counters.get(key) ?? 0) + 1);
    }

    return Array.from(counters.entries()).map(([provider, total]) => ({ provider, total }));
  }, [orders]);

  const latestOrders = orders.slice(0, 10);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Utilidades y operación</h2>
          <p className="text-white/60">Resumen real calculado desde órdenes de pago y overview comercial.</p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()} disabled={loading}>Actualizar</CARVIPIXButton>
      </motion.div>

      {error && <CARVIPIXCard variant="info" padding="16" hover={false}><p className="text-sm text-red-300">{error}</p></CARVIPIXCard>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><div className="flex items-center justify-between mb-3"><DollarSign className="w-5 h-5 text-[#D4AF37]" /><CARVIPIXBadge variant="admin">Real</CARVIPIXBadge></div><p className="text-xs text-white/60 mb-1">Ingresos pagados</p><p className="text-2xl font-bold text-[#D4AF37]">{formatMoney(metrics.totalRevenue, 'USD')}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><div className="flex items-center justify-between mb-3"><Activity className="w-5 h-5 text-green-400" /><CARVIPIXBadge variant="success">Real</CARVIPIXBadge></div><p className="text-xs text-white/60 mb-1">Órdenes pagadas</p><p className="text-2xl font-bold text-green-400">{metrics.paidOrders}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><div className="flex items-center justify-between mb-3"><RotateCcw className="w-5 h-5 text-red-400" /><CARVIPIXBadge variant="warning">Real</CARVIPIXBadge></div><p className="text-xs text-white/60 mb-1">Reembolsos</p><p className="text-2xl font-bold text-red-400">{metrics.refundedOrders}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><div className="flex items-center justify-between mb-3"><Users className="w-5 h-5 text-blue-400" /><CARVIPIXBadge variant="info">Real</CARVIPIXBadge></div><p className="text-xs text-white/60 mb-1">Membresías activas</p><p className="text-2xl font-bold text-blue-400">{overview?.activeMemberships ?? 0}</p></CARVIPIXCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Resumen comercial</h3>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between gap-3"><span>Usuarios totales</span><span className="text-white">{overview?.users ?? 0}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Solicitudes de capital pendientes</span><span className="text-white">{overview?.pendingCapitalRequests ?? 0}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Tickets abiertos</span><span className="text-white">{overview?.openTickets ?? 0}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Órdenes pendientes</span><span className="text-white">{metrics.pendingOrders}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Intentos bloqueados</span><span className="text-white">{overview?.blockedAttempts ?? 0}</span></div>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Órdenes por proveedor</h3>
          <div className="space-y-3">
            {providerBreakdown.length === 0 ? (
              <p className="text-sm text-white/60">Sin órdenes registradas.</p>
            ) : (
              providerBreakdown.map((item) => (
                <div key={item.provider} className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3"><span className="text-sm text-white">{item.provider}</span><CARVIPIXBadge variant="admin">{item.total}</CARVIPIXBadge></div>
              ))
            )}
          </div>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="px-2 pb-4"><h3 className="text-lg font-bold">Últimas órdenes reales</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Orden</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Proveedor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-8 text-white/60" colSpan={6}>Cargando...</td></tr>
              ) : latestOrders.length === 0 ? (
                <tr><td className="px-6 py-8 text-white/60" colSpan={6}>Sin órdenes registradas.</td></tr>
              ) : (
                latestOrders.map((order) => (
                  <tr key={order.orderId} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-mono text-[#D4AF37]">{order.orderId}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{order.userEmail ?? order.userId}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{formatMoney(order.amountTotal, order.currency)}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{order.provider ?? 'Sin proveedor'}</td>
                    <td className="px-6 py-4"><CARVIPIXBadge variant="admin">{order.orderStatus}</CARVIPIXBadge></td>
                    <td className="px-6 py-4 text-sm text-white/60">{new Date(order.createdAt).toLocaleString('es-ES')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>
    </div>
  );
}
