import {
  DatasetValidationResult,
  ExperimentResult,
  HypothesisDecision,
  PromotionProposal,
  ResearchHypothesis,
} from './types';

export class PromotionEngine {
  evaluate(input: {
    hypothesis: ResearchHypothesis;
    experimentResult: ExperimentResult;
    hypothesisDecision: HypothesisDecision;
    datasetValidation: DatasetValidationResult;
    productionChangeRequested?: boolean;
    manualReviewRequired?: boolean;
  }): PromotionProposal {
    const reasons: string[] = [];

    if (!input.datasetValidation.valid) {
      reasons.push(...input.datasetValidation.blockingReasons);
    }

    if (input.experimentResult.dataset.certification !== 'CERTIFIED') {
      reasons.push('Proposal blocked because experiment did not run on a CERTIFIED dataset.');
    }

    if (input.experimentResult.dataset.simulated) {
      reasons.push('Proposal blocked because dataset source is still simulated.');
    }

    if (input.experimentResult.execution.status !== 'completed') {
      reasons.push(input.experimentResult.execution.failureReason ?? 'Experiment failed.');
    }

    if (input.hypothesisDecision.status !== 'validated') {
      reasons.push('Hypothesis was not validated.');
    }

    if (input.experimentResult.rejectionReasons.length > 0) {
      reasons.push('Experiment was auto-rejected by scientific guardrails.');
    }

    if (input.experimentResult.summary.sampleSize === 0) {
      reasons.push('Experiment has no trials and cannot be promoted.');
    }

    if (input.productionChangeRequested) {
      reasons.push('Research Lab cannot request direct production changes.');
    }

    const manualReviewRequired = input.manualReviewRequired ?? false;
    if (manualReviewRequired) {
      reasons.push('Research Proposal is blocked pending manual architectural review.');
    }

    return {
      status: reasons.length === 0 ? 'proposed' : 'blocked',
      reasons,
      reviewMode: manualReviewRequired ? 'manual-only' : 'eligible',
      payload: {
        hypothesisId: input.hypothesis.hypothesisId,
        experimentId: input.experimentResult.definition.experimentId,
        score: input.hypothesisDecision.score,
        averageEffectSize: input.experimentResult.summary.averageEffectSize,
        successRate: input.experimentResult.summary.successRate,
      },
    };
  }
}