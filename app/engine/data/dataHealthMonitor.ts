/**
 * Monitor de salud de datos
 * Monitorea continuamente la calidad de conexión y datos
 * Registra problemas, latencia, actualizaciones incompletas
 */

import {
  Asset,
  Timeframe,
  DataHealthStatus,
  DataError,
  ConnectionState,
} from '../types/marketData';
import { DataProvider } from './dataProvider';
import { DataValidator } from './dataValidator';

/**
 * Estadísticas de monitoreo
 */
interface MonitoringStats {
  checksPerformed: number;
  errorsDetected: number;
  latencyAvg: number;
  latencyMax: number;
  uptime: number; // %
  lastCheckTime: number;
  lastErrorTime?: number;
}

/**
 * Monitor de salud de datos
 */
export class DataHealthMonitor {
  private provider: DataProvider;
  private validator: DataValidator;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private stats: Map<string, MonitoringStats> = new Map();
  private errorLog: DataError[] = [];
  private maxErrorLog: number = 500;
  private checkInterval: number = 5000; // 5 segundos

  constructor(provider: DataProvider, validator: DataValidator) {
    this.provider = provider;
    this.validator = validator;
    this.initializeStats();
  }

  /**
   * Inicializar estadísticas para todos los activos/temporalidades
   */
  private initializeStats() {
    for (const asset of this.provider.getAssets()) {
      for (const timeframe of this.provider.getTimeframes()) {
        const key = `${asset}-${timeframe}`;
        this.stats.set(key, {
          checksPerformed: 0,
          errorsDetected: 0,
          latencyAvg: 0,
          latencyMax: 0,
          uptime: 100,
          lastCheckTime: Date.now(),
        });
      }
    }
  }

  /**
   * Iniciar monitoreo
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('[DataHealthMonitor] Ya está monitoreando');
      return;
    }

    this.isMonitoring = true;
    console.log('[DataHealthMonitor] Iniciando monitoreo de datos');

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    // Realizar primer check inmediatamente
    this.performHealthCheck();
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('[DataHealthMonitor] Monitoreo detenido');
  }

  /**
   * Realizar verificación de salud
   */
  private async performHealthCheck() {
    try {
      // Verificar salud general del proveedor
      const health = await this.provider.checkHealth();

      // Verificar cada activo/temporalidad
      for (const asset of this.provider.getAssets()) {
        for (const timeframe of this.provider.getTimeframes()) {
          const key = `${asset}-${timeframe}`;
          await this.checkAssetTimeframe(asset, timeframe, key);
        }
      }

      // Registrar estadísticas generales
      this.logHealthMetrics();
    } catch (error) {
      console.error('[DataHealthMonitor] Error en verificación de salud:', error);
    }
  }

  /**
   * Verificar salud de un activo/temporalidad específico
   */
  private async checkAssetTimeframe(asset: Asset, timeframe: Timeframe, key: string) {
    try {
      const stats = this.stats.get(key);
      if (!stats) return;

      // Obtener datos de mercado
      const marketData = await this.provider.getMarketData(asset, timeframe);

      if (!marketData) {
        // Registrar error de conexión
        const error: DataError = {
          timestamp: Date.now(),
          asset,
          timeframe,
          errorType: 'disconnected',
          message: 'No se pudieron obtener datos de mercado',
          severity: 'error',
        };
        this.addError(error);
        stats.errorsDetected++;
        stats.uptime = Math.max(0, stats.uptime - 5);
        return;
      }

      // Validar datos recibidos
      const validation = this.validator.validateMarketData(marketData);

      if (!validation.valid) {
        // Registrar errores de validación
        validation.errors.forEach((error) => this.addError(error));
        stats.errorsDetected += validation.errors.length;
      }

      // Actualizar estadísticas
      stats.checksPerformed++;
      stats.lastCheckTime = Date.now();

      // Registrar latencia
      const latency = marketData.quality.latency;
      const previousAvg = stats.latencyAvg;
      stats.latencyAvg = (previousAvg + latency) / 2;
      stats.latencyMax = Math.max(stats.latencyMax, latency);

      // Verificar problemas de latencia
      const criteria = this.validator.getCriteria(asset);
      if (latency > criteria.maxLatencyMs) {
        const error: DataError = {
          timestamp: Date.now(),
          asset,
          timeframe,
          errorType: 'latency',
          message: `Latencia alta: ${latency}ms > ${criteria.maxLatencyMs}ms`,
          severity: 'warning',
        };
        this.addError(error);
      }

      // Verificar completitud de datos
      if (marketData.quality.completeness < criteria.minCompleteness) {
        const error: DataError = {
          timestamp: Date.now(),
          asset,
          timeframe,
          errorType: 'incomplete',
          message: `Datos incompletos: ${marketData.quality.completeness.toFixed(1)}% < ${criteria.minCompleteness}%`,
          severity: 'warning',
        };
        this.addError(error);
      }

      // Verificar frescura de datos
      if (marketData.quality.freshness > criteria.maxFreshnessMs) {
        const error: DataError = {
          timestamp: Date.now(),
          asset,
          timeframe,
          errorType: 'delayed',
          message: `Datos retrasados: ${marketData.quality.freshness}ms > ${criteria.maxFreshnessMs}ms`,
          severity: 'warning',
        };
        this.addError(error);
      }

      // Aumentar uptime si todo está bien
      if (validation.valid && latency < criteria.maxLatencyMs) {
        stats.uptime = Math.min(100, stats.uptime + 2);
      }
    } catch (error) {
      console.error(`[DataHealthMonitor] Error verificando ${asset}/${timeframe}:`, error);
      const stats = this.stats.get(key);
      if (stats) {
        stats.errorsDetected++;
        stats.uptime = Math.max(0, stats.uptime - 10);
      }
    }
  }

