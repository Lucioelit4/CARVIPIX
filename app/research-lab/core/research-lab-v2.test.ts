import test from 'node:test';
import assert from 'node:assert/strict';

import { ResearchLab } from './research-lab';
import { ResearchStudyInput } from './types';

const baseTimestamp = 1_720_000_000_000;

function buildDataset(datasetId: string, certification: ResearchStudyInput['dataset']['certification'] = 'CERTIFIED'): ResearchStudyInput['dataset'] {
  return {
    datasetId,
    asset: 'XAUUSD',
    timeframe: '5M',
    source: certification === 'SIMULATED' ? 'simulated-feed' : 'cdp-feed',
    certification,
    partialApprovalAuthorized: certification === 'PARTIAL',
    checksum: `sha256:${datasetId}`,
    schemaVersion: '1.0.0',
    rowCount: 40,
    receivedAt: baseTimestamp + 40 * 300_000,
    records: Array.from({ length: 40 }, (_, index) => ({
      timestamp: baseTimestamp + index * 300_000,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100.5 + index,
      spread: 0.3,
      completeness: 1,
    })),
  };
}

function buildHypothesis(hypothesisId: string, title: string): ResearchStudyInput['hypothesis'] {
  return {
    hypothesisId,
    title,
    statement: `${title} statement`,
    metricKey: 'candidateValue',
    governance: {
      owner: 'research-team',
      tags: ['v2', 'scientific'],
      version: '2.0.0',
    },
    criteria: {
      minSampleSize: 4,
      minSuccessRate: 0.75,
      minEffectSize: 0.1,
      maxFailureRate: 0.25,
      maxPValue: 0.05,
    },
  };
}

