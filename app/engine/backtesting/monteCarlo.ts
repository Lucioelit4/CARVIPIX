/**
 * Análisis Monte Carlo para backtesting
 * Simula múltiples escenarios reensamblando trades
 * USO EXCLUSIVO: Admin - NO exponer al cliente
 */

import { BacktestTrade, BacktestMetrics } from '../types/backtesting';

/**
 * Configuración de Monte Carlo
 */
export interface MonteCarloConfig {
  iterations: number; // Número de simulaciones (típicamente 100-1000)
  confidenceLevel: number; // 0.95 = 95% confianza
  preserveSequence: boolean; // Mantener secuencia temporal
}

/**
 * Resultado de una iteración de Monte Carlo
 */
export interface MonteCarloIteration {
  iteration: number;
  trades: BacktestTrade[];
  finalBalance: number;
  maxDrawdown: number;
  winRate: number;
  profit: number;
}

/**
 * Análisis completo de Monte Carlo
 */
export interface MonteCarloAnalysis {
  totalIterations: number;
  averageBalance: number;
  minBalance: number;
  maxBalance: number;
  balanceStdDev: number;

  // Rango de confianza (ej: 95%)
  confidenceLevel: number;
  balanceRange: {
    min: number;
    max: number;
  };

  // Drawdown
  averageMaxDrawdown: number;
  worstMaxDrawdown: number;
  bestMaxDrawdown: number;
  drawdownStdDev: number;
  drawdownRange: {
    min: number;
    max: number;
  };

  // Win Rate
  averageWinRate: number;
  minWinRate: number;
  maxWinRate: number;
  winRateStdDev: number;

  // Profit
  averageProfit: number;
  minProfit: number;
  maxProfit: number;
  profitStdDev: number;

  // Prob de obtener cierto rendimiento
  probabilityOfProfit: number; // % de iteraciones con profit > 0
  probabilityOfLoss: number; // % de iteraciones con profit < 0

  // Riesgo
  valueAtRisk: number; // VaR 95% - peor drawdown esperado 95% de las veces
  conditionalValueAtRisk: number; // CVaR - promedio del 5% peor escenarios

  iterations: MonteCarloIteration[];
  executionTime: number; // ms
}

/**
 * Ejecutar análisis Monte Carlo
 */
export function runMonteCarloAnalysis(
  trades: BacktestTrade[],
  initialBalance: number,
  config: MonteCarloConfig
): MonteCarloAnalysis {
  const startTime = Date.now();

  if (trades.length === 0) {
    return getEmptyMonteCarloAnalysis(config);
  }

  const iterations: MonteCarloIteration[] = [];

  // Ejecutar N iteraciones
  for (let i = 0; i < config.iterations; i++) {
    // Reensambler trades (bootstrap)
    const shuffledTrades = resampleTrades(trades, config.preserveSequence);

    // Calcular métricas para esta iteración
    const iteration = calculateIterationMetrics(shuffledTrades, initialBalance, i);
    iterations.push(iteration);
  }

  // Calcular estadísticas agregadas
  const aggregateStats = calculateAggregateStatistics(iterations, initialBalance, config.confidenceLevel);
  
  const analysis: MonteCarloAnalysis = {
    ...aggregateStats,
    iterations,
    executionTime: Date.now() - startTime,
  };

  return analysis;
}

/**
 * Reensampler trades (bootstrap)
 */
function resampleTrades(trades: BacktestTrade[], preserveSequence: boolean): BacktestTrade[] {
  if (preserveSequence) {
    // Block bootstrap para preservar dependencia temporal parcial.
    const blockSize = Math.max(2, Math.round(Math.sqrt(trades.length)));
    const resampled: BacktestTrade[] = [];

    while (resampled.length < trades.length) {
      const maxStart = Math.max(0, trades.length - blockSize);
      const start = Math.floor(Math.random() * (maxStart + 1));
      const block = trades.slice(start, Math.min(start + blockSize, trades.length));

      for (const trade of block) {
        if (resampled.length >= trades.length) break;
        resampled.push({ ...trade });
      }
    }

    return resampled;
  }

  // Random sampling con reemplazo
  const resampled: BacktestTrade[] = [];
  for (let i = 0; i < trades.length; i++) {
    const randomIndex = Math.floor(Math.random() * trades.length);
    resampled.push({ ...trades[randomIndex] });
  }

  return resampled;
}

/**
 * Calcular métricas para una iteración
 */
function calculateIterationMetrics(
  trades: BacktestTrade[],
  initialBalance: number,
  iteration: number
): MonteCarloIteration {
  let balance = initialBalance;
  let maxBalance = initialBalance;
  let maxDrawdown = 0;
  let winningTrades = 0;

  // Aplicar trades secuencialmente
  trades.forEach((trade) => {
    balance += trade.profit;
    maxBalance = Math.max(maxBalance, balance);

    const drawdown = ((maxBalance - balance) / maxBalance) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);

    if (trade.isWinning) winningTrades++;
  });

  const profit = balance - initialBalance;
  const winRate = (winningTrades / trades.length) * 100;

  return {
    iteration,
    trades,
    finalBalance: balance,
    maxDrawdown,
    winRate,
    profit,
  };
}

