import { buildEngineBenchmark } from './benchmark';
import {
  listEngineSelectionDecisions,
  loadActiveEngineSelection,
  listCandidateValidationReports,
  listEngineHistoricalComparisonReports,
  listResearchDatasets,
  listResearchExecutionRecords,
  listResearchExports,
} from './store';
import { listLocalAiIntegrationManifests } from './localAiPrep';
import type { ResearchDashboardSnapshot } from './types';

export function buildResearchDashboardSnapshot(limit = 200): ResearchDashboardSnapshot {
  const historyRecords = listResearchExecutionRecords(limit);
  const latest = historyRecords[0] || null;

  return {
    generatedAt: Date.now(),
    history: historyRecords.map((record) => ({
      runId: record.metadata.runId,
      executedAt: record.metadata.executedAt,
      engineVersion: record.metadata.engineVersion,
      versionHash: record.metadata.engineVersionInfo.versionHash,
      durationMs: record.metadata.durationMs,
      totalJobs: record.summary.totalJobs,
      totalNetProfit: record.summary.totalNetProfit,
    })),
    benchmarks: latest ? buildEngineBenchmark(latest.metadata.engineVersion) : null,
    latestComparisons: listEngineHistoricalComparisonReports(limit),
    latestValidations: listCandidateValidationReports(limit),
    latestSelections: listEngineSelectionDecisions(limit),
    activeSelection: loadActiveEngineSelection(),
    localAiManifests: listLocalAiIntegrationManifests(limit),
    datasets: listResearchDatasets(limit),
    exports: listResearchExports(limit),
  };
}
