/**
 * Massive Backtesting Lab
 * Ejecuta backtests por todos los anios historicos disponibles con paralelismo controlado.
 * Diseñado para laboratorio privado admin (sin optimizacion de estrategias).
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import crypto from 'crypto';
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
  '30M': 30 * 60 * 1000,
  '45M': 45 * 60 * 1000,
  '1H': 60 * 60 * 1000,
};

const DATASET_FILENAME_REGEX = /^DAT_ASCII_([A-Z0-9]+)_([A-Z0-9]+)_(\d{4}|\d{6})\.csv$/;
const GENERIC_M1_FILENAME_REGEX = /^([A-Z0-9]+)_([A-Z0-9]+)_(.+)\.csv(?:\.csv)?$/i;

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
  source: 'local-manual' | 'external-api';
  blockedReason?: string;
}

export type GapClassification =
  | 'cierre semanal normal'
  | 'feriado'
  | 'cierre anual'
  | 'mantenimiento o pausa del proveedor'
  | 'mercado cerrado confirmado'
  | 'pérdida de datos'
  | 'archivo truncado'
  | 'periodo sin cobertura'
  | 'desconocido';

export type GapBucket = 'normal' | 'anomalo' | 'desconocido';

export interface GapInventoryEntry {
  previousCandleUtc: string;
  nextCandleUtc: string;
  durationMinutes: number;
  gapMissingMinutes: number;
  dateUtc: string;
  weekdayUtc: string;
  month: number;
  year: number;
  previousPrice: number;
  nextPrice: number;
  priceDelta: number;
  classification: GapClassification;
  bucket: GapBucket;
  notes: string;
}

export interface DatasetSegment {
  startUtc: string;
  endUtc: string;
  candles: number;
  coveragePct: number;
  startReason: string;
  endReason: string;
  apto: boolean;
}

export interface ExcludedSegment {
  startUtc: string;
  endUtc: string;
  durationMinutes: number;
  reason: GapClassification;
}

export interface XauusdMarketCalendar {
  timezone: string;
  weekClose: { dayUtc: number; hour: number; minute: number };
  weekOpen: { dayUtc: number; hour: number; minute: number };
  holidaysUtc: Array<{ startUtc: string; endUtc: string; label: string }>;
  extraordinaryClosuresUtc: Array<{ startUtc: string; endUtc: string; label: string }>;
}

export interface ProviderVerification {
  status: 'confirmado' | 'probable' | 'desconocido';
  provider: string;
  evidence: {
    metadata: boolean;
    format: boolean;
    originalName: boolean;
    downloadDocumentation: boolean;
    checksumOrManifest: boolean;
    sourceStructure: boolean;
  };
}

export interface GapPolicyAction {
  conserve: boolean;
  startNewSession: boolean;
  resetContinuityControls: boolean;
  createArtificialCandles: boolean;
  markNotFitPeriod: boolean;
  blockCrossGapCalculations: boolean;
  resetIndicatorWarmup: boolean;
  blockSignalsUntilReady: boolean;
  recordExclusion: boolean;
}

export interface GapPolicy {
  byClassification: Record<GapClassification, GapPolicyAction>;
}

export interface IndicatorReadinessPolicy {
  requiredIndicators: Array<'EMA20' | 'EMA50' | 'EMA200' | 'ATR' | 'ADX' | 'RSI'>;
  warmupCandlesAfterAnomalousGap: number;
  statusDuringWarmup: 'DATA_NOT_READY';
  blockedSignalWindows: Array<{
    fromUtc: string;
    toUtc: string;
    warmupCandles: number;
    reason: GapClassification;
  }>;
}

export interface DatasetIntegrityMetrics {
  ohlcValidRows: number;
  invalidRows: number;
  timestampsValid: boolean;
  duplicateTimestamps: number;
  nonIncreasingTimestamps: number;
}

export interface DatasetCoverageMetrics {
  expectedOpenMarketMinutes: number;
  availableMinutes: number;
  coveragePct: number;
  normalGapCount: number;
  normalGapMinutes: number;
  anomalousGapCount: number;
  anomalousGapMinutes: number;
  excludedPeriodsCount: number;
  excludedPeriodsMinutes: number;
}

export interface MaxGapAnalysis {
  startUtc: string | null;
  endUtc: string | null;
  durationMinutes: number;
  classification: GapClassification | null;
  coincidesWithMarketClosure: boolean;
  fileOrPartitionChange: boolean;
  missingCompleteHistoricalBlock: boolean;
  timestampErrorLikely: boolean;
  providerInterruptionLikely: boolean;
  datasetJoinIssueLikely: boolean;
  explanation: string;
}

export interface DatasetValidationReport {
  filePath: string;
  format: string;
  provider: string;
  providerVerification: ProviderVerification;
  fileSha256: string;
  fileSizeBytes: number;
  firstUtc: string | null;
  lastUtc: string | null;
  totalCandles: number;
  totalDays: number;
  totalMonths: number;
  totalYears: number;
  symbols: string[];
  timezone: string;
  duplicateTimestamps: number;
  nonIncreasingTimestamps: number;
  invalidRows: number;
  largeGapsOver1h: number;
  maxGapMinutes: number;
  usablePct: number;
  integrity: DatasetIntegrityMetrics;
  coverage: DatasetCoverageMetrics;
  calendar: XauusdMarketCalendar;
  gapsOver1h: GapInventoryEntry[];
  maxGapAnalysis: MaxGapAnalysis;
  segments: DatasetSegment[];
  excludedSegments: ExcludedSegment[];
  gapPolicy: GapPolicy;
  indicatorReadiness: IndicatorReadinessPolicy;
  quality: 'excellent' | 'good' | 'warning' | 'critical';
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
  if (parts.length < 5) return null;

  // Epoch-millisecond OHLC format: timestamp,open,high,low,close
  if (parts.length >= 5 && /^\d{13}$/.test(parts[0].trim())) {
    const timestamp = Number(parts[0].trim());
    const open = safeParseNumber(parts[1]);
    const high = safeParseNumber(parts[2]);
    const low = safeParseNumber(parts[3]);
    const close = safeParseNumber(parts[4]);
    const volume = parts.length >= 6 ? safeParseNumber(parts[5]) : 0;

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      !Number.isFinite(volume)
    ) {
      return null;
    }

    return { timestamp, open, high, low, close, volume };
  }

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

function inferProvider(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('dukascopy')) return 'Dukascopy';
  if (normalized.includes('histdata')) return 'HistData';
  return 'unknown';
}

function resolveXauusdCalendar(): XauusdMarketCalendar {
  const defaultCalendar: XauusdMarketCalendar = {
    timezone: 'UTC',
    weekClose: { dayUtc: 5, hour: 22, minute: 0 },
    weekOpen: { dayUtc: 0, hour: 22, minute: 0 },
    holidaysUtc: [],
    extraordinaryClosuresUtc: [],
  };

  const raw = process.env.CARVIPIX_XAUUSD_CALENDAR_JSON;
  if (!raw) return defaultCalendar;

  try {
    const parsed = JSON.parse(raw) as Partial<XauusdMarketCalendar>;
    return {
      timezone: parsed.timezone || defaultCalendar.timezone,
      weekClose: parsed.weekClose || defaultCalendar.weekClose,
      weekOpen: parsed.weekOpen || defaultCalendar.weekOpen,
      holidaysUtc: Array.isArray(parsed.holidaysUtc) ? parsed.holidaysUtc : defaultCalendar.holidaysUtc,
      extraordinaryClosuresUtc: Array.isArray(parsed.extraordinaryClosuresUtc)
        ? parsed.extraordinaryClosuresUtc
        : defaultCalendar.extraordinaryClosuresUtc,
    };
  } catch {
    return defaultCalendar;
  }
}

function weekdayLabelUtc(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

function isInRange(ts: number, startUtc: string, endUtc: string): boolean {
  const start = Date.parse(startUtc);
  const end = Date.parse(endUtc);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return ts >= start && ts <= end;
}

function minutesSinceWeekStart(ts: number): number {
  const d = new Date(ts);
  const day = d.getUTCDay();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  return day * 1440 + hour * 60 + minute;
}

function isMarketClosedAt(ts: number, calendar: XauusdMarketCalendar): boolean {
  if (
    calendar.holidaysUtc.some((h) => isInRange(ts, h.startUtc, h.endUtc)) ||
    calendar.extraordinaryClosuresUtc.some((h) => isInRange(ts, h.startUtc, h.endUtc))
  ) {
    return true;
  }

  const closeMin = calendar.weekClose.dayUtc * 1440 + calendar.weekClose.hour * 60 + calendar.weekClose.minute;
  const openMin = calendar.weekOpen.dayUtc * 1440 + calendar.weekOpen.hour * 60 + calendar.weekOpen.minute;
  const current = minutesSinceWeekStart(ts);

  if (closeMin <= openMin) {
    return current >= closeMin && current < openMin;
  }

  return current >= closeMin || current < openMin;
}

function countExpectedMarketMinutes(startTs: number, endTs: number, calendar: XauusdMarketCalendar): number {
  if (endTs <= startTs) return 0;
  let expected = 0;
  for (let ts = startTs; ts <= endTs; ts += 60000) {
    if (!isMarketClosedAt(ts, calendar)) expected += 1;
  }
  return expected;
}

function countExpectedOpenMinutesWithBaseline(startTs: number, endTs: number, calendar: XauusdMarketCalendar): number {
  if (endTs < startTs) return 0;
  const observedSpanMinutes = Math.floor((endTs - startTs) / 60000) + 1;
  const calendarOpenMinutes = countExpectedMarketMinutes(startTs, endTs, calendar);
  return Math.max(observedSpanMinutes, calendarOpenMinutes);
}

function classifyGap(
  previousTs: number,
  nextTs: number,
  gapMinutes: number,
  calendar: XauusdMarketCalendar,
  isNearStart: boolean,
  isNearEnd: boolean
): { classification: GapClassification; bucket: GapBucket; notes: string } {
  const prevDate = new Date(previousTs);
  const nextDate = new Date(nextTs);

  const crossesYear = prevDate.getUTCFullYear() !== nextDate.getUTCFullYear();
  if (crossesYear && gapMinutes >= 8 * 60) {
    return {
      classification: 'cierre anual',
      bucket: 'normal',
      notes: 'Gap cruza cierre/reapertura anual.',
    };
  }

  const holidayMatch = calendar.holidaysUtc.find(
    (h) => previousTs < Date.parse(h.endUtc) && nextTs > Date.parse(h.startUtc)
  );
  if (holidayMatch) {
    return {
      classification: 'feriado',
      bucket: 'normal',
      notes: `Gap coincide con feriado configurado: ${holidayMatch.label}.`,
    };
  }

  const extraClosure = calendar.extraordinaryClosuresUtc.find(
    (h) => previousTs < Date.parse(h.endUtc) && nextTs > Date.parse(h.startUtc)
  );
  if (extraClosure) {
    return {
      classification: 'mercado cerrado confirmado',
      bucket: 'normal',
      notes: `Gap coincide con cierre extraordinario configurado: ${extraClosure.label}.`,
    };
  }

  const previousClosed = isMarketClosedAt(previousTs + 60000, calendar);
  const nextClosed = isMarketClosedAt(nextTs - 60000, calendar);
  if (gapMinutes >= 46 * 60 && gapMinutes <= 55 * 60 && previousClosed && nextClosed) {
    return {
      classification: 'cierre semanal normal',
      bucket: 'normal',
      notes: 'Gap compatible con cierre semanal del mercado OTC.',
    };
  }

  if (gapMinutes > 60 && gapMinutes <= 180 && previousClosed && nextClosed) {
    return {
      classification: 'mantenimiento o pausa del proveedor',
      bucket: 'normal',
      notes: 'Gap corto compatible con ventana de mantenimiento/pausa.',
    };
  }

  if (gapMinutes >= 30 * 24 * 60) {
    return {
      classification: 'periodo sin cobertura',
      bucket: 'anomalo',
      notes: 'Gap extenso no compatible con cierres regulares.',
    };
  }

  if ((isNearStart || isNearEnd) && gapMinutes >= 12 * 60) {
    return {
      classification: 'archivo truncado',
      bucket: 'anomalo',
      notes: 'Gap cerca de borde de dataset, posible truncamiento.',
    };
  }

  if (gapMinutes > 180) {
    return {
      classification: 'pérdida de datos',
      bucket: 'anomalo',
      notes: 'Gap fuera de ventana normal de mercado/mantenimiento.',
    };
  }

  return {
    classification: 'desconocido',
    bucket: 'desconocido',
    notes: 'Gap requiere investigación manual adicional.',
  };
}

function buildProviderVerification(filePath: string): ProviderVerification {
  const provider = inferProvider(filePath);
  const folder = path.dirname(filePath);
  const base = path.basename(filePath);
  const normalizedBase = base.toLowerCase();

  const candidates = [
    `${filePath}.sha256`,
    `${filePath}.md5`,
    path.join(folder, `${base}.sha256`),
    path.join(folder, 'manifest.json'),
    path.join(folder, 'MANIFEST.json'),
    path.join(folder, 'README.md'),
  ];

  const hasChecksumOrManifest = candidates.some((c) => fs.existsSync(c));
  const hasDownloadDoc = fs.existsSync(path.join(folder, 'README.md')) || fs.existsSync(path.join(folder, 'download.txt'));
  const hasProviderName = normalizedBase.includes('dukascopy') || normalizedBase.includes('histdata');
  const hasKnownFolder = folder.toLowerCase().includes('dukascopy') || folder.toLowerCase().includes('histdata');

  const evidence = {
    metadata: hasChecksumOrManifest,
    format: true,
    originalName: hasProviderName,
    downloadDocumentation: hasDownloadDoc,
    checksumOrManifest: hasChecksumOrManifest,
    sourceStructure: hasKnownFolder,
  };

  const strongSignals = [
    evidence.metadata,
    evidence.originalName,
    evidence.downloadDocumentation,
    evidence.checksumOrManifest,
    evidence.sourceStructure,
  ].filter(Boolean).length;

  if (strongSignals >= 3 && provider !== 'unknown') {
    return { status: 'confirmado', provider, evidence };
  }
  if (strongSignals >= 1 && provider !== 'unknown') {
    return { status: 'probable', provider, evidence };
  }
  return { status: 'desconocido', provider: provider === 'unknown' ? 'unknown' : provider, evidence };
}

async function computeSha256(filePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', (error) => reject(error));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function buildGapPolicy(): GapPolicy {
  const normalAction: GapPolicyAction = {
    conserve: true,
    startNewSession: true,
    resetContinuityControls: true,
    createArtificialCandles: false,
    markNotFitPeriod: false,
    blockCrossGapCalculations: false,
    resetIndicatorWarmup: false,
    blockSignalsUntilReady: false,
    recordExclusion: false,
  };

  const anomalousAction: GapPolicyAction = {
    conserve: true,
    startNewSession: true,
    resetContinuityControls: true,
    createArtificialCandles: false,
    markNotFitPeriod: true,
    blockCrossGapCalculations: true,
    resetIndicatorWarmup: true,
    blockSignalsUntilReady: true,
    recordExclusion: true,
  };

  const unknownAction: GapPolicyAction = {
    ...anomalousAction,
    markNotFitPeriod: true,
  };

  return {
    byClassification: {
      'cierre semanal normal': normalAction,
      feriado: normalAction,
      'cierre anual': normalAction,
      'mantenimiento o pausa del proveedor': normalAction,
      'mercado cerrado confirmado': normalAction,
      'pérdida de datos': anomalousAction,
      'archivo truncado': anomalousAction,
      'periodo sin cobertura': anomalousAction,
      desconocido: unknownAction,
    },
  };
}

function parseDatasetMetadata(filePath: string): HistoricalDatasetFile | null {
  const name = path.basename(filePath);
  const stat = fs.statSync(filePath);

  const strict = name.match(DATASET_FILENAME_REGEX);
  if (strict) {
    const [, assetRaw, sourceTimeframe, dateToken] = strict;
    if (!isSupportedAsset(assetRaw)) return null;
    const year = dateToken.substring(0, 4);
    const month = dateToken.length === 6 ? dateToken.substring(4, 6) : 'all';
    return {
      name,
      path: filePath,
      asset: assetRaw,
      sourceTimeframe,
      year,
      month,
      size: stat.size,
    };
  }

  const generic = name.match(GENERIC_M1_FILENAME_REGEX);
  if (!generic) return null;

  const assetRaw = generic[1].toUpperCase();
  const timeframeRaw = generic[2].toUpperCase();
  if (!isSupportedAsset(assetRaw)) return null;

  const yearMatch = name.match(/(19|20)\d{2}/);
  const year = yearMatch ? yearMatch[0] : 'all';

  return {
    name,
    path: filePath,
    asset: assetRaw,
    sourceTimeframe: timeframeRaw,
    year,
    month: 'all',
    size: stat.size,
  };
}

function resolveMasterDatasetPath(): string | null {
  const allowLocal = (process.env.CARVIPIX_ENABLE_LOCAL_DATASETS || '').trim().toLowerCase() === 'true';
  if (!allowLocal) {
    return null;
  }

  const envPath = process.env.CARVIPIX_MASTER_DATASET_PATH?.trim();
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  return null;
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
  const allowLocal = (process.env.CARVIPIX_ENABLE_LOCAL_DATASETS || '').trim().toLowerCase() === 'true';
  if (!allowLocal) {
    return {
      files: [],
      availableYears: [],
      availableAssets: [],
      cpuCores: Math.max(1, os.cpus().length || 1),
      suggestedWorkers: detectWorkers(),
      source: 'external-api',
      blockedReason: 'BLOCKED_BY_EXTERNAL_DEPENDENCY: MARKET_DATA_PROVIDER',
    };
  }

  const masterDatasetPath = resolveMasterDatasetPath();
  if (masterDatasetPath) {
    const metadata = parseDatasetMetadata(masterDatasetPath);
    if (metadata) {
      return {
        files: [metadata],
        availableYears: [metadata.year],
        availableAssets: [metadata.asset],
        cpuCores: Math.max(1, os.cpus().length || 1),
        suggestedWorkers: detectWorkers(),
        source: 'local-manual',
      };
    }
  }

  const searchDirs = [path.join(process.cwd(), 'data', 'market-history'), path.join(process.cwd(), 'public', 'datasets')];

  const files: HistoricalDatasetFile[] = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const metadata = parseDatasetMetadata(fullPath);
      if (metadata) files.push(metadata);
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
    source: 'local-manual',
  };
}

export async function validateDatasetFile(filePath: string): Promise<DatasetValidationReport> {
  const allowLocal = (process.env.CARVIPIX_ENABLE_LOCAL_DATASETS || '').trim().toLowerCase() === 'true';
  if (!allowLocal) {
    throw new Error('MARKET_DATA_PROVIDER_NOT_CONFIGURED');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset no encontrado: ${filePath}`);
  }

  const calendar = resolveXauusdCalendar();
  const gapPolicy = buildGapPolicy();
  const stat = fs.statSync(filePath);
  const fileSha256 = await computeSha256(filePath);
  const providerVerification = buildProviderVerification(filePath);
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let totalCandles = 0;
  let invalidRows = 0;
  let duplicateTimestamps = 0;
  let nonIncreasingTimestamps = 0;
  let largeGapsOver1h = 0;
  let maxGapMinutes = 0;
  let firstTs: number | null = null;
  let lastTs: number | null = null;
  let prevTs: number | null = null;
  let prevClose: number | null = null;
  let lineNumber = 0;
  let firstDataLine = 0;
  const gapsOver1h: GapInventoryEntry[] = [];
  const excludedSegments: ExcludedSegment[] = [];

  let currentSegmentStart: number | null = null;
  let currentSegmentStartReason = 'inicio_dataset';
  let currentSegmentCandles = 0;
  const segments: DatasetSegment[] = [];

  const seen = new Set<number>();

  for await (const line of rl) {
    lineNumber += 1;
    const parsed = parseRawLine(line);
    if (!parsed) {
      if (lineNumber > 1 && line.trim()) invalidRows += 1;
      continue;
    }

    totalCandles += 1;
    if (firstDataLine === 0) firstDataLine = lineNumber;

    if (firstTs === null) firstTs = parsed.timestamp;
    lastTs = parsed.timestamp;

    if (currentSegmentStart === null) {
      currentSegmentStart = parsed.timestamp;
      currentSegmentCandles = 1;
      currentSegmentStartReason = 'inicio_dataset';
    } else {
      currentSegmentCandles += 1;
    }

    if (seen.has(parsed.timestamp)) duplicateTimestamps += 1;
    seen.add(parsed.timestamp);

    if (prevTs !== null) {
      if (parsed.timestamp <= prevTs) nonIncreasingTimestamps += 1;
      const gapMin = Math.floor((parsed.timestamp - prevTs) / 60000);
      if (gapMin > maxGapMinutes) maxGapMinutes = gapMin;

      if (gapMin > 60) {
        largeGapsOver1h += 1;
        const classification = classifyGap(
          prevTs,
          parsed.timestamp,
          gapMin,
          calendar,
          lineNumber - firstDataLine <= 5,
          false
        );

        const prevDate = new Date(prevTs);
        gapsOver1h.push({
          previousCandleUtc: prevDate.toISOString(),
          nextCandleUtc: new Date(parsed.timestamp).toISOString(),
          durationMinutes: gapMin,
          gapMissingMinutes: Math.max(0, gapMin - 1),
          dateUtc: prevDate.toISOString().slice(0, 10),
          weekdayUtc: weekdayLabelUtc(prevTs),
          month: prevDate.getUTCMonth() + 1,
          year: prevDate.getUTCFullYear(),
          previousPrice: prevClose ?? parsed.close,
          nextPrice: parsed.close,
          priceDelta: Number((parsed.close - (prevClose ?? parsed.close)).toFixed(6)),
          classification: classification.classification,
          bucket: classification.bucket,
          notes: classification.notes,
        });

        if (classification.bucket !== 'normal') {
          const segmentEnd = prevTs;
          const segmentExpected = countExpectedOpenMinutesWithBaseline(currentSegmentStart!, segmentEnd, calendar);
          segments.push({
            startUtc: new Date(currentSegmentStart!).toISOString(),
            endUtc: new Date(segmentEnd).toISOString(),
            candles: currentSegmentCandles - 1,
            coveragePct:
              segmentExpected > 0
                ? Number((((currentSegmentCandles - 1) / segmentExpected) * 100).toFixed(6))
                : 100,
            startReason: currentSegmentStartReason,
            endReason: `gap_anomalo:${classification.classification}`,
            apto: true,
          });

          excludedSegments.push({
            startUtc: new Date(prevTs + 60000).toISOString(),
            endUtc: new Date(parsed.timestamp - 60000).toISOString(),
            durationMinutes: Math.max(0, gapMin - 1),
            reason: classification.classification,
          });

          currentSegmentStart = parsed.timestamp;
          currentSegmentCandles = 1;
          currentSegmentStartReason = `post_gap:${classification.classification}`;
        }
      }
    }
    prevTs = parsed.timestamp;
    prevClose = parsed.close;
  }

  if (currentSegmentStart !== null && prevTs !== null && currentSegmentCandles > 0) {
    const segmentExpected = countExpectedOpenMinutesWithBaseline(currentSegmentStart, prevTs, calendar);
    segments.push({
      startUtc: new Date(currentSegmentStart).toISOString(),
      endUtc: new Date(prevTs).toISOString(),
      candles: currentSegmentCandles,
      coveragePct: segmentExpected > 0 ? Number(((currentSegmentCandles / segmentExpected) * 100).toFixed(6)) : 100,
      startReason: currentSegmentStartReason,
      endReason: 'fin_dataset',
      apto: true,
    });
  }

  const firstDate = firstTs !== null ? new Date(firstTs) : null;
  const lastDate = lastTs !== null ? new Date(lastTs) : null;
  const totalDays = firstDate && lastDate ? Number(((lastDate.getTime() - firstDate.getTime()) / 86400000).toFixed(2)) : 0;
  const totalMonths = Number((totalDays / 30.436875).toFixed(2));
  const totalYears = Number((totalDays / 365.2425).toFixed(2));
  const usablePct = totalCandles > 0 ? Number((((totalCandles - invalidRows) / totalCandles) * 100).toFixed(6)) : 0;

  const expectedOpenMarketMinutes = firstTs !== null && lastTs !== null
    ? countExpectedOpenMinutesWithBaseline(firstTs, lastTs, calendar)
    : 0;

  const coveragePct = expectedOpenMarketMinutes > 0
    ? Number(((totalCandles / expectedOpenMarketMinutes) * 100).toFixed(6))
    : 0;

  const normalGaps = gapsOver1h.filter((g) => g.bucket === 'normal');
  const anomalousGaps = gapsOver1h.filter((g) => g.bucket === 'anomalo');
  const unknownGaps = gapsOver1h.filter((g) => g.bucket === 'desconocido');

  const maxGap = gapsOver1h.reduce<GapInventoryEntry | null>((acc, gap) => {
    if (!acc || gap.durationMinutes > acc.durationMinutes) return gap;
    return acc;
  }, null);

  const indicatorWarmupCandles = 200;
  const blockedSignalWindows = gapsOver1h
    .filter((gap) => gap.bucket !== 'normal')
    .map((gap) => {
      const fromTs = Date.parse(gap.nextCandleUtc);
      const toTs = fromTs + indicatorWarmupCandles * 60000;
      return {
        fromUtc: new Date(fromTs).toISOString(),
        toUtc: new Date(toTs).toISOString(),
        warmupCandles: indicatorWarmupCandles,
        reason: gap.classification,
      };
    });

  const blockedByUnknown = new Set(
    gapsOver1h.filter((gap) => gap.bucket === 'desconocido').map((gap) => gap.nextCandleUtc)
  );
  const adjustedSegments = segments.map((segment) => ({
    ...segment,
    apto: segment.candles >= indicatorWarmupCandles && !blockedByUnknown.has(segment.startUtc),
  }));

  let quality: DatasetValidationReport['quality'] = 'excellent';
  if (invalidRows > 0 || duplicateTimestamps > 0 || nonIncreasingTimestamps > 0) quality = 'warning';
  if (anomalousGaps.length > 0 || unknownGaps.length > 0 || coveragePct < 95) quality = 'critical';
  else if (normalGaps.length > 0 || maxGapMinutes > 180) quality = 'good';

  const maxGapAnalysis: MaxGapAnalysis = maxGap
    ? {
        startUtc: maxGap.previousCandleUtc,
        endUtc: maxGap.nextCandleUtc,
        durationMinutes: maxGap.durationMinutes,
        classification: maxGap.classification,
        coincidesWithMarketClosure: maxGap.bucket === 'normal',
        fileOrPartitionChange: false,
        missingCompleteHistoricalBlock:
          maxGap.classification === 'periodo sin cobertura' || maxGap.classification === 'pérdida de datos',
        timestampErrorLikely: nonIncreasingTimestamps > 0,
        providerInterruptionLikely: maxGap.classification === 'mantenimiento o pausa del proveedor',
        datasetJoinIssueLikely: false,
        explanation:
          maxGap.classification === 'periodo sin cobertura'
            ? 'Hueco maximo clasificado como periodo sin cobertura: falta un bloque historico continuo.'
            : `Hueco maximo clasificado como ${maxGap.classification}.`,
      }
    : {
        startUtc: null,
        endUtc: null,
        durationMinutes: 0,
        classification: null,
        coincidesWithMarketClosure: false,
        fileOrPartitionChange: false,
        missingCompleteHistoricalBlock: false,
        timestampErrorLikely: false,
        providerInterruptionLikely: false,
        datasetJoinIssueLikely: false,
        explanation: 'Sin huecos mayores a una hora.',
      };

  return {
    filePath,
    format: 'CSV OHLC (timestamp epoch ms)',
    provider: providerVerification.provider,
    providerVerification,
    fileSha256,
    fileSizeBytes: stat.size,
    firstUtc: firstDate ? firstDate.toISOString() : null,
    lastUtc: lastDate ? lastDate.toISOString() : null,
    totalCandles,
    totalDays,
    totalMonths,
    totalYears,
    symbols: ['XAUUSD'],
    timezone: 'UTC',
    duplicateTimestamps,
    nonIncreasingTimestamps,
    invalidRows,
    largeGapsOver1h,
    maxGapMinutes,
    usablePct,
    integrity: {
      ohlcValidRows: totalCandles,
      invalidRows,
      timestampsValid: duplicateTimestamps === 0 && nonIncreasingTimestamps === 0,
      duplicateTimestamps,
      nonIncreasingTimestamps,
    },
    coverage: {
      expectedOpenMarketMinutes,
      availableMinutes: totalCandles,
      coveragePct,
      normalGapCount: normalGaps.length,
      normalGapMinutes: normalGaps.reduce((sum, g) => sum + g.gapMissingMinutes, 0),
      anomalousGapCount: anomalousGaps.length,
      anomalousGapMinutes: anomalousGaps.reduce((sum, g) => sum + g.gapMissingMinutes, 0),
      excludedPeriodsCount: excludedSegments.length,
      excludedPeriodsMinutes: excludedSegments.reduce((sum, s) => sum + s.durationMinutes, 0),
    },
    calendar,
    gapsOver1h,
    maxGapAnalysis,
    segments: adjustedSegments,
    excludedSegments,
    gapPolicy,
    indicatorReadiness: {
      requiredIndicators: ['EMA20', 'EMA50', 'EMA200', 'ATR', 'ADX', 'RSI'],
      warmupCandlesAfterAnomalousGap: indicatorWarmupCandles,
      statusDuringWarmup: 'DATA_NOT_READY',
      blockedSignalWindows,
    },
    quality,
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

  if (inventory.source === 'external-api') {
    throw new Error('BLOCKED_BY_EXTERNAL_DEPENDENCY: MARKET_DATA_PROVIDER');
  }

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
