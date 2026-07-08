import { ExperimentResult, HypothesisDecision, PromotionProposal, ResearchMetrics } from './types';

export class ResearchMetricsEngine {
  summarize(input: {
    experiments: ExperimentResult[];
    decisions: HypothesisDecision[];
    proposals: PromotionProposal[];
  }): ResearchMetrics {
    const totalDatasets = input.experiments.length;
    const validDatasets = input.experiments.filter((experiment) => experiment.datasetValidation.valid).length;
    const invalidDatasets = totalDatasets - validDatasets;
    const completedExperiments = input.experiments.filter((experiment) => experiment.execution.status === 'completed').length;
    const failedExperiments = totalDatasets - completedExperiments;
    const validatedHypotheses = input.decisions.filter((decision) => decision.status === 'validated').length;
    const rejectedHypotheses = input.decisions.filter((decision) => decision.status === 'rejected').length;
    const blockedPromotions = input.proposals.filter((proposal) => proposal.status === 'blocked').length;
    const averageCoverage = totalDatasets === 0
      ? 0
      : input.experiments.reduce((sum, experiment) => sum + experiment.dataset.coverage, 0) / totalDatasets;
    const averageEffectSize = totalDatasets === 0
      ? 0
      : input.experiments.reduce((sum, experiment) => sum + experiment.summary.averageEffectSize, 0) / totalDatasets;
    const averageRankingScore = totalDatasets === 0
      ? 0
      : input.experiments.reduce((sum, experiment) => sum + experiment.rankingScore, 0) / totalDatasets;
    const pendingManualReview = input.proposals.filter((proposal) => proposal.reviewMode === 'manual-only').length;
    const traceCoverage = totalDatasets === 0
      ? 1
      : input.experiments.filter((experiment) => experiment.definition.experimentId.trim().length > 0).length / totalDatasets;
    const topExperiment = input.experiments
      .slice()
      .sort((left, right) => right.rankingScore - left.rankingScore)[0];

    return {
      totalDatasets,
      validDatasets,
      invalidDatasets,
      completedExperiments,
      failedExperiments,
      validatedHypotheses,
      rejectedHypotheses,
      blockedPromotions,
      averageCoverage,
      averageEffectSize,
      averageRankingScore,
      pendingManualReview,
      traceCoverage,
      topExperimentId: topExperiment?.definition.experimentId,
    };
  }
}