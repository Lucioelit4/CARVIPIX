"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, Download, FileText, LifeBuoy, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { BotInstance, BotLicense } from "@/app/lib/modules/bot/types";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, colors, spacing } from "@/app/design-system";
import DataSourceBanner from "@/app/components/DataSourceBanner";

type BotConnection = {
  id: string;
  botInstanceId: string;
  brokerType: "MT4" | "MT5";
  mode: string;
  connectionStatus: string;
  heartbeatAt: string | null;
  updatedAt: string;
};

type BotLog = {
  id: string;
  botInstanceId: string | null;
  level: string;
  eventType: string;
  message: string;
  createdAt: string;
};

type BotOperation = {
  id: string;
  symbol: string;
  side: string;
  status: string;
  pnl: number;
  executedAt: string;
  metadata: Record<string, unknown>;
};

type BotLatestSignal = {
  signalId: string;
  symbol: string;
  direction: "BUY" | "SELL" | "NONE";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
  createdAt: string;
};

type BotSnapshot = {
  generatedAt: string;
  runningInstances: number;
  connectedAccounts: number;
};

type BotPortalPayload = {
  license: BotLicense | null;
  instances: BotInstance[];
  connections: BotConnection[];
  logs: BotLog[];
  latestSignal: BotLatestSignal | null;
  operations: BotOperation[];
  snapshot: BotSnapshot | null;
};

type PortalSnapshot = {
  plan: {
    entitlements: {
      allowedPairs: string[] | null;
    };
  };
};

type ActivityItem = {
  id: string;
  title: string;
  summary: string;
  occurredAt: string;
};

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "No disponible";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return date.toLocaleString("es-ES");
}

function formatBotStatus(status: string | undefined): string {
  switch (status) {
    case "running":
    case "connected":
    case "ACTIVE":
      return "Operativo";
    case "paused":
      return "Pausado";
    case "error":
    case "ERROR":
      return "Con incidencia";
    case "inactive":
    case "pending":
      return "Pendiente";
    case "disconnected":
      return "Desconectado";
    default:
      return "Pendiente";
  }
}

function formatConnectionStatus(status: string | undefined): string {
  switch (status) {
    case "connected":
      return "Conectado";
    case "disconnected":
      return "Desconectado";
    case "pending":
      return "Pendiente";
    default:
      return "Pendiente";
  }
}

function formatDecision(value: string | undefined): string {
  if (value === "BUY") {
    return "Compra";
  }
  if (value === "SELL") {
    return "Venta";
  }
  return "Sin operación";
}

