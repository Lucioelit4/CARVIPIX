'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

interface Ticket {
  id: string;
  usuario: string;
  categoria: string;
  prioridad: string;
  estado: 'abierto' | 'cerrado' | 'en-progreso';
  creado: string;
  respuestas: number;
}

export default function AdminSoporte() {
  const [filter, setFilter] = useState('todos');

  const demoTickets: Ticket[] = [
    { id: 'TK-26070112345', usuario: 'Juan Pérez', categoria: 'Acceso', prioridad: 'crítico', estado: 'en-progreso', creado: '2026-07-02 14:32', respuestas: 2 },
    { id: 'TK-26070112344', usuario: 'María García', categoria: 'Pago', prioridad: 'alto', estado: 'abierto', creado: '2026-07-02 13:15', respuestas: 0 },
    { id: 'TK-26070112343', usuario: 'Carlos López', categoria: 'Técnico', prioridad: 'normal', estado: 'cerrado', creado: '2026-07-01 11:22', respuestas: 5 },
    { id: 'TK-26070112342', usuario: 'Ana Martínez', categoria: 'Solicitud', prioridad: 'normal', estado: 'cerrado', creado: '2026-07-01 09:45', respuestas: 3 },
    { id: 'TK-26070112341', usuario: 'Roberto Silva', categoria: 'Alerta', prioridad: 'alto', estado: 'en-progreso', creado: '2026-06-30 16:20', respuestas: 1 },
    { id: 'TK-26070112340', usuario: 'Laura Gómez', categoria: 'General', prioridad: 'bajo', estado: 'cerrado', creado: '2026-06-30 14:10', respuestas: 2 },
  ];

  const filteredTickets = demoTickets.filter((ticket) => {
    if (filter === 'todos') return true;
    return ticket.estado === filter;
  });

  const getEstadoIcon = (estado: string) => {
    if (estado === 'cerrado') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (estado === 'en-progreso') return <Clock className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };


  const stats = [
    { label: 'Abiertos', value: demoTickets.filter((t) => t.estado === 'abierto').length, color: 'text-red-400' },
    { label: 'En progreso', value: demoTickets.filter((t) => t.estado === 'en-progreso').length, color: 'text-yellow-400' },
    { label: 'Cerrados', value: demoTickets.filter((t) => t.estado === 'cerrado').length, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Gestión de Soporte</h2>
        <p className="text-white/60">Tickets y solicitudes de soporte técnico</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 flex-wrap"
      >
        {['todos', 'abierto', 'en-progreso', 'cerrado'].map((f) => (
          <CARVIPIXButton
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'premium' : 'ghost'}
            size="sm"
          >
            {f === 'en-progreso' ? 'En progreso' : f.charAt(0).toUpperCase() + f.slice(1)}
          </CARVIPIXButton>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-4"
      >
        {stats.map((stat, i) => (
          <CARVIPIXCard key={i} variant="statistics" padding="16" hover={false}>
            <p className="text-xs text-white/60 mb-2">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </CARVIPIXCard>
        ))}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Respuestas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Creado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm font-mono text-[#D4AF37]">{ticket.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{ticket.usuario}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{ticket.categoria}</td>
                  <td className="px-6 py-4">
                    <CARVIPIXBadge variant={ticket.prioridad === 'crítico' ? 'danger' : ticket.prioridad === 'alto' ? 'warning' : ticket.prioridad === 'normal' ? 'info' : 'success'}>{ticket.prioridad}</CARVIPIXBadge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize flex items-center gap-1 w-fit">
                      {getEstadoIcon(ticket.estado)}
                      <CARVIPIXBadge variant={ticket.estado === 'cerrado' ? 'success' : ticket.estado === 'en-progreso' ? 'warning' : 'danger'}>{ticket.estado}</CARVIPIXBadge>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{ticket.respuestas}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{ticket.creado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No hay tickets en este estado</p>
          </div>
        )}
        </CARVIPIXCard>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className=""
      >
        <CARVIPIXCard variant="info" padding="16" hover={false}>
          <p className="text-sm text-white/70">
            Gestiona tickets desde aquí. Asigna prioridades, cambia estados y coordina respuestas con el equipo de soporte.
          </p>
        </CARVIPIXCard>
      </motion.div>
    </div>
  );
}
