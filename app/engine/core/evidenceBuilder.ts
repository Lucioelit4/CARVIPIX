import type { ConsensusResult, EvidenceInput, EvidenceItem, TradeSignal } from '../types';

const DEFAULT_TTL_MS = 15 * 60 * 1000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class EvidenceBuilder {
  build(input: {
    signal: TradeSignal;
    consensus: ConsensusResult;
    evidenceInput?: EvidenceInput;
    contextSnapshot?: Record<string, unknown>;
  }): EvidenceItem[] {
    const now = Date.now();
    const provided = input.evidenceInput?.items ?? [];

    const normalizedProvided = provided.map((item, index) => ({
      ...item,
      id: item.id?.trim() || `evidence-provided-${index}-${now}`,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : now,
      expiresAt: Number.isFinite(item.expiresAt) ? item.expiresAt : now + DEFAULT_TTL_MS,
      confidence: clamp01(item.confidence),
      uncertainty: clamp01(item.uncertainty),
      weight: Math.max(0.01, item.weight),
    }));

    if (normalizedProvided.length > 0) {
      return normalizedProvided;
    }

    const context = input.contextSnapshot;
    const confidence = clamp01(input.consensus.overallConfidence / 100);

    return [
      {
        id: `evidence-consensus-${input.signal.id}`,
        source: 'context',
        key: 'consensus_score',
        value: clamp01(input.consensus.averageScore / 100),
        weight: 1.4,
        confidence,
        uncertainty: 1 - confidence,
        context,
        createdAt: now,
        expiresAt: now + DEFAULT_TTL_MS,
      },
      {
        id: `evidence-risk-reward-${input.signal.id}`,
        source: 'risk',
        key: 'risk_reward',
        value: clamp01(input.signal.riskRewardRatio / 4),
        weight: 1.2,
        confidence: clamp01(input.signal.confidenceScore / 100),
        uncertainty: clamp01(1 - input.signal.confidenceScore / 100),
        context,
        createdAt: now,
        expiresAt: now + DEFAULT_TTL_MS,
      },
      {
        id: `evidence-signal-quality-${input.signal.id}`,
        source: 'context',
        key: 'signal_quality',
        value: clamp01(input.signal.consensusScore / 100),
        weight: 1,
        confidence: clamp01(input.signal.confidenceScore / 100),
        uncertainty: clamp01(1 - input.signal.confidenceScore / 100),
        context,
        createdAt: now,
        expiresAt: now + DEFAULT_TTL_MS,
      },
    ];
  }
}
