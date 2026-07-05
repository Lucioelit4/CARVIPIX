import { buildEngineBenchmark } from './benchmark';
import type { BenchmarkMetricOutcome, EngineSelectionCandidate, EngineSelectionDecision, EngineSelectionThresholds } from './types';

const DEFAULT_SELECTION_THRESHOLDS: EngineSelectionThresholds = {
  minRuns: 1,
  minJobs: 1,
  minProfitFactor: 0,
  minSharpeRatio: 0,
  maxDrawdown: 100,
};

function normalizeThresholds(
  partial?: Partial<EngineSelectionThresholds>
): EngineSelectionThresholds {
  return {
    minRuns: partial?.minRuns ?? DEFAULT_SELECTION_THRESHOLDS.minRuns,
    minJobs: partial?.minJobs ?? DEFAULT_SELECTION_THRESHOLDS.minJobs,
    minProfitFactor: partial?.minProfitFactor ?? DEFAULT_SELECTION_THRESHOLDS.minProfitFactor,
    minSharpeRatio: partial?.minSharpeRatio ?? DEFAULT_SELECTION_THRESHOLDS.minSharpeRatio,
    maxDrawdown: partial?.maxDrawdown ?? DEFAULT_SELECTION_THRESHOLDS.maxDrawdown,
  };
}

function computeCompositeScore(outcome: BenchmarkMetricOutcome): number {
  // Score ponderado para seleccionar version estable de forma consistente.
  const sharpeComponent = outcome.averageSharpeRatio * 40;
  const profitFactorComponent = outcome.averageProfitFactor * 30;
  const recoveryComponent = outcome.averageRecoveryFactor * 15;
  const expectancyComponent = outcome.averageExpectancy * 10;
  const drawdownPenalty = outcome.averageMaxDrawdown * 1.5;
  const winRateComponent = outcome.averageWinRate * 0.1;

  return sharpeComponent + profitFactorComponent + recoveryComponent + expectancyComponent + winRateComponent - drawdownPenalty;
}

function mapCandidate(
  outcome: BenchmarkMetricOutcome,
  thresholds: EngineSelectionThresholds
): EngineSelectionCandidate {
  const failedThresholds: string[] = [];

  if (outcome.runs < thresholds.minRuns) {
    failedThresholds.push(`runs < ${thresholds.minRuns}`);
  }
  if (outcome.totalJobs < thresholds.minJobs) {
    failedThresholds.push(`totalJobs < ${thresholds.minJobs}`);
  }
  if (outcome.averageProfitFactor < thresholds.minProfitFactor) {
    failedThresholds.push(`averageProfitFactor < ${thresholds.minProfitFactor}`);
  }
  if (outcome.averageSharpeRatio < thresholds.minSharpeRatio) {
    failedThresholds.push(`averageSharpeRatio < ${thresholds.minSharpeRatio}`);
  }
  if (outcome.averageMaxDrawdown > thresholds.maxDrawdown) {
    failedThresholds.push(`averageMaxDrawdown > ${thresholds.maxDrawdown}`);
  }

  return {
    engineVersion: outcome.engineVersion,
    engineVersionId: outcome.engineVersionId,
    engineVersionHash: outcome.engineVersionHash,
    compositeScore: computeCompositeScore(outcome),
    metrics: {
      runs: outcome.runs,
      totalJobs: outcome.totalJobs,
      totalTrades: outcome.totalTrades,
      averageWinRate: outcome.averageWinRate,
      averageProfitFactor: outcome.averageProfitFactor,
      averageSharpeRatio: outcome.averageSharpeRatio,
      averageMaxDrawdown: outcome.averageMaxDrawdown,
      averageRecoveryFactor: outcome.averageRecoveryFactor,
      averageExpectancy: outcome.averageExpectancy,
      totalNetProfit: outcome.totalNetProfit,
    },
    passedThresholds: failedThresholds.length === 0,
    failedThresholds,
  };
}

export function getDefaultEngineSelectionThresholds(): EngineSelectionThresholds {
  return DEFAULT_SELECTION_THRESHOLDS;
}

export function selectBestEngineVersion(
  baselineEngineVersion: string,
  thresholds?: Partial<EngineSelectionThresholds>
): EngineSelectionDecision {
  const normalizedThresholds = normalizeThresholds(thresholds);
  const benchmark = buildEngineBenchmark(baselineEngineVersion);
  const candidates = benchmark.ranking.map((outcome) => mapCandidate(outcome, normalizedThresholds));
  const eligible = candidates.filter((candidate) => candidate.passedThresholds);

  const sortedEligible = [...eligible].sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }

    if (b.metrics.averageSharpeRatio !== a.metrics.averageSharpeRatio) {
      return b.metrics.averageSharpeRatio - a.metrics.averageSharpeRatio;
    }

    if (b.metrics.averageProfitFactor !== a.metrics.averageProfitFactor) {
      return b.metrics.averageProfitFactor - a.metrics.averageProfitFactor;
    }

    return b.metrics.totalNetProfit - a.metrics.totalNetProfit;
  });

  const selected = sortedEligible[0] || null;

  return {
    generatedAt: Date.now(),
    baselineEngineVersion,
    thresholds: normalizedThresholds,
    selectedEngineVersion: selected?.engineVersion || null,
    selectedEngineVersionId: selected?.engineVersionId || null,
    selectedEngineVersionHash: selected?.engineVersionHash || null,
    selectedCompositeScore: selected?.compositeScore || null,
    status: selected ? 'selected' : 'no-eligible-candidate',
    reason: selected
      ? `Selected ${selected.engineVersionId} with composite score ${selected.compositeScore.toFixed(4)}`
      : 'No candidate satisfies selection thresholds',
    candidates,
    eligibleCandidates: sortedEligible,
  };
}
