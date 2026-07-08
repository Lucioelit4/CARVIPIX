/**
 * CARVIPIX Trading Engine - Core Decision Engine
 * Handles consensus, decision logging, and alert lifecycle
 */

import {
  AgentType,
  DecisionLogEntry,
  LifecycleTransitionRecord,
  TradeAlert,
  TradeSignal,
  ConsensusResult,
  AgentScore,
  AlertState,
  EngineState,
  EngineMetrics,
  EngineConfig,
  CreateAlertOptions,
  SafetyGateEvaluation,
} from '../types/index';
import { AuditEngine } from './auditEngine';
import { ConflictResolutionEngine } from './conflictResolutionEngine';
import { DecisionEngine } from './decisionEngine';
import { EvidenceEngine } from './evidenceEngine';
import { IntelligenceDirector } from './intelligenceDirector';
import { LifecycleManager } from './lifecycleManager';
import { PriorityEngine } from './priorityEngine';
import { ResearchProposalLoader } from './researchProposalLoader';
import { SafeModePolicy } from './safeModePolicy';

const ENGINE_AGENTS: AgentType[] = [
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
];

/**
 * Central Trading Engine
 * No single agent decides. Only the engine decides with consensus.
 */
export class CARVIPIXEngine {
  private alerts: Map<string, TradeAlert> = new Map();
  private readonly config: EngineConfig;
  private metrics: EngineMetrics;
  private readonly decisionEngine: DecisionEngine;
  private readonly auditEngine: AuditEngine;
  private readonly lifecycleManager: LifecycleManager;
  private readonly priorityEngine: PriorityEngine;
  private readonly conflictResolutionEngine: ConflictResolutionEngine;
  private readonly researchProposalLoader: ResearchProposalLoader;
  private readonly safeModePolicy: SafeModePolicy;
  private readonly intelligenceDirector: IntelligenceDirector;
  private readonly evidenceEngine: EvidenceEngine;

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      consensusThreshold: 9, // 9 de 11 agentes
      confidenceThreshold: 70, // Mínimo 70%
      timeframesAnalyzed: ['1H', '45M', '5M'],
      maxActiveAlerts: 10,
      alertExpiry: 7 * 24 * 60 * 60 * 1000, // 7 días
      enableLearning: true,
      safeMode: true,
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

    this.auditEngine = new AuditEngine();
    this.priorityEngine = new PriorityEngine();
    this.conflictResolutionEngine = new ConflictResolutionEngine();
    this.researchProposalLoader = new ResearchProposalLoader();
    this.safeModePolicy = new SafeModePolicy(this.config.safeMode);
    this.evidenceEngine = new EvidenceEngine();
    this.lifecycleManager = new LifecycleManager(this.auditEngine);
    this.decisionEngine = new DecisionEngine(this.config);
    this.intelligenceDirector = new IntelligenceDirector(
      this.auditEngine,
      this.priorityEngine,
      this.conflictResolutionEngine,
      this.safeModePolicy,
      this.evidenceEngine,
    );
  }

  /**
   * CONSENSUS ENGINE MEJORADO
   * 
   * CAMBIOS EN V2:
   * - Ponderaciones por agent criticality
   * - Thresholds dinámicos basados en calidad de setup
   * - Detección de contrarian votes
   * - Mejor reasoning en rechazos
   */
  evaluateConsensus(agentScores: AgentScore[]): ConsensusResult {
    const result = this.decisionEngine.evaluateConsensus(agentScores);
    this.metrics.lastDecisionTime = Date.now();
    return result;
  }

  /**
   * CREAR ALERTA DE SEÑAL
   * 
   * CAMBIOS EN V2:
   * - Pre-validación con safety gates (liquidity, volatility, news, account, correlation)
   * - MODO PROVISIONAL: Gates solo aconsejan, no rechazan, si faltan datos reales
   * - Solo rechaza si: (1) consenso no aprueba O (2) gate falla crítico Y NO es por datos faltantes
   * - Logging completo de razones de rechazo
   */
  createAlert(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    safetyGateResults?: SafetyGateEvaluation,
    options?: CreateAlertOptions,
  ): TradeAlert | null {
    if (this.metrics.activeAlerts >= this.config.maxActiveAlerts) {
      this.auditEngine.recordDecision({
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'WAIT',
        priority: this.priorityEngine.normalizePriority(options?.priority),
        conflicts: options?.conflicts,
        reason: `Límite de alertas activas alcanzado (${this.metrics.activeAlerts}/${this.config.maxActiveAlerts})`,
      });
      return null;
    }

    return this.intelligenceDirector.decideAlertCreation({
      signal,
      consensusResult,
      safetyGateResults,
      options,
      metrics: this.metrics,
      createAlert: () => {
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
          consensusResult,
          createdAt: Date.now(),
          reasoning: signal.primaryReason,
          tags: ['engine-generated', ...signal.agentContributions],
          source: 'engine',
        };

        this.alerts.set(alertId, alert);
        this.metrics.totalAlertsGenerated++;
        this.metrics.activeAlerts++;
        return alert;
      },
    });
  }

  createAlertFromResearchProposalJson(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    proposalJson: string,
    safetyGateResults?: SafetyGateEvaluation,
    options?: Omit<CreateAlertOptions, 'researchProposalEnvelope'>,
  ): TradeAlert | null {
    const loaded = this.researchProposalLoader.loadFromJson(proposalJson);
    if (loaded.issues.length > 0 || !loaded.envelope) {
      this.auditEngine.recordDecision({
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE',
        priority: this.priorityEngine.normalizePriority(options?.priority),
        conflicts: options?.conflicts,
        reason: `Research Proposal JSON inválido para ${signal.id}: ${loaded.issues.join(', ')}`,
      });
      return null;
    }

    return this.createAlert(signal, consensusResult, safetyGateResults, {
      ...options,
      researchProposalEnvelope: loaded.envelope as CreateAlertOptions['researchProposalEnvelope'],
    });
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
    const transition = this.lifecycleManager.transitionAlertState(alert, newState, this.metrics);
    this.metrics = transition.metrics;

    if (!transition.updated) {
      return false;
    }

    console.log(`Alert ${alertId}: ${oldState} → ${newState}`);
    return true;
  }

  /**
   * GET ENGINE STATE
   */
  getState(): EngineState {
    return {
      isRunning: true,
      lastUpdate: Date.now(),
      alerts: Array.from(this.alerts.values()),
      decisionLog: this.auditEngine.getDecisionLog(),
      metrics: this.calculateMetrics(),
      agents: ENGINE_AGENTS,
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
    return this.auditEngine.getDecisionLog();
  }

  getLifecycleLog(): LifecycleTransitionRecord[] {
    return this.auditEngine.getLifecycleLog();
  }

  getEvidenceRuntimeProfile() {
    return this.evidenceEngine.getRecentProfile();
  }

  benchmarkEvidencePipeline(signal: TradeSignal, consensusResult: ConsensusResult, iterations = 100) {
    return this.evidenceEngine.benchmark({
      signal,
      consensus: consensusResult,
      iterations,
    });
  }

  isSafeModeEnabled(): boolean {
    return this.safeModePolicy.isEnabled();
  }

  /**
   * RESET (for demo)
   */
  reset(): void {
    this.alerts.clear();
    this.auditEngine.reset();
    this.evidenceEngine.reset();
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

