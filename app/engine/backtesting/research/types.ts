import type { Asset, Timeframe } from '../../types/marketData';
import type { MassiveLabConfig, MassiveLabJobResult, MassiveLabDatasetInventory, MassiveLabRunResult } from '../massiveLab';

export interface EngineVersionInfo {
  versionLabel: string;
  versionHash: string;
  versionId: string;
  sourceFingerprint: Record<string, string>;
}

export interface ResearchRunParameters {
  includeMonteCarlo: boolean;
  includeWalkForward: boolean;
  monteCarloConfig: Record<string, number | boolean | string | null>;
  walkForwardConfig: Record<string, number | boolean | string | null>;
}

export interface ResearchCpuSnapshot {
  cpuCores: number;
  workersUsed: number;
  processUserCpuMs: number;
  processSystemCpuMs: number;
  processTotalCpuMs: number;
  estimatedProcessCpuLoadPercent: number;
}

export interface ResearchDatasetUsage {
  totalFiles: number;
  totalSizeBytes: number;
  files: Array<{
    name: string;
    path: string;
    asset: Asset;
    year: string;
    month: string;
    size: number;
  }>;
}

export interface ResearchExecutionMetadata {
  runId: string;
  executedAt: number;
  engineVersion: string;
  engineVersionInfo: EngineVersionInfo;
  config: MassiveLabConfig;
  parameters: ResearchRunParameters;
  timeframeSet: Timeframe[];
  dataset: ResearchDatasetUsage;
  durationMs: number;
  cpu: ResearchCpuSnapshot;
}

export interface ResearchExecutionExports {
  summaryJsonPath: string;
  jobsJsonPath: string;
  summaryCsvPath: string;
  jobsCsvPath: string;
}

export interface TrainingRecord {
  runId: string;
  engineVersion: string;
  engineVersionHash: string;
  engineVersionId: string;
  jobId: string;
  asset: Asset;
  timeframe: Timeframe;
  year: string;
  candles: number;
  durationMs: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  netProfit: number;
  recoveryFactor: number;
  expectancy: number;
  labelProfitPositive: 0 | 1;
}

export interface ResearchExecutionRecord {
  metadata: ResearchExecutionMetadata;
  inventory: MassiveLabDatasetInventory;
  jobs: MassiveLabJobResult[];
  summary: MassiveLabRunResult['summary'];
  exports: ResearchExecutionExports;
  trainingDatasetPath: string;
}

export interface BenchmarkMetricOutcome {
  engineVersion: string;
  engineVersionHash: string;
  engineVersionId: string;
  runs: number;
  totalJobs: number;
  totalTrades: number;
  averageWinRate: number;
  averageProfitFactor: number;
  averageSharpeRatio: number;
  averageMaxDrawdown: number;
  averageRecoveryFactor: number;
  averageExpectancy: number;
  totalNetProfit: number;
}

export interface BenchmarkComparison {
  baselineEngineVersion: string;
  baseline: BenchmarkMetricOutcome | null;
  ranking: BenchmarkMetricOutcome[];
}

export interface VersionDeltaMetric {
  metric: 'averageProfitFactor' | 'averageSharpeRatio' | 'averageMaxDrawdown' | 'averageRecoveryFactor' | 'averageExpectancy' | 'totalNetProfit';
  current: number;
  reference: number;
  delta: number;
  deltaPercent: number;
  trend: 'improvement' | 'regression' | 'neutral';
}

export interface EngineHistoricalComparisonReport {
  generatedAt: number;
  candidateEngineVersion: string;
  candidateRunId: string;
  comparedAgainstVersions: string[];
  improvements: VersionDeltaMetric[];
  regressions: VersionDeltaMetric[];
  neutral: VersionDeltaMetric[];
  summary: {
    improvementCount: number;
    regressionCount: number;
    neutralCount: number;
  };
}

export interface CandidateValidationRule {
  metric: 'averageProfitFactor' | 'averageSharpeRatio' | 'averageMaxDrawdown' | 'averageRecoveryFactor' | 'averageExpectancy';
  operator: '>=' | '<=';
  threshold: number;
  source: 'benchmark-baseline' | 'absolute';
}

