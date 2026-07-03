/**
 * Parameter Optimizer Engine
 * Ejecuta optimización de parámetros usando grid search o métodos avanzados
 */

import {
  OptimizationConfig,
  OptimizationCandidate,
  OptimizationResult,
  OptimizationRun,
  OptimizationProgress,
  ParameterRange,
  OptimizationRunResult,
} from './types';
import { BacktestMetrics } from '../../types/backtesting';
import { Asset, Timeframe } from '../../types/marketData';
import { OptimizationScorer } from './scorer';

export class ParameterOptimizer {
  private currentOptimizationId: string | null = null;
  private runQueue: OptimizationRun[] = [];
  private completedRuns: OptimizationRunResult[] = [];
  private failedRuns: OptimizationRun[] = [];
  private progressTracker: Map<string, OptimizationProgress> = new Map();

  /**
   * Generar candidatos (grid search)
   */
  generateCandidates(
    parameterRanges: ParameterRange,
    assets: Asset[],
    timeframes: Timeframe[]
  ): OptimizationCandidate[] {
    const candidates: OptimizationCandidate[] = [];

    // Generar todas las combinaciones
    for (const consensus of parameterRanges.consensusThreshold) {
      for (const confidence of parameterRanges.minConfidenceScore) {
        for (const rr of parameterRanges.minRiskReward) {
          for (const risk of parameterRanges.riskPerTrade) {
            for (const session of parameterRanges.sessionFilter || ['none']) {
              // Crear candidato global
              const candidate: OptimizationCandidate = {
                id: this.generateCandidateId(),
                consensusThreshold: consensus,
                minConfidenceScore: confidence,
                minRiskReward: rr,
                riskPerTrade: risk,
                sessionFilter: session,
              };

              candidates.push(candidate);

              // Opcionalmente, crear variantes por activo/timeframe
              // (comentado para no explotar el espacio de búsqueda)
            }
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Ejecutar optimización completa
   */
  async runOptimization(
    config: OptimizationConfig,
    backtestFn: (candidate: OptimizationCandidate, asset: Asset, tf: Timeframe) => Promise<BacktestMetrics>,
    overfitDetectorFn?: (metrics: BacktestMetrics) => { detected: boolean; severity: string }
  ): Promise<OptimizationResult> {
    const optimizationId = config.id;
    this.currentOptimizationId = optimizationId;

    const startTime = Date.now();
    const candidates = this.generateCandidates(
      config.parameterRanges,
      config.assets,
      config.timeframes
    );

    // Limitar combinaciones si es necesario
    let selectedCandidates = candidates;
    if (config.maxCombinations && candidates.length > config.maxCombinations) {
      selectedCandidates = this.selectDiverseCandidates(candidates, config.maxCombinations);
    }

    this.completedRuns = [];
    this.failedRuns = [];

    const totalRuns = selectedCandidates.length * config.assets.length * config.timeframes.length;
    this.progressTracker.set(optimizationId, {
      optimizationId,
      totalRuns,
      completedRuns: 0,
      failedRuns: 0,
      percentComplete: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      avgRunDuration: 0,
      bestScoreSoFar: 0,
      bestCandidate: null,
    });

    let runDurations: number[] = [];

    // Ejecutar cada combinación en cada activo/timeframe
    for (const candidate of selectedCandidates) {
      for (const asset of config.assets) {
        for (const timeframe of config.timeframes) {
          const runStartTime = Date.now();

          try {
            // Ejecutar backtest con esta configuración
            const metrics = await backtestFn(candidate, asset, timeframe);

            // Detectar sobreajuste
            const overfitData = overfitDetectorFn
              ? overfitDetectorFn(metrics)
              : { detected: false, severity: 'none' };

            // Calcular score
            const scoreBreakdown = OptimizationScorer.calculateScore(
              metrics,
              overfitData.detected,
              overfitData.severity as any
            );

            const result: OptimizationRunResult = {
              candidate,
              asset,
              timeframe,
              metrics,
              score: scoreBreakdown.final,
              scoreBreakdown,
              overfit: {
                detected: overfitData.detected,
                severity: overfitData.severity as any,
                indicators: [],
              },
              warnings: this.generateWarnings(metrics, scoreBreakdown),
            };

            this.completedRuns.push(result);

            // Actualizar progreso
            const duration = Date.now() - runStartTime;
            runDurations.push(duration);
            this.updateProgress(optimizationId, runDurations);
          } catch (error) {
            this.failedRuns.push({
              runId: `run_${Date.now()}_${Math.random()}`,
              optimizationId,
              candidate,
              asset,
              timeframe,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            });

            const duration = Date.now() - runStartTime;
            runDurations.push(duration);
            this.updateProgress(optimizationId, runDurations);
          }
        }
      }
    }

    // Compilar resultados
    const result = this.compileResults(config, optimizationId, startTime);
    return result;
  }

  /**
   * Compilar resultados finales
   */
  private compileResults(
    config: OptimizationConfig,
    optimizationId: string,
    startTime: number
  ): OptimizationResult {
    // Ordenar por score
    const sortedResults = [...this.completedRuns].sort(
      (a, b) => b.score - a.score
    );

    const bestCandidates = sortedResults.slice(0, 10);
    const worstCandidates = sortedResults.slice(-10).reverse();

    // Agrupar por activo
    const perAssetStats = new Map<Asset, any>();
    for (const asset of config.assets) {
      const assetResults = sortedResults.filter((r) => r.asset === asset);
      if (assetResults.length > 0) {
        perAssetStats.set(asset, {
          bestScore: assetResults[0].score,
          averageScore: assetResults.reduce((sum, r) => sum + r.score, 0) / assetResults.length,
          candidates: assetResults.slice(0, 5),
        });
      }
    }

    // Agrupar por timeframe
    const perTimeframeStats = new Map<Timeframe, any>();
    for (const timeframe of config.timeframes) {
      const tfResults = sortedResults.filter((r) => r.timeframe === timeframe);
      if (tfResults.length > 0) {
        perTimeframeStats.set(timeframe, {
          bestScore: tfResults[0].score,
          averageScore: tfResults.reduce((sum, r) => sum + r.score, 0) / tfResults.length,
          candidates: tfResults.slice(0, 5),
        });
      }
    }

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(
      bestCandidates,
      perAssetStats,
      perTimeframeStats
    );

    const now = Date.now();
    return {
      id: optimizationId,
      config,
      totalCombinations: this.completedRuns.length + this.failedRuns.length,
      evaluatedCombinations: this.completedRuns.length,
      bestCandidates,
      worstCandidates,
      allResults: sortedResults,
      perAssetStats,
      perTimeframeStats,
      recommendations,
      startedAt: startTime,
      completedAt: now,
      duration: now - startTime,
    };
  }

  /**
   * Generar recomendaciones
   */
  private generateRecommendations(
    bestCandidates: OptimizationRunResult[],
    perAssetStats: Map<Asset, any>,
    perTimeframeStats: Map<Timeframe, any>
  ): any {
    const assetSpecific = new Map<Asset, OptimizationCandidate>();
    const timeframeSpecific = new Map<Timeframe, OptimizationCandidate>();
    const warnings: string[] = [];

    // Asset-específico
    for (const [asset, stats] of perAssetStats) {
      if (stats.candidates.length > 0) {
        assetSpecific.set(asset, stats.candidates[0].candidate);
      }
    }

    // Timeframe-específico
    for (const [tf, stats] of perTimeframeStats) {
      if (stats.candidates.length > 0) {
        timeframeSpecific.set(tf, stats.candidates[0].candidate);
      }
    }

    // Buscar universal best (top candidate con buen balance)
    let universalBest: OptimizationCandidate | null = null;
    if (bestCandidates.length > 0) {
      const topCandidate = bestCandidates[0];
      if (topCandidate.scoreBreakdown.final >= 70) {
        universalBest = topCandidate.candidate;
      } else {
        warnings.push('No se encontró candidato universal con score >= 70');
      }
    }

    return {
      universalBest,
      assetSpecific,
      timeframeSpecific,
      warnings,
    };
  }

  /**
   * Generar advertencias para un resultado
   */
  private generateWarnings(metrics: BacktestMetrics, score: any): string[] {
    const warnings: string[] = [];

    if (metrics.maxDrawdown > 25) {
      warnings.push(`Alto drawdown (${metrics.maxDrawdown.toFixed(1)}%)`);
    }
    if (metrics.totalTrades < 30) {
      warnings.push(`Pocas operaciones (${metrics.totalTrades})`);
    }
    if (metrics.winRate < 45) {
      warnings.push(`Win rate bajo (${metrics.winRate.toFixed(1)}%)`);
    }
    if (score.overfitPenalty < -25) {
      warnings.push('Posible sobreajuste');
    }

    return warnings;
  }

  /**
   * Actualizar progreso
   */
  private updateProgress(optimizationId: string, durations: number[]): void {
    const progress = this.progressTracker.get(optimizationId);
    if (!progress) return;

    progress.completedRuns = this.completedRuns.length;
    progress.failedRuns = this.failedRuns.length;
    progress.percentComplete =
      ((progress.completedRuns + progress.failedRuns) / progress.totalRuns) * 100;
    progress.avgRunDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    progress.estimatedTimeRemaining =
      (progress.totalRuns - progress.completedRuns) * progress.avgRunDuration;
    progress.elapsedTime = Date.now() - Date.now(); // Será calculado externamente
    progress.bestScoreSoFar = this.completedRuns.length > 0
      ? Math.max(...this.completedRuns.map((r) => r.score))
      : 0;

    if (this.completedRuns.length > 0) {
      const bestRun = this.completedRuns.reduce((best, current) =>
        current.score > best.score ? current : best
      );
      progress.bestCandidate = bestRun.candidate;
    }
  }

  /**
   * Seleccionar candidatos diversos (evitar clones)
   */
  private selectDiverseCandidates(
    candidates: OptimizationCandidate[],
    maxCount: number
  ): OptimizationCandidate[] {
    // Estrategia: tomar cada N-ésimo candidato para mantener diversidad
    const step = Math.ceil(candidates.length / maxCount);
    return candidates.filter((_, i) => i % step === 0).slice(0, maxCount);
  }

  /**
   * Obtener progreso actual
   */
  getProgress(optimizationId: string): OptimizationProgress | null {
    return this.progressTracker.get(optimizationId) || null;
  }

  /**
   * Helper: generar ID único para candidato
   */
  private generateCandidateId(): string {
    return `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let optimizerInstance: ParameterOptimizer | null = null;

export async function getParameterOptimizer(): Promise<ParameterOptimizer> {
  if (!optimizerInstance) {
    optimizerInstance = new ParameterOptimizer();
  }
  return optimizerInstance;
}