  /**
   * Registrar error
   */
  private addError(error: DataError) {
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxErrorLog) {
      this.errorLog.shift();
    }
  }

  /**
   * Registrar métricas de salud
   */
  private logHealthMetrics() {
    const assetErrors = new Map<Asset, number>();
    let totalLatency = 0;
    let maxLatency = 0;

    for (const asset of this.provider.getAssets()) {
      assetErrors.set(asset, 0);
    }

    this.stats.forEach((stats, key) => {
      const asset = key.split('-')[0] as Asset;
      const currentErrors = assetErrors.get(asset) || 0;
      assetErrors.set(asset, currentErrors + stats.errorsDetected);
      totalLatency += stats.latencyAvg;
      maxLatency = Math.max(maxLatency, stats.latencyMax);
    });

    // Podría emitir evento o log aquí
    // console.log('[DataHealthMonitor] Métricas:', { assetErrors, totalLatency, maxLatency });
  }

  /**
   * Obtener estado de salud general
   */
  async getHealthStatus(): Promise<DataHealthStatus> {
    return this.provider.getHealthStatus();
  }

  /**
   * Obtener estadísticas de un activo/temporalidad
   */
  getStats(asset: Asset, timeframe: Timeframe): MonitoringStats | null {
    const key = `${asset}-${timeframe}`;
    return this.stats.get(key) || null;
  }

  /**
   * Obtener estado de conexión
   */
  async getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState> {
    return this.provider.getConnectionState(asset, timeframe);
  }

  /**
   * Obtener errores recientes
   */
  getRecentErrors(limit: number = 20): DataError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Obtener total de errores registrados
   */
  getTotalErrors(): number {
    return this.errorLog.length;
  }

  /**
   * Obtener resumen de errores por tipo
   */
  getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    this.errorLog.forEach((error) => {
      const key = `${error.errorType}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  /**
   * Obtener resumen de errores por activo
   */
  getErrorsByAsset(): Record<Asset, number> {
    const summary: Record<Asset, number> = {} as Record<Asset, number>;

    this.provider.getAssets().forEach((asset) => {
      summary[asset] = 0;
    });

    this.errorLog.forEach((error) => {
      if (error.asset in summary) {
        summary[error.asset]++;
      }
    });

    return summary;
  }

  /**
   * Obtener latencia promedio
   */
  getAverageLatency(): number {
    let totalLatency = 0;
    let count = 0;

    this.stats.forEach((stats) => {
      if (stats.latencyAvg > 0) {
        totalLatency += stats.latencyAvg;
        count++;
      }
    });

    return count > 0 ? totalLatency / count : 0;
  }

  /**
   * Obtener latencia máxima
   */
  getMaxLatency(): number {
    let max = 0;

    this.stats.forEach((stats) => {
      max = Math.max(max, stats.latencyMax);
    });

    return max;
  }

  /**
   * Obtener uptime promedio
   */
  getAverageUptime(): number {
    let totalUptime = 0;
    let count = 0;

    this.stats.forEach((stats) => {
      totalUptime += stats.uptime;
      count++;
    });

    return count > 0 ? totalUptime / count : 0;
  }

  /**
   * Resetear estadísticas
   */
  reset() {
    this.stats.clear();
    this.errorLog = [];
    this.initializeStats();
  }

  /**
   * Obtener estado de monitoreo
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Configurar intervalo de verificación
   */
  setCheckInterval(intervalMs: number) {
    this.checkInterval = intervalMs;
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}

/**
 * Instancia global del monitor
 */
let monitorInstance: DataHealthMonitor | null = null;

export function getDataHealthMonitor(
  provider: DataProvider,
  validator: DataValidator
): DataHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new DataHealthMonitor(provider, validator);
  }
  return monitorInstance;
}

export default DataHealthMonitor;
