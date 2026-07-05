import fs from 'fs';
import path from 'path';
import type { MassiveLabJobResult } from '../massiveLab';
import type { TrainingRecord } from './types';

export interface TrainingPreparedRun {
  runId: string;
  engineVersionHash: string;
  engineVersionId: string;
  config: {
    engineVersion?: string;
  };
  jobs: MassiveLabJobResult[];
}

const RESEARCH_ROOT = path.join(process.cwd(), 'data', 'backtesting-research');
const TRAINING_DIR = path.join(RESEARCH_ROOT, 'training-ready');

function ensureTrainingDir(): void {
  fs.mkdirSync(TRAINING_DIR, { recursive: true });
}

export function buildTrainingRecords(run: TrainingPreparedRun): TrainingRecord[] {
  const engineVersion = run.config.engineVersion || 'engine-current';

  return run.jobs
    .filter((job) => job.status === 'completed' && job.result)
    .map((job) => {
      const metrics = job.result!.metrics;
      const record: TrainingRecord = {
        runId: run.runId,
        engineVersion,
        engineVersionHash: run.engineVersionHash,
        engineVersionId: run.engineVersionId,
        jobId: job.job.id,
        asset: job.job.asset,
        timeframe: job.job.timeframe,
        year: job.job.year,
        candles: job.job.candleCount,
        durationMs: job.durationMs,
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        netProfit: metrics.netProfit,
        recoveryFactor: metrics.recoveryFactor,
        expectancy: metrics.expectancy,
        labelProfitPositive: metrics.netProfit > 0 ? 1 : 0,
      };

      return record;
    });
}

export function exportTrainingDatasetNdjson(run: TrainingPreparedRun): string {
  ensureTrainingDir();
  const records = buildTrainingRecords(run);
  const filePath = path.join(TRAINING_DIR, `${run.runId}_training.ndjson`);
  const payload = records.map((record) => JSON.stringify(record)).join('\n');
  fs.writeFileSync(filePath, payload.length > 0 ? `${payload}\n` : '', 'utf8');
  return filePath;
}
