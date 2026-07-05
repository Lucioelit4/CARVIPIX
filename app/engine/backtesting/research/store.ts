import fs from 'fs';
import path from 'path';
import type {
  CandidateValidationReport,
  EngineHistoricalComparisonReport,
  EngineSelectionDecision,
  ProfessionalComparisonReport,
  ResearchDatasetUsage,
  ResearchExecutionExports,
  ResearchExecutionRecord,
} from './types';

const RESEARCH_ROOT = path.join(process.cwd(), 'data', 'backtesting-research');
const HISTORY_DIR = path.join(RESEARCH_ROOT, 'history');
const COMPARISONS_DIR = path.join(RESEARCH_ROOT, 'comparisons');
const VERSION_COMPARISONS_DIR = path.join(RESEARCH_ROOT, 'version-comparisons');
const VALIDATIONS_DIR = path.join(RESEARCH_ROOT, 'validations');
const SELECTIONS_DIR = path.join(RESEARCH_ROOT, 'selections');
const ACTIVE_SELECTION_FILE = path.join(RESEARCH_ROOT, 'active-selection.json');
const INDEX_FILE = path.join(RESEARCH_ROOT, 'index.json');

function ensureResearchDirs(): void {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  fs.mkdirSync(COMPARISONS_DIR, { recursive: true });
  fs.mkdirSync(VERSION_COMPARISONS_DIR, { recursive: true });
  fs.mkdirSync(VALIDATIONS_DIR, { recursive: true });
  fs.mkdirSync(SELECTIONS_DIR, { recursive: true });
}

function listJsonFilesByMtimeDesc(dirPath: string, limit: number): string[] {
  ensureResearchDirs();
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, Math.max(1, limit));

  return files.map((file) => file.fullPath);
}

function readIndex(): string[] {
  ensureResearchDirs();
  if (!fs.existsSync(INDEX_FILE)) {
    return [];
  }

  const raw = fs.readFileSync(INDEX_FILE, 'utf8').trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(runIds: string[]): void {
  fs.writeFileSync(INDEX_FILE, `${JSON.stringify(runIds, null, 2)}\n`, 'utf8');
}

export function saveResearchExecutionRecord(record: ResearchExecutionRecord): string {
  ensureResearchDirs();
  const filePath = path.join(HISTORY_DIR, `${record.metadata.runId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  const index = readIndex();
  if (!index.includes(record.metadata.runId)) {
    index.unshift(record.metadata.runId);
    writeIndex(index);
  }

  return filePath;
}

export function loadResearchExecutionRecord(runId: string): ResearchExecutionRecord | null {
  ensureResearchDirs();
  const filePath = path.join(HISTORY_DIR, `${runId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as ResearchExecutionRecord;
}

export function listResearchExecutionRecords(limit = 200): ResearchExecutionRecord[] {
  const runIds = readIndex();
  const selected = runIds.slice(0, Math.max(1, limit));

  const records: ResearchExecutionRecord[] = [];
  for (const runId of selected) {
    const loaded = loadResearchExecutionRecord(runId);
    if (loaded) {
      records.push(loaded);
    }
  }

  return records;
}

export function saveProfessionalComparisonReport(report: ProfessionalComparisonReport): string {
  ensureResearchDirs();
  const timestamp = Date.now();
  const filePath = path.join(COMPARISONS_DIR, `comparison_${timestamp}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return filePath;
}

export function saveEngineHistoricalComparisonReport(report: EngineHistoricalComparisonReport): string {
  ensureResearchDirs();
  const filePath = path.join(
    VERSION_COMPARISONS_DIR,
    `version_comparison_${report.candidateEngineVersion}_${report.candidateRunId}.json`
  );
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return filePath;
}

export function listEngineHistoricalComparisonReports(limit = 100): EngineHistoricalComparisonReport[] {
  const files = listJsonFilesByMtimeDesc(VERSION_COMPARISONS_DIR, limit);
  return files
    .map((filePath) => {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as EngineHistoricalComparisonReport;
      } catch {
        return null;
      }
    })
    .filter((item): item is EngineHistoricalComparisonReport => item !== null);
}

export function saveCandidateValidationReport(report: CandidateValidationReport): string {
  ensureResearchDirs();
  const filePath = path.join(
    VALIDATIONS_DIR,
    `candidate_validation_${report.candidateEngineVersion}_${report.candidateRunId}.json`
  );
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return filePath;
}

export function listCandidateValidationReports(limit = 100): CandidateValidationReport[] {
  const files = listJsonFilesByMtimeDesc(VALIDATIONS_DIR, limit);
  return files
    .map((filePath) => {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as CandidateValidationReport;
      } catch {
        return null;
      }
    })
    .filter((item): item is CandidateValidationReport => item !== null);
}

export function saveEngineSelectionDecision(decision: EngineSelectionDecision): string {
  ensureResearchDirs();

  const selectedVersionId = decision.selectedEngineVersionId || 'none';
  const filePath = path.join(SELECTIONS_DIR, `engine_selection_${decision.generatedAt}_${selectedVersionId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(decision, null, 2)}\n`, 'utf8');
  fs.writeFileSync(ACTIVE_SELECTION_FILE, `${JSON.stringify(decision, null, 2)}\n`, 'utf8');

  return filePath;
}

export function loadActiveEngineSelection(): EngineSelectionDecision | null {
  ensureResearchDirs();
  if (!fs.existsSync(ACTIVE_SELECTION_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(ACTIVE_SELECTION_FILE, 'utf8');
    return JSON.parse(raw) as EngineSelectionDecision;
  } catch {
    return null;
  }
}

export function listEngineSelectionDecisions(limit = 100): EngineSelectionDecision[] {
  const files = listJsonFilesByMtimeDesc(SELECTIONS_DIR, limit);
  return files
    .map((filePath) => {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as EngineSelectionDecision;
      } catch {
        return null;
      }
    })
    .filter((item): item is EngineSelectionDecision => item !== null);
}

export function listResearchDatasets(limit = 200): ResearchDatasetUsage[] {
  return listResearchExecutionRecords(limit).map((record) => record.metadata.dataset);
}

export function listResearchExports(limit = 200): ResearchExecutionExports[] {
  return listResearchExecutionRecords(limit).map((record) => record.exports);
}
