/* eslint-disable @typescript-eslint/no-explicit-any */
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
   * CONSENSUS ENGINE MEJORADO
   * 
   * CAMBIOS EN V2:
   * - Ponderaciones por agent criticality
   * - Thresholds dinámicos basados en calidad de setup
   * - Detección de contrarian votes
   * - Mejor reasoning en rechazos
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

    // AGENT WEIGHTING - Algunos agentes son más importantes
    const agentWeights: Record<string, number> = {
      'RiskManager': 1.5,           // CRÍTICO: Si RR es malo, rechazar
      'MarketRegimeAnalyst': 1.3,   // IMPORTANTE: Mercado correcto fundamental
      'TrendAnalyst': 1.3,          // IMPORTANTE: Tendencia es core
      'TradeValidator': 1.2,        // IMPORTANTE: Validación final
      'StructureAnalyst': 1.1,      // Importante pero menos que los 4 arriba
      'MomentumAnalyst': 1.0,       // Normal
      'ConfidenceScoring': 1.0,     // Normal
      'PullbackAnalyst': 1.0,       // Normal
      'SessionAnalyst': 0.9,        // Secundario
      'NewsAnalyst': 1.1,           // Importante pero contextual
      'LearningEngine': 0.85,       // Secundario
    };

    // CALCULAR WEIGHTED CONSENSUS
    let weightedSum = 0;
    let weightSum = 0;
    
    for (const agent of agentScores) {
      const weight = agentWeights[agent.agent] || 1.0;
      weightedSum += agent.score * weight;
      weightSum += weight;
    }
    
    const weightedAverageScore = weightSum > 0 ? weightedSum / weightSum : 0;

    // CONTAR APROBACIONES/RECHAZOS PONDERADOS
    const approvals = agentScores.filter((s) => s.score >= 60).length;
    const rejections = agentScores.filter((s) => s.score < 40).length;
    const criticalRejections = agentScores
      .filter(s => ['RiskManager', 'MarketRegimeAnalyst', 'TradeValidator'].includes(s.agent))
      .filter(s => s.score < 40).length;

    // CALCULAR CONFIANZA PONDERADA
    const overallConfidence =
      agentScores.reduce((sum, s) => sum + (s.confidence * (agentWeights[s.agent] || 1.0)), 0) /
      agentScores.reduce((sum, s) => sum + (agentWeights[s.agent] || 1.0), 0);

    // DYNAMIC THRESHOLD - Se adapta según calidad del setup
    const averageScore = agentScores.reduce((sum, s) => sum + s.score, 0) / agentScores.length;
    const scoreVariance = agentScores.reduce((sum, s) => sum + Math.pow(s.score - averageScore, 2), 0) / agentScores.length;
    const scoreStdDev = Math.sqrt(scoreVariance);

    let dynamicThreshold = this.config.consensusThreshold;
    
    // Si setup es excellent (high average, low variance) → threshold BAJA
    if (averageScore > 80 && scoreStdDev < 12) {
      dynamicThreshold = 8; // Excelente setup → 8/11 OK
    } 
    // Si setup es mediocre → threshold SUBE
    else if (averageScore < 65 && scoreStdDev > 15) {
      dynamicThreshold = 10; // Mediocre setup → 10/11 requerido
    }
    // Si setup es pobre → casi unánime requerido
    else if (averageScore < 55) {
      dynamicThreshold = 11; // Pobre → casi unánime o reject
    }

    // LÓGICA DE DECISIÓN
    let outcome: DecisionOutcome = 'pending';
    let reasonForDecision = '';

    // CRITICAL REJECTION: Si RiskManager o MarketRegime rechazan severamente
    if (criticalRejections > 0) {
      const criticalAgents = agentScores.filter(s => 
        ['RiskManager', 'MarketRegimeAnalyst', 'TradeValidator'].includes(s.agent) && s.score < 40
      );
      
      outcome = 'rejected';
      reasonForDecision = `RECHAZO CRÍTICO: ${criticalAgents.map(a => a.agent).join(', ')} rechaza. ${criticalAgents[0]?.reasoning}`;
    }
    // SUCCESS: Threshold dinámico cumplido + confianza suficiente
    else if (
      approvals >= dynamicThreshold &&
      overallConfidence >= this.config.confidenceThreshold
    ) {
      outcome = 'approved';
      reasonForDecision = `✓ APROBADO: ${approvals}/${agentScores.length} agentes (threshold dinámico: ${dynamicThreshold}). Confianza: ${overallConfidence.toFixed(1)}%. Score ponderado: ${weightedAverageScore.toFixed(1)}/100`;
    }
    // INSUFICIENTE CONSENSO
    else if (approvals < dynamicThreshold) {
      outcome = 'rejected';
      reasonForDecision = `✗ Consenso insuficiente: ${approvals} aprobaciones vs ${dynamicThreshold} requeridas (threshold dinámico)`;
    }
    // BAJA CONFIANZA
    else if (overallConfidence < this.config.confidenceThreshold) {
      outcome = 'rejected';
      reasonForDecision = `✗ Confianza baja: ${overallConfidence.toFixed(1)}% < ${this.config.confidenceThreshold}% requerido`;
    }
    else {
      reasonForDecision = `? PENDIENTE: Señales mixtas. ${approvals} aprobaciones, ${rejections} rechazos`;
    }

    // Update metrics
    this.metrics.lastDecisionTime = Date.now();

    return {
      outcome,
      agentScores: agentScores.sort((a, b) => (agentWeights[b.agent] || 1.0) * b.score - (agentWeights[a.agent] || 1.0) * a.score),
      approvalCount: approvals,
      rejectionCount: rejections,
      consensusThreshold: dynamicThreshold,
      averageScore: weightedAverageScore,
      overallConfidence,
      reasonForDecision,
      timestamp: Date.now(),
    };
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
    safetyGateResults?: { 
      allPassed: boolean; 
      modeProvisional: boolean;
      criticalFailures: Array<{ gate: string; reason: string; reason_isDataMissing?: boolean }> 
    }
  ): TradeAlert | null {
    // GATE VALIDATION: Rechazar SOLO si hay fallo crítico y NO es por datos faltantes
    if (safetyGateResults && safetyGateResults.criticalFailures && safetyGateResults.criticalFailures.length > 0) {
      // Filtrar fallos que son REALES (no solo por falta de datos)
      const realFailures = safetyGateResults.criticalFailures.filter(f => !f.reason.includes('NO DISPONIBLES'));
      
      if (realFailures.length > 0) {
        const failedGates = realFailures.map(f => `${f.gate}: ${f.reason}`).join(' | ');
        console.log(`Señal ${signal.id} RECHAZADA por safety gates críticos: ${failedGates}`);
        return null;
      }
      
      // Si solo hay fallos por datos faltantes, log pero continúa
      if (safetyGateResults.modeProvisional) {
        const missingDataGates = safetyGateResults.criticalFailures.filter(f => f.reason.includes('NO DISPONIBLES'));
        console.log(`⚠️ Modo provisional: ${missingDataGates.length} gates sin datos reales. Continuando con consenso...`);
      }
    }

    // CONSENSUS VALIDATION
    if (consensusResult.outcome !== 'approved') {
      console.log(`Señal ${signal.id} no aprobada por consenso. Razón: ${consensusResult.reasonForDecision}`);
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

