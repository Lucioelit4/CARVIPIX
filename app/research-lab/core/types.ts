export type ResearchSeverity = 'warning' | 'critical';

export type DatasetCertification = 'CERTIFIED' | 'PARTIAL' | 'INVALID' | 'SIMULATED';

export type DatasetIssueCode =
  | 'EMPTY_DATASET'
  | 'INVALID_TIMESTAMP'
  | 'OUT_OF_ORDER'
  | 'DUPLICATE_TIMESTAMP'
  | 'MISSING_INTERVAL'
  | 'CORRUPT_PRICE'
  | 'INVALID_SPREAD'
  | 'INCOMPLETE_RECORD';

export interface ResearchDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  spread?: number;
  latencyMs?: number;
  completeness?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ResearchDatasetInput {
  datasetId: string;
  asset: string;
  timeframe: string;
  source: string;
  certification: DatasetCertification;
  partialApprovalAuthorized?: boolean;
  checksum?: string;
  schemaVersion?: string;
  rowCount?: number;
  records: Partial<ResearchDataPoint>[];
  receivedAt: number;
}

export interface CdpDatasetInput {
  datasetId: string;
  asset: string;
  timeframe: string;
  source: string;
  certification: DatasetCertification;
  partialApprovalAuthorized?: boolean;
  checksum?: string;
  schemaVersion?: string;
  rowCount?: number;
  records: Partial<ResearchDataPoint>[];
  receivedAt: number;
}

export interface CdpDatasetRequest {
  datasetId: string;
  asset?: string;
  timeframe?: string;
  requestedBy?: string;
}

export interface DatasetIssue {
  code: DatasetIssueCode;
  severity: ResearchSeverity;
  message: string;
  timestamp?: number;
  index?: number;
  meta?: Record<string, unknown>;
}

export interface DatasetProfile {
  datasetId: string;
  asset: string;
  timeframe: string;
  source: string;
  certification: DatasetCertification;
  partialApprovalAuthorized: boolean;
  checksum?: string;
  schemaVersion?: string;
  receivedAt: number;
  simulated: boolean;
  valid: boolean;
  usable: boolean;
  recordCount: number;
  validRecordCount: number;
  invalidRecordCount: number;
  coverage: number;
  inferredIntervalMs?: number;
  normalizedRecords: ResearchDataPoint[];
  issues: DatasetIssue[];
}

export interface DatasetValidationRules {
  minRecords: number;
  minCoverage: number;
  maxInvalidRecordRatio: number;
  allowPartialAuthorized: boolean;
}

export interface DatasetValidationResult {
  valid: boolean;
  blockingReasons: string[];
  warnings: string[];
}

export interface HypothesisCriteria {
  minSampleSize: number;
  minSuccessRate: number;
  minEffectSize: number;
  maxFailureRate: number;
  maxPValue?: number;
}

export interface HypothesisGovernance {
  owner?: string;
  tags?: string[];
  version?: string;
}

export interface ResearchHypothesis {
  hypothesisId: string;
  title: string;
  statement: string;
  metricKey: string;
  criteria: HypothesisCriteria;
  governance?: HypothesisGovernance;
}

export interface ExperimentComparisonContext {
  baselineLabel?: string;
  candidateLabel?: string;
  previousVersionLabel?: string;
  currentVersionLabel?: string;
}

export interface ExperimentGuardrails {
  minTrials: number;
  maxFailureRate: number;
  maxRejectedTrials: number;
}

export interface ResearchExperimentDefinition {
  experimentId: string;
  hypothesisId: string;
  name: string;
  datasetRules: DatasetValidationRules;
  guardrails: ExperimentGuardrails;
  comparisonContext?: ExperimentComparisonContext;
}

export type ExperimentTrialStatus = 'passed' | 'failed' | 'rejected';

export interface ExperimentTrial {
  trialId: string;
  status: ExperimentTrialStatus;
  baselineValue: number;
  candidateValue: number;
  pValue?: number;
  notes?: string;
}

export interface ExperimentSummary {
  sampleSize: number;
  passedTrials: number;
  failedTrials: number;
  rejectedTrials: number;
  successRate: number;
  failureRate: number;
  rejectionRate: number;
  averageEffectSize: number;
  averagePValue?: number;
}

export interface ExperimentExecution {
  status: 'completed' | 'failed';
  startedAt: number;
  completedAt: number;
  failureReason?: string;
}

export interface ExperimentResult {
  valid: boolean;
  dataset: DatasetProfile;
  datasetValidation: DatasetValidationResult;
  definition: ResearchExperimentDefinition;
  trials: ExperimentTrial[];
  summary: ExperimentSummary;
  execution: ExperimentExecution;
  rankingScore: number;
  rejectionReasons: string[];
}

export interface HypothesisDecision {
  status: 'validated' | 'rejected' | 'inconclusive';
  score: number;
  rationale: string[];
  blockingIssues: string[];
}

export interface ResearchMetrics {
  totalDatasets: number;
  validDatasets: number;
  invalidDatasets: number;
  completedExperiments: number;
  failedExperiments: number;
  validatedHypotheses: number;
  rejectedHypotheses: number;
  blockedPromotions: number;
  averageCoverage: number;
  averageEffectSize: number;
  averageRankingScore: number;
  pendingManualReview: number;
  traceCoverage: number;
  topExperimentId?: string;
}

export interface PromotionProposal {
  status: 'proposed' | 'blocked';
  reasons: string[];
  reviewMode?: 'manual-only' | 'eligible';
  payload: {
    hypothesisId: string;
    experimentId: string;
    score: number;
    averageEffectSize: number;
    successRate: number;
  };
}

