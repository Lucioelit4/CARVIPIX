/**
 * Tipos para módulo privado de backtesting
 * Solo para uso interno en admin - NO exponer al cliente
 */

import { Asset, Timeframe, Candle } from './marketData';

/**
 * Configuración del backtest
 */
export interface BacktestConfig {
  id: string; // Identificador único
  asset: Asset;
  timeframe: Timeframe;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  initialBalance: number; // Capital simulado
  riskPerTrade: number; // % del balance
  maxDrawdown: number; // % máximo permitido
  minWinRate: number; // % mínimo aceptable
  consensusThreshold: number; // Agentes necesarios (default 9)
  includeSlippage: boolean; // Incluir deslizamiento
  slippagePoints: number; // Puntos de deslizamiento
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  description?: string;
}

/**
 * Trade simulado en backtest
 */
export interface BacktestTrade {
  id: string;
  entryTime: number; // Timestamp de entrada
  entryPrice: number;
  entryReason: string; // Razón del agente
  exitTime?: number; // Timestamp de salida
  exitPrice?: number;
  exitReason?: string;
  direction: 'long' | 'short';
  quantity: number; // Lotes/unidades
  stopLoss: number;
  takeProfit: number;
  riskReward: number; // TP - Entry / Entry - SL
  pips: number; // Ganancia en pips
  profit: number; // Ganancia en dinero
  profitPercent: number; // % de profit
  isWinning: boolean;
  status: 'open' | 'closed' | 'stopped' | 'tp_hit';
  agentScores: {
    agent: string;
    score: number;
  }[];
  consensusScore: number; // Promedio de 11 agentes
  slippage: number; // Deslizamiento aplicado
}

/**
 * Resultado completo del backtest
 */
/**
 * Diagnóstico de señales para debugging
 */
export interface SignalDiagnostics {
  candlesEvaluated: number;
  candidateSignals: number;
  rejectionReasons: Record<string, number>;
  top5Rejections: Array<{ reason: string; count: number; percentage: number }>;
  scoreDistribution: {
    min: number;
    max: number;
    average: number;
    distribution: Record<number, number>; // score -> count
  };
  agentStats: Record<string, { approved: number; rejected: number; avgScore: number }>;
  consensusComparison: {
    consensus9: number; // Trades si umbral fuera 9
    consensus8: number; // Trades si umbral fuera 8
    consensus7: number; // Trades si umbral fuera 7
  };
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
  status: 'success' | 'failed' | 'incomplete';
  errors: BacktestError[];
  warnings: BacktestWarning[];
  completedAt: number;
  duration: number; // ms de ejecución
  diagnostics?: SignalDiagnostics; // Optional diagnostic data
}

/**
 * Métricas de rendimiento del backtest
 */
export interface BacktestMetrics {
  // Trading básico
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  lossRate: number; // %

  // Ganancias
  totalProfit: number; // Dinero
  totalLoss: number; // Dinero
  netProfit: number; // Dinero total
  grossProfit: number; // Ganancia antes de pérdidas
  profitFactor: number; // Ganancia / Pérdida (> 1 es bueno)
  averageWin: number; // Promedio por trade ganador
  averageLoss: number; // Promedio por trade perdedor
  largestWin: number;
  largestLoss: number;

  // Riesgo
  maxDrawdown: number; // % del balance
  drawdownDuration: number; // Velas hasta recuperarse
  currentDrawdown: number; // % actual
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Ratios
  averageRiskReward: number; // RR promedio
  sharpeRatio: number; // Risk-adjusted return
  sortinoRatio: number; // Downside risk-adjusted
  profitability: number; // % de trades con RR > 1
  expectancy: number; // Expectativa monetaria por trade
  expectancyPercent: number; // % sobre capital inicial por trade

  // Balance
  finalBalance: number;
  balanceGrowth: number; // % crecimiento
  returnOnInitialCapital: number; // % ROI

  // Consenso
  averageConsensusScore: number; // Promedio 11 agentes
  consensusApprovalRate: number; // % de trades aprobados
  rejectedSignals: number; // Señales rechazadas
  totalSignalsProcessed: number; // Total señales evaluadas

  // Eficiencia
  avgWinSize: number; // Pips ganados promedio
  avgLossSize: number; // Pips perdidos promedio
  payoffIndex: number; // (Avg Win / Avg Loss)
  recoveryFactor: number; // Net Profit / Max Drawdown
  riskPerTradeCapital: number; // Riesgo nominal por trade respecto al capital inicial

  // Validaciones
  tradesWithValidSL: number;
  tradesWithValidTP: number;
  tradesWithProperRiskRatio: number;
}

/**
 * Estado del backtest
 */
export interface BacktestStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  currentCandle: number; // Index de vela actual
  totalCandles: number; // Total de velas a procesar
  tradesProcessed: number;
  startTime: number;
  estimatedTimeRemaining: number; // ms
  currentBalance: number; // Balance actual simulado
  errorMessage?: string;
  lastUpdate: number;
}

/**
 * Error en backtesting
 */
export interface BacktestError {
  timestamp: number;
  candle?: number;
  message: string;
  type: 'data_error' | 'calculation_error' | 'agent_error' | 'consensus_error' | 'logic_error';
  severity: 'warning' | 'error' | 'critical';
  details?: Record<string, any>;
}

/**
 * Advertencia en backtesting
 */
export interface BacktestWarning {
  timestamp: number;
  message: string;
  type:
    | 'low_data_quality'
    | 'high_slippage'
    | 'unusual_pattern'
    | 'consensus_low'
    | 'drawdown_warning'
    | 'insufficient_signals'
    | 'short_sample_warning';
  severity: 'info' | 'warning';
}

/**
 * Historial de sesión de backtesting
 */
export interface BacktestSession {
  id: string;
  userId?: string; // Admin ID
  results: BacktestResult[];
  createdAt: number;
  updatedAt: number;
  isPrivate: boolean; // Always true
  notes?: string;
}

/**
 * Reporte ejecutivo para admin
 */
export interface BacktestReport {
  sessionId: string;
  summary: {
    asset: Asset;
    timeframe: Timeframe;
    dateRange: {
      start: number;
      end: number;
    };
    backtestDuration: number; // ms
  };
  performance: {
    metrics: BacktestMetrics;
    recommendation: 'ready_for_autobot' | 'needs_optimization' | 'not_recommended';
    confidenceLevel: number; // 0-100
  };
  risks: {
    maxDrawdown: number;
    drawdownRisk: 'low' | 'moderate' | 'high';
    volatilityRisk: 'low' | 'moderate' | 'high';
  };
  topTrades: BacktestTrade[];
  worstTrades: BacktestTrade[];
  criticalIssues: string[];
  recommendations: string[];
  generatedAt: number;
}
