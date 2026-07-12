'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, RefreshCw, ShieldCheck, Timer, Wifi } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type SystemPayload = {
  validation?: {
    latest?: {
      overallStatus?: string;
      generatedAt?: string;
      modules?: Array<{ module: string; status: string; message?: string }>;
    } | null;
  };
  execution?: {
    safeMode?: boolean;
    brokerConnected?: boolean;
    brokerProvider?: string | null;
    brokerMode?: string | null;
    brokerServer?: string | null;
    queue?: Array<unknown>;
    positions?: Array<unknown>;
    stats?: {
      processedOrders?: number;
      rejectedOrders?: number;
    };
    heartbeatAt?: string | null;
    sync?: {
      brokerSyncAt?: string | null;
    };
  };
  observability?: {
    avgResponseMs?: number;
    timings?: number;
  };
  dataSource?: {
    origin?: string;
    status?: string;
    capturedAt?: string;
    validUntil?: string;
  };
};

interface AdminDataHealthProps {
  isAdmin?: boolean;
}

function statusVariant(value: string | undefined) {
  const normalized = String(value ?? '').toLowerCase();
  if (['healthy', 'ok', 'completed', 'success', 'connected'].includes(normalized)) {
    return 'success' as const;
  }
  if (['warning', 'degraded', 'pending'].includes(normalized)) {
    return 'warning' as const;
  }
  return 'danger' as const;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin datos';
  }

  return parsed.toLocaleString('es-ES');
}

export default function AdminDataHealth({ isAdmin = false }: AdminDataHealthProps) {
  const [payload, setPayload] = useState<SystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/system', { cache: 'no-store' });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: SystemPayload; error?: string };

      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error || 'No se pudo cargar el estado del sistema.');
      }

      setPayload(body.data);
    } catch (caught) {
      setPayload(null);
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el estado del sistema.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAdmin, load]);

  if (!isAdmin) {
    return <p className="text-red-400">Acceso restringido</p>;
  }

  const latest = payload?.validation?.latest ?? null;
  const execution = payload?.execution ?? {};
  const observability = payload?.observability ?? {};
  const dataSource = payload?.dataSource;
  const modules = latest?.modules ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Estado operativo del sistema</h2>
          <p className="text-white/60">Lectura real del runtime, validación operativa y ejecución sandbox.</p>
          {dataSource && (
            <p className="text-xs text-white/60 mt-2">
              {`Origen: ${dataSource.origin ?? "UNKNOWN"} · Estado: ${dataSource.status ?? "unknown"} · Capturado: ${formatDate(dataSource.capturedAt ?? null)} · Vigencia: ${formatDate(dataSource.validUntil ?? null)}`}
            </p>
          )}
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()} disabled={loading}>
          Actualizar
        </CARVIPIXButton>
      </motion.div>

      {error && (
        <CARVIPIXCard variant="info" padding="16" hover={false}>
          <p className="text-sm text-red-300">{error}</p>
        </CARVIPIXCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/60">Validación general</p>
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{latest?.overallStatus ?? 'Sin datos'}</p>
          <p className="text-xs text-white/50 mt-2">{formatDate(latest?.generatedAt)}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/60">Modo de ejecución</p>
            <Activity className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{execution.safeMode ? 'SAFE_MODE' : 'LIVE'}</p>
          <p className="text-xs text-white/50 mt-2">Broker {execution.brokerConnected ? 'conectado' : 'desconectado'}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/60">Cola / posiciones</p>
            <Wifi className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{(execution.queue?.length ?? 0)} / {(execution.positions?.length ?? 0)}</p>
          <p className="text-xs text-white/50 mt-2">queue / positions</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/60">Latencia media</p>
            <Gauge className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{Number(observability.avgResponseMs ?? 0).toFixed(2)} ms</p>
          <p className="text-xs text-white/50 mt-2">timings: {observability.timings ?? 0}</p>
        </CARVIPIXCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Estado de ejecución</h3>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between gap-3"><span>Proveedor</span><span className="text-white">{execution.brokerProvider ?? 'Sin proveedor'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Modo broker</span><span className="text-white">{execution.brokerMode ?? 'Sin modo'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Servidor</span><span className="text-white">{execution.brokerServer ?? 'Sin servidor'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Heartbeat</span><span className="text-white">{formatDate(execution.heartbeatAt ?? null)}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Última sincronización broker</span><span className="text-white">{formatDate(execution.sync?.brokerSyncAt ?? null)}</span></div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">Órdenes procesadas</p><p className="text-xl font-bold text-white">{execution.stats?.processedOrders ?? 0}</p></div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">Órdenes rechazadas</p><p className="text-xl font-bold text-white">{execution.stats?.rejectedOrders ?? 0}</p></div>
            </div>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Módulos validados</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-white/60 text-sm">Cargando...</p>
            ) : modules.length === 0 ? (
              <p className="text-white/60 text-sm">No hay módulos reportados por la validación actual.</p>
            ) : (
              modules.map((module) => (
                <div key={`${module.module}-${module.status}`} className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{module.module}</p>
                    <p className="text-xs text-white/60 mt-1">{module.message ?? 'Sin mensaje adicional'}</p>
                  </div>
                  <CARVIPIXBadge variant={statusVariant(module.status)}>{module.status}</CARVIPIXBadge>
                </div>
              ))
            )}
          </div>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="info" padding="16" hover={false}>
        <div className="flex items-start gap-3">
          <Timer className="w-5 h-5 text-[#D4AF37] mt-0.5" />
          <p className="text-sm text-white/70">Este panel refleja el estado real expuesto por <span className="text-white">/api/admin/system</span>; no usa datos demo.</p>
        </div>
      </CARVIPIXCard>
    </div>
  );
}
