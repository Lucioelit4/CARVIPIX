'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Users } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXCard } from '@/app/design-system';

type CommercialPayload = {
  data?: {
    overview?: {
      users: number;
      activeMemberships: number;
      pendingStrategicPartnerRequests: number;
      openTickets: number;
      blockedAttempts: number;
    };
    strategicPartnerRequests?: Array<{ id: string; status: string; createdAt: string }>;
    supportTickets?: Array<{ id: string; status: string; createdAt: string }>;
    audit?: Array<{ id: string; action: string; result: string; createdAt: string }>;
  };
};

type SystemPayload = {
  data?: {
    validation?: {
      latest?: {
        overallStatus?: string;
        generatedAt?: string;
        summary?: { total: number; pass: number; warn: number; fail: number };
      };
    };
    execution?: {
      safeMode?: boolean;
      brokerConnected?: boolean;
      stats?: { processedOrders?: number; rejectedOrders?: number; closedPositions?: number };
    };
  };
};

function fmt(value?: string) {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin datos';
  return date.toLocaleString('es-ES');
}

export default function AdminProyecto() {
  const [commercial, setCommercial] = useState<CommercialPayload['data'] | null>(null);
  const [system, setSystem] = useState<SystemPayload['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [commercialRes, systemRes] = await Promise.all([
          fetch('/api/admin/commercial', { cache: 'no-store' }),
          fetch('/api/admin/system', { cache: 'no-store' }),
        ]);

        const commercialJson = (await commercialRes.json().catch(() => ({}))) as CommercialPayload;
        const systemJson = (await systemRes.json().catch(() => ({}))) as SystemPayload;

        if (!commercialRes.ok || !systemRes.ok) {
          throw new Error('No se pudo cargar el estado operativo real del proyecto.');
        }

        setCommercial(commercialJson.data ?? null);
        setSystem(systemJson.data ?? null);
      } catch (caught) {
        setCommercial(null);
        setSystem(null);
        setError(caught instanceof Error ? caught.message : 'Error cargando estado del proyecto');
      }
    };

    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const latestPartner = useMemo(() => {
    const rows = commercial?.strategicPartnerRequests ?? [];
    return rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }, [commercial]);

  const latestTicket = useMemo(() => {
    const rows = commercial?.supportTickets ?? [];
    return rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }, [commercial]);

  const latestAudit = useMemo(() => {
    const rows = commercial?.audit ?? [];
    return rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }, [commercial]);

  const overview = commercial?.overview;
  const validation = system?.validation?.latest;
  const execution = system?.execution;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Proyecto Operativo (Datos Reales)</h2>
        <p className="text-white/60">Vista ejecutiva conectada al backend real de comercial, validación y ejecución.</p>
      </div>

      {error && (
        <CARVIPIXCard variant="info" padding="16" hover={false}>
          <p className="text-sm text-red-300">{error}</p>
        </CARVIPIXCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Usuarios comerciales</p>
          <p className="text-3xl font-bold text-white mt-2">{overview?.users ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Membresías activas</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{overview?.activeMemberships ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Socios en revisión</p>
          <p className="text-3xl font-bold text-yellow-300 mt-2">{overview?.pendingStrategicPartnerRequests ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Tickets abiertos</p>
          <p className="text-3xl font-bold text-[#D4AF37] mt-2">{overview?.openTickets ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Bloqueos auditados</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{overview?.blockedAttempts ?? 0}</p>
        </CARVIPIXCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Estado técnico del núcleo</h3>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Validación global</span><CARVIPIXBadge variant="info">{validation?.overallStatus ?? 'unknown'}</CARVIPIXBadge></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Checks aprobados</span><span className="text-white">{validation?.summary?.pass ?? 0}/{validation?.summary?.total ?? 0}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> Última validación</span><span className="text-white">{fmt(validation?.generatedAt)}</span></div>
            <div className="flex items-center justify-between gap-3"><span>SAFE_MODE</span><span className="text-white">{execution?.safeMode ? 'ON' : 'OFF'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Broker</span><span className="text-white">{execution?.brokerConnected ? 'Conectado' : 'Desconectado'}</span></div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2"><p className="text-xs text-white/50">Procesadas</p><p className="text-lg font-bold text-white">{execution?.stats?.processedOrders ?? 0}</p></div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2"><p className="text-xs text-white/50">Rechazadas</p><p className="text-lg font-bold text-white">{execution?.stats?.rejectedOrders ?? 0}</p></div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2"><p className="text-xs text-white/50">Cerradas</p><p className="text-lg font-bold text-white">{execution?.stats?.closedPositions ?? 0}</p></div>
            </div>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Eventos operativos recientes</h3>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-white font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Último socio estratégico</p>
              <p className="text-white/70 mt-1">Estado: {latestPartner?.status ?? 'Sin datos'} · Fecha: {fmt(latestPartner?.createdAt)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-white font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Último ticket</p>
              <p className="text-white/70 mt-1">Estado: {latestTicket?.status ?? 'Sin datos'} · Fecha: {fmt(latestTicket?.createdAt)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-white font-medium flex items-center gap-2"><Activity className="w-4 h-4" /> Último evento de auditoría</p>
              <p className="text-white/70 mt-1">{latestAudit ? `${latestAudit.action} · ${latestAudit.result}` : 'Sin datos'} · {fmt(latestAudit?.createdAt)}</p>
            </div>
          </div>
        </CARVIPIXCard>
      </div>
    </div>
  );
}
