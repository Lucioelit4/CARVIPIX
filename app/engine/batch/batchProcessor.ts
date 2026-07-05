/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Batch Processor - Ejecutor de backtests en lotes
 * Maneja job queue, workers, progreso y error recovery
 */

// Re-export types
export * from './types';

import {
  BatchConfig,
  BatchJob,
  BatchProgress,
  BatchResult,
  BatchSummary,
  BatchError,
  BatchWarning,
  BatchQueueStats,
} from './types';
import { BacktestConfig, BacktestResult } from '../types/backtesting';
import { Asset, Timeframe } from '../types/marketData';

const DEFAULT_MAX_WORKERS = 4; // CPU-bound, no sobrecargar
const DEFAULT_MAX_RETRIES = 2;
const JOB_TIMEOUT = 300000; // 5 minutos

export class BatchProcessor {
  private jobQueue: Map<string, BatchJob> = new Map();
  private runningJobs: Map<string, BatchJob> = new Map();
  private completedBatches: Map<string, BatchResult> = new Map();
  private currentBatchId: string | null = null;
  private maxWorkers: number;
  private activeWorkers = 0;
  private startTime = 0;
  private jobStartTimes: Map<string, number> = new Map();
  private jobDurations: number[] = [];

  constructor(maxWorkers = DEFAULT_MAX_WORKERS) {
    this.maxWorkers = maxWorkers;
  }

