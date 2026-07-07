'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { getAllProducts, getPaymentOrderHistory } from '@/app/lib/client-data-helpers';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type Solicitud = {
  id: string;
  usuario: string;
  producto: string;
  monto?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'contactado';
  fecha: string;
};

function mapStatus(status: string): Solicitud['estado'] {
  if (status === 'completed') return 'aprobado';
  if (status === 'cancelled') return 'rechazado';
  return 'pendiente';
}

export default function AdminSolicitudes() {
  const [filter, setFilter] = useState('todas');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [orders, products] = await Promise.all([getPaymentOrderHistory(), getAllProducts()]);
        const productMap = new Map(products.map((p) => [p.id, p.name]));

        setSolicitudes(
          orders.map((order) => ({
            id: order.id,
            usuario: 'Cuenta actual',
            producto: productMap.get(order.productId) ?? order.productId,
            monto: `$${Number(order.total ?? 0).toLocaleString()}`,
            estado: mapStatus(order.status),
            fecha: order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleDateString('es-ES') : 'Sin datos',
          }))
        );
      } catch {
        setSolicitudes([]);
      }
    };

    load();
  }, []);

  const filteredSolicitudes = useMemo(
    () => solicitudes.filter((s) => filter === 'todas' || s.estado === filter),
    [filter, solicitudes]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Solicitudes de Productos</h2>
        <p className="text-white/60">Gestión de solicitudes de capital, fondeo, bot y academia</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 flex-wrap">
        {['todas', 'pendiente', 'aprobado', 'rechazado', 'contactado'].map((f) => (
          <CARVIPIXButton key={f} onClick={() => setFilter(f)} variant={filter === f ? 'premium' : 'ghost'} size="sm">
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </CARVIPIXButton>
        ))}
      </motion.div>

      <div className="grid gap-4">
        {filteredSolicitudes.length === 0 ? (
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <p className="text-white/60">Sin datos</p>
          </CARVIPIXCard>
        ) : (
          filteredSolicitudes.map((solicitud) => (
            <motion.div key={solicitud.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CARVIPIXCard variant="admin" padding="16" hover={false}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-white/60">{solicitud.id}</span>
                      <CARVIPIXBadge variant={solicitud.estado === 'aprobado' ? 'success' : solicitud.estado === 'rechazado' ? 'danger' : solicitud.estado === 'contactado' ? 'info' : 'warning'}>{solicitud.estado}</CARVIPIXBadge>
                    </div>
                    <p className="font-semibold text-white mb-1">{solicitud.usuario}</p>
                    <p className="text-sm text-white/70 mb-2">{solicitud.producto}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>{solicitud.fecha}</span>
                      {solicitud.monto && <span className="text-[#D4AF37]">{solicitud.monto}</span>}
                    </div>
                  </div>
                </div>
              </CARVIPIXCard>
            </motion.div>
          ))
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-4 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Pendientes</p><p className="text-2xl font-bold text-yellow-400">{solicitudes.filter((s) => s.estado === 'pendiente').length}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Aprobadas</p><p className="text-2xl font-bold text-green-400">{solicitudes.filter((s) => s.estado === 'aprobado').length}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Rechazadas</p><p className="text-2xl font-bold text-red-400">{solicitudes.filter((s) => s.estado === 'rechazado').length}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Contactadas</p><p className="text-2xl font-bold text-blue-400">0</p></CARVIPIXCard>
      </motion.div>
    </div>
  );
}
