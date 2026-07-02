'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAdminData, updatePago } from '@/app/admin/lib/admin-helpers';
import { useToast } from './Toast';

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
  const [pagos, setPagos] = useState<Pago[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const data = getAdminData();
    setPagos(data.pagos);
  }, []);

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

  const getEstadoColor = (estado: string) => {
    if (estado === 'completado') return 'bg-green-500/20 text-green-300';
    if (estado === 'fallido') return 'bg-red-500/20 text-red-300';
    return 'bg-yellow-500/20 text-yellow-300';
  };

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
        className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
      >
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
                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${getEstadoColor(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {pago.estado !== 'completado' && (
                        <button
                          onClick={() => handleUpdatePago(pago.id, 'completado')}
                          className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                        >
                          Confirmar
                        </button>
                      )}
                      {pago.estado !== 'fallido' && (
                        <button
                          onClick={() => handleUpdatePago(pago.id, 'fallido')}
                          className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                        >
                          Rechazar
                        </button>
                      )}
                      {pago.estado !== 'pendiente' && (
                        <button
                          onClick={() => handleUpdatePago(pago.id, 'pendiente')}
                          className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition"
                        >
                          Pendiente
                        </button>
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
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Total procesado</p>
          <p className="text-2xl font-bold text-[#D4AF37]">${totalMonto.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Transacciones</p>
          <p className="text-2xl font-bold text-white">{pagos.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Tasa de éxito</p>
          <p className="text-2xl font-bold text-green-400">
            {pagos.length > 0 ? ((pagos.filter(p => p.estado === 'completado').length / pagos.length) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </motion.div>
    </div>
  );
}
