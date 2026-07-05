/**
 * Massive Backtesting Lab
 * Ejecuta backtests por todos los anios historicos disponibles con paralelismo controlado.
 * Diseñado para laboratorio privado admin (sin optimizacion de estrategias).
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { BacktestEngine } from './backtestEngine';
import type { BacktestConfig } from '../types/backtesting';
import type { Asset, Candle, Timeframe } from '../types/marketData';
import {
  runMonteCarloAnalysis,
  type MonteCarloAnalysis,
  type MonteCarloConfig,
} from './monteCarlo';
import {
  runWalkForwardAnalysis,
  detectOverfitting,
  type WalkForwardAnalysis,
  type WalkForwardConfig,
} from './walkForward';
import {
  buildLocalAiIntegrationManifest,
  compareEngineVersionAgainstHistory,
  detectEngineVersionInfo,
  evaluateCandidateEngineVersion,
  exportResearchRun,
  exportTrainingDatasetNdjson,
  saveEngineSelectionDecision,
  saveLocalAiIntegrationManifest,
  saveCandidateValidationReport,
  saveEngineHistoricalComparisonReport,
  saveResearchExecutionRecord,
  selectBestEngineVersion,
  type ResearchCpuSnapshot,
  type ResearchDatasetUsage,
  type ResearchExecutionRecord,
  type ResearchRunParameters,
} from './research';

const DEFAULT_TIMEFRAMES: Timeframe[] = ['5M', '45M', '1H'];
const DEFAULT_ASSETS: Asset[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'];

const TIMEFRAME_TO_MS: Record<Timeframe, number> = {
  '5M': 5 * 60 * 1000,
  '45M': 45 * 60 * 1000,
  '1H': 60 * 60 * 1000,
};

const DATASET_FILENAME_REGEX = /^DAT_ASCII_([A-Z0-9]+)_([A-Z0-9]+)_(\d{4}|\d{6})\.csv$/;

type SupportedAsset = Asset;

interface RawCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDatasetFile {
  name: string;
  path: string;
  asset: SupportedAsset;
  sourceTimeframe: string;
  year: string;
  month: string;
  size: number;
}

export interface MassiveLabConfig {
  initialBalance: number;
  riskPerTrade: number;
  consensusThreshold: number;
  maxDrawdown: number;
  minWinRate: number;
  engineVersion?: string;
  maxWorkers?: number;
  assets?: Asset[];
  timeframes?: Timeframe[];
  years?: string[];
  includeMonteCarlo?: boolean;
  includeWalkForward?: boolean;
  monteCarloConfig?: Partial<MonteCarloConfig>;
  walkForwardConfig?: Partial<WalkForwardConfig>;
}

export interface MassiveLabJob {
  id: string;
  asset: Asset;
  timeframe: Timeframe;
  year: string;
  candleCount: number;
}

export interface MassiveLabJobResult {
  job: MassiveLabJob;
  status: 'completed' | 'failed';
  result?: Awaited<ReturnType<BacktestEngine['run']>>;
  monteCarlo?: MonteCarloAnalysis;
  walkForward?: WalkForwardAnalysis;
  overfitting?: ReturnType<typeof detectOverfitting>;
  durationMs: number;
  error?: string;
}

export interface MassiveLabDatasetInventory {
  files: HistoricalDatasetFile[];
  availableYears: string[];
  availableAssets: Asset[];
  cpuCores: number;
  suggestedWorkers: number;
}

export interface MassiveLabRunResult {
  runId: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  workersUsed: number;
  engineVersion: string;
  engineVersionHash: string;
  engineVersionId: string;
  cpu: ResearchCpuSnapshot;
  datasetUsed: ResearchDatasetUsage;
  persistedRunPath: string;
  versionComparisonPath: string;
  candidateValidationPath: string;
  engineSelectionPath: string;
  localAiManifestPath: string;
  trainingDatasetPath: string;
  exports: {
    summaryJsonPath: string;
    jobsJsonPath: string;
    summaryCsvPath: string;
    jobsCsvPath: string;
  };
  inventory: MassiveLabDatasetInventory;
  config: MassiveLabConfig;
  jobs: MassiveLabJobResult[];
  summary: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    yearsCovered: string[];
    assetsCovered: Asset[];
    timeframesCovered: Timeframe[];
    totalTrades: number;
    averageWinRate: number;
    averageProfitFactor: number;
    averageSharpeRatio: number;
    averageMaxDrawdown: number;
    totalNetProfit: number;
    medianNetProfit: number;
    bestJob: MassiveLabJobResult | null;
    worstJob: MassiveLabJobResult | null;
    dataCoverage: Record<string, { assets: Asset[]; fileCount: number }>;
  };
}

function isSupportedAsset(asset: string): asset is SupportedAsset {
  return DEFAULT_ASSETS.includes(asset as SupportedAsset);
}

function detectWorkers(maxWorkers?: number): number {
  const cpuCount = Math.max(1, os.cpus().length || 1);
  const suggested = cpuCount;

  if (!maxWorkers || maxWorkers <= 0) {
    return suggested;
  }

  return Math.max(1, maxWorkers);
}

function buildDatasetUsage(files: HistoricalDatasetFile[]): ResearchDatasetUsage {
  const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);

  return {
    totalFiles: files.length,
    totalSizeBytes,
    files: files.map((file) => ({
      name: file.name,
      path: file.path,
      asset: file.asset,
      year: file.year,
      month: file.month,
      size: file.size,
    })),
  };
}

function calculateCpuSnapshot(
  startedAt: number,
  workersUsed: number,
  cpuUsageStart: NodeJS.CpuUsage
): ResearchCpuSnapshot {
  const cpuUsageEnd = process.cpuUsage(cpuUsageStart);
  const processUserCpuMs = cpuUsageEnd.user / 1000;
  const processSystemCpuMs = cpuUsageEnd.system / 1000;
  const processTotalCpuMs = processUserCpuMs + processSystemCpuMs;
  const elapsedMs = Math.max(1, Date.now() - startedAt);
  const cpuCores = Math.max(1, os.cpus().length || 1);
  const estimatedProcessCpuLoadPercent = (processTotalCpuMs / (elapsedMs * cpuCores)) * 100;

  return {
    cpuCores,
    workersUsed,
    processUserCpuMs,
    processSystemCpuMs,
    processTotalCpuMs,
    estimatedProcessCpuLoadPercent,
  };
}

function normalizeConfigMap(source: unknown): Record<string, number | boolean | string | null> {
  if (!source || typeof source !== 'object') {
    return {};
  }

  const normalized: Record<string, number | boolean | string | null> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string' || value === null) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function buildRunParameters(config: MassiveLabConfig): ResearchRunParameters {
  return {
    includeMonteCarlo: config.includeMonteCarlo !== false,
    includeWalkForward: config.includeWalkForward !== false,
    monteCarloConfig: normalizeConfigMap(config.monteCarloConfig),
    walkForwardConfig: normalizeConfigMap(config.walkForwardConfig),
  };
}

function safeParseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseDateToken(dateToken: string, timeToken: string): number {
  if (/^\d{8}$/.test(dateToken) && /^\d{6}$/.test(timeToken)) {
    const year = Number(dateToken.substring(0, 4));
    const month = Number(dateToken.substring(4, 6)) - 1;
    const day = Number(dateToken.substring(6, 8));
    const hour = Number(timeToken.substring(0, 2));
    const minute = Number(timeToken.substring(2, 4));
    const second = Number(timeToken.substring(4, 6));
    return Date.UTC(year, month, day, hour, minute, second);
  }

  const normalizedDate = dateToken.replace(/\./g, '-');
  const isoLike = `${normalizedDate}T${timeToken}Z`;
  const timestamp = Date.parse(isoLike);
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

function parseRawLine(line: string): RawCandle | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/^[A-Za-z]/.test(trimmed)) {
    return null;
  }

  if (trimmed.includes(';')) {
    const parts = trimmed.split(';');
    if (parts.length < 6) return null;

    const [dateToken, timeToken] = parts[0].trim().split(' ');
    if (!dateToken || !timeToken) return null;

    const timestamp = parseDateToken(dateToken, timeToken);
    const open = safeParseNumber(parts[1]);
    const high = safeParseNumber(parts[2]);
    const low = safeParseNumber(parts[3]);
    const close = safeParseNumber(parts[4]);
    const volume = safeParseNumber(parts[5]);

    if (!Number.isFinite(timestamp) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close) || !Number.isFinite(volume)) {
      return null;
    }

    return { timestamp, open, high, low, close, volume };
  }

  const parts = trimmed.split(',');
  if (parts.length < 6) return null;

  let dateToken = '';
  let timeToken = '';
  let openIndex = 1;

  if (parts.length >= 7) {
    dateToken = parts[0].trim();
    timeToken = parts[1].trim();
    openIndex = 2;
  } else {
    const dateTimeParts = parts[0].trim().split(' ');
    if (dateTimeParts.length !== 2) return null;
    dateToken = dateTimeParts[0].trim();
    timeToken = dateTimeParts[1].trim();
    openIndex = 1;
  }

  const timestamp = parseDateToken(dateToken, timeToken);
  const open = safeParseNumber(parts[openIndex]);
  const high = safeParseNumber(parts[openIndex + 1]);
  const low = safeParseNumber(parts[openIndex + 2]);
  const close = safeParseNumber(parts[openIndex + 3]);
  const volume = safeParseNumber(parts[openIndex + 4]);

  if (!Number.isFinite(timestamp) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close) || !Number.isFinite(volume)) {
    return null;
  }

  return { timestamp, open, high, low, close, volume };
}

function readRawCandlesFromFile(filePath: string): RawCandle[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const candles: RawCandle[] = [];

  for (const line of lines) {
    const parsed = parseRawLine(line);
    if (parsed) candles.push(parsed);
  }

  return candles;
}

function dedupeAndSortRawCandles(candles: RawCandle[]): RawCandle[] {
  const byTimestamp = new Map<number, RawCandle>();
  for (const candle of candles) {
    byTimestamp.set(candle.timestamp, candle);
  }

  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
}

function bucketizeCandles(rawCandles: RawCandle[], timeframe: Timeframe, asset: Asset): Candle[] {
  const bucketMs = TIMEFRAME_TO_MS[timeframe];
  const buckets = new Map<number, RawCandle[]>();

  for (const candle of rawCandles) {
    const bucketStart = Math.floor(candle.timestamp / bucketMs) * bucketMs;
    const bucket = buckets.get(bucketStart) || [];
    bucket.push(candle);
    buckets.set(bucketStart, bucket);
  }

  const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  return sortedBuckets.map(([bucketStart, bucketCandles]) => {
    const sorted = bucketCandles.sort((a, b) => a.timestamp - b.timestamp);
    return {
      timestamp: bucketStart,
      open: sorted[0].open,
      high: Math.max(...sorted.map((c) => c.high)),
      low: Math.min(...sorted.map((c) => c.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((acc, c) => acc + c.volume, 0),
      asset,
      timeframe,
      complete: true,
    };
  });
}

export function discoverHistoricalDatasetInventory(): MassiveLabDatasetInventory {
  const searchDirs = [
    path.join(process.cwd(), 'data', 'market-history'),
    path.join(process.cwd(), 'public', 'datasets'),
  ];

  const files: HistoricalDatasetFile[] = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const match = entry.match(DATASET_FILENAME_REGEX);
      if (!match) continue;

      const [, assetRaw, sourceTimeframe, dateToken] = match;
      if (!isSupportedAsset(assetRaw)) continue;

      const year = dateToken.substring(0, 4);
      const month = dateToken.length === 6 ? dateToken.substring(4, 6) : 'all';

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      files.push({
        name: entry,
        path: fullPath,
        asset: assetRaw,
        sourceTimeframe,
        year,
        month,
        size: stat.size,
      });
    }
  }

  const uniqueByName = new Map<string, HistoricalDatasetFile>();
  for (const file of files) {
    if (!uniqueByName.has(file.name)) {
      uniqueByName.set(file.name, file);
    }
  }

  const uniqueFiles = Array.from(uniqueByName.values()).sort((a, b) => a.name.localeCompare(b.name));
  const availableYears = Array.from(new Set(uniqueFiles.map((f) => f.year))).sort();
  const availableAssets = Array.from(new Set(uniqueFiles.map((f) => f.asset))).sort() as Asset[];

  return {
    files: uniqueFiles,
    availableYears,
    availableAssets,
    cpuCores: Math.max(1, os.cpus().length || 1),
    suggestedWorkers: detectWorkers(),
  };
}

function buildWalkForwardDefaults(totalCandles: number): WalkForwardConfig {
  return {
    totalDataPoints: totalCandles,
    trainSize: 60,
    testSize: 20,
    walkSize: 20,
    minRequiredData: Math.max(50, Math.floor(totalCandles * 0.1)),
  };
}

function buildMonteCarloDefaults(totalCandles: number): MonteCarloConfig {
  return {
    iterations: totalCandles > 10000 ? 2000 : 1000,
    confidenceLevel: 0.95,
    preserveSequence: true,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, workers: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  async function workerLoop(): Promise<void> {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= tasks.length) {
        return;
      }

      results[index] = await tasks[index]();
    }
  }

  const actualWorkers = Math.max(1, Math.min(workers, tasks.length || 1));
  await Promise.all(Array.from({ length: actualWorkers }, () => workerLoop()));
  return results;
}

export async function runMassiveBacktestingLab(config: MassiveLabConfig): Promise<MassiveLabRunResult> {
  const startedAt = Date.now();
  const cpuUsageStart = process.cpuUsage();
  const inventory = discoverHistoricalDatasetInventory();

  if (inventory.files.length === 0) {
    throw new Error('No se encontraron datasets historicos para ejecutar el laboratorio masivo.');
  }

  const selectedYears = config.years && config.years.length > 0
    ? config.years.filter((year) => inventory.availableYears.includes(year))
    : inventory.availableYears;

  if (selectedYears.length === 0) {
    throw new Error('No hay anios disponibles para ejecutar con los filtros actuales.');
  }

  const selectedAssets = config.assets && config.assets.length > 0
    ? config.assets.filter((asset) => inventory.availableAssets.includes(asset))
    : inventory.availableAssets;

  if (selectedAssets.length === 0) {
    throw new Error('No hay activos disponibles para ejecutar con los filtros actuales.');
  }

  const selectedTimeframes = config.timeframes && config.timeframes.length > 0
    ? config.timeframes
    : DEFAULT_TIMEFRAMES;
  const engineVersionInfo = detectEngineVersionInfo(config.engineVersion);
  const engineVersion = engineVersionInfo.versionLabel;

  const workers = detectWorkers(config.maxWorkers ?? inventory.suggestedWorkers);

  const selectedFiles = inventory.files.filter(
    (file) => selectedYears.includes(file.year) && selectedAssets.includes(file.asset)
  );
  const datasetUsed = buildDatasetUsage(selectedFiles);

  const rawCache = new Map<string, RawCandle[]>();

  function getRawByYearAndAsset(year: string, asset: Asset): RawCandle[] {
    const cacheKey = `${year}_${asset}`;
    if (rawCache.has(cacheKey)) {
      return rawCache.get(cacheKey)!;
    }

    const files = inventory.files.filter((file) => file.year === year && file.asset === asset);
    const merged: RawCandle[] = [];

    for (const file of files) {
      const raw = readRawCandlesFromFile(file.path);
      merged.push(...raw);
    }

    const prepared = dedupeAndSortRawCandles(merged);
    rawCache.set(cacheKey, prepared);
    return prepared;
  }

  const jobs: MassiveLabJob[] = [];

  for (const year of selectedYears) {
    for (const asset of selectedAssets) {
      const rawYearAsset = getRawByYearAndAsset(year, asset);
      if (rawYearAsset.length === 0) continue;

      for (const timeframe of selectedTimeframes) {
        const candles = bucketizeCandles(rawYearAsset, timeframe, asset);
        if (candles.length < 150) continue;

        jobs.push({
          id: `${year}_${asset}_${timeframe}`,
          year,
          asset,
          timeframe,
          candleCount: candles.length,
        });
      }
    }
  }

  if (jobs.length === 0) {
    throw new Error('No se pudieron construir jobs validos (minimo 150 velas por job).');
  }

  const jobTasks = jobs.map((job) => async (): Promise<MassiveLabJobResult> => {
    const runStart = Date.now();

    try {
      const rawCandles = getRawByYearAndAsset(job.year, job.asset);
      const candles = bucketizeCandles(rawCandles, job.timeframe, job.asset);

      const backtestConfig: BacktestConfig = {
        id: `massive-${job.id}-${Date.now()}`,
        asset: job.asset,
        timeframe: job.timeframe,
        startDate: candles[0].timestamp,
        endDate: candles[candles.length - 1].timestamp,
        initialBalance: config.initialBalance,
        riskPerTrade: config.riskPerTrade,
        maxDrawdown: config.maxDrawdown,
        minWinRate: config.minWinRate,
        consensusThreshold: config.consensusThreshold,
        includeSlippage: true,
        slippagePoints: job.asset === 'BTCUSD' ? 20 : job.asset === 'XAUUSD' ? 8 : 3,
        status: 'pending',
        createdAt: Date.now(),
      };

      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.run(candles);

      let monteCarlo: MonteCarloAnalysis | undefined;
      if (config.includeMonteCarlo !== false) {
        const monteConfig = {
          ...buildMonteCarloDefaults(candles.length),
          ...config.monteCarloConfig,
        };
        monteCarlo = runMonteCarloAnalysis(result.trades, config.initialBalance, monteConfig);
      }

      let walkForward: WalkForwardAnalysis | undefined;
      let overfitting: ReturnType<typeof detectOverfitting> | undefined;
      if (config.includeWalkForward !== false) {
        const walkConfig = {
          ...buildWalkForwardDefaults(candles.length),
          ...config.walkForwardConfig,
        };
        walkForward = await runWalkForwardAnalysis(candles, backtestConfig, walkConfig);
        overfitting = detectOverfitting(walkForward);
      }

      return {
        job,
        status: 'completed',
        result,
        monteCarlo,
        walkForward,
        overfitting,
        durationMs: Date.now() - runStart,
      };
    } catch (error) {
      return {
        job,
        status: 'failed',
        durationMs: Date.now() - runStart,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  });

  const jobResults = await runWithConcurrency(jobTasks, workers);

  const completed = jobResults.filter((job) => job.status === 'completed' && job.result);
  const failed = jobResults.filter((job) => job.status === 'failed');

  const metrics = completed.map((job) => job.result!.metrics);
  const totalTrades = metrics.reduce((sum, m) => sum + m.totalTrades, 0);
  const totalNetProfit = metrics.reduce((sum, m) => sum + m.netProfit, 0);
  const avg = (selector: (m: (typeof metrics)[number]) => number): number => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + selector(m), 0) / metrics.length;
  };

  const bestJob = completed.length > 0
    ? completed.reduce((best, current) => {
        const currentSharpe = current.result!.metrics.sharpeRatio;
        const bestSharpe = best.result!.metrics.sharpeRatio;
        return currentSharpe > bestSharpe ? current : best;
      })
    : null;

  const worstJob = completed.length > 0
    ? completed.reduce((worst, current) => {
        const currentSharpe = current.result!.metrics.sharpeRatio;
        const worstSharpe = worst.result!.metrics.sharpeRatio;
        return currentSharpe < worstSharpe ? current : worst;
      })
    : null;

  const dataCoverage: Record<string, { assets: Asset[]; fileCount: number }> = {};
  for (const year of selectedYears) {
    const yearFiles = inventory.files.filter((f) => f.year === year && selectedAssets.includes(f.asset));
    dataCoverage[year] = {
      assets: Array.from(new Set(yearFiles.map((f) => f.asset))).sort() as Asset[],
      fileCount: yearFiles.length,
    };
  }

  const completedAt = Date.now();
  const cpu = calculateCpuSnapshot(startedAt, workers, cpuUsageStart);

  const runResultBase: Omit<
    MassiveLabRunResult,
    | 'persistedRunPath'
    | 'versionComparisonPath'
    | 'candidateValidationPath'
    | 'engineSelectionPath'
    | 'localAiManifestPath'
    | 'trainingDatasetPath'
    | 'exports'
  > = {
    runId: `massive_lab_${startedAt}`,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    workersUsed: workers,
    engineVersion,
    engineVersionHash: engineVersionInfo.versionHash,
    engineVersionId: engineVersionInfo.versionId,
    cpu,
    datasetUsed,
    inventory,
    config: {
      ...config,
      engineVersion,
      assets: selectedAssets,
      years: selectedYears,
      timeframes: selectedTimeframes,
      maxWorkers: workers,
    },
    jobs: jobResults,
    summary: {
      totalJobs: jobs.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      yearsCovered: selectedYears,
      assetsCovered: selectedAssets,
      timeframesCovered: selectedTimeframes,
      totalTrades,
      averageWinRate: avg((m) => m.winRate),
      averageProfitFactor: avg((m) => m.profitFactor),
      averageSharpeRatio: avg((m) => m.sharpeRatio),
      averageMaxDrawdown: avg((m) => m.maxDrawdown),
      totalNetProfit,
      medianNetProfit: median(metrics.map((m) => m.netProfit)),
      bestJob,
      worstJob,
      dataCoverage,
    },
  };

  const exports = exportResearchRun(runResultBase);
  const trainingDatasetPath = exportTrainingDatasetNdjson(runResultBase);
  const parameters = buildRunParameters(runResultBase.config);

  const researchRecord: ResearchExecutionRecord = {
    metadata: {
      runId: runResultBase.runId,
      executedAt: completedAt,
      engineVersion,
      engineVersionInfo,
      config: runResultBase.config,
      parameters,
      timeframeSet: selectedTimeframes,
      dataset: datasetUsed,
      durationMs: runResultBase.durationMs,
      cpu,
    },
    inventory,
    jobs: jobResults,
    summary: runResultBase.summary,
    exports,
    trainingDatasetPath,
  };

  const persistedRunPath = saveResearchExecutionRecord(researchRecord);
  const versionComparison = compareEngineVersionAgainstHistory(runResultBase.runId, engineVersion);
  const versionComparisonPath = saveEngineHistoricalComparisonReport(versionComparison);
  const candidateValidation = evaluateCandidateEngineVersion(researchRecord);
  const candidateValidationPath = saveCandidateValidationReport(candidateValidation);
  const engineSelection = selectBestEngineVersion(engineVersion);
  const engineSelectionPath = saveEngineSelectionDecision(engineSelection);
  const localAiManifest = buildLocalAiIntegrationManifest(
    researchRecord,
    candidateValidation,
    engineSelection
  );
  const localAiManifestPath = saveLocalAiIntegrationManifest(localAiManifest);

  return {
    ...runResultBase,
    persistedRunPath,
    versionComparisonPath,
    candidateValidationPath,
    engineSelectionPath,
    localAiManifestPath,
    trainingDatasetPath,
    exports,
  };
}
