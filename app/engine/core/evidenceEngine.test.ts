import test from 'node:test';
import assert from 'node:assert/strict';

import { EvidenceEngine } from './evidenceEngine';
import type { ConsensusResult, TradeSignal } from '../types';

const signal: TradeSignal = {
  id: 'signal-evidence-engine',
  timestamp: Date.now(),
  symbol: 'EURUSD',
  type: 'compra',
  timeframe: '1H',
  entryPrice: 1.1,
  takeProfitPrice: 1.2,
  stopLossPrice: 1.0,
  consensusScore: 82,
  confidenceScore: 80,
  riskRewardRatio: 2,
  primaryReason: 'evidence test',
  agentContributions: ['TrendAnalyst'],
  riskWarnings: [],
  status: 'ready_for_approval',
};

const consensus: ConsensusResult = {
  outcome: 'approved',
  agentScores: [],
  approvalCount: 9,
  rejectionCount: 0,
  consensusThreshold: 9,
  averageScore: 84,
  overallConfidence: 82,
  reasonForDecision: 'approved',
  timestamp: Date.now(),
};

test('computes probability confidence uncertainty and decision quality from evidence', () => {
  const engine = new EvidenceEngine();

  const assessment = engine.evaluate({
    signal,
    consensus,
    evidenceInput: {
      items: [
        {
          id: 'ev-a',
          source: 'market',
          key: 'trend_strength',
          value: 0.8,
          weight: 1.4,
          confidence: 0.9,
          uncertainty: 0.1,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60_000,
        },
        {
          id: 'ev-b',
          source: 'risk',
          key: 'risk_profile',
          value: 0.7,
          weight: 1.1,
          confidence: 0.85,
          uncertainty: 0.15,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60_000,
        },
      ],
    },
  });

  assert.equal(assessment.valid, true);
  assert.ok(assessment.probability > 0);
  assert.ok(assessment.confidence > 0);
  assert.ok(assessment.uncertainty >= 0);
  assert.ok(assessment.decisionQuality > 0.55);
  assert.ok(assessment.explainability.length > 0);
});

test('marks expired evidence as warning and applies expiration pruning', () => {
  const engine = new EvidenceEngine();

  const assessment = engine.evaluate({
    signal: { ...signal, id: 'signal-expired-evidence' },
    consensus,
    evidenceInput: {
      items: [
        {
          id: 'ev-expired',
          source: 'memory',
          key: 'expired_fact',
          value: 0.6,
          weight: 1,
          confidence: 0.8,
          uncertainty: 0.2,
          createdAt: Date.now() - 120_000,
          expiresAt: Date.now() - 60_000,
        },
      ],
    },
  });

  assert.equal(assessment.valid, true);
  assert.ok(assessment.issues.some((issue) => /expired/i.test(issue.reason)));
});

test('returns deterministic benchmark statistics', () => {
  const engine = new EvidenceEngine();

  const benchmark = engine.benchmark({
    signal: { ...signal, id: 'signal-benchmark-evidence' },
    consensus,
    iterations: 8,
  });

  assert.equal(benchmark.iterations, 8);
  assert.ok(benchmark.totalMs >= 0);
  assert.ok(benchmark.maxMs >= benchmark.minMs);
  assert.ok(benchmark.p95Ms >= benchmark.minMs);
});
