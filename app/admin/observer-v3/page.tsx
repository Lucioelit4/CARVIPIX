"use client";

import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw, AlertCircle } from "lucide-react";
import { CertificationCounters } from "./components/CertificationCounters";
import { CertificationLog } from "./components/CertificationLog";
import { CertificationExport } from "./components/CertificationExport";
import { TelegramStatusCard } from "./components/TelegramStatusCard";
import { CommunityPublisherPanel } from "./components/CommunityPublisherPanel";
import { CommunityPublisherTemplatesPanel } from "./components/CommunityPublisherTemplatesPanel";
import { TrustConversionPanel } from "./components/TrustConversionPanel";
import { CertificationLogEntry, CertificationSummary } from "@/app/lib/types/certificationTypes";

interface AnalysisSummary {
  last_analysis?: {
    analysis_id: string;
    signal_id: string;
    timestamp_utc_ms: number;
    status: string;
    respuesta_maestra?: any;
    response_cost_usd: number;
    response_latency_ms: number;
  };
  last_timestamp_utc_ms?: number;
  total_cost_usd: number;
  total_analyses: number;
  last_decision?: string;
  last_status?: string;
}

interface PaperAccount {
  current_balance_usd: number;
  total_pnl_usd: number;
  total_pnl_pct: number;
  win_count: number;
  loss_count: number;
  expired_count: number;
  max_drawdown_usd: number;
  win_rate: number;
}

interface StatusData {
  success: boolean;
  instruments: Record<string, AnalysisSummary>;
  paper_account: PaperAccount;
  total_analyses: number;
  total_cost_usd: number;
  timestamp_utc_ms: number;
}

const statusBadgeColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "SKIPPED_BEFORE_AI":
      return "bg-yellow-100 text-yellow-800";
    case "REUSED_PREVIOUS_ANALYSIS":
      return "bg-blue-100 text-blue-800";
    case "AI_ERROR":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const decisionBadgeColor = (decision: string) => {
  switch (decision) {
    case "ENTER_BUY":
      return "bg-green-500";
    case "ENTER_SELL":
      return "bg-red-500";
    case "WAIT":
      return "bg-yellow-500";
    case "NO_TRADE":
      return "bg-gray-500";
    case "CONDITIONAL_ENTRY":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export default function ObservadorMaestroV3Page() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Certification data
  const [certLogs, setCertLogs] = useState<CertificationLogEntry[]>([]);
  const [certSummary, setCertSummary] = useState<CertificationSummary | null>(null);
  const [certLoading, setCertLoading] = useState(true);

  // Initialize observer and fetch data every 3 seconds
  useEffect(() => {
    // Initialize observer once on mount
    (async () => {
      try {
        const initResponse = await fetch("/api/internal/maestro-v3-init", {
          method: "POST",
        });
        if (!initResponse.ok) {
          console.warn("Observer initialization returned non-OK status");
        }
        const initData = await initResponse.json();
        console.log("[ObserverUI] Observer init result:", initData);
      } catch (err) {
        console.warn("[ObserverUI] Failed to initialize observer:", err);
      }
    })();

    // Fetch data every 3 seconds
    const fetchData = async () => {
      try {
        const response = await fetch("/api/internal/observer-v3/status");
        if (response.ok) {
          const data: StatusData = await response.json();
          setStatusData(data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error("Failed to fetch observer status:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch certification logs every 3 seconds
    const fetchCertData = async () => {
      try {
        const response = await fetch("/api/internal/certification-logs", {
          headers: { Authorization: "Bearer admin" },
        });
        if (response.ok) {
          const data = await response.json();
          setCertLogs(data.logs || []);
          setCertSummary(data.summary || null);
        }
      } catch (err) {
        console.error("Failed to fetch certification logs:", err);
      } finally {
        setCertLoading(false);
      }
    };

    fetchData();
    fetchCertData();
    const interval = setInterval(() => {
      fetchData();
      fetchCertData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando Observador Maestro V3...</p>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Error al cargar datos del observador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔬 OBSERVADOR MAESTRO V3</h1>
          <p className="text-gray-400">Demostración en vivo del Expediente Maestro V3</p>
          <p className="text-xs text-gray-500 mt-2">
            Última actualización: {lastUpdate?.toLocaleTimeString("es-ES") ?? "—"}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="text-gray-300 text-sm font-semibold">Total Análisis</div>
            <div className="text-3xl font-bold text-white mt-1">{statusData.total_analyses}</div>
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="text-gray-300 text-sm font-semibold">Costo USD</div>
            <div className="text-3xl font-bold text-white mt-1">${statusData.total_cost_usd.toFixed(2)}</div>
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="text-gray-300 text-sm font-semibold">Balance Papel</div>
            <div className="text-3xl font-bold text-white mt-1">
              ${statusData.paper_account.current_balance_usd.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <div className="text-gray-300 text-sm font-semibold">P&L Papel</div>
            <div
              className={`text-3xl font-bold mt-1 ${
                statusData.paper_account.total_pnl_usd >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ${statusData.paper_account.total_pnl_usd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Paper Account Details */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">📊 Monitor Papel USD 10,000</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-white font-semibold ml-2">{(statusData.paper_account.win_rate * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Ganancias:</span>
              <span className="text-green-400 font-semibold ml-2">
                {statusData.paper_account.win_count} ops
              </span>
            </div>
            <div>
              <span className="text-gray-400">Pérdidas:</span>
              <span className="text-red-400 font-semibold ml-2">
                {statusData.paper_account.loss_count} ops
              </span>
            </div>
            <div>
              <span className="text-gray-400">Expiradas:</span>
              <span className="text-yellow-400 font-semibold ml-2">
                {statusData.paper_account.expired_count} ops
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max Drawdown:</span>
              <span className="text-red-400 font-semibold ml-2">
                ${statusData.paper_account.max_drawdown_usd.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">P&L %:</span>
              <span
                className={`font-semibold ml-2 ${
                  statusData.paper_account.total_pnl_pct >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {(statusData.paper_account.total_pnl_pct * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Certification Act Section */}
        <div className="mb-8 space-y-4">
          <CertificationCounters summary={certSummary!} isLoading={certLoading} />
          <CertificationExport isReady={certSummary?.progress.ready_for_review || false} isLoading={certLoading} />
          <CertificationLog logs={certLogs} isLoading={certLoading} />
        </div>

        {/* Community Publisher — Telegram Status */}
        <div className="mb-8">
          <TelegramStatusCard />
        </div>

        {/* Community Publisher — Fase 2: Cola y Disparador */}
        <div className="mb-8">
          <CommunityPublisherPanel />
        </div>

        {/* Community Publisher — Fase 3: Plantillas Oficiales */}
        <div className="mb-8">
          <CommunityPublisherTemplatesPanel />
        </div>

        {/* Trust & Conversion Engine — Motor de Confianza */}
        <div className="mb-8">
          <TrustConversionPanel />
        </div>

        {/* Instruments Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">📡 Instrumentos en Monitoreo</h2>

          {Object.entries(statusData.instruments).map(([symbol, summary]) => (
            <div
              key={symbol}
              className="bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 transition-colors"
            >
              <div
                onClick={() => setExpandedSymbol(expandedSymbol === symbol ? null : symbol)}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="font-bold text-white text-lg min-w-24">{symbol}</div>

                    {summary.last_analysis && (
                      <>
                        <span className={`${statusBadgeColor(summary.last_status || "")} px-2 py-1 rounded text-xs font-semibold`}>
                          {summary.last_status}
                        </span>

                        {summary.last_decision && summary.last_decision !== "N/A" && (
                          <span className={`${decisionBadgeColor(summary.last_decision)} text-white px-2 py-1 rounded text-xs font-semibold`}>
                            {summary.last_decision}
                          </span>
                        )}

                        {summary.last_analysis.respuesta_maestra?.master_decision && (
                          <div className="text-xs text-gray-300">
                            Prob:{" "}
                            <span className="font-semibold">
                              {(
                                summary.last_analysis.respuesta_maestra.master_decision.probability_estimated * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Análisis: {summary.total_analyses}</div>
                      <div className="text-xs text-gray-400">Costo: ${summary.total_cost_usd.toFixed(3)}</div>
                    </div>

                    {summary.last_analysis && (
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Latencia</div>
                        <div className="text-sm font-semibold text-white">
                          {summary.last_analysis.response_latency_ms}ms
                        </div>
                      </div>
                    )}

                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedSymbol === symbol ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Last Analysis Timestamp */}
                {summary.last_analysis && (
                  <div className="mt-3 text-xs text-gray-400">
                    Última análisis:{" "}
                    {new Date(summary.last_timestamp_utc_ms || 0).toLocaleTimeString("es-ES")}
                    <br />
                    ID: <span className="font-mono text-gray-500">{summary.last_analysis.analysis_id}</span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedSymbol === symbol && summary.last_analysis && (
                <AnalysisDetailView analysisId={summary.last_analysis.analysis_id} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-xs">
          <p>
            Observador Maestro V3 • Actualización automática cada 3 segundos • {Object.keys(statusData.instruments).length}{" "}
            instrumentos monitoreados
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Detailed analysis view (expandable section)
 */
function AnalysisDetailView({ analysisId }: { analysisId: string }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/internal/observer-v3/${analysisId}`);
        if (response.ok) {
          const data = await response.json();
          setDetail(data.analysis);
        }
      } catch (err) {
        console.error("Failed to fetch analysis detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="px-4 py-3 border-t border-slate-600">
        <div className="text-gray-400 text-sm">Cargando detalles...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 py-3 border-t border-slate-600">
        <div className="text-red-400 text-sm">Error al cargar detalles</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-slate-600 space-y-6 bg-slate-800">
      {/* Master Decision */}
      <div>
        <h3 className="font-semibold text-white mb-2">⚡ Decisión Maestra</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Decisión:</span>
            <div className="text-white font-semibold mt-1">{detail.master_decision.decision}</div>
          </div>
          <div>
            <span className="text-gray-400">Dirección:</span>
            <div className="text-white font-semibold mt-1">{detail.master_decision.direction || "—"}</div>
          </div>
          <div>
            <span className="text-gray-400">Probabilidad:</span>
            <div className="text-white font-semibold mt-1">
              {(detail.master_decision.probability_estimated * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <span className="text-gray-400">Convicción:</span>
            <div className="text-white font-semibold mt-1">{detail.master_decision.conviction}</div>
          </div>
        </div>
      </div>

      {/* Analysis Private */}
      {detail.analysis_private && (
        <div>
          <h3 className="font-semibold text-white mb-2">🔒 Análisis Privado</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{detail.analysis_private}</p>
        </div>
      )}

      {/* Factores */}
      {(detail.factors_pro || detail.factors_con) && (
        <div>
          <h3 className="font-semibold text-white mb-2">📊 Factores</h3>
          <div className="grid grid-cols-2 gap-4">
            {detail.factors_pro && (
              <div>
                <div className="text-green-400 text-sm font-semibold mb-2">A Favor:</div>
                <ul className="text-gray-300 text-xs space-y-1">
                  {detail.factors_pro.map((factor: string, idx: number) => (
                    <li key={idx}>• {factor.slice(0, 80)}</li>
                  ))}
                </ul>
              </div>
            )}
            {detail.factors_con && (
              <div>
                <div className="text-red-400 text-sm font-semibold mb-2">En Contra:</div>
                <ul className="text-gray-300 text-xs space-y-1">
                  {detail.factors_con.map((factor: string, idx: number) => (
                    <li key={idx}>• {factor.slice(0, 80)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Matrix */}
      {detail.dispatch_matrix && detail.dispatch_matrix.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-2">📤 Matriz de Distribución (9 módulos)</h3>
          <div className="bg-slate-900 rounded p-3 overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left text-gray-400 py-2 px-2">Destino</th>
                  <th className="text-left text-gray-400 py-2 px-2">Estado</th>
                  <th className="text-left text-gray-400 py-2 px-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {detail.dispatch_matrix.map((dest: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-700">
                    <td className="py-2 px-2 text-white font-mono">{dest.destination}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          dest.status === "DELIVERED"
                            ? "bg-green-600 text-white"
                            : dest.status === "FAILED"
                              ? "bg-red-600 text-white"
                              : "bg-yellow-600 text-white"
                        }`}
                      >
                        {dest.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-400">
                      {new Date(dest.timestamp_utc_ms).toLocaleTimeString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Entregados: {detail.dispatch_delivered}/{detail.dispatch_matrix.length}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div>
        <h3 className="font-semibold text-white mb-2">📋 Metadatos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Analysis ID:</span>
            <div className="text-gray-300 font-mono mt-1">{detail.analysis_id.slice(0, 16)}...</div>
          </div>
          <div>
            <span className="text-gray-400">Costo USD:</span>
            <div className="text-white font-semibold mt-1">${detail.response_cost_usd.toFixed(4)}</div>
          </div>
          <div>
            <span className="text-gray-400">Latencia:</span>
            <div className="text-white font-semibold mt-1">{detail.response_latency_ms}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}
