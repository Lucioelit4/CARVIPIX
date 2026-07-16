"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, CreditCard, LifeBuoy, Monitor, RefreshCw, ShieldCheck } from "lucide-react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";
import { writeAuthSession } from "@/app/lib/auth/session";
import FounderBetaPanel from "@/app/dashboard/components/FounderBetaPanel";

type PortalSnapshot = {
  plan: {
    officialPlan: "FREE" | "BASIC" | "PRO";
    membershipActive: boolean;
    renewalDate?: string;
    entitlements: {
      maxAlertsPerDay: number;
      maxPairs: number;
      maxBots: number;
      historyLimit: number;
      allowedPairs: string[] | null;
      tradingWindowsUtc: Array<{ startHourUtc: number; endHourUtc: number }>;
    };
  };
  alerts: {
    remainingToday: number;
    createdToday: number;
    stats: { total: number; active: number; triggered: number; resolved: number };
    rules: Array<{ id: string; name: string; symbols: string[]; condition: string; enabled: boolean }>;
  };
  bot: {
    license: { active: boolean; licenseKey?: string; brokerConnected?: "MT4" | "MT5" } | null;
    instances: Array<{ id: string; name: string; symbol: string; status: string; strategy: string; riskLevel: string }>;
  };
  capital: {
    account: null | { status: string; initialCapital: number; currentBalance: number; utilidad: number };
    requests: Array<{ id: string; status: string; targetCapital: number; riskProfile: string; contractSigned: boolean }>;
  };
  payments: {
    orders: Array<{ id: string; productId: string; total: number; currency: string; status: string; fechaCreacion: string }>;
  };
  operations: Array<{ id: string; symbol: string; status: string; pnl: number; executedAt: string }>;
  devices: Array<{ id: string; deviceLabel: string; lastSeenAt: string; userAgent: string }>;
  support: Array<{ id: string; subject: string; status: string; priority: string }>;
  audit: Array<{ id: string; action: string; resource: string; result: string }>;
};

type DataSourceMeta = {
  origin: string;
  status: string;
  capturedAt: string;
  validUntil: string;
};

type ComplianceVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
};

type DataOrigin = "REAL" | "SANDBOX" | "DEMO" | "MOCK";

function normalizeDataOrigin(raw: string | undefined): DataOrigin {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "REAL" || value === "SANDBOX" || value === "DEMO" || value === "MOCK") {
    return value;
  }
  if (value === "PLACEHOLDER" || value === "EMPTY") {
    return "MOCK";
  }
  return "MOCK";
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString("es-ES");
}

const emptyAlertForm = { name: "", symbol: "EURUSD", condition: "Confirmacion manual del cliente" };
const emptyBotForm = { name: "Bot CARVIPIX", symbol: "EURUSD", strategy: "momentum", riskLevel: "medium" };
const emptyBrokerForm = { botId: "", brokerType: "MT5", server: "", login: "", password: "", mode: "demo" };
const emptyCapitalForm = { targetCapital: "10000", riskProfile: "moderado", notes: "" };
const emptySupportForm = { subject: "", category: "general", priority: "medium", message: "" };

