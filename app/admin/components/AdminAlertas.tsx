'use client';

import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAdminData, updateAlerta, createAlerta } from '@/app/admin/lib/admin-helpers';
import { useToast } from './Toast';

interface Alerta {
  id: string;
  symbol: string;
  tipo: string;
  estado: 'activa' | 'ganada' | 'perdida' | 'seguimiento';
  entrada: string;
  tp: string;
  sl: string;
  fecha: string;
}

export default function AdminAlertas() {
  const [showCreate, setShowCreate] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [formData, setFormData] = useState({ symbol: '', tipo: 'Compra', entrada: '', tp: '', sl: '' });
  const { showToast } = useToast();

  useEffect(() => {
    const data = getAdminData();
    setAlertas(data.alertas);
  }, []);

  const handleUpdateAlerta = (id: string, nuevoEstado: Alerta['estado']) => {
    if (updateAlerta(id, nuevoEstado)) {
      const data = getAdminData();
      setAlertas(data.alertas);
      showToast(`Alerta marcada como ${nuevoEstado}`, 'success');
    }
  };

  const handleCreateAlerta = () => {
    if (!formData.symbol || !formData.entrada || !formData.tp || !formData.sl) {
      showToast('Completa todos los campos', 'error');
      return;
    }

    const newAlerta = createAlerta({
      symbol: formData.symbol,
      tipo: formData.tipo,
      estado: 'activa',
      entrada: formData.entrada,
      tp: formData.tp,
      sl: formData.sl,
      fecha: new Date().toLocaleString('es-ES'),
    });

    const data = getAdminData();
    setAlertas(data.alertas);
    setFormData({ symbol: '', tipo: 'Compra', entrada: '', tp: '', sl: '' });
    setShowCreate(false);
    showToast('Alerta creada exitosamente', 'success');
  };

  const getEstadoIcon = (estado: string) => {
    if (estado === 'ganada') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (estado === 'perdida') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Clock className="w-5 h-5 text-yellow-400" />;
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'ganada') return 'bg-green-500/20 text-green-300';
    if (estado === 'perdida') return 'bg-red-500/20 text-red-300';
    if (estado === 'activa') return 'bg-blue-500/20 text-blue-300';
    return 'bg-yellow-500/20 text-yellow-300';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'Compra' ? '📈' : '📉';
  };

  const stats = [
    { label: 'Alertas ganadas', value: alertas.filter((a) => a.estado === 'ganada').length, icon: TrendingUp, color: 'text-green-400' },
    { label: 'En seguimiento', value: alertas.filter((a) => a.estado === 'seguimiento').length, icon: Clock, color: 'text-yellow-400' },
    { label: 'Alertas perdidas', value: alertas.filter((a) => a.estado === 'perdida').length, icon: TrendingDown, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestión de Alertas</h2>
          <p className="text-white/60">Monitoreo de alertas de trading demo</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#f5d76e] transition"
        >
          <Plus className="w-5 h-5" />
          Nueva alerta demo
        </button>
      </motion.div>

      {/* Create Alert Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Símbolo (ej: EURUSD)"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
              />
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white outline-none focus:border-[#D4AF37]"
              >
                <option>Compra</option>
                <option>Venta</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Entrada"
                value={formData.entrada}
                onChange={(e) => setFormData({ ...formData, entrada: e.target.value })}
                className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
              />
              <input
                type="text"
                placeholder="TP (Target Profit)"
                value={formData.tp}
                onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
              />
              <input
                type="text"
                placeholder="SL (Stop Loss)"
                value={formData.sl}
                onChange={(e) => setFormData({ ...formData, sl: e.target.value })}
                className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateAlerta}
                className="px-4 py-2 rounded text-sm bg-[#D4AF37] text-black font-bold hover:bg-[#f5d76e] transition"
              >
                Crear alerta
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded text-sm bg-white/10 hover:bg-white/20 text-white transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
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
              {alertas.map((alerta, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm font-mono text-white/70">{alerta.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{alerta.symbol}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-lg">{getTipoIcon(alerta.tipo)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{alerta.entrada}</td>
                  <td className="px-6 py-4 text-sm text-green-400">{alerta.tp}</td>
                  <td className="px-6 py-4 text-sm text-red-400">{alerta.sl}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize flex items-center gap-1 w-fit ${getEstadoColor(alerta.estado)}`}>
                      {getEstadoIcon(alerta.estado)}
                      {alerta.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {alerta.estado !== 'ganada' && (
                        <button
                          onClick={() => handleUpdateAlerta(alerta.id, 'ganada')}
                          className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                        >
                          Ganada
                        </button>
                      )}
                      {alerta.estado !== 'perdida' && (
                        <button
                          onClick={() => handleUpdateAlerta(alerta.id, 'perdida')}
                          className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                        >
                          Perdida
                        </button>
                      )}
                      {alerta.estado !== 'seguimiento' && (
                        <button
                          onClick={() => handleUpdateAlerta(alerta.id, 'seguimiento')}
                          className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition"
                        >
                          Seguimiento
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-white/10 bg-white/5 p-4"
      >
        <p className="text-sm text-white/70">
          Crea alertas demo y gestiona su estado. Los cambios se guardan en localStorage de la sesión del administrador.
        </p>
      </motion.div>
    </div>
  );
}
