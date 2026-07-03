/**
 * Types para Parameter Optimizer
 * Optimización de parámetros de backtesting mediante grid search y análisis
 */

import { BacktestMetrics } from '../../types/backtesting';
import { Asset, Timeframe } from '../../types/marketData';

export type OptimizationMethod = 'grid_search' | 'genetic' | 'bayesian';

export interface ParameterRange {
  consensusThreshold: number[]; // ej: [7, 8, 9, 10]
  minConfidenceScore: number[]; // ej: [50, 60, 70, 80]
  minRiskReward: number[]; // ej: [1.5, 2.0, 2.5, 3.0]
  riskPerTrade: number[]; // ej: [0.5, 1, 1.5, 2] (%)
  sessionFilter?: ('London' | 'NewYork' | 'Tokyo' | 'none')[]; // Optional session filtering
}

export interface OptimizationConfig {
  id: string;
  name: string;
  method: OptimizationMethod;
  assets: Asset[];
  timeframes: Timeframe[];
  parameterRanges: ParameterRange;
  baselineConfig: any; // Configuración base para backtesting
  maxCombinations?: number; // Limitar combinaciones si es muy grande
  evaluateWalkForward?: boolean;
  evaluateMonteCarlo?: boolean;
  createdAt: number;
}

export interface OptimizationCandidate {
  id: string;
  consensusThreshold: number;
  minConfidenceScore: number;
  minRiskReward: number;
  riskPerTrade: number;
  sessionFilter?: string;
  asset?: Asset;
  timeframe?: Timeframe;
}

export interface OptimizationRunResult {
  candidate: OptimizationCandidate;
  asset: Asset;
  timeframe: Timeframe;
  metrics: BacktestMetrics;
  score: number;
  scoreBreakdown: OptimizationScore;
  overfit: {
    detected: boolean;
    severity: 'none' | 'low' | 'medium' | 'high';
    indicators: string[];
  };
  warnings: string[];
}

export interface OptimizationScore {
  profitFactor: number; // 0-100
  winRate: number; // 0-100
  drawdownPenalty: number; // -0 a -100 (penalización)
  tradeCountPenalty: number; // -0 a -50 (penalización)
  overfitPenalty: number; // -0 a -50 (penalización)
  stabilityBonus: number; // 0-20
  walkForwardConsistency: number; // 0-100 (si aplica)
  monteCarloConfidence: number; // 0-100 (si aplica)
  final: number; // Score final 0-100
}

export interface OptimizationResult {
  id: string;
  config: OptimizationConfig;
  totalCombinations: number;
  evaluatedCombinations: number;
  bestCandidates: OptimizationRunResult[]; // Top 10
  worstCandidates: OptimizationRunResult[];
  allResults: OptimizationRunResult[];
  perAssetStats: Map<Asset, {
    bestScore: number;
    averageScore: number;
    candidates: OptimizationRunResult[];
  }>;
  perTimeframeStats: Map<Timeframe, {
    bestScore: number;
    averageScore: number;
    candidates: OptimizationRunResult[];
  }>;
  recommendations: {
    universalBest: OptimizationCandidate | null; // Funciona bien en todos lados
    assetSpecific: Map<Asset, OptimizationCandidate>;
    timeframeSpecific: Map<Timeframe, OptimizationCandidate>;
    warnings: string[];
  };
  startedAt: number;
  completedAt: number;
  duration: number; // ms
}

export interface OptimizationRun {
  runId: string;
  optimizationId: string;
  candidate: OptimizationCandidate;
  asset: Asset;
  timeframe: Timeframe;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: OptimizationRunResult;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface OptimizationProgress {
  optimizationId: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
  avgRunDuration: number;
  bestScoreSoFar: number;
  bestCandidate: OptimizationCandidate | null;
}

export interface ParameterSensitivity {
  parameter: string;
  values: number[];
  averageScores: number[];
  impactPercentage: number; // How much this parameter affects overall score
}

export interface OptimizationComparison {
  candidates: OptimizationCandidate[];
  asset: Asset;
  timeframe: Timeframe;
  scores: number[];
  metrics: BacktestMetrics[];
  recommendation: OptimizationCandidate;
  reason: string;
}
