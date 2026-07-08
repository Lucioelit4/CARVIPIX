import test from 'node:test';
import assert from 'node:assert/strict';

import { CdpDatasetInput, CdpDatasetRequest, ResearchExperimentDefinition, ResearchHypothesis, ResearchStudyInput } from './types';
import { loadDatasetFromCDP } from './cdp-dataset-adapter';
import { ResearchLab } from './research-lab';

const baseTimestamp = 1_720_000_000_000;

function buildCertifiedCdpDataset(
  certification: CdpDatasetInput['certification'] = 'CERTIFIED',
): CdpDatasetInput {
  return {
    datasetId: 'cdp-dataset-1',
    asset: 'XAUUSD',
    timeframe: '5M',
    source: certification === 'SIMULATED' ? 'cdp-simulated-mock' : 'cdp-certified-mock',
    certification,
    partialApprovalAuthorized: certification === 'PARTIAL',
    receivedAt: baseTimestamp + 40 * 300_000,
    records: Array.from({ length: 40 }, (_, index) => ({
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
    hypothesisId: 'hyp-cdp-1',
    title: 'CDP certified dataset handshake',
    statement: 'Certified CDP datasets must be accepted by the Research Lab.',
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
    experimentId: 'exp-cdp-1',
    hypothesisId: 'hyp-cdp-1',
    name: 'CDP handshake contract experiment',
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

function buildStudy(dataset: ResearchStudyInput['dataset']): ResearchStudyInput {
  return {
    dataset,
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials: [
      { trialId: 't1', status: 'passed', baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
      { trialId: 't2', status: 'passed', baselineValue: 1, candidateValue: 1.18, pValue: 0.04 },
      { trialId: 't3', status: 'passed', baselineValue: 1, candidateValue: 1.22, pValue: 0.02 },
      { trialId: 't4', status: 'failed', baselineValue: 1, candidateValue: 0.98, pValue: 0.08 },
    ],
  };
}

function createMockFetcher(dataset: CdpDatasetInput) {
  return async (request: CdpDatasetRequest): Promise<CdpDatasetInput> => {
    assert.equal(request.datasetId, dataset.datasetId);
    return dataset;
  };
}

test('loads a certified CDP dataset through the handshake contract', async () => {
  const request: CdpDatasetRequest = {
    datasetId: 'cdp-dataset-1',
    asset: 'XAUUSD',
    timeframe: '5M',
    requestedBy: 'research-lab-contract-test',
  };

  const dataset = await loadDatasetFromCDP(request, createMockFetcher(buildCertifiedCdpDataset('CERTIFIED')));

  assert.equal(dataset.certification, 'CERTIFIED');
  assert.equal(dataset.source, 'cdp-certified-mock');
  assert.equal(dataset.records.length, 40);
});

test('accepts certified CDP handshake datasets in Research Lab', async () => {
  const lab = new ResearchLab();
  const dataset = await loadDatasetFromCDP(
    { datasetId: 'cdp-dataset-1', requestedBy: 'research-lab-test' },
    createMockFetcher(buildCertifiedCdpDataset('CERTIFIED')),
  );

  const result = lab.runStudy(buildStudy(dataset));

  assert.equal(result.datasetValidation.valid, true);
  assert.equal(result.experimentResult.execution.status, 'completed');
});

test('rejects invalid CDP handshake datasets in Research Lab', async () => {
  const lab = new ResearchLab();
  const invalidDataset = buildCertifiedCdpDataset('INVALID');
  invalidDataset.records[2] = {
    timestamp: baseTimestamp + 600_000,
    open: 100,
    high: 90,
    low: 95,
    close: 105,
    completeness: 1,
  };

  const dataset = await loadDatasetFromCDP(
    { datasetId: 'cdp-dataset-1', requestedBy: 'research-lab-test' },
    createMockFetcher(invalidDataset),
  );

  const result = lab.runStudy(buildStudy(dataset));

  assert.equal(result.datasetValidation.valid, false);
  assert.equal(result.experimentResult.execution.status, 'failed');
  assert.match(result.datasetValidation.blockingReasons.join(' '), /INVALID/i);
});

test('blocks simulated CDP handshake datasets for promotion', async () => {
  const lab = new ResearchLab();
  const dataset = await loadDatasetFromCDP(
    { datasetId: 'cdp-dataset-1', requestedBy: 'research-lab-test' },
    createMockFetcher(buildCertifiedCdpDataset('SIMULATED')),
  );

  const result = lab.runStudy(buildStudy(dataset));

  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /CERTIFIED|simulated/i);
});