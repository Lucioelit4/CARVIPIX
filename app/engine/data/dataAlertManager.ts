/**
 * Gestor de Alertas de Datos
 * Dispara alertas cuando hay problemas de conexión o calidad
 * Sistema de recuperación automática
 */

import { Asset, Timeframe, DataError } from '../types/marketData';

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface DataAlert {
  id: string;
  timestamp: number;
  level: AlertLevel;
  asset: Asset;
  timeframe?: Timeframe;
  title: string;
  message: string;
  actionRequired: boolean;
  recoveryAttempt?: boolean;
  recoveredAt?: number;
}

export interface AlertStats {
  totalAlerts: number;
  alertsByLevel: Record<AlertLevel, number>;
  alertsByAsset: Record<Asset, number>;
  criticalAlerts: DataAlert[];
  unresolvedAlerts: DataAlert[];
  lastAlert?: DataAlert;
}

/**
 * Gestor de alertas
 */
export class DataAlertManager {
  private alerts: DataAlert[] = [];
  private maxAlerts: number = 1000;
  private listeners: Map<string, (alert: DataAlert) => void> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRecoveryAttempts: number = 3;

  /**
   * Crear alerta
   */
  createAlert(options: {
    asset: Asset;
    timeframe?: Timeframe;
    level: AlertLevel;
    title: string;
    message: string;
    actionRequired?: boolean;
  }): DataAlert {
    const alert: DataAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level: options.level,
      asset: options.asset,
      timeframe: options.timeframe,
      title: options.title,
      message: options.message,
      actionRequired: options.actionRequired ?? false,
    };

    this.alerts.push(alert);

    // Mantener límite de alertas
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    // Notificar listeners
    this.notifyListeners(alert);

    // Logging según nivel
    this.logAlert(alert);

    return alert;
  }

  /**
   * Marcar alerta como recuperada
   */
  markAsRecovered(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.recoveredAt = Date.now();
    alert.recoveryAttempt = true;

    this.logInfo(`Alerta ${alertId} marcada como recuperada`);
    return true;
  }

  /**
   * Registrar intento de recuperación
   */
  recordRecoveryAttempt(asset: Asset, timeframe: Timeframe): boolean {
    const key = `${asset}-${timeframe}`;
    const attempts = (this.recoveryAttempts.get(key) || 0) + 1;
    this.recoveryAttempts.set(key, attempts);

    if (attempts >= this.maxRecoveryAttempts) {
      this.logError(
        `Máximo de intentos de recuperación alcanzados para ${asset}/${timeframe}`
      );
      return false;
    }

    this.logInfo(`Intento de recuperación ${attempts}/${this.maxRecoveryAttempts} para ${asset}/${timeframe}`);
    return true;
  }

  /**
   * Resetear intentos de recuperación
   */
  resetRecoveryAttempts(asset: Asset, timeframe: Timeframe) {
    const key = `${asset}-${timeframe}`;
    this.recoveryAttempts.delete(key);
    this.logInfo(`Intentos de recuperación resetados para ${asset}/${timeframe}`);
  }

  /**
   * Suscribirse a alertas
   */
  subscribe(id: string, callback: (alert: DataAlert) => void) {
    this.listeners.set(id, callback);
  }

  /**
   * Desuscribirse de alertas
   */
  unsubscribe(id: string) {
    this.listeners.delete(id);
  }

  /**
   * Notificar a listeners
   */
  private notifyListeners(alert: DataAlert) {
    this.listeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[DataAlertManager] Error en listener:', error);
      }
    });
  }

  /**
   * Obtener estadísticas
   */
  getStats(): AlertStats {
    const stats: AlertStats = {
      totalAlerts: this.alerts.length,
      alertsByLevel: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      alertsByAsset: {} as Record<Asset, number>,
      criticalAlerts: [],
      unresolvedAlerts: [],
    };

    for (const alert of this.alerts) {
      // Contar por nivel
      stats.alertsByLevel[alert.level]++;

      // Contar por activo
      if (!(alert.asset in stats.alertsByAsset)) {
        stats.alertsByAsset[alert.asset] = 0;
      }
      stats.alertsByAsset[alert.asset]++;

      // Alertas críticas
      if (alert.level === 'critical') {
        stats.criticalAlerts.push(alert);
      }

      // Alertas sin resolver
      if (!alert.recoveredAt && alert.actionRequired) {
        stats.unresolvedAlerts.push(alert);
      }
    }

    if (this.alerts.length > 0) {
      stats.lastAlert = this.alerts[this.alerts.length - 1];
    }

    return stats;
  }

  /**
   * Obtener alertas recientes
   */
  getRecentAlerts(limit: number = 20): DataAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Obtener alertas por asset
   */
  getAlertsByAsset(asset: Asset): DataAlert[] {
    return this.alerts.filter((a) => a.asset === asset);
  }

  /**
   * Obtener alertas por nivel
   */
  getAlertsByLevel(level: AlertLevel): DataAlert[] {
    return this.alerts.filter((a) => a.level === level);
  }

  /**
   * Limpiar alertas antiguas
   */
  clearOldAlerts(olderThanMs: number = 86400000): number {
    const before = this.alerts.length;
    const cutoff = Date.now() - olderThanMs;
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff);
    const removed = before - this.alerts.length;

    if (removed > 0) {
      this.logInfo(`${removed} alertas antiguas eliminadas`);
    }

    return removed;
  }

  /**
   * Resetear todas las alertas
   */
  reset() {
    this.alerts = [];
    this.listeners.clear();
    this.recoveryAttempts.clear();
  }

  /**
   * Logging por nivel
   */
  private logAlert(alert: DataAlert) {
    const timestamp = new Date(alert.timestamp).toISOString();
    const prefix = `[DataAlert] [${alert.level.toUpperCase()}] ${timestamp}`;

    switch (alert.level) {
      case 'critical':
        console.error(
          `${prefix} ${alert.asset}${alert.timeframe ? '/' + alert.timeframe : ''} - ${alert.title}: ${alert.message}`
        );
        break;
      case 'error':
        console.error(
          `${prefix} ${alert.asset}${alert.timeframe ? '/' + alert.timeframe : ''} - ${alert.title}: ${alert.message}`
        );
        break;
      case 'warning':
        console.warn(
          `${prefix} ${alert.asset}${alert.timeframe ? '/' + alert.timeframe : ''} - ${alert.title}: ${alert.message}`
        );
        break;
      case 'info':
        console.log(
          `${prefix} ${alert.asset}${alert.timeframe ? '/' + alert.timeframe : ''} - ${alert.title}: ${alert.message}`
        );
        break;
    }
  }

  /**
   * Logging de información
   */
  private logInfo(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[DataAlertManager] [${timestamp}] ${message}`);
  }

  /**
   * Logging de error
   */
  private logError(message: string) {
    const timestamp = new Date().toISOString();
    console.error(`[DataAlertManager] [${timestamp}] ${message}`);
  }
}

/**
 * Instancia global del gestor de alertas
 */
let alertManagerInstance: DataAlertManager | null = null;

export function getDataAlertManager(): DataAlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new DataAlertManager();
  }
  return alertManagerInstance;
}

export default DataAlertManager;
