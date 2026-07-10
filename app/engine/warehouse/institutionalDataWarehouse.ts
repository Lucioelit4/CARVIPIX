import fs from "node:fs";
import path from "node:path";

import type { Asset, Candle, DataHealthStatus, DataQuality, MarketData, TechnicalIndicators, Tick, Timeframe } from "../types/marketData";
import { buildWarehouseDashboard } from "./dashboard";
import { buildWarehouseConnectors, listWarehouseConnectorDescriptors } from "./connectors";
import { WarehouseQualityEngine } from "./qualityEngine";
import type {
  DownloadBatchRequest,
  InstitutionalAsset,
  InstitutionalCandleRecord,
  QualityAssessmentResult,
  WarehouseAuditEntry,
  WarehouseDashboardSnapshot,
  WarehouseDownloadCheckpoint,
  WarehouseDownloadRequest,
  WarehouseDownloadResult,
  WarehouseCoverageSummary,
  WarehouseDatasetVersion,
  WarehouseQuery,
  WarehouseStressReport,
  WarehouseTimeframe,
} from "./types";
import { OFFICIAL_ASSET_TIERS, OFFICIAL_TIMEFRAMES } from "./types";

const WAREHOUSE_ROOT = path.join(process.cwd(), "data", "institutional-warehouse");

export class InstitutionalDataWarehouse {
  private readonly qualityEngine = new WarehouseQualityEngine();
  private readonly connectors = buildWarehouseConnectors();

  constructor(private readonly storageRoot: string = WAREHOUSE_ROOT) {
    this.ensureDirs();
    this.purgeLegacySeedData();
  }

  listProviders() {
    return listWarehouseConnectorDescriptors();
  }

  importFromProvider(request: WarehouseDownloadRequest): WarehouseDownloadResult {
    const connector = this.connectors.get(request.provider);
    if (!connector) {
      throw new Error(`Warehouse provider not implemented: ${request.provider}`);
    }

    const previous = this.loadCheckpoint(request.provider, request.symbol, request.timeframe);
    this.saveCheckpoint({
      provider: request.provider,
      symbol: request.symbol,
      timeframe: request.timeframe,
      version: request.version,
      lastTimestampUtc: previous?.lastTimestampUtc ?? null,
      resumeToken: request.resumeToken ?? previous?.resumeToken ?? null,
      attempts: (previous?.attempts ?? 0) + 1,
      updatedAt: Date.now(),
      status: "running",
    });

    try {
      const batch = connector.normalize(request);
      const { manifest, assessment } = this.ingestBatch(batch);
      const resumeToken = manifest.endTimestampUtc > 0 ? `${manifest.symbol}:${manifest.timeframe}:${manifest.endTimestampUtc}` : null;
      this.saveCheckpoint({
        provider: request.provider,
        symbol: request.symbol,
        timeframe: request.timeframe,
        version: request.version,
        lastTimestampUtc: manifest.endTimestampUtc || null,
        resumeToken,
        attempts: (previous?.attempts ?? 0) + 1,
        updatedAt: Date.now(),
        status: "completed",
      });
      return { request, manifest, assessment, resumeToken };
    } catch (error) {
      this.saveCheckpoint({
        provider: request.provider,
        symbol: request.symbol,
        timeframe: request.timeframe,
        version: request.version,
        lastTimestampUtc: previous?.lastTimestampUtc ?? null,
        resumeToken: request.resumeToken ?? previous?.resumeToken ?? null,
        attempts: (previous?.attempts ?? 0) + 1,
        updatedAt: Date.now(),
        status: "failed",
        lastError: error instanceof Error ? error.message : "Unknown warehouse import error",
      });
      throw error;
    }
  }

