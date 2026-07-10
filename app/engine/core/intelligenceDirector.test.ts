import test from 'node:test';
import assert from 'node:assert/strict';

import { AuditEngine } from './auditEngine';
import { ConflictResolutionEngine } from './conflictResolutionEngine';
import { EvidenceEngine } from './evidenceEngine';
import { IntelligenceDirector } from './intelligenceDirector';
import { PriorityEngine } from './priorityEngine';
import { SafeModePolicy } from './safeModePolicy';
import type {
  CertifiedDatasetEnvelope,
  CertifiedDatasetSource,
  CertifiedDatasetStatus,
  ConsensusResult,
  EngineMetrics,
  ResearchProposalEnvelope,
  TradeAlert,
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
    datasetId: 'lab-001',
    source: 'RESEARCH_LAB',
    status: 'CERTIFIED',
    schemaVersion: '1.0.0',
    checksum: 'abc123',
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

const baseConsensus: ConsensusResult = {
  outcome: 'approved',
  agentScores: [],
  approvalCount: 9,
  rejectionCount: 0,
  consensusThreshold: 9,
  averageScore: 80,
  overallConfidence: 82,
  reasonForDecision: 'approved',
  timestamp: Date.now(),
};

const baseSignal: TradeSignal = {
  id: 'signal-director',
  timestamp: Date.now(),
  symbol: 'EURUSD',
  type: 'compra',
  timeframe: '1H',
  entryPrice: 1.1,
  takeProfitPrice: 1.2,
  stopLossPrice: 1.0,
  consensusScore: 80,
  confidenceScore: 80,
  riskRewardRatio: 2,
  primaryReason: 'director test',
  agentContributions: [],
  riskWarnings: [],
  status: 'ready_for_approval',
};

const baseMetrics: EngineMetrics = {
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

function buildDirector(safeMode = true): { director: IntelligenceDirector; audit: AuditEngine } {
  const audit = new AuditEngine();
  return {
    director: new IntelligenceDirector(
      audit,
      new PriorityEngine(),
      new ConflictResolutionEngine(),
      new SafeModePolicy(safeMode),
      new EvidenceEngine(),
    ),
    audit,
  };
}

function createAlert(): TradeAlert {
  return {
    id: 'alert-director',
    symbol: 'EURUSD',
    type: 'compra',
    state: 'activa',
    entryPrice: 1.1,
    takeProfitPrice: 1.2,
    stopLossPrice: 1.0,
    timeframe: '1H',
    riskRewardRatio: 2,
    consensusResult: baseConsensus,
    createdAt: Date.now(),
    reasoning: 'created',
    tags: [],
    source: 'engine',
  };
}

test('critical priority is rejected as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: { priority: 'critical' },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('missing certified datasets returns WAIT when certified input is required', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'WAIT');
});

test('non certified datasets are blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [
          buildCertifiedDataset({ status: 'PENDING' }),
        ],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('missing checksum is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [buildCertifiedDataset({ checksum: '' })],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('missing schemaVersion is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [buildCertifiedDataset({ schemaVersion: '' })],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('missing datasetId is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [buildCertifiedDataset({ datasetId: '' })],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('missing source is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [{ ...buildCertifiedDataset(), source: '' } as unknown as CertifiedDatasetEnvelope],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('PARTIAL INVALID and SIMULATED statuses are blocked as NO_TRADE', () => {
  const statuses = ['PARTIAL', 'INVALID', 'SIMULATED'] as const;

  for (const status of statuses) {
    const { director, audit } = buildDirector();
    const result = director.decideAlertCreation({
      signal: baseSignal,
      consensusResult: baseConsensus,
      metrics: baseMetrics,
      options: {
        certifiedInput: {
          required: true,
          datasets: [buildCertifiedDataset({ status })],
        },
      },
      createAlert,
    });

    assert.equal(result, null);
    assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
  }
});

test('complete CERTIFIED dataset allows continuation without execution', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      certifiedInput: {
        required: true,
        datasets: [buildCertifiedDataset()],
      },
    },
    createAlert,
  });

  assert.ok(result);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'ALERT_CREATED');
});

test('research proposal envelope missing checksum is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope({ checksum: '' }) as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('research proposal envelope missing schemaVersion is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope({ schemaVersion: '' }) as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('research proposal envelope missing datasetId is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope({ datasetId: '' }) as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('research proposal envelope wrong source is blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope({ source: 'CDP' }) as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('research proposal envelope non certified status is blocked as NO_TRADE', () => {
  const statuses = ['PARTIAL', 'INVALID', 'SIMULATED'] as const;

  for (const status of statuses) {
    const { director, audit } = buildDirector();
    const result = director.decideAlertCreation({
      signal: baseSignal,
      consensusResult: baseConsensus,
      metrics: baseMetrics,
      options: {
        researchProposalEnvelope: buildResearchProposalEnvelope({ status }) as unknown as ResearchProposalEnvelope,
      },
      createAlert,
    });

    assert.equal(result, null);
    assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
  }
});

test('research proposal envelope requires manual review true', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope({ manualReviewRequired: false }) as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('valid research proposal envelope allows analysis only', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: baseSignal,
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      researchProposalEnvelope: buildResearchProposalEnvelope() as unknown as ResearchProposalEnvelope,
    },
    createAlert,
  });

  assert.ok(result);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'ALERT_CREATED');
});

test('invalid signal price levels are blocked as NO_TRADE', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: {
      ...baseSignal,
      id: 'signal-invalid-prices',
      entryPrice: Number.NaN,
    },
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'NO_TRADE');
});

test('critical failures marked as missing data do not block by themselves', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: {
      ...baseSignal,
      id: 'signal-missing-gate-data',
    },
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    safetyGateResults: {
      allPassed: true,
      modeProvisional: true,
      criticalFailures: [
        {
          gate: 'LIQUIDITY',
          reason: 'spread data missing',
          reason_isDataMissing: true,
        },
      ],
    },
    createAlert,
  });

  assert.ok(result);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'ALERT_CREATED');
});

test('blocks decision when evidence quality is too low', () => {
  const { director, audit } = buildDirector();
  const result = director.decideAlertCreation({
    signal: {
      ...baseSignal,
      id: 'signal-low-evidence-quality',
    },
    consensusResult: baseConsensus,
    metrics: baseMetrics,
    options: {
      evidenceInput: {
        items: [
          {
            id: 'ev-low-1',
            source: 'context',
            key: 'setup_quality',
            value: 0.1,
            weight: 1,
            confidence: 0.2,
            uncertainty: 0.9,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30_000,
          },
        ],
      },
    },
    createAlert,
  });

  assert.equal(result, null);
  assert.equal(audit.getDecisionLog().at(-1)?.action, 'WAIT');
});