import {
  ExperimentResult,
  ExperimentSummary,
  ResearchExperimentDefinition,
  ResearchHypothesis,
  DatasetProfile,
  DatasetValidationResult,
  ExperimentTrial,
} from './types';

export class ExperimentEngine {
  run(input: {
    definition: ResearchExperimentDefinition;
    hypothesis: ResearchHypothesis;
    dataset: DatasetProfile;
    datasetValidation: DatasetValidationResult;
    trials: ExperimentTrial[];
    startedAt?: number;
    completedAt?: number;
  }): ExperimentResult {
    const startedAt = input.startedAt ?? Date.now();
    const completedAt = input.completedAt ?? startedAt;
    const summary = this.summarize(input.trials);

    if (!input.datasetValidation.valid) {
      const rejectionReasons = [...input.datasetValidation.blockingReasons];
      return {
        valid: false,
        dataset: input.dataset,
        datasetValidation: input.datasetValidation,
        definition: input.definition,
        trials: input.trials,
        summary,
        rankingScore: this.computeRankingScore(summary, false, false),
        rejectionReasons,
        execution: {
          status: 'failed',
          startedAt,
          completedAt,
          failureReason: rejectionReasons.join(' '),
        },
      };
    }

    const { minTrials, maxFailureRate, maxRejectedTrials } = input.definition.guardrails;
    const failureReasons: string[] = [];

    if (summary.sampleSize < minTrials) {
      failureReasons.push(`Experiment has insufficient trials (${summary.sampleSize}/${minTrials}).`);
    }

    if (summary.failureRate > maxFailureRate) {
      failureReasons.push(`Experiment failure rate exceeded threshold (${summary.failureRate.toFixed(2)} > ${maxFailureRate.toFixed(2)}).`);
    }

    if (summary.rejectedTrials > maxRejectedTrials) {
      failureReasons.push(`Experiment rejected trial count exceeded threshold (${summary.rejectedTrials}/${maxRejectedTrials}).`);
    }

    if (summary.successRate === 0) {
      failureReasons.push('Experiment has zero successful trials.');
    }

    const rankingScore = this.computeRankingScore(summary, input.datasetValidation.valid, failureReasons.length === 0);

    return {
      valid: failureReasons.length === 0,
      dataset: input.dataset,
      datasetValidation: input.datasetValidation,
      definition: input.definition,
      trials: input.trials,
      summary,
      rankingScore,
      rejectionReasons: failureReasons,
      execution: {
        status: failureReasons.length === 0 ? 'completed' : 'failed',
        startedAt,
        completedAt,
        failureReason: failureReasons.length === 0 ? undefined : failureReasons.join(' '),
      },
    };
  }

  private computeRankingScore(summary: ExperimentSummary, datasetValid: boolean, validExperiment: boolean): number {
    const successComponent = summary.successRate * 55;
    const effectComponent = Math.max(0, Math.min(1, summary.averageEffectSize + 0.5)) * 30;
    const rejectionPenalty = summary.rejectionRate * 10;
    const failurePenalty = summary.failureRate * 20;
    const datasetBonus = datasetValid ? 10 : -20;
    const validityPenalty = validExperiment ? 0 : 15;
    const score = successComponent + effectComponent + datasetBonus - rejectionPenalty - failurePenalty - validityPenalty;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private summarize(trials: ExperimentTrial[]): ExperimentSummary {
    const sampleSize = trials.length;
    const passedTrials = trials.filter((trial) => trial.status === 'passed').length;
    const failedTrials = trials.filter((trial) => trial.status === 'failed').length;
    const rejectedTrials = trials.filter((trial) => trial.status === 'rejected').length;

    const effectSizes = trials.map((trial) => this.computeEffectSize(trial.baselineValue, trial.candidateValue));
    const averageEffectSize = effectSizes.length === 0
      ? 0
      : effectSizes.reduce((sum, value) => sum + value, 0) / effectSizes.length;

    const pValues = trials
      .map((trial) => trial.pValue)
      .filter((value): value is number => typeof value === 'number');

    return {
      sampleSize,
      passedTrials,
      failedTrials,
      rejectedTrials,
      successRate: sampleSize === 0 ? 0 : passedTrials / sampleSize,
      failureRate: sampleSize === 0 ? 0 : failedTrials / sampleSize,
      rejectionRate: sampleSize === 0 ? 0 : rejectedTrials / sampleSize,
      averageEffectSize,
      averagePValue: pValues.length === 0 ? undefined : pValues.reduce((sum, value) => sum + value, 0) / pValues.length,
    };
  }

  private computeEffectSize(baselineValue: number, candidateValue: number): number {
    if (baselineValue === 0) {
      return candidateValue === 0 ? 0 : 1;
    }

    return (candidateValue - baselineValue) / Math.abs(baselineValue);
  }
}