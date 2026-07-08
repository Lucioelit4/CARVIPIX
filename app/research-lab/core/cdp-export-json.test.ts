import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  loadDatasetFromCDPExportJsonFile,
  runMinimumCertifiedExperimentFromCDPExportJsonFile,
} from './cdp-export-adapter';
import type { ResearchExperimentDefinition, ResearchHypothesis } from './types';

const fixturePath = fileURLToPath(new URL('../fixtures/cdp-certified-dataset.export.json', import.meta.url));

function buildHypothesis(): ResearchHypothesis {
  return {
    hypothesisId: 'hyp-json-export-1',
    title: 'JSON certified export remains usable',
    statement: 'A JSON certified export from CDP should support a minimum experiment.',
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
    experimentId: 'exp-json-export-1',
    hypothesisId: 'hyp-json-export-1',
    name: 'Minimum JSON export experiment',
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

test('consumes a real/mock CDP JSON export file', async () => {
  const dataset = await loadDatasetFromCDPExportJsonFile(fixturePath);

  assert.equal(dataset.datasetId, 'cert-dataset-json-1');
  assert.equal(dataset.certification, 'CERTIFIED');
  assert.equal(dataset.checksum, 'sha256:json-certified-dataset');
  assert.equal(dataset.rowCount, 12);
  assert.equal(dataset.records.length, 12);
});

test('executes a minimum experiment from a CDP JSON export and generates a blocked proposal', async () => {
  const result = await runMinimumCertifiedExperimentFromCDPExportJsonFile({
    filePath: fixturePath,
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials: minimumTrials,
  });

  assert.equal(result.datasetProfile.certification, 'CERTIFIED');
  assert.equal(result.experimentResult.execution.status, 'completed');
  assert.equal(result.proposal.status, 'blocked');
  assert.match(result.proposal.reasons.join(' '), /manual architectural review/i);
});