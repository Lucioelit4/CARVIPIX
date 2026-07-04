/**
 * Ejecutor del laboratorio de backtesting para Admin.
 * Opera sobre datasets CSV cargados en el panel privado.
 */

import { Asset, Timeframe, Candle } from '../types/marketData';
import { BacktestConfig, BacktestResult } from '../types/backtesting';
import { BacktestEngine } from './backtestEngine';
import { validateCandleData, sortCandlesByTime } from './csvImporter';
import {
  runMonteCarloAnalysis,
  type MonteCarloAnalysis,
  type MonteCarloConfig,
} from './monteCarlo';
import {
  runWalkForwardAnalysis,
  detectOverfitting,
  type WalkForwardAnalysis,
  type WalkForwardConfig,
} from './walkForward';

export interface DemoBacktestParams {
  asset: Asset;
  timeframe: Timeframe;
  initialBalance: number;
  riskPerTrade: number;
  minConsensus: number;
  daysBack?: number;
  csvCandles?: Candle[]; // Datos CSV opcionalmente cargados
}

export interface BacktestDatasetSummary {
  totalCandles: number;
  startTime: number;
  endTime: number;
  duplicatesRemoved: number;
  warnings: string[];
  validationErrors: string[];
  qualityScore: number;
}

export interface BacktestAnalysisSummary {
  monteCarlo: MonteCarloAnalysis;
  walkForward: WalkForwardAnalysis;
  overfitting: ReturnType<typeof detectOverfitting>;
}

export interface DemoBacktestExecution {
  status: 'pending' | 'running' | 'completed' | 'error';
  phase?: 'idle' | 'validating_data' | 'running_backtest' | 'running_monte_carlo' | 'running_walk_forward' | 'building_report' | 'completed' | 'error';
  progress: number;
  startTime: number;
  endTime?: number;
  result?: BacktestResult;
  dataset?: BacktestDatasetSummary;
  analysis?: BacktestAnalysisSummary;
  error?: string;
  executionTime?: number;
}

/**
 * Ejecutar laboratorio de backtesting sobre datos reales cargados por el admin.
 */
export async function runDemoBacktest(
  params: DemoBacktestParams,
  onProgress?: (execution: DemoBacktestExecution) => void
): Promise<DemoBacktestExecution> {
  const execution: DemoBacktestExecution = {
    status: 'pending',
    phase: 'idle',
    progress: 0,
    startTime: Date.now(),
  };

  try {
    if (onProgress) onProgress(execution);

    execution.status = 'running';
    execution.phase = 'validating_data';
    execution.progress = 10;
    if (onProgress) onProgress(execution);

    if (!params.csvCandles || params.csvCandles.length === 0) {
      throw new Error('Debes cargar un dataset CSV antes de ejecutar el laboratorio');
    }

    const preparedDataset = prepareDataset(params.csvCandles, params.asset, params.timeframe);
    execution.dataset = preparedDataset.summary;

    if (preparedDataset.summary.validationErrors.length > 0) {
      throw new Error(`Dataset inválido: ${preparedDataset.summary.validationErrors.slice(0, 3).join('; ')}`);
    }

    if (preparedDataset.candles.length < 150) {
      throw new Error('El laboratorio requiere al menos 150 velas limpias para un backtest útil');
    }

    // Configurar backtest real con el dataset cargado
    execution.status = 'running';
    execution.phase = 'running_backtest';
    execution.progress = 30;
    if (onProgress) onProgress(execution);

    // Crear configuración de backtest
    const startDate = preparedDataset.candles[0].timestamp;
    const endDate = preparedDataset.candles[preparedDataset.candles.length - 1].timestamp;

    const config: BacktestConfig = {
      id: `lab-${Date.now()}`,
      asset: params.asset,
      timeframe: params.timeframe,
      initialBalance: params.initialBalance,
      riskPerTrade: params.riskPerTrade,
      consensusThreshold: params.minConsensus,
      startDate,
      endDate,
      maxDrawdown: 50, // Límite máximo de drawdown (%)
      minWinRate: 40, // Win rate mínimo aceptable (%)
      includeSlippage: true,
      slippagePoints: getDefaultSlippage(params.asset),
      status: 'pending',
      createdAt: Date.now(),
    };

    // Crear y ejecutar motor de backtesting
    const engine = new BacktestEngine(config);

    const result = await engine.run(preparedDataset.candles);

    execution.phase = 'running_monte_carlo';
    execution.progress = 70;
    if (onProgress) onProgress(execution);

    const monteCarloConfig: MonteCarloConfig = {
      iterations: params.csvCandles.length > 5000 ? 5000 : 2000,
      confidenceLevel: 0.95,
      preserveSequence: true,
    };

    const monteCarlo = runMonteCarloAnalysis(
      result.trades,
      params.initialBalance,
      monteCarloConfig
    );

    execution.phase = 'running_walk_forward';
    execution.progress = 85;
    if (onProgress) onProgress(execution);

    const walkForwardConfig = buildWalkForwardConfig(preparedDataset.candles.length);
    const walkForward = await runWalkForwardAnalysis(
      preparedDataset.candles,
      config,
      walkForwardConfig
    );

    execution.phase = 'building_report';
    execution.progress = 95;
    if (onProgress) onProgress(execution);

    execution.analysis = {
      monteCarlo,
      walkForward,
      overfitting: detectOverfitting(walkForward),
    };

    execution.status = 'completed';
    execution.phase = 'completed';
    execution.progress = 100;
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;
    execution.result = result;

    if (onProgress) onProgress(execution);

    return execution;
  } catch (error) {
    execution.status = 'error';
    execution.phase = 'error';
    execution.error = error instanceof Error ? error.message : 'Error desconocido';
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;

    if (onProgress) onProgress(execution);

    return execution;
  }
}

