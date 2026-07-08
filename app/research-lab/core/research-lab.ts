import { DatasetManager } from './dataset-manager';
import { ExperimentEngine } from './experiment-engine';
import { HypothesisEngine } from './hypothesis-engine';
import { PromotionEngine } from './promotion-engine';
import { ResearchMetricsEngine } from './research-metrics-engine';
import {
  ExperimentRankingEntry,
  ResearchAutomaticReport,
  ResearchComparisonRow,
  ResearchDashboardSnapshot,
  ResearchHistoryEntry,
  ResearchProgramResult,
  ResearchStudyInput,
  ResearchStudyResult,
  ResearchTraceEvent,
} from './types';
import { ValidationEngine } from './validation-engine';

export class ResearchLab {
  private readonly datasetManager: DatasetManager;
  private readonly validationEngine: ValidationEngine;
  private readonly experimentEngine: ExperimentEngine;
  private readonly hypothesisEngine: HypothesisEngine;
  private readonly researchMetricsEngine: ResearchMetricsEngine;
  private readonly promotionEngine: PromotionEngine;

  constructor() {
    this.datasetManager = new DatasetManager();
    this.validationEngine = new ValidationEngine();
    this.experimentEngine = new ExperimentEngine();
    this.hypothesisEngine = new HypothesisEngine();
    this.researchMetricsEngine = new ResearchMetricsEngine();
    this.promotionEngine = new PromotionEngine();
  }

  runStudy(input: ResearchStudyInput): ResearchStudyResult {
    const now = Date.now();
    const studyId = input.studyId ?? `study-${input.experiment.experimentId}-${now}`;
    const traceId = input.traceId ?? `trace-${studyId}`;
    const comparisonLabel = input.comparisonLabel ?? input.experiment.comparisonContext?.candidateLabel ?? 'candidate';

    const trace: ResearchTraceEvent[] = [
      {
        step: 'dataset_ingested',
        status: 'completed' as const,
        timestamp: now,
        details: { datasetId: input.dataset.datasetId },
      },
    ];

    const datasetProfile = this.datasetManager.ingest(input.dataset);
    trace.push({
      step: 'dataset_profiled',
      status: datasetProfile.valid ? ('completed' as const) : ('blocked' as const),
      timestamp: Date.now(),
      details: {
        certification: datasetProfile.certification,
        validRecordCount: datasetProfile.validRecordCount,
      },
    });

    const datasetValidation = this.validationEngine.validateDataset(
      datasetProfile,
      input.experiment.datasetRules,
    );
    trace.push({
      step: 'dataset_validated',
      status: datasetValidation.valid ? ('completed' as const) : ('blocked' as const),
      timestamp: Date.now(),
      details: {
        blockingReasons: datasetValidation.blockingReasons,
      },
    });

    const experimentResult = this.experimentEngine.run({
      definition: input.experiment,
      hypothesis: input.hypothesis,
      dataset: datasetProfile,
      datasetValidation,
      trials: input.trials,
    });
    trace.push({
      step: 'experiment_executed',
      status: experimentResult.execution.status === 'completed' ? ('completed' as const) : ('blocked' as const),
      timestamp: Date.now(),
      details: {
        rankingScore: experimentResult.rankingScore,
        rejectionReasons: experimentResult.rejectionReasons,
      },
    });

    const hypothesisDecision = this.hypothesisEngine.evaluate(input.hypothesis, experimentResult);
    trace.push({
      step: 'hypothesis_evaluated',
      status: hypothesisDecision.status === 'validated' ? ('completed' as const) : ('blocked' as const),
      timestamp: Date.now(),
      details: {
        status: hypothesisDecision.status,
        score: hypothesisDecision.score,
      },
    });

    const manualReviewRequired = input.manualReviewRequired ?? false;
    const proposal = this.promotionEngine.evaluate({
      hypothesis: input.hypothesis,
      experimentResult,
      hypothesisDecision,
      datasetValidation,
      productionChangeRequested: input.productionChangeRequested,
      manualReviewRequired,
    });
    trace.push({
      step: 'promotion_evaluated',
      status: proposal.status === 'proposed' ? ('completed' as const) : ('blocked' as const),
      timestamp: Date.now(),
      details: {
        proposalStatus: proposal.status,
        reviewMode: proposal.reviewMode,
      },
    });

    const metrics = this.researchMetricsEngine.summarize({
      experiments: [experimentResult],
      decisions: [hypothesisDecision],
      proposals: [proposal],
    });

    const historyEntry: ResearchHistoryEntry = {
      studyId,
      traceId,
      comparisonLabel,
      datasetId: datasetProfile.datasetId,
      hypothesisId: input.hypothesis.hypothesisId,
      experimentId: input.experiment.experimentId,
      status: proposal.status === 'blocked'
        ? 'blocked'
        : hypothesisDecision.status === 'validated'
          ? 'validated'
          : 'rejected',
      rankingScore: experimentResult.rankingScore,
      createdAt: Date.now(),
      trace,
    };

    return {
      studyId,
      traceId,
      comparisonLabel,
      datasetProfile,
      datasetValidation,
      experimentResult,
      hypothesisDecision,
      metrics,
      proposal,
      manualReviewRequired,
      historyEntry,
    };
  }

