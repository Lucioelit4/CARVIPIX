import {
  BatchExecutionOptions,
  BatchExecutionResult,
  ExperimentQueueItem,
  ExperimentVersionComparison,
  HistoricalRankingEntry,
  KnowledgeBaseSnapshot,
  KnowledgeCard,
  PipelineRunResult,
  PipelineStageResult,
  ResearchAutomaticReport,
  ResearchDashboardSnapshot,
  ResearchHistoryEntry,
  ResearchProposalDocument,
  ResearchStudyInput,
  ResearchStudyResult,
} from './types';
import { ResearchLab } from './research-lab';

function clampPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

export class KnowledgeFactory {
  private readonly lab: ResearchLab;
  private readonly queue: ExperimentQueueItem[];
  private readonly cards: KnowledgeCard[];
  private readonly history: ResearchHistoryEntry[];
  private readonly runsByStudyId: Map<string, PipelineRunResult>;
  private latestDashboard?: ResearchDashboardSnapshot;
  private latestReport?: ResearchAutomaticReport;

  constructor(lab?: ResearchLab) {
    this.lab = lab ?? new ResearchLab();
    this.queue = [];
    this.cards = [];
    this.history = [];
    this.runsByStudyId = new Map<string, PipelineRunResult>();
  }

  enqueue(study: ResearchStudyInput, priority = 100): string {
    const now = Date.now();
    const queueId = `${study.studyId ?? study.experiment.experimentId}-${now}`;
    this.queue.push({
      queueId,
      enqueuedAt: now,
      priority,
      study,
    });

    return queueId;
  }

  enqueueMany(studies: ResearchStudyInput[], priority = 100): string[] {
    return studies.map((study) => this.enqueue(study, priority));
  }

  queueSize(): number {
    return this.queue.length;
  }

  runPipeline(study: ResearchStudyInput): PipelineRunResult {
    const stages: PipelineStageResult[] = [];
    const startedAt = Date.now();

    stages.push({
      stage: 'dataset',
      status: 'completed',
      timestamp: startedAt,
      details: {
        datasetId: study.dataset.datasetId,
        source: study.dataset.source,
      },
    });

    const result = this.lab.runStudy(study);

    stages.push({
      stage: 'experiment',
      status: result.experimentResult.execution.status === 'completed' ? 'completed' : 'failed',
      timestamp: Date.now(),
      details: {
        experimentId: result.experimentResult.definition.experimentId,
        executionStatus: result.experimentResult.execution.status,
      },
    });

    stages.push({
      stage: 'result',
      status: 'completed',
      timestamp: Date.now(),
      details: {
        rankingScore: result.experimentResult.rankingScore,
      },
    });

    stages.push({
      stage: 'validation',
      status: result.hypothesisDecision.status === 'validated' ? 'completed' : 'failed',
      timestamp: Date.now(),
      details: {
        hypothesisStatus: result.hypothesisDecision.status,
        proposalStatus: result.proposal.status,
      },
    });

    const card = this.buildKnowledgeCard(result);
    stages.push({
      stage: 'knowledge_card',
      status: 'completed',
      timestamp: Date.now(),
      details: {
        cardId: card.cardId,
        cardStatus: card.status,
      },
    });

    const proposal = this.buildProposal(card, result);
    stages.push({
      stage: 'research_proposal',
      status: proposal.status === 'ready_for_review' ? 'completed' : 'failed',
      timestamp: Date.now(),
      details: {
        proposalId: proposal.proposalId,
        status: proposal.status,
      },
    });

    const autoSummary = this.buildAutoSummary(result, card, proposal);
    const pipelineRun: PipelineRunResult = {
      study: result,
      stages,
      knowledgeCard: card,
      proposalDocument: proposal,
      autoSummary,
    };

    this.persistRun(pipelineRun);
    return pipelineRun;
  }

  async runBatch(options?: Partial<BatchExecutionOptions>): Promise<BatchExecutionResult> {
    const batchSize = clampPositiveInteger(options?.batchSize ?? this.queue.length, this.queue.length || 1);
    const parallelism = clampPositiveInteger(options?.parallelism ?? 4, 4);

    const queued = this.dequeue(batchSize);
    const results: PipelineRunResult[] = [];

    for (let index = 0; index < queued.length; index += parallelism) {
      const chunk = queued.slice(index, index + parallelism);
      const chunkResults = await Promise.all(
        chunk.map(async (item) => this.runPipeline(item.study)),
      );
      results.push(...chunkResults);
    }

    const dashboardProgram = this.lab.runProgram(
      queued.map((item) => item.study),
      options?.baselineStudyId,
    );

    this.latestDashboard = dashboardProgram.dashboard;
    this.latestReport = {
      ...dashboardProgram.report,
      summary: [
        ...dashboardProgram.report.summary,
        `Knowledge cards generated: ${results.length}`,
      ],
    };

    return {
      queueProcessed: queued.length,
      runs: results,
      rankings: dashboardProgram.rankings,
      comparisons: dashboardProgram.comparisons,
      dashboard: this.latestDashboard,
      report: this.latestReport,
    };
  }

