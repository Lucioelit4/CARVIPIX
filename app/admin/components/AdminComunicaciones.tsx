'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Mail, RefreshCw, Send } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type CommunicationEvent = {
  id: string;
  action: string;
  resource: string;
  result: 'success' | 'denied' | 'error';
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type CommunicationsData = {
  transport: {
    mode: 'smtp' | 'noop';
    smtpReady: boolean;
    fromName: string;
    appPublicUrl: string;
    addresses: {
      noreply: string;
      soporte: string;
      pagos: string;
    };
  };
  metrics: {
    sent: number;
    failed: number;
    noop: number;
    campaigns: number;
    queuedPending: number;
    queuedProcessing: number;
    queuedFailed: number;
  };
  recentEvents: CommunicationEvent[];
  templates: Array<{
    type: string;
    category: string;
    subject: string;
    preheader: string;
  }>;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-ES');
}

export default function AdminComunicaciones() {
  const [data, setData] = useState<CommunicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState<'welcome' | 'password-reset' | 'promotion' | 'identity-received' | 'identity-approved' | 'identity-rejected' | 'identity-new-document'>('welcome');
  const [retryOutboxId, setRetryOutboxId] = useState('');
  const [busyAction, setBusyAction] = useState<'test' | 'retry' | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/communications', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CommunicationsData; error?: string };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo cargar el centro de comunicaciones');
      }

      setData(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el centro de comunicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = Promise.resolve().then(() => load());
    void task;
  }, []);

  const sendTestEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!testEmail.trim()) {
      setError('Ingresa un correo de prueba.');
      return;
    }

    setBusyAction('test');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendTestEmail', recipientEmail: testEmail, template: testTemplate }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || 'No se pudo enviar correo de prueba');
      }

      setMessage('Correo de prueba enviado. Revisa bandeja y logs de eventos.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo enviar correo de prueba');
    } finally {
      setBusyAction(null);
    }
  };

  const retryOutbox = async (event: FormEvent) => {
    event.preventDefault();
    if (!retryOutboxId.trim()) {
      setError('Ingresa un ID de outbox fallido.');
      return;
    }

    setBusyAction('retry');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retryOutboxEmail', outboxEventId: retryOutboxId }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || 'No se pudo reencolar el outbox.');
      }

      setMessage(payload.message || 'Evento encolado para reintento.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo reencolar el outbox.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Centro de Comunicaciones</h2>
        <p className="text-white/60">Monitorea entrega de correos, cola transaccional y campanas comerciales.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div> : null}

      <div className="flex justify-end">
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>
          Refrescar
        </CARVIPIXButton>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Enviados SMTP</p>
          <p className="mt-2 text-2xl font-bold text-green-400">{data?.metrics.sent ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Fallidos</p>
          <p className="mt-2 text-2xl font-bold text-red-400">{data?.metrics.failed ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Pendientes cola</p>
          <p className="mt-2 text-2xl font-bold text-[#D4AF37]">{data?.metrics.queuedPending ?? 0}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60">Campanas enviadas</p>
          <p className="mt-2 text-2xl font-bold text-white">{data?.metrics.campaigns ?? 0}</p>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-[#D4AF37]" /> Estado de transporte</h3>
          <CARVIPIXBadge variant={data?.transport.mode === 'smtp' && data?.transport.smtpReady ? 'success' : 'warning'}>
            {data?.transport.mode === 'smtp' && data?.transport.smtpReady ? 'SMTP ACTIVO' : 'NOOP / SMTP INCOMPLETO'}
          </CARVIPIXBadge>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-white/75 md:grid-cols-2">
          <p>Modo: <span className="text-white">{data?.transport.mode ?? '-'}</span></p>
          <p>SMTP listo: <span className="text-white">{data?.transport.smtpReady ? 'Si' : 'No'}</span></p>
          <p>From: <span className="text-white">{data?.transport.fromName ?? '-'}</span></p>
          <p>App URL: <span className="text-white">{data?.transport.appPublicUrl ?? '-'}</span></p>
        </div>
      </CARVIPIXCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-bold mb-4">Enviar correo de prueba</h3>
          <form className="space-y-3" onSubmit={(event) => void sendTestEmail(event)}>
            <input
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="correo@dominio.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <select
              value={testTemplate}
              onChange={(event) => setTestTemplate(event.target.value as 'welcome' | 'password-reset' | 'promotion' | 'identity-received' | 'identity-approved' | 'identity-rejected' | 'identity-new-document')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <option value="welcome">Bienvenida / Verificacion</option>
              <option value="password-reset">Recuperacion de contrasena</option>
              <option value="promotion">Promocion comercial</option>
              <option value="identity-received">Identidad recibida</option>
              <option value="identity-approved">Identidad aprobada</option>
              <option value="identity-rejected">Identidad rechazada</option>
              <option value="identity-new-document">Solicitud nuevo documento</option>
            </select>
            <CARVIPIXButton type="submit" variant="premium" fullWidth isLoading={busyAction === 'test'} leftIcon={<Send className="w-4 h-4" />}>
              Enviar prueba
            </CARVIPIXButton>
          </form>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-bold mb-4">Reintentar outbox fallido</h3>
          <form className="space-y-3" onSubmit={(event) => void retryOutbox(event)}>
            <input
              type="text"
              value={retryOutboxId}
              onChange={(event) => setRetryOutboxId(event.target.value)}
              placeholder="ID de payment_outbox_events"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <CARVIPIXButton type="submit" variant="secondary" fullWidth isLoading={busyAction === 'retry'}>
              Reencolar evento
            </CARVIPIXButton>
          </form>
          <p className="mt-2 text-xs text-white/60">Usa este flujo para casos de email transaccional fallido por proveedor.</p>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h3 className="text-lg font-bold mb-3">Eventos recientes</h3>
        {loading ? (
          <p className="text-sm text-white/60">Cargando eventos...</p>
        ) : (data?.recentEvents.length ?? 0) === 0 ? (
          <p className="text-sm text-white/60">Sin eventos aun.</p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-auto">
            {(data?.recentEvents ?? []).map((event) => (
              <div key={event.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/75">
                <p className="font-semibold text-white">{event.action}</p>
                <p className="mt-1">Recurso: {event.resource}</p>
                <p className="mt-1">Resultado: {event.result}</p>
                <p className="mt-1 text-white/60">{formatDate(event.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h3 className="text-lg font-bold mb-3">Catalogo de copys</h3>
        <div className="max-h-80 overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Asunto</th>
                <th className="px-3 py-2">Preheader</th>
              </tr>
            </thead>
            <tbody>
              {(data?.templates ?? []).map((template) => (
                <tr key={template.type} className="border-b border-white/5">
                  <td className="px-3 py-2 text-white/80">{template.type}</td>
                  <td className="px-3 py-2 text-white/70">{template.category}</td>
                  <td className="px-3 py-2 text-white">{template.subject}</td>
                  <td className="px-3 py-2 text-white/70">{template.preheader}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>
    </div>
  );
}