  /**
   * Crear y ejecutar un batch
   */
  async runBatch(
    batchConfig: Omit<BatchConfig, 'id' | 'createdAt'>,
    backtest: (config: BacktestConfig) => Promise<BacktestResult>
  ): Promise<BatchResult> {
    const batchId = this.generateBatchId();
    this.currentBatchId = batchId;
    this.startTime = Date.now();

    const config: BatchConfig = {
      ...batchConfig,
      id: batchId,
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    try {
      // Generar jobs para cada combinación de activo/timeframe
      this.generateJobs(batchId, batchConfig, config);

      // Ejecutar jobs en paralelo (respetando max workers)
      await this.executeJobs(backtest);

      // Compilar resultados
      const result = this.compileResults(batchId, config);

      // Guardar en historial
      this.completedBatches.set(batchId, result);

      return result;
    } catch (error) {
      throw new Error(`Batch execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generar jobs para el batch
   */
  private generateJobs(batchId: string, batchConfig: any, config: BatchConfig): void {
    let jobIndex = 0;

    for (const asset of config.assets) {
      for (const timeframe of config.timeframes) {
        const jobId = `${batchId}_${asset}_${timeframe}`;
        const fullConfig: BacktestConfig = {
          asset,
          timeframe,
          ...config.baseBacktestConfig,
        } as BacktestConfig;

        const job: BatchJob = {
          id: jobId,
          batchId,
          asset,
          timeframe,
          config: fullConfig,
          status: 'pending',
          retries: 0,
          maxRetries: DEFAULT_MAX_RETRIES,
        };

        this.jobQueue.set(jobId, job);
        jobIndex++;
      }
    }

    config.totalJobs = jobIndex;
  }

  /**
   * Ejecutar todos los jobs
   */
  private async executeJobs(
    backtest: (config: BacktestConfig) => Promise<BacktestResult>
  ): Promise<void> {
    const jobArray = Array.from(this.jobQueue.values());

    while (jobArray.some((j) => j.status === 'pending' || j.status === 'running')) {
      // Llenar workers disponibles
      while (
        this.activeWorkers < this.maxWorkers &&
        jobArray.some((j) => j.status === 'pending')
      ) {
        const pendingJob = jobArray.find((j) => j.status === 'pending');
        if (pendingJob) {
          this.executeJob(pendingJob, backtest);
        }
      }

      // Esperar un poco antes de chequear de nuevo
      await this.sleep(100);
    }
  }

  /**
   * Ejecutar un job individual
   */
  private async executeJob(
    job: BatchJob,
    backtest: (config: BacktestConfig) => Promise<BacktestResult>
  ): Promise<void> {
    job.status = 'running';
    job.startedAt = Date.now();
    this.jobStartTimes.set(job.id, Date.now());
    this.activeWorkers++;
    this.runningJobs.set(job.id, job);

    try {
      // Ejecutar backtest con timeout
      const result = await Promise.race([
        backtest(job.config),
        this.createTimeout(JOB_TIMEOUT),
      ]);

      job.result = result as BacktestResult;
      job.status = 'completed';
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // Reintentar si quedan intentos
      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = 'pending';
        console.log(`Retrying job ${job.id} (attempt ${job.retries}/${job.maxRetries})`);
      } else {
        job.status = 'failed';
        job.error = errorMsg;
      }
    } finally {
      job.completedAt = Date.now();
      job.duration = job.completedAt - (job.startedAt || 0);
      this.jobDurations.push(job.duration);

      this.activeWorkers--;
      this.runningJobs.delete(job.id);
      this.jobQueue.set(job.id, job);
    }
  }

  /**
   * Compilar resultados del batch
   */
  private compileResults(batchId: string, config: BatchConfig): BatchResult {
    const jobs = Array.from(this.jobQueue.values()).filter((j) => j.batchId === batchId);
    const completedJobs = jobs.filter((j) => j.status === 'completed');
    const failedJobs = jobs.filter((j) => j.status === 'failed');
    const skippedJobs = jobs.filter((j) => j.status === 'skipped');

    const progress: BatchProgress = {
      batchId,
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      skippedJobs: skippedJobs.length,
      runningJobs: 0,
      pendingJobs: 0,
      percentComplete: 100,
      estimatedTimeRemaining: 0,
      elapsedTime: Date.now() - this.startTime,
      averageJobDuration: this.jobDurations.length > 0
        ? this.jobDurations.reduce((a, b) => a + b, 0) / this.jobDurations.length
        : 0,
      throughput: completedJobs.length / ((Date.now() - this.startTime) / 1000),
    };

    const summary = this.calculateSummary(completedJobs);
    const errors = this.extractErrors(failedJobs);
    const warnings = this.extractWarnings(completedJobs);

    const now = Date.now();
    return {
      batchId,
      config,
      jobs,
      progress,
      summary,
      errors,
      warnings,
      startedAt: config.startedAt || now,
      completedAt: now,
      duration: now - (config.startedAt || now),
    };
  }

  /**
   * Calcular resumen de resultados
   */
  private calculateSummary(completedJobs: BatchJob[]): BatchSummary {
    if (completedJobs.length === 0) {
      return {
        totalAssets: 0,
        totalTimeframes: 0,
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        skippedJobs: 0,
        successRate: 0,
        averageMetrics: {
          winRate: 0,
          profitFactor: 0,
          netProfit: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
        },
        bestPerformer: null,
        worstPerformer: null,
        totalNetProfit: 0,
        combinedMetrics: {
          totalTrades: 0,
          totalWins: 0,
          totalLosses: 0,
          averageWinRate: 0,
          averageProfitFactor: 0,
        },
      };
    }

    const metrics = completedJobs
      .filter((j) => j.result && j.result.metrics)
      .map((j) => ({
        job: j,
        metrics: j.result!.metrics,
      }));

    const totalTrades = metrics.reduce((sum, m) => sum + m.metrics.totalTrades, 0);
    const totalWins = metrics.reduce((sum, m) => sum + m.metrics.winningTrades, 0);
    const totalLosses = metrics.reduce((sum, m) => sum + m.metrics.losingTrades, 0);
    const totalNetProfit = metrics.reduce((sum, m) => sum + m.metrics.netProfit, 0);

    const avgWinRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.metrics.winRate, 0) / metrics.length
      : 0;

    const avgProfitFactor = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.metrics.profitFactor, 0) / metrics.length
      : 0;

    const bestPerformer = metrics.length > 0
      ? metrics.reduce((best, m) =>
          m.metrics.sharpeRatio > best.metrics.sharpeRatio ? m : best
        )
      : null;

    const worstPerformer = metrics.length > 0
      ? metrics.reduce((worst, m) =>
          m.metrics.sharpeRatio < worst.metrics.sharpeRatio ? m : worst
        )
      : null;

    return {
      totalAssets: new Set(completedJobs.map((j) => j.asset)).size,
      totalTimeframes: new Set(completedJobs.map((j) => j.timeframe)).size,
      totalJobs: completedJobs.length,
      successfulJobs: completedJobs.length,
      failedJobs: 0,
      skippedJobs: 0,
      successRate: 100,
      averageMetrics: {
        winRate: avgWinRate,
        profitFactor: avgProfitFactor,
        netProfit: totalNetProfit / Math.max(metrics.length, 1),
        maxDrawdown: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.metrics.maxDrawdown, 0) / metrics.length
          : 0,
        sharpeRatio: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.metrics.sharpeRatio, 0) / metrics.length
          : 0,
      },
      bestPerformer: bestPerformer
        ? {
            asset: bestPerformer.job.asset,
            timeframe: bestPerformer.job.timeframe,
            metrics: bestPerformer.metrics,
          }
        : null,
      worstPerformer: worstPerformer
        ? {
            asset: worstPerformer.job.asset,
            timeframe: worstPerformer.job.timeframe,
            metrics: worstPerformer.metrics,
          }
        : null,
      totalNetProfit,
      combinedMetrics: {
        totalTrades,
        totalWins,
        totalLosses,
        averageWinRate: avgWinRate,
        averageProfitFactor: avgProfitFactor,
      },
    };
  }

  /**
   * Extraer errores de jobs fallidos
   */
  private extractErrors(failedJobs: BatchJob[]): BatchError[] {
    return failedJobs
      .filter((j) => j.error)
      .map((j) => ({
        jobId: j.id,
        asset: j.asset,
        timeframe: j.timeframe,
        message: j.error || 'Unknown error',
        code: 'BACKTEST_FAILED',
        timestamp: j.completedAt || Date.now(),
        retry: j.retries < j.maxRetries,
      }));
  }

  /**
   * Extraer advertencias de jobs completados
   */
  private extractWarnings(completedJobs: BatchJob[]): BatchWarning[] {
    const warnings: BatchWarning[] = [];

    for (const job of completedJobs) {
      if (!job.result) continue;

      // Advertencias por bajo win rate
      if (job.result.metrics.winRate < 45) {
        warnings.push({
          jobId: job.id,
          asset: job.asset,
          timeframe: job.timeframe,
          message: `Low win rate: ${job.result.metrics.winRate.toFixed(1)}%`,
          code: 'LOW_WIN_RATE',
          severity: 'high',
          timestamp: job.completedAt || Date.now(),
        });
      }

      // Advertencias por alto drawdown
      if (job.result.metrics.maxDrawdown > 25) {
        warnings.push({
          jobId: job.id,
          asset: job.asset,
          timeframe: job.timeframe,
          message: `High drawdown: ${job.result.metrics.maxDrawdown.toFixed(1)}%`,
          code: 'HIGH_DRAWDOWN',
          severity: 'high',
          timestamp: job.completedAt || Date.now(),
        });
      }
    }

    return warnings;
  }

  /**
   * Obtener progreso actual del batch
   */
  getProgress(batchId: string): BatchProgress {
    const jobs = Array.from(this.jobQueue.values()).filter((j) => j.batchId === batchId);
    const completedJobs = jobs.filter((j) => j.status === 'completed').length;
    const failedJobs = jobs.filter((j) => j.status === 'failed').length;
    const runningJobs = jobs.filter((j) => j.status === 'running').length;
    const pendingJobs = jobs.filter((j) => j.status === 'pending').length;

    return {
      batchId,
      totalJobs: jobs.length,
      completedJobs,
      failedJobs,
      skippedJobs: 0,
      runningJobs,
      pendingJobs,
      percentComplete: jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0,
      estimatedTimeRemaining: this.estimateTimeRemaining(pendingJobs),
      elapsedTime: Date.now() - this.startTime,
      averageJobDuration:
        this.jobDurations.length > 0
          ? this.jobDurations.reduce((a, b) => a + b, 0) / this.jobDurations.length
          : 0,
      throughput: completedJobs / Math.max((Date.now() - this.startTime) / 1000, 1),
    };
  }

  /**
   * Obtener estadísticas de la queue
   */
  getQueueStats(): BatchQueueStats {
    const allJobs = Array.from(this.jobQueue.values());
    const completedJobs = allJobs.filter((j) => j.status === 'completed');

    return {
      totalQueued: allJobs.filter((j) => j.status === 'pending').length,
      totalRunning: this.activeWorkers,
      totalCompleted: completedJobs.length,
      totalFailed: allJobs.filter((j) => j.status === 'failed').length,
      averageJobDuration:
        this.jobDurations.length > 0
          ? this.jobDurations.reduce((a, b) => a + b, 0) / this.jobDurations.length
          : 0,
      maxConcurrentWorkers: this.maxWorkers,
      currentWorkers: this.activeWorkers,
      queueWaitTime: 0, // Calculado como promedio
    };
  }

  /**
   * Estimar tiempo restante
   */
  private estimateTimeRemaining(pendingJobs: number): number {
    if (this.jobDurations.length === 0) return 0;
    const avgDuration =
      this.jobDurations.reduce((a, b) => a + b, 0) / this.jobDurations.length;
    return (pendingJobs / this.maxWorkers) * avgDuration;
  }

  /**
   * Helper: timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Job timeout')), ms)
    );
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper: generar ID de batch
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener batch completado
   */
  getCompletedBatch(batchId: string): BatchResult | null {
    return this.completedBatches.get(batchId) || null;
  }

  /**
   * Listar todos los batches completados
   */
  listCompletedBatches(): BatchResult[] {
    return Array.from(this.completedBatches.values());
  }
}

// Singleton instance
let batchProcessorInstance: BatchProcessor | null = null;

export async function getBatchProcessor(
  maxWorkers = DEFAULT_MAX_WORKERS
): Promise<BatchProcessor> {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new BatchProcessor(maxWorkers);
  }
  return batchProcessorInstance;
}

export async function resetBatchProcessor(): Promise<void> {
  batchProcessorInstance = null;
}

