'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, AlertCircle, CheckCircle2, CreditCard, LifeBuoy, LogOut, ShieldCheck, Users } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type TabType = 'inicio' | 'clientes' | 'membresias' | 'pagos' | 'servicio' | 'soporte';

type Overview = {
  registeredPeople: number;
  activePeople: number;
  newToday: number;
  activeMemberships: number;
  monthRevenue: number;
  failedPayments: number;
  serviceState: 'ACTIVO' | 'SUSPENDIDO';
  importantNotices: string[];
};

type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string | null;
  plan: string;
  status: string;
  membershipStatus: string;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  lastPaymentCurrency: string | null;
};

type MembershipRow = {
  userId: string;
  name: string;
  email: string;
  plan: string;
  state: string;
  startedAt: string | null;
  endsAt: string | null;
  nextRenewalAt: string | null;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  currency: string | null;
};

type PaymentRow = {
  orderId: string;
  userId: string;
  client: string;
  email: string;
  amount: number;
  currency: string;
  plan: string;
  createdAt: string;
  status: string;
  nextRenewalAt: string | null;
};

type ServiceSnapshot = {
  serviceState: 'ACTIVO' | 'SUSPENDIDO';
  brainState: string;
  telegramConnected: boolean;
  lastActivityAt: string | null;
  lastImportantError: string | null;
};

type SupportRow = {
  id: string;
  userId: string;
  clientName: string;
  subject: string;
  createdAt: string;
  status: string;
  adminReply: string | null;
};

type ExecutivePayload = {
  overview: Overview;
  clients: ClientRow[];
  memberships: MembershipRow[];
  payments: PaymentRow[];
  failedPayments: PaymentRow[];
  service: ServiceSnapshot;
  support: SupportRow[];
};

type ApiResponse = {
  ok?: boolean;
  data?: ExecutivePayload;
  error?: string;
  message?: string;
};