  ingestBatch(batch: DownloadBatchRequest): {
    manifest: WarehouseDatasetVersion;
    assessment: QualityAssessmentResult;
    filePath: string;
  } {
    this.assertOfficialAsset(batch.symbol);
    this.assertOfficialTimeframe(batch.timeframe);

    const assessment = this.qualityEngine.assess(batch);
    const existing = this.loadRecords(batch.symbol, batch.timeframe);
    const merged = this.mergeRows(existing, assessment.normalizedRows);
    const checksum = this.qualityEngine.checksumForRows(merged);
    const certifiedRows = merged.map((row) => ({
      ...row,
      checksum,
      version: batch.version,
      qualityScore: assessment.qualityScore,
      coverage: assessment.coverage,
      dataStatus: assessment.certified ? "certified" : "validated",
      certified: assessment.certified,
    }));

    const manifest: WarehouseDatasetVersion = {
      datasetId: `${batch.symbol}_${batch.timeframe}_${batch.version}`,
      symbol: batch.symbol,
      tier: OFFICIAL_ASSET_TIERS[batch.symbol],
      timeframe: batch.timeframe,
      version: batch.version,
      provider: batch.provider,
      checksum,
      coverage: assessment.coverage,
      rows: certifiedRows.length,
      missingData: assessment.missingData,
      qualityScore: assessment.qualityScore,
      validationDate: Date.now(),
      certification: assessment.certified ? "certified" : "rejected",
      correctedRows: assessment.correctedRows,
      startTimestampUtc: certifiedRows[0]?.timestampUtc ?? 0,
      endTimestampUtc: certifiedRows[certifiedRows.length - 1]?.timestampUtc ?? 0,
      yearsCapacity: {
        targetMin: 10,
        targetMax: 15,
        scalableTo: 20,
      },
      traceability: {
        downloadedBy: batch.downloadedBy,
        downloadedAt: Date.now(),
        provider: batch.provider,
        version: batch.version,
        qualityScore: assessment.qualityScore,
        checksum,
        corrected: assessment.correctedRows > 0,
        certified: assessment.certified,
      },
    };

    const filePath = this.datasetFile(batch.symbol, batch.timeframe);
    fs.writeFileSync(filePath, `${JSON.stringify(certifiedRows, null, 2)}\n`, "utf8");
    fs.writeFileSync(this.manifestFile(batch.symbol, batch.timeframe), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    fs.writeFileSync(this.auditFile(manifest.datasetId), `${JSON.stringify(this.toAuditEntry(batch, assessment, manifest), null, 2)}\n`, "utf8");
    this.updateIndex(manifest.datasetId);

    return { manifest, assessment, filePath };
  }

  queryCandles(query: WarehouseQuery): InstitutionalCandleRecord[] {
    const rows = this.loadRecords(query.symbol, query.timeframe);
    return rows
      .filter((row) => (query.startTimestampUtc === undefined ? true : row.timestampUtc >= query.startTimestampUtc))
      .filter((row) => (query.endTimestampUtc === undefined ? true : row.timestampUtc <= query.endTimestampUtc))
      .filter((row) => (query.certifiedOnly ? row.certified : true))
      .slice(query.limit ? -query.limit : undefined);
  }

  getCoverageSummary(): WarehouseCoverageSummary[] {
    const summaries: WarehouseCoverageSummary[] = [];
    for (const asset of Object.keys(OFFICIAL_ASSET_TIERS) as InstitutionalAsset[]) {
      for (const timeframe of OFFICIAL_TIMEFRAMES) {
        const rows = this.loadRecords(asset, timeframe);
        const manifest = this.loadManifest(asset, timeframe);
        summaries.push({
          symbol: asset,
          timeframe,
          versions: manifest ? 1 : 0,
          rows: rows.length,
          certifiedRows: rows.filter((row) => row.certified).length,
          provider: manifest?.provider ?? null,
          qualityScore: manifest?.qualityScore ?? 0,
          coverage: manifest?.coverage ?? 0,
          latestVersion: manifest?.version ?? null,
          startTimestampUtc: manifest?.startTimestampUtc ?? null,
          endTimestampUtc: manifest?.endTimestampUtc ?? null,
        });
      }
    }
    return summaries;
  }

  getDashboardSnapshot(): WarehouseDashboardSnapshot {
    return buildWarehouseDashboard(this.getCoverageSummary(), this.listCertifiedDatasets());
  }

  listCertifiedDatasets(): string[] {
    return this.getCoverageSummary()
      .filter((item) => item.certifiedRows > 0 && item.latestVersion)
      .map((item) => `${item.symbol}_${item.timeframe}_${item.latestVersion}`);
  }

  getAssetCoverage(symbol: InstitutionalAsset): number {
    const rows = this.getCoverageSummary().filter((item) => item.symbol === symbol);
    if (rows.length === 0) {
      return 0;
    }
    return Number((rows.reduce((acc, item) => acc + item.coverage, 0) / rows.length).toFixed(2));
  }

  getAssetQuality(symbol: InstitutionalAsset): number {
    const rows = this.getCoverageSummary().filter((item) => item.symbol === symbol);
    if (rows.length === 0) {
      return 0;
    }
    return Number((rows.reduce((acc, item) => acc + item.qualityScore, 0) / rows.length).toFixed(2));
  }

  getAssetYearsAvailable(symbol: InstitutionalAsset): number {
    const rows = this.getCoverageSummary().filter((item) => item.symbol === symbol && item.startTimestampUtc !== null && item.endTimestampUtc !== null);
    if (rows.length === 0) {
      return 0;
    }
    const start = Math.min(...rows.map((item) => item.startTimestampUtc as number));
    const end = Math.max(...rows.map((item) => item.endTimestampUtc as number));
    return Number(Math.max(0, (end - start) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(2));
  }

  listAuditEntries(): WarehouseAuditEntry[] {
    const dir = this.auditDir();
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir)
      .filter((entry) => entry.endsWith(".audit.json"))
      .map((entry) => JSON.parse(fs.readFileSync(path.join(dir, entry), "utf8")) as WarehouseAuditEntry);
  }

  runStressTest(): WarehouseStressReport {
    const startedAt = Date.now();
    const summaries = this.getCoverageSummary();
    const totalRowsProcessed = summaries.reduce((acc, item) => acc + item.rows, 0);
    const maxRowsSingleDataset = summaries.reduce((acc, item) => Math.max(acc, item.rows), 0);
    const durationMs = Math.max(1, Date.now() - startedAt);
    return {
      totalRowsProcessed,
      durationMs,
      rowsPerSecond: Number((totalRowsProcessed / (durationMs / 1000)).toFixed(2)),
      datasetCount: summaries.filter((item) => item.rows > 0).length,
      maxRowsSingleDataset,
    };
  }

  buildEngineMarketData(asset: Asset, timeframe: Timeframe): MarketData | null {
    const warehouseTimeframe = this.mapToWarehouseTimeframe(timeframe);
    const symbol = asset as InstitutionalAsset;
    const rows = this.queryCandles({ symbol, timeframe: warehouseTimeframe, certifiedOnly: true, limit: 250 });
    if (rows.length === 0) {
      return null;
    }

    const latest = rows[rows.length - 1];
    const candle: Candle = {
      timestamp: latest.timestampUtc,
      open: latest.open,
      high: latest.high,
      low: latest.low,
      close: latest.close,
      volume: latest.volume ?? 0,
      asset,
      timeframe,
      complete: true,
    };

    const tick: Tick = {
      timestamp: latest.timestampUtc,
      bid: latest.bid ?? latest.close,
      ask: latest.ask ?? latest.close,
      asset,
      spread: latest.spread ?? 0,
      volume: latest.tickVolume ?? latest.volume ?? 0,
      lastUpdate: Date.now(),
    };

    const indicators = this.buildIndicators(rows);
    const quality = this.toDataQuality(latest.qualityScore, latest.coverage);

    return {
      asset,
      timeframe,
      candle,
      tick,
      indicators,
      lastUpdate: Date.now(),
      quality,
    };
  }

  buildHealthStatus(): DataHealthStatus {
    const summaries = this.getCoverageSummary();
    const grouped = summaries.filter((item) => item.rows > 0 && ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"].includes(item.symbol));

    const connectedAssets = Array.from(new Set(grouped.map((item) => item.symbol as Asset)));
    const disconnectedAssets = (["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"] as Asset[]).filter((asset) => !connectedAssets.includes(asset));

    const connectionStates = Object.fromEntries(
      (["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"] as Asset[]).map((asset) => [
        asset,
        Object.fromEntries(
          (["1H", "45M", "5M"] as Timeframe[]).map((timeframe) => [
            timeframe,
            {
              asset,
              timeframe,
              status: connectedAssets.includes(asset) ? "connected" : "disconnected",
              lastConnect: Date.now(),
              uptime: 0,
              failureCount: connectedAssets.includes(asset) ? 0 : 1,
              consecutiveErrors: connectedAssets.includes(asset) ? 0 : 1,
            },
          ]),
        ),
      ]),
    ) as DataHealthStatus["connectionStates"];

    return {
      timestamp: Date.now(),
      overallHealth: grouped.length === 0 ? 0 : Number((grouped.reduce((acc, item) => acc + item.qualityScore, 0) / grouped.length).toFixed(2)),
      connectedAssets,
      disconnectedAssets,
      totalErrors: this.listAuditEntries().reduce((acc, item) => acc + item.errors.filter((error) => error.severity !== "warning").length, 0),
      activeAssets: connectedAssets.length,
      dataProvider: "real",
      avgLatency: 0,
      uptime: grouped.length > 0 ? 100 : 0,
      lastUpdate: Date.now(),
      connectionStates,
      recentErrors: [],
    };
  }

  private buildIndicators(rows: InstitutionalCandleRecord[]): TechnicalIndicators {
    const closes = rows.map((row) => row.close);
    const ema20 = this.ema(closes, 20);
    const ema50 = this.ema(closes, 50);
    const ema200 = this.ema(closes, 200);
    const atr = this.atr(rows.slice(-14));
    const volatility = this.volatility(closes.slice(-20));
    const last = rows[rows.length - 1];
    return {
      ema20,
      ema50,
      ema200,
      atr,
      adx: 0,
      rsi: 50,
      spread: last.spread ?? 0,
      volatility,
      timestamp: last.timestampUtc,
    };
  }

  private toDataQuality(qualityScore: number, coverage: number): DataQuality {
    return {
      isHealthy: qualityScore >= 80,
      latency: 0,
      completeness: coverage,
      freshness: 0,
      errors: [],
      lastHealthCheck: Date.now(),
    };
  }

  private mergeRows(existing: InstitutionalCandleRecord[], incoming: InstitutionalCandleRecord[]): InstitutionalCandleRecord[] {
    const byTimestamp = new Map<number, InstitutionalCandleRecord>();
    for (const row of existing) {
      byTimestamp.set(row.timestampUtc, row);
    }
    for (const row of incoming) {
      byTimestamp.set(row.timestampUtc, row);
    }
    return [...byTimestamp.values()].sort((left, right) => left.timestampUtc - right.timestampUtc);
  }

  private loadRecords(symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): InstitutionalCandleRecord[] {
    const filePath = this.datasetFile(symbol, timeframe);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as InstitutionalCandleRecord[];
  }

  private loadManifest(symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): WarehouseDatasetVersion | null {
    const filePath = this.manifestFile(symbol, timeframe);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as WarehouseDatasetVersion;
  }

  private updateIndex(datasetId: string): void {
    const index = this.readIndex();
    if (!index.includes(datasetId)) {
      index.unshift(datasetId);
      fs.writeFileSync(this.indexFile(), `${JSON.stringify(index, null, 2)}\n`, "utf8");
    }
  }

  private readIndex(): string[] {
    if (!fs.existsSync(this.indexFile())) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.indexFile(), "utf8")) as string[];
  }

