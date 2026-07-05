'use client';

import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import { useState } from 'react';
import { getAdminData, updatePago } from '@/app/admin/lib/admin-helpers';
import { useToast } from './Toast';
import DetailModal from './DetailModal';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

interface Pago {
  id: string;
  fecha: string;
  cliente: string;
  producto: string;
  monto: string;
  metodo: string;
  estado: 'completado' | 'pendiente' | 'fallido';
}

export default function AdminPagos() {
  const [search, setSearch] = useState('');
  const [pagos, setPagos] = useState<Pago[]>(() => getAdminData().pagos);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleUpdatePago = (id: string, nuevoEstado: Pago['estado']) => {
    if (updatePago(id, nuevoEstado)) {
      const data = getAdminData();
      setPagos(data.pagos);
      
      const mensajes: Record<string, string> = {
        completado: 'Pago confirmado',
        fallido: 'Pago rechazado',
        pendiente: 'Pago marcado pendiente',
      };
      showToast(mensajes[nuevoEstado], 'success');
    }
  };

  const filteredPagos = pagos.filter(
    (pago) =>
      pago.id.toLowerCase().includes(search.toLowerCase()) ||
      pago.cliente.toLowerCase().includes(search.toLowerCase()) ||
      pago.producto.toLowerCase().includes(search.toLowerCase())
  );


  const totalMonto = pagos
    .filter((p) => p.estado === 'completado')
    .reduce((sum, p) => sum + parseFloat(p.monto.replace('$', '').replace(',', '')), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Gestión de Pagos</h2>
        <p className="text-white/60">Registro de pagos demo y transacciones</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por orden, usuario o producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className=""
      >
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Orden</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Método</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acciones</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos.map((pago, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm font-mono text-[#D4AF37]">{pago.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{pago.cliente}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{pago.producto}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{pago.monto}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{pago.metodo}</td>
                  <td className="px-6 py-4">
                    <CARVIPIXBadge variant={pago.estado === 'completado' ? 'success' : pago.estado === 'fallido' ? 'danger' : 'warning'}>{pago.estado}</CARVIPIXBadge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      <CARVIPIXButton
                        onClick={() => {
                          setSelectedPago(pago);
                          setIsModalOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Ver
                      </CARVIPIXButton>
                      {pago.estado !== 'completado' && (
                        <CARVIPIXButton
                          onClick={() => handleUpdatePago(pago.id, 'completado')}
                          variant="success"
                          size="sm"
                        >
                          Confirmar
                        </CARVIPIXButton>
                      )}
                      {pago.estado !== 'fallido' && (
                        <CARVIPIXButton
                          onClick={() => handleUpdatePago(pago.id, 'fallido')}
                          variant="danger"
                          size="sm"
                        >
                          Rechazar
                        </CARVIPIXButton>
                      )}
                      {pago.estado !== 'pendiente' && (
                        <CARVIPIXButton
                          onClick={() => handleUpdatePago(pago.id, 'pendiente')}
                          variant="secondary"
                          size="sm"
                        >
                          Pendiente
                        </CARVIPIXButton>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">{pago.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPagos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No se encontraron pagos</p>
          </div>
        )}
        </CARVIPIXCard>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Total procesado</p>
          <p className="text-2xl font-bold text-[#D4AF37]">${totalMonto.toLocaleString()}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Transacciones</p>
          <p className="text-2xl font-bold text-white">{pagos.length}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Tasa de éxito</p>
          <p className="text-2xl font-bold text-green-400">
            {pagos.length > 0 ? ((pagos.filter(p => p.estado === 'completado').length / pagos.length) * 100).toFixed(1) : '0'}%
          </p>
        </CARVIPIXCard>
      </motion.div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles del Pago"
      >
        {selectedPago && (
          <div className="space-y-6">
            {/* ID y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Número de Orden</p>
                <p className="font-mono text-sm text-[#D4AF37]">{selectedPago.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Estado</p>
                <CARVIPIXBadge variant={selectedPago.estado === 'completado' ? 'success' : selectedPago.estado === 'fallido' ? 'danger' : 'warning'}>{selectedPago.estado}</CARVIPIXBadge>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <p className="text-xs text-white/60 mb-1">Cliente</p>
              <p className="text-white font-semibold">{selectedPago.cliente}</p>
            </div>

            {/* Producto */}
            <div>
              <p className="text-xs text-white/60 mb-1">Producto</p>
              <p className="text-white">{selectedPago.producto}</p>
            </div>

            {/* Monto */}
            <div>
              <p className="text-xs text-white/60 mb-1">Monto</p>
              <p className="text-[#D4AF37] font-semibold text-lg">{selectedPago.monto}</p>
            </div>

            {/* Método de Pago */}
            <div>
              <p className="text-xs text-white/60 mb-1">Método de Pago</p>
              <p className="text-white bg-white/5 px-3 py-2 rounded">{selectedPago.metodo}</p>
            </div>

            {/* Fecha */}
            <div>
              <p className="text-xs text-white/60 mb-1">Fecha y Hora</p>
              <p className="text-white/70">{selectedPago.fecha}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Notas */}
            <div>
              <p className="text-xs text-white/60 mb-2">Detalles de Transacción</p>
              <div className="bg-white/5 rounded p-3 text-sm text-white/70 space-y-1">
                <p>• Transacción demo para demostración</p>
                <p>• Los datos se guardan en localStorage</p>
                <p>• Sin conexión a gateway real de pagos</p>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
