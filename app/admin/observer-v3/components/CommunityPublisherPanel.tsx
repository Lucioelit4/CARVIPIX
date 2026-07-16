"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Play, Pause, AlertTriangle, CheckCircle, Clock, XCircle, Inbox, Trash2, RotateCcw } from "lucide-react";
import type { Publication, QueueStats } from "@/app/lib/community-publisher/types";

interface QueueData {
  ok: boolean;
  stats: QueueStats;
  queue: Publication[];
  last_event: {
    event_type: string;
    signal_id?: string;
    decision?: string;
    accepted: boolean;
    skip_reason?: string;
    processed_at: string;
  } | null;
  fetched_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-yellow-900 text-yellow-300",
  READY:       "bg-blue-900 text-blue-300",
  DELIVERED:   "bg-green-900 text-green-300",
  FAILED:      "bg-red-900 text-red-300",
  SKIPPED:     "bg-gray-700 text-gray-400",
  DEAD_LETTER: "bg-orange-900 text-orange-300",
  CANCELLED:   "bg-slate-700 text-slate-400",
};

const TYPE_COLORS: Record<string, string> = {
  FREE_ALERT:              "text-green-400",
  TRADE_RESULT:            "text-blue-400",
  MARKET_STATUS:           "text-yellow-400",
  OPPORTUNITY_DEVELOPING:  "text-purple-400",
  EDUCATIONAL_OR_PROMOTIONAL: "text-gray-400",
};

const PRIORITY_LABELS: Record<number, string> = { 1: "🔴", 2: "🟠", 3: "🟡", 4: "🟢", 5: "⚪" };