  private loadCheckpoint(provider: WarehouseDownloadCheckpoint["provider"], symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): WarehouseDownloadCheckpoint | null {
    const filePath = this.checkpointFile(provider, symbol, timeframe);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as WarehouseDownloadCheckpoint;
  }

  private saveCheckpoint(checkpoint: WarehouseDownloadCheckpoint): void {
    fs.writeFileSync(this.checkpointFile(checkpoint.provider, checkpoint.symbol, checkpoint.timeframe), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
  }

  private toAuditEntry(batch: DownloadBatchRequest, assessment: QualityAssessmentResult, manifest: WarehouseDatasetVersion): WarehouseAuditEntry {
    return {
      datasetId: manifest.datasetId,
      provider: batch.provider,
      downloadedBy: batch.downloadedBy,
      downloadedAt: manifest.traceability.downloadedAt,
      version: batch.version,
      checksum: manifest.checksum,
      coverage: manifest.coverage,
      qualityScore: manifest.qualityScore,
      certification: manifest.certification,
      errors: assessment.issues,
      correctedRows: assessment.correctedRows,
    };
  }

  private purgeLegacySeedData(): void {
    for (const asset of Object.keys(OFFICIAL_ASSET_TIERS) as InstitutionalAsset[]) {
      for (const timeframe of OFFICIAL_TIMEFRAMES) {
        const manifest = this.loadManifest(asset, timeframe);
        if (!manifest) {
          continue;
        }
        if (
          manifest.version === "seed-v1"
          || manifest.traceability.downloadedBy === "system-seed"
          || manifest.traceability.downloadedBy === "test-suite"
        ) {
          const datasetPath = this.datasetFile(asset, timeframe);
          const manifestPath = this.manifestFile(asset, timeframe);
          if (fs.existsSync(datasetPath)) {
            fs.unlinkSync(datasetPath);
          }
          if (fs.existsSync(manifestPath)) {
            fs.unlinkSync(manifestPath);
          }
        }
      }
    }
  }

  private assertOfficialAsset(symbol: InstitutionalAsset): void {
    if (!(symbol in OFFICIAL_ASSET_TIERS)) {
      throw new Error(`Unsupported institutional asset: ${symbol}`);
    }
  }

  private assertOfficialTimeframe(timeframe: WarehouseTimeframe): void {
    if (!OFFICIAL_TIMEFRAMES.includes(timeframe)) {
      throw new Error(`Unsupported warehouse timeframe: ${timeframe}`);
    }
  }

  private mapToWarehouseTimeframe(timeframe: Timeframe): WarehouseTimeframe {
    if (timeframe === "1H") return "H1";
    if (timeframe === "5M") return "M5";
    return "M30";
  }

  private ema(values: number[], period: number): number {
    if (values.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let current = values[0];
    for (let index = 1; index < values.length; index += 1) {
      current = (values[index] - current) * multiplier + current;
    }
    return Number(current.toFixed(6));
  }

  private atr(rows: InstitutionalCandleRecord[]): number {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, row) => acc + (row.high - row.low), 0);
    return Number((sum / rows.length).toFixed(6));
  }