interface AdminDashboardProps {
  onLogout: () => void;
}

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null || currency === null) return 'Sin actividad registrada.';
  return `${currency.toUpperCase()} ${Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'Sin actividad registrada.';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin actividad registrada.';
  return date.toLocaleString('es-ES');
}

function waitingTime(value: string): string {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return 'Sin actividad registrada.';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours} h ${mins} min`;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [payload, setPayload] = useState<ExecutivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportRow | null>(null);
  const [supportReply, setSupportReply] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['inicio', 'clientes', 'membresias', 'pagos', 'servicio', 'soporte'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/executive', { cache: 'no-store' });
      const json = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !json.ok || !json.data) {
        throw new Error(json.error || 'No se pudo cargar el panel ejecutivo.');
      }
      setPayload(json.data);
    } catch (caught) {
      setPayload(null);
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el panel ejecutivo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function handleTabChange(tab: TabType) {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  }

  async function runAction(action: string, body: Record<string, unknown>, successMessage: string) {
    if (busyAction) return;
    setBusyAction(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const json = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo completar la acción.');
      }
      setMessage(json.message || successMessage);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar la acción.');
    } finally {
      setBusyAction(null);
    }
  }

  async function suspendClient(userId: string) {
    if (!window.confirm('¿Confirmas suspender el acceso de este cliente?')) return;
    await runAction('suspend-client', { userId }, 'Cliente suspendido.');
  }

  async function reactivateClient(userId: string) {
    if (!window.confirm('¿Confirmas reactivar el acceso de este cliente?')) return;
    await runAction('reactivate-client', { userId }, 'Cliente reactivado.');
  }

  async function suspendService() {
    if (!window.confirm('¿Confirmas suspender el servicio CARVIPIX?')) return;
    await runAction('suspend-service', {}, 'Servicio suspendido.');
  }

  async function reactivateService() {
    if (!window.confirm('¿Confirmas reactivar el servicio CARVIPIX?')) return;
    await runAction('reactivate-service', {}, 'Servicio reactivado.');
  }

  async function closeTicket(ticketId: string) {
    if (!window.confirm('¿Confirmas cerrar esta solicitud?')) return;
    await runAction('close-support', { ticketId }, 'Solicitud cerrada.');
  }

  async function respondTicket(ticketId: string) {
    const reply = supportReply.trim();
    if (!reply) {
      setError('Escribe una respuesta antes de enviar.');
      return;
    }
    await runAction('respond-support', { ticketId, reply }, 'Respuesta enviada al cliente.');
    setSupportReply('');
    setSelectedTicket(null);
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = useMemo(
    () => [
      { id: 'inicio', label: 'Inicio', icon: <Activity className="h-4 w-4" /> },
      { id: 'clientes', label: 'Clientes', icon: <Users className="h-4 w-4" /> },
      { id: 'membresias', label: 'Membresías', icon: <ShieldCheck className="h-4 w-4" /> },
      { id: 'pagos', label: 'Pagos', icon: <CreditCard className="h-4 w-4" /> },
      { id: 'servicio', label: 'Servicio', icon: <CheckCircle2 className="h-4 w-4" /> },
      { id: 'soporte', label: 'Soporte', icon: <LifeBuoy className="h-4 w-4" /> },
    ],
    []
  );

  const overview = payload?.overview;

  return (
    <main className="min-h-screen bg-[#080706] text-white">
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-gradient-to-b from-[#17120a] to-[#080706]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold text-[#D4AF37]">CARVIPIX Administración</h1>
            <p className="text-xs text-white/60">Centro directivo empresarial</p>
          </div>
          <div className="flex items-center gap-3">
            <CARVIPIXButton variant="ghost" size="sm" onClick={() => void load()} disabled={loading || Boolean(busyAction)}>
              Actualizar
            </CARVIPIXButton>
            <CARVIPIXButton onClick={onLogout} variant="ghost" size="sm" leftIcon={<LogOut className="h-4 w-4" />}>
              Cerrar sesión
            </CARVIPIXButton>
          </div>
        </div>
      </header>

      <nav className="border-b border-[#D4AF37]/10 bg-[#12100d]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-1 sm:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[#1f1911] text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        {error && <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>}

        {loading ? <p className="text-white/70">Cargando información real...</p> : null}

        {!loading && payload && activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Personas registradas</p><p className="mt-2 text-3xl font-bold text-white">{overview?.registeredPeople ?? 0}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Personas activas</p><p className="mt-2 text-3xl font-bold text-white">{overview?.activePeople ?? 0}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Registros nuevos hoy</p><p className="mt-2 text-3xl font-bold text-white">{overview?.newToday ?? 0}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Membresías activas</p><p className="mt-2 text-3xl font-bold text-white">{overview?.activeMemberships ?? 0}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Ingresos del mes</p><p className="mt-2 text-3xl font-bold text-white">{formatMoney(overview?.monthRevenue ?? 0, 'usd')}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Pagos fallidos</p><p className="mt-2 text-3xl font-bold text-white">{overview?.failedPayments ?? 0}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Estado general</p><p className="mt-2 text-3xl font-bold text-white">{overview?.serviceState ?? 'SUSPENDIDO'}</p></CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false}><p className="text-xs text-white/60">Soporte pendiente</p><p className="mt-2 text-3xl font-bold text-white">{payload.support.filter((row) => row.status !== 'closed' && row.status !== 'resolved').length}</p></CARVIPIXCard>
            </div>

            <CARVIPIXCard variant="admin" padding="16" hover={false}>
              <h3 className="mb-3 text-lg font-semibold">Avisos importantes</h3>
              {overview && overview.importantNotices.length > 0 ? (
                <ul className="space-y-2 text-sm text-white/80">
                  {overview.importantNotices.map((notice) => (
                    <li key={notice} className="rounded-lg border border-white/10 bg-white/5 p-3">{notice}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/70">Sin actividad registrada.</p>
              )}
            </CARVIPIXCard>
          </div>
        )}

        {!loading && payload && activeTab === 'clientes' && (
          <div className="space-y-4">
            <CARVIPIXCard variant="admin" padding="16" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Correo</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Teléfono</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Registro</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Plan</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Último pago</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.clients.length === 0 ? (
                      <tr><td className="px-4 py-6 text-sm text-white/60" colSpan={8}>Sin actividad registrada.</td></tr>
                    ) : (
                      payload.clients.map((client) => (
                        <tr key={client.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-sm text-white">{client.name}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{client.email}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{client.phone ?? 'Sin actividad registrada.'}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatDate(client.registeredAt)}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{client.plan}</td>
                          <td className="px-4 py-3"><CARVIPIXBadge variant={client.membershipStatus === 'activo' ? 'success' : 'warning'}>{client.membershipStatus}</CARVIPIXBadge></td>
                          <td className="px-4 py-3 text-sm text-white/80">{client.lastPaymentAt ? `${formatDate(client.lastPaymentAt)} · ${formatMoney(client.lastPaymentAmount, client.lastPaymentCurrency)}` : 'Sin actividad registrada.'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <CARVIPIXButton size="sm" variant="ghost" onClick={() => setSelectedClient(client)}>Ver cliente</CARVIPIXButton>
                              <CARVIPIXButton size="sm" variant="danger" disabled={busyAction === 'suspend-client'} onClick={() => void suspendClient(client.id)}>Suspender acceso</CARVIPIXButton>
                              <CARVIPIXButton size="sm" variant="secondary" disabled={busyAction === 'reactivate-client'} onClick={() => void reactivateClient(client.id)}>Reactivar acceso</CARVIPIXButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CARVIPIXCard>

            {selectedClient && (
              <CARVIPIXCard variant="admin" padding="16" hover={false}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Detalle de cliente</h3>
                  <CARVIPIXButton size="sm" variant="ghost" onClick={() => setSelectedClient(null)}>Cerrar</CARVIPIXButton>
                </div>
                <div className="grid gap-2 text-sm text-white/80 md:grid-cols-2">
                  <p><span className="text-white">Nombre:</span> {selectedClient.name}</p>
                  <p><span className="text-white">Correo:</span> {selectedClient.email}</p>
                  <p><span className="text-white">Teléfono:</span> {selectedClient.phone ?? 'Sin actividad registrada.'}</p>
                  <p><span className="text-white">Registro:</span> {formatDate(selectedClient.registeredAt)}</p>
                  <p><span className="text-white">Plan:</span> {selectedClient.plan}</p>
                  <p><span className="text-white">Estado:</span> {selectedClient.membershipStatus}</p>
                </div>
              </CARVIPIXCard>
            )}
          </div>
        )}

        {!loading && payload && activeTab === 'membresias' && (
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Correo</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Plan</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Inicio</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Próxima renovación</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Último pago</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.memberships.length === 0 ? (
                    <tr><td className="px-4 py-6 text-sm text-white/60" colSpan={7}>Sin actividad registrada.</td></tr>
                  ) : (
                    payload.memberships.map((membership) => (
                      <tr key={membership.userId} className="border-b border-white/5">
                        <td className="px-4 py-3 text-sm text-white">{membership.name}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{membership.email}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{membership.plan}</td>
                        <td className="px-4 py-3"><CARVIPIXBadge variant={membership.state === 'activo' ? 'success' : 'warning'}>{membership.state}</CARVIPIXBadge></td>
                        <td className="px-4 py-3 text-sm text-white/80">{formatDate(membership.startedAt)}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{formatDate(membership.nextRenewalAt)}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{membership.lastPaymentAt ? `${formatDate(membership.lastPaymentAt)} · ${formatMoney(membership.lastPaymentAmount, membership.currency)}` : 'Sin actividad registrada.'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        )}

        {!loading && payload && activeTab === 'pagos' && (
          <div className="space-y-4">
            <CARVIPIXCard variant="admin" padding="16" hover={false}>
              <h3 className="mb-3 text-lg font-semibold">Pagos registrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Monto</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Plan</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Próxima renovación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.payments.length === 0 ? (
                      <tr><td className="px-4 py-6 text-sm text-white/60" colSpan={6}>Sin actividad registrada.</td></tr>
                    ) : (
                      payload.payments.map((payment) => (
                        <tr key={payment.orderId} className="border-b border-white/5">
                          <td className="px-4 py-3 text-sm text-white">{payment.client}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatMoney(payment.amount, payment.currency)}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{payment.plan}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatDate(payment.createdAt)}</td>
                          <td className="px-4 py-3"><CARVIPIXBadge variant={['paid', 'captured', 'completed', 'settled'].includes(payment.status.toLowerCase()) ? 'success' : 'warning'}>{payment.status}</CARVIPIXBadge></td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatDate(payment.nextRenewalAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CARVIPIXCard>

            <CARVIPIXCard variant="admin" padding="16" hover={false}>
              <h3 className="mb-3 text-lg font-semibold">Pagos fallidos</h3>
              {payload.failedPayments.length === 0 ? (
                <p className="text-sm text-white/70">Sin actividad registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/10 bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-white/60">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs text-white/60">Monto</th>
                        <th className="px-4 py-3 text-left text-xs text-white/60">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.failedPayments.map((payment) => (
                        <tr key={payment.orderId} className="border-b border-white/5">
                          <td className="px-4 py-3 text-sm text-white">{payment.client}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatMoney(payment.amount, payment.currency)}</td>
                          <td className="px-4 py-3 text-sm text-white/80">{formatDate(payment.createdAt)}</td>
                          <td className="px-4 py-3"><CARVIPIXBadge variant="danger">{payment.status}</CARVIPIXBadge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CARVIPIXCard>
          </div>
        )}

        {!loading && payload && activeTab === 'servicio' && (
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div><p className="text-xs text-white/60">Servicio CARVIPIX</p><p className="mt-1 text-lg font-semibold text-white">{payload.service.serviceState}</p></div>
              <div><p className="text-xs text-white/60">Cerebro</p><p className="mt-1 text-lg font-semibold text-white">{payload.service.brainState}</p></div>
              <div><p className="text-xs text-white/60">Telegram</p><p className="mt-1 text-lg font-semibold text-white">{payload.service.telegramConnected ? 'Conectado' : 'Desconectado'}</p></div>
              <div><p className="text-xs text-white/60">Última actividad</p><p className="mt-1 text-sm text-white/85">{formatDate(payload.service.lastActivityAt)}</p></div>
              <div><p className="text-xs text-white/60">Último error importante</p><p className="mt-1 text-sm text-white/85">{payload.service.lastImportantError || 'Sin actividad registrada.'}</p></div>
            </div>

            <div className="mt-5 flex gap-3">
              <CARVIPIXButton variant="danger" disabled={busyAction === 'suspend-service'} onClick={() => void suspendService()}>
                Suspender servicio
              </CARVIPIXButton>
              <CARVIPIXButton variant="secondary" disabled={busyAction === 'reactivate-service'} onClick={() => void reactivateService()}>
                Reactivar servicio
              </CARVIPIXButton>
            </div>
          </CARVIPIXCard>
        )}

        {!loading && payload && activeTab === 'soporte' && (
          <div className="space-y-4">
            <CARVIPIXCard variant="admin" padding="16" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Pendiente</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Asunto</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Tiempo de espera</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                      <th className="px-4 py-3 text-left text-xs text-white/60">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.support.length === 0 ? (
                      <tr><td className="px-4 py-6 text-sm text-white/60" colSpan={7}>Sin actividad registrada.</td></tr>
                    ) : (
                      payload.support.map((ticket) => {
                        const pending = !(ticket.status === 'closed' || ticket.status === 'resolved');
                        return (
                          <tr key={ticket.id} className="border-b border-white/5">
                            <td className="px-4 py-3 text-sm text-white">{pending ? 'Sí' : 'No'}</td>
                            <td className="px-4 py-3 text-sm text-white/85">{ticket.clientName}</td>
                            <td className="px-4 py-3 text-sm text-white/85">{ticket.subject}</td>
                            <td className="px-4 py-3 text-sm text-white/85">{formatDate(ticket.createdAt)}</td>
                            <td className="px-4 py-3 text-sm text-white/85">{pending ? waitingTime(ticket.createdAt) : '0 min'}</td>
                            <td className="px-4 py-3"><CARVIPIXBadge variant={pending ? 'warning' : 'success'}>{ticket.status}</CARVIPIXBadge></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <CARVIPIXButton size="sm" variant="ghost" onClick={() => { setSelectedTicket(ticket); setSupportReply(ticket.adminReply ?? ''); }}>Ver solicitud</CARVIPIXButton>
                                <CARVIPIXButton size="sm" variant="secondary" onClick={() => { setSelectedTicket(ticket); setSupportReply(ticket.adminReply ?? ''); }}>Responder</CARVIPIXButton>
                                <CARVIPIXButton size="sm" variant="danger" disabled={busyAction === 'close-support'} onClick={() => void closeTicket(ticket.id)}>Cerrar solicitud</CARVIPIXButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CARVIPIXCard>

            {selectedTicket && (
              <CARVIPIXCard variant="admin" padding="16" hover={false}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Solicitud de soporte</h3>
                  <CARVIPIXButton size="sm" variant="ghost" onClick={() => setSelectedTicket(null)}>Cerrar</CARVIPIXButton>
                </div>
                <p className="text-sm text-white/80"><span className="text-white">Cliente:</span> {selectedTicket.clientName}</p>
                <p className="text-sm text-white/80"><span className="text-white">Asunto:</span> {selectedTicket.subject}</p>
                <p className="mt-3 text-xs text-white/60">Respuesta</p>
                <textarea
                  value={supportReply}
                  onChange={(event) => setSupportReply(event.target.value)}
                  className="mt-1 min-h-32 w-full rounded-lg border border-white/15 bg-black/20 p-3 text-sm text-white"
                  placeholder="Escribe la respuesta al cliente"
                />
                <div className="mt-3">
                  <CARVIPIXButton size="sm" variant="secondary" disabled={busyAction === 'respond-support'} onClick={() => void respondTicket(selectedTicket.id)}>
                    Enviar respuesta
                  </CARVIPIXButton>
                </div>
              </CARVIPIXCard>
            )}
          </div>
        )}
      </section>

      <footer className="border-t border-[#D4AF37]/10 bg-[#0f0d0a] py-5 text-center text-xs text-white/55">
        CARVIPIX Centro Administrativo Privado
      </footer>
    </main>
  );
}
