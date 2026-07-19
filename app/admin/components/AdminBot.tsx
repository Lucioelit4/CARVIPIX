'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bot, RefreshCw, ShieldCheck, Send, Gauge } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type AdminSystemPayload = {
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
    orderQueue?: Array<unknown>;
    positions?: Array<unknown>;
    stats?: {
      processedOrders?: number;
      rejectedOrders?: number;
    };
    heartbeatAt?: string | null;
  };
  observability?: {
    avgResponseMs?: number;
    timings?: number;
  };
  dataSource?: {
    origin?: string;
    status?: string;
    capturedAt?: string;
  };
};

type ObserverStatus = {
  success?: boolean;
  total_analyses?: number;
  total_cost_usd?: number;
  paper_account?: {
    open_trades?: Array<unknown>;
    daily_pnl_usd?: number;
    current_balance_usd?: number;
  };
};

type TelegramValidation = {
  ok?: boolean;
  status?: string;
  message?: string;
  test_only?: boolean;
  env?: {
    TELEGRAM_BOT_TOKEN?: boolean;
    TELEGRAM_CHANNEL_TEST?: boolean;
    TELEGRAM_CHANNEL_OFFICIAL?: boolean;
  };
  bot?: {
    connected?: boolean;
    username?: string;
  };
};

function formatDate(value: string | undefined | null): string {
  if (!value) {
    return 'Sin datos';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin datos';
  }
  return parsed.toLocaleString('es-ES');
}

function statusVariant(value: string | undefined): 'success' | 'warning' | 'danger' {
  const normalized = String(value ?? '').toLowerCase();
  if (['pass', 'healthy', 'ok', 'ready_to_test', 'success'].includes(normalized)) {
    return 'success';
  }
  if (['warn', 'warning', 'pending', 'degraded'].includes(normalized)) {
    return 'warning';
  }
  return 'danger';
}

export default function AdminBot() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [system, setSystem] = useState<AdminSystemPayload | null>(null);
  const [observer, setObserver] = useState<ObserverStatus | null>(null);
  const [telegram, setTelegram] = useState<TelegramValidation | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [systemRes, observerRes, telegramRes] = await Promise.all([
        fetch('/api/admin/system', { cache: 'no-store' }),
        fetch('/api/internal/observer-v3/status', { cache: 'no-store' }),
        fetch('/api/internal/community-publisher/validate', { cache: 'no-store' }),
      ]);

      const [systemBody, observerBody, telegramBody] = await Promise.all([
        systemRes.json().catch(() => ({})),
        observerRes.json().catch(() => ({})),
        telegramRes.json().catch(() => ({})),
      ]);

      if (!systemRes.ok || !systemBody?.ok || !systemBody?.data) {
        throw new Error(systemBody?.error || 'No se pudo leer el estado administrativo del bot.');
      }

      setSystem(systemBody.data as AdminSystemPayload);
      setObserver((observerRes.ok ? observerBody : null) as ObserverStatus | null);
      setTelegram((telegramRes.ok ? telegramBody : null) as TelegramValidation | null);
      setLastRefresh(new Date().toISOString());
    } catch (caught) {
      setSystem(null);
      setObserver(null);
      setTelegram(null);
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el panel del bot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const modules = useMemo(() => system?.validation?.latest?.modules ?? [], [system]);
  const validationStatus = system?.validation?.latest?.overallStatus;
  const execution = system?.execution ?? {};
  const observability = system?.observability ?? {};
  const dataSource = system?.dataSource ?? {};

  if (loading) {
    return <div className="text-white/70">Cargando modulo Bot...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Control operativo del Bot</h2>
          <p className="text-white/60 text-sm mt-1">
            Panel conectado a estado real de runtime, observer y publicador Telegram. Sin datos simulados.
          </p>
          <p className="text-xs text-white/50 mt-2">
            Fuente: {dataSource.origin ?? 'UNKNOWN'} · Estado: {dataSource.status ?? 'unknown'} · Captura: {formatDate(dataSource.capturedAt)}
          </p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60">Validacion runtime</p>
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{validationStatus ?? 'Sin datos'}</p>
          <div className="mt-2">
            <CARVIPIXBadge variant={statusVariant(validationStatus)}>{validationStatus ?? 'unknown'}</CARVIPIXBadge>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60">Ejecucion bot</p>
            <Bot className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{execution.safeMode ? 'SAFE_MODE' : 'LIVE'}</p>
          <p className="text-xs text-white/50 mt-2">
            Broker {execution.brokerConnected ? 'conectado' : 'desconectado'} · {execution.brokerProvider ?? 'sin proveedor'}
          </p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60">Observer</p>
            <Activity className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{observer?.total_analyses ?? 0}</p>
          <p className="text-xs text-white/50 mt-2">
            Analisis · Open trades {(observer?.paper_account?.open_trades?.length ?? 0)} · PnL dia {observer?.paper_account?.daily_pnl_usd ?? 0}
          </p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60">Telegram</p>
            <Send className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-white">{telegram?.ok ? 'READY' : 'ERROR'}</p>
          <p className="text-xs text-white/50 mt-2">
            Bot {telegram?.bot?.connected ? 'conectado' : 'sin conexion'} · Test channel {telegram?.env?.TELEGRAM_CHANNEL_TEST ? 'ok' : 'faltante'}
          </p>
        </CARVIPIXCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Operacion y latencia</h3>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between"><span>Queue</span><span className="text-white">{execution.orderQueue?.length ?? 0}</span></div>
            <div className="flex items-center justify-between"><span>Positions</span><span className="text-white">{execution.positions?.length ?? 0}</span></div>
            <div className="flex items-center justify-between"><span>Processed orders</span><span className="text-white">{execution.stats?.processedOrders ?? 0}</span></div>
            <div className="flex items-center justify-between"><span>Rejected orders</span><span className="text-white">{execution.stats?.rejectedOrders ?? 0}</span></div>
            <div className="flex items-center justify-between"><span>Heartbeat</span><span className="text-white">{formatDate(execution.heartbeatAt)}</span></div>
            <div className="flex items-center justify-between"><span>Avg response</span><span className="text-white">{Number(observability.avgResponseMs ?? 0).toFixed(2)} ms</span></div>
            <div className="flex items-center justify-between"><span>Timings</span><span className="text-white">{observability.timings ?? 0}</span></div>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-4">Modulos validados por runtime</h3>
          <div className="space-y-3">
            {modules.length === 0 ? (
              <p className="text-sm text-white/60">No hay modulos reportados por la validacion actual.</p>
            ) : (
              modules.map((item) => (
                <div key={`${item.module}-${item.status}`} className="rounded-lg border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.module}</p>
                    <p className="text-xs text-white/60 mt-1">{item.message ?? 'Sin mensaje adicional'}</p>
                  </div>
                  <CARVIPIXBadge variant={statusVariant(item.status)}>{item.status}</CARVIPIXBadge>
                </div>
              ))
            )}
          </div>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="info" padding="16" hover={false}>
        <div className="flex items-start gap-3">
          <Gauge className="w-5 h-5 text-[#D4AF37] mt-0.5" />
          <p className="text-sm text-white/70">
            Ultima actualizacion: {formatDate(lastRefresh)}. Este tab se alimenta de datos de sistema y observabilidad para evitar informacion fija o de relleno.
          </p>
        </div>
      </CARVIPIXCard>
    </div>
  );
}
