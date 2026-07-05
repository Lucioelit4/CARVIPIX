import type { BenchmarkMetricOutcome, ResearchExecutionRecord } from './types';

export interface ComparableMetrics {
  averageProfitFactor: number;
  averageSharpeRatio: number;
  averageMaxDrawdown: number;
  averageRecoveryFactor: number;
  averageExpectancy: number;
  totalNetProfit: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildComparableMetrics(record: ResearchExecutionRecord): ComparableMetrics {
  const completed = record.jobs.filter((job) => job.status === 'completed' && job.result);

  return {
    averageProfitFactor: record.summary.averageProfitFactor,
    averageSharpeRatio: record.summary.averageSharpeRatio,
    averageMaxDrawdown: record.summary.averageMaxDrawdown,
    averageRecoveryFactor: avg(completed.map((job) => job.result?.metrics.recoveryFactor || 0)),
    averageExpectancy: avg(completed.map((job) => job.result?.metrics.expectancy || 0)),
    totalNetProfit: record.summary.totalNetProfit,
  };
}

export function aggregateVersionMetrics(records: ResearchExecutionRecord[]): ComparableMetrics {
  if (records.length === 0) {
    return {
      averageProfitFactor: 0,
      averageSharpeRatio: 0,
      averageMaxDrawdown: 0,
      averageRecoveryFactor: 0,
      averageExpectancy: 0,
      totalNetProfit: 0,
    };
  }

  const perRecord = records.map((record) => buildComparableMetrics(record));
  return {
    averageProfitFactor: avg(perRecord.map((entry) => entry.averageProfitFactor)),
    averageSharpeRatio: avg(perRecord.map((entry) => entry.averageSharpeRatio)),
    averageMaxDrawdown: avg(perRecord.map((entry) => entry.averageMaxDrawdown)),
    averageRecoveryFactor: avg(perRecord.map((entry) => entry.averageRecoveryFactor)),
    averageExpectancy: avg(perRecord.map((entry) => entry.averageExpectancy)),
    totalNetProfit: perRecord.reduce((sum, entry) => sum + entry.totalNetProfit, 0),
  };
}

export function benchmarkOutcomeToComparableMetrics(outcome: BenchmarkMetricOutcome | null): ComparableMetrics {
  if (!outcome) {
    return {
      averageProfitFactor: 0,
      averageSharpeRatio: 0,
      averageMaxDrawdown: 0,
      averageRecoveryFactor: 0,
      averageExpectancy: 0,
      totalNetProfit: 0,
    };
  }

  return {
    averageProfitFactor: outcome.averageProfitFactor,
    averageSharpeRatio: outcome.averageSharpeRatio,
    averageMaxDrawdown: outcome.averageMaxDrawdown,
    averageRecoveryFactor: outcome.averageRecoveryFactor,
    averageExpectancy: outcome.averageExpectancy,
    totalNetProfit: outcome.totalNetProfit,
  };
}
