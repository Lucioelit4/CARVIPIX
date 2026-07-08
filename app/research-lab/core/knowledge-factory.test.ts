import test from 'node:test';
import assert from 'node:assert/strict';

import { KnowledgeFactory } from './knowledge-factory';
import type { ExperimentTrial, ResearchExperimentDefinition, ResearchHypothesis, ResearchStudyInput } from './types';

const baseTimestamp = 1_720_100_000_000;

function buildDataset(datasetId: string): ResearchStudyInput['dataset'] {
  return {
    datasetId,
    asset: 'XAUUSD',
    timeframe: '5M',
    source: 'cdp-feed',
    certification: 'CERTIFIED',
    partialApprovalAuthorized: false,
    checksum: `sha256:${datasetId}`,
    schemaVersion: '1.0.0',
    rowCount: 30,
    receivedAt: baseTimestamp + 30 * 300_000,
    records: Array.from({ length: 30 }, (_, index) => ({
      timestamp: baseTimestamp + index * 300_000,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100.5 + index,
      spread: 0.2,
      completeness: 1,
    })),
  };
}

function buildHypothesis(hypothesisId: string): ResearchHypothesis {
  return {
    hypothesisId,
    title: `title-${hypothesisId}`,
    statement: `statement-${hypothesisId}`,
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

function buildExperiment(experimentId: string, hypothesisId: string): ResearchExperimentDefinition {
  return {
    experimentId,
    hypothesisId,
    name: `exp-${experimentId}`,
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

function strongTrials(): ExperimentTrial[] {
  return [
    { trialId: 't1', status: 'passed', baselineValue: 1, candidateValue: 1.22, pValue: 0.03 },
    { trialId: 't2', status: 'passed', baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
    { trialId: 't3', status: 'passed', baselineValue: 1, candidateValue: 1.19, pValue: 0.04 },
    { trialId: 't4', status: 'failed', baselineValue: 1, candidateValue: 0.98, pValue: 0.07 },
  ];
}

function weakTrials(): ExperimentTrial[] {
  return [
    { trialId: 't1', status: 'failed', baselineValue: 1, candidateValue: 0.9, pValue: 0.2 },
    { trialId: 't2', status: 'failed', baselineValue: 1, candidateValue: 0.88, pValue: 0.25 },
    { trialId: 't3', status: 'rejected', baselineValue: 1, candidateValue: 0.93, pValue: 0.17 },
    { trialId: 't4', status: 'passed', baselineValue: 1, candidateValue: 1.01, pValue: 0.1 },
  ];
}

function buildStudy(input: {
  studyId: string;
  hypothesisId: string;
  experimentId: string;
  datasetId: string;
  trials: ExperimentTrial[];
  comparisonLabel?: string;
}): ResearchStudyInput {
  return {
    studyId: input.studyId,
    traceId: `trace-${input.studyId}`,
    comparisonLabel: input.comparisonLabel,
    dataset: buildDataset(input.datasetId),
    hypothesis: buildHypothesis(input.hypothesisId),
    experiment: buildExperiment(input.experimentId, input.hypothesisId),
    trials: input.trials,
  };
}

test('pipeline converts every successful experiment into a knowledge card automatically', () => {
  const factory = new KnowledgeFactory();
  const run = factory.runPipeline(
    buildStudy({
      studyId: 'study-kc-success',
      hypothesisId: 'hyp-kc-success',
      experimentId: 'exp-kc-success',
      datasetId: 'dataset-kc-success',
      trials: strongTrials(),
    }),
  );

  assert.equal(run.study.experimentResult.execution.status, 'completed');
  assert.equal(run.study.hypothesisDecision.status, 'validated');
  assert.equal(run.stages.at(-2)?.stage, 'knowledge_card');
  assert.equal(run.knowledgeCard.studyId, 'study-kc-success');
  assert.ok(run.knowledgeCard.cardId.length > 5);
  assert.ok(run.autoSummary.includes('knowledge_card='));

  const kb = factory.getKnowledgeBaseSnapshot();
  assert.equal(kb.cards.length, 1);
  assert.equal(kb.history.length, 1);
});

test('runs queued batch experiments in parallel and exposes ranking dashboard history and version comparison', async () => {
  const factory = new KnowledgeFactory();

  factory.enqueueMany([
    buildStudy({
      studyId: 'study-a',
      hypothesisId: 'hyp-a',
      experimentId: 'exp-a',
      datasetId: 'dataset-a',
      trials: strongTrials(),
      comparisonLabel: 'baseline',
    }),
    buildStudy({
      studyId: 'study-b',
      hypothesisId: 'hyp-b',
      experimentId: 'exp-b',
      datasetId: 'dataset-b',
      trials: strongTrials(),
      comparisonLabel: 'current',
    }),
    buildStudy({
      studyId: 'study-c',
      hypothesisId: 'hyp-c',
      experimentId: 'exp-c',
      datasetId: 'dataset-c',
      trials: weakTrials(),
      comparisonLabel: 'candidate-c',
    }),
  ]);

  const result = await factory.runBatch({ parallelism: 2, batchSize: 3, baselineStudyId: 'study-a' });

  assert.equal(result.queueProcessed, 3);
  assert.equal(result.runs.length, 3);
  assert.ok(result.rankings.length >= 3);
  assert.ok(result.dashboard.historyEntries >= 3);
  assert.ok(result.report.summary.some((line) => /knowledge cards generated/i.test(line)));

  const kb = factory.getKnowledgeBaseSnapshot();
  assert.equal(kb.cards.length, 3);
  assert.equal(kb.history.length, 3);
  assert.ok(kb.historicalRanking.length >= 3);

  const [base, candidate] = kb.cards;
  const comparison = factory.compareVersions(base.cardId, candidate.cardId);
  assert.equal(comparison.baseCardId, base.cardId);
  assert.equal(comparison.candidateCardId, candidate.cardId);
  assert.ok(Number.isFinite(comparison.rankingDelta));
});
