import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { CertifiedDatasetEnvelope } from '../../engine/types/certifiedData';

import {
  exportResearchProposalEnvelope,
  runMinimumCertifiedExperimentFromCDPExport,
  type CdpCertifiedDatasetExport,
} from './cdp-export-adapter';
import type { CdpDatasetRequest, ResearchExperimentDefinition, ResearchHypothesis, ResearchStudyResult } from './types';

const baseTimestamp = 1_720_000_000_000;

function buildEnvelope(status: CertifiedDatasetEnvelope['status'] = 'CERTIFIED', checksum = 'sha256:proposal-dataset'): CertifiedDatasetEnvelope {
  return {
    datasetId: 'proposal-dataset-1',
    source: 'CDP',
    status,
    certifiedAt: baseTimestamp,
    schemaVersion: '1.0.0',
    checksum,
    metadata: { exportType: 'proposal-test' },
  };
}

function buildExport(status: CertifiedDatasetEnvelope['status'] = 'CERTIFIED', checksum = 'sha256:proposal-dataset'): CdpCertifiedDatasetExport {
  return {
    envelope: buildEnvelope(status, checksum),
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
  };
}

function buildHypothesis(): ResearchHypothesis {
  return {
    hypothesisId: 'hyp-proposal-1',
    title: 'Proposal export remains certified',
    statement: 'A certified experiment should export a review-gated proposal.',
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
    experimentId: 'exp-proposal-1',
    hypothesisId: 'hyp-proposal-1',
    name: 'Proposal export experiment',
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

async function buildStudyResult(exportedDataset: CdpCertifiedDatasetExport): Promise<ResearchStudyResult> {
  return runMinimumCertifiedExperimentFromCDPExport({
    request: { datasetId: exportedDataset.envelope.datasetId, requestedBy: 'proposal-export-test' },
    exportCertifiedDataset: createExporter(exportedDataset),
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials: minimumTrials,
  });
}

test('exports a valid proposal for a CERTIFIED dataset', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'research-proposal-'));
  const studyResult = await buildStudyResult(buildExport());

  const exported = await exportResearchProposalEnvelope({
    studyResult,
    outputDir,
    proposalId: 'proposal-cert-1',
    createdAt: baseTimestamp + 99_000,
  });

  assert.equal(exported.envelope.proposalId, 'proposal-cert-1');
  assert.equal(exported.envelope.datasetId, 'proposal-dataset-1');
  assert.equal(exported.envelope.checksum, 'sha256:proposal-dataset');
  assert.equal(exported.envelope.schemaVersion, '1.0.0');
  assert.equal(exported.envelope.source, 'RESEARCH_LAB');
  assert.equal(exported.envelope.status, 'CERTIFIED');
  assert.equal(exported.envelope.manualReviewRequired, true);
  assert.equal(exported.envelope.experimentId, 'exp-proposal-1');

  const proposalFile = JSON.parse(await readFile(exported.proposalPath, 'utf8')) as { proposalId: string };
  const manifestFile = JSON.parse(await readFile(exported.manifestPath, 'utf8')) as { latestProposalId: string };
  assert.equal(proposalFile.proposalId, 'proposal-cert-1');
  assert.equal(manifestFile.latestProposalId, 'proposal-cert-1');
});

test('rejects proposal export without checksum', async () => {
  const studyResult = await buildStudyResult(buildExport());
  const mutatedStudy: ResearchStudyResult = {
    ...studyResult,
    datasetProfile: {
      ...studyResult.datasetProfile,
      checksum: '',
    },
  };

  await assert.rejects(
    () => exportResearchProposalEnvelope({ studyResult: mutatedStudy }),
    /checksum/i,
  );
});

test('rejects proposal export without manualReviewRequired', async () => {
  const studyResult = await buildStudyResult(buildExport());

  await assert.rejects(
    () => exportResearchProposalEnvelope({ studyResult: { ...studyResult, manualReviewRequired: false } }),
    /manualReviewRequired/i,
  );
});

test('rejects proposal export for PARTIAL INVALID or SIMULATED datasets', async () => {
  const variants = [
    { certification: 'PARTIAL' as const },
    { certification: 'INVALID' as const },
    { certification: 'SIMULATED' as const },
  ];

  for (const variant of variants) {
    const certifiedStudy = await buildStudyResult(buildExport());
    const mutatedStudy: ResearchStudyResult = {
      ...certifiedStudy,
      datasetProfile: {
        ...certifiedStudy.datasetProfile,
        certification: variant.certification,
      },
    };

    await assert.rejects(
      () => exportResearchProposalEnvelope({ studyResult: mutatedStudy }),
      /CERTIFIED dataset/i,
    );
  }
});