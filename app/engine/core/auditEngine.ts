import type {
  AlertState,
  ConflictDescriptor,
  ConsensusResult,
  DecisionLogEntry,
  EngineAction,
  LifecycleTransitionRecord,
  PriorityLevel,
} from '../types';

export class AuditEngine {
  private static readonly MAX_DECISION_LOG_ENTRIES = 100;
  private static readonly MAX_LIFECYCLE_LOG_ENTRIES = 300;

  private decisionLog: DecisionLogEntry[] = [];
  private lifecycleLog: LifecycleTransitionRecord[] = [];
  private sequence = 0;

  recordDecision(data: {
    symbol: string;
    type: 'compra' | 'venta';
    timeframe: string;
    consensus: ConsensusResult;
    action?: EngineAction;
    priority?: PriorityLevel;
    conflicts?: ConflictDescriptor[];
    alertCreated?: string;
    reason: string;
  }): void {
    const entry: DecisionLogEntry = {
      id: `LOG_${Date.now()}_${this.sequence++}`,
      timestamp: Date.now(),
      symbol: data.symbol,
      type: data.type,
      timeframe: data.timeframe,
      consensus: data.consensus,
      action: data.action,
      priority: data.priority,
      conflicts: data.conflicts,
      alertCreated: data.alertCreated,
      reason: data.reason,
    };

    this.decisionLog.push(entry);
    if (this.decisionLog.length > AuditEngine.MAX_DECISION_LOG_ENTRIES) {
      this.decisionLog = this.decisionLog.slice(-AuditEngine.MAX_DECISION_LOG_ENTRIES);
    }
  }

  recordLifecycleTransition(record: {
    from: AlertState;
    to: AlertState;
    allowed: boolean;
    reason: string;
  }): void {
    this.lifecycleLog.push({
      ...record,
      timestamp: Date.now(),
    });

    if (this.lifecycleLog.length > AuditEngine.MAX_LIFECYCLE_LOG_ENTRIES) {
      this.lifecycleLog = this.lifecycleLog.slice(-AuditEngine.MAX_LIFECYCLE_LOG_ENTRIES);
    }
  }

  getDecisionLog(): DecisionLogEntry[] {
    return [...this.decisionLog];
  }

  getLifecycleLog(): LifecycleTransitionRecord[] {
    return [...this.lifecycleLog];
  }

  reset(): void {
    this.decisionLog = [];
    this.lifecycleLog = [];
    this.sequence = 0;
  }
}