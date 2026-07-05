import fs from 'fs';
import path from 'path';
import type { CandidateValidationReport, EngineSelectionDecision, LocalAiIntegrationManifest, ResearchExecutionRecord } from './types';

const RESEARCH_ROOT = path.join(process.cwd(), 'data', 'backtesting-research');
const AI_INTEGRATION_DIR = path.join(RESEARCH_ROOT, 'ai-integration');

function ensureAiIntegrationDir(): void {
  fs.mkdirSync(AI_INTEGRATION_DIR, { recursive: true });
}

export function buildLocalAiIntegrationManifest(
  record: ResearchExecutionRecord,
  candidateValidation: CandidateValidationReport,
  selectionDecision: EngineSelectionDecision
): LocalAiIntegrationManifest {
  const datasetReady = record.trainingDatasetPath.length > 0;
  const validationApproved = candidateValidation.candidateStatus === 'approved';
  const selectedVersionReady = selectionDecision.status === 'selected';

  let recommendedNextAction = 'collect_more_research_runs';
  if (datasetReady && validationApproved && selectedVersionReady) {
    recommendedNextAction = 'ready_for_local_ai_training_pipeline';
  }

  return {
    generatedAt: Date.now(),
    runId: record.metadata.runId,
    engineVersion: record.metadata.engineVersion,
    engineVersionId: record.metadata.engineVersionInfo.versionId,
    engineVersionHash: record.metadata.engineVersionInfo.versionHash,
    trainingDatasetPath: record.trainingDatasetPath,
    selection: {
      status: selectionDecision.status,
      selectedEngineVersionId: selectionDecision.selectedEngineVersionId,
      selectedCompositeScore: selectionDecision.selectedCompositeScore,
      reason: selectionDecision.reason,
    },
    validation: {
      candidateStatus: candidateValidation.candidateStatus,
      blockingActive: candidateValidation.blockingActive,
      failedFindings: candidateValidation.findings.filter((finding) => finding.status === 'fail').map((finding) => finding.metric),
    },
    schema: {
      format: 'ndjson',
      targetLabel: 'labelProfitPositive',
      features: [
        'asset',
        'timeframe',
        'year',
        'candles',
        'durationMs',
        'totalTrades',
        'winRate',
        'profitFactor',
        'sharpeRatio',
        'maxDrawdown',
        'netProfit',
        'recoveryFactor',
        'expectancy',
      ],
      metadata: ['runId', 'engineVersion', 'engineVersionHash', 'engineVersionId', 'jobId'],
    },
    readiness: {
      datasetReady,
      validationApproved,
      selectedVersionReady,
      recommendedNextAction,
    },
  };
}

export function saveLocalAiIntegrationManifest(manifest: LocalAiIntegrationManifest): string {
  ensureAiIntegrationDir();
  const filePath = path.join(AI_INTEGRATION_DIR, `${manifest.runId}_local_ai_manifest.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return filePath;
}

export function listLocalAiIntegrationManifests(limit = 100): LocalAiIntegrationManifest[] {
  ensureAiIntegrationDir();

  const files = fs
    .readdirSync(AI_INTEGRATION_DIR)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => {
      const fullPath = path.join(AI_INTEGRATION_DIR, entry);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, Math.max(1, limit));

  return files
    .map((file) => {
      try {
        const raw = fs.readFileSync(file.fullPath, 'utf8');
        return JSON.parse(raw) as LocalAiIntegrationManifest;
      } catch {
        return null;
      }
    })
    .filter((item): item is LocalAiIntegrationManifest => item !== null);
}
