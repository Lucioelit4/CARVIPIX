/**
 * Walk-forward testing para backtesting
 * Divide datos en períodos de entrenamiento y validación
 * USO EXCLUSIVO: Admin - NO exponer al cliente
 */

import { BacktestConfig, BacktestResult, BacktestMetrics } from '../types/backtesting';
import { Candle } from '../types/marketData';
import { BacktestEngine } from './backtestEngine';

/**
 * Configuración de walk-forward
 */
export interface WalkForwardConfig {
  totalDataPoints: number; // Total de velas disponibles
  trainSize: number; // % para entrenamiento (ej: 60)
  testSize: number; // % para validación (ej: 20)
  walkSize: number; // % de avance por ventana (ej: 20)
  minRequiredData: number; // Mínimo de velas por ventana
}

/**
 * Ventana de walk-forward
 */
export interface WalkForwardWindow {
  windowIndex: number;
  trainStart: number; // Índice
  trainEnd: number;
  testStart: number;
  testEnd: number;
  trainSize: number;
  testSize: number;
  trainResult: BacktestResult;
  testResult: BacktestResult;
  performanceRatio: number; // Test Profit / Train Profit (detección de sobreajuste)
  isOverfitted: boolean; // Si performanceRatio < 0.5
}

/**
 * Análisis completo de walk-forward
 */
export interface WalkForwardAnalysis {
  config: WalkForwardConfig;
  windows: WalkForwardWindow[];
  
  // Métricas agregadas
  averageTrainMetrics: Partial<BacktestMetrics>;
  averageTestMetrics: Partial<BacktestMetrics>;
  
  // Degradación de performance
  performanceDegradation: number; // % (test vs train)
  walkForwardEfficiency: number; // Test net profit / Train net profit * 100
  overflowedWindowsCount: number;
  healthyWindowsCount: number;
  
  // Resumen
  totalWindows: number;
  completedWindows: number;
  failedWindows: number;
  
  executionTime: number; // ms
  warnings: string[];
}

/**
 * Ejecutar walk-forward analysis
 */
export async function runWalkForwardAnalysis(
  candles: Candle[],
  baseConfig: BacktestConfig,
  wfConfig: WalkForwardConfig
): Promise<WalkForwardAnalysis> {
  const startTime = Date.now();
  const windows: WalkForwardWindow[] = [];
  const warnings: string[] = [];

  // Validar configuración
  if (wfConfig.trainSize + wfConfig.testSize > 100) {
    warnings.push('Train + Test size > 100%: puede haber solapamiento');
  }

  // Calcular ventanas
  const totalCandles = candles.length;
  const trainCandles = Math.floor((totalCandles * wfConfig.trainSize) / 100);
  const testCandles = Math.floor((totalCandles * wfConfig.testSize) / 100);
  const walkCandles = Math.floor((totalCandles * wfConfig.walkSize) / 100);

  if (trainCandles < wfConfig.minRequiredData || testCandles < wfConfig.minRequiredData) {
    warnings.push('Datos insuficientes para ventanas de entrenamiento/validación');
    return getEmptyWalkForwardAnalysis(wfConfig, warnings, Date.now() - startTime);
  }

  let windowIndex = 0;
  let trainStart = 0;

  // Crear ventanas
  while (trainStart + trainCandles + testCandles <= totalCandles) {
    const trainEnd = trainStart + trainCandles;
    const testStart = trainEnd;
    const testEnd = testStart + testCandles;

    // Asegurar que no excedemos
    if (testEnd > totalCandles) {
      warnings.push(`Ventana ${windowIndex}: datos insuficientes al final`);
      break;
    }

    try {
      // Crear config para train
      const trainConfig: BacktestConfig = {
        ...baseConfig,
        id: `${baseConfig.id}_train_${windowIndex}`,
        startDate: candles[trainStart].timestamp,
        endDate: candles[trainEnd - 1].timestamp,
      };

      // Crear config para test
      const testConfig: BacktestConfig = {
        ...baseConfig,
        id: `${baseConfig.id}_test_${windowIndex}`,
        startDate: candles[testStart].timestamp,
        endDate: candles[testEnd - 1].timestamp,
      };

      // Ejecutar entrenamiento
      const trainEngine = new BacktestEngine(trainConfig);
      const trainResult = await trainEngine.run(candles.slice(trainStart, trainEnd));

      // Ejecutar validación
      const testEngine = new BacktestEngine(testConfig);
      const testResult = await testEngine.run(candles.slice(testStart, testEnd));

      // Calcular performance ratio
      const trainProfit = trainResult.metrics.netProfit || 0;
      const testProfit = testResult.metrics.netProfit || 0;
      const performanceRatio = trainProfit !== 0 ? testProfit / trainProfit : 0;
      const isOverfitted = performanceRatio < 0.5 && trainProfit > 0;

      if (isOverfitted) {
        warnings.push(`Ventana ${windowIndex}: posible sobreajuste (ratio: ${performanceRatio.toFixed(2)})`);
      }

      windows.push({
        windowIndex,
        trainStart,
        trainEnd,
        testStart,
        testEnd,
        trainSize: trainCandles,
        testSize: testCandles,
        trainResult,
        testResult,
        performanceRatio,
        isOverfitted,
      });

      windowIndex++;
      trainStart += walkCandles;
    } catch (error) {
      warnings.push(`Ventana ${windowIndex}: error en ejecución - ${error}`);
    }
  }

  // Calcular métricas agregadas
  const avgTrainMetrics = calculateAverageMetrics(
    windows.map((w) => w.trainResult.metrics)
  );
  const avgTestMetrics = calculateAverageMetrics(
    windows.map((w) => w.testResult.metrics)
  );

  const overflowedWindows = windows.filter((w) => w.isOverfitted).length;
  const degradation = avgTestMetrics.netProfit && avgTrainMetrics.netProfit
    ? ((avgTestMetrics.netProfit - avgTrainMetrics.netProfit) / avgTrainMetrics.netProfit) * 100
    : 0;
  const walkForwardEfficiency = avgTrainMetrics.netProfit
    ? ((avgTestMetrics.netProfit || 0) / avgTrainMetrics.netProfit) * 100
    : 0;

  return {
    config: wfConfig,
    windows,
    averageTrainMetrics: avgTrainMetrics,
    averageTestMetrics: avgTestMetrics,
    performanceDegradation: degradation,
    walkForwardEfficiency,
    overflowedWindowsCount: overflowedWindows,
    healthyWindowsCount: windows.length - overflowedWindows,
    totalWindows: windowIndex,
    completedWindows: windows.length,
    failedWindows: windowIndex - windows.length,
    executionTime: Date.now() - startTime,
    warnings,
  };
}

