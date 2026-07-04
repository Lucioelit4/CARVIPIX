'use client';

/**
 * Panel privado de backtesting para admin
 * NO exponer al cliente
 * Visible solo en contexto administrativo
 */

import React, { useState, useEffect } from 'react';
import { BacktestConfig, BacktestResult, BacktestMetrics, BacktestStatus } from '@/app/engine/types/backtesting';
import { Asset, Timeframe } from '@/app/engine/types/marketData';

export interface BacktestPanelProps {
  isPrivate?: boolean; // Asegurar que es privado
  onClose?: () => void;
}

export function BacktestPanel({ isPrivate = true, onClose }: BacktestPanelProps) {
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    asset: 'EURUSD',
    timeframe: '1H',
    initialBalance: 10000,
    riskPerTrade: 2,
    maxDrawdown: 30,
    minWinRate: 45,
    consensusThreshold: 9,
    includeSlippage: false,
    slippagePoints: 0,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [status, setStatus] = useState<BacktestStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Solo para admin
  if (!isPrivate) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-500 font-bold">⚠️ Acceso denegado: Este panel es privado para admin</p>
      </div>
    );
  }

  const handleStartBacktest = async () => {
    setLoading(true);
    setErrors([]);

    try {
      // Simulación del backtest
      // En producción, llamar a API endpoint /api/admin/backtest
      const mockResult: BacktestResult = {
        id: `backtest_${Date.now()}`,
        config: config as BacktestConfig,
        trades: [],
        metrics: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          lossRate: 0,
          totalProfit: 0,
          totalLoss: 0,
          netProfit: 0,
          grossProfit: 0,
          profitFactor: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          maxDrawdown: 0,
          drawdownDuration: 0,
          currentDrawdown: 0,
          maxConsecutiveWins: 0,
          maxConsecutiveLosses: 0,
          averageRiskReward: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          profitability: 0,
          expectancy: 0,
          expectancyPercent: 0,
          finalBalance: config.initialBalance || 0,
          balanceGrowth: 0,
          returnOnInitialCapital: 0,
          averageConsensusScore: 0,
          consensusApprovalRate: 0,
          rejectedSignals: 0,
          totalSignalsProcessed: 0,
          avgWinSize: 0,
          avgLossSize: 0,
          payoffIndex: 0,
          recoveryFactor: 0,
          riskPerTradeCapital: 0,
          tradesWithValidSL: 0,
          tradesWithValidTP: 0,
          tradesWithProperRiskRatio: 0,
        },
        status: 'success',
        errors: [],
        warnings: [],
        completedAt: Date.now(),
        duration: 0,
      };

      setResult(mockResult);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error en backtesting']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-6 text-slate-100">
      {/* Header privado */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white">🔒 Panel Privado de Backtesting</h2>
          <p className="text-xs text-slate-400 mt-1">Uso exclusivo: Admin - Datos confidenciales</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Configuración */}
      <div className="bg-slate-800 rounded p-4 mb-6 space-y-4">
        <h3 className="font-bold text-slate-200">Configuración del Backtest</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400">Activo</label>
            <select
              value={config.asset || ''}
              onChange={(e) => setConfig({ ...config, asset: e.target.value as Asset })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="XAUUSD">XAUUSD (Oro)</option>
              <option value="EURUSD">EURUSD (Euro)</option>
              <option value="GBPUSD">GBPUSD (Libra)</option>
              <option value="BTCUSD">BTCUSD (Bitcoin)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Timeframe</label>
            <select
              value={config.timeframe || ''}
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as Timeframe })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="1H">1H</option>
              <option value="45M">45M</option>
              <option value="5M">5M</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Capital Inicial ($)</label>
            <input
              type="number"
              value={config.initialBalance || 0}
              onChange={(e) => setConfig({ ...config, initialBalance: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Riesgo por Trade (%)</label>
            <input
              type="number"
              value={config.riskPerTrade || 0}
              onChange={(e) => setConfig({ ...config, riskPerTrade: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Max Drawdown (%)</label>
            <input
              type="number"
              value={config.maxDrawdown || 0}
              onChange={(e) => setConfig({ ...config, maxDrawdown: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Umbral Consenso (agentes)</label>
            <input
              type="number"
              value={config.consensusThreshold || 0}
              onChange={(e) => setConfig({ ...config, consensusThreshold: parseInt(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="slippage"
            checked={config.includeSlippage || false}
            onChange={(e) => setConfig({ ...config, includeSlippage: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="slippage" className="text-sm text-slate-300">
            Incluir deslizamiento ({config.slippagePoints || 0} puntos)
          </label>
        </div>

        <button
          onClick={handleStartBacktest}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 rounded"
        >
          {loading ? '⏳ Ejecutando...' : '▶️ Iniciar Backtest'}
        </button>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500 rounded p-3 mb-4">
          <h4 className="font-bold text-red-400 mb-2">Errores:</h4>
          <ul className="text-sm text-red-300 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="space-y-4">
          {/* Métricas principales */}
          <div className="bg-slate-800 rounded p-4">
            <h3 className="font-bold text-slate-200 mb-3">📊 Métricas Principales</h3>
            <div className="grid grid-cols-3 gap-4">
              <MetricBox label="Trades Totales" value={result.metrics.totalTrades.toString()} />
              <MetricBox
                label="Win Rate"
                value={`${result.metrics.winRate.toFixed(1)}%`}
                color={result.metrics.winRate > 50 ? 'green' : 'red'}
              />
              <MetricBox
                label="Profit Factor"
                value={result.metrics.profitFactor.toFixed(2)}
                color={result.metrics.profitFactor > 1.5 ? 'green' : 'orange'}
              />
              <MetricBox
                label="Drawdown Max"
                value={`${result.metrics.maxDrawdown.toFixed(1)}%`}
                color={result.metrics.maxDrawdown < 20 ? 'green' : 'red'}
              />
              <MetricBox
                label="Net Profit"
                value={`$${result.metrics.netProfit.toFixed(2)}`}
                color={result.metrics.netProfit > 0 ? 'green' : 'red'}
              />
              <MetricBox
                label="RR Promedio"
                value={result.metrics.averageRiskReward.toFixed(2)}
                color={result.metrics.averageRiskReward > 1.5 ? 'green' : 'orange'}
              />
            </div>
          </div>

          {/* Recomendación */}
          <RecommendationBox metrics={result.metrics} />

          {/* Tabla de trades */}
          {result.trades.length > 0 && (
            <TradesTable trades={result.trades} />
          )}

          {/* Advertencias */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded p-3">
              <h4 className="font-bold text-yellow-400 mb-2">⚠️ Advertencias ({result.warnings.length}):</h4>
              <ul className="text-sm text-yellow-300 space-y-1">
                {result.warnings.slice(0, 5).map((w, i) => (
                  <li key={i}>• {w.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores críticos */}
          {result.errors.filter((e) => e.severity === 'critical').length > 0 && (
            <div className="bg-red-900/20 border border-red-600 rounded p-3">
              <h4 className="font-bold text-red-400 mb-2">🔴 Errores Críticos:</h4>
              <ul className="text-sm text-red-300 space-y-1">
                {result.errors
                  .filter((e) => e.severity === 'critical')
                  .map((e, i) => (
                    <li key={i}>• {e.message}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para mostrar una métrica
 */
interface MetricBoxProps {
  label: string;
  value: string;
  color?: 'green' | 'red' | 'orange' | 'blue';
}

function MetricBox({ label, value, color = 'blue' }: MetricBoxProps) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
  };

  return (
    <div className="bg-slate-700 rounded p-3 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

/**
 * Componente de recomendación
 */
interface RecommendationBoxProps {
  metrics: BacktestMetrics;
}

function RecommendationBox({ metrics }: RecommendationBoxProps) {
  let recommendation = 'NO RECOMENDADO';
  let color = 'red';
  let icon = '🔴';

  if (metrics.winRate > 55 && metrics.profitFactor > 1.5 && metrics.maxDrawdown < 20) {
    recommendation = 'LISTO PARA AUTOBOT';
    color = 'green';
    icon = '🟢';
  } else if (metrics.winRate > 45 && metrics.profitFactor > 1.2) {
    recommendation = 'REQUIERE OPTIMIZACIÓN';
    color = 'orange';
    icon = '🟡';
  }

  const colorMap: Record<string, string> = {
    green: 'bg-green-900/20 border-green-600 text-green-400',
    orange: 'bg-orange-900/20 border-orange-600 text-orange-400',
    red: 'bg-red-900/20 border-red-600 text-red-400',
  };

  return (
    <div className={`border rounded p-4 ${colorMap[color]}`}>
      <p className="font-bold text-lg">
        {icon} {recommendation}
      </p>
      <p className="text-sm mt-2">
        Confianza: {Math.min(100, metrics.winRate + metrics.profitFactor * 20).toFixed(0)}%
      </p>
    </div>
  );
}

/**
 * Tabla de trades
 */
interface TradesTableProps {
  trades: any[];
}

function TradesTable({ trades }: TradesTableProps) {
  const displayTrades = trades.slice(0, 10);

  return (
    <div className="bg-slate-800 rounded p-4">
      <h3 className="font-bold text-slate-200 mb-3">📋 Últimos Trades Simulados</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-2 py-2 text-slate-400">Entrada</th>
              <th className="px-2 py-2 text-slate-400">Dir</th>
              <th className="px-2 py-2 text-slate-400">Cantidad</th>
              <th className="px-2 py-2 text-slate-400">SL</th>
              <th className="px-2 py-2 text-slate-400">TP</th>
              <th className="px-2 py-2 text-slate-400">RR</th>
              <th className="px-2 py-2 text-slate-400">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {displayTrades.map((trade, i) => (
              <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-2 py-2">${trade.entryPrice?.toFixed(2)}</td>
                <td className="px-2 py-2">{trade.direction === 'long' ? '📈' : '📉'}</td>
                <td className="px-2 py-2">{trade.quantity?.toFixed(2)}</td>
                <td className="px-2 py-2">${trade.stopLoss?.toFixed(2)}</td>
                <td className="px-2 py-2">${trade.takeProfit?.toFixed(2)}</td>
                <td className="px-2 py-2">{trade.riskReward?.toFixed(2)}</td>
                <td className={`px-2 py-2 font-bold ${trade.isWinning ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.isWinning ? '+' : '-'}${Math.abs(trade.profit || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
