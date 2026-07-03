/**
 * Types para batch processing de backtests
 * Ejecutar múltiples backtests en lotes
 */

import { BacktestConfig, BacktestResult, BacktestMetrics } from '../types/backtesting';
import { Asset, Timeframe } from '../types/marketData';

export interface BatchConfig {
  id: string;
  name: string;
  assets: Asset[];
  timeframes: Timeframe[];
  baseBacktestConfig: Partial<BacktestConfig>;
  totalJobs: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface BatchJob {
  id: string;
  batchId: string;
  asset: Asset;
  timeframe: Timeframe;
  config: BacktestConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: BacktestResult;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number; // ms
  retries: number;
  maxRetries: number;
}

export interface BatchProgress {
  batchId: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  skippedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // ms
  elapsedTime: number; // ms
  averageJobDuration: number; // ms
  throughput: number; // jobs per second
}

export interface BatchResult {
  batchId: string;
  config: BatchConfig;
  jobs: BatchJob[];
  progress: BatchProgress;
  summary: BatchSummary;
  errors: BatchError[];
  warnings: BatchWarning[];
  startedAt: number;
  completedAt: number;
  duration: number; // ms
}

export interface BatchSummary {
  totalAssets: number;
  totalTimeframes: number;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  skippedJobs: number;
  successRate: number; // 0-100
  averageMetrics: {
    winRate: number;
    profitFactor: number;
    netProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  bestPerformer: {
    asset: Asset;
    timeframe: Timeframe;
    metrics: BacktestMetrics;
  } | null;
  worstPerformer: {
    asset: Asset;
    timeframe: Timeframe;
    metrics: BacktestMetrics;
  } | null;
  totalNetProfit: number;
  combinedMetrics: {
    totalTrades: number;
    totalWins: number;
    totalLosses: number;
    averageWinRate: number;
    averageProfitFactor: number;
  };
}

export interface BatchError {
  jobId: string;
  asset: Asset;
  timeframe: Timeframe;
  message: string;
  code: string;
  timestamp: number;
  retry: boolean;
}

export interface BatchWarning {
  jobId: string;
  asset: Asset;
  timeframe: Timeframe;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface BatchQueueStats {
  totalQueued: number;
  totalRunning: number;
  totalCompleted: number;
  totalFailed: number;
  averageJobDuration: number; // ms
  maxConcurrentWorkers: number;
  currentWorkers: number;
  queueWaitTime: number; // ms (average)
}