/**
 * Calcular métricas promedio
 */
function calculateAverageMetrics(metricsArray: BacktestMetrics[]): Partial<BacktestMetrics> {
  if (metricsArray.length === 0) {
    return {};
  }

  const n = metricsArray.length;
  const keys: (keyof BacktestMetrics)[] = [
    'totalTrades',
    'winRate',
    'profitFactor',
    'netProfit',
    'maxDrawdown',
    'averageRiskReward',
    'sharpeRatio',
    'finalBalance',
  ];

  const avg: Partial<BacktestMetrics> = {};

  keys.forEach((key) => {
    const values = metricsArray
      .map((m) => m[key])
      .filter((v) => typeof v === 'number') as number[];

    if (values.length > 0) {
      (avg[key] as any) = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });

  return avg;
}

/**
 * Walk-forward vacío
 */
function getEmptyWalkForwardAnalysis(
  config: WalkForwardConfig,
  warnings: string[],
  executionTime: number
): WalkForwardAnalysis {
  return {
    config,
    windows: [],
    averageTrainMetrics: {},
    averageTestMetrics: {},
    performanceDegradation: 0,
    walkForwardEfficiency: 0,
    overflowedWindowsCount: 0,
    healthyWindowsCount: 0,
    totalWindows: 0,
    completedWindows: 0,
    failedWindows: 0,
    executionTime,
    warnings,
  };
}

/**
 * Detectar sobreajuste
 */
export function detectOverfitting(wfAnalysis: WalkForwardAnalysis): {
  isOverfitted: boolean;
  severity: 'low' | 'medium' | 'high';
  indicators: string[];
} {
  const indicators: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Indicador 1: Degradación de performance
  if (wfAnalysis.performanceDegradation < -30) {
    indicators.push(`Performance degradation: ${wfAnalysis.performanceDegradation.toFixed(1)}%`);
    severity = 'high';
  } else if (wfAnalysis.performanceDegradation < -15) {
    indicators.push(`Performance degradation: ${wfAnalysis.performanceDegradation.toFixed(1)}%`);
    severity = 'medium';
  }

  // Indicador 2: Porcentaje de ventanas sobreajustadas
  const overflowRate = (wfAnalysis.overflowedWindowsCount / wfAnalysis.totalWindows) * 100;
  if (overflowRate > 50) {
    indicators.push(`${overflowRate.toFixed(0)}% ventanas sobreajustadas`);
    if (severity === 'low') severity = 'high';
  } else if (overflowRate > 25) {
    indicators.push(`${overflowRate.toFixed(0)}% ventanas sobreajustadas`);
    if (severity === 'low') severity = 'medium';
  }

  // Indicador 3: Inconsistencia en métricas de test
  const testWinRates = wfAnalysis.windows.map((w) => w.testResult.metrics.winRate);
  const trainWinRates = wfAnalysis.windows.map((w) => w.trainResult.metrics.winRate);

  const testVariance = calculateVariance(testWinRates);
  const trainVariance = calculateVariance(trainWinRates);

  if (testVariance > trainVariance * 2) {
    indicators.push(`Alta varianza en resultados de test vs train`);
    if (severity === 'low') severity = 'medium';
  }

  return {
    isOverfitted: severity !== 'low',
    severity,
    indicators,
  };
}

/**
 * Calcular varianza
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return variance;
}
