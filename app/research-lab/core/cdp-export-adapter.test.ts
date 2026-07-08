import test from 'node:test';
import assert from 'node:assert/strict';

import type { CertifiedDatasetEnvelope } from '../../engine/types/certifiedData';

import {
  CdpCertifiedDatasetExport,
  loadDatasetFromCDPExport,
  runMinimumCertifiedExperimentFromCDPExport,
} from './cdp-export-adapter';
import { CdpDatasetRequest, ResearchExperimentDefinition, ResearchHypothesis } from './types';

const baseTimestamp = 1_720_000_000_000;

function buildEnvelope(overrides: Partial<CertifiedDatasetEnvelope> = {}): CertifiedDatasetEnvelope {
  return {
    datasetId: 'cert-dataset-1',
    source: 'CDP',
    status: 'CERTIFIED',
    certifiedAt: baseTimestamp,
    schemaVersion: '1.0.0',
    checksum: 'sha256:certified-dataset',
    metadata: { venue: 'mock-cdp' },
    ...overrides,
  };
}

function buildExport(overrides: Partial<CdpCertifiedDatasetExport> = {}): CdpCertifiedDatasetExport {
  return {
    envelope: buildEnvelope(),
    asset: 'XAUUSD',
    timeframe: '5M',
    exportedAt: baseTimestamp + 1_000,
    rowCount: 12,
    rows: Array.from({ length: 12 }, (_, index) => ({
      timestamp: baseTimestamp + index * 300_000,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100.5 + index,
      volume: 1_000 + index,
      spread: 0.25,
      completeness: 1,
    })),
    ...overrides,
  };
}

function buildHypothesis(): ResearchHypothesis {
  return {
    hypothesisId: 'hyp-export-1',
    title: 'Certified export remains stable',
    statement: 'A certified export from CDP should support the minimum experiment.',
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
    experimentId: 'exp-export-1',
    hypothesisId: 'hyp-export-1',
    name: 'Minimum certified export experiment',
    datasetRules: {
      minRecords: 10,
      minCoverage: 0.95,
      maxInvalidRecordRatio: 0.05,
      allowPartialAuthorized: false,
    },
    guardrails: {
      minTrials: 4,
      maxFailureRate: 0.4,
      maxRejectedTrials: 1,
    },
  };
}

const minimumTrials = [
  { trialId: 't1', status: 'passed' as const, baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
  { trialId: 't2', status: 'passed' as const, baselineValue: 1, candidateValue: 1.18, pValue: 0.04 },
  { trialId: 't3', status: 'passed' as const, baselineValue: 1, candidateValue: 1.22, pValue: 0.02 },
  { trialId: 't4', status: 'failed' as const, baselineValue: 1, candidateValue: 0.98, pValue: 0.08 },
];

function createExporter(exportedDataset: CdpCertifiedDatasetExport) {
  return async (request: CdpDatasetRequest): Promise<CdpCertifiedDatasetExport> => {
    assert.equal(request.datasetId, exportedDataset.envelope.datasetId);
    return exportedDataset;
  };
}

test('consumes exportCertifiedDataset contract and adapts a certified dataset', async () => {
  const dataset = await loadDatasetFromCDPExport(
    { datasetId: 'cert-dataset-1', requestedBy: 'research-lab-export-test' },
    createExporter(buildExport()),
  );

  assert.equal(dataset.certification, 'CERTIFIED');
  assert.equal(dataset.checksum, 'sha256:certified-dataset');
  assert.equal(dataset.rowCount, 12);
});

test('rejects exported datasets without checksum', async () => {
  await assert.rejects(
    () =>
      loadDatasetFromCDPExport(
        { datasetId: 'cert-dataset-1' },
        createExporter(buildExport({ envelope: buildEnvelope({ checksum: '' }) })),
      ),
    /checksum/i,
  );
});

test('rejects exported datasets with zero rows', async () => {
  await assert.rejects(
    () =>
      loadDatasetFromCDPExport(
        { datasetId: 'cert-dataset-1' },
        createExporter(buildExport({ rowCount: 0, rows: [] })),
      ),
    /at least one row/i,
  );
});

test('executes a minimum experiment with a certified dataset export and blocks proposal for manual review', async () => {
  const result = await runMinimumCertifiedExperimentFromCDPExport({
    request: { datasetId: 'cert-dataset-1', requestedBy: 'research-lab-export-test' },
    exportCertifiedDataset: createExporter(buildExport()),
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials: minimumTrials,
  });

  assert.equal(result.datasetProfile.certification, 'CERTIFIED');
  assert.equal(result.experimentResult.execution.status, 'completed');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /manual architectural review/i);
});