'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Code, AlertCircle, CheckCircle2, RefreshCw,
  Plus, X, Shield, Clock, TrendingUp, BarChart3,
} from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { useToast } from './Toast';

type InvitationCode = {
  code: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  expires_at: string | null;
};

type BetaReport = {
  id: string;
  user_email: string | null;
  category: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

type BetaStats = {
  registered: number;
  logins: number;
  checkouts: number;
  installed: number;
  bot_active: number;
  telegram_active: number;
  demo_trades: number;
  open_reports: number;
  resolved_reports: number;
  total_events: number;
};

type FounderRow = {
  user_email: string;
  events: string[];
};

type BetaData = {
  codes: InvitationCode[];
  reports: BetaReport[];
  stats: BetaStats;
  founders: FounderRow[];
};

const FOUNDER_FLOW = [
  { key: 'registro', label: 'Registro', icon: '📝' },
  { key: 'login', label: 'Login', icon: '🔐' },
  { key: 'codigo_aplicado', label: 'Código', icon: '🎟️' },
  { key: 'checkout', label: 'Checkout', icon: '💳' },
  { key: 'activacion', label: 'Activación', icon: '✅' },
  { key: 'descarga', label: 'Descarga', icon: '📥' },
  { key: 'instalacion', label: 'Instalación', icon: '⚙️' },
  { key: 'conexion_bot', label: 'Bot', icon: '🤖' },
  { key: 'telegram', label: 'Telegram', icon: '💬' },
  { key: 'operacion_demo', label: 'Demo', icon: '📈' },
];

const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  critica: 'danger',
  alta: 'warning',
  media: 'default',
  baja: 'success',
};

