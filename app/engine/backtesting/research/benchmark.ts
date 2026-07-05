import { listResearchExecutionRecords } from './store';
import type { BenchmarkComparison, BenchmarkMetricOutcome } from './types';

export function buildEngineBenchmark(baselineEngineVersion: string): BenchmarkComparison {
  const records = listResearchExecutionRecords(1000);

  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    const key = record.metadata.engineVersionInfo.versionId;
    const previous = grouped.get(key) || [];
    previous.push(record);
    grouped.set(key, previous);
  }

  const ranking: BenchmarkMetricOutcome[] = Array.from(grouped.entries()).map(([versionId, engineRecords]) => {
    const allCompletedJobs = engineRecords.flatMap((record) =>
      record.jobs.filter((job) => job.status === 'completed' && job.result)
    );

    const representative = engineRecords[0];
    const engineVersion = representative.metadata.engineVersion;
    const engineVersionHash = representative.metadata.engineVersionInfo.versionHash;

    const runCount = engineRecords.length;
    const totalJobs = engineRecords.reduce((sum, record) => sum + record.summary.totalJobs, 0);
    const totalTrades = engineRecords.reduce((sum, record) => sum + record.summary.totalTrades, 0);

    const avg = (values: number[]): number => {
      if (values.length === 0) return 0;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    const averageRecoveryFactor = avg(
      allCompletedJobs.map((job) => job.result?.metrics.recoveryFactor || 0)
    );
    const averageExpectancy = avg(
      allCompletedJobs.map((job) => job.result?.metrics.expectancy || 0)
    );

    const outcome: BenchmarkMetricOutcome = {
      engineVersion,
      engineVersionHash,
      engineVersionId: versionId,
      runs: runCount,
      totalJobs,
      totalTrades,
      averageWinRate: avg(engineRecords.map((record) => record.summary.averageWinRate)),
      averageProfitFactor: avg(engineRecords.map((record) => record.summary.averageProfitFactor)),
      averageSharpeRatio: avg(engineRecords.map((record) => record.summary.averageSharpeRatio)),
      averageMaxDrawdown: avg(engineRecords.map((record) => record.summary.averageMaxDrawdown)),
      averageRecoveryFactor,
      averageExpectancy,
      totalNetProfit: engineRecords.reduce((sum, record) => sum + record.summary.totalNetProfit, 0),
    };

    return outcome;
  });

  ranking.sort((a, b) => {
    if (b.averageSharpeRatio !== a.averageSharpeRatio) {
      return b.averageSharpeRatio - a.averageSharpeRatio;
    }
    if (b.averageProfitFactor !== a.averageProfitFactor) {
      return b.averageProfitFactor - a.averageProfitFactor;
    }
    return b.totalNetProfit - a.totalNetProfit;
  });

  const baseline =
    ranking.find(
      (item) =>
        item.engineVersion === baselineEngineVersion ||
        item.engineVersionId === baselineEngineVersion ||
        item.engineVersionHash === baselineEngineVersion
    ) || null;

  return {
    baselineEngineVersion,
    baseline,
    ranking,
  };
}