/**
 * Calcular estadísticas agregadas
 */
function calculateAggregateStatistics(
  iterations: MonteCarloIteration[],
  initialBalance: number,
  confidenceLevel: number
): Omit<MonteCarloAnalysis, 'iterations' | 'executionTime'> {
  const n = iterations.length;

  // Balance
  const balances = iterations.map((i) => i.finalBalance);
  const avgBalance = balances.reduce((a, b) => a + b) / n;
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const balanceStdDev = calculateStdDev(balances, avgBalance);

  // Drawdown
  const drawdowns = iterations.map((i) => i.maxDrawdown);
  const avgDrawdown = drawdowns.reduce((a, b) => a + b) / n;
  const minDrawdown = Math.min(...drawdowns);
  const maxDrawdown = Math.max(...drawdowns);
  const drawdownStdDev = calculateStdDev(drawdowns, avgDrawdown);

  // Win Rate
  const winRates = iterations.map((i) => i.winRate);
  const avgWinRate = winRates.reduce((a, b) => a + b) / n;
  const minWinRate = Math.min(...winRates);
  const maxWinRate = Math.max(...winRates);
  const winRateStdDev = calculateStdDev(winRates, avgWinRate);

  // Profit
  const profits = iterations.map((i) => i.profit);
  const avgProfit = profits.reduce((a, b) => a + b) / n;
  const minProfit = Math.min(...profits);
  const maxProfit = Math.max(...profits);
  const profitStdDev = calculateStdDev(profits, avgProfit);

  // Probabilidades
  const probProfit = (profits.filter((p) => p > 0).length / n) * 100;
  const probLoss = (profits.filter((p) => p < 0).length / n) * 100;

  // Rango de confianza (percentiles)
  const sortedBalances = [...balances].sort((a, b) => a - b);
  const percentile = (confidenceLevel + 1) / 2; // 0.975 para 95%
  const lowerIdx = Math.floor(n * (1 - percentile));
  const upperIdx = Math.ceil(n * percentile);

  const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
  const drawdownLowerIdx = Math.floor(n * (1 - percentile));
  const drawdownUpperIdx = Math.ceil(n * percentile);

  // VaR y CVaR
  const worstScenarioCount = Math.ceil(n * (1 - confidenceLevel));
  const worstScenarios = profits.sort((a, b) => a - b).slice(0, worstScenarioCount);
  const var95 = worstScenarios[worstScenarios.length - 1];
  const cvar95 = worstScenarios.reduce((a, b) => a + b) / worstScenarios.length;

  return {
    totalIterations: n,
    averageBalance: avgBalance,
    minBalance,
    maxBalance,
    balanceStdDev,
    confidenceLevel,
    balanceRange: {
      min: sortedBalances[lowerIdx],
      max: sortedBalances[upperIdx],
    },
    averageMaxDrawdown: avgDrawdown,
    worstMaxDrawdown: maxDrawdown,
    bestMaxDrawdown: minDrawdown,
    drawdownStdDev,
    drawdownRange: {
      min: sortedDrawdowns[drawdownLowerIdx],
      max: sortedDrawdowns[drawdownUpperIdx],
    },
    averageWinRate: avgWinRate,
    minWinRate,
    maxWinRate,
    winRateStdDev,
    averageProfit: avgProfit,
    minProfit,
    maxProfit,
    profitStdDev,
    probabilityOfProfit: probProfit,
    probabilityOfLoss: probLoss,
    valueAtRisk: var95,
    conditionalValueAtRisk: cvar95,
  };
}

/**
 * Calcular desviación estándar
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Monte Carlo vacío
 */
function getEmptyMonteCarloAnalysis(config: MonteCarloConfig): MonteCarloAnalysis {
  return {
    totalIterations: 0,
    averageBalance: 0,
    minBalance: 0,
    maxBalance: 0,
    balanceStdDev: 0,
    confidenceLevel: config.confidenceLevel,
    balanceRange: { min: 0, max: 0 },
    averageMaxDrawdown: 0,
    worstMaxDrawdown: 0,
    bestMaxDrawdown: 0,
    drawdownStdDev: 0,
    drawdownRange: { min: 0, max: 0 },
    averageWinRate: 0,
    minWinRate: 0,
    maxWinRate: 0,
    winRateStdDev: 0,
    averageProfit: 0,
    minProfit: 0,
    maxProfit: 0,
    profitStdDev: 0,
    probabilityOfProfit: 0,
    probabilityOfLoss: 0,
    valueAtRisk: 0,
    conditionalValueAtRisk: 0,
    iterations: [],
    executionTime: 0,
  };
}
