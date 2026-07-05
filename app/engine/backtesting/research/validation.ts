import { buildEngineBenchmark } from './benchmark';
import { benchmarkOutcomeToComparableMetrics, buildComparableMetrics } from './analytics';
import type {
  CandidateValidationFinding,
  CandidateValidationReport,
  CandidateValidationRule,
  ResearchExecutionRecord,
} from './types';

const DEFAULT_CANDIDATE_RULES: CandidateValidationRule[] = [
  { metric: 'averageProfitFactor', operator: '>=', threshold: 0, source: 'benchmark-baseline' },
  { metric: 'averageSharpeRatio', operator: '>=', threshold: 0, source: 'benchmark-baseline' },
  { metric: 'averageMaxDrawdown', operator: '<=', threshold: 0, source: 'benchmark-baseline' },
  { metric: 'averageRecoveryFactor', operator: '>=', threshold: 0, source: 'benchmark-baseline' },
  { metric: 'averageExpectancy', operator: '>=', threshold: 0, source: 'benchmark-baseline' },
];

function readCandidateMetric(
  metrics: ReturnType<typeof buildComparableMetrics>,
  metric: CandidateValidationRule['metric']
): number {
  if (metric === 'averageProfitFactor') return metrics.averageProfitFactor;
  if (metric === 'averageSharpeRatio') return metrics.averageSharpeRatio;
  if (metric === 'averageMaxDrawdown') return metrics.averageMaxDrawdown;
  if (metric === 'averageRecoveryFactor') return metrics.averageRecoveryFactor;
  return metrics.averageExpectancy;
}

function compareWithOperator(actual: number, required: number, operator: CandidateValidationRule['operator']): boolean {
  if (operator === '>=') return actual >= required;
  return actual <= required;
}

export function evaluateCandidateEngineVersion(
  candidateRecord: ResearchExecutionRecord,
  rules: CandidateValidationRule[] = DEFAULT_CANDIDATE_RULES
): CandidateValidationReport {
  const benchmark = buildEngineBenchmark(candidateRecord.metadata.engineVersion);
  const baselineMetrics = benchmarkOutcomeToComparableMetrics(benchmark.baseline);
  const candidateMetrics = buildComparableMetrics(candidateRecord);

  const findings = rules.map((rule) => {
    const actual = readCandidateMetric(candidateMetrics, rule.metric);
    const baselineValue = readCandidateMetric(baselineMetrics, rule.metric);
    const required = rule.source === 'benchmark-baseline' ? baselineValue + rule.threshold : rule.threshold;
    const passed = compareWithOperator(actual, required, rule.operator);
    const status: CandidateValidationFinding['status'] = passed ? 'pass' : 'fail';

    return {
      metric: rule.metric,
      status,
      actual,
      required,
      operator: rule.operator,
      message: passed
        ? `Regla satisfecha: ${rule.metric} ${rule.operator} ${required.toFixed(6)}`
        : `Regla no satisfecha: ${rule.metric} ${rule.operator} ${required.toFixed(6)} (actual ${actual.toFixed(6)})`,
    };
  });

  const candidateStatus = findings.every((finding) => finding.status === 'pass') ? 'approved' : 'rejected';

  return {
    generatedAt: Date.now(),
    candidateEngineVersion: candidateRecord.metadata.engineVersion,
    candidateRunId: candidateRecord.metadata.runId,
    blockingActive: false,
    candidateStatus,
    findings,
    rules,
  };
}

export function getDefaultCandidateValidationRules(): CandidateValidationRule[] {
  return DEFAULT_CANDIDATE_RULES;
}
