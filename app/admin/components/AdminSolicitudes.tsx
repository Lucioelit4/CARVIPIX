'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAdminData, updateSolicitud } from '@/app/admin/lib/admin-helpers';
import { useToast } from './Toast';
import DetailModal from './DetailModal';

interface Solicitud {
  id: string;
  usuario: string;
  producto: string;
  monto?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'contactado';
  fecha: string;
}

export default function AdminSolicitudes() {
  const [filter, setFilter] = useState('todas');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const data = getAdminData();
    setSolicitudes(data.solicitudes);
  }, []);

  const handleUpdateSolicitud = (id: string, nuevoEstado: Solicitud['estado']) => {
    if (updateSolicitud(id, nuevoEstado)) {
      const data = getAdminData();
      setSolicitudes(data.solicitudes);
      
      const mensajes: Record<string, string> = {
        aprobado: 'Solicitud aprobada',
        rechazado: 'Solicitud rechazada',
        contactado: 'Usuario contactado',
        pendiente: 'Cambio a pendiente',
      };
      showToast(mensajes[nuevoEstado], 'success');
    }
  };

  const filteredSolicitudes = solicitudes.filter(
    (sol) => filter === 'todas' || sol.estado === filter
  );

  const getEstadoIcon = (estado: string) => {
    if (estado === 'aprobado') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (estado === 'rechazado') return <XCircle className="w-5 h-5 text-red-400" />;
    if (estado === 'contactado') return <Clock className="w-5 h-5 text-blue-400" />;
    return <Clock className="w-5 h-5 text-yellow-400" />;
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'aprobado') return 'bg-green-500/20 text-green-300';
    if (estado === 'rechazado') return 'bg-red-500/20 text-red-300';
    if (estado === 'contactado') return 'bg-blue-500/20 text-blue-300';
    return 'bg-yellow-500/20 text-yellow-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Solicitudes de Productos</h2>
        <p className="text-white/60">Gestión de solicitudes de capital, fondeo, bot y academia</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 flex-wrap"
      >
        {['todas', 'pendiente', 'aprobado', 'rechazado', 'contactado'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-[#D4AF37] text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Cards */}
      <div className="grid gap-4">
        {filteredSolicitudes.map((solicitud, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-white/10 bg-white/5 p-5 hover:border-white/20 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-white/60">{solicitud.id}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${getEstadoColor(solicitud.estado)}`}>
                    {solicitud.estado}
                  </span>
                </div>
                <p className="font-semibold text-white mb-1">{solicitud.usuario}</p>
                <p className="text-sm text-white/70 mb-2">{solicitud.producto}</p>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>{solicitud.fecha}</span>
                  {solicitud.monto && <span className="text-[#D4AF37]">{solicitud.monto}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {getEstadoIcon(solicitud.estado)}
                <button
                  onClick={() => {
                    setSelectedSolicitud(solicitud);
                    setIsModalOpen(true);
                  }}
                  className="px-2 py-1 text-xs rounded bg-white/10 text-white hover:bg-white/20 transition flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                {solicitud.estado === 'pendiente' && (
                  <>
                    <button
                      onClick={() => handleUpdateSolicitud(solicitud.id, 'aprobado')}
                      className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleUpdateSolicitud(solicitud.id, 'rechazado')}
                      className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleUpdateSolicitud(solicitud.id, 'contactado')}
                      className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                    >
                      Contactado
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-4 gap-4"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">
            {solicitudes.filter((s) => s.estado === 'pendiente').length}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Aprobadas</p>
          <p className="text-2xl font-bold text-green-400">
            {solicitudes.filter((s) => s.estado === 'aprobado').length}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Rechazadas</p>
          <p className="text-2xl font-bold text-red-400">
            {solicitudes.filter((s) => s.estado === 'rechazado').length}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Contactadas</p>
          <p className="text-2xl font-bold text-blue-400">
            {solicitudes.filter((s) => s.estado === 'contactado').length}
          </p>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de Solicitud"
      >
        {selectedSolicitud && (
          <div className="space-y-6">
            {/* ID y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">ID de Solicitud</p>
                <p className="font-mono text-sm text-[#D4AF37]">{selectedSolicitud.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Estado</p>
                <span className={`text-xs font-bold px-2 py-1 rounded capitalize w-fit block ${getEstadoColor(selectedSolicitud.estado)}`}>
                  {selectedSolicitud.estado}
                </span>
              </div>
            </div>

            {/* Usuario */}
            <div>
              <p className="text-xs text-white/60 mb-1">Usuario</p>
              <p className="text-white font-semibold">{selectedSolicitud.usuario}</p>
            </div>

            {/* Producto */}
            <div>
              <p className="text-xs text-white/60 mb-1">Producto Solicitado</p>
              <p className="text-white">{selectedSolicitud.producto}</p>
            </div>

            {/* Monto */}
            {selectedSolicitud.monto && (
              <div>
                <p className="text-xs text-white/60 mb-1">Monto</p>
                <p className="text-[#D4AF37] font-semibold text-lg">{selectedSolicitud.monto}</p>
              </div>
            )}

            {/* Fecha */}
            <div>
              <p className="text-xs text-white/60 mb-1">Fecha de Solicitud</p>
              <p className="text-white/70">{selectedSolicitud.fecha}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Notas */}
            <div>
              <p className="text-xs text-white/60 mb-2">Notas</p>
              <div className="bg-white/5 rounded p-3 text-sm text-white/70">
                <p>Solicitud demo de {selectedSolicitud.usuario} para {selectedSolicitud.producto.toLowerCase()}</p>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
