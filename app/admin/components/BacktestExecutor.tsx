'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Loader2,
  Percent,
  Play,
  RefreshCcw,
  ShieldAlert,
  Sigma,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Asset, Candle, Timeframe } from '../../engine/types/marketData';
import {
  runDemoBacktest,
  validateBacktestParams,
  getDefaultParams,
  DemoBacktestExecution,
} from '../../engine/backtesting/runBacktest';
import CSVDataLoader from './CSVDataLoader';
import LargeFileDataLoader from './LargeFileDataLoader';
import MultiDatasetLoader from './MultiDatasetLoader';
import SignalDiagnosticsPanel from './SignalDiagnosticsPanel';

type LabState = 'no_data' | 'ready' | 'running' | 'error' | 'result';

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getLabState(execution: DemoBacktestExecution | null, candles?: Candle[]): LabState {
  if (execution?.status === 'running') return 'running';
  if (execution?.status === 'error') return 'error';
  if (execution?.status === 'completed') return 'result';
  if (candles && candles.length > 0) return 'ready';
  return 'no_data';
}

function getPhaseLabel(execution: DemoBacktestExecution | null): string {
  switch (execution?.phase) {
    case 'validating_data':
      return 'Validando dataset';
    case 'running_backtest':
      return 'Ejecutando backtest';
    case 'running_monte_carlo':
      return 'Ejecutando Monte Carlo';
    case 'running_walk_forward':
      return 'Ejecutando Walk Forward';
    case 'building_report':
      return 'Construyendo reporte';
    case 'completed':
      return 'Reporte listo';
    case 'error':
      return 'Ejecución fallida';
    default:
      return 'Esperando ejecución';
  }
}

