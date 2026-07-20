'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock3, Gauge, ShieldCheck } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXCard } from '@/app/design-system';

type ValidationCheck = {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  durationMs: number;
  details: string;
};

type AuditEvent = {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  result: string;
  details?: string;
};

type SystemPayload = {
  data?: {
    validation?: {
      latest?: {
        overallStatus?: string;
        generatedAt?: string;
        summary?: { total: number; pass: number; warn: number; fail: number };
        checks?: ValidationCheck[];
      };
    };
    execution?: {
      safeMode?: boolean;
      brokerConnected?: boolean;
      brokerLatencyMs?: number;
      orderQueue?: Array<unknown>;
      openPositions?: Array<unknown>;
      stats?: {
        processedOrders?: number;
        rejectedOrders?: number;
        cancelledOrders?: number;
        closedPositions?: number;
      };
      audit?: AuditEvent[];
    };
    observability?: {
      avgResponseMs?: number;
    };
  };
};

function badgeForStatus(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' {
  const value = String(status ?? '').toLowerCase();
  if (value === 'pass' || value === 'success') return 'success';
  if (value === 'warn' || value === 'warning') return 'warning';
  if (value === 'fail' || value === 'error') return 'danger';
  return 'info';
}

function fmtDate(value?: string) {
  if (!value) return 'Sin datos';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin datos';
  return parsed.toLocaleString('es-ES');
}

export default function AdminMotor() {
  const [payload, setPayload] = useState<SystemPayload['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const response = await fetch('/api/admin/system', { cache: 'no-store' });
        const json = (await response.json().catch(() => ({}))) as SystemPayload;
        if (!response.ok) {
          throw new Error('No se pudo cargar el estado real del motor.');
        }
        setPayload(json.data ?? null);
      } catch (caught) {
        setPayload(null);
        setError(caught instanceof Error ? caught.message : 'Error al cargar el motor');
      }
    };

    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const latest = payload?.validation?.latest;
  const execution = payload?.execution;
  const checks = latest?.checks ?? [];
  const recentAudit = useMemo(() => (execution?.audit ?? []).slice(0, 8), [execution?.audit]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Motor de Trading (Datos Reales)</h2>
        <p className="text-white/60">Sin simulaciones: validación, cola, posiciones y auditoría desde runtime real.</p>
      </div>

      {error && (
        <CARVIPIXCard variant="info" padding="16" hover={false}>
          <p className="text-sm text-red-300">{error}</p>
        </CARVIPIXCard>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Estado validación</p><p className="text-2xl font-bold text-white mt-2">{latest?.overallStatus ?? 'unknown'}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Checks</p><p className="text-2xl font-bold text-white mt-2">{latest?.summary?.pass ?? 0}/{latest?.summary?.total ?? 0}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">SAFE_MODE</p><p className="text-2xl font-bold text-white mt-2">{execution?.safeMode ? 'ON' : 'OFF'}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Queue / Posiciones</p><p className="text-2xl font-bold text-white mt-2">{execution?.orderQueue?.length ?? 0}/{execution?.openPositions?.length ?? 0}</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Latencia broker</p><p className="text-2xl font-bold text-white mt-2">{Number(execution?.brokerLatencyMs ?? 0).toFixed(0)}ms</p></CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Latencia API</p><p className="text-2xl font-bold text-white mt-2">{Number(payload?.observability?.avgResponseMs ?? 0).toFixed(1)}ms</p></CARVIPIXCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Checks de validación</h3>
          <div className="space-y-2">
            {checks.length === 0 ? (
              <p className="text-sm text-white/60">No hay checks reportados.</p>
            ) : (
              checks.map((check) => (
                <div key={check.id} className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white flex items-center gap-2">
                      {check.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : check.status === 'warn' ? <AlertCircle className="w-4 h-4 text-yellow-300" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                      {check.title}
                    </p>
                    <p className="text-xs text-white/60 mt-1">{check.details || 'Sin detalle'}</p>
                  </div>
                  <div className="text-right text-xs text-white/60">
                    <CARVIPIXBadge variant={badgeForStatus(check.status)}>{check.status}</CARVIPIXBadge>
                    <p className="mt-1">{check.durationMs} ms</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Auditoría reciente del motor</h3>
          <div className="space-y-2">
            {recentAudit.length === 0 ? (
              <p className="text-sm text-white/60">No hay eventos de auditoría recientes.</p>
            ) : (
              recentAudit.map((event) => (
                <div key={event.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-white font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {event.category} · {event.action}</p>
                  <p className="text-xs text-white/60 mt-1">{event.result} · {fmtDate(event.timestamp)}</p>
                  {event.details ? <p className="text-xs text-white/50 mt-1">{event.details}</p> : null}
                </div>
              ))
            )}
          </div>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="info" padding="16" hover={false}>
        <p className="text-sm text-white/70 flex items-center gap-2"><Gauge className="w-4 h-4" /> Última validación: {fmtDate(latest?.generatedAt)}</p>
      </CARVIPIXCard>
    </div>
  );
}