function formatNumericLevel(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "No disponible";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

function formatActivityTitle(eventType: string, message: string): string {
  const normalized = eventType.toLowerCase();

  if (normalized.includes("broker.connected") || normalized.includes("connection")) {
    return "Conexión";
  }
  if (normalized.includes("instance.created") || normalized.includes("installation")) {
    return "Instalación registrada";
  }
  if (normalized.includes("signal")) {
    return "Señal recibida";
  }
  if (normalized.includes("execution") || normalized.includes("operation")) {
    return "Operación ejecutada";
  }
  if (normalized.includes("license")) {
    return "Actualización de licencia";
  }
  if (normalized.includes("status.changed")) {
    return "Estado actualizado";
  }
  if (normalized.includes("diagnostics")) {
    return "Diagnóstico";
  }

  return message ? "Actividad del Bot" : "Actividad reciente";
}

export default function BotPage() {
  const [loading, setLoading] = useState(true);
  const [botData, setBotData] = useState<BotPortalPayload | null>(null);
  const [allowedPairs, setAllowedPairs] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [botResponse, portalResponse] = await Promise.all([
          fetch("/api/client/bot", { cache: "no-store" }),
          fetch("/api/client/portal", { cache: "no-store" }),
        ]);

        if (active && portalResponse.ok) {
          const portalPayload = (await portalResponse.json()) as { data: PortalSnapshot };
          setAllowedPairs(portalPayload.data.plan.entitlements.allowedPairs ?? null);
        }

        if (active && botResponse.ok) {
          const botPayload = (await botResponse.json()) as { data: BotPortalPayload };
          setBotData(botPayload.data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const license = botData?.license ?? null;
  const instances = botData?.instances ?? [];
  const connections = botData?.connections ?? [];
  const logs = botData?.logs ?? [];
  const operations = botData?.operations ?? [];
  const latestSignal = botData?.latestSignal ?? null;
  const snapshot = botData?.snapshot ?? null;

  const primaryInstance = instances[0] ?? null;
  const latestConnection = connections[0] ?? null;
  const latestOperation = operations[0] ?? null;
  const hasBotAcquired = Boolean(license);
  const platformLabel = latestConnection?.brokerType ?? license?.brokerConnected ?? "MT4 / MT5";
  const connectionStatus = formatConnectionStatus(latestConnection?.connectionStatus ?? primaryInstance?.status);
  const botOperationalStatus = formatBotStatus(primaryInstance?.status ?? latestConnection?.connectionStatus);
  const pairsLabel = allowedPairs && allowedPairs.length > 0 ? allowedPairs.join(", ") : "Todos";

  const resultsSummary = useMemo(() => {
    const totalOperations = primaryInstance?.stats.totalTrades ?? operations.length;
    const positiveOperations = primaryInstance?.stats.winningTrades ?? operations.filter((item) => item.pnl > 0).length;
    const negativeOperations = primaryInstance?.stats.losingTrades ?? operations.filter((item) => item.pnl < 0).length;
    const effectiveness = primaryInstance
      ? `${(primaryInstance.stats.winRate * 100).toFixed(1)}%`
      : totalOperations > 0
        ? `${((positiveOperations / totalOperations) * 100).toFixed(1)}%`
        : "0.0%";

    return {
      totalOperations,
      positiveOperations,
      negativeOperations,
      effectiveness,
      latestOperationLabel: latestOperation
        ? `${latestOperation.symbol} · ${formatDecision(latestOperation.side)} · ${formatDateTime(latestOperation.executedAt)}`
        : "Sin operaciones registradas",
    };
  }, [latestOperation, operations, primaryInstance]);

  const currentOperation = useMemo(() => {
    if (!latestOperation && !latestSignal) {
      return null;
    }

    return {
      symbol: latestOperation?.symbol ?? latestSignal?.symbol ?? primaryInstance?.symbol ?? "No disponible",
      side: latestOperation?.side ?? latestSignal?.direction ?? "NONE",
      entry: latestSignal?.entry ?? null,
      stopLoss: latestSignal?.stopLoss ?? null,
      takeProfit: latestSignal?.takeProfit ?? null,
      status: latestOperation?.status ?? latestSignal?.status ?? primaryInstance?.status ?? "pending",
      executedAt: latestOperation?.executedAt ?? latestSignal?.createdAt ?? null,
    };
  }, [latestOperation, latestSignal, primaryInstance]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    if (latestConnection) {
      items.push({
        id: `connection-${latestConnection.id}`,
        title: "Conexión",
        summary: `${platformLabel} · ${connectionStatus}`,
        occurredAt: latestConnection.heartbeatAt ?? latestConnection.updatedAt,
      });
    }

    if (latestSignal && latestSignal.direction !== "NONE") {
      items.push({
        id: `signal-${latestSignal.signalId}`,
        title: "Señal recibida",
        summary: `${latestSignal.symbol} · ${formatDecision(latestSignal.direction)} · ${latestSignal.status}`,
        occurredAt: latestSignal.createdAt,
      });
    }

    if (latestOperation) {
      items.push({
        id: `operation-${latestOperation.id}`,
        title: latestOperation.status.toLowerCase().includes("close") ? "Operación cerrada" : "Operación ejecutada",
        summary: `${latestOperation.symbol} · ${formatDecision(latestOperation.side)} · ${latestOperation.status}`,
        occurredAt: latestOperation.executedAt,
      });
    }

    logs.forEach((log) => {
      items.push({
        id: log.id,
        title: formatActivityTitle(log.eventType, log.message),
        summary: log.message,
        occurredAt: log.createdAt,
      });
    });

    return items
      .filter((item) => item.summary.trim().length > 0)
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 5);
  }, [connectionStatus, latestConnection, latestOperation, latestSignal, logs, platformLabel]);

  const handleDownload = async () => {
    try {
      const response = await fetch("/api/client/bot/mt5/download-ea");
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CARVIPIX_EA_MT5_V1.ex5";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Keep silent to preserve the current user flow.
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.black.pure,
        color: colors.white.pure,
        paddingLeft: spacing[16],
        paddingRight: spacing[16],
        paddingTop: spacing[16],
        paddingBottom: spacing[32],
      }}
    >
      <div className="cv-workspace max-w-7xl">
        <DataSourceBanner />
      </div>

      <div className="bot-page-shell">
        <section className="section-shell hero-shell">
          <div className="hero-top">
            <div>
              <CARVIPIXBadge variant="premium">BOT CARVIPIX</CARVIPIXBadge>
              <h1 className="section-title">Centro operativo del Bot</h1>
              <p className="section-copy">Supervisa licencia, conexión, actividad reciente y resultados sin simulaciones ni bloques comerciales repetidos.</p>
            </div>

            <div className="hero-visual-wrap" aria-hidden="true">
              <div className="hero-orb-stage">
                <div className="hero-orb-ring hero-orb-ring-1" />
                <div className="hero-orb-ring hero-orb-ring-2" />
                <div className="hero-orb-core">
                  <Bot size={42} />
                </div>
                <div className="hero-orb-tag hero-orb-tag-top">LICENCIA</div>
                <div className="hero-orb-tag hero-orb-tag-right">RISK LAYER</div>
                <div className="hero-orb-tag hero-orb-tag-bottom">DESCARGA EA</div>
              </div>
            </div>
          </div>

          {loading ? (
            <CARVIPIXCard variant="admin" padding="16" hover={false} className="status-card">
              <p className="status-label">Estado</p>
              <strong className="status-value">Cargando información operativa...</strong>
            </CARVIPIXCard>
          ) : !hasBotAcquired ? (
            <CARVIPIXCard variant="premium" padding="16" hover={false} className="purchase-card">
              <div>
                <h2 className="card-heading">Bot CARVIPIX</h2>
                <p className="card-copy">Automatiza las operaciones correspondientes a tu membresía cuando existan oportunidades válidas.</p>
              </div>

              <div className="purchase-row">
                <div>
                  <p className="status-label">Precio</p>
                  <strong className="status-value">999 USD</strong>
                </div>
                <div className="action-row compact-actions">
                  <Link href="/checkout?product=bot-carvipix-license" className="unstyled-link">
                    <CARVIPIXButton variant="premium" size="lg">Comprar Bot CARVIPIX</CARVIPIXButton>
                  </Link>
                  <Link href="/servicios/bot" className="unstyled-link">
                    <CARVIPIXButton variant="ghost" size="lg">Ver detalles</CARVIPIXButton>
                  </Link>
                </div>
              </div>
            </CARVIPIXCard>
          ) : (
            <div className="status-grid" id="estado-bot">
              <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                <p className="status-label">Estado operativo</p>
                <strong className="status-value">{botOperationalStatus}</strong>
              </CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                <p className="status-label">Licencia</p>
                <strong className="status-value">{license?.active ? "Activa" : "Inactiva"}</strong>
              </CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                <p className="status-label">Plataforma</p>
                <strong className="status-value">{platformLabel}</strong>
              </CARVIPIXCard>
              <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                <p className="status-label">Última comunicación</p>
                <strong className="status-value status-value--sm">{formatDateTime(latestConnection?.heartbeatAt ?? latestConnection?.updatedAt)}</strong>
              </CARVIPIXCard>
            </div>
          )}
        </section>

        {hasBotAcquired ? (
          <>
            <section className="section-shell">
              <div className="section-heading-inline">
                <div>
                  <p className="section-kicker">Estado principal</p>
                  <h2 className="card-heading">Resumen operativo</h2>
                </div>
                <CARVIPIXBadge variant={license?.active ? "success" : "warning"}>{license?.active ? "Licencia validada" : "Licencia pendiente"}</CARVIPIXBadge>
              </div>

              <div className="summary-grid">
                <CARVIPIXCard variant="admin" padding="16" hover={false} className="panel-card">
                  <div className="panel-row"><span>Bot adquirido</span><strong>{hasBotAcquired ? "Sí" : "No"}</strong></div>
                  <div className="panel-row"><span>Plataforma</span><strong>{platformLabel}</strong></div>
                  <div className="panel-row"><span>Conexión</span><strong>{connectionStatus}</strong></div>
                  <div className="panel-row"><span>Pares habilitados</span><strong>{pairsLabel}</strong></div>
                </CARVIPIXCard>

                <CARVIPIXCard variant="admin" padding="16" hover={false} className="panel-card">
                  <div className="panel-row"><span>Instancias registradas</span><strong>{instances.length}</strong></div>
                  <div className="panel-row"><span>Cuentas conectadas</span><strong>{snapshot?.connectedAccounts ?? connections.length}</strong></div>
                  <div className="panel-row"><span>Bots operativos</span><strong>{snapshot?.runningInstances ?? 0}</strong></div>
                  <div className="panel-row"><span>Última operación</span><strong className="status-value--sm">{resultsSummary.latestOperationLabel}</strong></div>
                </CARVIPIXCard>
              </div>
            </section>

            <section className="section-shell" id="instalacion-bot">
              <div className="section-heading-inline">
                <div>
                  <p className="section-kicker">Instalación y conexión</p>
                  <h2 className="card-heading">Checklist compacto</h2>
                </div>
              </div>

              <CARVIPIXCard variant="admin" padding="16" hover={false} className="panel-card compact-list">
                <div className="panel-row"><span>Archivo entregado</span><strong>CARVIPIX_EA_MT5_V1.ex5</strong></div>
                <div className="panel-row"><span>Licencia validada</span><strong>{license?.active ? "Sí" : "Pendiente"}</strong></div>
                <div className="panel-row"><span>Instalación registrada</span><strong>{instances.length > 0 ? "Sí" : "Pendiente"}</strong></div>
                <div className="panel-row"><span>MT5 conectado</span><strong>{platformLabel === "MT5" && connectionStatus === "Conectado" ? "Sí" : "Pendiente"}</strong></div>
                <div className="panel-row"><span>Estado</span><strong>{license?.active && connectionStatus === "Conectado" ? "Listo" : "Pendiente"}</strong></div>
              </CARVIPIXCard>
            </section>

            <section className="section-shell">
              <div className="section-heading-inline">
                <div>
                  <p className="section-kicker">Operación actual</p>
                  <h2 className="card-heading">Estado de ejecución</h2>
                </div>
              </div>

              <CARVIPIXCard variant="admin" padding="16" hover={false} className="panel-card">
                {currentOperation && (currentOperation.side === "BUY" || currentOperation.side === "SELL") ? (
                  <div className="operation-grid">
                    <div className="panel-row"><span>Par</span><strong>{currentOperation.symbol}</strong></div>
                    <div className="panel-row"><span>Dirección</span><strong>{formatDecision(currentOperation.side)}</strong></div>
                    <div className="panel-row"><span>Entrada</span><strong>{formatNumericLevel(currentOperation.entry)}</strong></div>
                    <div className="panel-row"><span>Stop Loss</span><strong>{formatNumericLevel(currentOperation.stopLoss)}</strong></div>
                    <div className="panel-row"><span>Take Profit</span><strong>{formatNumericLevel(currentOperation.takeProfit)}</strong></div>
                    <div className="panel-row"><span>Estado</span><strong>{currentOperation.status}</strong></div>
                    <div className="panel-row operation-grid__wide"><span>Hora de ejecución</span><strong>{formatDateTime(currentOperation.executedAt)}</strong></div>
                  </div>
                ) : (
                  <p className="empty-copy">El Bot está esperando una oportunidad válida.</p>
                )}
              </CARVIPIXCard>
            </section>

            <section className="section-shell">
              <div className="section-heading-inline">
                <div>
                  <p className="section-kicker">Actividad reciente</p>
                  <h2 className="card-heading">Últimos eventos relevantes</h2>
                </div>
              </div>

              <div className="activity-list">
                {recentActivity.length > 0 ? recentActivity.map((item) => (
                  <CARVIPIXCard key={item.id} variant="info" padding="16" hover={false} className="activity-card">
                    <div className="activity-icon"><Activity size={16} /></div>
                    <div>
                      <p className="activity-title">{item.title}</p>
                      <p className="activity-summary">{item.summary}</p>
                      <p className="activity-time">{formatDateTime(item.occurredAt)}</p>
                    </div>
                  </CARVIPIXCard>
                )) : (
                  <CARVIPIXCard variant="info" padding="16" hover={false}>
                    <p className="empty-copy">Todavía no hay actividad reciente visible.</p>
                  </CARVIPIXCard>
                )}
              </div>
            </section>

            <section className="section-shell">
              <div className="section-heading-inline">
                <div>
                  <p className="section-kicker">Resumen de resultados del Bot</p>
                  <h2 className="card-heading">Métricas operativas</h2>
                </div>
                <Link href="/resultados" className="inline-link">Ver resultados completos del Bot</Link>
              </div>

              <div className="status-grid">
                <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                  <p className="status-label">Operaciones ejecutadas</p>
                  <strong className="status-value">{resultsSummary.totalOperations}</strong>
                </CARVIPIXCard>
                <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                  <p className="status-label">Positivas</p>
                  <strong className="status-value">{resultsSummary.positiveOperations}</strong>
                </CARVIPIXCard>
                <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                  <p className="status-label">Negativas</p>
                  <strong className="status-value">{resultsSummary.negativeOperations}</strong>
                </CARVIPIXCard>
                <CARVIPIXCard variant="statistics" padding="16" hover={false} className="status-card">
                  <p className="status-label">Efectividad</p>
                  <strong className="status-value">{resultsSummary.effectiveness}</strong>
                </CARVIPIXCard>
              </div>

              <CARVIPIXCard variant="admin" padding="16" hover={false} className="panel-card">
                <div className="panel-row"><span>Última operación</span><strong className="status-value--sm">{resultsSummary.latestOperationLabel}</strong></div>
              </CARVIPIXCard>
            </section>

            <section className="section-shell actions-shell">
              <div className="action-row">
                <CARVIPIXButton variant="premium" size="lg" leftIcon={<Download size={16} />} onClick={handleDownload}>Descargar Bot</CARVIPIXButton>
                <Link href="/bot-mt5" className="unstyled-link">
                  <CARVIPIXButton variant="ghost" size="lg" leftIcon={<FileText size={16} />}>Guía de instalación</CARVIPIXButton>
                </Link>
                <a href="#estado-bot" className="unstyled-link">
                  <CARVIPIXButton variant="ghost" size="lg" leftIcon={<ShieldCheck size={16} />}>Ver estado</CARVIPIXButton>
                </a>
                <Link href="/soporte" className="unstyled-link">
                  <CARVIPIXButton variant="ghost" size="lg" leftIcon={<LifeBuoy size={16} />}>Solicitar asistencia</CARVIPIXButton>
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .bot-page-shell {
          margin: 0 auto;
          max-width: 1180px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-shell {
          border: 1px solid rgba(212, 175, 55, 0.18);
          border-radius: 24px;
          padding: 24px;
          background:
            radial-gradient(circle at 12% 18%, rgba(18, 86, 180, 0.16), transparent 28%),
            linear-gradient(180deg, rgba(8, 10, 16, 0.96), rgba(5, 7, 11, 0.98));
        }

        .hero-shell {
          display: grid;
          gap: 18px;
        }

        .hero-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 24px;
          align-items: center;
        }

        .section-title {
          margin: 12px 0 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.04;
        }

        .section-copy,
        .card-copy,
        .empty-copy,
        .activity-summary,
        .activity-time,
        .inline-link {
          color: rgba(255, 255, 255, 0.68);
        }

        .section-heading-inline {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .section-kicker {
          margin: 0;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.9);
        }

        .card-heading {
          margin: 6px 0 0;
          font-size: 1.5rem;
        }

        .status-grid,
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .hero-visual-wrap {
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }

        .hero-orb-stage {
          position: relative;
          width: min(100%, 280px);
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.22);
          background:
            radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.20), rgba(5, 10, 18, 0.96) 54%),
            linear-gradient(180deg, rgba(5, 10, 18, 0.98), rgba(4, 8, 16, 1));
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
        }

        .hero-orb-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(212, 175, 55, 0.28);
          animation: spin 18s linear infinite;
        }

        .hero-orb-ring-1 {
          width: 64%;
          height: 64%;
        }

        .hero-orb-ring-2 {
          width: 78%;
          height: 78%;
          border-color: rgba(44, 146, 255, 0.45);
          animation-direction: reverse;
          animation-duration: 24s;
        }

        .hero-orb-core {
          position: relative;
          z-index: 1;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d4af37;
          background: linear-gradient(160deg, #0d1524, #0a1220 62%, #0f1c2b);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            0 0 0 10px rgba(212, 175, 55, 0.08),
            0 0 48px rgba(212, 175, 55, 0.18);
          animation: pulse 2.8s ease-in-out infinite;
        }

        .hero-orb-tag {
          position: absolute;
          z-index: 1;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(12, 14, 18, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
          white-space: nowrap;
        }

        .hero-orb-tag-top {
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
        }

        .hero-orb-tag-right {
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        .hero-orb-tag-bottom {
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .status-card,
        .panel-card,
        .purchase-card {
          border: 1px solid rgba(212, 175, 55, 0.18) !important;
          background: linear-gradient(180deg, rgba(10, 14, 24, 0.92), rgba(7, 9, 16, 0.96)) !important;
        }

        .status-label {
          margin: 0;
          font-size: 0.76rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.58);
        }

        .status-value {
          display: block;
          margin-top: 8px;
          font-size: 1.32rem;
          color: #fff;
          line-height: 1.2;
        }

        .status-value--sm {
          font-size: 0.96rem;
          line-height: 1.45;
        }

        .panel-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.74);
        }

        .panel-row:first-child {
          padding-top: 0;
        }

        .panel-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .panel-row strong {
          color: #fff;
          text-align: right;
        }

        .compact-list {
          max-width: 760px;
        }

        .operation-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0 18px;
        }

        .operation-grid__wide {
          grid-column: 1 / -1;
        }

        .activity-list {
          display: grid;
          gap: 12px;
        }

        .activity-card {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 12px;
          align-items: flex-start;
        }

        .activity-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #d4af37;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.22);
        }

        .activity-title {
          margin: 0;
          font-weight: 700;
          color: #fff;
        }

        .activity-summary,
        .activity-time {
          margin: 4px 0 0;
          font-size: 0.92rem;
        }

        .purchase-row,
        .action-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .compact-actions {
          justify-content: flex-end;
        }

        .actions-shell {
          padding-top: 8px;
        }

        .unstyled-link {
          text-decoration: none;
        }

        .inline-link {
          text-decoration: none;
          font-size: 0.92rem;
        }

        .inline-link:hover {
          color: #fff;
        }

        @media (max-width: 980px) {
          .hero-top {
            grid-template-columns: 1fr;
          }

          .hero-visual-wrap {
            justify-content: center;
          }

          .status-grid,
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .section-shell {
            padding: 18px;
          }

          .status-grid,
          .summary-grid,
          .operation-grid {
            grid-template-columns: 1fr;
          }

          .hero-orb-stage {
            width: min(100%, 240px);
          }

          .compact-actions,
          .action-row,
          .purchase-row {
            justify-content: stretch;
          }

          .compact-actions :global(button),
          .action-row :global(button) {
            width: 100%;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
      `}</style>
    </main>
  );
}