export interface CandidateValidationFinding {
  metric: CandidateValidationRule['metric'];
  status: 'pass' | 'fail';
  actual: number;
  required: number;
  operator: CandidateValidationRule['operator'];
  message: string;
}

export interface CandidateValidationReport {
  generatedAt: number;
  candidateEngineVersion: string;
  candidateRunId: string;
  blockingActive: boolean;
  candidateStatus: 'approved' | 'rejected';
  findings: CandidateValidationFinding[];
  rules: CandidateValidationRule[];
}

export interface EngineSelectionThresholds {
  minRuns: number;
  minJobs: number;
  minProfitFactor: number;
  minSharpeRatio: number;
  maxDrawdown: number;
}

export interface EngineSelectionCandidate {
  engineVersion: string;
  engineVersionId: string;
  engineVersionHash: string;
  compositeScore: number;
  metrics: {
    runs: number;
    totalJobs: number;
    totalTrades: number;
    averageWinRate: number;
    averageProfitFactor: number;
    averageSharpeRatio: number;
    averageMaxDrawdown: number;
    averageRecoveryFactor: number;
    averageExpectancy: number;
    totalNetProfit: number;
  };
  passedThresholds: boolean;
  failedThresholds: string[];
}

export interface EngineSelectionDecision {
  generatedAt: number;
  baselineEngineVersion: string;
  thresholds: EngineSelectionThresholds;
  selectedEngineVersion: string | null;
  selectedEngineVersionId: string | null;
  selectedEngineVersionHash: string | null;
  selectedCompositeScore: number | null;
  status: 'selected' | 'no-eligible-candidate';
  reason: string;
  candidates: EngineSelectionCandidate[];
  eligibleCandidates: EngineSelectionCandidate[];
}

export interface LocalAiIntegrationManifest {
  generatedAt: number;
  runId: string;
  engineVersion: string;
  engineVersionId: string;
  engineVersionHash: string;
  trainingDatasetPath: string;
  selection: {
    status: EngineSelectionDecision['status'];
    selectedEngineVersionId: string | null;
    selectedCompositeScore: number | null;
    reason: string;
  };
  validation: {
    candidateStatus: CandidateValidationReport['candidateStatus'];
    blockingActive: boolean;
    failedFindings: CandidateValidationFinding['metric'][];
  };
  schema: {
    format: 'ndjson';
    targetLabel: string;
    features: string[];
    metadata: string[];
  };
  readiness: {
    datasetReady: boolean;
    validationApproved: boolean;
    selectedVersionReady: boolean;
    recommendedNextAction: string;
  };
}

export interface ResearchDashboardSnapshot {
  generatedAt: number;
  history: Array<{
    runId: string;
    executedAt: number;
    engineVersion: string;
    versionHash: string;
    durationMs: number;
    totalJobs: number;
    totalNetProfit: number;
  }>;
  benchmarks: BenchmarkComparison | null;
  latestComparisons: EngineHistoricalComparisonReport[];
  latestValidations: CandidateValidationReport[];
  latestSelections: EngineSelectionDecision[];
  activeSelection: EngineSelectionDecision | null;
  localAiManifests: LocalAiIntegrationManifest[];
  datasets: ResearchDatasetUsage[];
  exports: ResearchExecutionExports[];
}

export interface ProfessionalComparisonReport {
  runIds: string[];
  bestProfitFactorRunId: string | null;
  bestSharpeRunId: string | null;
  bestRecoveryRunId: string | null;
  bestExpectancyRunId: string | null;
  lowestDrawdownRunId: string | null;
  entries: Array<{
    runId: string;
    engineVersion: string;
    completedJobs: number;
    failedJobs: number;
    totalNetProfit: number;
    averageProfitFactor: number;
    averageSharpe: number;
    averageMaxDrawdown: number;
    averageRecovery: number;
    averageExpectancy: number;
  }>;
}