async function parseJsonSafe<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export default function DashboardPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<PortalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertForm, setAlertForm] = useState(emptyAlertForm);
  const [botForm, setBotForm] = useState(emptyBotForm);
  const [brokerForm, setBrokerForm] = useState(emptyBrokerForm);
  const [capitalForm, setCapitalForm] = useState(emptyCapitalForm);
  const [supportForm, setSupportForm] = useState(emptySupportForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceMeta | null>(null);
  const [memberVideo, setMemberVideo] = useState<ComplianceVideo | null>(null);

  const refreshPortal = async () => {
    const response = await fetch("/api/client/portal", { cache: "no-store" });
    if (!response.ok) {
      const payload = await parseJsonSafe<{ error?: string }>(response);
      throw new Error(payload.error || "No se pudo cargar el portal");
    }

    const payload = await parseJsonSafe<{ data: PortalSnapshot; dataSource?: DataSourceMeta }>(response);
    setPortal(payload.data);
    setDataSource(payload.dataSource ?? null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        try {
          await refreshPortal();
          writeAuthSession("cliente");
          setIsAdminView(false);
          return;
        } catch (portalError) {
          const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
          if (sessionResponse.ok) {
            writeAuthSession("cliente");
            setIsAdminView(false);
            setError(portalError instanceof Error ? portalError.message : "No se pudo cargar el portal del cliente");
            return;
          }

          const adminSessionResponse = await fetch("/api/auth/admin/session", { cache: "no-store" });
          const isAdmin = adminSessionResponse.ok;
          setIsAdminView(isAdmin);

          if (!isAdmin) {
            if (sessionResponse.status === 401 || sessionResponse.status === 403) {
              router.replace("/servicios");
              return;
            }

            setError("Tu sesión sigue activa, pero hubo un fallo temporal del portal. Intenta Actualizar.");
            return;
          }

          writeAuthSession("admin");
          return;
        }

      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo cargar el panel del cliente");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [router]);

  useEffect(() => {
    if (!isAdminView) {
      return;
    }

    return () => {
      void fetch("/api/admin/client-panel", {
        method: "DELETE",
        keepalive: true,
      }).catch(() => undefined);
    };
  }, [isAdminView]);

  useEffect(() => {
    const loadMemberVideo = async () => {
      try {
        const response = await fetch("/api/client/compliance/catalog", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as {
          data?: {
            videos?: {
              memberDashboard?: ComplianceVideo[];
            };
          };
        };

        const video = payload.data?.videos?.memberDashboard?.[0] ?? null;
        setMemberVideo(video);
      } catch {
        setMemberVideo(null);
      }
    };

    void loadMemberVideo();
  }, []);

  const paymentSummary = useMemo(() => portal?.payments.orders.reduce((total, order) => total + Number(order.total ?? 0), 0) ?? 0, [portal]);
  const planStatusLabel = portal?.plan.membershipActive
    ? `Membresia ${portal?.plan.officialPlan}`
    : `Sin membresía activa (${portal?.plan.officialPlan})`;
  const dataOrigin = normalizeDataOrigin(dataSource?.origin);
  const canUseAlerts = Boolean(portal?.plan.membershipActive && (portal?.plan.entitlements.maxAlertsPerDay ?? 0) > 0);
  const canUseBot = Boolean(portal?.plan.membershipActive && (portal?.plan.entitlements.maxBots ?? 0) > 0);

  const submitJson = async (key: string, url: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafe<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo completar la accion");
      }
      await refreshPortal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la accion");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">Cargando panel cliente...</div>;
  }

  if (isAdminView && !portal) {
    return (
      <main className="min-h-screen bg-[#030303] text-white p-8">
        <CARVIPIXCard variant="admin" padding="24" hover={false}>
          <h1 className="text-2xl font-bold mb-2">Vista de administrador</h1>
          <p className="text-white/60">El acceso temporal desde admin sigue disponible, pero el portal operativo completo requiere una sesión de cliente real.</p>
        </CARVIPIXCard>
      </main>
    );
  }

  if (!portal) {
    return <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">{error ?? "No se pudo cargar el panel"}</div>;
  }

  const activeBots = portal.bot.instances.filter((item) => item.status === "running").length;
  const paidOrders = portal.payments.orders.filter((order) => order.status === "completed").length;
  const openTickets = portal.support.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length;

  return (
    <main className="dashboard-shell min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <section className="cv-hero rounded-3xl border border-[#D4AF37]/35 p-6 lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[#D4AF37]">Dashboard oficial</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">CARVIPIX {portal.plan.officialPlan}</h1>
                <p className="mt-3 max-w-3xl text-sm text-white/70">Centro operativo con validación backend para alertas, bot, pagos, dispositivos, soporte y capital según el estado real de tu membresía.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CARVIPIXBadge variant={portal.plan.membershipActive ? "success" : "warning"}>
                  {planStatusLabel}
                </CARVIPIXBadge>
                {dataSource && (
                  <CARVIPIXBadge variant={dataOrigin === "REAL" ? "success" : "warning"}>
                    {`Fuente ${dataOrigin} · ${dataSource.status}`}
                  </CARVIPIXBadge>
                )}
                <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshPortal()}>
                  Actualizar
                </CARVIPIXButton>
              </div>
            </div>

            <div className="cv-hero-visual rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between gap-3 text-xs text-white/70">
                <p className="uppercase tracking-[0.2em] text-[#D4AF37]">Resumen de cuenta</p>
                <p>{portal.plan.membershipActive ? "Estado premium" : "Estado limitado"}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="cv-mini-metric">
                  <p>Balance</p>
                  <strong>${paymentSummary.toLocaleString()}</strong>
                </div>
                <div className="cv-mini-metric">
                  <p>Bots activos</p>
                  <strong>{activeBots}</strong>
                </div>
                <div className="cv-mini-metric">
                  <p>Tickets abiertos</p>
                  <strong>{openTickets}</strong>
                </div>
                <div className="cv-mini-metric">
                  <p>Órdenes pagadas</p>
                  <strong>{paidOrders}</strong>
                </div>
              </div>
              <div className="cv-hero-car mt-4" aria-hidden="true" />
            </div>
          </div>

          {dataSource && (
            <p className="mt-3 text-xs text-white/60">
              {`Origen: ${dataOrigin} · Capturado: ${formatDateTime(dataSource.capturedAt)} · Vigencia: ${formatDateTime(dataSource.validUntil)}`}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Alertas restantes", value: String(portal.alerts.remainingToday), icon: Bell },
              { label: "Pares habilitados", value: portal.plan.entitlements.allowedPairs ? String(portal.plan.entitlements.allowedPairs.length) : "Todos", icon: ShieldCheck },
              { label: "Bots activos", value: String(activeBots), icon: Bot },
              { label: "Pagos completados", value: String(paidOrders), icon: CreditCard },
              { label: "Soporte abierto", value: String(openTickets), icon: LifeBuoy },
              { label: "Dispositivos", value: String(portal.devices.length), icon: Monitor },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <CARVIPIXCard key={item.label} variant="statistics" padding="16" hover={false}>
                  <div className="flex items-center justify-between text-[#D4AF37]">
                    <p className="text-xs text-white/60">{item.label}</p>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
                </CARVIPIXCard>
              );
            })}
          </div>
        </section>

        {/* ── Programa Fundadores Beta ──────────────────────────────────── */}
        <FounderBetaPanel />

        {memberVideo && (
          <section className="rounded-3xl border border-white/10 bg-[#0b0f16] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Video explicativo del miembro</p>
            <h2 className="mt-2 text-2xl font-semibold">{memberVideo.title}</h2>
            <p className="mt-2 text-sm text-white/70">{memberVideo.description}</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <video
                className="h-full w-full"
                controls
                preload="metadata"
                poster={memberVideo.posterUrl}
                src={memberVideo.videoUrl}
              >
                Tu navegador no soporta video HTML5.
              </video>
            </div>
          </section>
        )}

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        <section className="grid gap-6 xl:grid-cols-2">
          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold mb-4">Alertas manuales</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="mb-4 grid gap-3 md:grid-cols-3 text-sm text-white/70">
              <p>Plan: <span className="text-white">{portal.plan.officialPlan}</span></p>
              <p>Limite/dia: <span className="text-white">{portal.plan.entitlements.maxAlertsPerDay}</span></p>
              <p>Historial: <span className="text-white">{portal.plan.entitlements.historyLimit}</span></p>
            </div>
            <div className="mb-4 text-sm text-white/60">Pares: {portal.plan.entitlements.allowedPairs ? portal.plan.entitlements.allowedPairs.join(", ") : "Todos los permitidos por PRO"}</div>
            <div className="grid gap-3 md:grid-cols-3">
              <input value={alertForm.name} onChange={(e) => setAlertForm((current) => ({ ...current, name: e.target.value }))} placeholder="Nombre" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <input value={alertForm.symbol} onChange={(e) => setAlertForm((current) => ({ ...current, symbol: e.target.value.toUpperCase() }))} placeholder="Par" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <input value={alertForm.condition} onChange={(e) => setAlertForm((current) => ({ ...current, condition: e.target.value }))} placeholder="Condicion manual" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
            <div className="mt-4 flex gap-3">
              <CARVIPIXButton variant="premium" disabled={!canUseAlerts || busy === "alert" || !alertForm.name.trim() || !alertForm.symbol.trim() || !alertForm.condition.trim()} onClick={() => void submitJson("alert", "/api/client/alerts", { action: "createRule", rule: { name: alertForm.name, symbols: [alertForm.symbol], condition: alertForm.condition, enabled: true, alertTypes: ["signal"] } })}>
                Crear alerta manual
              </CARVIPIXButton>
            </div>
            {!canUseAlerts ? <p className="mt-3 text-sm text-amber-300">Tu plan actual no habilita creación de alertas desde este módulo.</p> : null}
            <div className="mt-6 space-y-3">
              {portal.alerts.rules.length === 0 ? (
                <p className="text-sm text-white/60">Sin reglas de alerta registradas todavía.</p>
              ) : (
                portal.alerts.rules.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="cv-item rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{rule.name}</p>
                      <CARVIPIXBadge variant={rule.enabled ? "success" : "warning"}>{rule.enabled ? "Activa" : "Pausada"}</CARVIPIXBadge>
                    </div>
                    <p className="mt-1 text-white/60">{rule.symbols.join(", ")} · {rule.condition}</p>
                  </div>
                ))
              )}
            </div>
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold mb-4">Bot CARVIPIX (producto descargable)</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="mb-4 text-sm text-white/70">
              Licencia: <span className="text-white">{portal.bot.license?.active ? "Activa y lista para entrega" : "Pendiente de compra"}</span>
              {portal.bot.license?.licenseKey ? ` · ${portal.bot.license.licenseKey}` : ""}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <input value={botForm.name} onChange={(e) => setBotForm((current) => ({ ...current, name: e.target.value }))} placeholder="Nombre instancia" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <input value={botForm.symbol} onChange={(e) => setBotForm((current) => ({ ...current, symbol: e.target.value.toUpperCase() }))} placeholder="Par" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <select value={botForm.strategy} onChange={(e) => setBotForm((current) => ({ ...current, strategy: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="momentum">Momentum</option>
                <option value="grid">Grid</option>
                <option value="breakout">Breakout</option>
                <option value="scalping">Scalping</option>
              </select>
              <select value={botForm.riskLevel} onChange={(e) => setBotForm((current) => ({ ...current, riskLevel: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mt-4 flex gap-3">
              <CARVIPIXButton variant="premium" disabled={!canUseBot || busy === "bot-create" || !botForm.name.trim() || !botForm.symbol.trim()} onClick={() => void submitJson("bot-create", "/api/client/bot", { action: "createInstance", ...botForm })}>
                Registrar instalacion
              </CARVIPIXButton>
            </div>
            {!canUseBot ? <p className="mt-3 text-sm text-amber-300">Tu plan actual no habilita registro y activacion del bot.</p> : null}
            <div className="mt-6 space-y-3">
              {portal.bot.instances.length === 0 ? (
                <p className="text-sm text-white/60">No hay instancias de bot creadas aún.</p>
              ) : (
                portal.bot.instances.map((instance) => (
                  <div key={instance.id} className="cv-item rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{instance.name} · {instance.symbol}</p>
                        <p className="text-sm text-white/60">{instance.strategy} · riesgo {instance.riskLevel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CARVIPIXBadge variant={instance.status === "running" ? "success" : instance.status === "paused" ? "warning" : "default"}>{instance.status}</CARVIPIXBadge>
                        <CARVIPIXButton size="sm" variant="ghost" disabled={!canUseBot || busy === `run-${instance.id}`} onClick={() => void submitJson(`run-${instance.id}`, "/api/client/bot", { action: "changeStatus", botId: instance.id, status: "running" })}>Activar</CARVIPIXButton>
                        <CARVIPIXButton size="sm" variant="ghost" disabled={!canUseBot || busy === `pause-${instance.id}`} onClick={() => void submitJson(`pause-${instance.id}`, "/api/client/bot", { action: "changeStatus", botId: instance.id, status: "paused" })}>Pausar</CARVIPIXButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              <select value={brokerForm.botId} onChange={(e) => setBrokerForm((current) => ({ ...current, botId: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="">Selecciona bot</option>
                {portal.bot.instances.map((instance) => <option key={instance.id} value={instance.id}>{instance.name}</option>)}
              </select>
              <select value={brokerForm.brokerType} onChange={(e) => setBrokerForm((current) => ({ ...current, brokerType: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="MT5">MT5</option>
                <option value="MT4">MT4</option>
              </select>
              <input value={brokerForm.server} onChange={(e) => setBrokerForm((current) => ({ ...current, server: e.target.value }))} placeholder="Servidor" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <input value={brokerForm.login} onChange={(e) => setBrokerForm((current) => ({ ...current, login: e.target.value }))} placeholder="Login" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <input value={brokerForm.password} onChange={(e) => setBrokerForm((current) => ({ ...current, password: e.target.value }))} placeholder="Password" type="password" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
            <div className="mt-3 flex gap-3">
              <CARVIPIXButton variant="secondary" disabled={!canUseBot || busy === "broker" || !brokerForm.botId || !brokerForm.server.trim() || !brokerForm.login.trim() || !brokerForm.password.trim()} onClick={() => void submitJson("broker", "/api/client/bot", { action: "connectBroker", ...brokerForm })}>
                Preparar activacion MT4/MT5
              </CARVIPIXButton>
              <CARVIPIXButton variant="ghost" disabled={!canUseBot || busy === "diagnostics" || !brokerForm.botId} onClick={() => brokerForm.botId && void submitJson("diagnostics", "/api/client/bot", { action: "runDiagnostics", botId: brokerForm.botId })}>
                Diagnostico
              </CARVIPIXButton>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold mb-4">Gestion de capital</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="grid gap-3 md:grid-cols-3">
              <input value={capitalForm.targetCapital} onChange={(e) => setCapitalForm((current) => ({ ...current, targetCapital: e.target.value }))} placeholder="Capital objetivo" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <select value={capitalForm.riskProfile} onChange={(e) => setCapitalForm((current) => ({ ...current, riskProfile: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="conservador">Conservador</option>
                <option value="moderado">Moderado</option>
                <option value="agresivo">Agresivo</option>
              </select>
              <input value={capitalForm.notes} onChange={(e) => setCapitalForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Notas" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            </div>
            <div className="mt-4 flex gap-3">
              <CARVIPIXButton variant="premium" disabled={busy === "capital"} onClick={() => void submitJson("capital", "/api/client/capital", { action: "submitRequest", targetCapital: Number(capitalForm.targetCapital), riskProfile: capitalForm.riskProfile, notes: capitalForm.notes })}>
                Solicitar gestion
              </CARVIPIXButton>
            </div>
            <div className="mt-6 space-y-3">
              {portal.capital.account ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  <p>Estado: <span className="text-white">{portal.capital.account.status}</span></p>
                  <p>Capital inicial: <span className="text-white">${portal.capital.account.initialCapital.toLocaleString()}</span></p>
                  <p>Balance actual: <span className="text-white">${portal.capital.account.currentBalance.toLocaleString()}</span></p>
                </div>
              ) : (
                <p className="text-sm text-white/60">Todavia no tienes una cuenta de capital activa. Puedes enviar una solicitud desde este panel.</p>
              )}
              {portal.capital.requests.length === 0 ? (
                <p className="text-sm text-white/60">Sin solicitudes de gestión registradas.</p>
              ) : (
                portal.capital.requests.map((request) => (
                  <div key={request.id} className="cv-item rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">Solicitud {request.id}</p>
                      <CARVIPIXBadge variant={request.status === "accepted" || request.status === "active" ? "success" : request.status === "rejected" ? "danger" : "warning"}>{request.status}</CARVIPIXBadge>
                    </div>
                    <p className="mt-1 text-white/60">Objetivo ${request.targetCapital.toLocaleString()} · Riesgo {request.riskProfile}</p>
                  </div>
                ))
              )}
            </div>
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold mb-4">Soporte, pagos y seguridad</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={supportForm.subject} onChange={(e) => setSupportForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Asunto" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
              <select value={supportForm.priority} onChange={(e) => setSupportForm((current) => ({ ...current, priority: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <textarea value={supportForm.message} onChange={(e) => setSupportForm((current) => ({ ...current, message: e.target.value }))} placeholder="Describe tu incidencia" className="mt-3 min-h-28 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" />
            <div className="mt-4 flex gap-3">
              <CARVIPIXButton variant="secondary" disabled={busy === "support"} onClick={() => void submitJson("support", "/api/client/support", supportForm)}>
                Crear ticket de soporte
              </CARVIPIXButton>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-white/60">Facturacion acumulada</p>
                <p className="mt-2 text-2xl font-bold text-white">${paymentSummary.toLocaleString()}</p>
                <p className="mt-2 text-white/60">Renovacion: {portal.plan.renewalDate ? formatDateTime(portal.plan.renewalDate) : "No aplica"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-white/60">Dispositivos activos</p>
                <p className="mt-2 text-2xl font-bold text-white">{portal.devices.length}</p>
                <p className="mt-2 text-white/60">Auditoria reciente: {portal.audit.length} eventos</p>
              </div>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card xl:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Pagos y operaciones</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="space-y-3">
              {portal.payments.orders.length === 0 ? <p className="text-sm text-white/60">Sin órdenes de pago registradas.</p> : null}
              {portal.payments.orders.slice(0, 6).map((order) => (
                <div key={order.id} className="cv-item rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{order.productId}</p>
                    <CARVIPIXBadge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "danger" : "warning"}>{order.status}</CARVIPIXBadge>
                  </div>
                  <p className="mt-1 text-white/60">{order.currency} {Number(order.total).toLocaleString()} · {formatDateTime(order.fechaCreacion)}</p>
                </div>
              ))}
              {portal.operations.length === 0 ? <p className="text-sm text-white/60">Sin operaciones registradas.</p> : null}
              {portal.operations.slice(0, 8).map((operation) => (
                <div key={operation.id} className="cv-item rounded-xl border border-white/10 bg-[#0C0C0C] p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{operation.symbol}</p>
                    <span className={operation.pnl >= 0 ? "text-green-400" : "text-red-400"}>{operation.pnl >= 0 ? "+" : ""}{operation.pnl.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-white/60">{operation.status} · {formatDateTime(operation.executedAt)}</p>
                </div>
              ))}
            </div>
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold mb-4">Dispositivos y trazabilidad</h2>
            <div className="mb-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="space-y-3">
              {portal.devices.length === 0 ? <p className="text-sm text-white/60">Sin dispositivos activos registrados.</p> : null}
              {portal.devices.map((device) => (
                <div key={device.id} className="cv-item rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="font-medium text-white">{device.deviceLabel}</p>
                  <p className="mt-1 text-white/60">{device.userAgent}</p>
                  <p className="mt-1 text-white/50">Ultima actividad: {formatDateTime(device.lastSeenAt)}</p>
                </div>
              ))}
              {portal.audit.length === 0 ? <p className="text-sm text-white/60">Sin eventos de auditoría recientes.</p> : null}
              {portal.audit.slice(0, 8).map((event) => (
                <div key={event.id} className="cv-item rounded-xl border border-white/10 bg-[#0C0C0C] p-3 text-sm">
                  <p className="font-medium text-white">{event.action}</p>
                  <p className="mt-1 text-white/60">{event.resource} · {event.result}</p>
                </div>
              ))}
            </div>
          </CARVIPIXCard>
        </section>
      </div>
      <style jsx>{`
        .dashboard-shell {
          background:
            radial-gradient(circle at 8% 6%, rgba(212, 175, 55, 0.12), transparent 28%),
            radial-gradient(circle at 86% 2%, rgba(245, 158, 11, 0.1), transparent 24%),
            linear-gradient(180deg, #030303 0%, #06080d 40%, #040404 100%);
        }

        .cv-hero {
          background:
            linear-gradient(148deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.03) 28%, rgba(8, 10, 14, 0.92) 62%),
            linear-gradient(180deg, rgba(8, 8, 8, 0.95), rgba(5, 5, 7, 0.98));
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .cv-hero-visual {
          background:
            radial-gradient(circle at 68% 18%, rgba(212, 175, 55, 0.28), transparent 46%),
            linear-gradient(170deg, rgba(17, 18, 24, 0.95), rgba(8, 10, 14, 0.97));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 14px 40px rgba(0, 0, 0, 0.4);
        }

        .cv-mini-metric {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          padding: 10px 12px;
        }

        .cv-mini-metric p {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.62);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .cv-mini-metric strong {
          display: block;
          margin-top: 6px;
          font-size: 18px;
          color: #f8e7b5;
        }

        .cv-hero-car {
          height: 128px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            radial-gradient(circle at 25% 70%, rgba(212, 175, 55, 0.24), transparent 42%),
            radial-gradient(circle at 80% 28%, rgba(245, 158, 11, 0.2), transparent 38%),
            linear-gradient(130deg, rgba(12, 12, 14, 0.98), rgba(22, 22, 24, 0.94));
          position: relative;
          overflow: hidden;
        }

        .cv-hero-car::before {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          top: 52%;
          height: 34%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.08), rgba(245, 158, 11, 0.3), rgba(212, 175, 55, 0.08));
          filter: blur(0.5px);
        }

        .cv-hero-car::after {
          content: "";
          position: absolute;
          inset: -20px;
          background-image: linear-gradient(0deg, transparent 0 93%, rgba(255, 255, 255, 0.06) 93% 94%, transparent 94% 100%);
          background-size: 100% 24px;
          opacity: 0.5;
        }

        :global(.dashboard-shell input),
        :global(.dashboard-shell select),
        :global(.dashboard-shell textarea) {
          border-color: rgba(212, 175, 55, 0.22) !important;
          background: rgba(9, 10, 13, 0.72) !important;
          color: #f4f4f5 !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        :global(.dashboard-shell input:focus),
        :global(.dashboard-shell select:focus),
        :global(.dashboard-shell textarea:focus) {
          outline: none;
          border-color: rgba(212, 175, 55, 0.55) !important;
          box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.35), 0 0 0 6px rgba(212, 175, 55, 0.12);
        }

        .cv-card {
          border: 1px solid rgba(212, 175, 55, 0.2) !important;
          background: linear-gradient(180deg, rgba(9, 10, 14, 0.95), rgba(6, 7, 10, 0.96)) !important;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .cv-item {
          border-color: rgba(212, 175, 55, 0.16) !important;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)) !important;
        }

        @media (max-width: 768px) {
          .cv-hero-car {
            height: 104px;
          }

          .cv-mini-metric strong {
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}
