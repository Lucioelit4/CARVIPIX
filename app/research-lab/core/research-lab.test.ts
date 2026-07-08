import test from 'node:test';
import assert from 'node:assert/strict';

import { CdpDatasetAdapter } from './cdp-dataset-adapter';
import { ResearchLab } from './research-lab';
import { ExperimentTrial, ResearchExperimentDefinition, ResearchHypothesis, ResearchStudyInput } from './types';

const baseTimestamp = 1_720_000_000_000;

function buildDataset(
  records = 40,
  source = 'data-platform-feed',
  certification: ResearchStudyInput['dataset']['certification'] = 'CERTIFIED',
  partialApprovalAuthorized = false,
): ResearchStudyInput['dataset'] {
  return {
    datasetId: 'dataset-1',
    asset: 'XAUUSD',
    timeframe: '5M',
    source,
    certification,
    partialApprovalAuthorized,
    receivedAt: baseTimestamp + records * 300_000,
    records: Array.from({ length: records }, (_, index) => ({
      timestamp: baseTimestamp + index * 300_000,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100.5 + index,
      volume: 1_000 + index,
      spread: 0.3,
      completeness: 1,
    })),
  };
}

function buildHypothesis(): ResearchHypothesis {
  return {
    hypothesisId: 'hyp-1',
    title: 'Lower drawdown with cleaner dataset',
    statement: 'Validated datasets should sustain better experiment outcomes.',
    metricKey: 'candidateValue',
    criteria: {
      minSampleSize: 4,
      minSuccessRate: 0.75,
      minEffectSize: 0.1,
      maxFailureRate: 0.25,
      maxPValue: 0.05,
    },
  };
}

function buildExperiment(): ResearchExperimentDefinition {
  return {
    experimentId: 'exp-1',
    hypothesisId: 'hyp-1',
    name: 'Research dataset validation experiment',
    datasetRules: {
      minRecords: 20,
      minCoverage: 0.95,
      maxInvalidRecordRatio: 0.05,
      allowPartialAuthorized: true,
    },
    guardrails: {
      minTrials: 4,
      maxFailureRate: 0.4,
      maxRejectedTrials: 1,
    },
  };
}

function buildStudy(overrides: Partial<ResearchStudyInput> = {}): ResearchStudyInput {
  return {
    dataset: buildDataset(),
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials: [
      { trialId: 't1', status: 'passed', baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
      { trialId: 't2', status: 'passed', baselineValue: 1, candidateValue: 1.18, pValue: 0.04 },
      { trialId: 't3', status: 'passed', baselineValue: 1, candidateValue: 1.22, pValue: 0.02 },
      { trialId: 't4', status: 'failed', baselineValue: 1, candidateValue: 0.98, pValue: 0.08 },
    ],
    ...overrides,
  };
}

test('rejects hypotheses that do not meet research thresholds', () => {
  const lab = new ResearchLab();
  const weakTrials: ExperimentTrial[] = [
    { trialId: 't1', status: 'passed', baselineValue: 1, candidateValue: 1.02, pValue: 0.10 },
    { trialId: 't2', status: 'failed', baselineValue: 1, candidateValue: 0.99, pValue: 0.20 },
    { trialId: 't3', status: 'passed', baselineValue: 1, candidateValue: 1.01, pValue: 0.12 },
    { trialId: 't4', status: 'failed', baselineValue: 1, candidateValue: 0.97, pValue: 0.15 },
  ];

  const result = lab.runStudy(buildStudy({ trials: weakTrials }));

  assert.equal(result.hypothesisDecision.status, 'rejected');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.hypothesisDecision.rationale.join(' '), /Success rate below threshold|Effect size below threshold/);
});

test('validates hypotheses that meet experiment gates', () => {
  const lab = new ResearchLab();

  const result = lab.runStudy(buildStudy());

  assert.equal(result.datasetValidation.valid, true);
  assert.equal(result.experimentResult.execution.status, 'completed');
  assert.equal(result.hypothesisDecision.status, 'validated');
  assert.equal(result.proposal.status, 'proposed');
});

