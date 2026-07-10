import test from 'node:test';
import assert from 'node:assert/strict';

import { CARVIPIXEngine } from './engine';
import type {
  AgentScore,
  CertifiedDatasetEnvelope,
  CertifiedDatasetSource,
  CertifiedDatasetStatus,
  ConflictDescriptor,
  ResearchProposalEnvelope,
  TradeSignal,
} from '../types';

type CertifiedDatasetOverrides = Partial<Omit<CertifiedDatasetEnvelope, 'status' | 'source'>> & {
  status?: CertifiedDatasetStatus;
  source?: CertifiedDatasetSource;
};

type ResearchProposalEnvelopeForTests = Omit<ResearchProposalEnvelope, 'status' | 'source' | 'manualReviewRequired'> & {
  source: ResearchProposalEnvelope['source'] | 'CDP';
  status: ResearchProposalEnvelope['status'] | 'PARTIAL' | 'INVALID' | 'SIMULATED';
  manualReviewRequired: true | false;
};

function buildCertifiedDataset(overrides: CertifiedDatasetOverrides = {}): CertifiedDatasetEnvelope {
  return {
    datasetId: 'cdp-001',
    source: 'CDP',
    status: 'CERTIFIED',
    schemaVersion: '1.0.0',
    checksum: 'def456',
    ...overrides,
  };
}

function buildResearchProposalEnvelope(overrides: Partial<ResearchProposalEnvelopeForTests> = {}): ResearchProposalEnvelopeForTests {
  return {
    datasetId: 'research-001',
    checksum: 'feed1234',
    schemaVersion: '1.0.0',
    source: 'RESEARCH_LAB',
    status: 'CERTIFIED',
    manualReviewRequired: true,
    ...overrides,
  };
}

function buildSignal(overrides: Partial<TradeSignal> = {}): TradeSignal {
  return {
    id: 'signal-1',
    timestamp: Date.now(),
    symbol: 'EURUSD',
    type: 'compra',
    timeframe: '1H',
    entryPrice: 1.1,
    takeProfitPrice: 1.12,
    stopLossPrice: 1.09,
    consensusScore: 88,
    confidenceScore: 82,
    riskRewardRatio: 2,
    primaryReason: 'Strong aligned setup',
    agentContributions: ['TrendAnalyst', 'RiskManager'],
    riskWarnings: [],
    status: 'ready_for_approval',
    ...overrides,
  };
}

function buildApprovedConsensus(): AgentScore[] {
  const agents: AgentScore['agent'][] = [
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

  return agents.map((agent, index) => ({
    agent,
    score: index < 9 ? 84 : 62,
    confidence: 80,
    reasoning: `${agent} approves`,
    timestamp: Date.now(),
  }));
}

test('blocks execution attempts while SAFE_MODE is enabled', () => {
  const engine = new CARVIPIXEngine({ safeMode: true });
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    executionRequested: true,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'EXECUTE_BLOCKED');
});

test('returns NO_TRADE when research proposal envelope misses checksum', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope({ checksum: '' }) as unknown as ResearchProposalEnvelope,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when research proposal envelope misses schemaVersion', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope({ schemaVersion: '' }) as unknown as ResearchProposalEnvelope,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when research proposal envelope misses datasetId', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope({ datasetId: '' }) as unknown as ResearchProposalEnvelope,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when research proposal envelope source is not RESEARCH_LAB', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope({ source: 'CDP' }) as unknown as ResearchProposalEnvelope,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when research proposal envelope status is not CERTIFIED', () => {
  const statuses = ['PARTIAL', 'INVALID', 'SIMULATED'] as const;

  for (const status of statuses) {
    const engine = new CARVIPIXEngine();
    const consensus = engine.evaluateConsensus(buildApprovedConsensus());

    const alert = engine.createAlert(buildSignal(), consensus, undefined, {
      researchProposalEnvelope: buildResearchProposalEnvelope({ status }) as unknown as ResearchProposalEnvelope,
    });

    assert.equal(alert, null);
    assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
  }
});

test('returns NO_TRADE when research proposal envelope manual review is false', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope({ manualReviewRequired: false }) as unknown as ResearchProposalEnvelope,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('allows analysis with valid research proposal envelope but SAFE_MODE still blocks execution', () => {
  const engine = new CARVIPIXEngine({ safeMode: true });
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope() as unknown as ResearchProposalEnvelope,
  });

  assert.ok(alert);
  const blockedExecution = engine.createAlert(buildSignal({ id: 'signal-research-exec' }), consensus, undefined, {
    researchProposalEnvelope: buildResearchProposalEnvelope() as unknown as ResearchProposalEnvelope,
    executionRequested: true,
  });

  assert.equal(blockedExecution, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'EXECUTE_BLOCKED');
});

test('returns NO_TRADE when research proposal json is malformed', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlertFromResearchProposalJson(
    buildSignal({ id: 'signal-research-json-invalid' }),
    consensus,
    '{bad-json',
  );

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('consumes a valid research proposal json and SAFE_MODE still blocks execution', () => {
  const engine = new CARVIPIXEngine({ safeMode: true });
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());
  const proposalJson = JSON.stringify(buildResearchProposalEnvelope());

  const alert = engine.createAlertFromResearchProposalJson(
    buildSignal({ id: 'signal-research-json-valid' }),
    consensus,
    proposalJson,
  );

  assert.ok(alert);

  const blockedExecution = engine.createAlertFromResearchProposalJson(
    buildSignal({ id: 'signal-research-json-exec' }),
    consensus,
    proposalJson,
    undefined,
    { executionRequested: true },
  );

  assert.equal(blockedExecution, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'EXECUTE_BLOCKED');
});

