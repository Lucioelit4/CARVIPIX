/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Análisis de rendimiento del motor de backtesting
 * Monitorea velocidad, eficiencia y escalabilidad
 * USO EXCLUSIVO: Admin - NO exponer al cliente
 */

/**
 * Estadísticas de rendimiento
 */
export interface PerformanceStats {
  // Tiempo
  totalExecutionTime: number; // ms
  candlesProcessed: number;
  candlesPerSecond: number;
  averageTimePerCandle: number; // ms
  
  // Agentes
  totalAgentCalls: number;
  agentCallsPerCandle: number;
  averageAgentTime: number; // ms
  
  // Consenso
  consensusEvaluations: number;
  consensusApprovals: number;
  approvalRate: number; // %
  
  // Memoria
  estimatedMemoryUsage: number; // MB (estimado)
  peakMemoryUsage: number; // MB (máximo)
  
  // Trading
  totalTradesSimulated: number;
  tradesPerCandle: number;
  
  // Eficiencia
  cpuEfficiency: number; // 0-100, qué tan bien se usa el CPU
  scalabilityScore: number; // 0-100, qué tan bien escala
}

/**
 * Estadísticas por activo
 */
export interface AssetPerformanceStats {
  asset: string;
  timeframe: string;
  candidatesProcessed: number;
  executionTime: number;
  tradesGenerated: number;
  avgMetricsPerTrade: Record<string, number>;
}

/**
 * Reporte de rendimiento agregado
 */
export interface PerformanceReport {
  timestamp: number;
  totalBacktests: number;
  
  // Rendimiento general
  globalStats: PerformanceStats;
  
  // Por activo
  assetStats: AssetPerformanceStats[];
  
  // Bottlenecks detectados
  bottlenecks: string[];
  
  // Recomendaciones
  recommendations: string[];
  
  // Salud del sistema
  systemHealth: 'good' | 'fair' | 'poor';
}

