'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, ShieldCheck, CheckCircle2, XCircle, RotateCcw, PauseCircle, Crown, Save } from 'lucide-react';
import DetailModal from './DetailModal';
import { useToast } from './Toast';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type AdminPlan = 'demo' | 'pro' | 'premium' | 'enterprise';
type AdminMembershipState = 'activo' | 'cancelado' | 'vencido' | 'inactivo';
type SubscriptionPlan = 'basic' | 'advanced' | 'pro' | 'elite';

type AdminUser = {
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  userPlan: AdminPlan;
  userState: string;
  verificado: boolean;
  membershipPlan: AdminPlan;
  membershipState: AdminMembershipState;
  fechaInicio: string | null;
  fechaFin: string | null;
  renovacionAutomatica: boolean;
  createdAt: string | null;
  hasActiveMembership: boolean;
};

type AdminPayment = {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  fecha: string;
};

type AdminMembershipSnapshot = {
  users: AdminUser[];
  payments: AdminPayment[];
  entitlements: PlanEntitlement[];
};

type PlanEntitlement = {
  plan: SubscriptionPlan;
  alertsEnabled: boolean;
  botEnabled: boolean;
  maxAlertsPerDay: number;
  maxPairs: number;
  maxBots: number;
  allowedPairs: string[] | null;
};

type PlanEntitlementDraft = {
  plan: SubscriptionPlan;
  alertsEnabled: boolean;
  botEnabled: boolean;
  maxAlertsPerDay: number;
  maxPairs: number;
  maxBots: number;
  allowedPairsText: string;
};

const PLAN_OPTIONS: AdminPlan[] = ['demo', 'pro', 'premium', 'enterprise'];
const DURATION_OPTIONS = [30, 90, 180, 365];

function buildEmptyDrafts(): Record<SubscriptionPlan, PlanEntitlementDraft> {
  return {
    basic: { plan: 'basic', alertsEnabled: true, botEnabled: false, maxAlertsPerDay: 3, maxPairs: 3, maxBots: 0, allowedPairsText: 'EURUSD, GBPUSD, XAUUSD' },
    advanced: { plan: 'advanced', alertsEnabled: true, botEnabled: false, maxAlertsPerDay: 10, maxPairs: 8, maxBots: 0, allowedPairsText: 'EURUSD, GBPUSD, USDJPY, XAUUSD, BTCUSD, ETHUSD' },
    pro: { plan: 'pro', alertsEnabled: true, botEnabled: true, maxAlertsPerDay: 30, maxPairs: 20, maxBots: 2, allowedPairsText: 'ALL' },
    elite: { plan: 'elite', alertsEnabled: true, botEnabled: true, maxAlertsPerDay: 200, maxPairs: 100, maxBots: 10, allowedPairsText: 'ALL' },
  };
}

function toEntitlementDraft(entitlement: PlanEntitlement): PlanEntitlementDraft {
  return {
    plan: entitlement.plan,
    alertsEnabled: entitlement.alertsEnabled,
    botEnabled: entitlement.botEnabled,
    maxAlertsPerDay: entitlement.maxAlertsPerDay,
    maxPairs: entitlement.maxPairs,
    maxBots: entitlement.maxBots,
    allowedPairsText: entitlement.allowedPairs ? entitlement.allowedPairs.join(', ') : 'ALL',
  };
}

function planLabel(plan: AdminPlan) {
  return plan.toUpperCase();
}

function stateLabel(state: AdminMembershipState) {
  return state;
}

