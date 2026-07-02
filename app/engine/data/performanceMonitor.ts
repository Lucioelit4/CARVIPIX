/**
 * Métricas de Performance del Sistema de Datos
 * Mide velocidad, eficiencia y uso de recursos
 */

import { Asset, Timeframe } from '../types/marketData';

export interface OperationMetric {
  name: string;
  duration: number; // ms
  timestamp: number;
  success: boolean;
  asset?: Asset;
  timeframe?: Timeframe;
}

export interface PerformanceStats {
  operationsTotal: number;
  operationsSuccessful: number;
  operationsFailed: number;
  avgOperationTime: number; // ms
  maxOperationTime: number; // ms
  minOperationTime: number; // ms
  p95OperationTime: number; // ms
  p99OperationTime: number; // ms
  successRate: number; // %
  throughput: number; // ops/sec
  lastMeasurement: number;
}

export interface ComponentPerformance {
  component: string;
  avgTime: number;
  totalCalls: number;
  failureRate: number; // %
}

/**
 * Registrador de métricas de performance
 */
export class PerformanceMonitor {
  private metrics: OperationMetric[] = [];
  private maxMetrics: number = 10000;
  private componentMetrics: Map<string, OperationMetric[]> = new Map();
  private startTime: number = Date.now();
  private uptime: number = 0;

  /**
   * Registrar operación
   */
  recordOperation(options: {
    name: string;
    duration: number;
    success: boolean;
    asset?: Asset;
    timeframe?: Timeframe;
  }): void {
    const metric: OperationMetric = {
      name: options.name,
      duration: options.duration,
      timestamp: Date.now(),
      success: options.success,
      asset: options.asset,
      timeframe: options.timeframe,
    };

    this.metrics.push(metric);

    // Mantener límite
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Guardar por componente
    const key = options.name;
    if (!this.componentMetrics.has(key)) {
      this.componentMetrics.set(key, []);
    }
    this.componentMetrics.get(key)!.push(metric);

    // Limitar por componente
    const componentOps = this.componentMetrics.get(key)!;
    if (componentOps.length > 1000) {
      componentOps.shift();
    }
  }

  /**
   * Medir operación con temporizador
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    asset?: Asset,
    timeframe?: Timeframe
  ): Promise<T> {
    const start = performance.now();
    let success = false;

    try {
      const result = await operation();
      success = true;
      return result;
    } finally {
      const duration = performance.now() - start;
      this.recordOperation({
        name,
        duration,
        success,
        asset,
        timeframe,
      });
    }
  }

  /**
   * Medir operación síncrona
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    asset?: Asset,
    timeframe?: Timeframe
  ): T {
    const start = performance.now();
    let success = false;

    try {
      const result = operation();
      success = true;
      return result;
    } finally {
      const duration = performance.now() - start;
      this.recordOperation({
        name,
        duration,
        success,
        asset,
        timeframe,
      });
    }
  }

  /**
   * Obtener estadísticas generales
   */
  getStats(): PerformanceStats {
    const successful = this.metrics.filter((m) => m.success);
    const durations = successful.map((m) => m.duration).sort((a, b) => a - b);

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgTime = this.metrics.length > 0 ? totalDuration / this.metrics.length : 0;

    const successRate =
      this.metrics.length > 0 ? (successful.length / this.metrics.length) * 100 : 0;

    // Calcular percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95 = durations[p95Index] || 0;
    const p99 = durations[p99Index] || 0;

    // Uptime
    this.uptime = Date.now() - this.startTime;

    // Throughput (ops/sec)
    const uptimeSeconds = this.uptime / 1000;
    const throughput = uptimeSeconds > 0 ? this.metrics.length / uptimeSeconds : 0;

    return {
      operationsTotal: this.metrics.length,
      operationsSuccessful: successful.length,
      operationsFailed: this.metrics.length - successful.length,
      avgOperationTime: avgTime,
      maxOperationTime: durations.length > 0 ? durations[durations.length - 1] : 0,
      minOperationTime: durations.length > 0 ? durations[0] : 0,
      p95OperationTime: p95,
      p99OperationTime: p99,
      successRate,
      throughput,
      lastMeasurement: Date.now(),
    };
  }

