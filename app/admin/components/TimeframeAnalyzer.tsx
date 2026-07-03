/**
 * TimeframeAnalyzer Component - Panel de análisis multi-timeframe
 * Muestra estadísticas de conversión de timeframes
 * Panel privado admin only
 */

'use client';

import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { Timeframe } from '../../engine/types/marketData';
import {
  MultiTimeframeResult,
  getTimeframeComparison,
  generateQualityReport,
} from '../../engine/backtesting/timeframeConverter';

interface TimeframeAnalyzerProps {
  result: MultiTimeframeResult | null;
  isLoading?: boolean;
}

export default function TimeframeAnalyzer({ result, isLoading = false }: TimeframeAnalyzerProps) {
  if (!result) {
    return null;
  }

  const comparison = getTimeframeComparison(result);
  const report = generateQualityReport(result);

  return (
    <div className="space-y-4">
      {/* Resumen de conversión */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
          <h4 className="font-bold text-white">📊 Análisis Multi-Timeframe</h4>
        </div>

        {/* Tabla comparativa */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left px-3 py-2 text-slate-300 font-medium">Timeframe</th>
                <th className="text-right px-3 py-2 text-slate-300 font-medium">Candles</th>
                <th className="text-right px-3 py-2 text-slate-300 font-medium">Calidad</th>
                <th className="text-right px-3 py-2 text-slate-300 font-medium">Comprensión</th>
                <th className="text-right px-3 py-2 text-slate-300 font-medium">Issues</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((item, idx) => {
                const isOriginal = item.compressionRatio === 1;
                const qualityColor = item.quality >= 95 ? 'text-green-400' : item.quality >= 80 ? 'text-yellow-400' : 'text-red-400';

                return (
                  <tr
                    key={item.timeframe}
                    className={`border-b border-slate-700/50 ${isOriginal ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'}`}
                  >
                    <td className="px-3 py-2 text-slate-300 font-medium">
                      {item.timeframe}
                      {isOriginal && <span className="text-xs text-slate-400 ml-2">(original)</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">{item.candles.toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${qualityColor}`}>{item.quality}%</td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {item.compressionRatio === 1 ? '—' : `${item.compressionRatio}x`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.issues === 0 ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-yellow-400 text-xs font-bold">{item.issues}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detalles de calidad */}
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
          <h5 className="font-semibold text-slate-200 text-xs md:text-sm">📋 Detalles por Timeframe:</h5>

          {Object.entries(result.quality).map(([timeframe, quality]) => (
            <div key={timeframe} className="bg-slate-700/20 rounded p-3 text-xs md:text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-200">{timeframe}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    quality.dataQuality >= 95
                      ? 'bg-green-900/50 text-green-300'
                      : quality.dataQuality >= 80
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {quality.dataQuality}%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-400 text-xs mb-2">
                <div>
                  <span className="text-slate-500">Total:</span> {quality.totalCandles}
                </div>
                <div>
                  <span className="text-slate-500">Completos:</span> {quality.completeCandles}
                </div>
                <div>
                  <span className="text-slate-500">Incompletos:</span> {quality.incompleteCandles}
                </div>
                <div>
                  <span className="text-slate-500">Gaps:</span> {quality.gapsDetected}
                </div>
              </div>

              {quality.issues.length > 0 && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-300 text-xs">
                    {quality.issues.map((issue, i) => (
                      <div key={i}>• {issue}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rango de datos */}
        <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-700/30 rounded p-2">
            <p className="text-slate-500 text-xs mb-1">Inicio</p>
            <p className="text-slate-200 font-mono text-xs">
              {new Date(result.original.startTime).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-700/30 rounded p-2">
            <p className="text-slate-500 text-xs mb-1">Fin</p>
            <p className="text-slate-200 font-mono text-xs">
              {new Date(result.original.endTime).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Reporte detallado */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h4 className="font-bold text-white text-sm md:text-base mb-3">📄 Reporte Detallado</h4>
        <pre className="bg-slate-900/50 border border-slate-700 rounded p-3 overflow-x-auto text-xs text-slate-300 font-mono">
          {report}
        </pre>
      </div>

      {/* Info privada */}
      <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-3 text-xs text-blue-300">
        🔒 <strong>Panel Privado Admin:</strong> Este análisis multi-timeframe es solo para evaluación interna.
        Los datos convertidos no se exponen al cliente. Usado solo para backtesting avanzado.
      </div>
    </div>
  );
}