/**
 * Validar parámetros del backtest
 */
export function validateBacktestParams(params: DemoBacktestParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.csvCandles || params.csvCandles.length === 0) {
    errors.push('Carga un CSV histórico antes de ejecutar el laboratorio');
  }

  if (params.initialBalance <= 0) {
    errors.push('El capital inicial debe ser mayor a 0');
  }

  if (params.riskPerTrade <= 0 || params.riskPerTrade > 10) {
    errors.push('El riesgo por trade debe estar entre 0.1% y 10%');
  }

  if (params.minConsensus < 5 || params.minConsensus > 10) {
    errors.push('El consenso mínimo debe estar entre 5 y 10');
  }

  if (params.csvCandles && params.csvCandles.length > 0) {
    const mismatchedAsset = params.csvCandles.some((candle) => candle.asset !== params.asset);
    const mismatchedTimeframe = params.csvCandles.some((candle) => candle.timeframe !== params.timeframe);

    if (mismatchedAsset) {
      errors.push('El activo seleccionado no coincide con el dataset cargado');
    }

    if (mismatchedTimeframe) {
      errors.push('El timeframe seleccionado no coincide con el dataset cargado');
    }
  }

  if (params.daysBack && (params.daysBack < 7 || params.daysBack > 365)) {
    errors.push('Los días a analizar deben estar entre 7 y 365');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtener precios base para sugerencias
 */
export function getDefaultParams(asset: Asset): {
  balance: number;
  risk: number;
  consensus: number;
} {
  const defaults: Record<Asset, { balance: number; risk: number; consensus: number }> = {
    XAUUSD: { balance: 10000, risk: 1, consensus: 7 },
    EURUSD: { balance: 5000, risk: 0.5, consensus: 7 },
    GBPUSD: { balance: 5000, risk: 0.5, consensus: 7 },
    BTCUSD: { balance: 50000, risk: 2, consensus: 7 },
  };

  return defaults[asset];
}

function prepareDataset(candles: Candle[], asset: Asset, timeframe: Timeframe): {
  candles: Candle[];
  summary: BacktestDatasetSummary;
} {
  const assetCandles = candles.filter((candle) => candle.asset === asset && candle.timeframe === timeframe);
  const sortedCandles = sortCandlesByTime(assetCandles);
  const dedupedCandles: Candle[] = [];
  const seenTimestamps = new Set<number>();
  let duplicatesRemoved = 0;

  for (const candle of sortedCandles) {
    if (seenTimestamps.has(candle.timestamp)) {
      duplicatesRemoved++;
      continue;
    }

    seenTimestamps.add(candle.timestamp);
    dedupedCandles.push({ ...candle, complete: true });
  }

  const validation = validateCandleData(dedupedCandles);
  const qualityPenalty = validation.errors.length * 5 + validation.warnings.length * 2;
  const qualityScore = Math.max(0, 100 - qualityPenalty);

  return {
    candles: dedupedCandles,
    summary: {
      totalCandles: dedupedCandles.length,
      startTime: dedupedCandles[0]?.timestamp || 0,
      endTime: dedupedCandles[dedupedCandles.length - 1]?.timestamp || 0,
      duplicatesRemoved,
      warnings: validation.warnings,
      validationErrors: validation.errors,
      qualityScore,
    },
  };
}

function getDefaultSlippage(asset: Asset): number {
  switch (asset) {
    case 'XAUUSD':
      return 8;
    case 'BTCUSD':
      return 20;
    default:
      return 3;
  }
}

function buildWalkForwardConfig(totalDataPoints: number): WalkForwardConfig {
  const minRequiredData = Math.max(50, Math.floor(totalDataPoints * 0.1));

  return {
    totalDataPoints,
    trainSize: 60,
    testSize: 20,
    walkSize: 20,
    minRequiredData,
  };
}
