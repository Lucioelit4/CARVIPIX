import { listResearchExecutionRecords } from './store';
import { aggregateVersionMetrics, buildComparableMetrics } from './analytics';
import type {
  EngineHistoricalComparisonReport,
  ProfessionalComparisonReport,
  ResearchExecutionRecord,
  VersionDeltaMetric,
} from './types';

function averageRecovery(record: ResearchExecutionRecord): number {
  const completed = record.jobs.filter((job) => job.status === 'completed' && job.result);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, job) => sum + (job.result?.metrics.recoveryFactor || 0), 0);
  return total / completed.length;
}

function averageExpectancy(record: ResearchExecutionRecord): number {
  const completed = record.jobs.filter((job) => job.status === 'completed' && job.result);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, job) => sum + (job.result?.metrics.expectancy || 0), 0);
  return total / completed.length;
}

export function compareResearchExecutions(runIds: string[]): ProfessionalComparisonReport {
  const allRecords = listResearchExecutionRecords(500);
  const selected = allRecords.filter((record) => runIds.includes(record.metadata.runId));

  const entries = selected.map((record) => {
    const completedJobs = record.summary.completedJobs;
    const failedJobs = record.summary.failedJobs;

    return {
      runId: record.metadata.runId,
      engineVersion: record.metadata.engineVersion,
      completedJobs,
      failedJobs,
      totalNetProfit: record.summary.totalNetProfit,
      averageProfitFactor: record.summary.averageProfitFactor,
      averageSharpe: record.summary.averageSharpeRatio,
      averageMaxDrawdown: record.summary.averageMaxDrawdown,
      averageRecovery: averageRecovery(record),
      averageExpectancy: averageExpectancy(record),
    };
  });

  const bestProfitFactor = [...entries].sort((a, b) => b.averageProfitFactor - a.averageProfitFactor)[0] || null;
  const bestSharpe = [...entries].sort((a, b) => b.averageSharpe - a.averageSharpe)[0] || null;
  const bestRecovery = [...entries].sort((a, b) => b.averageRecovery - a.averageRecovery)[0] || null;
  const bestExpectancy = [...entries].sort((a, b) => b.averageExpectancy - a.averageExpectancy)[0] || null;
  const lowestDrawdown = [...entries].sort((a, b) => a.averageMaxDrawdown - b.averageMaxDrawdown)[0] || null;

  return {
    runIds,
    bestProfitFactorRunId: bestProfitFactor?.runId || null,
    bestSharpeRunId: bestSharpe?.runId || null,
    bestRecoveryRunId: bestRecovery?.runId || null,
    bestExpectancyRunId: bestExpectancy?.runId || null,
    lowestDrawdownRunId: lowestDrawdown?.runId || null,
    entries,
  };
}

function buildDeltaMetric(
  metric: VersionDeltaMetric['metric'],
  current: number,
  reference: number,
  lowerIsBetter: boolean
): VersionDeltaMetric {
  const delta = current - reference;
  const deltaPercent = reference === 0 ? 0 : (delta / Math.abs(reference)) * 100;

  let trend: VersionDeltaMetric['trend'] = 'neutral';
  if (Math.abs(delta) < 1e-9) {
    trend = 'neutral';
  } else if (lowerIsBetter) {
    trend = delta < 0 ? 'improvement' : 'regression';
  } else {
    trend = delta > 0 ? 'improvement' : 'regression';
  }

  return {
    metric,
    current,
    reference,
    delta,
    deltaPercent,
    trend,
  };
}

export function compareEngineVersionAgainstHistory(
  candidateRunId: string,
  candidateEngineVersion: string
): EngineHistoricalComparisonReport {
  const records = listResearchExecutionRecords(5000);
  const candidateRecord = records.find((record) => record.metadata.runId === candidateRunId);

  if (!candidateRecord) {
    throw new Error(`No se encontro la corrida candidata: ${candidateRunId}`);
  }

  const previous = records.filter(
    (record) =>
      record.metadata.runId !== candidateRunId &&
      (record.metadata.engineVersion !== candidateEngineVersion ||
        record.metadata.engineVersionInfo.versionHash !== candidateRecord.metadata.engineVersionInfo.versionHash)
  );

  const previousVersions = Array.from(new Set(previous.map((record) => record.metadata.engineVersion))).sort();
  const candidateMetrics = buildComparableMetrics(candidateRecord);
  const referenceMetrics = previous.length > 0 ? aggregateVersionMetrics(previous) : candidateMetrics;

  const deltas: VersionDeltaMetric[] = [
    buildDeltaMetric('averageProfitFactor', candidateMetrics.averageProfitFactor, referenceMetrics.averageProfitFactor, false),
    buildDeltaMetric('averageSharpeRatio', candidateMetrics.averageSharpeRatio, referenceMetrics.averageSharpeRatio, false),
    buildDeltaMetric('averageMaxDrawdown', candidateMetrics.averageMaxDrawdown, referenceMetrics.averageMaxDrawdown, true),
    buildDeltaMetric('averageRecoveryFactor', candidateMetrics.averageRecoveryFactor, referenceMetrics.averageRecoveryFactor, false),
    buildDeltaMetric('averageExpectancy', candidateMetrics.averageExpectancy, referenceMetrics.averageExpectancy, false),
    buildDeltaMetric('totalNetProfit', candidateMetrics.totalNetProfit, referenceMetrics.totalNetProfit, false),
  ];

  const improvements = deltas.filter((metric) => metric.trend === 'improvement');
  const regressions = deltas.filter((metric) => metric.trend === 'regression');
  const neutral = deltas.filter((metric) => metric.trend === 'neutral');

  return {
    generatedAt: Date.now(),
    candidateEngineVersion,
    candidateRunId,
    comparedAgainstVersions: previousVersions,
    improvements,
    regressions,
    neutral,
    summary: {
      improvementCount: improvements.length,
      regressionCount: regressions.length,
      neutralCount: neutral.length,
    },
  };
}
