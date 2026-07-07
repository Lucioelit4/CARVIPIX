'use client';

import { motion } from 'framer-motion';
import { Calendar, Eye, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DetailModal from './DetailModal';
import { useToast } from './Toast';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import {
  type AdminPaymentOrderDetail,
  type AdminPaymentOrderRow,
  fetchAdminOrderDetail,
  fetchAdminOrders,
  formatMoney,
} from '@/app/admin/lib/payments-admin';

function statusVariant(status: string) {
  const value = String(status ?? '').toLowerCase();
  if (['paid', 'captured', 'processed', 'settled', 'refunded', 'completed'].includes(value)) {
    return 'success' as const;
  }

  if (['failed', 'cancelled', 'chargeback'].includes(value)) {
    return 'danger' as const;
  }

  return 'warning' as const;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Sin datos';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin datos';
  }

  return date.toLocaleString('es-ES');
}

export default function AdminPagos() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orders, setOrders] = useState<AdminPaymentOrderRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminPaymentOrderRow | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminPaymentOrderDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadOrders = async () => {
    setLoadingList(true);
    try {
      const data = await fetchAdminOrders({
        orderStatus,
        provider,
        from: fromDate,
        to: toDate,
        q: search,
      });
      setOrders(data);
    } catch (error) {
      setOrders([]);
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el listado de pagos.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadOrders();
    }, 250);

    return () => clearTimeout(timeout);
  }, [orderStatus, provider, fromDate, toDate, search]);

  const openOrderDetail = async (order: AdminPaymentOrderRow) => {
    setSelectedOrder(order);
    setSelectedDetail(null);
    setIsModalOpen(true);
    setLoadingDetail(true);

    try {
      const detail = await fetchAdminOrderDetail(order.orderId);
      setSelectedDetail(detail);
    } catch (error) {
      setSelectedDetail(null);
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la orden.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const totals = useMemo(() => {
    const totalOrders = orders.length;
    const totalPaidAmount = orders
      .filter((order) => String(order.orderStatus).toLowerCase() === 'paid')
      .reduce((sum, order) => sum + Number(order.amountTotal), 0);
    const paidOrders = orders.filter((order) => String(order.orderStatus).toLowerCase() === 'paid').length;
    const successRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalPaidAmount,
      successRate,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Panel de Pagos</h2>
        <p className="text-white/60">Listado, filtros y detalle operativo de órdenes de pago</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por usuario o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
          />
        </div>

        <select
          value={orderStatus}
          onChange={(event) => setOrderStatus(event.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#D4AF37]"
        >
          <option value="" className="bg-[#030303] text-white">Estado: todos</option>
          <option value="created" className="bg-[#030303] text-white">created</option>
          <option value="pending_provider" className="bg-[#030303] text-white">pending_provider</option>
          <option value="awaiting_confirmation" className="bg-[#030303] text-white">awaiting_confirmation</option>
          <option value="paid" className="bg-[#030303] text-white">paid</option>
          <option value="failed" className="bg-[#030303] text-white">failed</option>
          <option value="cancelled" className="bg-[#030303] text-white">cancelled</option>
          <option value="refunded" className="bg-[#030303] text-white">refunded</option>
          <option value="partially_refunded" className="bg-[#030303] text-white">partially_refunded</option>
          <option value="expired" className="bg-[#030303] text-white">expired</option>
        </select>

        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#D4AF37]"
        >
          <option value="" className="bg-[#030303] text-white">Proveedor: todos</option>
          <option value="custom" className="bg-[#030303] text-white">custom</option>
          <option value="stripe" className="bg-[#030303] text-white">stripe</option>
          <option value="mercadopago" className="bg-[#030303] text-white">mercadopago</option>
          <option value="openpay" className="bg-[#030303] text-white">openpay</option>
        </select>

        <label className="relative">
          <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-white outline-none focus:border-[#D4AF37]"
          />
        </label>

        <label className="relative">
          <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-white outline-none focus:border-[#D4AF37]"
          />
        </label>

        <CARVIPIXButton variant="ghost" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void loadOrders()}>
          Refrescar
        </CARVIPIXButton>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Orden</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado orden</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado tx</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acciones</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td className="px-6 py-8 text-white/60" colSpan={9}>Cargando...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-white/60" colSpan={9}>Sin órdenes para los filtros actuales</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.orderId} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm font-mono text-[#D4AF37]">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm text-white">{order.userId}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{order.userEmail || 'Sin email'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">{formatMoney(order.amountTotal, order.currency)}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{order.provider || 'Sin proveedor'}</td>
                      <td className="px-6 py-4">
                        <CARVIPIXBadge variant={statusVariant(order.orderStatus)}>{order.orderStatus}</CARVIPIXBadge>
                      </td>
                      <td className="px-6 py-4">
                        <CARVIPIXBadge variant={statusVariant(order.transactionStatus || '')}>{order.transactionStatus || 'sin_tx'}</CARVIPIXBadge>
                      </td>
                      <td className="px-6 py-4">
                        <CARVIPIXButton onClick={() => void openOrderDetail(order)} variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          Ver
                        </CARVIPIXButton>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Total procesado</p>
          <p className="text-2xl font-bold text-[#D4AF37]">{formatMoney(totals.totalPaidAmount, 'USD')}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Órdenes</p>
          <p className="text-2xl font-bold text-white">{totals.totalOrders}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Tasa de éxito</p>
          <p className="text-2xl font-bold text-green-400">{totals.successRate.toFixed(1)}%</p>
        </CARVIPIXCard>
      </motion.div>

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalle de Orden de Pago">
        {loadingDetail ? (
          <p className="text-white/60">Cargando detalle...</p>
        ) : selectedOrder && selectedDetail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Orden</p>
                <p className="font-mono text-sm text-[#D4AF37]">{selectedDetail.order.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Estado orden</p>
                <CARVIPIXBadge variant={statusVariant(selectedDetail.order.order_status)}>{selectedDetail.order.order_status}</CARVIPIXBadge>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1">Usuario / Email</p>
              <p className="text-white">
                {selectedDetail.order.user_id} / {selectedDetail.order.user_email || 'Sin email'}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/60 mb-1">Monto</p>
              <p className="text-[#D4AF37] font-semibold text-lg">
                {formatMoney(selectedDetail.order.amount_total, selectedDetail.order.currency)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-2">Timeline completo</p>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedDetail.timeline.length === 0 ? (
                  <p className="text-white/60 text-sm">Sin eventos de timeline.</p>
                ) : (
                  selectedDetail.timeline.map((event) => (
                    <div key={event.id} className="text-sm border-b border-white/5 pb-2 last:border-b-0">
                      <p className="text-white font-medium">{event.event_type}</p>
                      <p className="text-white/60">{formatDateTime(event.occurred_at)} · {event.event_source}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-2">Attempts</p>
              <div className="space-y-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedDetail.attempts.length === 0 ? (
                  <p className="text-white/60 text-sm">Sin attempts registrados.</p>
                ) : (
                  selectedDetail.attempts.map((attempt) => (
                    <div key={attempt.id} className="text-sm border-b border-white/5 pb-2 last:border-b-0">
                      <p className="text-white font-medium">{attempt.operation} · {attempt.status}</p>
                      <p className="text-white/60">{formatDateTime(attempt.created_at)} · latency: {attempt.latency_ms ?? '-'} ms</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-2">Webhooks</p>
              <div className="space-y-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedDetail.webhooks.length === 0 ? (
                  <p className="text-white/60 text-sm">Sin webhooks asociados.</p>
                ) : (
                  selectedDetail.webhooks.map((webhook) => (
                    <div key={webhook.id} className="text-sm border-b border-white/5 pb-2 last:border-b-0">
                      <p className="text-white font-medium">{webhook.event_type} · {webhook.process_status}</p>
                      <p className="text-white/60">{formatDateTime(webhook.first_seen_at)} · firma: {webhook.signature_valid ? 'válida' : 'inválida'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white mb-2">Reembolsos visibles</p>
              <div className="space-y-2 max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedDetail.refunds.length === 0 ? (
                  <p className="text-white/60 text-sm">Sin reembolsos asociados.</p>
                ) : (
                  selectedDetail.refunds.map((refund) => (
                    <div key={refund.id} className="text-sm border-b border-white/5 pb-2 last:border-b-0">
                      <p className="text-white font-medium">{refund.status} · {formatMoney(refund.amount, refund.currency)}</p>
                      <p className="text-white/60">{formatDateTime(refund.requested_at)} · {refund.reason || 'sin motivo'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white/60">No se encontró detalle para la orden seleccionada.</p>
        )}
      </DetailModal>
    </div>
  );
}
