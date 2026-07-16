"use client";

import { CertificationLogEntry } from "@/app/lib/types/certificationTypes";
import { useState } from "react";

interface CertificationLogProps {
  logs: CertificationLogEntry[];
  isLoading: boolean;
}

export function CertificationLog({ logs, isLoading }: CertificationLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">Esperando ciclos reales del Scheduler...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SKIPPED_BEFORE_AI":
        return "bg-yellow-100 text-yellow-800";
      case "REUSED_PREVIOUS_ANALYSIS":
        return "bg-blue-100 text-blue-800";
      case "AI_ERROR":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDistributionCount = (distribution: CertificationLogEntry["distribution"]): number => {
    return Object.values(distribution).filter((d) => d === "DELIVERED").length;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Tabla principal */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Hora</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Instrumento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Decisión</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">Prob%</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">Costo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">Distribución</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{log.cycle_number}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{log.hour}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{log.instrument}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.cycle_status)}`}>
                    {log.cycle_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{log.decision}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{log.probability}%</td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">${log.cost_usd.toFixed(3)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <span className="font-semibold">{getDistributionCount(log.distribution)}/9</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {expandedId === log.id ? "▼" : "▶"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalles expandibles */}
      {expandedId && logs.find((l) => l.id === expandedId) && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <ExpandedLogDetails log={logs.find((l) => l.id === expandedId)!} />
        </div>
      )}
    </div>
  );
}

function ExpandedLogDetails({ log }: { log: CertificationLogEntry }) {
  return (
    <div className="space-y-6">
      {/* Identificadores */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Identificadores</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">analysis_id:</span>
            <p className="font-mono text-gray-800 break-all">{log.analysis_id}</p>
          </div>
          <div>
            <span className="text-gray-600">signal_id:</span>
            <p className="font-mono text-gray-800 break-all">{log.signal_id}</p>
          </div>
        </div>
      </div>

      {/* Ejecución */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Ejecución</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Trigger:</span>
            <p className="text-gray-800 font-semibold">{log.trigger_reason}</p>
          </div>
          <div>
            <span className="text-gray-600">Duración:</span>
            <p className="text-gray-800">{log.duration_ms}ms</p>
          </div>
          <div>
            <span className="text-gray-600">OpenAI Latencia:</span>
            <p className="text-gray-800">{log.openai_latency_ms}ms</p>
          </div>
          <div>
            <span className="text-gray-600">Tokens:</span>
            <p className="text-gray-800">{log.tokens_used}</p>
          </div>
        </div>
      </div>

      {/* Calidad */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Calidad Expediente</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Completitud:</span>
            <p className="text-gray-800 font-semibold">{log.expediente_quality.completeness}%</p>
          </div>
          <div>
            <span className="text-gray-600">Secciones:</span>
            <p className="text-gray-800">{log.expediente_quality.sections}</p>
          </div>
          <div>
            <span className="text-gray-600">Error:</span>
            <p className="text-gray-800">{log.expediente_quality.has_error ? "Sí" : "No"}</p>
          </div>
        </div>
      </div>

      {/* Distribución (9 destinos) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Distribución (9 Destinos)</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(log.distribution).map(([dest, status]) => (
            <div key={dest} className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  status === "DELIVERED"
                    ? "bg-green-500"
                    : status === "SKIPPED"
                    ? "bg-yellow-500"
                    : status === "FAILED"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-gray-600">{dest}:</span>
              <span className="font-mono text-gray-800">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Paper Account */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Paper Account en Ciclo</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Balance:</span>
            <p className="text-gray-800">${log.paper_state.balance.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-600">Abiertos:</span>
            <p className="text-gray-800">{log.paper_state.open_positions}</p>
          </div>
          <div>
            <span className="text-gray-600">Cerrados:</span>
            <p className="text-gray-800">{log.paper_state.closed_positions}</p>
          </div>
          <div>
            <span className="text-gray-600">P&L:</span>
            <p className="text-gray-800">${log.paper_state.pnl.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-600">Win Rate:</span>
            <p className="text-gray-800">{log.paper_state.win_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Estado Mercado */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Estado Mercado</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Tendencia:</span>
            <p className="text-gray-800">{log.market_state.trend}</p>
          </div>
          <div>
            <span className="text-gray-600">Volatilidad:</span>
            <p className="text-gray-800">{log.market_state.volatility}</p>
          </div>
          <div>
            <span className="text-gray-600">Niveles Clave:</span>
            <p className="text-gray-800">{log.market_state.key_levels.join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
