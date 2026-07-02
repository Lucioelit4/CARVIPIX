/**
 * CARVIPIX Trading Engine - Core Decision Engine
 * Handles consensus, decision logging, and alert lifecycle
 */

import {
  TradeAlert,
  TradeSignal,
  ConsensusResult,
  DecisionLogEntry,
  DecisionOutcome,
  AgentScore,
  AlertState,
  EngineState,
  EngineMetrics,
  EngineConfig,
} from '../types/index';

/**
 * Central Trading Engine
 * No single agent decides. Only the engine decides with consensus.
 */
export class CARVIPIXEngine {
  private alerts: Map<string, TradeAlert> = new Map();
  private decisionLog: DecisionLogEntry[] = [];
  private config: EngineConfig;
  private metrics: EngineMetrics;

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      consensusThreshold: 9, // 9 de 11 agentes
      confidenceThreshold: 70, // Mínimo 70%
      timeframesAnalyzed: ['1H', '45M', '5M'],
      maxActiveAlerts: 10,
      alertExpiry: 7 * 24 * 60 * 60 * 1000, // 7 días
      enableLearning: true,
      ...config,
    };

    this.metrics = {
      totalAlertsGenerated: 0,
      activeAlerts: 0,
      closedAlerts: 0,
      successfulTrades: 0,
      failedTrades: 0,
      averageWinRate: 0,
      averageRiskReward: 0,
      consensusApprovalRate: 0,
      lastDecisionTime: 0,
    };
  }

  /**
   * CONSENSUS ENGINE
   * Evaluates if there's enough agreement among agents
   * Returns: approved (9+), rejected (2 or fewer), pending (3-8)
   */
  evaluateConsensus(agentScores: AgentScore[]): ConsensusResult {
    if (agentScores.length === 0) {
      return {
        outcome: 'rejected',
        agentScores: [],
        approvalCount: 0,
        rejectionCount: 0,
        consensusThreshold: this.config.consensusThreshold,
        averageScore: 0,
        overallConfidence: 0,
        reasonForDecision: 'No agents evaluated',
        timestamp: Date.now(),
      };
    }

    // Verificar agentes críticos obligatorios
    const criticalAgents = ['MarketRegimeAnalyst', 'PullbackAnalyst', 'RiskManager', 'TradeValidator'];
    const criticalScores = agentScores.filter(s => criticalAgents.includes(s.agent));
    const criticalApprovalCount = criticalScores.filter(s => s.score >= 60).length;
    const hasCriticalApprovals = criticalApprovalCount >= 3; // Al menos 3 de 4 críticos

    // Contar aprobaciones (score >= 60) y rechazos (score < 40)
    const approvals = agentScores.filter((s) => s.score >= 60).length;
    const rejections = agentScores.filter((s) => s.score < 40).length;
    const neutral = agentScores.filter((s) => s.score >= 40 && s.score < 60).length;

    // Calcular promedio y confianza
    const averageScore =
      agentScores.reduce((sum, s) => sum + s.score, 0) / agentScores.length;
    const overallConfidence =
      agentScores.reduce((sum, s) => sum + s.confidence, 0) /
      agentScores.length;

    // LÓGICA DE DECISIÓN
    let outcome: DecisionOutcome = 'pending';
    let reasonForDecision = '';

    if (
      approvals >= this.config.consensusThreshold &&
      overallConfidence >= this.config.confidenceThreshold &&
      hasCriticalApprovals
    ) {
      outcome = 'approved';
      reasonForDecision = `Consenso fuerte: ${approvals}/${agentScores.length} agentes aprueban (requiere ${this.config.consensusThreshold}). Críticos: ${criticalApprovalCount}/4. Confianza: ${overallConfidence.toFixed(
        1
      )}%`;
    } else if (!hasCriticalApprovals) {
      outcome = 'rejected';
      reasonForDecision = `Rechazo: Solo ${criticalApprovalCount}/4 agentes críticos aprueban. Requeridos: Market Regime, Pullback, Risk Manager, Trade Validator.`;
    } else if (rejections >= agentScores.length - this.config.consensusThreshold) {
      outcome = 'rejected';
      reasonForDecision = `Consenso insuficiente: Solo ${approvals}/${agentScores.length} agentes aprueban (necesarios ${this.config.consensusThreshold}). Rechazos: ${rejections}.`;
    } else if (overallConfidence < this.config.confidenceThreshold) {
      outcome = 'rejected';
      reasonForDecision = `Confianza baja: ${overallConfidence.toFixed(
        1
      )}% < ${this.config.confidenceThreshold}% requerido.`;
    } else {
      reasonForDecision = `Señales mixtas: ${approvals} aprobaciones, ${rejections} rechazos, ${neutral} neutrales.`;
    }

    // Update metrics
    this.metrics.lastDecisionTime = Date.now();

    return {
      outcome,
      agentScores: agentScores.sort((a, b) => b.score - a.score),
      approvalCount: approvals,
      rejectionCount: rejections,
      consensusThreshold: this.config.consensusThreshold,
      averageScore,
      overallConfidence,
      reasonForDecision,
      timestamp: Date.now(),
    };
  }

  /**
   * CREAR ALERTA DE SEÑAL
   * Solo si el consenso aprueba
   */
  createAlert(signal: TradeSignal, consensusResult: ConsensusResult): TradeAlert | null {
    if (consensusResult.outcome !== 'approved') {
      console.log(`Señal ${signal.id} no aprobada. No se puede crear alerta.`);
      return null;
    }

    const alertId = `ALERT_${signal.symbol}_${Date.now()}`;
    const alert: TradeAlert = {
      id: alertId,
      symbol: signal.symbol,
      type: signal.type,
      state: 'activa',
      entryPrice: signal.entryPrice,
      takeProfitPrice: signal.takeProfitPrice,
      stopLossPrice: signal.stopLossPrice,
      timeframe: signal.timeframe,
      riskRewardRatio: signal.riskRewardRatio,
      consensusResult: consensusResult,
      createdAt: Date.now(),
      reasoning: signal.primaryReason,
      tags: ['engine-generated', ...signal.agentContributions],
      source: 'engine',
    };

    this.alerts.set(alertId, alert);
    this.metrics.totalAlertsGenerated++;
    this.metrics.activeAlerts++;

    // Registrar decisión
    this.logDecision({
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      alertCreated: alertId,
      reason: `Alerta creada: ${alertId}`,
    });

    return alert;
  }

  /**
   * UPDATE ALERT STATE
   */
  updateAlertState(alertId: string, newState: AlertState): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      console.error(`Alert ${alertId} not found`);
      return false;
    }

    const oldState = alert.state;
    alert.state = newState;
    alert.closedAt = newState !== 'activa' ? Date.now() : undefined;

    // Update metrics
    if (
      newState === 'tp' ||
      newState === 'sl' ||
      newState === 'breakeven' ||
      newState === 'cancelada'
    ) {
      this.metrics.activeAlerts = Math.max(0, this.metrics.activeAlerts - 1);
      this.metrics.closedAlerts++;

      if (newState === 'tp') {
        this.metrics.successfulTrades++;
      } else if (newState === 'sl') {
        this.metrics.failedTrades++;
      }
    }

    console.log(`Alert ${alertId}: ${oldState} → ${newState}`);
    return true;
  }

  /**
   * REGISTRAR DECISIÓN
   * Cada decisión se registra con razonamiento completo
   */
  private logDecision(data: {
    symbol: string;
    type: 'compra' | 'venta';
    timeframe: string;
    consensus: ConsensusResult;
    alertCreated?: string;
    reason: string;
  }): void {
    const entry: DecisionLogEntry = {
      id: `LOG_${Date.now()}`,
      timestamp: Date.now(),
      symbol: data.symbol,
      type: data.type,
      timeframe: data.timeframe,
      consensus: data.consensus,
      alertCreated: data.alertCreated,
      reason: data.reason,
    };

    this.decisionLog.push(entry);

    // Keep last 100 entries
    if (this.decisionLog.length > 100) {
      this.decisionLog = this.decisionLog.slice(-100);
    }
  }

  /**
   * GET ENGINE STATE
   */
  getState(): EngineState {
    return {
      isRunning: true,
      lastUpdate: Date.now(),
      alerts: Array.from(this.alerts.values()),
      decisionLog: this.decisionLog,
      metrics: this.calculateMetrics(),
      agents: [
        'MarketRegimeAnalyst',
        'TrendAnalyst',
        'StructureAnalyst',
        'MomentumAnalyst',
        'PullbackAnalyst',
        'SessionAnalyst',
        'NewsAnalyst',
        'RiskManager',
        'ConfidenceScoring',
        'TradeValidator',
        'LearningEngine',
      ] as any,
    };
  }

  /**
   * CALCULATE METRICS
   */
  private calculateMetrics(): EngineMetrics {
    const totalTrades = this.metrics.successfulTrades + this.metrics.failedTrades;
    const winRate =
      totalTrades > 0
        ? (this.metrics.successfulTrades / totalTrades) * 100
        : 0;

    return {
      ...this.metrics,
      averageWinRate: winRate,
      consensusApprovalRate: this.metrics.totalAlertsGenerated > 0
        ? (this.metrics.successfulTrades / this.metrics.totalAlertsGenerated) * 100
        : 0,
    };
  }

  /**
   * GET ALERTS
   */
  getAlerts(): TradeAlert[] {
    return Array.from(this.alerts.values());
  }

  getActiveAlerts(): TradeAlert[] {
    return Array.from(this.alerts.values()).filter((a) => a.state === 'activa');
  }

  /**
   * GET DECISION LOG
   */
  getDecisionLog(): DecisionLogEntry[] {
    return this.decisionLog;
  }

  /**
   * RESET (for demo)
   */
  reset(): void {
    this.alerts.clear();
    this.decisionLog = [];
    this.metrics = {
      totalAlertsGenerated: 0,
      activeAlerts: 0,
      closedAlerts: 0,
      successfulTrades: 0,
      failedTrades: 0,
      averageWinRate: 0,
      averageRiskReward: 0,
      consensusApprovalRate: 0,
      lastDecisionTime: 0,
    };
  }
}

// Export singleton instance
export const engine = new CARVIPIXEngine();