  private volatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
    return Number(Math.sqrt(variance).toFixed(6));
  }

  private ensureDirs(): void {
    fs.mkdirSync(this.storageRoot, { recursive: true });
    fs.mkdirSync(this.datasetsDir(), { recursive: true });
    fs.mkdirSync(this.manifestsDir(), { recursive: true });
    fs.mkdirSync(this.auditDir(), { recursive: true });
    fs.mkdirSync(this.checkpointsDir(), { recursive: true });
  }

  private datasetFile(symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): string {
    return path.join(this.datasetsDir(), `${symbol}_${timeframe}.json`);
  }

  private manifestFile(symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): string {
    return path.join(this.manifestsDir(), `${symbol}_${timeframe}.manifest.json`);
  }

  private auditFile(datasetId: string): string {
    return path.join(this.auditDir(), `${datasetId}.audit.json`);
  }

  private checkpointFile(provider: string, symbol: InstitutionalAsset, timeframe: WarehouseTimeframe): string {
    return path.join(this.checkpointsDir(), `${provider}_${symbol}_${timeframe}.checkpoint.json`);
  }

  private datasetsDir(): string {
    return path.join(this.storageRoot, "datasets");
  }

  private manifestsDir(): string {
    return path.join(this.storageRoot, "manifests");
  }

  private auditDir(): string {
    return path.join(this.storageRoot, "audit");
  }

  private checkpointsDir(): string {
    return path.join(this.storageRoot, "checkpoints");
  }

  private indexFile(): string {
    return path.join(this.storageRoot, "index.json");
  }
}

let sharedWarehouse: InstitutionalDataWarehouse | null = null;

export function getInstitutionalDataWarehouse(): InstitutionalDataWarehouse {
  if (!sharedWarehouse) {
    sharedWarehouse = new InstitutionalDataWarehouse();
  }
  return sharedWarehouse;
}
