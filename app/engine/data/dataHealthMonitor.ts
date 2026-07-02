/**
 * Monitor de salud de datos
 * Monitorea continuamente la calidad de conexión y datos
 * Registra problemas, latencia, actualizaciones incompletas
 * Incluye sistema de alertas y recuperación automática
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
import { DataAlertManager, getDataAlertManager } from './dataAlertManager';
import { PerformanceMonitor, getPerformanceMonitor } from './performanceMonitor';

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
  private alertManager: DataAlertManager;
  private performanceMonitor: PerformanceMonitor;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private stats: Map<string, MonitoringStats> = new Map();
  private errorLog: DataError[] = [];
  private maxErrorLog: number = 500;
  private checkInterval: number = 5000; // 5 segundos
  private disconnectionTimeouts: Map<string, number> = new Map(); // Tracking de desconexiones

  constructor(provider: DataProvider, validator: DataValidator) {
    this.provider = provider;
    this.validator = validator;
    this.alertManager = getDataAlertManager();
    this.performanceMonitor = getPerformanceMonitor();
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

      // Medir performance
      const marketData = await this.performanceMonitor.measureAsync(
        `getMarketData[${asset}/${timeframe}]`,
        () => this.provider.getMarketData(asset, timeframe),
        asset,
        timeframe
      );

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

        // Crear alerta de desconexión
        const disconnectKey = key;
        const previousDisconnectTime = this.disconnectionTimeouts.get(disconnectKey);
        
        if (!previousDisconnectTime || Date.now() - previousDisconnectTime > 30000) {
          // Solo alertar cada 30 segundos por desconexión
          this.alertManager.createAlert({
            asset,
            timeframe,
            level: 'error',
            title: 'Desconexión de Datos',
            message: `Imposible obtener datos para ${asset}/${timeframe}. Reintentando recuperación...`,
            actionRequired: true,
          });

          this.disconnectionTimeouts.set(disconnectKey, Date.now());

          // Intentar recuperación automática
          const canRetry = this.alertManager.recordRecoveryAttempt(asset, timeframe);
          if (canRetry) {
            console.log(
              `[DataHealthMonitor] Intentando recuperar conexión para ${asset}/${timeframe}`
            );
          } else {
            // Máximo de intentos alcanzado
            this.alertManager.createAlert({
              asset,
              timeframe,
              level: 'critical',
              title: 'Fallo Crítico de Conexión',
              message: `${asset}/${timeframe} no se recupera después de múltiples intentos`,
              actionRequired: true,
            });
          }
        }
        return;
      }

      // Conexión recuperada
      if (this.disconnectionTimeouts.has(key)) {
        this.disconnectionTimeouts.delete(key);
        this.alertManager.resetRecoveryAttempts(asset, timeframe);
        this.alertManager.createAlert({
          asset,
          timeframe,
          level: 'info',
          title: 'Conexión Recuperada',
          message: `Datos de ${asset}/${timeframe} recuperados exitosamente`,
          actionRequired: false,
        });
      }

      // Validar datos recibidos
      const validation = this.validator.validateMarketData(marketData);

      if (!validation.valid) {
        // Registrar errores de validación
        validation.errors.forEach((error) => this.addError(error));
        stats.errorsDetected += validation.errors.length;

        // Crear alertas por errores críticos de validación
        const criticalErrors = validation.errors.filter((e) => e.severity === 'error');
        if (criticalErrors.length > 0) {
          this.alertManager.createAlert({
            asset,
            timeframe,
            level: 'warning',
            title: 'Errores de Validación',
            message: `${criticalErrors.length} errores de validación en datos de ${asset}/${timeframe}`,
            actionRequired: false,
          });
        }
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

        // Alerta de latencia
        this.alertManager.createAlert({
          asset,
          timeframe,
          level: 'warning',
          title: 'Latencia Elevada',
          message: `Latencia: ${latency}ms (umbral: ${criteria.maxLatencyMs}ms)`,
          actionRequired: false,
        });
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

        // Alerta de incompletitud
        this.alertManager.createAlert({
          asset,
          timeframe,
          level: 'warning',
          title: 'Datos Incompletos',
          message: `Completitud: ${marketData.quality.completeness.toFixed(1)}% (mínimo: ${criteria.minCompleteness}%)`,
          actionRequired: false,
        });
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

        // Alerta de retraso
        this.alertManager.createAlert({
          asset,
          timeframe,
          level: 'warning',
          title: 'Datos Retrasados',
          message: `Retraso: ${marketData.quality.freshness}ms (máximo: ${criteria.maxFreshnessMs}ms)`,
          actionRequired: false,
        });
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

      // Crear alerta de excepción
      this.alertManager.createAlert({
        asset,
        timeframe,
        level: 'error',
        title: 'Excepción en Monitoreo',
        message: `Error al verificar datos de ${asset}/${timeframe}`,
        actionRequired: true,
      });
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

  /**
   * Obtener estadísticas de alertas
   */
  getAlertStats() {
    return this.alertManager.getStats();
  }

  /**
   * Obtener alertas recientes
   */
  getRecentAlerts(limit: number = 20) {
    return this.alertManager.getRecentAlerts(limit);
  }

  /**
   * Obtener alertas críticas sin resolver
   */
  getCriticalAlerts() {
    const stats = this.alertManager.getStats();
    return stats.criticalAlerts;
  }

  /**
   * Obtener estadísticas de performance
   */
  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }

  /**
   * Obtener performance por componente
   */
  getComponentPerformance() {
    return this.performanceMonitor.getComponentPerformance();
  }

  /**
   * Obtener operaciones lentas
   */
  getSlowOperations(thresholdMs: number = 1000) {
    return this.performanceMonitor.getSlowOperations(thresholdMs);
  }

  /**
   * Obtener health check completo
   */
  getHealthCheck() {
    return this.performanceMonitor.getHealthCheck();
  }

  /**
   * Obtener resumen de performance
   */
  getPerformanceSummary(): string {
    return this.performanceMonitor.getSummary();
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
