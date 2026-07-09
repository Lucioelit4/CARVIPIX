'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, PlayCircle, RefreshCw, ShieldAlert, Zap } from 'lucide-react';

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type ValidationReport = {
  id: string;
  createdAt: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  summary: { total: number; pass: number; warn: number; fail: number };
  checks: Array<{ id: string; title: string; status: 'pass' | 'warn' | 'fail'; durationMs: number; details: string }>;
};

type DashboardPayload = {
  validation: {
    latest: ValidationReport | null;
    history: ValidationReport[];
  };
  execution: {
    safeMode: boolean;
    brokerConnected: boolean;
    brokerProvider: string | null;
    brokerMode: string;
    brokerServer: string | null;
    brokerLogin: string | null;
    brokerAccountId: string | null;
    brokerLatencyMs: number;
    orderQueue: Array<{ id: string; type: string; symbol: string; lots: number; status: string }>;
    openPositions: Array<{ id: string; symbol: string; lots: number; status: string }>;
    account: { balance: number; equity: number; freeMargin: number; accountStatus: string; accountHealth: number };
    stats: { processedOrders: number; rejectedOrders: number; cancelledOrders: number; closedPositions: number };
    credentialVault: Array<{ id: string; provider: string; server: string; login: string; mode: string; updatedAt: string }>;
    audit: Array<{ id: string; timestamp: string; category: string; action: string; result: string; details?: string }>;
  };
  observability: {
    counters: number;
    timings: number;
    avgResponseMs: number;
  };
};

const initialPayload: DashboardPayload = {
  validation: { latest: null, history: [] },
  execution: {
    safeMode: true,
    brokerConnected: false,
    brokerProvider: null,
    brokerMode: 'demo',
    brokerServer: null,
    brokerLogin: null,
    brokerAccountId: null,
    brokerLatencyMs: 0,
    orderQueue: [],
    openPositions: [],
    account: { balance: 0, equity: 0, freeMargin: 0, accountStatus: 'healthy', accountHealth: 100 },
    stats: { processedOrders: 0, rejectedOrders: 0, cancelledOrders: 0, closedPositions: 0 },
    credentialVault: [],
    audit: [],
  },
  observability: { counters: 0, timings: 0, avgResponseMs: 0 },
};

