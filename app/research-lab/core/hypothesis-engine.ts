import { ExperimentResult, HypothesisDecision, ResearchHypothesis } from './types';

export class HypothesisEngine {
  evaluate(hypothesis: ResearchHypothesis, experimentResult: ExperimentResult): HypothesisDecision {
    const rationale: string[] = [];
    const blockingIssues: string[] = [];
    const { criteria } = hypothesis;
    const { summary, execution } = experimentResult;

    if (!experimentResult.valid || execution.status !== 'completed') {
      blockingIssues.push(execution.failureReason ?? 'Experiment did not complete successfully.');
    }

    if (summary.sampleSize < criteria.minSampleSize) {
      blockingIssues.push(`Hypothesis requires ${criteria.minSampleSize} trials and only received ${summary.sampleSize}.`);
    }

    if (summary.successRate < criteria.minSuccessRate) {
      rationale.push(`Success rate below threshold (${summary.successRate.toFixed(2)} < ${criteria.minSuccessRate.toFixed(2)}).`);
    }

    if (summary.averageEffectSize < criteria.minEffectSize) {
      rationale.push(`Effect size below threshold (${summary.averageEffectSize.toFixed(2)} < ${criteria.minEffectSize.toFixed(2)}).`);
    }

    if (summary.failureRate > criteria.maxFailureRate) {
      rationale.push(`Failure rate above threshold (${summary.failureRate.toFixed(2)} > ${criteria.maxFailureRate.toFixed(2)}).`);
    }

    if (criteria.maxPValue !== undefined && summary.averagePValue !== undefined && summary.averagePValue > criteria.maxPValue) {
      rationale.push(`Average p-value above threshold (${summary.averagePValue.toFixed(4)} > ${criteria.maxPValue.toFixed(4)}).`);
    }

    if (blockingIssues.length > 0) {
      return {
        status: 'rejected',
        score: 0,
        rationale: rationale.length > 0 ? rationale : ['Experiment blocked before hypothesis approval.'],
        blockingIssues,
      };
    }

    if (rationale.length > 0) {
      return {
        status: 'rejected',
        score: this.computeScore(summary.successRate, summary.averageEffectSize),
        rationale,
        blockingIssues: [],
      };
    }

    return {
      status: 'validated',
      score: this.computeScore(summary.successRate, summary.averageEffectSize),
      rationale: ['Hypothesis met success, effect size, and failure-rate thresholds.'],
      blockingIssues: [],
    };
  }

  private computeScore(successRate: number, averageEffectSize: number): number {
    const normalizedEffect = Math.max(0, Math.min(1, averageEffectSize + 0.5));
    return Math.round((successRate * 0.6 + normalizedEffect * 0.4) * 100);
  }
}