/**
 * Utilidad para ejecutar backtests demo en el navegador
 * Uso exclusivo: Admin panel privado
 * No realiza operaciones reales
 */

import { Asset, Timeframe, Candle } from '../types/marketData';
import { BacktestConfig, BacktestResult } from '../types/backtesting';
import { generateBacktestData } from './historicalData';
import { BacktestEngine } from './backtestEngine';

export interface DemoBacktestParams {
  asset: Asset;
  timeframe: Timeframe;
  initialBalance: number;
  riskPerTrade: number;
  minConsensus: number;
  daysBack?: number;
  csvCandles?: Candle[]; // Datos CSV opcionalmente cargados
}

export interface DemoBacktestExecution {
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime: number;
  endTime?: number;
  result?: BacktestResult;
  error?: string;
  executionTime?: number;
}

/**
 * Ejecutar backtest demo en el navegador
 * Simula ejecución de estrategia con datos demo locales
 */
export async function runDemoBacktest(
  params: DemoBacktestParams,
  onProgress?: (execution: DemoBacktestExecution) => void
): Promise<DemoBacktestExecution> {
  const execution: DemoBacktestExecution = {
    status: 'pending',
    progress: 0,
    startTime: Date.now(),
  };

  try {
    if (onProgress) onProgress(execution);

    // Generar datos históricos demo o usar CSV cargados
    execution.status = 'running';
    execution.progress = 10;
    if (onProgress) onProgress(execution);

    let historicalCandles: Candle[];

    if (params.csvCandles && params.csvCandles.length > 0) {
      // Usar datos CSV cargados
      historicalCandles = params.csvCandles;
    } else {
      // Generar datos demo
      const daysBack = params.daysBack || 30;
      const now = Date.now();
      const startDate = now - daysBack * 24 * 60 * 60 * 1000;
      const endDate = now;

      historicalCandles = generateBacktestData(
        params.asset,
        params.timeframe,
        startDate,
        endDate
      );
    }

    if (!historicalCandles || historicalCandles.length === 0) {
      throw new Error('No se pudieron generar datos históricos demo');
    }

    execution.progress = 30;
    if (onProgress) onProgress(execution);

    // Crear configuración de backtest
    const startDate = historicalCandles[0].timestamp;
    const endDate = historicalCandles[historicalCandles.length - 1].timestamp;

    const config: BacktestConfig = {
      id: `demo-${Date.now()}`,
      asset: params.asset,
      timeframe: params.timeframe,
      initialBalance: params.initialBalance,
      riskPerTrade: params.riskPerTrade,
      consensusThreshold: params.minConsensus,
      startDate,
      endDate,
      maxDrawdown: 50, // Límite máximo de drawdown (%)
      minWinRate: 40, // Win rate mínimo aceptable (%)
      includeSlippage: false, // Demo sin slippage
      slippagePoints: 0, // Sin deslizamiento
      status: 'pending',
      createdAt: Date.now(),
    };

    // Crear y ejecutar motor de backtesting
    const engine = new BacktestEngine(config);

    // Simular progreso
    const progressInterval = setInterval(() => {
      execution.progress = Math.min(execution.progress + 5, 90);
      if (onProgress) onProgress(execution);
    }, 100);

    // Ejecutar backtest (síncrono, no bloqueante en demo)
    const result = await engine.run(historicalCandles);

    clearInterval(progressInterval);

    execution.status = 'completed';
    execution.progress = 100;
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;
    execution.result = result;

    if (onProgress) onProgress(execution);

    return execution;
  } catch (error) {
    execution.status = 'error';
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

  if (params.initialBalance <= 0) {
    errors.push('El capital inicial debe ser mayor a 0');
  }

  if (params.riskPerTrade <= 0 || params.riskPerTrade > 10) {
    errors.push('El riesgo por trade debe estar entre 0.1% y 10%');
  }

  if (params.minConsensus < 5 || params.minConsensus > 10) {
    errors.push('El consenso mínimo debe estar entre 5 y 10');
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
