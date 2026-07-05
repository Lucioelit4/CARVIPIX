import fs from 'fs';
import path from 'path';
import type { MassiveLabJobResult } from '../massiveLab';
import type { ResearchExecutionExports } from './types';

export interface ExportableMassiveRun {
  runId: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  workersUsed: number;
  engineVersionHash: string;
  engineVersionId: string;
  config: {
    engineVersion?: string;
  };
  summary: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalTrades: number;
    averageWinRate: number;
    averageProfitFactor: number;
    averageSharpeRatio: number;
    averageMaxDrawdown: number;
    totalNetProfit: number;
    medianNetProfit: number;
  };
  jobs: MassiveLabJobResult[];
}

const RESEARCH_ROOT = path.join(process.cwd(), 'data', 'backtesting-research');
const EXPORTS_DIR = path.join(RESEARCH_ROOT, 'exports');

function ensureExportDir(): void {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function toCsvRow(values: Array<string | number>): string {
  const escaped = values.map((value) => {
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  });

  return escaped.join(',');
}

function buildSummaryCsv(run: ExportableMassiveRun): string {
  const headers = [
    'runId',
    'engineVersion',
    'engineVersionHash',
    'engineVersionId',
    'startedAt',
    'completedAt',
    'durationMs',
    'workersUsed',
    'totalJobs',
    'completedJobs',
    'failedJobs',
    'totalTrades',
    'averageWinRate',
    'averageProfitFactor',
    'averageSharpeRatio',
    'averageMaxDrawdown',
    'totalNetProfit',
    'medianNetProfit',
  ];

  const row = toCsvRow([
    run.runId,
    run.config.engineVersion || 'engine-current',
    run.engineVersionHash,
    run.engineVersionId,
    run.startedAt,
    run.completedAt,
    run.durationMs,
    run.workersUsed,
    run.summary.totalJobs,
    run.summary.completedJobs,
    run.summary.failedJobs,
    run.summary.totalTrades,
    run.summary.averageWinRate,
    run.summary.averageProfitFactor,
    run.summary.averageSharpeRatio,
    run.summary.averageMaxDrawdown,
    run.summary.totalNetProfit,
    run.summary.medianNetProfit,
  ]);

  return `${headers.join(',')}\n${row}\n`;
}

function buildJobsCsv(
  runId: string,
  jobs: MassiveLabJobResult[],
  engineVersion: string,
  engineVersionHash: string,
  engineVersionId: string
): string {
  const headers = [
    'runId',
    'engineVersion',
    'engineVersionHash',
    'engineVersionId',
    'jobId',
    'status',
    'asset',
    'timeframe',
    'year',
    'candleCount',
    'durationMs',
    'totalTrades',
    'winRate',
    'profitFactor',
    'sharpeRatio',
    'maxDrawdown',
    'recoveryFactor',
    'expectancy',
    'netProfit',
  ];

  const rows = jobs.map((job) => {
    const metrics = job.result?.metrics;
    return toCsvRow([
      runId,
      engineVersion,
      engineVersionHash,
      engineVersionId,
      job.job.id,
      job.status,
      job.job.asset,
      job.job.timeframe,
      job.job.year,
      job.job.candleCount,
      job.durationMs,
      metrics?.totalTrades ?? 0,
      metrics?.winRate ?? 0,
      metrics?.profitFactor ?? 0,
      metrics?.sharpeRatio ?? 0,
      metrics?.maxDrawdown ?? 0,
      metrics?.recoveryFactor ?? 0,
      metrics?.expectancy ?? 0,
      metrics?.netProfit ?? 0,
    ]);
  });

  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

export function exportResearchRun(run: ExportableMassiveRun): ResearchExecutionExports {
  ensureExportDir();

  const summaryJsonPath = path.join(EXPORTS_DIR, `${run.runId}_summary.json`);
  const jobsJsonPath = path.join(EXPORTS_DIR, `${run.runId}_jobs.json`);
  const summaryCsvPath = path.join(EXPORTS_DIR, `${run.runId}_summary.csv`);
  const jobsCsvPath = path.join(EXPORTS_DIR, `${run.runId}_jobs.csv`);

  fs.writeFileSync(summaryJsonPath, `${JSON.stringify(run.summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(jobsJsonPath, `${JSON.stringify(run.jobs, null, 2)}\n`, 'utf8');
  fs.writeFileSync(summaryCsvPath, buildSummaryCsv(run), 'utf8');
  fs.writeFileSync(
    jobsCsvPath,
    buildJobsCsv(
      run.runId,
      run.jobs,
      run.config.engineVersion || 'engine-current',
      run.engineVersionHash,
      run.engineVersionId
    ),
    'utf8'
  );

  return {
    summaryJsonPath,
    jobsJsonPath,
    summaryCsvPath,
    jobsCsvPath,
  };
}
