'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Save } from 'lucide-react';
import DetailModal from './DetailModal';
import { useToast } from './Toast';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  message: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
};

type CommercialPayload = {
  supportTickets: SupportTicket[];
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin datos';
  }

  return parsed.toLocaleString('es-ES');
}

function badgeVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'resolved' || normalized === 'closed') {
    return 'success' as const;
  }
  if (normalized === 'in_progress' || normalized === 'pending_customer') {
    return 'warning' as const;
  }
  return 'danger' as const;
}

function statusIcon(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'resolved' || normalized === 'closed') {
    return <CheckCircle className="w-5 h-5 text-green-400" />;
  }
  if (normalized === 'in_progress' || normalized === 'pending_customer') {
    return <Clock className="w-5 h-5 text-yellow-400" />;
  }
  return <AlertCircle className="w-5 h-5 text-red-400" />;
}

export default function AdminSoporte() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('open');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/commercial', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CommercialPayload; error?: string };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo cargar soporte.');
      }

      setTickets(payload.data.supportTickets);
    } catch (caught) {
      setTickets([]);
      showToast(caught instanceof Error ? caught.message : 'No se pudo cargar soporte.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredTickets = useMemo(() => {
    if (filter === 'todos') {
      return tickets;
    }

    return tickets.filter((ticket) => ticket.status === filter);
  }, [filter, tickets]);

  const stats = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length,
  }), [tickets]);

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyDraft(ticket.adminReply ?? '');
    setStatusDraft(ticket.status);
  };

  const saveTicket = async () => {
    if (!selectedTicket) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSupportTicket',
          ticketId: selectedTicket.id,
          status: statusDraft,
          adminReply: replyDraft,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'No se pudo guardar el ticket.');
      }

      showToast('Ticket actualizado.', 'success');
      setSelectedTicket(null);
      await load();
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'No se pudo guardar el ticket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestión de soporte</h2>
          <p className="text-white/60">Tickets reales del backend comercial con respuesta y cambio de estado.</p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()} disabled={loading}>
          Actualizar
        </CARVIPIXButton>
      </motion.div>

      <div className="flex gap-3 flex-wrap">
        {[
          ['todos', 'Todos'],
          ['open', 'Abiertos'],
          ['in_progress', 'En progreso'],
          ['resolved', 'Resueltos'],
        ].map(([value, label]) => (
          <CARVIPIXButton key={value} onClick={() => setFilter(value)} variant={filter === value ? 'premium' : 'ghost'} size="sm">
            {label}
          </CARVIPIXButton>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Abiertos</p><p className="text-2xl font-bold text-red-400">{stats.open}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">En progreso</p><p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60 mb-2">Resueltos</p><p className="text-2xl font-bold text-green-400">{stats.resolved}</p></CARVIPIXCard>
      </div>

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
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Creado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-8 text-white/60" colSpan={7}>Cargando...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td className="px-6 py-8 text-white/60" colSpan={7}>No hay tickets para el filtro actual.</td></tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-mono text-[#D4AF37]">{ticket.id}</td>
                    <td className="px-6 py-4 text-sm text-white">{ticket.userId}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{ticket.category}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{ticket.priority}</td>
                    <td className="px-6 py-4"><span className="flex items-center gap-2 w-fit">{statusIcon(ticket.status)}<CARVIPIXBadge variant={badgeVariant(ticket.status)}>{ticket.status}</CARVIPIXBadge></span></td>
                    <td className="px-6 py-4 text-sm text-white/60">{formatDateTime(ticket.createdAt)}</td>
                    <td className="px-6 py-4"><CARVIPIXButton variant="ghost" size="sm" onClick={() => openDetail(ticket)}>Ver / responder</CARVIPIXButton></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>

      <DetailModal isOpen={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} title="Gestión de ticket de soporte">
        {!selectedTicket ? null : (
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <p className="text-white font-semibold">{selectedTicket.subject}</p>
              <p className="text-white/60 mt-1">{selectedTicket.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2"><span className="text-white/60">Estado</span><select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"><option value="open">open</option><option value="in_progress">in_progress</option><option value="pending_customer">pending_customer</option><option value="resolved">resolved</option><option value="closed">closed</option></select></label>
              <div className="space-y-2"><span className="text-white/60">Actualizado</span><p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">{formatDateTime(selectedTicket.updatedAt)}</p></div>
            </div>
            <label className="space-y-2 block"><span className="text-white/60">Respuesta administrativa</span><textarea value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} className="min-h-32 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" /></label>
            <CARVIPIXButton variant="premium" fullWidth leftIcon={<Save className="w-4 h-4" />} onClick={() => void saveTicket()} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</CARVIPIXButton>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
