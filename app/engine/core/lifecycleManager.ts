import type { AlertState, EngineMetrics, LifecycleTransitionRecord, TradeAlert } from '../types';
import { AuditEngine } from './auditEngine';

const ALLOWED_ALERT_TRANSITIONS: Record<AlertState, AlertState[]> = {
  pendiente: ['activa', 'cancelada', 'caducada'],
  activa: ['tp', 'sl', 'breakeven', 'cancelada', 'caducada'],
  breakeven: ['tp', 'sl', 'cancelada', 'caducada'],
  tp: [],
  sl: [],
  cancelada: [],
  caducada: [],
};

export class LifecycleManager {
  constructor(private readonly auditEngine: AuditEngine) {}

  transitionAlertState(
    alert: TradeAlert,
    newState: AlertState,
    metrics: EngineMetrics,
  ): { updated: boolean; metrics: EngineMetrics; record: LifecycleTransitionRecord } {
    const oldState = alert.state;
    if (!ALLOWED_ALERT_TRANSITIONS[oldState].includes(newState)) {
      const record = {
        from: oldState,
        to: newState,
        allowed: false,
        reason: `Invalid transition ${oldState} -> ${newState}`,
        timestamp: Date.now(),
      };
      this.auditEngine.recordLifecycleTransition(record);
      return { updated: false, metrics, record };
    }

    alert.state = newState;
    alert.closedAt = newState !== 'activa' ? Date.now() : undefined;

    const nextMetrics = { ...metrics };
    if (newState === 'tp' || newState === 'sl' || newState === 'breakeven' || newState === 'cancelada') {
      nextMetrics.activeAlerts = Math.max(0, nextMetrics.activeAlerts - 1);
      nextMetrics.closedAlerts++;

      if (newState === 'tp') {
        nextMetrics.successfulTrades++;
      } else if (newState === 'sl') {
        nextMetrics.failedTrades++;
      }
    }

    const record = {
      from: oldState,
      to: newState,
      allowed: true,
      reason: `Transition ${oldState} -> ${newState}`,
      timestamp: Date.now(),
    };
    this.auditEngine.recordLifecycleTransition(record);
    return { updated: true, metrics: nextMetrics, record };
  }
}