  /**
   * Obtener performance por componente
   */
  getComponentPerformance(): ComponentPerformance[] {
    const results: ComponentPerformance[] = [];

    this.componentMetrics.forEach((metrics, component) => {
      const successful = metrics.filter((m) => m.success);
      const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
      const avgTime = metrics.length > 0 ? totalTime / metrics.length : 0;
      const failureRate =
        metrics.length > 0 ? ((metrics.length - successful.length) / metrics.length) * 100 : 0;

      results.push({
        component,
        avgTime,
        totalCalls: metrics.length,
        failureRate,
      });
    });

    return results.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Obtener operaciones lentas
   */
  getSlowOperations(thresholdMs: number = 1000, limit: number = 20): OperationMetric[] {
    return this.metrics
      .filter((m) => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Obtener operaciones fallidas
   */
  getFailedOperations(limit: number = 20): OperationMetric[] {
    return this.metrics.filter((m) => !m.success).slice(-limit);
  }

  /**
   * Obtener tendencia de performance
   */
  getPerformanceTrend(windowMs: number = 60000): {
    timestamp: number;
    avgTime: number;
    successRate: number;
  }[] {
    const now = Date.now();
    const cutoff = now - windowMs;

    const recent = this.metrics.filter((m) => m.timestamp > cutoff);

    if (recent.length === 0) {
      return [];
    }

    // Dividir en 10 ventanas
    const windows = 10;
    const windowSize = windowMs / windows;
    const result: { timestamp: number; avgTime: number; successRate: number }[] = [];

    for (let i = 0; i < windows; i++) {
      const windowStart = cutoff + i * windowSize;
      const windowEnd = windowStart + windowSize;
      const windowMetrics = recent.filter(
        (m) => m.timestamp >= windowStart && m.timestamp < windowEnd
      );

      if (windowMetrics.length === 0) continue;

      const successful = windowMetrics.filter((m) => m.success);
      const totalTime = windowMetrics.reduce((sum, m) => sum + m.duration, 0);
      const avgTime = totalTime / windowMetrics.length;
      const successRate = (successful.length / windowMetrics.length) * 100;

      result.push({
        timestamp: windowStart,
        avgTime,
        successRate,
      });
    }

    return result;
  }

  /**
   * Obtener health check
   */
  getHealthCheck(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar tasa de éxito
    if (stats.successRate < 95) {
      issues.push(`Tasa de éxito baja: ${stats.successRate.toFixed(1)}%`);
      recommendations.push('Revisar errores recientes en operaciones');
    }

    // Verificar latencia p95
    if (stats.p95OperationTime > 500) {
      issues.push(`Latencia P95 alta: ${stats.p95OperationTime.toFixed(0)}ms`);
      recommendations.push('Optimizar operaciones lentas');
    }

    // Verificar latencia promedio
    if (stats.avgOperationTime > 200) {
      issues.push(`Latencia promedio elevada: ${stats.avgOperationTime.toFixed(0)}ms`);
      recommendations.push('Revisar performance de componentes');
    }

    // Verificar operaciones fallidas recientes
    const recentFailures = this.getFailedOperations(10);
    if (recentFailures.length > 0) {
      issues.push(`${recentFailures.length} operaciones recientes fallidas`);
      recommendations.push('Investigar causa de fallos');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Obtener resumen para logging
   */
  getSummary(): string {
    const stats = this.getStats();
    const componentPerf = this.getComponentPerformance().slice(0, 5);

    let summary = `
[Performance Summary]
Total Operations: ${stats.operationsTotal}
Success Rate: ${stats.successRate.toFixed(1)}%
Avg Time: ${stats.avgOperationTime.toFixed(2)}ms
P95 Time: ${stats.p95OperationTime.toFixed(2)}ms
P99 Time: ${stats.p99OperationTime.toFixed(2)}ms
Throughput: ${stats.throughput.toFixed(2)} ops/sec

Top Components:`;

    componentPerf.forEach((comp) => {
      summary += `
  ${comp.component}: ${comp.totalCalls} calls, ${comp.avgTime.toFixed(2)}ms avg`;
    });

    return summary;
  }

  /**
   * Resetear métricas
   */
  reset() {
    this.metrics = [];
    this.componentMetrics.clear();
    this.startTime = Date.now();
    this.uptime = 0;
  }

  /**
   * Obtener uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Instancia global
 */
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

export default PerformanceMonitor;
