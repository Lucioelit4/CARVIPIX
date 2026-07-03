'use client';

/**
 * Panel de Diagnóstico de Señales - Privado Admin
 * Muestra análisis de por qué se rechazan señales
 */

import React from 'react';
import { AlertTriangle, TrendingDown, BarChart3, Users, Lock } from 'lucide-react';
import { SignalDiagnostics } from '../../engine/types/backtesting';

interface SignalDiagnosticsPanelProps {
  diagnostics: SignalDiagnostics | undefined;
  authorizeLargeTest: boolean;
  onAuthorizeLargeTest: (authorized: boolean) => void;
}

export default function SignalDiagnosticsPanel({
  diagnostics,
  authorizeLargeTest,
  onAuthorizeLargeTest,
}: SignalDiagnosticsPanelProps) {
  if (!diagnostics) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Sin diagnósticos disponibles. Ejecute un backtest primero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nota de autorización */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Lock size={16} className="text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-blue-900">Prueba grande desactivada por defecto</p>
          <p className="text-xs text-blue-800">
            Para probar archivos &gt;438k velas (ej. 354k 2025), requiere autorización explícita.
          </p>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={authorizeLargeTest}
              onChange={(e) => onAuthorizeLargeTest(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs text-blue-900 font-medium">Autorizar pruebas de datasets grandes</span>
          </label>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">Velas Evaluadas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{diagnostics.candlesEvaluated.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">Señales Candidatas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{diagnostics.candidateSignals.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">Tasa Candidata</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {diagnostics.candlesEvaluated > 0
              ? ((diagnostics.candidateSignals / diagnostics.candlesEvaluated) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 font-medium">Score Promedio</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {diagnostics.scoreDistribution.average.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Top 5 Razones de Rechazo */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-red-600" />
          <h3 className="font-bold text-gray-900">Top 5 Razones de Rechazo</h3>
        </div>
        {diagnostics.top5Rejections.length === 0 ? (
          <p className="text-sm text-gray-600">Sin rechazos registrados</p>
        ) : (
          <div className="space-y-2">
            {diagnostics.top5Rejections.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate">{item.reason}</span>
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distribución de Scores */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-900">Distribución de Scores</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(diagnostics.scoreDistribution.distribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([score, count]) => (
              <div key={score} className="flex flex-col items-center">
                <div className="text-xs font-mono text-gray-600 mb-1">{score}</div>
                <div className="w-full bg-gray-100 rounded-lg flex flex-col-reverse items-center justify-end h-20">
                  <div
                    className="w-full bg-blue-500 rounded-lg transition-all"
                    style={{
                      height: `${(count / Math.max(1, Math.max(...Object.values(diagnostics.scoreDistribution.distribution)))) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{count}</div>
              </div>
            ))}
        </div>
        <div className="mt-3 text-xs text-gray-600 flex justify-between">
          <span>Min: {diagnostics.scoreDistribution.min.toFixed(0)}</span>
          <span>Promedio: {diagnostics.scoreDistribution.average.toFixed(1)}</span>
          <span>Max: {diagnostics.scoreDistribution.max.toFixed(0)}</span>
        </div>
      </div>

      {/* Estadísticas de Agentes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-900">Rendimiento de Agentes (11 Total)</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(diagnostics.agentStats)
            .sort((a, b) => b[1].approved - a[1].approved)
            .map(([agent, stats]) => {
              const total = stats.approved + stats.rejected;
              const approvalRate = total > 0 ? (stats.approved / total) * 100 : 0;
              return (
                <div key={agent} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{agent}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs text-green-700">✓ {stats.approved}</span>
                      <span className="text-xs text-red-700">✗ {stats.rejected}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs font-mono text-gray-700">{approvalRate.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600">Avg: {stats.avgScore.toFixed(0)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Comparación de Consensos */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={18} className="text-purple-600" />
          <h3 className="font-bold text-gray-900">Comparación de Umbrales Consenso</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Trades generados con diferentes umbrales mínimos de agentes aprobados:
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm font-bold text-purple-900">{diagnostics.consensusComparison.consensus9}</p>
            <p className="text-xs text-purple-700">Con 9/11 agentes</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm font-bold text-indigo-900">{diagnostics.consensusComparison.consensus8}</p>
            <p className="text-xs text-indigo-700">Con 8/11 agentes</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-bold text-blue-900">{diagnostics.consensusComparison.consensus7}</p>
            <p className="text-xs text-blue-700">Con 7/11 agentes</p>
          </div>
        </div>
      </div>

      {/* Nota de privacidad y recalibración */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
        <p className="text-xs text-gray-600">
          💡 <strong>Diagnóstico privado:</strong> Estos datos son solo para análisis interno del motor. No se exponen
          al cliente. Utiliza para optimizar filtros sin cambiar configuración oficial.
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          ⚙️ <strong>Recalibración pendiente:</strong> Se recalibrará completamente cuando se programe la estrategia real.
          Los umbrales de consenso y rechazos mostrados aquí son temporales para validar infraestructura.
        </p>
      </div>
    </div>
  );
}
