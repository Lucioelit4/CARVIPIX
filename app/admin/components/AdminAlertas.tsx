'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAlerts } from '@/app/lib/client-data-helpers';
import DetailModal from './DetailModal';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type Alerta = {
  id: string;
  symbol: string;
  tipo: string;
  estado: 'activa' | 'ganada' | 'perdida' | 'seguimiento';
  entrada: string;
  tp: string;
  sl: string;
  fecha: string;
};

function toEstado(status: string): Alerta['estado'] {
  if (status === 'triggered') return 'ganada';
  if (status === 'resolved' || status === 'archived') return 'perdida';
  return 'activa';
}

export default function AdminAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [selectedAlerta, setSelectedAlerta] = useState<Alerta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await getAlerts(50);
        setAlertas(
          rows.map((item) => ({
            id: item.id,
            symbol: item.symbol,
            tipo: String(item.data?.direction ?? 'Sin datos'),
            estado: toEstado(item.status),
            entrada: String(item.data?.entryPrice ?? 'Sin datos'),
            tp: String(item.data?.takeProfitPrice ?? 'Sin datos'),
            sl: String(item.data?.stopLossPrice ?? 'Sin datos'),
            fecha: item.timestamp ? new Date(item.timestamp).toLocaleString('es-ES') : 'Sin datos',
          }))
        );
      } catch {
        setAlertas([]);
      }
    };

    load();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Alertas ganadas', value: alertas.filter((a) => a.estado === 'ganada').length, icon: TrendingUp, color: 'text-green-400' },
      { label: 'En seguimiento', value: alertas.filter((a) => a.estado === 'seguimiento' || a.estado === 'activa').length, icon: Clock, color: 'text-yellow-400' },
      { label: 'Alertas perdidas', value: alertas.filter((a) => a.estado === 'perdida').length, icon: TrendingDown, color: 'text-red-400' },
    ],
    [alertas]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestión de Alertas</h2>
          <p className="text-white/60">Monitoreo de alertas de trading</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Entrada</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">TP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">SL</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-white/60" colSpan={8}>Sin alertas</td>
                </tr>
              ) : (
                alertas.map((alerta) => (
                  <tr key={alerta.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-mono text-white/70">{alerta.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{alerta.symbol}</td>
                    <td className="px-6 py-4 text-sm text-white">{alerta.tipo}</td>
                    <td className="px-6 py-4 text-sm text-white">{alerta.entrada}</td>
                    <td className="px-6 py-4 text-sm text-green-400">{alerta.tp}</td>
                    <td className="px-6 py-4 text-sm text-red-400">{alerta.sl}</td>
                    <td className="px-6 py-4">
                      <CARVIPIXBadge variant={alerta.estado === 'ganada' ? 'success' : alerta.estado === 'perdida' ? 'danger' : 'warning'}>{alerta.estado}</CARVIPIXBadge>
                    </td>
                    <td className="px-6 py-4">
                      <CARVIPIXButton onClick={() => { setSelectedAlerta(alerta); setIsModalOpen(true); }} variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                        Ver
                      </CARVIPIXButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalles de Alerta">
        {selectedAlerta && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-white/60 mb-1">ID de Alerta</p>
              <p className="font-mono text-sm text-[#D4AF37]">{selectedAlerta.id}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Símbolo</p>
              <p className="text-white font-semibold">{selectedAlerta.symbol}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Fecha</p>
              <p className="text-white/70">{selectedAlerta.fecha}</p>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
