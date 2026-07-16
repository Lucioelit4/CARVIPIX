"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Check, X, Send, BarChart3, AlertCircle, TrendingUp } from "lucide-react";
import type { CommercialSuggestion, ConversionMetrics } from "@/app/lib/trust-conversion/types";

interface MetricsData {
  ok: boolean;
  metrics: ConversionMetrics;
  report: {
    summary: string;
    top_converting_products: Array<{ product: string; conversions: number; ctr: number }>;
  };
  fetched_at: string;
}

interface SuggestionsData {
  ok: boolean;
  total: number;
  suggestions: CommercialSuggestion[];
  fetched_at: string;
}

export function TrustConversionPanel() {
  const [suggestions, setSuggestions] = useState<CommercialSuggestion[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"pending" | "metrics" | "history">("pending");
  const [inspecting, setInspecting] = useState<CommercialSuggestion | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sugRes, metRes] = await Promise.all([
        fetch("/api/internal/trust-conversion/suggestions?status=PENDING_APPROVAL"),
        fetch("/api/internal/trust-conversion/metrics"),
      ]);

      if (sugRes.ok) setSuggestions((await sugRes.json()).suggestions);
      if (metRes.ok) {
        const data = (await metRes.json()) as MetricsData;
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("[TCE Panel] fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function doAction(url: string, method = "POST", msg: string) {
    try {
      const res = await fetch(url, { method });
      if (res.ok) {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(null), 3000);
        fetchData();
      }
    } catch (e) {
      setActionMsg("Error: " + (e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 animate-pulse">
        <div className="h-5 bg-slate-600 rounded w-64 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-600 rounded" />)}
        </div>
      </div>
    );
  }

  const pending = suggestions.filter(s => s.status === "PENDING_APPROVAL");
  const approved = suggestions.filter(s => s.status === "APPROVED");
  const published = suggestions.filter(s => s.status === "PUBLISHED");

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <h2 className="text-white font-bold text-lg tracking-wide">TRUST & CONVERSION ENGINE</h2>
          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-bold">
            V1 — ÉTICO
          </span>
        </div>
        <div className="flex items-center gap-2">
          {actionMsg && (
            <span className="text-xs text-green-400 bg-green-900 px-2 py-0.5 rounded">{actionMsg}</span>
          )}
          <button
            onClick={() => doAction("/api/internal/trust-conversion/detect", "POST", "Detección ejecutada")}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Detectar ahora
          </button>
          <button onClick={fetchData} disabled={refreshing} className="text-gray-400 hover:text-white disabled:opacity-50 p-1">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-slate-600">
        <button
          onClick={() => setSelectedTab("pending")}
          className={`px-4 py-2 text-xs font-bold ${selectedTab === "pending" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
        >
          ⏳ PENDIENTES ({pending.length})
        </button>
        <button
          onClick={() => setSelectedTab("metrics")}
          className={`px-4 py-2 text-xs font-bold ${selectedTab === "metrics" ? "text-green-400 border-b-2 border-green-400" : "text-gray-400"}`}
        >
          📊 MÉTRICAS
        </button>
        <button
          onClick={() => setSelectedTab("history")}
          className={`px-4 py-2 text-xs font-bold ${selectedTab === "history" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
        >
          📈 HISTORIAL
        </button>
      </div>

      {/* TAB: PENDIENTES */}
      {selectedTab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay sugerencias pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((sugg) => (
                <div key={sugg.suggestion_id} className="bg-slate-800 rounded p-4 border border-slate-600">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-gray-400">Tipo de momento</div>
                      <div className="text-sm font-bold text-yellow-400">
                        {(sugg.metadata?.moment_type as string) || "Desconocido"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Confianza</div>
                      <div className={`text-sm font-bold ${sugg.confidence > 70 ? "text-green-400" : sugg.confidence > 50 ? "text-yellow-400" : "text-orange-400"}`}>
                        {sugg.confidence.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-300 bg-slate-700 rounded p-2 my-3 line-clamp-3">
                    {sugg.message_body}
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    Producto: <span className="text-blue-400 font-bold">{sugg.product}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => doAction(`/api/internal/trust-conversion/suggestions/${sugg.suggestion_id}/approve`, "POST", `✓ Aprobado`)}
                      className="flex-1 text-xs px-2 py-1.5 rounded bg-green-700 text-white hover:bg-green-600 flex items-center justify-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => doAction(`/api/internal/trust-conversion/suggestions/${sugg.suggestion_id}/cancel`, "POST", `✗ Cancelado`)}
                      className="flex-1 text-xs px-2 py-1.5 rounded bg-red-700 text-white hover:bg-red-600 flex items-center justify-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => setInspecting(sugg)}
                      className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-600 text-white hover:bg-slate-500"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approved.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-600">
              <div className="text-xs text-gray-400 font-bold mb-3">APROBADAS - LISTAS PARA PUBLICAR ({approved.length})</div>
              <div className="space-y-2">
                {approved.map((sugg) => (
                  <div key={sugg.suggestion_id} className="bg-slate-800 rounded p-3 border border-green-600 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-green-400">{sugg.message_preview}</div>
                    </div>
                    <button
                      onClick={() => doAction(`/api/internal/trust-conversion/suggestions/${sugg.suggestion_id}/publish`, "POST", `📤 Publicado`)}
                      className="text-xs px-3 py-1 rounded bg-green-700 text-white hover:bg-green-600 flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Publicar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MÉTRICAS */}
      {selectedTab === "metrics" && metrics && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Total publicadas</div>
              <div className="text-2xl font-bold text-white">{metrics.moments_published}</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Clics totales</div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.total_clicks}</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Registros</div>
              <div className="text-2xl font-bold text-green-400">{metrics.total_registrations}</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Conversiones</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.total_conversions}</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">CTR</div>
              <div className="text-2xl font-bold text-white">{metrics.ctr.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Tasa registro</div>
              <div className="text-2xl font-bold text-white">{metrics.registration_rate.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Tasa conversión</div>
              <div className="text-2xl font-bold text-white">{metrics.conversion_rate.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400">Ingresos / pub</div>
              <div className="text-2xl font-bold text-green-400">${metrics.revenue_per_publication.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400 font-bold mb-2">TOP PRODUCTOS</div>
              {Object.entries(metrics.by_product).map(([product, data]) => (
                <div key={product} className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>{product}</span>
                  <span className="text-green-400">{data.conversions} conv</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-gray-400 font-bold mb-2">MOMENTOS MÁS EFECTIVOS</div>
              {Object.entries(metrics.by_moment_type).map(([type, data]) => (
                <div key={type} className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>{type}</span>
                  <span className="text-yellow-400">{data.conversions} conv / {data.suggestions} sugg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: HISTORIAL */}
      {selectedTab === "history" && (
        <div>
          <div className="text-xs text-gray-400 mb-3">Últimas sugerencias publicadas</div>
          {published.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Sin historial de publicaciones</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {published.slice(-20).reverse().map((sugg) => (
                <div key={sugg.suggestion_id} className="bg-slate-800 rounded p-3 border border-slate-600 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-blue-400 font-bold">{sugg.product}</span>
                    <span className="text-gray-500">
                      {new Date(sugg.published_at || sugg.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                  <div className="text-gray-300 mb-2">{sugg.message_preview}</div>
                  <div className="flex gap-4 text-gray-400">
                    <span>🖱️ {sugg.clicks} clics</span>
                    <span>📝 {sugg.registrations} registros</span>
                    <span>💳 {sugg.payments} pagos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal inspeccionar */}
      {inspecting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setInspecting(null)}>
          <div
            className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Detalles de Sugerencia</h3>
              <button onClick={() => setInspecting(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(inspecting, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>🔒 SUGERENCIAS MANUALES — Admin revisa y aprueba antes de publicar</span>
        <span>{new Date().toLocaleTimeString("es-MX")}</span>
      </div>
    </div>
  );
}
