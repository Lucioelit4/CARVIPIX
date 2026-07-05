/**
 * Índice del módulo privado de backtesting
 * Exporta todas las utilidades para backtesting
 * USO EXCLUSIVO: Admin panel - NO exponer al cliente
 */

// Engine
export { BacktestEngine } from './backtestEngine';

// Cálculos
export { calculateBacktestMetrics, validateMetrics } from './calculations';

// Datos históricos
export { 
  generateHistoricalCandles, 
  generateBacktestData, 
  loadHistoricalData, 
  validateDateRange 
} from './historicalData';

// Monte Carlo
export { 
  runMonteCarloAnalysis,
  type MonteCarloConfig,
  type MonteCarloIteration,
  type MonteCarloAnalysis,
} from './monteCarlo';

// Walk-forward
export {
  runWalkForwardAnalysis,
  detectOverfitting,
  type WalkForwardConfig,
  type WalkForwardWindow,
  type WalkForwardAnalysis,
} from './walkForward';

// Massive Backtesting Lab
export {
  discoverHistoricalDatasetInventory,
  runMassiveBacktestingLab,
  type HistoricalDatasetFile,
  type MassiveLabConfig,
  type MassiveLabJob,
  type MassiveLabJobResult,
  type MassiveLabDatasetInventory,
  type MassiveLabRunResult,
} from './massiveLab';

// Research Center
export {
  saveResearchExecutionRecord,
  loadResearchExecutionRecord,
  listResearchExecutionRecords,
  saveProfessionalComparisonReport,
  saveEngineHistoricalComparisonReport,
  listEngineHistoricalComparisonReports,
  saveCandidateValidationReport,
  listCandidateValidationReports,
  listResearchDatasets,
  listResearchExports,
  exportResearchRun,
  buildTrainingRecords,
  exportTrainingDatasetNdjson,
  compareResearchExecutions,
  compareEngineVersionAgainstHistory,
  buildEngineBenchmark,
  detectEngineVersionInfo,
  evaluateCandidateEngineVersion,
  getDefaultCandidateValidationRules,
  buildResearchDashboardSnapshot,
} from './research';
export type {
  ResearchExecutionRecord,
  ResearchExecutionMetadata,
  ResearchExecutionExports,
  ResearchCpuSnapshot,
  ResearchDatasetUsage,
  ResearchRunParameters,
  ProfessionalComparisonReport,
  TrainingRecord,
  BenchmarkMetricOutcome,
  BenchmarkComparison,
  EngineVersionInfo,
  VersionDeltaMetric,
  EngineHistoricalComparisonReport,
  CandidateValidationRule,
  CandidateValidationFinding,
  CandidateValidationReport,
  ResearchDashboardSnapshot,
} from './research';

// Performance
export {
  PerformanceTracker,
  comparePerformanceReports,
  type PerformanceStats,
  type AssetPerformanceStats,
  type PerformanceReport,
} from './performance';

// Cache Manager
export {
  CacheManager,
  getCacheManager,
  resetCacheManager,
} from '../cache/cacheManager';
export type {
  CacheMetadata,
  CacheStatus,
  CacheStats,
  CandleData,
  CacheWriteResult,
  CacheReadResult,
  CacheClearResult,
  Asset as CacheAsset,
  Timeframe as CacheTimeframe,
} from '../cache/types';

// Batch Processor
export {
  BatchProcessor,
  getBatchProcessor,
  resetBatchProcessor,
} from '../batch/batchProcessor';
export type {
  BatchConfig,
  BatchJob,
  BatchProgress,
  BatchResult,
  BatchSummary,
  BatchError,
  BatchWarning,
  BatchQueueStats,
} from '../batch/types';

// Parameter Optimizer
export {
  ParameterOptimizer,
  getParameterOptimizer,
  OptimizationScorer,
} from './optimizer';
export type {
  OptimizationMethod,
  ParameterRange,
  OptimizationConfig,
  OptimizationCandidate,
  OptimizationRunResult,
  OptimizationScore,
  OptimizationResult,
  OptimizationRun,
  OptimizationProgress,
  ParameterSensitivity,
  OptimizationComparison,
} from './optimizer/types';