export default function AdminBeta() {
  const { showToast } = useToast();
  const [data, setData] = useState<BetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'reports' | 'founders'>('overview');
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', max_uses: 1, notes: '' });
  const [creating, setCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BetaReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/beta', { cache: 'no-store' });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: BetaData };
      if (payload.ok && payload.data) {
        setData(payload.data);
      }
    } catch {
      showToast('No se pudieron cargar los datos de la Beta', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const createCode = async () => {
    const code = newCode.code.trim().toUpperCase() || `FOUNDER-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    if (!/^FOUNDER-[A-Z0-9]{2,10}$/.test(code)) {
      showToast('Formato inválido. Use FOUNDER-XXXX', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_code', code, max_uses: newCode.max_uses, notes: newCode.notes }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (payload.ok) {
        showToast(`Código ${code} creado`, 'success');
        setShowCreateCode(false);
        setNewCode({ code: '', max_uses: 1, notes: '' });
        await load();
      } else {
        showToast(payload.error ?? 'Error al crear código', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const deactivateCode = async (code: string) => {
    await fetch('/api/admin/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate_code', code }),
    });
    showToast(`Código ${code} desactivado`, 'success');
    await load();
  };

  const resolveReport = async (status: string) => {
    if (!selectedReport) return;
    setResolving(true);
    try {
      await fetch('/api/admin/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_report', report_id: selectedReport.id, status, admin_notes: adminNotes }),
      });
      showToast('Reporte actualizado', 'success');
      setSelectedReport(null);
      setAdminNotes('');
      await load();
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats ?? {
    registered: 0, logins: 0, checkouts: 0, installed: 0, bot_active: 0,
    telegram_active: 0, demo_trades: 0, open_reports: 0, resolved_reports: 0, total_events: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">🚀 Beta Privada — Programa Fundadores</h2>
          <p className="text-white/60 text-sm">5 usuarios de confianza validan el flujo completo antes del lanzamiento oficial.</p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>
          Actualizar
        </CARVIPIXButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Registrados', value: stats.registered, icon: '📝', color: 'text-blue-400' },
          { label: 'Bot Activo', value: stats.bot_active, icon: '🤖', color: 'text-green-400' },
          { label: 'Instalaciones', value: stats.installed, icon: '⚙️', color: 'text-yellow-400' },
          { label: 'Problemas abiertos', value: stats.open_reports, icon: '⚠️', color: 'text-red-400' },
          { label: 'Resueltos', value: stats.resolved_reports, icon: '✅', color: 'text-emerald-400' },
        ].map((stat) => (
          <CARVIPIXCard key={stat.label} variant="statistics" padding="16" hover={false}>
            <p className="text-xs text-white/60">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            <p className="text-lg mt-1">{stat.icon}</p>
          </CARVIPIXCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {([
          { id: 'overview', label: 'Resumen' },
          { id: 'codes', label: `Códigos (${data?.codes.length ?? 0})` },
          { id: 'reports', label: `Reportes (${stats.open_reports} abiertos)` },
          { id: 'founders', label: 'Fundadores' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ──────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas por evento */}
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <h3 className="text-lg font-bold mb-4">Métricas del Flujo</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: 'registered', label: 'Registro', value: stats.registered },
                { key: 'logins', label: 'Login', value: stats.logins },
                { key: 'checkouts', label: 'Checkout', value: stats.checkouts },
                { key: 'installed', label: 'Instalación', value: stats.installed },
                { key: 'bot_active', label: 'Bot Demo', value: stats.bot_active },
                { key: 'telegram_active', label: 'Telegram', value: stats.telegram_active },
                { key: 'demo_trades', label: 'Ops Demo', value: stats.demo_trades },
                { key: 'open_reports', label: 'Reportes', value: stats.open_reports },
              ].map((m) => (
                <div key={m.key} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-white/50 mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </CARVIPIXCard>

          {/* Criterios de salida */}
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" /> Criterios de Salida Beta
            </h3>
            <div className="space-y-3">
              {[
                { label: '5 fundadores completan el flujo', done: false },
                { label: 'Errores críticos resueltos', done: stats.open_reports === 0 },
                { label: 'EA certificado en demo', done: stats.bot_active > 0 },
                { label: 'Experiencia del usuario estable', done: false },
              ].map((c) => (
                <div key={c.label} className={`flex items-center gap-3 p-3 rounded-lg border ${c.done ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                  {c.done ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" /> : <Clock className="w-5 h-5 text-white/30 flex-shrink-0" />}
                  <span className={c.done ? 'text-green-300' : 'text-white/60'}>{c.label}</span>
                </div>
              ))}
            </div>
          </CARVIPIXCard>

          {/* Reglas de la Beta */}
          <CARVIPIXCard variant="info" padding="16" hover={false}>
            <h3 className="font-bold mb-3 text-blue-300">📋 Reglas de la Beta</h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>🔒 Solo MT5 DEMO — no se permite cuenta real</li>
              <li>🔒 Telegram en TEST_ONLY=true — solo grupo de prueba</li>
              <li>🔒 No prometer rentabilidad</li>
              <li>🔒 No modificar comportamiento para usuario específico</li>
              <li>🔒 Documentar cada incidencia</li>
            </ul>
          </CARVIPIXCard>
        </div>
      )}

      {/* ─── CODES ─────────────────────────────────────────────────────────── */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">Códigos FOUNDER-XXXX para desbloquear la Beta con 100% de descuento</p>
            <CARVIPIXButton size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateCode(true)}>
              Crear código
            </CARVIPIXButton>
          </div>

          {/* Create code form */}
          {showCreateCode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-[#D4AF37]/30 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-bold text-[#D4AF37]">Nuevo código de invitación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Código (FOUNDER-XXXX)</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-[#D4AF37] outline-none"
                    placeholder="Auto-generado si se deja vacío"
                    value={newCode.code}
                    onChange={(e) => setNewCode((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Usos máximos</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    value={newCode.max_uses}
                    onChange={(e) => setNewCode((p) => ({ ...p, max_uses: parseInt(e.target.value, 10) || 1 }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Notas</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    placeholder="Nombre del fundador..."
                    value={newCode.notes}
                    onChange={(e) => setNewCode((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <CARVIPIXButton size="sm" variant="primary" isLoading={creating} onClick={() => void createCode()}>
                  Crear
                </CARVIPIXButton>
                <CARVIPIXButton size="sm" variant="ghost" onClick={() => setShowCreateCode(false)}>
                  Cancelar
                </CARVIPIXButton>
              </div>
            </motion.div>
          )}

          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Código</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Usos</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Notas</th>
                    <th className="px-4 py-3 text-right text-xs text-white/60">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.codes ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-white/40 text-center">Sin códigos creados</td></tr>
                  ) : (
                    (data?.codes ?? []).map((c) => (
                      <tr key={c.code} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-[#D4AF37]">{c.code}</td>
                        <td className="px-4 py-3">{c.used_count}/{c.max_uses}</td>
                        <td className="px-4 py-3">
                          <CARVIPIXBadge variant={c.is_active ? 'success' : 'danger'}>
                            {c.is_active ? 'Activo' : 'Inactivo'}
                          </CARVIPIXBadge>
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs">{c.notes ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {c.is_active && (
                            <CARVIPIXButton size="sm" variant="ghost" onClick={() => void deactivateCode(c.code)}>
                              Desactivar
                            </CARVIPIXButton>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </div>
      )}

      {/* ─── REPORTS ───────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{selectedReport.category} — {selectedReport.priority}</h3>
                  <p className="text-sm text-white/60 mt-1">{selectedReport.user_email ?? 'Usuario anónimo'}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-1 rounded hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/80 bg-white/5 rounded-lg p-3">{selectedReport.description}</p>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none resize-none"
                rows={2}
                placeholder="Notas del admin..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <div className="flex gap-3">
                <CARVIPIXButton size="sm" variant="primary" isLoading={resolving} onClick={() => void resolveReport('resuelto')}>
                  Marcar resuelto
                </CARVIPIXButton>
                <CARVIPIXButton size="sm" variant="ghost" isLoading={resolving} onClick={() => void resolveReport('en_revision')}>
                  En revisión
                </CARVIPIXButton>
              </div>
            </motion.div>
          )}

          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Prioridad</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                    <th className="px-4 py-3 text-left text-xs text-white/60">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs text-white/60">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.reports ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-white/40 text-center">Sin reportes</td></tr>
                  ) : (
                    (data?.reports ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-xs text-white/60">{r.user_email ?? 'Anónimo'}</td>
                        <td className="px-4 py-3 capitalize">{r.category}</td>
                        <td className="px-4 py-3">
                          <CARVIPIXBadge variant={PRIORITY_VARIANT[r.priority] ?? 'default'}>{r.priority}</CARVIPIXBadge>
                        </td>
                        <td className="px-4 py-3">
                          <CARVIPIXBadge variant={r.status === 'resuelto' ? 'success' : r.status === 'en_revision' ? 'warning' : 'danger'}>
                            {r.status}
                          </CARVIPIXBadge>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">
                          {new Date(r.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <CARVIPIXButton size="sm" variant="ghost" onClick={() => { setSelectedReport(r); setAdminNotes(''); }}>
                            Ver
                          </CARVIPIXButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </div>
      )}

      {/* ─── FOUNDERS ──────────────────────────────────────────────────────── */}
      {activeTab === 'founders' && (
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <h3 className="text-lg font-bold mb-4">Progreso de Fundadores</h3>
          {(data?.founders ?? []).length === 0 ? (
            <p className="text-white/40 text-sm">Ningún fundador ha iniciado sesión aún</p>
          ) : (
            <div className="space-y-4">
              {(data?.founders ?? []).map((founder) => {
                const completedSteps = FOUNDER_FLOW.filter((step) =>
                  Array.isArray(founder.events) && founder.events.includes(step.key)
                );
                const progress = Math.round((completedSteps.length / FOUNDER_FLOW.length) * 100);

                return (
                  <div key={founder.user_email} className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{founder.user_email}</p>
                      <span className="text-sm text-white/60">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#D4AF37] to-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {FOUNDER_FLOW.map((step) => {
                        const done = Array.isArray(founder.events) && founder.events.includes(step.key);
                        return (
                          <span
                            key={step.key}
                            title={step.label}
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${done ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/30'}`}
                          >
                            {step.icon} {step.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CARVIPIXCard>
      )}
    </div>
  );
}