function buildExperiment(experimentId: string, hypothesisId: string, label: string): ResearchStudyInput['experiment'] {
  return {
    experimentId,
    hypothesisId,
    name: `experiment-${label}`,
    comparisonContext: {
      baselineLabel: 'baseline',
      candidateLabel: label,
      previousVersionLabel: 'previous',
      currentVersionLabel: 'current',
    },
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

function strongTrials(): ResearchStudyInput['trials'] {
  return [
    { trialId: 't1', status: 'passed', baselineValue: 1, candidateValue: 1.25, pValue: 0.02 },
    { trialId: 't2', status: 'passed', baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
    { trialId: 't3', status: 'passed', baselineValue: 1, candidateValue: 1.22, pValue: 0.03 },
    { trialId: 't4', status: 'failed', baselineValue: 1, candidateValue: 0.98, pValue: 0.09 },
  ];
}

function weakTrials(): ResearchStudyInput['trials'] {
  return [
    { trialId: 't1', status: 'failed', baselineValue: 1, candidateValue: 0.8, pValue: 0.2 },
    { trialId: 't2', status: 'failed', baselineValue: 1, candidateValue: 0.9, pValue: 0.18 },
    { trialId: 't3', status: 'rejected', baselineValue: 1, candidateValue: 0.95, pValue: 0.15 },
    { trialId: 't4', status: 'passed', baselineValue: 1, candidateValue: 1.01, pValue: 0.1 },
  ];
}

function buildStudy(input: {
  studyId: string;
  traceId: string;
  comparisonLabel: string;
  hypothesisId: string;
  experimentId: string;
  datasetId: string;
  trials: ResearchStudyInput['trials'];
  certification?: ResearchStudyInput['dataset']['certification'];
}): ResearchStudyInput {
  return {
    studyId: input.studyId,
    traceId: input.traceId,
    comparisonLabel: input.comparisonLabel,
    dataset: buildDataset(input.datasetId, input.certification ?? 'CERTIFIED'),
    hypothesis: buildHypothesis(input.hypothesisId, input.hypothesisId),
    experiment: buildExperiment(input.experimentId, input.hypothesisId, input.comparisonLabel),
    trials: input.trials,
    manualReviewRequired: true,
  };
}

test('runs a scientific program with hypothesis A vs B vs current including baseline and previous comparisons', () => {
  const lab = new ResearchLab();

  const program = lab.runProgram([
    buildStudy({
      studyId: 'study-baseline',
      traceId: 'trace-baseline',
      comparisonLabel: 'baseline',
      hypothesisId: 'hyp-current',
      experimentId: 'exp-current',
      datasetId: 'dataset-current',
      trials: strongTrials(),
    }),
    buildStudy({
      studyId: 'study-hyp-a',
      traceId: 'trace-hyp-a',
      comparisonLabel: 'hypothesis-a',
      hypothesisId: 'hyp-a',
      experimentId: 'exp-a',
      datasetId: 'dataset-a',
      trials: strongTrials(),
    }),
    buildStudy({
      studyId: 'study-hyp-b',
      traceId: 'trace-hyp-b',
      comparisonLabel: 'hypothesis-b',
      hypothesisId: 'hyp-b',
      experimentId: 'exp-b',
      datasetId: 'dataset-b',
      trials: weakTrials(),
    }),
    buildStudy({
      studyId: 'study-previous',
      traceId: 'trace-previous',
      comparisonLabel: 'previous',
      hypothesisId: 'hyp-previous',
      experimentId: 'exp-previous',
      datasetId: 'dataset-previous',
      trials: strongTrials(),
    }),
  ]);

  assert.equal(program.studies.length, 4);
  assert.equal(program.history.length, 4);
  assert.ok(program.rankings.length >= 4);
  assert.ok(program.comparisons.some((row) => row.comparisonLabel === 'hypothesis-a'));
  assert.ok(program.comparisons.some((row) => row.comparisonLabel === 'hypothesis-b'));
  assert.ok(program.comparisons.some((row) => row.comparisonLabel === 'baseline'));
  assert.ok(program.comparisons.some((row) => row.comparisonLabel === 'previous'));
  assert.ok(program.dashboard.rankings.length >= 4);
  assert.equal(program.dashboard.historyEntries, 4);
  assert.ok(program.report.recommendations.length > 0);
});

test('creates automatic ranking and keeps promotion manual-only', () => {
  const lab = new ResearchLab();
  const result = lab.runStudy(
    buildStudy({
      studyId: 'study-ranking-1',
      traceId: 'trace-ranking-1',
      comparisonLabel: 'current',
      hypothesisId: 'hyp-ranking',
      experimentId: 'exp-ranking',
      datasetId: 'dataset-ranking',
      trials: strongTrials(),
    }),
  );

  assert.ok(result.experimentResult.rankingScore > 0);
  assert.equal(result.proposal.reviewMode, 'manual-only');
  assert.equal(result.proposal.status, 'blocked');
  assert.ok(result.proposal.reasons.some((reason) => /manual architectural review/i.test(reason)));
});

test('strengthens automatic rejection for weak experiments and invalid datasets', () => {
  const lab = new ResearchLab();

  const rejected = lab.runStudy(
    buildStudy({
      studyId: 'study-reject-weak',
      traceId: 'trace-reject-weak',
      comparisonLabel: 'hypothesis-b',
      hypothesisId: 'hyp-reject',
      experimentId: 'exp-reject',
      datasetId: 'dataset-reject',
      trials: weakTrials(),
    }),
  );

  assert.equal(rejected.experimentResult.execution.status, 'failed');
  assert.ok(rejected.experimentResult.rejectionReasons.length > 0);
  assert.equal(rejected.hypothesisDecision.status, 'rejected');
  assert.equal(rejected.proposal.status, 'blocked');

  const simulatedRejected = lab.runStudy(
    buildStudy({
      studyId: 'study-reject-sim',
      traceId: 'trace-reject-sim',
      comparisonLabel: 'hypothesis-simulated',
      hypothesisId: 'hyp-sim',
      experimentId: 'exp-sim',
      datasetId: 'dataset-sim',
      trials: strongTrials(),
      certification: 'SIMULATED',
    }),
  );

  assert.equal(simulatedRejected.datasetValidation.valid, false);
  assert.equal(simulatedRejected.experimentResult.execution.status, 'failed');
  assert.equal(simulatedRejected.proposal.status, 'blocked');
});

test('stores full traceability and history entries for every study', () => {
  const lab = new ResearchLab();
  const result = lab.runStudy(
    buildStudy({
      studyId: 'study-trace',
      traceId: 'trace-trace',
      comparisonLabel: 'current',
      hypothesisId: 'hyp-trace',
      experimentId: 'exp-trace',
      datasetId: 'dataset-trace',
      trials: strongTrials(),
    }),
  );

  assert.equal(result.historyEntry.studyId, 'study-trace');
  assert.equal(result.historyEntry.traceId, 'trace-trace');
  assert.ok(result.historyEntry.trace.length >= 5);
  assert.equal(result.historyEntry.datasetId, 'dataset-trace');
  assert.equal(result.historyEntry.experimentId, 'exp-trace');
});