test('returns WAIT when certified input is required but no certified datasets are provided', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [],
    },
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'WAIT');
});

test('returns NO_TRADE when a required dataset is not CERTIFIED', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [
        buildCertifiedDataset({ status: 'REJECTED' }),
      ],
    },
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when certified input misses checksum', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [buildCertifiedDataset({ checksum: '' })],
    },
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when certified input misses schemaVersion', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [buildCertifiedDataset({ schemaVersion: '' })],
    },
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE when certified input misses datasetId', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [buildCertifiedDataset({ datasetId: '' })],
    },
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE for PARTIAL INVALID and SIMULATED dataset statuses', () => {
  const statuses = ['PARTIAL', 'INVALID', 'SIMULATED'] as const;

  for (const status of statuses) {
    const engine = new CARVIPIXEngine();
    const consensus = engine.evaluateConsensus(buildApprovedConsensus());

    const alert = engine.createAlert(buildSignal(), consensus, undefined, {
      certifiedInput: {
        required: true,
        datasets: [buildCertifiedDataset({ status })],
      },
    });

    assert.equal(alert, null);
    assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
  }
});

test('allows continuation with a complete CERTIFIED dataset while SAFE_MODE still blocks execution', () => {
  const engine = new CARVIPIXEngine({ safeMode: true });
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [buildCertifiedDataset()],
    },
  });

  assert.ok(alert);
  const blockedExecution = engine.createAlert(buildSignal({ id: 'signal-certified-exec' }), consensus, undefined, {
    certifiedInput: {
      required: true,
      datasets: [buildCertifiedDataset()],
    },
    executionRequested: true,
  });

  assert.equal(blockedExecution, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'EXECUTE_BLOCKED');
});

test('returns NO_TRADE when corrupted data is detected', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    dataIntegrityValid: false,
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE for critical-priority high conflict scenarios', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());
  const conflicts: ConflictDescriptor[] = [
    {
      source: 'ConflictResolution',
      severity: 'critical',
      reason: 'Trend and market regime conflict heavily',
    },
  ];

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    conflicts,
    priority: 'critical',
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('returns NO_TRADE for high conflict scenarios', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());
  const conflicts: ConflictDescriptor[] = [
    {
      source: 'ConflictResolution',
      severity: 'high',
      reason: 'Structure and momentum diverge materially',
    },
  ];

  const alert = engine.createAlert(buildSignal(), consensus, undefined, {
    conflicts,
    priority: 'medium',
  });

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('rejects low-confidence consensus as NO_TRADE', () => {
  const engine = new CARVIPIXEngine({ confidenceThreshold: 75 });
  const scores = buildApprovedConsensus().map((score) => ({
    ...score,
    confidence: 40,
  }));
  const consensus = engine.evaluateConsensus(scores);

  const alert = engine.createAlert(buildSignal(), consensus);

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('blocks invalid lifecycle transitions', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());
  const alert = engine.createAlert(buildSignal(), consensus);

  assert.ok(alert);
  const movedToTp = engine.updateAlertState(alert.id, 'tp');
  assert.equal(movedToTp, true);

  const invalidTransition = engine.updateAlertState(alert.id, 'activa');
  assert.equal(invalidTransition, false);
  assert.equal(engine.getLifecycleLog().at(-1)?.allowed, false);
});

test('waits when active alert capacity is exhausted by critical priority flow', () => {
  const engine = new CARVIPIXEngine({ maxActiveAlerts: 1 });
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const first = engine.createAlert(buildSignal({ id: 'signal-a' }), consensus);
  assert.ok(first);

  const second = engine.createAlert(buildSignal({ id: 'signal-b' }), consensus, undefined, {
    priority: 'critical',
  });

  assert.equal(second, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'WAIT');
});

test('rejects consensus when an agent score is out of range', () => {
  const engine = new CARVIPIXEngine();
  const scores = buildApprovedConsensus();
  scores[0] = {
    ...scores[0],
    score: 120,
  };

  const consensus = engine.evaluateConsensus(scores);
  assert.equal(consensus.outcome, 'rejected');

  const alert = engine.createAlert(buildSignal({ id: 'signal-invalid-consensus' }), consensus);
  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('blocks invalid signal payloads before alert creation', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(
    buildSignal({
      id: 'signal-invalid-payload',
      riskRewardRatio: 0,
    }),
    consensus,
  );

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('evidence critical conflict blocks alert creation', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const alert = engine.createAlert(
    buildSignal({ id: 'signal-evidence-conflict' }),
    consensus,
    undefined,
    {
      evidenceInput: {
        items: [
          {
            id: 'ev-1',
            source: 'context',
            key: 'market_bias',
            value: 0.99,
            weight: 1,
            confidence: 0.95,
            uncertainty: 0.05,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60_000,
          },
          {
            id: 'ev-2',
            source: 'news',
            key: 'market_bias',
            value: 0.01,
            weight: 1,
            confidence: 0.95,
            uncertainty: 0.05,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60_000,
          },
        ],
      },
    },
  );

  assert.equal(alert, null);
  assert.equal(engine.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('exposes evidence runtime profiling and benchmark', () => {
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(buildApprovedConsensus());

  const benchmark = engine.benchmarkEvidencePipeline(buildSignal({ id: 'signal-bench' }), consensus, 12);
  const profile = engine.getEvidenceRuntimeProfile();

  assert.equal(benchmark.iterations, 12);
  assert.ok(benchmark.averageMs >= 0);
  assert.ok(profile.length > 0);
});