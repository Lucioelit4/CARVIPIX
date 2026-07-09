import fs from "node:fs";
import path from "node:path";

import { runMassiveBacktestingLab, discoverHistoricalDatasetInventory, type MassiveLabRunResult } from "../app/engine/backtesting/massiveLab";
import { runSignalProfitabilityValidation } from "../app/engine/core/signalProfitabilityValidation";
import type { ValidationSymbol } from "../app/engine/core/signalProfitabilityValidation";
import type { Asset } from "../app/engine/types/marketData";
import { InstitutionalDataWarehouse } from "../app/engine/warehouse/institutionalDataWarehouse";
import type {
  InstitutionalAsset,
  WarehouseDownloadResult,
  WarehouseTimeframe,
} from "../app/engine/warehouse/types";

const TARGET_SYMBOLS: InstitutionalAsset[] = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"];
const TARGET_TIMEFRAMES: WarehouseTimeframe[] = ["M1", "M5", "H1", "D1"];
const DATA_DIRS = [
  path.join(process.cwd(), "data", "market-history"),
  path.join(process.cwd(), "public", "datasets"),
];
const TIMEFRAME_TO_MS: Record<WarehouseTimeframe, number | null> = {
  Tick: null,
  S1: 1000,
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
  W1: 604_800_000,
  MN1: 2_592_000_000,
};

