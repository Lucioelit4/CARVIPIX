'use client';

/**
 * Ejecutor de Backtests Demo - Panel Privado Admin
 * Interfaz para ejecutar simulaciones con el motor de backtesting
 * Totalmente privada, no expone nada al cliente
 */

import React, { useState, useMemo } from 'react';
import {
  Play,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  DollarSign,
  Percent,
  ChevronDown,
  Database,
  Calendar,
} from 'lucide-react';
import { Asset, Timeframe, Candle } from '../../engine/types/marketData';
import {
  runDemoBacktest,
  validateBacktestParams,
  getDefaultParams,
  DemoBacktestParams,
  DemoBacktestExecution,
} from '../../engine/backtesting/runBacktest';
import CSVDataLoader from './CSVDataLoader';
import LargeFileDataLoader from './LargeFileDataLoader';

type TradeType = 'BUY' | 'SELL';

export default function BacktestExecutor() {
  // Parámetros de control
  const [asset, setAsset] = useState<Asset>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [balance, setBalance] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [minConsensus, setMinConsensus] = useState(7);
  const [daysBack, setDaysBack] = useState(30);

  // Datos CSV
  const [csvCandles, setCSVCandles] = useState<Candle[] | undefined>(undefined);
  const [csvError, setCSVError] = useState<string>('');

  // Metadatos del dataset
  const datasetInfo = useMemo(() => {
    if (!csvCandles || csvCandles.length === 0) {
      return null;
    }
    const sortedByTime = [...csvCandles].sort((a, b) => a.timestamp - b.timestamp);
    return {
      count: csvCandles.length,
      startDate: new Date(sortedByTime[0].timestamp),
      endDate: new Date(sortedByTime[sortedByTime.length - 1].timestamp),
      asset: csvCandles[0].asset,
      timeframe: csvCandles[0].timeframe,
    };
  }, [csvCandles]);

  // Estado de ejecución
  const [execution, setExecution] = useState<DemoBacktestExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Interfaz
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);

  const assets: Asset[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'];
  const timeframes: Timeframe[] = ['5M', '45M', '1H'];

  // Precargar valores por defecto
  const handleAssetChange = (newAsset: Asset) => {
    setAsset(newAsset);
    const defaults = getDefaultParams(newAsset);
    setBalance(defaults.balance);
    setRiskPerTrade(defaults.risk);
    setMinConsensus(defaults.consensus);
  };

  // Ejecutar backtest
  const handleRunBacktest = async () => {
    // Validar
    const validation = validateBacktestParams({
      asset,
      timeframe,
      initialBalance: balance,
      riskPerTrade,
      minConsensus,
      daysBack,
      csvCandles, // Pasar datos CSV si están disponibles
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setIsRunning(true);
    setExecution(null);

    // Ejecutar backtest con callback de progreso
    const result = await runDemoBacktest(
      {
        asset,
        timeframe,
        initialBalance: balance,
        riskPerTrade,
        minConsensus,
        daysBack,
        csvCandles, // Pasar datos CSV al backtesting
      },
      (exec) => {
        setExecution(exec);
      }
    );

    setIsRunning(false);
    setExecution(result);
  };

  const result = execution?.result;
  const metrics = result?.metrics;

  // Advertencias
  const warnings: { type: string; message: string; severity: 'warning' | 'error' | 'info' }[] = [];
  
  // Agregar advertencias del engine
  if (result?.warnings && result.warnings.length > 0) {
    result.warnings.forEach((w) => {
      warnings.push({
        type: w.type.replace(/_/g, ' ').charAt(0).toUpperCase() + w.type.replace(/_/g, ' ').slice(1),
        message: w.message,
        severity: w.severity,
      });
    });
  }
  
  if (metrics) {
    if (metrics.totalTrades < 10) {
      warnings.push({
        type: 'Pocos trades',
        message: `Solo ${metrics.totalTrades} trades ejecutados. Puede haber insuficientes datos.`,
        severity: 'warning',
      });
    }
    if (metrics.winRate < 40) {
      warnings.push({
        type: 'Win rate bajo',
        message: `Win rate de ${metrics.winRate.toFixed(1)}% es muy bajo. La estrategia puede no ser rentable.`,
        severity: 'error',
      });
    }
    if (metrics.maxDrawdown > 30) {
      warnings.push({
        type: 'Drawdown alto',
        message: `Drawdown máximo de ${metrics.maxDrawdown.toFixed(1)}% es muy alto. Riesgo significativo.`,
        severity: 'error',
      });
    }
    if (metrics.totalTrades > 0 && metrics.winRate > 80) {
      warnings.push({
        type: 'Posible sobreajuste',
        message: `Win rate muy alto (${metrics.winRate.toFixed(1)}%). Verificar si hay sobreajuste de parámetros.`,
        severity: 'warning',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Cargador de Datos CSV - Small Files */}
      <CSVDataLoader
        asset={asset}
        timeframe={timeframe}
        onDataLoaded={(candles) => {
          setCSVCandles(candles);
          setCSVError('');
        }}
        onError={(error) => {
          setCSVError(error);
          setCSVCandles(undefined);
        }}
        isLoading={isRunning}
      />

      {/* Cargador de Datos CSV - Large Files */}
      <LargeFileDataLoader
        asset={asset}
        timeframe={timeframe}
        onDataLoaded={(candles) => {
          setCSVCandles(candles);
          setCSVError('');
        }}
        onError={(error) => {
          setCSVError(error);
          setCSVCandles(undefined);
        }}
      />

      {/* Indicador de Datos Reales vs Demo */}
      {datasetInfo ? (
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-600/60 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Database className="w-6 h-6 text-emerald-400 mt-1" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-emerald-300 mb-2">📊 Datos Reales Cargados</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-slate-400">Velas</p>
                  <p className="text-emerald-200 font-semibold">{datasetInfo.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Activo</p>
                  <p className="text-emerald-200 font-semibold">{datasetInfo.asset}</p>
                </div>
                <div>
                  <p className="text-slate-400">Timeframe</p>
                  <p className="text-emerald-200 font-semibold">{datasetInfo.timeframe}</p>
                </div>
                <div>
                  <p className="text-slate-400">Período</p>
                  <p className="text-emerald-200 font-semibold text-xs">
                    {datasetInfo.startDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} -
                    {datasetInfo.endDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-slate-300">Se usarán datos demo generados localmente (últimos 30 días)</p>
              <p className="text-slate-500 text-sm mt-1">Carga un archivo CSV para usar datos reales HistData</p>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Controles */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">🎮 Parámetros Demo</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Activo</label>
            <select
              value={asset}
              onChange={(e) => handleAssetChange(e.target.value as Asset)}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
            >
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
            >
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capital Inicial</label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                disabled={isRunning}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Riesgo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Riesgo por Trade</label>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                disabled={isRunning}
                step="0.1"
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Consenso */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Consenso Mínimo</label>
            <input
              type="number"
              value={minConsensus}
              onChange={(e) => setMinConsensus(Number(e.target.value))}
              disabled={isRunning}
              min="5"
              max="10"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
            />
          </div>

          {/* Días */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Días a Analizar</label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                disabled={isRunning || !!datasetInfo}
                min="7"
                max="365"
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
              />
            </div>
            {datasetInfo && <p className="text-xs text-slate-400 mt-1">Rango definido por dataset importado</p>}
          </div>
        </div>

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <div className="bg-red-900/30 border border-red-600/50 rounded p-4">
            <p className="text-red-300 text-sm font-medium mb-2">Errores de validación:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i} className="text-red-300 text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón ejecutar */}
        <button
          onClick={handleRunBacktest}
          disabled={isRunning}
          className={`w-full py-3 rounded font-bold text-white transition flex items-center justify-center gap-2 ${
            isRunning
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-[#E8C74A] hover:to-yellow-600'
          }`}
        >
          <Play className="w-5 h-5" />
          {isRunning ? 'Ejecutando...' : 'Ejecutar Demo Backtest'}
        </button>
      </div>

      {/* Barra de Progreso */}
      {execution && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Progreso</span>
            <span className="text-sm text-slate-400">{execution.progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#D4AF37] to-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${execution.progress}%` }}
            />
          </div>
          {execution.executionTime && (
            <p className="text-xs text-slate-400 mt-2">
              Tiempo total: {(execution.executionTime / 1000).toFixed(2)}s
            </p>
          )}
        </div>
      )}

      {/* Resultados */}
      {execution?.status === 'completed' && metrics && (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-white">{metrics.totalTrades}</p>
              <p className="text-xs text-slate-400 mt-1">
                {metrics.winningTrades}W / {metrics.losingTrades}L
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Win Rate</p>
              <p
                className={`text-2xl font-bold ${
                  metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {metrics.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Profit Factor: {metrics.profitFactor.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Balance Final</p>
              <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(balance + metrics.netProfit).toFixed(0)}
              </p>
              <p className={`text-xs mt-1 ${metrics.netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Max Drawdown</p>
              <p className={`text-2xl font-bold ${metrics.maxDrawdown <= 20 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.maxDrawdown.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Recovery Factor: {metrics.recoveryFactor.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Métricas detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="font-bold text-slate-200 mb-3">📊 Ganancia/Pérdida</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ganancia Total</span>
                  <span className="text-green-400 font-bold">${metrics.totalProfit.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pérdida Total</span>
                  <span className="text-red-400 font-bold">-${metrics.totalLoss.toFixed(0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-600 pt-2">
                  <span className="text-slate-300 font-medium">Ganancia Neta</span>
                  <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="font-bold text-slate-200 mb-3">📈 Promedio por Trade</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Promedio</span>
                  <span className="text-green-400 font-bold">${metrics.averageWin.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Loss Promedio</span>
                  <span className="text-red-400 font-bold">-${metrics.averageLoss.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Larger Win</span>
                  <span className="text-green-400 font-bold">${metrics.largestWin.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Larger Loss</span>
                  <span className="text-red-400 font-bold">-${metrics.largestLoss.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="font-bold text-slate-200 mb-3">🎯 Ratios & Calidad</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Risk/Reward</span>
                  <span className="text-slate-200 font-bold">{metrics.averageRiskReward.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sharpe Ratio</span>
                  <span className="text-slate-200 font-bold">{metrics.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sortino Ratio</span>
                  <span className="text-slate-200 font-bold">{metrics.sortinoRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consenso Prom.</span>
                  <span className="text-slate-200 font-bold">{metrics.averageConsensusScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Dataset Utilizado */}
          {datasetInfo && (
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
              <p className="text-emerald-300 text-sm font-semibold mb-2">
                ✅ Backtest ejecutado con {datasetInfo.count.toLocaleString()} velas reales de HistData
              </p>
              <p className="text-slate-300 text-xs">
                {datasetInfo.asset} {datasetInfo.timeframe} | {datasetInfo.startDate.toLocaleDateString('es-ES')} a{' '}
                {datasetInfo.endDate.toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
          {!datasetInfo && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-300 text-sm">
                📊 Backtest ejecutado con datos demo generados (últimos 30 días)
              </p>
            </div>
          )}

          {/* Advertencias */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  {warnings.length} Advertencia{warnings.length > 1 ? 's' : ''} Detectadas
                </span>
                <ChevronDown className={`w-4 h-4 transition ${showWarnings ? 'rotate-180' : ''}`} />
              </button>

              {showWarnings && (
                <div className="space-y-2">
                  {warnings.map((warning, i) => (
                    <div
                      key={i}
                      className={`border-l-4 p-3 rounded ${
                        warning.severity === 'error'
                          ? 'bg-red-900/20 border-red-600'
                          : 'bg-yellow-900/20 border-yellow-600'
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{warning.type}</p>
                      <p
                        className={`text-xs mt-1 ${
                          warning.severity === 'error' ? 'text-red-300' : 'text-yellow-300'
                        }`}
                      >
                        {warning.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabla de Trades */}
          {result?.trades && result.trades.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h4 className="font-bold text-white">📋 Trades Simulados ({result.trades.length})</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50 border-b border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">#</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Entrada</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Tipo</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">Price</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">SL</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">TP</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">P&L</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">RR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition ${
                          i % 2 === 0 ? 'bg-slate-800/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {new Date(trade.entryTime).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.direction === 'long'
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}
                          >
                            {trade.direction === 'long' ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {trade.entryPrice.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          {trade.stopLoss.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">
                          {trade.takeProfit.toFixed(4)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          trade.isWinning ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.isWinning ? '+' : ''}{trade.profit.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {(trade.riskReward || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Estado de error */}
      {execution?.status === 'error' && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
          <p className="text-red-300 font-bold mb-2">❌ Error en la ejecución</p>
          <p className="text-red-200 text-sm">{execution.error}</p>
        </div>
      )}

      {/* Info privada */}
      <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          🔒 <strong>Panel Privado Admin:</strong> Estos datos son simulaciones demo completamente locales
          en el navegador. No se realiza ninguna operación real. Los resultados no están validados contra
          datos históricos reales. Usar solo para análisis conceptual del motor.
        </p>
      </div>
    </div>
  );
}
