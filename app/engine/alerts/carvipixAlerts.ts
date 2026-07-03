/**
 * CARVIPIX Alerts System
 * Sistema de alertas para operaciones cortas
 * Objetivo: 3-8 alertas/día, WR 75%-85%, RR 1:1.2 a 1:1.8
 * Privado / Admin only
 */

import { TradingSignal, CarvipixAlert, AlertType } from '../trading/tradingEngine';

/**
 * Gestor de alertas
 */
export class CarvipixAlertManager {
  private alerts: Map<string, CarvipixAlert> = new Map();

  /**
   * Crear alerta de señal
   */
  createSignalAlert(signal: TradingSignal): CarvipixAlert {
    const message = this.formatSignalMessage(signal);

    const alert: CarvipixAlert = {
      id: `ALERT-${signal.id}`,
      timestamp: Date.now(),
      type: 'SIGNAL',
      signal,
      message,
      suggestedAction: `Considerar entrada en ${signal.asset} dirección ${signal.direction} en precio ${signal.entry.price}`,
      private: true,
      adminOnly: true,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Crear alerta de actualización
   */
  createUpdateAlert(signal: TradingSignal, reason: string): CarvipixAlert {
    const alert: CarvipixAlert = {
      id: `ALERT-UPDATE-${signal.id}-${Date.now()}`,
      timestamp: Date.now(),
      type: 'UPDATE',
      signal,
      message: `Actualización: ${reason}`,
      private: true,
      adminOnly: true,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Crear alerta de cierre
   */
  createCloseAlert(
    signal: TradingSignal,
    reason: 'TP' | 'SL' | 'BREAK_EVEN' | 'CANCELLED' | 'EXPIRED'
  ): CarvipixAlert {
    const reasonText = {
      TP: 'Take Profit alcanzado',
      SL: 'Stop Loss ejecutado',
      BREAK_EVEN: 'Posición cerrada en Break Even',
      CANCELLED: 'Señal cancelada',
      EXPIRED: 'Señal expirada',
    };

    const alert: CarvipixAlert = {
      id: `ALERT-CLOSE-${signal.id}-${Date.now()}`,
      timestamp: Date.now(),
      type: 'CLOSE',
      signal,
      message: `Posición cerrada: ${reasonText[reason]}`,
      private: true,
      adminOnly: true,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Formatear mensaje de alerta legible
   */
  private formatSignalMessage(signal: TradingSignal): string {
    const score = signal.scoreBreakdown.totalScore;
    const level = signal.trend1H.confidenceLevel;
    const rr = signal.riskReward.ratio.toFixed(2);
    const direction = signal.direction === 'BUY' ? '🟢 COMPRA' : '🔴 VENTA';

    return `
${direction} ${signal.asset}
═══════════════════════════════════════════════════════════

📊 TENDENCIA 1H:    ${level} (Score: ${score}/100)
📈 RETROCESO 45M:   ${signal.pullback45M.detected ? 'Detectado' : 'No detectado'}
📍 ENTRADA 5M:      ${signal.entry5M.confirmed ? 'Confirmada' : 'Pendiente'}

💰 ENTRADA:         ${signal.entry.price.toFixed(2)}
🛑 STOP LOSS:       ${signal.riskReward.stopLoss.level.toFixed(2)}
🎯 TP1/TP2/TP3:     ${signal.riskReward.takeProfit.tp1.level.toFixed(2)} / ${signal.riskReward.takeProfit.tp2.level.toFixed(2)} / ${signal.riskReward.takeProfit.tp3.level.toFixed(2)}

💹 RISK-REWARD:     1:${rr}
💯 CONFIANZA:       ${signal.scoreBreakdown.confidenceScore.value}/20

═══════════════════════════════════════════════════════════
🔒 PRIVADO / ADMIN ONLY
    `.trim();
  }

  /**
   * Obtener todas las alertas
   */
  getAllAlerts(): CarvipixAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Obtener alertas por tipo
   */
  getAlertsByType(type: AlertType): CarvipixAlert[] {
    return Array.from(this.alerts.values()).filter((a) => a.type === type);
  }

  /**
   * Obtener alertas activas (no cerradas)
   */
  getActiveAlerts(): CarvipixAlert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.signal.state === 'ACTIVE' || a.signal.state === 'PENDING'
    );
  }

  /**
   * Contar alertas en período
   */
  countAlertsInPeriod(startTime: number, endTime: number): number {
    return Array.from(this.alerts.values()).filter(
      (a) => a.timestamp >= startTime && a.timestamp <= endTime
    ).length;
  }

  /**
   * Estadísticas de alertas
   */
  getAlertStats(periodDays: number = 1): {
    totalAlerts: number;
    signalAlerts: number;
    updateAlerts: number;
    closeAlerts: number;
    averagePerDay: number;
    isWithinTarget: boolean; // 3-8 por día
  } {
    const now = Date.now();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    const startTime = now - periodMs;

    const alertsInPeriod = Array.from(this.alerts.values()).filter(
      (a) => a.timestamp >= startTime && a.timestamp <= now
    );

    const totalAlerts = alertsInPeriod.length;
    const signalAlerts = alertsInPeriod.filter((a) => a.type === 'SIGNAL').length;
    const updateAlerts = alertsInPeriod.filter((a) => a.type === 'UPDATE').length;
    const closeAlerts = alertsInPeriod.filter((a) => a.type === 'CLOSE').length;

    const averagePerDay = totalAlerts / periodDays;
    const isWithinTarget = averagePerDay >= 3 && averagePerDay <= 8;

    return {
      totalAlerts,
      signalAlerts,
      updateAlerts,
      closeAlerts,
      averagePerDay,
      isWithinTarget,
    };
  }
}

/**
 * Singleton instance
 */
let alertManagerInstance: CarvipixAlertManager | null = null;

/**
 * Obtener o crear instancia
 */
export function getAlertManager(): CarvipixAlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new CarvipixAlertManager();
  }
  return alertManagerInstance;
}

/**
 * Export default
 */
export default CarvipixAlertManager;