export interface ResearchTraceEvent {
  step: string;
  status: 'completed' | 'blocked';
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface ResearchHistoryEntry {
  studyId: string;
  traceId: string;
  comparisonLabel: string;
  datasetId: string;
  hypothesisId: string;
  experimentId: string;
  status: 'validated' | 'rejected' | 'blocked';
  rankingScore: number;
  createdAt: number;
  trace: ResearchTraceEvent[];
}

export interface ExperimentRankingEntry {
  rank: number;
  studyId: string;
  comparisonLabel: string;
  hypothesisId: string;
  experimentId: string;
  rankingScore: number;
  hypothesisScore: number;
  proposalStatus: PromotionProposal['status'];
  successRate: number;
  averageEffectSize: number;
}

export interface ResearchComparisonRow {
  studyId: string;
  comparisonLabel: string;
  hypothesisId: string;
  experimentId: string;
  hypothesisScore: number;
  rankingScore: number;
  successRate: number;
  averageEffectSize: number;
  versusBaseline: number;
  versusCurrent: number;
  versusPreviousVersion: number;
  status: HypothesisDecision['status'];
}

export interface ResearchAutomaticReport {
  reportId: string;
  createdAt: number;
  summary: string[];
  recommendations: string[];
  ranking: ExperimentRankingEntry[];
  blockedStudies: string[];
}

export interface ResearchDashboardSnapshot {
  totalStudies: number;
  validatedHypotheses: number;
  rejectedHypotheses: number;
  blockedPromotions: number;
  pendingManualReview: number;
  topExperiment?: ExperimentRankingEntry;
  rankings: ExperimentRankingEntry[];
  comparisonMatrix: ResearchComparisonRow[];
  latestReportId?: string;
  historyEntries: number;
}

export interface ResearchStudyInput {
  studyId?: string;
  traceId?: string;
  comparisonLabel?: string;
  dataset: ResearchDatasetInput;
  hypothesis: ResearchHypothesis;
  experiment: ResearchExperimentDefinition;
  trials: ExperimentTrial[];
  productionChangeRequested?: boolean;
  manualReviewRequired?: boolean;
}

export interface ResearchStudyResult {
  studyId: string;
  traceId: string;
  comparisonLabel: string;
  datasetProfile: DatasetProfile;
  datasetValidation: DatasetValidationResult;
  experimentResult: ExperimentResult;
  hypothesisDecision: HypothesisDecision;
  metrics: ResearchMetrics;
  proposal: PromotionProposal;
  manualReviewRequired: boolean;
  historyEntry: ResearchHistoryEntry;
}

export interface ResearchProgramResult {
  studies: ResearchStudyResult[];
  rankings: ExperimentRankingEntry[];
  comparisons: ResearchComparisonRow[];
  history: ResearchHistoryEntry[];
  metrics: ResearchMetrics;
  dashboard: ResearchDashboardSnapshot;
  report: ResearchAutomaticReport;
}

export interface ResearchProposalEnvelope {
  proposalId: string;
  datasetId: string;
  checksum: string;
  schemaVersion: string;
  source: 'RESEARCH_LAB';
  status: 'CERTIFIED';
  manualReviewRequired: true;
  experimentId: string;
  createdAt: number;
}

export interface ResearchProposalManifest {
  latestProposalId: string;
  latestProposalFile: string;
  updatedAt: number;
  source: 'RESEARCH_LAB';
  status: 'CERTIFIED';
}

export type PipelineStage =
  | 'dataset'
  | 'experiment'
  | 'result'
  | 'validation'
  | 'knowledge_card'
  | 'research_proposal';

export interface PipelineStageResult {
  stage: PipelineStage;
  status: 'completed' | 'failed';
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface KnowledgeCard {
  cardId: string;
  studyId: string;
  hypothesisId: string;
  experimentId: string;
  datasetId: string;
  createdAt: number;
  rankingScore: number;
  status: 'draft' | 'validated' | 'blocked';
  summary: string[];
  recommendations: string[];
  tags: string[];
  proposalStatus: PromotionProposal['status'];
  traceId: string;
}

export interface ResearchProposalDocument {
  proposalId: string;
  createdAt: number;
  studyId: string;
  cardId: string;
  hypothesisId: string;
  experimentId: string;
  status: 'ready_for_review' | 'blocked';
  rationale: string[];
}

export interface PipelineRunResult {
  study: ResearchStudyResult;
  stages: PipelineStageResult[];
  knowledgeCard: KnowledgeCard;
  proposalDocument: ResearchProposalDocument;
  autoSummary: string;
}

export interface ExperimentQueueItem {
  queueId: string;
  enqueuedAt: number;
  priority: number;
  study: ResearchStudyInput;
}

export interface BatchExecutionOptions {
  parallelism: number;
  batchSize: number;
  baselineStudyId?: string;
}

export interface BatchExecutionResult {
  queueProcessed: number;
  runs: PipelineRunResult[];
  rankings: ExperimentRankingEntry[];
  comparisons: ResearchComparisonRow[];
  dashboard: ResearchDashboardSnapshot;
  report: ResearchAutomaticReport;
}

export interface HistoricalRankingEntry {
  position: number;
  cardId: string;
  studyId: string;
  rankingScore: number;
  createdAt: number;
}

export interface ExperimentVersionComparison {
  baseCardId: string;
  candidateCardId: string;
  rankingDelta: number;
  successRateDelta: number;
  effectSizeDelta: number;
  winnerCardId: string;
}

export interface KnowledgeBaseSnapshot {
  cards: KnowledgeCard[];
  history: ResearchHistoryEntry[];
  historicalRanking: HistoricalRankingEntry[];
  latestDashboard?: ResearchDashboardSnapshot;
  latestReport?: ResearchAutomaticReport;
}