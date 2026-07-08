import type {
  AgentScore,
  ConsensusResult,
  DecisionOutcome,
  EngineConfig,
} from '../types';

const AGENT_WEIGHTS: Record<string, number> = {
  RiskManager: 1.5,
  MarketRegimeAnalyst: 1.3,
  TrendAnalyst: 1.3,
  TradeValidator: 1.2,
  StructureAnalyst: 1.1,
  MomentumAnalyst: 1.0,
  ConfidenceScoring: 1.0,
  PullbackAnalyst: 1.0,
  SessionAnalyst: 0.9,
  NewsAnalyst: 1.1,
  LearningEngine: 0.85,
};

const CRITICAL_AGENTS = ['RiskManager', 'MarketRegimeAnalyst', 'TradeValidator'];

export class DecisionEngine {
  constructor(private readonly config: EngineConfig) {}

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

    const invalidAgentScores = agentScores.filter(
      (agent) =>
        !Number.isFinite(agent.score) ||
        !Number.isFinite(agent.confidence) ||
        agent.score < 0 ||
        agent.score > 100 ||
        agent.confidence < 0 ||
        agent.confidence > 100,
    );

    if (invalidAgentScores.length > 0) {
      return {
        outcome: 'rejected',
        agentScores: [...agentScores],
        approvalCount: 0,
        rejectionCount: agentScores.length,
        consensusThreshold: this.config.consensusThreshold,
        averageScore: 0,
        overallConfidence: 0,
        reasonForDecision: `Agent scores inválidos detectados: ${invalidAgentScores.map((agent) => agent.agent).join(', ')}`,
        timestamp: Date.now(),
      };
    }

    let weightedSum = 0;
    let weightSum = 0;

    for (const agent of agentScores) {
      const weight = AGENT_WEIGHTS[agent.agent] || 1.0;
      weightedSum += agent.score * weight;
      weightSum += weight;
    }

    const weightedAverageScore = weightSum > 0 ? weightedSum / weightSum : 0;
    const approvals = agentScores.filter((score) => score.score >= 60).length;
    const rejections = agentScores.filter((score) => score.score < 40).length;
    const criticalRejections = agentScores
      .filter((score) => CRITICAL_AGENTS.includes(score.agent))
      .filter((score) => score.score < 40);

    const weightedConfidence = agentScores.reduce(
      (sum, score) => sum + score.confidence * (AGENT_WEIGHTS[score.agent] || 1.0),
      0,
    );
    const confidenceWeightSum = agentScores.reduce((sum, score) => sum + (AGENT_WEIGHTS[score.agent] || 1.0), 0);
    const overallConfidence = confidenceWeightSum > 0 ? weightedConfidence / confidenceWeightSum : 0;

    const averageScore = agentScores.reduce((sum, score) => sum + score.score, 0) / agentScores.length;
    const scoreVariance =
      agentScores.reduce((sum, score) => sum + Math.pow(score.score - averageScore, 2), 0) / agentScores.length;
    const scoreStdDev = Math.sqrt(scoreVariance);

    let dynamicThreshold = this.config.consensusThreshold;

    if (averageScore > 80 && scoreStdDev < 12) {
      dynamicThreshold = 8;
    } else if (averageScore < 65 && scoreStdDev > 15) {
      dynamicThreshold = 10;
    } else if (averageScore < 55) {
      dynamicThreshold = 11;
    }

    let outcome: DecisionOutcome = 'pending';
    let reasonForDecision = '';

    if (criticalRejections.length > 0) {
      outcome = 'rejected';
      reasonForDecision = `RECHAZO CRÍTICO: ${criticalRejections.map((agent) => agent.agent).join(', ')} rechaza. ${criticalRejections[0]?.reasoning}`;
    } else if (approvals >= dynamicThreshold && overallConfidence >= this.config.confidenceThreshold) {
      outcome = 'approved';
      reasonForDecision = `✓ APROBADO: ${approvals}/${agentScores.length} agentes (threshold dinámico: ${dynamicThreshold}). Confianza: ${overallConfidence.toFixed(1)}%. Score ponderado: ${weightedAverageScore.toFixed(1)}/100`;
    } else if (approvals < dynamicThreshold) {
      outcome = 'rejected';
      reasonForDecision = `✗ Consenso insuficiente: ${approvals} aprobaciones vs ${dynamicThreshold} requeridas (threshold dinámico)`;
    } else if (overallConfidence < this.config.confidenceThreshold) {
      outcome = 'rejected';
      reasonForDecision = `✗ Confianza baja: ${overallConfidence.toFixed(1)}% < ${this.config.confidenceThreshold}% requerido`;
    } else {
      reasonForDecision = `? PENDIENTE: Señales mixtas. ${approvals} aprobaciones, ${rejections} rechazos`;
    }

    return {
      outcome,
      agentScores: agentScores.sort(
        (left, right) => (AGENT_WEIGHTS[right.agent] || 1.0) * right.score - (AGENT_WEIGHTS[left.agent] || 1.0) * left.score,
      ),
      approvalCount: approvals,
      rejectionCount: rejections,
      consensusThreshold: dynamicThreshold,
      averageScore: weightedAverageScore,
      overallConfidence,
      reasonForDecision,
      timestamp: Date.now(),
    };
  }
}