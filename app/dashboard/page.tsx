"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, RefreshCw, ShieldCheck } from "lucide-react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";
import { writeAuthSession } from "@/app/lib/auth/session";
import { getGlobalResults, type GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";

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
    recent?: Array<{
      id: string;
      symbol: string;
      title: string;
      description: string;
      status: string;
      timestamp: string;
    }>;
  };
  bot: {
    license: { active: boolean; licenseKey?: string; brokerConnected?: "MT4" | "MT5" } | null;
    instances: Array<{ id: string; name: string; symbol: string; status: string; strategy: string; riskLevel: string }>;
    connections?: Array<{
      id: string;
      botInstanceId: string;
      brokerType: string;
      mode: string;
      connectionStatus: string;
      heartbeatAt: string | null;
      updatedAt: string;
    }>;
    logs?: Array<{
      id: string;
      botInstanceId: string | null;
      level: string;
      eventType: string;
      message: string;
      createdAt: string;
    }>;
  };
  strategicPartners: {
    requests: Array<{ id: string; status: string; companyOrBrand: string; createdAt: string }>;
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
  const [dataSource, setDataSource] = useState<DataSourceMeta | null>(null);
  const [globalResults, setGlobalResults] = useState<GlobalResultsSnapshot | null>(null);

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

  const refreshGlobalResults = async () => {
    setGlobalResults(await getGlobalResults());
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        try {
          await Promise.all([refreshPortal(), refreshGlobalResults()]);
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

  const paymentSummary = useMemo(() => portal?.payments.orders.reduce((total, order) => total + Number(order.total ?? 0), 0) ?? 0, [portal]);
  const planBadgeLabel = portal?.plan.membershipActive
    ? `Membresía ${portal?.plan.officialPlan}`
    : `Sin membresía activa · ${portal?.plan.officialPlan}`;
  const dataOrigin = normalizeDataOrigin(dataSource?.origin);

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
  const botConnections = portal.bot.connections ?? [];
  const botLogs = portal.bot.logs ?? [];
  const latestAlert = portal.alerts.recent?.[0] ?? null;
  const latestConnection = botConnections[0] ?? null;
  const latestBotLog = botLogs[0] ?? null;
  const latestOperation = portal.operations[0] ?? null;
  const botHasLicense = Boolean(portal.bot.license?.active);
  const botConnectionState = latestConnection?.connectionStatus ?? (portal.bot.license?.brokerConnected ? "connected" : "pending");
  const planStatusLabel = portal.plan.membershipActive
    ? `Plan activo: ${portal.plan.officialPlan}`
    : `Plan activo: ${portal.plan.officialPlan || "No disponible"}`;
  const planDisplayName = portal.plan.officialPlan ? `CARVIPIX ${portal.plan.officialPlan}` : "CARVIPIX";
  const planAvailabilityLabel = (() => {
    const maxAlerts = portal.plan.entitlements.maxAlertsPerDay;
    if (typeof maxAlerts === "number" && maxAlerts > 0) {
      return `${maxAlerts} alertas al día`;
    }
    if (portal.plan.officialPlan === "BASIC") {
      return "Hasta 2–7 alertas al día, según el mercado";
    }
    if (portal.plan.officialPlan === "PRO") {
      return "Hasta 5–25 alertas al día, según el mercado";
    }
    return "Según la configuración de tu plan";
  })();
  const lastUpdatedLabel = dataSource
    ? `Última actualización: ${formatDateTime(dataSource.capturedAt || dataSource.validUntil)}`
    : null;
  const connectionStatusLabel = latestConnection?.heartbeatAt
    ? "Conectado"
    : latestConnection?.connectionStatus === "connected"
      ? "Conexión registrada"
      : "Desconectado";
  const communicationStatusLabel = latestConnection?.heartbeatAt
    ? formatDateTime(latestConnection.heartbeatAt)
    : "No disponible";
  const weeklyMetricLabel = globalResults && Number.isFinite(globalResults.alerts.weeklyPips) && globalResults.alerts.weeklyPips !== 0
    ? "Resultado semanal"
    : "Alertas cerradas";
  const weeklyMetricValue = globalResults && Number.isFinite(globalResults.alerts.weeklyPips) && globalResults.alerts.weeklyPips !== 0
    ? globalResults.alerts.weeklyPips.toFixed(1)
    : String(globalResults?.alerts.total ?? portal.alerts.stats.total ?? 0);

  return (
    <main className="dashboard-shell min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <section className="cv-hero rounded-3xl border border-[#D4AF37]/35 p-6 lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[#D4AF37]">CENTRO DE CONTROL OPERATIVO</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{planDisplayName}</h1>
                <p className="mt-3 max-w-3xl text-sm text-white/70">Tu espacio central para supervisar alertas, el estado del bot y el rendimiento de tu membresía.</p>
                <p className="mt-2 max-w-3xl text-sm text-white/60">Consulta la actividad operativa, los recursos disponibles y la evolución de tus resultados desde un único panel.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CARVIPIXBadge variant={portal.plan.membershipActive ? "success" : "warning"}>
                  {planBadgeLabel}
                </CARVIPIXBadge>
                {dataSource && (
                  <CARVIPIXBadge variant={dataOrigin === "REAL" ? "success" : "warning"}>
                    INFORMACIÓN ACTUALIZADA
                  </CARVIPIXBadge>
                )}
                <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshPortal()}>
                  Actualizar
                </CARVIPIXButton>
              </div>
            </div>

            <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Resumen de cuenta</p>
              <div className="mt-4 space-y-2 text-sm text-white/75">
                <p>Plan activo: <span className="text-white">{portal.plan.officialPlan}</span></p>
                <p>Estado de la membresía: <span className="text-white">{portal.plan.membershipActive ? "Activa" : "Inactiva"}</span></p>
                <p>Pares habilitados: <span className="text-white">{portal.plan.entitlements.allowedPairs ? portal.plan.entitlements.allowedPairs.join(", ") : "Todos"}</span></p>
                <p>Disponibilidad diaria: <span className="text-white">{planAvailabilityLabel}</span></p>
                <p>Bot CARVIPIX: <span className="text-white">{botHasLicense ? "Conectado" : "Sin licencia activa"}</span></p>
              </div>
            </CARVIPIXCard>
          </div>

          {lastUpdatedLabel && (
            <p className="mt-3 text-xs text-white/60">{lastUpdatedLabel}</p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Alertas disponibles hoy", value: String(portal.alerts.remainingToday), icon: Bell },
              { label: "Pares habilitados", value: portal.plan.entitlements.allowedPairs ? String(portal.plan.entitlements.allowedPairs.length) : "Todos", icon: ShieldCheck },
              { label: "Bots operativos", value: String(activeBots), icon: Bot },
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

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

        <section className="grid gap-6 xl:grid-cols-2">
          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold">Alerta destacada</h2>
            {latestAlert ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-white"><span className="text-white/60">Par:</span> {latestAlert.symbol}</p>
                <p className="text-white"><span className="text-white/60">Resumen:</span> {latestAlert.title}</p>
                <p className="text-white/75">{latestAlert.description}</p>
                <p className="text-white/50">{formatDateTime(latestAlert.timestamp)}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-white font-medium">No hay una alerta activa en este momento.</p>
                <p className="text-sm text-white/65">CARVIPIX continúa monitoreando el mercado en busca de oportunidades válidas y oportunas.</p>
              </div>
            )}
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold">Estado operativo del Bot</h2>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <p>Plataforma: <span className="text-white">{portal.bot.license?.brokerConnected ?? "Sin vincular"}</span></p>
              <p>Conexión: <span className="text-white">{connectionStatusLabel}</span></p>
              <p>Comunicación con el bot: <span className="text-white">{communicationStatusLabel}</span></p>
              <p>Última actividad registrada: <span className="text-white">{latestBotLog ? formatDateTime(latestBotLog.createdAt) : "Sin actividad reciente"}</span></p>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="border-y border-white/10 py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Actividad oficial</p>
              <h2 className="mt-2 text-2xl font-semibold">Rendimiento de alertas</h2>
              <p className="mt-2 text-sm text-white/65">Resultados de las alertas oficiales cerradas de CARVIPIX y su desempeño operativo.</p>
            </div>
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshGlobalResults()}>
              Actualizar resultados
            </CARVIPIXButton>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: weeklyMetricLabel, value: weeklyMetricValue },
              { label: "Objetivos alcanzados", value: String(globalResults?.alerts.takeProfits ?? 0) },
              { label: "Stop Loss alcanzados", value: String(globalResults?.alerts.stopLosses ?? 0) },
              { label: "Efectividad de alertas", value: `${globalResults?.alerts.winRate.toFixed(1) ?? "0.0"}%` },
            ].map((item) => (
              <CARVIPIXCard key={item.label} variant="statistics" padding="16" hover={false}>
                <p className="text-xs text-white/60">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              </CARVIPIXCard>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Actividad oficial</p>
              <h2 className="mt-2 text-2xl font-semibold">Rendimiento operativo del Bot</h2>
              <p className="mt-2 text-sm text-white/65">Actividad y resultados de las operaciones ejecutadas por el Bot CARVIPIX.</p>
            </div>
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshPortal()}>
              Actualizar bot
            </CARVIPIXButton>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Instalaciones registradas", value: String(portal.bot.instances.length) },
              { label: "Bots en operación", value: String(activeBots) },
              { label: "Cuentas conectadas", value: String(botConnections.length) },
              { label: "Operaciones ejecutadas", value: String(portal.operations.length) },
            ].map((item) => (
              <CARVIPIXCard key={item.label} variant="statistics" padding="16" hover={false}>
                <p className="text-xs text-white/60">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              </CARVIPIXCard>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
            <p>
              Última operación: <span className="text-white">{latestOperation ? `${latestOperation.symbol} · ${latestOperation.status} · ${latestOperation.pnl >= 0 ? "+" : ""}${latestOperation.pnl.toFixed(2)}` : "Aún no hay operaciones ejecutadas"}</span>
            </p>
            {latestOperation ? <p className="mt-1 text-white/50">{formatDateTime(latestOperation.executedAt)}</p> : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/alertas")}>Ver alertas</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/bot")}>Estado operativo del Bot</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/resultados")}>Ver resultados</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/membresia")}>Gestionar membresía</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/soporte")}>Centro de soporte</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/servicios")}>Explorar servicios</CARVIPIXButton>
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

        .cv-card {
          border: 1px solid rgba(212, 175, 55, 0.2) !important;
          background: linear-gradient(180deg, rgba(9, 10, 14, 0.95), rgba(6, 7, 10, 0.96)) !important;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        @media (max-width: 768px) {
          .cv-hero-visual {
            min-height: 180px;
          }
        }
      `}</style>
    </main>
  );
}
