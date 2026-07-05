export {
  saveResearchExecutionRecord,
  loadResearchExecutionRecord,
  listResearchExecutionRecords,
  saveProfessionalComparisonReport,
  saveEngineHistoricalComparisonReport,
  listEngineHistoricalComparisonReports,
  saveCandidateValidationReport,
  listCandidateValidationReports,
  saveEngineSelectionDecision,
  loadActiveEngineSelection,
  listEngineSelectionDecisions,
  listResearchDatasets,
  listResearchExports,
} from './store';
export { exportResearchRun } from './exporters';
export { buildTrainingRecords, exportTrainingDatasetNdjson } from './trainingPrep';
export { compareResearchExecutions, compareEngineVersionAgainstHistory } from './comparator';
export { buildEngineBenchmark } from './benchmark';
export { selectBestEngineVersion, getDefaultEngineSelectionThresholds } from './selector';
export { detectEngineVersionInfo } from './versioning';
export { evaluateCandidateEngineVersion, getDefaultCandidateValidationRules } from './validation';
export { buildResearchDashboardSnapshot } from './dashboard';
export {
  buildLocalAiIntegrationManifest,
  saveLocalAiIntegrationManifest,
  listLocalAiIntegrationManifests,
} from './localAiPrep';

export type {
  ResearchExecutionRecord,
  ResearchExecutionMetadata,
  ResearchExecutionExports,
  ResearchCpuSnapshot,
  ResearchDatasetUsage,
  ProfessionalComparisonReport,
  TrainingRecord,
  BenchmarkMetricOutcome,
  BenchmarkComparison,
  EngineVersionInfo,
  ResearchRunParameters,
  VersionDeltaMetric,
  EngineHistoricalComparisonReport,
  CandidateValidationRule,
  CandidateValidationFinding,
  CandidateValidationReport,
  EngineSelectionThresholds,
  EngineSelectionCandidate,
  EngineSelectionDecision,
  LocalAiIntegrationManifest,
  ResearchDashboardSnapshot,
} from './types';