  runProgram(studies: ResearchStudyInput[], baselineStudyId?: string): ResearchProgramResult {
    const results = studies.map((study, index) => this.runStudy({
      ...study,
      comparisonLabel: study.comparisonLabel ?? this.defaultComparisonLabel(index),
    }));

    const rankings = this.buildRankings(results);
    const comparisons = this.buildComparisonRows(results, baselineStudyId);
    const history = results.map((result) => result.historyEntry);
    const metrics = this.researchMetricsEngine.summarize({
      experiments: results.map((result) => result.experimentResult),
      decisions: results.map((result) => result.hypothesisDecision),
      proposals: results.map((result) => result.proposal),
    });
    const report = this.buildAutomaticReport(results, rankings, metrics);
    const dashboard = this.buildDashboardSnapshot(results, rankings, comparisons, report);

    return {
      studies: results,
      rankings,
      comparisons,
      history,
      metrics,
      dashboard,
      report,
    };
  }

  private defaultComparisonLabel(index: number): string {
    if (index === 0) {
      return 'baseline';
    }
    if (index === 1) {
      return 'current';
    }
    if (index === 2) {
      return 'previous';
    }

    return `candidate-${index - 2}`;
  }

  private buildRankings(results: ResearchStudyResult[]): ExperimentRankingEntry[] {
    const sorted = results
      .slice()
      .sort((left, right) => right.experimentResult.rankingScore - left.experimentResult.rankingScore);

    return sorted.map((result, index) => ({
      rank: index + 1,
      studyId: result.studyId,
      comparisonLabel: result.comparisonLabel,
      hypothesisId: result.hypothesisDecision.blockingIssues.length > 0
        ? result.proposal.payload.hypothesisId
        : result.proposal.payload.hypothesisId,
      experimentId: result.experimentResult.definition.experimentId,
      rankingScore: result.experimentResult.rankingScore,
      hypothesisScore: result.hypothesisDecision.score,
      proposalStatus: result.proposal.status,
      successRate: result.experimentResult.summary.successRate,
      averageEffectSize: result.experimentResult.summary.averageEffectSize,
    }));
  }

  private buildComparisonRows(results: ResearchStudyResult[], baselineStudyId?: string): ResearchComparisonRow[] {
    const baseline = baselineStudyId
      ? results.find((result) => result.studyId === baselineStudyId)
      : results.find((result) => result.comparisonLabel === 'baseline') ?? results[0];
    const current = results.find((result) => result.comparisonLabel === 'current') ?? baseline;
    const previous = results.find((result) => result.comparisonLabel === 'previous') ?? baseline;

    const baselineScore = baseline?.experimentResult.rankingScore ?? 0;
    const currentScore = current?.experimentResult.rankingScore ?? baselineScore;
    const previousScore = previous?.experimentResult.rankingScore ?? baselineScore;

    return results.map((result) => ({
      studyId: result.studyId,
      comparisonLabel: result.comparisonLabel,
      hypothesisId: result.proposal.payload.hypothesisId,
      experimentId: result.experimentResult.definition.experimentId,
      hypothesisScore: result.hypothesisDecision.score,
      rankingScore: result.experimentResult.rankingScore,
      successRate: result.experimentResult.summary.successRate,
      averageEffectSize: result.experimentResult.summary.averageEffectSize,
      versusBaseline: result.experimentResult.rankingScore - baselineScore,
      versusCurrent: result.experimentResult.rankingScore - currentScore,
      versusPreviousVersion: result.experimentResult.rankingScore - previousScore,
      status: result.hypothesisDecision.status,
    }));
  }

  private buildAutomaticReport(
    results: ResearchStudyResult[],
    rankings: ExperimentRankingEntry[],
    metrics: ResearchStudyResult['metrics'],
  ): ResearchAutomaticReport {
    const now = Date.now();
    const blockedStudies = results
      .filter((result) => result.proposal.status === 'blocked')
      .map((result) => result.studyId);

    const summary = [
      `Total studies: ${results.length}`,
      `Validated hypotheses: ${metrics.validatedHypotheses}`,
      `Blocked promotions: ${metrics.blockedPromotions}`,
      `Average ranking score: ${metrics.averageRankingScore.toFixed(2)}`,
    ];

    const recommendations: string[] = [];
    if (blockedStudies.length > 0) {
      recommendations.push('Keep manual review strict until blocked studies are remediated.');
    }
    if (metrics.averageRankingScore < 60) {
      recommendations.push('Prioritize hypothesis redesign and stronger datasets before proposing engine changes.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue controlled manual promotion workflow with current top-ranked study.');
    }

    return {
      reportId: `report-${now}`,
      createdAt: now,
      summary,
      recommendations,
      ranking: rankings,
      blockedStudies,
    };
  }

  private buildDashboardSnapshot(
    results: ResearchStudyResult[],
    rankings: ExperimentRankingEntry[],
    comparisons: ResearchComparisonRow[],
    report: ResearchAutomaticReport,
  ): ResearchDashboardSnapshot {
    const validatedHypotheses = results.filter((result) => result.hypothesisDecision.status === 'validated').length;
    const rejectedHypotheses = results.filter((result) => result.hypothesisDecision.status === 'rejected').length;
    const blockedPromotions = results.filter((result) => result.proposal.status === 'blocked').length;
    const pendingManualReview = results.filter((result) => result.manualReviewRequired).length;

    return {
      totalStudies: results.length,
      validatedHypotheses,
      rejectedHypotheses,
      blockedPromotions,
      pendingManualReview,
      topExperiment: rankings[0],
      rankings,
      comparisonMatrix: comparisons,
      latestReportId: report.reportId,
      historyEntries: results.length,
    };
  }
}