/**
 * Tracker de rendimiento en tiempo real
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private candlesProcessed: number = 0;
  private agentCallsTotal: number = 0;
  private consensusEvaluationsTotal: number = 0;
  private consensusApprovalsTotal: number = 0;
  private tradesSimulatedTotal: number = 0;
  private assetStats: Map<string, AssetPerformanceStats> = new Map();
  private startMemory: number = 0;

  constructor() {
    this.startTime = Date.now();
    this.startMemory = this.getEstimatedMemory();
  }

  /**
   * Registrar procesamiento de vela
   */
  recordCandleProcessed(
    asset: string,
    timeframe: string,
    agentCallsInThisCandle: number,
    consensusEvaluated: boolean,
    consensusApproved: boolean,
    tradesGenerated: number
  ): void {
    this.candlesProcessed++;
    this.agentCallsTotal += agentCallsInThisCandle;
    
    if (consensusEvaluated) {
      this.consensusEvaluationsTotal++;
      if (consensusApproved) {
        this.consensusApprovalsTotal++;
      }
    }

    this.tradesSimulatedTotal += tradesGenerated;

    // Registrar por activo
    const key = `${asset}_${timeframe}`;
    const existing = this.assetStats.get(key) || {
      asset,
      timeframe,
      candidatesProcessed: 0,
      executionTime: 0,
      tradesGenerated: 0,
      avgMetricsPerTrade: {},
    };

    existing.candidatesProcessed++;
    existing.tradesGenerated += tradesGenerated;

    this.assetStats.set(key, existing);
  }

  /**
   * Obtener estadísticas actuales
   */
  getCurrentStats(): PerformanceStats {
    const elapsedMs = Date.now() - this.startTime;
    const elapsedSeconds = elapsedMs / 1000;

    const candlesPerSecond = this.candlesProcessed / elapsedSeconds;
    const avgTimePerCandle = this.candlesProcessed > 0 ? elapsedMs / this.candlesProcessed : 0;
    const agentCallsPerCandle = this.candlesProcessed > 0 ? this.agentCallsTotal / this.candlesProcessed : 0;
    const avgAgentTime = this.agentCallsTotal > 0 ? elapsedMs / this.agentCallsTotal : 0;
    const tradesPerCandle = this.candlesProcessed > 0 ? this.tradesSimulatedTotal / this.candlesProcessed : 0;
    const approvalRate = this.consensusEvaluationsTotal > 0
      ? (this.consensusApprovalsTotal / this.consensusEvaluationsTotal) * 100
      : 0;

    // Estimación de eficiencia
    const cpuEfficiency = this.estimateCPUEfficiency(avgTimePerCandle);
    const scalabilityScore = this.estimateScalability(candlesPerSecond);

    const currentMemory = this.getEstimatedMemory();
    const memoryUsed = currentMemory - this.startMemory;

    return {
      totalExecutionTime: elapsedMs,
      candlesProcessed: this.candlesProcessed,
      candlesPerSecond: candlesPerSecond,
      averageTimePerCandle: avgTimePerCandle,
      totalAgentCalls: this.agentCallsTotal,
      agentCallsPerCandle: agentCallsPerCandle,
      averageAgentTime: avgAgentTime,
      consensusEvaluations: this.consensusEvaluationsTotal,
      consensusApprovals: this.consensusApprovalsTotal,
      approvalRate,
      estimatedMemoryUsage: memoryUsed,
      peakMemoryUsage: Math.max(currentMemory - this.startMemory, 0),
      totalTradesSimulated: this.tradesSimulatedTotal,
      tradesPerCandle,
      cpuEfficiency,
      scalabilityScore,
    };
  }

  /**
   * Generar reporte completo
   */
  generateReport(): PerformanceReport {
    const stats = this.getCurrentStats();
    const bottlenecks = this.detectBottlenecks(stats);
    const recommendations = this.generateRecommendations(stats, bottlenecks);
    const health = this.assessSystemHealth(stats, bottlenecks);

    return {
      timestamp: Date.now(),
      totalBacktests: 1,
      globalStats: stats,
      assetStats: Array.from(this.assetStats.values()),
      bottlenecks,
      recommendations,
      systemHealth: health,
    };
  }

  /**
   * Detectar bottlenecks
   */
  private detectBottlenecks(stats: PerformanceStats): string[] {
    const bottlenecks: string[] = [];

    // Velas por segundo muy baja
    if (stats.candlesPerSecond < 100) {
      bottlenecks.push(
        `Baja velocidad de procesamiento: ${stats.candlesPerSecond.toFixed(0)} velas/s`
      );
    }

    // Tiempo promedio por vela alto
    if (stats.averageTimePerCandle > 10) {
      bottlenecks.push(
        `Tiempo promedio por vela alto: ${stats.averageTimePerCandle.toFixed(2)}ms`
      );
    }

    // Muchas llamadas a agentes
    if (stats.agentCallsPerCandle > 15) {
      bottlenecks.push(
        `Demasiadas llamadas a agentes por vela: ${stats.agentCallsPerCandle.toFixed(1)}`
      );
    }

    // Bajo approval rate
    if (stats.approvalRate < 20) {
      bottlenecks.push(
        `Tasa de aprobación baja: ${stats.approvalRate.toFixed(1)}%`
      );
    }

    // Uso de memoria alto
    if (stats.estimatedMemoryUsage > 500) {
      bottlenecks.push(
        `Uso de memoria alto: ${stats.estimatedMemoryUsage.toFixed(0)}MB`
      );
    }

    return bottlenecks;
  }

  /**
   * Generar recomendaciones
   */
  private generateRecommendations(stats: PerformanceStats, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length === 0) {
      recommendations.push('✓ Rendimiento óptimo - sin cuellos de botella detectados');
      return recommendations;
    }

    if (bottlenecks.some((b) => b.includes('velas/s'))) {
      recommendations.push('Optimizar: Caching de resultados de agentes, paralelización de evaluaciones');
    }

    if (bottlenecks.some((b) => b.includes('agentes'))) {
      recommendations.push('Simplificar: Reducir número de agentes o ejecutar en paralelo');
    }

    if (bottlenecks.some((b) => b.includes('memoria'))) {
      recommendations.push('Memoria: Implementar garbage collection, estructuras más compactas');
    }

    if (bottlenecks.some((b) => b.includes('aprobación baja'))) {
      recommendations.push('Estrategia: Revisar configuración de consenso o filtros de entrada');
    }

    return recommendations;
  }

  /**
   * Evaluar salud del sistema
   */
  private assessSystemHealth(
    stats: PerformanceStats,
    bottlenecks: string[]
  ): 'good' | 'fair' | 'poor' {
    let healthScore = 100;

    // Penalizar por cada bottleneck
    healthScore -= bottlenecks.length * 20;

    // Penalizar por velocidad baja
    if (stats.candlesPerSecond < 50) healthScore -= 30;
    if (stats.candlesPerSecond < 100) healthScore -= 15;

    // Bonificar por buen rendimiento
    if (stats.scalabilityScore > 80) healthScore += 10;

    if (healthScore >= 70) return 'good';
    if (healthScore >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Estimar eficiencia de CPU
   */
  private estimateCPUEfficiency(avgTimePerCandle: number): number {
    // Benchmark: 1ms por vela es excelente, 20ms es pobre
    const optimalTime = 1;
    const maxTime = 20;

    if (avgTimePerCandle <= optimalTime) return 100;
    if (avgTimePerCandle >= maxTime) return 0;

    return 100 - ((avgTimePerCandle - optimalTime) / (maxTime - optimalTime)) * 100;
  }

  /**
   * Estimar scalability
   */
  private estimateScalability(candlesPerSecond: number): number {
    // Benchmark: 1000 velas/s es excelente, 10 velas/s es pobre
    const excellent = 1000;
    const poor = 10;

    if (candlesPerSecond >= excellent) return 100;
    if (candlesPerSecond <= poor) return 0;

    return ((candlesPerSecond - poor) / (excellent - poor)) * 100;
  }

  /**
   * Obtener memoria estimada
   */
  private getEstimatedMemory(): number {
    // En JavaScript, no hay acceso directo a memoria
    // Esta es una estimación basada en objetos
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return ((performance as any).memory.usedJSHeapSize || 0) / 1024 / 1024; // MB
    }
    return 0;
  }
}

