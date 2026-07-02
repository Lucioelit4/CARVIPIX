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
      consensusThreshold: 9, // 9 of 11 agents
      confidenceThreshold: 70, // 70+ minimum
      timeframesAnalyzed: ['1H', '4H', 'D'],
      maxActiveAlerts: 10,
      alertExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
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

    // Count approvals (score >= 60) and rejections (score < 40)
    const approvals = agentScores.filter((s) => s.score >= 60).length;
    const rejections = agentScores.filter((s) => s.score < 40).length;
    const neutral = agentScores.filter((s) => s.score >= 40 && s.score < 60).length;

    // Calculate average and confidence
    const averageScore =
      agentScores.reduce((sum, s) => sum + s.score, 0) / agentScores.length;
    const overallConfidence =
      agentScores.reduce((sum, s) => sum + s.confidence, 0) /
      agentScores.length;

    // DECISION LOGIC
    let outcome: DecisionOutcome = 'pending';
    let reasonForDecision = '';

    if (
      approvals >= this.config.consensusThreshold &&
      overallConfidence >= this.config.confidenceThreshold
    ) {
      outcome = 'approved';
      reasonForDecision = `Strong consensus: ${approvals}/${agentScores.length} agents approve (>=${this.config.consensusThreshold} needed). Average confidence: ${overallConfidence.toFixed(
        1
      )}%`;
    } else if (rejections >= agentScores.length - this.config.consensusThreshold) {
      outcome = 'rejected';
      reasonForDecision = `Insufficient consensus: Only ${approvals}/${agentScores.length} agents approve (need ${this.config.consensusThreshold}). Rejection count: ${rejections}. Average confidence: ${overallConfidence.toFixed(
        1
      )}%`;
    } else if (overallConfidence < this.config.confidenceThreshold) {
      outcome = 'rejected';
      reasonForDecision = `Low confidence: ${overallConfidence.toFixed(
        1
      )}% < ${this.config.confidenceThreshold}% threshold. Even with ${approvals} approvals, confidence is insufficient.`;
    } else {
      reasonForDecision = `Mixed signals: ${approvals} approvals, ${rejections} rejections, ${neutral} neutral. Need more clarity. Confidence: ${overallConfidence.toFixed(
        1
      )}%`;
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
   * CREATE ALERT FROM SIGNAL
   * Only if consensus approves
   */
  createAlert(signal: TradeSignal): TradeAlert | null {
    if (signal.status !== 'approved') {
      console.log(`Signal ${signal.id} not approved. Cannot create alert.`);
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
      consensusResult: signal as any, // Would be actual consensus data
      createdAt: Date.now(),
      reasoning: signal.primaryReason,
      tags: ['engine-generated', ...signal.agentContributions],
      source: 'engine',
    };

    this.alerts.set(alertId, alert);
    this.metrics.totalAlertsGenerated++;
    this.metrics.activeAlerts++;

    // Log decision
    this.logDecision({
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: signal as any,
      alertCreated: alertId,
      approved: true,
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
   * LOG DECISION
   * Every decision is recorded with full reasoning
   */
  private logDecision(data: {
    symbol: string;
    type: 'compra' | 'venta';
    timeframe: string;
    consensus: any;
    alertCreated?: string;
    approved: boolean;
  }): void {
    const entry: DecisionLogEntry = {
      id: `LOG_${Date.now()}`,
      timestamp: Date.now(),
      symbol: data.symbol,
      type: data.type,
      timeframe: data.timeframe,
      consensus: data.consensus,
      alertCreated: data.alertCreated,
      reason: data.approved
        ? `Alert created: ${data.alertCreated}`
        : 'Signal rejected - insufficient consensus',
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