  compareVersions(baseCardId: string, candidateCardId: string): ExperimentVersionComparison {
    const baseRun = this.runsByStudyId.get(this.findStudyIdByCardId(baseCardId));
    const candidateRun = this.runsByStudyId.get(this.findStudyIdByCardId(candidateCardId));

    if (!baseRun || !candidateRun) {
      throw new Error('Cannot compare versions because one or both card ids are unknown.');
    }

    const rankingDelta = candidateRun.study.experimentResult.rankingScore - baseRun.study.experimentResult.rankingScore;
    const successRateDelta =
      candidateRun.study.experimentResult.summary.successRate - baseRun.study.experimentResult.summary.successRate;
    const effectSizeDelta =
      candidateRun.study.experimentResult.summary.averageEffectSize - baseRun.study.experimentResult.summary.averageEffectSize;

    return {
      baseCardId,
      candidateCardId,
      rankingDelta,
      successRateDelta,
      effectSizeDelta,
      winnerCardId: rankingDelta >= 0 ? candidateCardId : baseCardId,
    };
  }

  getHistoricalRanking(limit = 100): HistoricalRankingEntry[] {
    const sorted = this.cards
      .slice()
      .sort((left, right) => right.rankingScore - left.rankingScore)
      .slice(0, Math.max(1, limit));

    return sorted.map((card, index) => ({
      position: index + 1,
      cardId: card.cardId,
      studyId: card.studyId,
      rankingScore: card.rankingScore,
      createdAt: card.createdAt,
    }));
  }

  getKnowledgeBaseSnapshot(): KnowledgeBaseSnapshot {
    return {
      cards: this.cards.slice().sort((left, right) => right.createdAt - left.createdAt),
      history: this.history.slice().sort((left, right) => right.createdAt - left.createdAt),
      historicalRanking: this.getHistoricalRanking(),
      latestDashboard: this.latestDashboard,
      latestReport: this.latestReport,
    };
  }

  private dequeue(size: number): ExperimentQueueItem[] {
    this.queue.sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      return left.enqueuedAt - right.enqueuedAt;
    });

    return this.queue.splice(0, size);
  }

  private buildKnowledgeCard(study: ResearchStudyResult): KnowledgeCard {
    const now = Date.now();
    const cardId = `kc-${study.studyId}-${now}`;
    const success =
      study.experimentResult.execution.status === 'completed' &&
      study.datasetValidation.valid &&
      study.hypothesisDecision.status === 'validated';

    const status: KnowledgeCard['status'] = success
      ? (study.proposal.status === 'proposed' ? 'validated' : 'draft')
      : 'blocked';

    const summary = [
      `Study ${study.studyId} scored ${study.experimentResult.rankingScore}.`,
      `Success rate ${(study.experimentResult.summary.successRate * 100).toFixed(2)}%.`,
      `Effect size ${study.experimentResult.summary.averageEffectSize.toFixed(4)}.`,
    ];

    const recommendations = study.proposal.reasons.length > 0
      ? study.proposal.reasons.slice(0, 3)
      : ['Maintain manual review gate before any production promotion.'];

    return {
      cardId,
      studyId: study.studyId,
      hypothesisId: study.hypothesisDecision.blockingIssues.length > 0
        ? study.proposal.payload.hypothesisId
        : study.proposal.payload.hypothesisId,
      experimentId: study.experimentResult.definition.experimentId,
      datasetId: study.datasetProfile.datasetId,
      createdAt: now,
      rankingScore: study.experimentResult.rankingScore,
      status,
      summary,
      recommendations,
      tags: ['research-lab', study.comparisonLabel, status],
      proposalStatus: study.proposal.status,
      traceId: study.traceId,
    };
  }

  private buildProposal(card: KnowledgeCard, study: ResearchStudyResult): ResearchProposalDocument {
    const createdAt = Date.now();
    return {
      proposalId: `rp-${card.cardId}`,
      createdAt,
      studyId: study.studyId,
      cardId: card.cardId,
      hypothesisId: card.hypothesisId,
      experimentId: card.experimentId,
      status: study.proposal.status === 'proposed' ? 'ready_for_review' : 'blocked',
      rationale: study.proposal.reasons.length > 0
        ? study.proposal.reasons
        : ['Proposal generated from validated knowledge card.'],
    };
  }

  private buildAutoSummary(
    study: ResearchStudyResult,
    card: KnowledgeCard,
    proposal: ResearchProposalDocument,
  ): string {
    return [
      `study=${study.studyId}`,
      `ranking=${study.experimentResult.rankingScore}`,
      `hypothesis=${study.hypothesisDecision.status}`,
      `knowledge_card=${card.status}`,
      `proposal=${proposal.status}`,
    ].join(' | ');
  }

  private persistRun(run: PipelineRunResult): void {
    this.cards.push(run.knowledgeCard);
    this.history.push(run.study.historyEntry);
    this.runsByStudyId.set(run.study.studyId, run);
  }

  private findStudyIdByCardId(cardId: string): string {
    const card = this.cards.find((item) => item.cardId === cardId);
    if (!card) {
      throw new Error(`Unknown card id: ${cardId}`);
    }

    return card.studyId;
  }
}