test('accepts CERTIFIED datasets adapted from CDP', () => {
  const lab = new ResearchLab();
  const adapter = new CdpDatasetAdapter();
  const dataset = adapter.adapt(buildDataset(40, 'cdp-feed', 'CERTIFIED'));

  const result = lab.runStudy(buildStudy({ dataset }));

  assert.equal(result.datasetProfile.certification, 'CERTIFIED');
  assert.equal(result.datasetValidation.valid, true);
  assert.equal(result.experimentResult.execution.status, 'completed');
});

test('fails experiments that violate guardrails', () => {
  const lab = new ResearchLab();
  const failingTrials: ExperimentTrial[] = [
    { trialId: 't1', status: 'failed', baselineValue: 1, candidateValue: 0.8 },
    { trialId: 't2', status: 'failed', baselineValue: 1, candidateValue: 0.7 },
    { trialId: 't3', status: 'rejected', baselineValue: 1, candidateValue: 0.9 },
    { trialId: 't4', status: 'passed', baselineValue: 1, candidateValue: 1.05 },
  ];

  const result = lab.runStudy(buildStudy({ trials: failingTrials }));

  assert.equal(result.experimentResult.execution.status, 'failed');
  assert.equal(result.experimentResult.valid, false);
  assert.equal(result.hypothesisDecision.status, 'rejected');
});

test('blocks invalid datasets before experiment approval', () => {
  const lab = new ResearchLab();
  const invalidDataset = buildDataset(4, 'cdp-feed', 'INVALID');
  invalidDataset.records[1] = {
    timestamp: baseTimestamp,
    open: 100,
    high: 90,
    low: 95,
    close: 105,
    completeness: 1,
  };

  const result = lab.runStudy(buildStudy({ dataset: invalidDataset }));

  assert.equal(result.datasetValidation.valid, false);
  assert.equal(result.experimentResult.execution.status, 'failed');
  assert.equal(result.proposal.status, 'blocked');
  assert.ok(result.datasetProfile.issues.length > 0);
});

test('blocks SIMULATED datasets from experiments and promotion', () => {
  const lab = new ResearchLab();

  const result = lab.runStudy(
    buildStudy({
      dataset: buildDataset(40, 'simulated-feed', 'SIMULATED'),
    }),
  );

  assert.equal(result.datasetValidation.valid, false);
  assert.equal(result.experimentResult.execution.status, 'failed');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /CERTIFIED|simulated/i);
  assert.equal(result.metrics.blockedPromotions, 1);
});

test('rejects experiments without real certified-or-authorized-partial data', () => {
  const lab = new ResearchLab();

  const result = lab.runStudy(
    buildStudy({
      dataset: buildDataset(40, 'cdp-feed', 'PARTIAL', false),
    }),
  );

  assert.equal(result.datasetValidation.valid, false);
  assert.equal(result.experimentResult.execution.status, 'failed');
  assert.match(result.datasetValidation.blockingReasons.join(' '), /PARTIAL datasets require explicit authorization/i);
});

test('blocks proposal when experiment used non-certified but authorized data', () => {
  const lab = new ResearchLab();

  const result = lab.runStudy(
    buildStudy({
      dataset: buildDataset(40, 'cdp-feed', 'PARTIAL', true),
    }),
  );

  assert.equal(result.datasetValidation.valid, true);
  assert.equal(result.experimentResult.execution.status, 'completed');
  assert.equal(result.hypothesisDecision.status, 'validated');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /CERTIFIED dataset/i);
});

test('blocks proposals when direct production changes are requested', () => {
  const lab = new ResearchLab();

  const result = lab.runStudy(
    buildStudy({
      dataset: buildDataset(),
      productionChangeRequested: true,
    }),
  );

  assert.equal(result.hypothesisDecision.status, 'validated');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /production/i);
});