export default function AdminMembresias() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEntitlementPlan, setSavingEntitlementPlan] = useState<SubscriptionPlan | null>(null);
  const [search, setSearch] = useState('');
  const [snapshot, setSnapshot] = useState<AdminMembershipSnapshot>({ users: [], payments: [], entitlements: [] });
  const [entitlementDrafts, setEntitlementDrafts] = useState<Record<SubscriptionPlan, PlanEntitlementDraft>>(buildEmptyDrafts());
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan>('pro');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  const applySnapshot = (data: AdminMembershipSnapshot) => {
    setSnapshot(data);
    const nextDrafts = buildEmptyDrafts();
    for (const entitlement of data.entitlements) {
      nextDrafts[entitlement.plan] = toEntitlementDraft(entitlement);
    }
    setEntitlementDrafts(nextDrafts);
  };

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/memberships', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: AdminMembershipSnapshot; error?: string };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo cargar');
      }

      applySnapshot(payload.data);
    } catch {
      applySnapshot({ users: [], payments: [], entitlements: [] });
      showToast('No se pudo cargar la gestión de membresías.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const filteredUsers = useMemo(() => {
    return snapshot.users.filter((user) => {
      const haystack = `${user.userId} ${user.nombre} ${user.apellido} ${user.email} ${user.membershipPlan} ${user.membershipState}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [search, snapshot.users]);

  const filteredPayments = useMemo(() => {
    return snapshot.payments.filter((payment) => {
      const haystack = `${payment.id} ${payment.userId} ${payment.productId} ${payment.status}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [search, snapshot.payments]);

  const summary = useMemo(() => {
    const totalUsers = snapshot.users.length;
    const active = snapshot.users.filter((user) => user.membershipState === 'activo').length;
    const expired = snapshot.users.filter((user) => user.membershipState === 'vencido').length;
    const paid = snapshot.payments.filter((payment) => payment.status === 'completed').length;
    return { totalUsers, active, expired, paid };
  }, [snapshot]);

  const openUserModal = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedPlan(user.membershipPlan === 'demo' ? 'pro' : user.membershipPlan);
    setSelectedDuration(30);
    setIsModalOpen(true);
  };

  const submitAction = async (action: 'activate' | 'renew' | 'cancel' | 'change-plan' | 'deactivate') => {
    if (!selectedUser || saving) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          action,
          plan: selectedPlan,
          durationDays: selectedDuration,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: AdminMembershipSnapshot; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo actualizar');
      }

      applySnapshot(payload.data);
      const updatedUser = payload.data.users.find((user) => user.userId === selectedUser.userId) ?? null;
      setSelectedUser(updatedUser);
      if (updatedUser) {
        setSelectedPlan(updatedUser.membershipPlan === 'demo' ? 'pro' : updatedUser.membershipPlan);
      }
      showToast('Membresía actualizada correctamente.', 'success');
    } catch {
      showToast('No se pudo actualizar la membresía.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateEntitlementDraft = <K extends keyof PlanEntitlementDraft>(plan: SubscriptionPlan, field: K, value: PlanEntitlementDraft[K]) => {
    setEntitlementDrafts((current) => ({
      ...current,
      [plan]: {
        ...current[plan],
        [field]: value,
      },
    }));
  };

  const saveEntitlements = async (plan: SubscriptionPlan) => {
    const draft = entitlementDrafts[plan];
    if (!draft) {
      return;
    }

    setSavingEntitlementPlan(plan);
    try {
      const allowedPairsRaw = draft.allowedPairsText.trim();
      const allowedPairs = allowedPairsRaw === '' || allowedPairsRaw.toUpperCase() === 'ALL'
        ? null
        : allowedPairsRaw.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);

      const response = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-entitlements',
          subscriptionPlan: plan,
          entitlements: {
            alertsEnabled: draft.alertsEnabled,
            botEnabled: draft.botEnabled,
            maxAlertsPerDay: draft.maxAlertsPerDay,
            maxPairs: draft.maxPairs,
            maxBots: draft.maxBots,
            allowedPairs,
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: AdminMembershipSnapshot; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo actualizar límites');
      }

      applySnapshot(payload.data);
      showToast('Entitlements del plan actualizados.', 'success');
    } catch {
      showToast('No se pudieron actualizar los límites del plan.', 'error');
    } finally {
      setSavingEntitlementPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Membresías y Acceso</h2>
          <p className="text-white/60">Activa, renueva, cancela o cambia planes desde la interfaz administrativa.</p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void loadSnapshot()} disabled={loading}>
          Actualizar
        </CARVIPIXButton>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por usuario, email, plan o estado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid gap-4 md:grid-cols-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Usuarios</p>
          <p className="text-2xl font-bold text-white">{summary.totalUsers}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Activas</p>
          <p className="text-2xl font-bold text-green-400">{summary.active}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Vencidas</p>
          <p className="text-2xl font-bold text-red-400">{summary.expired}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Pagos</p>
          <p className="text-2xl font-bold text-[#D4AF37]">{summary.paid}</p>
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="mb-4 flex items-center gap-2 text-[#D4AF37]">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Entitlements por plan</h3>
          </div>
          <div className="space-y-4">
            {(['basic', 'advanced', 'pro', 'elite'] as SubscriptionPlan[]).map((plan) => {
              const draft = entitlementDrafts[plan];
              return (
                <div key={plan} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/60">Plan comercial</p>
                      <p className="text-lg font-semibold text-white uppercase">{plan}</p>
                    </div>
                    <CARVIPIXButton
                      variant="premium"
                      size="sm"
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={() => void saveEntitlements(plan)}
                      disabled={savingEntitlementPlan === plan}
                    >
                      Guardar límites
                    </CARVIPIXButton>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-6">
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Alertas</span>
                      <select
                        value={draft.alertsEnabled ? '1' : '0'}
                        onChange={(e) => updateEntitlementDraft(plan, 'alertsEnabled', e.target.value === '1')}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      >
                        <option value="1" className="bg-[#030303] text-white">Permitido</option>
                        <option value="0" className="bg-[#030303] text-white">Bloqueado</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-white/70">
                      <span>Bot</span>
                      <select
                        value={draft.botEnabled ? '1' : '0'}
                        onChange={(e) => updateEntitlementDraft(plan, 'botEnabled', e.target.value === '1')}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      >
                        <option value="1" className="bg-[#030303] text-white">Permitido</option>
                        <option value="0" className="bg-[#030303] text-white">Bloqueado</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-white/70">
                      <span>Alertas/día</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.maxAlertsPerDay}
                        onChange={(e) => updateEntitlementDraft(plan, 'maxAlertsPerDay', Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-white/70">
                      <span>Pares</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.maxPairs}
                        onChange={(e) => updateEntitlementDraft(plan, 'maxPairs', Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-white/70">
                      <span>Bots</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.maxBots}
                        onChange={(e) => updateEntitlementDraft(plan, 'maxBots', Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-white/70 lg:col-span-2">
                      <span>Pares permitidos</span>
                      <input
                        type="text"
                        value={draft.allowedPairsText}
                        onChange={(e) => updateEntitlementDraft(plan, 'allowedPairsText', e.target.value)}
                        placeholder="ALL o EURUSD, BTCUSD"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="mb-4 flex items-center gap-2 text-[#D4AF37]">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Usuarios y membresías</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado membresía</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acceso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-white/60">Cargando...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-white/60">Sin datos</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{`${user.nombre} ${user.apellido}`.trim() || 'Sin datos'}</p>
                        <p className="text-xs text-white/40 font-mono">{user.userId}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">{user.email}</td>
                      <td className="px-4 py-4">
                        <CARVIPIXBadge variant={user.membershipPlan === 'enterprise' ? 'admin' : user.membershipPlan === 'premium' ? 'premium' : user.membershipPlan === 'pro' ? 'warning' : 'default'}>{planLabel(user.membershipPlan)}</CARVIPIXBadge>
                      </td>
                      <td className="px-4 py-4">
                        <CARVIPIXBadge variant={user.membershipState === 'activo' ? 'success' : user.membershipState === 'vencido' ? 'danger' : 'warning'}>{stateLabel(user.membershipState)}</CARVIPIXBadge>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">{user.hasActiveMembership ? 'Panel habilitado' : 'Bloqueado'}</td>
                      <td className="px-4 py-4">
                        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<Crown className="w-4 h-4" />} onClick={() => openUserModal(user)}>
                          Gestionar
                        </CARVIPIXButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="mb-4 flex items-center gap-2 text-[#D4AF37]">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Historial de pagos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-white/60">Sin datos</td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-sm font-mono text-[#D4AF37]">{payment.id}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{payment.userId}</td>
                      <td className="px-4 py-3 text-sm text-white">{payment.productId}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{payment.currency} {payment.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><CARVIPIXBadge variant={payment.status === 'completed' ? 'success' : payment.status === 'failed' ? 'danger' : 'warning'}>{payment.status}</CARVIPIXBadge></td>
                      <td className="px-4 py-3 text-sm text-white/50">{new Date(payment.fecha).toLocaleString('es-ES')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CARVIPIXCard>
      </motion.div>

      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gestionar membresía"
        footerButtons={
          <div className="flex flex-wrap gap-2 justify-end">
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={() => void submitAction('activate')} disabled={saving}>
              Activar
            </CARVIPIXButton>
            <CARVIPIXButton variant="premium" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={() => void submitAction('renew')} disabled={saving}>
              Renovar
            </CARVIPIXButton>
            <CARVIPIXButton variant="secondary" size="sm" leftIcon={<Crown className="w-4 h-4" />} onClick={() => void submitAction('change-plan')} disabled={saving}>
              Cambiar plan
            </CARVIPIXButton>
            <CARVIPIXButton variant="danger" size="sm" leftIcon={<PauseCircle className="w-4 h-4" />} onClick={() => void submitAction('cancel')} disabled={saving}>
              Cancelar
            </CARVIPIXButton>
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => void submitAction('deactivate')} disabled={saving}>
              Desactivar
            </CARVIPIXButton>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Usuario</p>
                <p className="text-white font-semibold">{`${selectedUser.nombre} ${selectedUser.apellido}`.trim()}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Estado actual</p>
                <CARVIPIXBadge variant={selectedUser.membershipState === 'activo' ? 'success' : selectedUser.membershipState === 'vencido' ? 'danger' : 'warning'}>{selectedUser.membershipState}</CARVIPIXBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-sm text-white/70">Plan</span>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as AdminPlan)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                >
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan} className="bg-[#030303] text-white">
                      {planLabel(plan)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-white/70">Duración (días)</span>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                >
                  {DURATION_OPTIONS.map((days) => (
                    <option key={days} value={days} className="bg-[#030303] text-white">
                      {days} días
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70 space-y-2">
              <p><span className="text-white/50">Email:</span> {selectedUser.email}</p>
              <p><span className="text-white/50">Membresía:</span> {selectedUser.membershipPlan.toUpperCase()}</p>
              <p><span className="text-white/50">Inicio:</span> {selectedUser.fechaInicio ? new Date(selectedUser.fechaInicio).toLocaleString('es-ES') : 'Sin datos'}</p>
              <p><span className="text-white/50">Vencimiento:</span> {selectedUser.fechaFin ? new Date(selectedUser.fechaFin).toLocaleString('es-ES') : 'Sin datos'}</p>
              <p><span className="text-white/50">Renovación automática:</span> {selectedUser.renovacionAutomatica ? 'Sí' : 'No'}</p>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