/**
 * Comparar múltiples reportes de rendimiento
 */
export function comparePerformanceReports(
  reports: PerformanceReport[]
): { improvements: string[]; regressions: string[] } {
  if (reports.length < 2) {
    return { improvements: [], regressions: [] };
  }

  const improvements: string[] = [];
  const regressions: string[] = [];

  const latest = reports[reports.length - 1];
  const previous = reports[reports.length - 2];

  // Comparar velas por segundo
  const cpsDiff = latest.globalStats.candlesPerSecond - previous.globalStats.candlesPerSecond;
  if (cpsDiff > 100) {
    improvements.push(
      `+${cpsDiff.toFixed(0)} velas/s (${((cpsDiff / previous.globalStats.candlesPerSecond) * 100).toFixed(1)}% mejor)`
    );
  } else if (cpsDiff < -100) {
    regressions.push(
      `${cpsDiff.toFixed(0)} velas/s (${((cpsDiff / previous.globalStats.candlesPerSecond) * 100).toFixed(1)}% peor)`
    );
  }

  // Comparar aprobación
  const appDiff = latest.globalStats.approvalRate - previous.globalStats.approvalRate;
  if (appDiff > 5) {
    improvements.push(`+${appDiff.toFixed(1)}pp tasa de aprobación`);
  } else if (appDiff < -5) {
    regressions.push(`${appDiff.toFixed(1)}pp tasa de aprobación`);
  }

  // Comparar memoria
  const memDiff = latest.globalStats.estimatedMemoryUsage - previous.globalStats.estimatedMemoryUsage;
  if (memDiff < -50) {
    improvements.push(`-${Math.abs(memDiff).toFixed(0)}MB memoria`);
  } else if (memDiff > 50) {
    regressions.push(`+${memDiff.toFixed(0)}MB memoria`);
  }

  return { improvements, regressions };
}