export default function BacktestExecutor() {
  const [asset, setAsset] = useState<Asset>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [balance, setBalance] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [minConsensus, setMinConsensus] = useState(7);
  const [csvCandles, setCSVCandles] = useState<Candle[] | undefined>(undefined);
  const [csvError, setCSVError] = useState('');
  const [multiDatasetInfo, setMultiDatasetInfo] = useState<any>(null);
  const [execution, setExecution] = useState<DemoBacktestExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [authorizeLargeTest, setAuthorizeLargeTest] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);

  const assets: Asset[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'];
  const timeframes: Timeframe[] = ['5M', '45M', '1H'];

  const datasetInfo = useMemo(() => {
    if (!csvCandles || csvCandles.length === 0) return null;

    const sortedByTime = [...csvCandles].sort((left, right) => left.timestamp - right.timestamp);
    return {
      count: sortedByTime.length,
      startDate: new Date(sortedByTime[0].timestamp),
      endDate: new Date(sortedByTime[sortedByTime.length - 1].timestamp),
      asset: sortedByTime[0].asset,
      timeframe: sortedByTime[0].timeframe,
    };
  }, [csvCandles]);

  const result = execution?.result;
  const metrics = result?.metrics;
  const monteCarlo = execution?.analysis?.monteCarlo;
  const walkForward = execution?.analysis?.walkForward;
  const overfitting = execution?.analysis?.overfitting;
  const labState = getLabState(execution, csvCandles);

  const warnings: { type: string; message: string; severity: 'warning' | 'error' | 'info' }[] = [];
  if (result?.warnings) {
    result.warnings.forEach((warning) => {
      warnings.push({
        type: warning.type.replace(/_/g, ' '),
        message: warning.message,
        severity: warning.severity,
      });
    });
  }

  const handleAssetChange = (newAsset: Asset) => {
    setAsset(newAsset);
    const defaults = getDefaultParams(newAsset);
    setBalance(defaults.balance);
    setRiskPerTrade(defaults.risk);
    setMinConsensus(defaults.consensus);
  };

  const resetResults = () => {
    setExecution(null);
    setValidationErrors([]);
    setCSVError('');
  };

  const handleRunBacktest = async () => {
    if (csvCandles && csvCandles.length > 200000 && !authorizeLargeTest) {
      setValidationErrors([
        `Dataset muy grande (${(csvCandles.length / 1000).toFixed(0)}k velas). Autoriza explícitamente el test grande para continuar.`,
      ]);
      return;
    }

    const validation = validateBacktestParams({
      asset,
      timeframe,
      initialBalance: balance,
      riskPerTrade,
      minConsensus,
      csvCandles,
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setCSVError('');
    setExecution(null);
    setIsRunning(true);

    const nextExecution = await runDemoBacktest(
      {
        asset,
        timeframe,
        initialBalance: balance,
        riskPerTrade,
        minConsensus,
        csvCandles,
      },
      (progressExecution) => setExecution(progressExecution)
    );

    setExecution(nextExecution);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Laboratorio de Backtesting Profesional</p>
            <p className="text-xs text-slate-400 mt-1">
              Ejecuta el laboratorio sobre históricos cargados por admin, con validación de datos,
              Monte Carlo y Walk Forward. No usa datos demo como fuente de prueba.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Estado</p>
          <p className="text-lg font-bold text-white capitalize">{labState.replace('_', ' ')}</p>
          <p className="text-xs text-slate-500 mt-1">{getPhaseLabel(execution)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Dataset</p>
          <p className="text-lg font-bold text-white">{datasetInfo ? datasetInfo.count.toLocaleString() : 0}</p>
          <p className="text-xs text-slate-500 mt-1">velas listas</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Calidad</p>
          <p className="text-lg font-bold text-white">{execution?.dataset?.qualityScore ?? '--'}</p>
          <p className="text-xs text-slate-500 mt-1">score de ingestión</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Monte Carlo</p>
          <p className="text-lg font-bold text-white">{monteCarlo?.totalIterations ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">iteraciones</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Walk Forward</p>
          <p className="text-lg font-bold text-white">{walkForward?.completedWindows ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">ventanas</p>
        </div>
      </div>

      <MultiDatasetLoader
        onDataLoaded={(candles, metadata) => {
          setCSVCandles(candles);
          setMultiDatasetInfo(metadata);
          setCSVError('');
          resetResults();
        }}
        onError={(error) => {
          setCSVError(error);
          setCSVCandles(undefined);
          setMultiDatasetInfo(null);
        }}
      />

      <CSVDataLoader
        asset={asset}
        timeframe={timeframe}
        onDataLoaded={(candles) => {
          setCSVCandles(candles);
          setMultiDatasetInfo(null);
          setCSVError('');
          resetResults();
        }}
        onError={(error) => {
          setCSVError(error);
          setCSVCandles(undefined);
        }}
        isLoading={isRunning}
      />

      <LargeFileDataLoader
        asset={asset}
        timeframe={timeframe}
        onDataLoaded={(candles) => {
          setCSVCandles(candles);
          setMultiDatasetInfo(null);
          setCSVError('');
          resetResults();
        }}
        onError={(error) => {
          setCSVError(error);
          setCSVCandles(undefined);
          setMultiDatasetInfo(null);
        }}
      />

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Parámetros del Laboratorio</h3>
            <p className="text-sm text-slate-400">La ejecución solo se habilita cuando hay históricos reales cargados.</p>
          </div>
          <button
            onClick={resetResults}
            disabled={isRunning}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm text-slate-200 flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Limpiar resultado
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Activo</label>
            <select
              value={asset}
              onChange={(event) => handleAssetChange(event.target.value as Asset)}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              {assets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value as Timeframe)}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              {timeframes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capital Inicial</label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={balance}
                onChange={(event) => setBalance(Number(event.target.value))}
                disabled={isRunning}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Riesgo por Trade</label>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.1"
                value={riskPerTrade}
                onChange={(event) => setRiskPerTrade(Number(event.target.value))}
                disabled={isRunning}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Consenso Mínimo</label>
            <input
              type="number"
              min="5"
              max="10"
              value={minConsensus}
              onChange={(event) => setMinConsensus(Number(event.target.value))}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Dataset activo</p>
            <p className="text-sm text-slate-100 font-medium">
              {datasetInfo ? `${datasetInfo.asset} ${datasetInfo.timeframe}` : 'Sin datos cargados'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {datasetInfo
                ? `${datasetInfo.startDate.toLocaleDateString('es-ES')} - ${datasetInfo.endDate.toLocaleDateString('es-ES')}`
                : 'Importa un CSV histórico para habilitar el laboratorio'}
            </p>
          </div>
        </div>

        {csvError && (
          <div className="bg-red-900/30 border border-red-600/50 rounded p-4 text-sm text-red-200">
            {csvError}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-red-900/30 border border-red-600/50 rounded p-4">
            <p className="text-red-300 text-sm font-medium mb-2">Errores de validación</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleRunBacktest}
          disabled={isRunning || !csvCandles || csvCandles.length === 0}
          className={`w-full py-3 rounded font-bold text-white transition flex items-center justify-center gap-2 ${
            isRunning || !csvCandles || csvCandles.length === 0
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-[#E8C74A] hover:to-yellow-600'
          }`}
        >
          {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Ejecutando laboratorio...' : 'Ejecutar Backtest Profesional'}
        </button>
      </div>

      {execution && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{getPhaseLabel(execution)}</span>
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
              Tiempo acumulado: {(execution.executionTime / 1000).toFixed(2)}s
            </p>
          )}
        </div>
      )}

      {execution?.dataset && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-white">Reporte de Ingesta</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Velas limpias</p>
              <p className="text-white font-semibold">{execution.dataset.totalCandles.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Duplicados removidos</p>
              <p className="text-white font-semibold">{execution.dataset.duplicatesRemoved}</p>
            </div>
            <div>
              <p className="text-slate-400">Calidad</p>
              <p className="text-white font-semibold">{execution.dataset.qualityScore}/100</p>
            </div>
            <div>
              <p className="text-slate-400">Rango</p>
              <p className="text-white font-semibold text-xs">
                {new Date(execution.dataset.startTime).toLocaleDateString('es-ES')} - {new Date(execution.dataset.endTime).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          {execution.dataset.warnings.length > 0 && (
            <div className="mt-3 bg-amber-900/20 border border-amber-700/40 rounded p-3 text-xs text-amber-200">
              {execution.dataset.warnings.slice(0, 4).map((warning, index) => (
                <p key={index}>- {warning}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {execution?.status === 'error' && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
          <p className="text-red-300 font-bold mb-2">Ejecución fallida</p>
          <p className="text-red-200 text-sm">{execution.error}</p>
        </div>
      )}

      {execution?.status === 'completed' && metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Trades</p>
              <p className="text-2xl font-bold text-white">{metrics.totalTrades}</p>
              <p className="text-xs text-slate-500 mt-1">{metrics.winningTrades}W / {metrics.losingTrades}L</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Profit Factor</p>
              <p className="text-2xl font-bold text-white">{metrics.profitFactor.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Win rate {formatPercent(metrics.winRate)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Net Profit</p>
              <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatMoney(metrics.netProfit)}</p>
              <p className="text-xs text-slate-500 mt-1">Balance final {formatMoney(metrics.finalBalance)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Max Drawdown</p>
              <p className={`text-2xl font-bold ${metrics.maxDrawdown <= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(metrics.maxDrawdown)}</p>
              <p className="text-xs text-slate-500 mt-1">Recovery {metrics.recoveryFactor.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Expectancy</p>
              <p className="text-2xl font-bold text-white">{formatMoney(metrics.expectancy)}</p>
              <p className="text-xs text-slate-500 mt-1">{formatPercent(metrics.expectancyPercent)} por trade</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400">Sharpe</p>
              <p className="text-2xl font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Sortino {metrics.sortinoRatio.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sigma className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white">Métricas del Backtest</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Ganancia total</span><span className="text-emerald-400">{formatMoney(metrics.totalProfit)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Pérdida total</span><span className="text-red-400">-{formatMoney(metrics.totalLoss).slice(1)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Average win</span><span className="text-white">{formatMoney(metrics.averageWin)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Average loss</span><span className="text-white">{formatMoney(metrics.averageLoss)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Average R:R</span><span className="text-white">{metrics.averageRiskReward.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payoff index</span><span className="text-white">{metrics.payoffIndex.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white">Riesgo y Rachas</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Riesgo nominal medio</span><span className="text-white">{formatMoney(metrics.riskPerTradeCapital)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Current drawdown</span><span className="text-white">{formatPercent(metrics.currentDrawdown)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Duración drawdown</span><span className="text-white">{metrics.drawdownDuration}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Racha máxima ganadora</span><span className="text-white">{metrics.maxConsecutiveWins}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Racha máxima perdedora</span><span className="text-white">{metrics.maxConsecutiveLosses}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Trades con RR correcto</span><span className="text-white">{metrics.tradesWithProperRiskRatio}</span></div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-white">Dataset Ejecutado</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Activo</span><span className="text-white">{asset}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Timeframe</span><span className="text-white">{timeframe}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Velas</span><span className="text-white">{execution?.dataset?.totalCandles.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Inicio</span><span className="text-white text-xs">{execution?.dataset ? new Date(execution.dataset.startTime).toLocaleDateString('es-ES') : '--'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Fin</span><span className="text-white text-xs">{execution?.dataset ? new Date(execution.dataset.endTime).toLocaleDateString('es-ES') : '--'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tiempo total</span><span className="text-white">{execution.executionTime ? `${(execution.executionTime / 1000).toFixed(2)}s` : '--'}</span></div>
              </div>
            </div>
          </div>

          {monteCarlo && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white">Monte Carlo</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-slate-400">Probabilidad de profit</p><p className="text-white font-semibold">{formatPercent(monteCarlo.probabilityOfProfit)}</p></div>
                <div><p className="text-slate-400">Worst DD</p><p className="text-white font-semibold">{formatPercent(monteCarlo.worstMaxDrawdown)}</p></div>
                <div><p className="text-slate-400">CVaR</p><p className="text-white font-semibold">{formatMoney(monteCarlo.conditionalValueAtRisk)}</p></div>
                <div><p className="text-slate-400">Rango balance 95%</p><p className="text-white font-semibold">{formatMoney(monteCarlo.balanceRange.min)} - {formatMoney(monteCarlo.balanceRange.max)}</p></div>
              </div>
            </div>
          )}

          {walkForward && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white">Walk Forward</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div><p className="text-slate-400">Ventanas completas</p><p className="text-white font-semibold">{walkForward.completedWindows}</p></div>
                <div><p className="text-slate-400">Ventanas sanas</p><p className="text-white font-semibold">{walkForward.healthyWindowsCount}</p></div>
                <div><p className="text-slate-400">Degradación</p><p className="text-white font-semibold">{formatPercent(walkForward.performanceDegradation)}</p></div>
                <div><p className="text-slate-400">WFE</p><p className="text-white font-semibold">{formatPercent(walkForward.walkForwardEfficiency)}</p></div>
                <div><p className="text-slate-400">Sobreajuste</p><p className={`font-semibold ${overfitting?.severity === 'high' ? 'text-red-400' : overfitting?.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{overfitting?.severity || 'low'}</p></div>
              </div>
              {overfitting && overfitting.indicators.length > 0 && (
                <div className="mt-3 bg-slate-900/50 border border-slate-700 rounded p-3 text-xs text-slate-300 space-y-1">
                  {overfitting.indicators.map((indicator, index) => (
                    <p key={index}>- {indicator}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowWarnings((current) => !current)}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Advertencias del laboratorio ({warnings.length})</span>
              </button>

              {showWarnings && (
                <div className="space-y-2">
                  {warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`border-l-4 p-3 rounded ${warning.severity === 'error' ? 'bg-red-900/20 border-red-600' : 'bg-amber-900/20 border-amber-600'}`}
                    >
                      <p className="font-semibold text-white text-sm capitalize">{warning.type}</p>
                      <p className="text-xs mt-1 text-slate-300">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result?.trades && result.trades.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h4 className="font-bold text-white">Trades Simulados</h4>
                <span className="text-xs text-slate-400">{result.trades.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50 border-b border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">#</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Entrada</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">Tipo</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">Precio</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">SL</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">TP</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">P&L</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">RR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 150).map((trade, index) => (
                      <tr key={trade.id} className={`border-b border-slate-700/50 ${index % 2 === 0 ? 'bg-slate-800/20' : ''}`}>
                        <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{new Date(trade.entryTime).toLocaleString('es-ES')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${trade.direction === 'long' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                            {trade.direction === 'long' ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{trade.entryPrice.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right text-red-400">{trade.stopLoss.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right text-green-400">{trade.takeProfit.toFixed(4)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${trade.isWinning ? 'text-green-400' : 'text-red-400'}`}>{trade.isWinning ? '+' : ''}{trade.profit.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{trade.riskReward.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h3 className="font-bold text-white mb-4">Diagnóstico de Señales</h3>
          <SignalDiagnosticsPanel
            diagnostics={result.diagnostics}
            authorizeLargeTest={authorizeLargeTest}
            onAuthorizeLargeTest={setAuthorizeLargeTest}
          />
        </div>
      )}

      {labState === 'no_data' && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <p className="text-slate-200 font-medium">Sin datos cargados</p>
            <p className="text-sm text-slate-500 mt-1">Importa uno o varios CSV históricos para habilitar el laboratorio.</p>
          </div>
        </div>
      )}

      {labState === 'ready' && (
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-medium">Dataset listo</p>
            <p className="text-sm text-emerald-200 mt-1">El laboratorio está listo para ejecutar el backtest profesional sobre históricos reales.</p>
          </div>
        </div>
      )}
    </div>
  );
}