export default function AdminSistema() {
  const [loading, setLoading] = useState(true);
  const [runningValidation, setRunningValidation] = useState(false);
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [payload, setPayload] = useState<DashboardPayload>(initialPayload);
  const [error, setError] = useState<string | null>(null);
  const [connector, setConnector] = useState({ provider: 'MT5_SANDBOX', server: 'demo.carvipix.local', login: 'demo_user', password: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/system', { cache: 'no-store' });
      const json = (await response.json().catch(() => ({}))) as { data?: DashboardPayload; error?: string };
      if (!response.ok || !json.data) {
        throw new Error(json.error || 'No se pudo cargar sistema');
      }
      setPayload(json.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runValidation = async () => {
    setRunningValidation(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-validation' }),
      });
      const json = (await response.json().catch(() => ({}))) as { data?: DashboardPayload; error?: string };
      if (!response.ok || !json.data) {
        throw new Error(json.error || 'No se pudo ejecutar validacion');
      }
      setPayload(json.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar validacion');
    } finally {
      setRunningValidation(false);
    }
  };

  const runExecutionCommand = async (command: string, extra?: Record<string, unknown>) => {
    setRunningCommand(command);
    setError(null);
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execution-command', command, ...extra }),
      });
      const json = (await response.json().catch(() => ({}))) as { data?: DashboardPayload; error?: string };
      if (!response.ok || !json.data) {
        throw new Error(json.error || 'No se pudo ejecutar comando de ejecucion');
      }
      setPayload(json.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar comando de ejecucion');
    } finally {
      setRunningCommand(null);
    }
  };

  const latest = payload.validation.latest;
  const statusTone = useMemo(() => {
    if (!latest) return 'warning';
    if (latest.overallStatus === 'pass') return 'success';
    if (latest.overallStatus === 'warn') return 'warning';
    return 'danger';
  }, [latest]);

  if (loading) {
    return <div className="text-white/70">Cargando sistema...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sistema Operativo Final</h2>
        <p className="text-white/60">Validacion sistemica, ejecucion SAFE_MODE, observabilidad y auditoria en un solo tablero.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">System Validation</p>
          <div className="mt-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#D4AF37]" />
            <CARVIPIXBadge variant={statusTone as 'default'}>{latest?.overallStatus ?? 'pending'}</CARVIPIXBadge>
          </div>
          <p className="mt-2 text-xs text-white/50">{latest ? `${latest.summary.pass}/${latest.summary.total} checks ok` : 'No report yet'}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">SAFE_MODE / Connector</p>
          <p className="mt-2 text-2xl font-bold text-white">{payload.execution.safeMode ? 'ON' : 'OFF'}</p>
          <p className="mt-2 text-xs text-white/50">Sandbox {payload.execution.brokerConnected ? 'connected' : 'disconnected'} · {payload.execution.brokerProvider ?? 'none'}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Order Queue</p>
          <p className="mt-2 text-2xl font-bold text-white">{payload.execution.orderQueue.length}</p>
          <p className="mt-2 text-xs text-white/50">Processed {payload.execution.stats.processedOrders}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Account Health</p>
          <p className="mt-2 text-2xl font-bold text-white">{payload.execution.account.accountHealth.toFixed(1)}%</p>
          <p className="mt-2 text-xs text-white/50">{payload.execution.account.accountStatus}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Observability</p>
          <p className="mt-2 text-2xl font-bold text-white">{payload.observability.avgResponseMs.toFixed(1)}ms</p>
          <p className="mt-2 text-xs text-white/50">{payload.observability.counters} counters · {payload.observability.timings} timings · broker {payload.execution.brokerLatencyMs.toFixed(0)}ms</p>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h3 className="text-lg font-semibold mb-3">Broker Sandbox Connector</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={connector.provider}
            onChange={(event) => setConnector((current) => ({ ...current, provider: event.target.value }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          >
            <option value="MT5_SANDBOX">MT5_SANDBOX</option>
            <option value="SIMULATED_BROKER">SIMULATED_BROKER</option>
          </select>
          <input value={connector.server} onChange={(event) => setConnector((current) => ({ ...current, server: event.target.value }))} placeholder="sandbox server" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
          <input value={connector.login} onChange={(event) => setConnector((current) => ({ ...current, login: event.target.value }))} placeholder="login" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
          <input type="password" value={connector.password} onChange={(event) => setConnector((current) => ({ ...current, password: event.target.value }))} placeholder="password" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <CARVIPIXButton
            variant="premium"
            disabled={runningCommand === 'connect-sandbox'}
            onClick={() => void runExecutionCommand('connect-sandbox', { connector })}
          >
            Connect Sandbox
          </CARVIPIXButton>
          <CARVIPIXButton variant="secondary" disabled={runningCommand === 'sync-account'} onClick={() => void runExecutionCommand('sync-account')}>
            Account Sync
          </CARVIPIXButton>
          <CARVIPIXButton variant="ghost" disabled={runningCommand === 'market-tick'} onClick={() => void runExecutionCommand('market-tick')}>
            Market Tick
          </CARVIPIXButton>
        </div>
        <div className="mt-4 text-sm text-white/60">
          Cuenta: {payload.execution.brokerAccountId ?? 'N/A'} · Login: {payload.execution.brokerLogin ?? 'N/A'} · Server: {payload.execution.brokerServer ?? 'N/A'} · Mode: {payload.execution.brokerMode}
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex flex-wrap gap-3">
          <CARVIPIXButton variant="premium" leftIcon={<PlayCircle className="w-4 h-4" />} disabled={runningValidation} onClick={() => void runValidation()}>
            {runningValidation ? 'Running validation...' : 'Run System Validation'}
          </CARVIPIXButton>
          <CARVIPIXButton variant="secondary" leftIcon={<Zap className="w-4 h-4" />} disabled={runningCommand === 'enqueue'} onClick={() => void runExecutionCommand('enqueue', { order: { userId: 'admin-user', symbol: 'EURUSD', type: 'BUY', lots: 0.2 } })}>
            Queue BUY EURUSD
          </CARVIPIXButton>
          <CARVIPIXButton variant="secondary" disabled={runningCommand === 'process-queue'} onClick={() => void runExecutionCommand('process-queue')}>
            Process Queue
          </CARVIPIXButton>
          <CARVIPIXButton variant="ghost" leftIcon={<RefreshCw className="w-4 h-4" />} disabled={runningCommand === 'heartbeat'} onClick={() => void runExecutionCommand('heartbeat')}>
            Heartbeat
          </CARVIPIXButton>
          <CARVIPIXButton variant="ghost" leftIcon={<AlertTriangle className="w-4 h-4" />} disabled={runningCommand === 'recover'} onClick={() => void runExecutionCommand('recover', { reason: 'crash' })}>
            Recovery Drill
          </CARVIPIXButton>
          <CARVIPIXButton variant="ghost" leftIcon={<ShieldAlert className="w-4 h-4" />} onClick={() => void load()}>
            Refresh Snapshot
          </CARVIPIXButton>
        </div>
      </CARVIPIXCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-3">Validation Report</h3>
          <div className="space-y-2">
            {(latest?.checks ?? []).map((check) => (
              <div key={check.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{check.title}</p>
                  <CARVIPIXBadge variant={check.status === 'pass' ? 'success' : check.status === 'warn' ? 'warning' : 'danger'}>{check.status}</CARVIPIXBadge>
                </div>
                <p className="mt-1 text-white/60">{check.details}</p>
                <p className="mt-1 text-xs text-white/40">{check.durationMs.toFixed(1)} ms</p>
              </div>
            ))}
            {(latest?.checks ?? []).length === 0 && <p className="text-sm text-white/50">No validation executed yet.</p>}
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-3">Execution Timeline & Audit</h3>
          <div className="space-y-2">
            {payload.execution.audit.slice(0, 12).map((event) => (
              <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{event.category}.{event.action}</p>
                  <CARVIPIXBadge variant={event.result === 'success' ? 'success' : event.result === 'denied' ? 'warning' : 'danger'}>{event.result}</CARVIPIXBadge>
                </div>
                <p className="mt-1 text-white/60">{event.details ?? 'No details'}</p>
                <p className="mt-1 text-xs text-white/40">{new Date(event.timestamp).toLocaleString('es-ES')}</p>
              </div>
            ))}
            {payload.execution.audit.length === 0 && <p className="text-sm text-white/50">No audit events yet.</p>}
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-semibold mb-3">Credential Vault (Sanitized)</h3>
          <div className="space-y-2">
            {payload.execution.credentialVault.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium text-white">{entry.provider} · {entry.login}</p>
                <p className="mt-1 text-white/60">{entry.server} · {entry.mode}</p>
                <p className="mt-1 text-xs text-white/40">Updated {new Date(entry.updatedAt).toLocaleString('es-ES')}</p>
              </div>
            ))}
            {payload.execution.credentialVault.length === 0 && <p className="text-sm text-white/50">No vault entries yet.</p>}
          </div>
        </CARVIPIXCard>
      </div>
    </div>
  );
}
