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
  const planStatusLabel = portal?.plan.membershipActive
    ? `Membresia ${portal?.plan.officialPlan}`
    : `Sin membresía activa (${portal?.plan.officialPlan})`;
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

  return (
    <main className="dashboard-shell min-h-screen text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <section className="cv-hero rounded-3xl border border-[#D4AF37]/35 p-6 lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[#D4AF37]">Dashboard oficial</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">CARVIPIX {portal.plan.officialPlan}</h1>
                <p className="mt-3 max-w-3xl text-sm text-white/70">Vista simplificada con datos reales de membresía, alertas y bot.</p>
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

            <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Resumen de cuenta</p>
              <div className="mt-4 space-y-2 text-sm text-white/75">
                <p>Plan oficial: <span className="text-white">{portal.plan.officialPlan}</span></p>
                <p>Membresía: <span className="text-white">{portal.plan.membershipActive ? "Activa" : "Inactiva"}</span></p>
                <p>Pares habilitados: <span className="text-white">{portal.plan.entitlements.allowedPairs ? portal.plan.entitlements.allowedPairs.join(", ") : "Todos"}</span></p>
                <p>Alertas por día: <span className="text-white">{portal.plan.entitlements.maxAlertsPerDay}</span></p>
                <p>Bot adquirido: <span className="text-white">{botHasLicense ? "Si" : "No"}</span></p>
              </div>
            </CARVIPIXCard>
          </div>

          {dataSource && (
            <p className="mt-3 text-xs text-white/60">
              {`Origen: ${dataOrigin} · Capturado: ${formatDateTime(dataSource.capturedAt)} · Vigencia: ${formatDateTime(dataSource.validUntil)}`}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Alertas restantes hoy", value: String(portal.alerts.remainingToday), icon: Bell },
              { label: "Pares habilitados", value: portal.plan.entitlements.allowedPairs ? String(portal.plan.entitlements.allowedPairs.length) : "Todos", icon: ShieldCheck },
              { label: "Instancias bot activas", value: String(activeBots), icon: Bot },
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
            <h2 className="text-xl font-semibold">Alerta actual</h2>
            <div className="mt-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            {latestAlert ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-white"><span className="text-white/60">Activo:</span> {latestAlert.symbol}</p>
                <p className="text-white"><span className="text-white/60">Estado:</span> {latestAlert.status}</p>
                <p className="text-white"><span className="text-white/60">Titulo:</span> {latestAlert.title}</p>
                <p className="text-white/75">{latestAlert.description}</p>
                <p className="text-white/50">{formatDateTime(latestAlert.timestamp)}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/60">No hay alerta activa registrada en este momento.</p>
            )}
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="16" hover={false} className="cv-card">
            <h2 className="text-xl font-semibold">Estado del Bot</h2>
            <div className="mt-3 text-xs text-white/60">{`Fuente de datos: ${dataOrigin}`}</div>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <p>Licencia: <span className="text-white">{botHasLicense ? "Activa" : "No disponible"}</span></p>
              <p>Broker: <span className="text-white">{portal.bot.license?.brokerConnected ?? "Sin vincular"}</span></p>
              <p>Estado de conexión: <span className="text-white">{botConnectionState}</span></p>
              <p>Heartbeat: <span className="text-white">{latestConnection?.heartbeatAt ? formatDateTime(latestConnection.heartbeatAt) : "Sin heartbeat"}</span></p>
              <p>Ultima actividad bot: <span className="text-white">{latestBotLog ? `${latestBotLog.eventType} · ${formatDateTime(latestBotLog.createdAt)}` : "Sin actividad registrada"}</span></p>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="border-y border-white/10 py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Actividad oficial</p>
              <h2 className="mt-2 text-2xl font-semibold">Resultados de Alertas</h2>
              <p className="mt-2 text-sm text-white/65">Solo cierres BUY/SELL activados; excluye pruebas, WAIT y NO_TRADE.</p>
            </div>
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshGlobalResults()}>
              Actualizar resultados
            </CARVIPIXButton>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Pips esta semana", value: globalResults?.alerts.weeklyPips.toFixed(1) ?? "0.0" },
              { label: "Cierres TP", value: String(globalResults?.alerts.takeProfits ?? 0) },
              { label: "Cierres SL", value: String(globalResults?.alerts.stopLosses ?? 0) },
              { label: "Win rate oficial", value: `${globalResults?.alerts.winRate.toFixed(1) ?? "0.0"}%` },
            ].map(item => (
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
              <h2 className="mt-2 text-2xl font-semibold">Resultados del Bot</h2>
              <p className="mt-2 text-sm text-white/65">Métricas operativas basadas en estado real de instancias y operaciones registradas.</p>
            </div>
            <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void refreshPortal()}>
              Actualizar bot
            </CARVIPIXButton>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Instancias registradas", value: String(portal.bot.instances.length) },
              { label: "Instancias en ejecucion", value: String(activeBots) },
              { label: "Conexiones broker", value: String(botConnections.length) },
              { label: "Operaciones registradas", value: String(portal.operations.length) },
            ].map((item) => (
              <CARVIPIXCard key={item.label} variant="statistics" padding="16" hover={false}>
                <p className="text-xs text-white/60">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              </CARVIPIXCard>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
            <p>
              Ultima operacion: <span className="text-white">{latestOperation ? `${latestOperation.symbol} · ${latestOperation.status} · ${latestOperation.pnl >= 0 ? "+" : ""}${latestOperation.pnl.toFixed(2)}` : "Sin operaciones registradas"}</span>
            </p>
            {latestOperation ? <p className="mt-1 text-white/50">{formatDateTime(latestOperation.executedAt)}</p> : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/alertas")}>Ir a Alertas</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/bot")}>Ir a Bot</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/resultados")}>Ir a Resultados</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/membresia")}>Ir a Membresía</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/soporte")}>Ir a Soporte</CARVIPIXButton>
          <CARVIPIXButton variant="ghost" onClick={() => router.push("/servicios")}>Ir a Servicios</CARVIPIXButton>
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