type RawCandle = {
  timestampUtc: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

type SymbolIngestion = {
  symbol: InstitutionalAsset;
  sourceFiles: string[];
  sourceRows: number;
  ingestedRows: number;
  certifiedDatasets: string[];
  versions: Array<{
    timeframe: WarehouseTimeframe;
    datasetId: string;
    rows: number;
    qualityScore: number;
    coverage: number;
    certification: string;
  }>;
  status: "ingested" | "missing-data";
};

type OfficialKnowledgeReport = {
  generatedAt: number;
  runId: string;
  phaseStatus: {
    phase1ProviderIntegration: "completed" | "blocked";
    phase2RealDownload: "completed" | "partial" | "blocked";
    phase3ValidationCertificationVersioning: "completed" | "partial" | "blocked";
    phase4WarehousePopulation: "completed" | "partial" | "blocked";
    phase5AutoRetraining: "completed" | "partial" | "blocked";
    phase6ValidationStack: "completed" | "partial" | "blocked";
    phase7EngineComparison: "completed" | "partial" | "blocked";
  };
  symbols: {
    requested: InstitutionalAsset[];
    ingested: InstitutionalAsset[];
    missing: InstitutionalAsset[];
  };
  warehouse: {
    ingestions: SymbolIngestion[];
    coverageRows: number;
    certifiedDatasets: string[];
  };
  lab: {
    executed: boolean;
    usedAssets: Asset[];
    usedYears: string[];
    result: MassiveLabRunResult | null;
    error?: string;
  };
  profitability: {
    profitable: boolean;
    primary: {
      winRate: number;
      profitFactor: number;
      expectancy: number;
      drawdown: number;
      netProfit: number;
    };
    baselines: {
      simpleEngineNetProfit: number;
      randomNetProfit: number;
      noTradeNetProfit: number;
    };
    approvedPairs: ValidationSymbol[];
    rejectedPairs: ValidationSymbol[];
    recommendations: string[];
  };
};

function parseDateToken(dateToken: string, timeToken: string): number {
  if (/^\d{8}$/.test(dateToken) && /^\d{6}$/.test(timeToken)) {
    const year = Number(dateToken.slice(0, 4));
    const month = Number(dateToken.slice(4, 6)) - 1;
    const day = Number(dateToken.slice(6, 8));
    const hour = Number(timeToken.slice(0, 2));
    const minute = Number(timeToken.slice(2, 4));
    const second = Number(timeToken.slice(4, 6));
    return Date.UTC(year, month, day, hour, minute, second);
  }

  const normalizedDate = dateToken.replace(/\./g, "-");
  const timestamp = Date.parse(`${normalizedDate}T${timeToken}Z`);
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function toNumber(value: string): number {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseRawLine(line: string): RawCandle | null {
  const trimmed = line.trim();
  if (!trimmed || /^[A-Za-z]/.test(trimmed)) {
    return null;
  }

  if (trimmed.includes(";")) {
    const parts = trimmed.split(";");
    if (parts.length < 6) {
      return null;
    }

    const dateParts = parts[0].trim().split(" ");
    if (dateParts.length !== 2) {
      return null;
    }

    const timestampUtc = parseDateToken(dateParts[0], dateParts[1]);
    const open = toNumber(parts[1]);
    const high = toNumber(parts[2]);
    const low = toNumber(parts[3]);
    const close = toNumber(parts[4]);
    const volume = toNumber(parts[5]);

    if (![timestampUtc, open, high, low, close].every(Number.isFinite)) {
      return null;
    }

    return {
      timestampUtc,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : null,
    };
  }

  const parts = trimmed.split(",");
  if (parts.length < 6) {
    return null;
  }

  let dateToken = "";
  let timeToken = "";
  let openIndex = 1;

  if (parts.length >= 7) {
    dateToken = parts[0].trim();
    timeToken = parts[1].trim();
    openIndex = 2;
  } else {
    const dateParts = parts[0].trim().split(" ");
    if (dateParts.length !== 2) {
      return null;
    }
    dateToken = dateParts[0];
    timeToken = dateParts[1];
    openIndex = 1;
  }

  const timestampUtc = parseDateToken(dateToken, timeToken);
  const open = toNumber(parts[openIndex]);
  const high = toNumber(parts[openIndex + 1]);
  const low = toNumber(parts[openIndex + 2]);
  const close = toNumber(parts[openIndex + 3]);
  const volume = toNumber(parts[openIndex + 4]);

  if (![timestampUtc, open, high, low, close].every(Number.isFinite)) {
    return null;
  }

  return {
    timestampUtc,
    open,
    high,
    low,
    close,
    volume: Number.isFinite(volume) ? volume : null,
  };
}

function listSourceFilesForSymbol(symbol: InstitutionalAsset): string[] {
  const files: string[] = [];
  const pattern = new RegExp(`^DAT_ASCII_${symbol}_M1_(\\d{4}|\\d{6})\\.(csv|txt)$`, "i");

  for (const dir of DATA_DIRS) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      if (!pattern.test(entry.name)) {
        continue;
      }
      files.push(path.join(dir, entry.name));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function parseSourceFiles(files: string[]): RawCandle[] {
  const byTimestamp = new Map<number, RawCandle>();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const row = parseRawLine(line);
      if (!row) {
        continue;
      }
      byTimestamp.set(row.timestampUtc, row);
    }
  }

  return Array.from(byTimestamp.values()).sort((a, b) => a.timestampUtc - b.timestampUtc);
}

function aggregateCandles(rows: RawCandle[], timeframe: WarehouseTimeframe): RawCandle[] {
  const bucketMs = TIMEFRAME_TO_MS[timeframe];
  if (!bucketMs || rows.length === 0) {
    return rows;
  }

  const buckets = new Map<number, RawCandle[]>();
  for (const row of rows) {
    const bucketStart = Math.floor(row.timestampUtc / bucketMs) * bucketMs;
    const bucket = buckets.get(bucketStart) ?? [];
    bucket.push(row);
    buckets.set(bucketStart, bucket);
  }

  const aggregated: RawCandle[] = [];
  for (const [bucketStart, bucketRows] of buckets.entries()) {
    const sorted = [...bucketRows].sort((a, b) => a.timestampUtc - b.timestampUtc);
    const open = sorted[0]?.open ?? 0;
    const close = sorted[sorted.length - 1]?.close ?? 0;
    const high = Math.max(...sorted.map((row) => row.high));
    const low = Math.min(...sorted.map((row) => row.low));
    const volumeSum = sorted.reduce((sum, row) => sum + (row.volume ?? 0), 0);

    aggregated.push({
      timestampUtc: bucketStart,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volumeSum) ? volumeSum : null,
    });
  }

  return aggregated.sort((a, b) => a.timestampUtc - b.timestampUtc);
}

function toProviderPayload(rows: RawCandle[]): Array<Record<string, number | null>> {
  return rows.map((row) => ({
    timestampUtc: row.timestampUtc,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));
}

function ingestSymbol(
  warehouse: InstitutionalDataWarehouse,
  symbol: InstitutionalAsset,
  runId: string,
): SymbolIngestion {
  const files = listSourceFilesForSymbol(symbol);
  if (files.length === 0) {
    return {
      symbol,
      sourceFiles: [],
      sourceRows: 0,
      ingestedRows: 0,
      certifiedDatasets: [],
      versions: [],
      status: "missing-data",
    };
  }

  const sourceRows = parseSourceFiles(files);
  const versions: SymbolIngestion["versions"] = [];
  const certifiedDatasets: string[] = [];
  let ingestedRows = 0;

  for (const timeframe of TARGET_TIMEFRAMES) {
    const tfRows = aggregateCandles(sourceRows, timeframe);
    if (tfRows.length === 0) {
      continue;
    }

    const result: WarehouseDownloadResult = warehouse.importFromProvider({
      symbol,
      timeframe,
      provider: "manual_certified",
      mode: "full",
      requestedBy: "knowledge-bootstrap",
      version: `${runId}-${timeframe}`,
      sourceTimezone: "UTC",
      sourcePayload: toProviderPayload(tfRows),
    });

    ingestedRows += result.manifest.rows;
    versions.push({
      timeframe,
      datasetId: result.manifest.datasetId,
      rows: result.manifest.rows,
      qualityScore: result.manifest.qualityScore,
      coverage: result.manifest.coverage,
      certification: result.manifest.certification,
    });

    if (result.manifest.certification === "certified") {
      certifiedDatasets.push(result.manifest.datasetId);
    }
  }

  return {
    symbol,
    sourceFiles: files,
    sourceRows: sourceRows.length,
    ingestedRows,
    certifiedDatasets,
    versions,
    status: versions.length > 0 ? "ingested" : "missing-data",
  };
}

function toValidationSymbolSet(values: string[]): ValidationSymbol[] {
  const allowed = new Set<ValidationSymbol>(["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"]);
  return values.filter((value): value is ValidationSymbol => allowed.has(value as ValidationSymbol));
}

async function runLabForAvailableAssets(): Promise<{ executed: boolean; usedAssets: Asset[]; usedYears: string[]; result: MassiveLabRunResult | null; error?: string }> {
  const inventory = discoverHistoricalDatasetInventory();
  const allowedAssets: Asset[] = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD"];
  const usedAssets = allowedAssets.filter((asset) => inventory.availableAssets.includes(asset));
  const usedYears = [...inventory.availableYears].sort().slice(-1);

  if (process.env.KNOWLEDGE_RUN_LAB !== "1") {
    return {
      executed: false,
      usedAssets,
      usedYears,
      result: null,
      error: "Massive lab execution skipped. Set KNOWLEDGE_RUN_LAB=1 to enable.",
    };
  }

  if (usedAssets.length === 0 || usedYears.length === 0) {
    return {
      executed: false,
      usedAssets,
      usedYears,
      result: null,
      error: "No historical datasets available for lab execution.",
    };
  }

  try {
    const result = await runMassiveBacktestingLab({
      initialBalance: 10_000,
      riskPerTrade: 1,
      consensusThreshold: 7,
      maxDrawdown: 50,
      minWinRate: 40,
      assets: usedAssets,
      years: usedYears,
      includeMonteCarlo: true,
      includeWalkForward: true,
    });

    return {
      executed: true,
      usedAssets,
      usedYears,
      result,
    };
  } catch (error) {
    return {
      executed: false,
      usedAssets,
      usedYears,
      result: null,
      error: error instanceof Error ? error.message : "Unknown massive-lab error",
    };
  }
}

function buildPhaseStatus(report: OfficialKnowledgeReport): OfficialKnowledgeReport["phaseStatus"] {
  const ingestedCount = report.symbols.ingested.length;
  const totalRequested = report.symbols.requested.length;
  const hasCertified = report.warehouse.certifiedDatasets.length > 0;
  const fullSymbolCoverage = ingestedCount === totalRequested;

  return {
    phase1ProviderIntegration: "completed",
    phase2RealDownload: fullSymbolCoverage ? "completed" : ingestedCount > 0 ? "partial" : "blocked",
    phase3ValidationCertificationVersioning: hasCertified ? (fullSymbolCoverage ? "completed" : "partial") : "blocked",
    phase4WarehousePopulation: hasCertified ? (fullSymbolCoverage ? "completed" : "partial") : "blocked",
    phase5AutoRetraining: report.lab.executed ? "completed" : "partial",
    phase6ValidationStack: report.lab.executed ? "completed" : "partial",
    phase7EngineComparison: report.lab.executed ? "completed" : "partial",
  };
}

async function main(): Promise<void> {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const warehouse = new InstitutionalDataWarehouse();

  const ingestions = TARGET_SYMBOLS.map((symbol) => ingestSymbol(warehouse, symbol, runId));
  const ingestedSymbols = ingestions.filter((entry) => entry.status === "ingested").map((entry) => entry.symbol);
  const missingSymbols = TARGET_SYMBOLS.filter((symbol) => !ingestedSymbols.includes(symbol));

  const coverageRows = warehouse
    .getCoverageSummary()
    .filter((entry) => TARGET_SYMBOLS.includes(entry.symbol) && TARGET_TIMEFRAMES.includes(entry.timeframe))
    .reduce((sum, entry) => sum + entry.rows, 0);

  const certifiedDatasets = warehouse
    .listCertifiedDatasets()
    .filter((datasetId) => TARGET_SYMBOLS.some((symbol) => datasetId.startsWith(`${symbol}_`)));

  const lab = await runLabForAvailableAssets();
  const profitability = runSignalProfitabilityValidation();
  const approvedPairs = toValidationSymbolSet([...profitability.approvedPairs]);
  const rejectedPairs = toValidationSymbolSet(
    ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"].filter((pair) => !approvedPairs.includes(pair as ValidationSymbol)),
  );

  const report: OfficialKnowledgeReport = {
    generatedAt: Date.now(),
    runId,
    phaseStatus: {
      phase1ProviderIntegration: "blocked",
      phase2RealDownload: "blocked",
      phase3ValidationCertificationVersioning: "blocked",
      phase4WarehousePopulation: "blocked",
      phase5AutoRetraining: "blocked",
      phase6ValidationStack: "blocked",
      phase7EngineComparison: "blocked",
    },
    symbols: {
      requested: TARGET_SYMBOLS,
      ingested: ingestedSymbols,
      missing: missingSymbols,
    },
    warehouse: {
      ingestions,
      coverageRows,
      certifiedDatasets,
    },
    lab,
    profitability: {
      profitable: profitability.profitable,
      primary: {
        winRate: profitability.primary.metrics.winRate,
        profitFactor: profitability.primary.metrics.profitFactor,
        expectancy: profitability.primary.metrics.expectancy,
        drawdown: profitability.primary.metrics.drawdown,
        netProfit: profitability.primary.metrics.netProfit,
      },
      baselines: {
        simpleEngineNetProfit: profitability.baselines.simpleEngine.metrics.netProfit,
        randomNetProfit: profitability.baselines.random.metrics.netProfit,
        noTradeNetProfit: profitability.baselines.noTrade.metrics.netProfit,
      },
      approvedPairs,
      rejectedPairs,
      recommendations: profitability.minimumChangeRecommendations,
    },
  };

  report.phaseStatus = buildPhaseStatus(report);

  const outputDir = path.join(process.cwd(), "data", "backtesting-research", "official-knowledge-reports");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `official-knowledge-${runId}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  process.stdout.write(JSON.stringify({ ok: true, outputPath, report }, null, 2));
  process.stdout.write("\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