function StatBadge({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-slate-800 rounded p-3">
      <div className="text-gray-400 text-xs">{label}</div>
      <div className={`text-lg font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function truncateId(id: string): string {
  if (id.length <= 20) return id;
  return id.slice(0, 8) + "…" + id.slice(-6);
}

export function CommunityPublisherPanel() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<Publication | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/internal/community-publisher/queue");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("[CP Panel] fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
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

  const stats = data?.stats;
  const queue = data?.queue ?? [];
  const paused = stats?.paused ?? false;

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-6">
      {/* Header con Estado del Sistema */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-purple-400" />
          <h2 className="text-white font-bold text-lg tracking-wide">COMMUNITY PUBLISHER</h2>
          <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded font-bold">
            V1 — OPERACIONAL
          </span>
          {paused && (
            <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded font-bold animate-pulse">
              ⏸ PAUSADO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actionMsg && (
            <span className="text-xs text-green-400 bg-green-900 px-2 py-0.5 rounded">{actionMsg}</span>
          )}
          <button
            onClick={() => doAction(paused ? "/api/internal/community-publisher/resume" : "/api/internal/community-publisher/pause", "POST", paused ? "Sistema reanudado" : "Sistema pausado")}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded font-bold ${paused ? "bg-green-700 text-white hover:bg-green-600" : "bg-orange-700 text-white hover:bg-orange-600"}`}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "REANUDAR" : "PAUSAR"}
          </button>
          <button onClick={fetchData} disabled={refreshing} className="text-gray-400 hover:text-white disabled:opacity-50 p-1" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* SECCIÓN: Estado del Sistema */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-5">
        <div className="text-xs text-gray-400 font-bold uppercase mb-3">Estado del Sistema</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Bot</div>
            <div className="text-sm text-green-400 font-bold">✓ Conectado</div>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">TEST_ONLY</div>
            <div className="text-sm text-green-400 font-bold">{stats?.test_only ? "ACTIVO" : "OFF"}</div>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">AUTO_SEND</div>
            <div className="text-sm text-red-400 font-bold">{stats?.auto_send ? "ON" : "DESACTIVADO"}</div>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Estado</div>
            <div className={`text-sm font-bold ${paused ? "text-orange-400" : "text-blue-400"}`}>
              {paused ? "⏸ PAUSADO" : "▶ ACTIVO"}
            </div>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Cola</div>
            <div className={`text-sm font-bold ${((stats?.pending ?? 0) + (stats?.ready ?? 0)) > 0 ? "text-yellow-400" : "text-gray-400"}`}>
              {(stats?.pending ?? 0) + (stats?.ready ?? 0)} items
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Límites y Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <StatBadge label="Pendientes" value={stats?.pending ?? 0} highlight={(stats?.pending ?? 0) > 0} />
        <StatBadge label="Listos" value={stats?.ready ?? 0} />
        <StatBadge label="Entregadas" value={stats?.delivered ?? 0} />
        <StatBadge label="Fallidas" value={stats?.failed ?? 0} highlight={(stats?.failed ?? 0) > 0} />
        <StatBadge label="Omitidas" value={stats?.skipped ?? 0} />
        <StatBadge label="Alertas hoy" value={`${stats?.free_alerts_today ?? 0}/${stats?.daily_limit ?? 2}`} highlight={(stats?.free_alerts_today ?? 0) >= (stats?.daily_limit ?? 2)} />
      </div>
      {data?.last_event && (
        <div className="bg-slate-800 rounded p-3 mb-5 text-xs">
          <span className="text-gray-400">Último disparador: </span>
          <span className="text-white font-mono">{data.last_event.event_type}</span>
          {data.last_event.decision && (
            <span className="ml-2 text-yellow-400">{data.last_event.decision}</span>
          )}
          <span className={`ml-2 ${data.last_event.accepted ? "text-green-400" : "text-red-400"}`}>
            {data.last_event.accepted ? "✅ Aceptado" : `❌ ${data.last_event.skip_reason}`}
          </span>
          <span className="ml-2 text-gray-500">
            {new Date(data.last_event.processed_at).toLocaleTimeString("es-MX")}
          </span>
          {stats?.last_error && (
            <div className="mt-1 text-red-400">Último error: {stats.last_error}</div>
          )}
        </div>
      )}

      {/* Cola de publicaciones */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-slate-600">
              <th className="text-left py-2 pr-3">ID</th>
              <th className="text-left py-2 pr-3">Tipo</th>
              <th className="text-left py-2 pr-3">Instrumento</th>
              <th className="text-left py-2 pr-3">P</th>
              <th className="text-left py-2 pr-3">Estado</th>
              <th className="text-left py-2 pr-3">Creado</th>
              <th className="text-left py-2 pr-3">Expira</th>
              <th className="text-left py-2 pr-3">Signal</th>
              <th className="text-left py-2 pr-3">Intentos</th>
              <th className="text-left py-2 pr-3">Skip</th>
              <th className="text-left py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 && (
              <tr>
                <td colSpan={11} className="text-gray-500 py-6 text-center">
                  Cola vacía. Envía eventos al disparador para ver publicaciones aquí.
                </td>
              </tr>
            )}
            {queue.map((pub) => (
              <tr key={pub.publication_id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
                <td className="py-2 pr-3 font-mono text-gray-300">{truncateId(pub.publication_id)}</td>
                <td className={`py-2 pr-3 font-bold ${TYPE_COLORS[pub.publication_type] ?? "text-white"}`}>
                  {pub.publication_type.replace(/_/g, " ")}
                </td>
                <td className="py-2 pr-3 text-white">{pub.instrument}</td>
                <td className="py-2 pr-3">{PRIORITY_LABELS[pub.priority] ?? pub.priority}</td>
                <td className="py-2 pr-3">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[pub.status] ?? ""}`}>
                    {pub.status}
                  </span>
                </td>
                <td className="py-2 pr-3 text-gray-400">
                  {new Date(pub.created_at).toLocaleTimeString("es-MX")}
                </td>
                <td className="py-2 pr-3 text-gray-500">
                  {pub.expires_at ? new Date(pub.expires_at).toLocaleTimeString("es-MX") : "—"}
                </td>
                <td className="py-2 pr-3 font-mono text-gray-500">
                  {pub.signal_id ? truncateId(pub.signal_id) : "—"}
                </td>
                <td className="py-2 pr-3 text-gray-400">{pub.attempts}/{pub.max_attempts}</td>
                <td className="py-2 pr-3 text-orange-400">
                  {pub.skip_reason ?? "—"}
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setInspecting(pub)}
                      title="Inspeccionar"
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </button>
                    {pub.status === "FAILED" || pub.status === "DEAD_LETTER" ? (
                      <button
                        onClick={() => doAction(`/api/internal/community-publisher/publications/${pub.publication_id}/retry`, "POST", `Reintentando ${truncateId(pub.publication_id)}`)}
                        title="Reintentar"
                        className="text-yellow-400 hover:text-yellow-300 p-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    ) : null}
                    {pub.status === "PENDING" || pub.status === "READY" ? (
                      <button
                        onClick={() => doAction(`/api/internal/community-publisher/publications/${pub.publication_id}/cancel`, "POST", `Cancelado ${truncateId(pub.publication_id)}`)}
                        title="Cancelar"
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>🔒 AUTO_SEND=false — Nada se envía automáticamente</span>
        <span>{data?.fetched_at ? `Actualizado: ${new Date(data.fetched_at).toLocaleTimeString("es-MX")}` : ""}</span>
      </div>

      {/* Modal inspeccionar */}
      {inspecting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setInspecting(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Detalles de Publicación</h3>
              <button onClick={() => setInspecting(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(inspecting, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
