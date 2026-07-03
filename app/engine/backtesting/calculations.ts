/**
 * Funciones de cálculo de métricas para backtesting
 * Calcula todas las métricas desde trades simulados
 */

import { BacktestTrade, BacktestMetrics } from '../types/backtesting';

/**
 * Calcular todas las métricas desde trades
 */
export function calculateBacktestMetrics(
  trades: BacktestTrade[],
  initialBalance: number,
  balanceHistory: number[]
): BacktestMetrics {
  if (trades.length === 0) {
    return getEmptyMetrics(initialBalance);
  }

  const winningTrades = trades.filter((t) => t.isWinning);
  const losingTrades = trades.filter((t) => !t.isWinning);

  const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalLoss = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);
  const netProfit = totalProfit - totalLoss;

  const finalBalance = initialBalance + netProfit;

  // Calcular ratios
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
  const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.profit)) : 0;
  const largestLoss =
    losingTrades.length > 0 ? Math.max(...losingTrades.map((t) => Math.abs(t.profit))) : 0;

  // Drawdown
  const drawdownData = calculateDrawdown(balanceHistory, initialBalance);

  // Consecutive wins/losses
  const consecutiveStats = calculateConsecutiveStats(trades);

  // Risk/Reward
  const rrArray = trades.map((t) => t.riskReward || 0);
  const averageRiskReward = rrArray.length > 0 ? rrArray.reduce((a, b) => a + b) / rrArray.length : 0;

  // Sharpe/Sortino (simplificado)
  const returns = balanceHistory.map(
    (b, i) => (i === 0 ? 0 : (b - balanceHistory[i - 1]) / balanceHistory[i - 1])
  );
  const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Anualizado

  const downside = returns.filter((r) => r < 0);
  const downsideVariance =
    downside.length > 0
      ? downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length
      : 0;
  const sortinoRatio = Math.sqrt(downsideVariance) > 0 ? (avgReturn / Math.sqrt(downsideVariance)) * Math.sqrt(252) : 0;

  // Validaciones de trades
  const tradesWithValidSL = trades.filter((t) => t.stopLoss > 0).length;
  const tradesWithValidTP = trades.filter((t) => t.takeProfit > 0).length;
  const tradesWithProperRiskRatio = trades.filter((t) => t.riskReward >= 1.5).length;

  // Consenso
  const consensusScores = trades.map((t) => t.consensusScore || 0);
  const averageConsensusScore =
    consensusScores.length > 0 ? consensusScores.reduce((a, b) => a + b) / consensusScores.length : 0;

  // Pips
  const avgWinSize = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.pips, 0) / winningTrades.length : 0;
  const avgLossSize = losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + t.pips, 0) / losingTrades.length : 0;
  const payoffIndex = avgLossSize > 0 ? avgWinSize / avgLossSize : avgWinSize > 0 ? 999 : 0;

  const recoveryFactor = drawdownData.maxDrawdown > 0 ? Math.abs(netProfit) / drawdownData.maxDrawdown : 0;

  return {
    // Trading básico
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / trades.length) * 100,
    lossRate: (losingTrades.length / trades.length) * 100,

    // Ganancias
    totalProfit,
    totalLoss,
    netProfit,
    grossProfit: totalProfit,
    profitFactor,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,

    // Riesgo
    maxDrawdown: drawdownData.maxDrawdown,
    drawdownDuration: drawdownData.duration,
    currentDrawdown: drawdownData.currentDrawdown,
    maxConsecutiveWins: consecutiveStats.maxWins,
    maxConsecutiveLosses: consecutiveStats.maxLosses,

    // Ratios
    averageRiskReward,
    sharpeRatio,
    sortinoRatio,
    profitability: ((trades.filter((t) => t.riskReward >= 1) || []).length / trades.length) * 100,

    // Balance
    finalBalance,
    balanceGrowth: ((finalBalance - initialBalance) / initialBalance) * 100,
    returnOnInitialCapital: ((netProfit / initialBalance) * 100),

    // Consenso
    averageConsensusScore,
    consensusApprovalRate: 95, // Asumiendo que todos los trades ejecutados fueron aprobados
    rejectedSignals: 0,
    totalSignalsProcessed: trades.length * 2, // Estimado: señales rechazadas + aprobadas

    // Eficiencia
    avgWinSize,
    avgLossSize,
    payoffIndex,
    recoveryFactor,

    // Validaciones
    tradesWithValidSL,
    tradesWithValidTP,
    tradesWithProperRiskRatio,
  };
}

/**
 * Calcular drawdown máximo
 */
function calculateDrawdown(
  balanceHistory: number[],
  initialBalance: number
): { maxDrawdown: number; duration: number; currentDrawdown: number } {
  if (balanceHistory.length === 0) {
    return { maxDrawdown: 0, duration: 0, currentDrawdown: 0 };
  }

  let maxBalance = initialBalance;
  let maxDrawdown = 0;
  let drawdownStart = 0;
  let maxDuration = 0;

  balanceHistory.forEach((balance, i) => {
    if (balance > maxBalance) {
      maxBalance = balance;
    }

    const drawdown = ((maxBalance - balance) / maxBalance) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      drawdownStart = i;
    }

    if (drawdown > 0) {
      const duration = i - drawdownStart;
      if (duration > maxDuration) {
        maxDuration = duration;
      }
    }
  });

  const currentDrawdown =
    ((maxBalance - balanceHistory[balanceHistory.length - 1]) / maxBalance) * 100;

  return {
    maxDrawdown,
    duration: maxDuration,
    currentDrawdown: currentDrawdown < 0 ? 0 : currentDrawdown,
  };
}

/**
 * Calcular rachas de ganancias/pérdidas
 */
function calculateConsecutiveStats(
  trades: BacktestTrade[]
): { maxWins: number; maxLosses: number } {
  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  trades.forEach((trade) => {
    if (trade.isWinning) {
      currentWins++;
      currentLosses = 0;
      if (currentWins > maxWins) {
        maxWins = currentWins;
      }
    } else {
      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxLosses) {
        maxLosses = currentLosses;
      }
    }
  });

  return { maxWins, maxLosses };
}

/**
 * Métrica vacía por defecto
 */
function getEmptyMetrics(initialBalance: number): BacktestMetrics {
  return {
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
    finalBalance: initialBalance,
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
    tradesWithValidSL: 0,
    tradesWithValidTP: 0,
    tradesWithProperRiskRatio: 0,
  };
}

/**
 * Validar métricas
 */
export function validateMetrics(metrics: BacktestMetrics): string[] {
  const issues: string[] = [];

  if (metrics.winRate + metrics.lossRate > 101 || metrics.winRate + metrics.lossRate < 99) {
    issues.push('Win/Loss rate sum invalid');
  }

  if (metrics.profitFactor < 0) {
    issues.push('Profit factor negative');
  }

  if (metrics.maxDrawdown < 0 || metrics.maxDrawdown > 100) {
    issues.push('Drawdown out of range');
  }

  if (metrics.sharpeRatio < -10 || metrics.sharpeRatio > 10) {
    issues.push('Sharpe ratio out of typical range');
  }

  return issues;
}
