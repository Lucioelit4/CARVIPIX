import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";

import { InMemoryBackendCache } from "@/app/backend/core/cache";

import { InstitutionalDataPlatform } from "./core";
import type {
  DataProviderAdapter,
  DataQuery,
  DataRecord,
  DatasetLineageRecord,
  DatasetKind,
  IngestionCursor,
  ProviderPullRequest,
  VersionRecord,
} from "./types";

export const OFFICIAL_ECOSYSTEM_ASSETS = ["XAUUSD", "BTCUSD", "DXY", "SP500", "US10Y", "VIX"] as const;
export type OfficialAsset = (typeof OFFICIAL_ECOSYSTEM_ASSETS)[number];

export type ProviderHealth = "healthy" | "degraded" | "offline";

export interface ProviderStatus {
  providerId: string;
  priority: number;
  health: ProviderHealth;
  active: boolean;
  successes: number;
  failures: number;
  rotationCount: number;
  lastError?: string;
  lastLatencyMs?: number;
  lastSyncAt?: string;
  cooldownUntil?: string;
}

export interface DatasetStats {
  datasetId: string;
  kind: DatasetKind;
  provider: string;
  asset: string;
  rowCount: number;
  sizeBytes: number;
  qualityScore: number;
  coverageScore: number;
  latestVersionId: string;
  lastUpdatedAt: string;
  certification: "CERTIFIED" | "DEGRADED" | "UNVERIFIED";
  lastCertifiedAt?: string;
  certificationReason?: string;
}

export interface HistoricalBootstrapSummary {
  assets: string[];
  fromTs: number;
  toTs: number;
  chunksExecuted: number;
  versionsCreated: number;
}

export interface IntegrityMaintenanceSummary {
  issuesDetected: number;
  repairsApplied: number;
  actionsDetected: number;
}

export interface SchedulerJobStatus {
  id: string;
  frequency: "daily" | "weekly" | "interval";
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  runCount: number;
  lastError?: string;
}

export interface PlatformHealthCheck {
  ok: boolean;
  checkedAt: string;
  providerSummary: {
    healthy: number;
    degraded: number;
    offline: number;
  };
  schedulerSummary: {
    totalJobs: number;
    jobsWithErrors: number;
  };
  integrityIssues: Array<{ kind: DatasetKind; count: number }>;
}

export interface OfficialSourceDashboard {
  datasets: DatasetStats[];
  providers: ProviderStatus[];
  jobs: SchedulerJobStatus[];
  totals: {
    datasets: number;
    rows: number;
    bytes: number;
    avgQuality: number;
    avgCoverage: number;
  };
}

export type ConsumerAccessScope = "query" | "ultra-query" | "catalog" | "dashboard" | "stream" | "lineage";

export interface ConsumerModuleStatus {
  moduleId: string;
  enabled: boolean;
  scopes: ConsumerAccessScope[];
  registeredAt: string;
  lastAccessAt?: string;
  blockedAttempts: number;
}

export interface DirectDownloadViolation {
  moduleId: string;
  reason: string;
  kind?: DatasetKind;
  at: string;
}

export type OfficialStreamEventType =
  | "provider-sync-ok"
  | "provider-sync-failed"
  | "integrity-maintenance"
  | "certification-updated"
  | "direct-download-violation";

export interface OfficialSourceStreamEvent {
  id: string;
  ts: string;
  type: OfficialStreamEventType;
  kind?: DatasetKind;
  providerId?: string;
  moduleId?: string;
  payload: unknown;
}

export interface StressReadinessSummary {
  totalSyntheticRows: number;
  ingestMs: number;
  queryMs: number;
  replayMs: number;
  ready: boolean;
}

interface CatalogFileSchema {
  updatedAt: string;
  entries: DatasetStats[];
  cursors: IngestionCursor[];
}

interface SchedulerJobInternal {
  status: SchedulerJobStatus;
  timerId?: NodeJS.Timeout;
  timeoutId?: NodeJS.Timeout;
  handler: () => Promise<void>;
  intervalMs?: number;
  dailyHourUtc?: number;
  weeklyDayUtc?: number;
}

function computeQuality(records: DataRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const invalid = records.filter((record) => {
    const numericFields = Object.values(record).filter((value) => typeof value === "number") as number[];
    return numericFields.some((value) => !Number.isFinite(value));
  }).length;

  const quality = 1 - invalid / records.length;
  return Math.max(0, Math.min(1, Number(quality.toFixed(4))));
}

function computeCoverage(records: DataRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const timestamps = records.map((record) => record.ts).sort((a, b) => a - b);
  if (timestamps.length < 2) {
    return 1;
  }

  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i += 1) {
    const delta = timestamps[i] - timestamps[i - 1];
    if (delta > 0) {
      deltas.push(delta);
    }
  }

  if (deltas.length === 0) {
    return 1;
  }

  const minDelta = Math.min(...deltas);
  const range = timestamps[timestamps.length - 1] - timestamps[0];
  const theoretical = Math.max(1, Math.floor(range / minDelta) + 1);
  const coverage = records.length / theoretical;
  return Math.max(0, Math.min(1, Number(coverage.toFixed(4))));
}

function estimateByteSize(records: DataRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  return Buffer.byteLength(records.map((record) => JSON.stringify(record)).join("\n"), "utf8");
}

function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

function nextDailyRun(hourUtc: number): Date {
  const now = new Date();
  const run = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0, 0));
  if (run.getTime() <= now.getTime()) {
    return addMs(run, 24 * 60 * 60 * 1000);
  }

  return run;
}

function nextWeeklyRun(dayUtc: number, hourUtc: number): Date {
  const now = new Date();
  const run = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0, 0));
  const currentDay = run.getUTCDay();
  let offsetDays = dayUtc - currentDay;
  if (offsetDays < 0) {
    offsetDays += 7;
  }

  const candidate = addMs(run, offsetDays * 24 * 60 * 60 * 1000);
  if (candidate.getTime() <= now.getTime()) {
    return addMs(candidate, 7 * 24 * 60 * 60 * 1000);
  }

  return candidate;
}

export class OfficialDataPlatformSource {
  private readonly platform: InstitutionalDataPlatform;
  private readonly rootDir: string;
  private readonly catalogPath: string;
  private readonly logPath: string;
  private readonly cache = new InMemoryBackendCache(60_000, 30_000);

  private readonly providerStatus = new Map<string, ProviderStatus>();
  private readonly datasetCatalog = new Map<string, DatasetStats>();
  private readonly cursors = new Map<string, IngestionCursor>();
  private readonly jobs = new Map<string, SchedulerJobInternal>();
  private readonly consumerModules = new Map<string, ConsumerModuleStatus>();
  private readonly directDownloadViolations: DirectDownloadViolation[] = [];
  private readonly streamEvents: OfficialSourceStreamEvent[] = [];

  constructor(platform: InstitutionalDataPlatform, options?: { rootDir?: string }) {
    this.platform = platform;
    this.rootDir = options?.rootDir ?? join(process.cwd(), "data", "data-platform", "official-source");
    this.catalogPath = join(this.rootDir, "dataset-catalog.json");
    this.logPath = join(this.rootDir, "logs", "data-platform.ndjson");
  }

  async bootstrap(): Promise<void> {
    await this.platform.bootstrap();
    await this.loadCatalog();

    for (const provider of this.platform.providers.listProviders()) {
      this.ensureProviderState(provider);
    }

    await this.log("info", "OfficialDataPlatformSource bootstrap completed", {
      providers: this.providerStatus.size,
      datasets: this.datasetCatalog.size,
    });
  }

  registerProvider(provider: DataProviderAdapter): void {
    this.platform.providers.register(provider);
    this.ensureProviderState(provider);
  }

  registerConsumerModule(moduleId: string, scopes: ConsumerAccessScope[]): void {
    const normalizedId = moduleId.trim();
    if (!normalizedId) {
      throw new Error("moduleId is required");
    }

    const uniqueScopes = Array.from(new Set(scopes));
    if (uniqueScopes.length === 0) {
      throw new Error("at least one scope is required");
    }

    const existing = this.consumerModules.get(normalizedId);
    const status: ConsumerModuleStatus = {
      moduleId: normalizedId,
      enabled: true,
      scopes: uniqueScopes,
      registeredAt: existing?.registeredAt ?? new Date().toISOString(),
      lastAccessAt: existing?.lastAccessAt,
      blockedAttempts: existing?.blockedAttempts ?? 0,
    };

    this.consumerModules.set(normalizedId, status);
  }

  disableConsumerModule(moduleId: string): void {
    const status = this.consumerModules.get(moduleId);
    if (!status) {
      return;
    }

    status.enabled = false;
  }

  getConsumerModules(): ConsumerModuleStatus[] {
    return Array.from(this.consumerModules.values()).sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }

  getDirectDownloadViolations(): DirectDownloadViolation[] {
    return [...this.directDownloadViolations];
  }

  getLineageForModule(moduleId: string, kind?: DatasetKind, limit = 500): DatasetLineageRecord[] {
    this.assertConsumerAccess(moduleId, "lineage");
    return this.platform.listLineage(kind, limit);
  }

  pollStreamEventsForModule(moduleId: string, options?: { sinceTs?: string; limit?: number }): OfficialSourceStreamEvent[] {
    this.assertConsumerAccess(moduleId, "stream");

    const sinceTs = options?.sinceTs;
    const limit = Math.max(1, Math.min(Math.trunc(options?.limit ?? 500), 5000));

    const filtered = sinceTs
      ? this.streamEvents.filter((event) => event.ts > sinceTs)
      : [...this.streamEvents];

    return filtered.slice(-limit);
  }

  async recordDirectDownloadViolation(input: { moduleId: string; reason: string; kind?: DatasetKind }): Promise<void> {
    const moduleId = input.moduleId.trim();
    if (!moduleId) {
      throw new Error("moduleId is required");
    }

    const violation: DirectDownloadViolation = {
      moduleId,
      reason: input.reason,
      kind: input.kind,
      at: new Date().toISOString(),
    };

    this.directDownloadViolations.push(violation);
    if (this.directDownloadViolations.length > 1000) {
      this.directDownloadViolations.splice(0, this.directDownloadViolations.length - 1000);
    }

    const consumer = this.consumerModules.get(moduleId);
    if (consumer) {
      consumer.blockedAttempts += 1;
    }

    await this.log("error", "Direct download attempt blocked; use Data Platform official source", {
      moduleId,
      reason: input.reason,
      kind: input.kind,
    });

    this.publishStreamEvent({
      type: "direct-download-violation",
      moduleId,
      kind: input.kind,
      payload: {
        reason: input.reason,
      },
    });
  }

  async runManualDownload(request: ProviderPullRequest): Promise<VersionRecord | null> {
    const { versions } = await this.syncKind(request.kind, {
      fromTs: request.fromTs,
      toTs: request.toTs,
      assets: request.assets,
      source: "manual",
    });

    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  async runDailyDownload(kinds: DatasetKind[]): Promise<void> {
    for (const kind of kinds) {
      await this.syncKind(kind, { source: "daily" });
    }
  }

  async runWeeklyDownload(kinds: DatasetKind[]): Promise<void> {
    for (const kind of kinds) {
      await this.syncKind(kind, { source: "weekly" });
    }
  }

  async downloadHistoricalBootstrap(options?: {
    assets?: OfficialAsset[];
    fromTs?: number;
    toTs?: number;
    chunkDays?: number;
    kinds?: DatasetKind[];
  }): Promise<HistoricalBootstrapSummary> {
    const assets = (options?.assets ?? [...OFFICIAL_ECOSYSTEM_ASSETS]) as string[];
    const toTs = options?.toTs ?? Date.now();
    const fromTs = options?.fromTs ?? new Date("2000-01-01T00:00:00.000Z").getTime();
    const kinds = options?.kinds ?? ["tick", "ohlc", "spread"];
    const chunkDays = Math.max(1, options?.chunkDays ?? 30);
    const chunkMs = chunkDays * 24 * 60 * 60 * 1000;

    let cursor = fromTs;
    let chunksExecuted = 0;
    let versionsCreated = 0;

    while (cursor <= toTs) {
      const windowTo = Math.min(toTs, cursor + chunkMs - 1);

      for (const kind of kinds) {
        const { versions } = await this.syncKind(kind, {
          fromTs: cursor,
          toTs: windowTo,
          assets,
          source: "historical-bootstrap",
        });
        versionsCreated += versions.length;
      }

      chunksExecuted += 1;
      cursor = windowTo + 1;
    }

    await this.autoCertifyDatasets(kinds);

    const summary: HistoricalBootstrapSummary = {
      assets,
      fromTs,
      toTs,
      chunksExecuted,
      versionsCreated,
    };

    await this.log("info", "Historical bootstrap completed", summary);
    return summary;
  }

  startScheduler(options?: {
    syncKinds?: DatasetKind[];
    syncIntervalMs?: number;
    dailyHourUtc?: number;
    weeklyDayUtc?: number;
    weeklyHourUtc?: number;
  }): void {
    const syncKinds = options?.syncKinds ?? ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"];
    const syncIntervalMs = options?.syncIntervalMs ?? 15 * 60 * 1000;
    const dailyHourUtc = options?.dailyHourUtc ?? 2;
    const weeklyDayUtc = options?.weeklyDayUtc ?? 0;
    const weeklyHourUtc = options?.weeklyHourUtc ?? 3;

    this.registerIntervalJob("sync-interval", syncIntervalMs, async () => {
      for (const kind of syncKinds) {
        await this.syncKind(kind, { source: "interval" });
      }
    });

    this.registerIntervalJob("health-check", 5 * 60 * 1000, async () => {
      await this.healthCheck();
    });

    this.registerIntervalJob("integrity-maintenance", 30 * 60 * 1000, async () => {
      await this.runIntegrityMaintenance(syncKinds);
    });

    this.registerIntervalJob("auto-certification", 60 * 60 * 1000, async () => {
      await this.autoCertifyDatasets(syncKinds);
    });

    this.registerDailyJob("download-daily", dailyHourUtc, async () => {
      await this.runDailyDownload(syncKinds);
    });

    this.registerWeeklyJob("download-weekly", weeklyDayUtc, weeklyHourUtc, async () => {
      await this.runWeeklyDownload(syncKinds);
    });
  }

  stopScheduler(): void {
    for (const job of this.jobs.values()) {
      if (job.timerId) {
        clearInterval(job.timerId);
      }

      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }

      job.status.enabled = false;
    }
  }

  getProviderStatus(): ProviderStatus[] {
    return Array.from(this.providerStatus.values()).sort((a, b) => a.priority - b.priority);
  }

  getDatasetCatalog(): DatasetStats[] {
    return Array.from(this.datasetCatalog.values()).sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
  }

  getSchedulerStatus(): SchedulerJobStatus[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job.status }));
  }

  getDatasetCatalogForModule(moduleId: string): DatasetStats[] {
    this.assertConsumerAccess(moduleId, "catalog");
    return this.getDatasetCatalog();
  }

  getDashboardForModule(moduleId: string): OfficialSourceDashboard {
    this.assertConsumerAccess(moduleId, "dashboard");
    return this.getDashboard();
  }

  async queryForModule(moduleId: string, request: DataQuery, options?: { ultraFast?: boolean }): Promise<DataRecord[]> {
    if (options?.ultraFast) {
      this.assertConsumerAccess(moduleId, "ultra-query");
      return this.queryUltraFast(request);
    }

    this.assertConsumerAccess(moduleId, "query");
    return this.queryWithIntelligentCache(request);
  }

  async queryWithIntelligentCache(request: DataQuery): Promise<DataRecord[]> {
    const key = JSON.stringify(request);
    const cached = this.cache.get<DataRecord[]>(key);
    if (cached) {
      return cached;
    }

    const rows = await this.platform.query(request);
    this.cache.set(key, rows);
    return rows;
  }

  async queryUltraFast(request: DataQuery): Promise<DataRecord[]> {
    const cacheKey = `ultra:${JSON.stringify(request)}`;
    const cached = this.cache.get<DataRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.platform.query({
      ...request,
      mode: "aggregate",
      limit: Math.min(request.limit ?? 100_000, 1_000_000),
    });

    this.cache.set(cacheKey, rows);
    return rows;
  }

  async synchronizeAllKinds(kinds?: DatasetKind[]): Promise<void> {
    const targetKinds = kinds ?? ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"];
    for (const kind of targetKinds) {
      await this.syncKind(kind, { source: "auto-sync" });
    }
  }

  async healthCheck(kinds?: DatasetKind[]): Promise<PlatformHealthCheck> {
    const targetKinds = kinds ?? ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"];
    const integrityIssues: Array<{ kind: DatasetKind; count: number }> = [];

    for (const kind of targetKinds) {
      const issues = await this.platform.verifyIntegrity(kind);
      integrityIssues.push({ kind, count: issues.length });
    }

    const providers = this.getProviderStatus();
    const jobs = this.getSchedulerStatus();

    const summary: PlatformHealthCheck = {
      ok: providers.every((provider) => provider.health !== "offline") && integrityIssues.every((issue) => issue.count === 0),
      checkedAt: new Date().toISOString(),
      providerSummary: {
        healthy: providers.filter((provider) => provider.health === "healthy").length,
        degraded: providers.filter((provider) => provider.health === "degraded").length,
        offline: providers.filter((provider) => provider.health === "offline").length,
      },
      schedulerSummary: {
        totalJobs: jobs.length,
        jobsWithErrors: jobs.filter((job) => Boolean(job.lastError)).length,
      },
      integrityIssues,
    };

    await this.log("info", "Health check executed", summary);
    return summary;
  }

  async runIntegrityMaintenance(kinds?: DatasetKind[]): Promise<IntegrityMaintenanceSummary> {
    const targetKinds = kinds ?? ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"];
    let issuesDetected = 0;
    let repairsApplied = 0;
    let actionsDetected = 0;

    for (const kind of targetKinds) {
      const issues = await this.platform.verifyIntegrity(kind);
      const actions = await this.platform.detectRepairActions(kind);
      issuesDetected += issues.length;
      actionsDetected += actions.length;

      if (issues.length > 0 || actions.length > 0) {
        repairsApplied += await this.platform.autoRepair(kind);
      }
    }

    await this.autoCertifyDatasets(targetKinds);

    const summary: IntegrityMaintenanceSummary = {
      issuesDetected,
      repairsApplied,
      actionsDetected,
    };

    await this.log("info", "Integrity maintenance completed", summary);
    this.publishStreamEvent({
      type: "integrity-maintenance",
      payload: summary,
    });
    return summary;
  }

  async runStressReadinessCheck(options?: {
    syntheticRows?: number;
    asset?: string;
    providerId?: string;
  }): Promise<StressReadinessSummary> {
    const syntheticRows = Math.max(1000, Math.min(Math.trunc(options?.syntheticRows ?? 50_000), 500_000));
    const asset = (options?.asset ?? "XAUUSD").toUpperCase();
    const providerId = options?.providerId ?? "stress-suite";
    const baseTs = Date.now() - syntheticRows;

    const rows: DataRecord[] = [];
    for (let i = 0; i < syntheticRows; i += 1) {
      rows.push({
        kind: "tick",
        id: `stress_${providerId}_${i}`,
        provider: providerId,
        asset,
        ts: baseTs + i,
        bid: 2000 + i * 0.0001,
        ask: 2000.25 + i * 0.0001,
      });
    }

    const t0 = performance.now();
    await this.platform.ingest("tick", rows);
    const t1 = performance.now();

    await this.queryUltraFast({
      kind: "tick",
      asset,
      provider: providerId,
      mode: "aggregate",
      sort: "desc",
      limit: Math.min(100_000, syntheticRows),
    });
    const t2 = performance.now();

    await this.platform.replay(
      {
        kind: "tick",
        asset,
        provider: providerId,
        mode: "raw",
        sort: "asc",
        limit: Math.min(20_000, syntheticRows),
      },
      () => undefined,
    );
    const t3 = performance.now();

    const summary: StressReadinessSummary = {
      totalSyntheticRows: syntheticRows,
      ingestMs: Number((t1 - t0).toFixed(3)),
      queryMs: Number((t2 - t1).toFixed(3)),
      replayMs: Number((t3 - t2).toFixed(3)),
      ready: true,
    };

    await this.log("info", "Stress readiness check completed", summary);
    return summary;
  }

  getDashboard(): OfficialSourceDashboard {
    const datasets = this.getDatasetCatalog();
    const providers = this.getProviderStatus();
    const jobs = this.getSchedulerStatus();

    const rows = datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0);
    const bytes = datasets.reduce((sum, dataset) => sum + dataset.sizeBytes, 0);
    const avgQuality = datasets.length === 0 ? 0 : datasets.reduce((sum, dataset) => sum + dataset.qualityScore, 0) / datasets.length;
    const avgCoverage = datasets.length === 0 ? 0 : datasets.reduce((sum, dataset) => sum + dataset.coverageScore, 0) / datasets.length;

    return {
      datasets,
      providers,
      jobs,
      totals: {
        datasets: datasets.length,
        rows,
        bytes,
        avgQuality: Number(avgQuality.toFixed(4)),
        avgCoverage: Number(avgCoverage.toFixed(4)),
      },
    };
  }

  async autoCertifyDatasets(kinds?: DatasetKind[]): Promise<number> {
    const targetKinds = new Set(kinds ?? ["tick", "ohlc", "news", "economic-calendar", "spread", "session", "metadata"]);
    let certified = 0;

    for (const stats of this.datasetCatalog.values()) {
      if (!targetKinds.has(stats.kind)) {
        continue;
      }

      const thresholdRows = stats.kind === "tick" ? 1000 : 100;
      const isQualityOk = stats.qualityScore >= 0.97;
      const isCoverageOk = stats.coverageScore >= 0.85;
      const hasScale = stats.rowCount >= thresholdRows;

      if (isQualityOk && isCoverageOk && hasScale) {
        stats.certification = "CERTIFIED";
        stats.lastCertifiedAt = new Date().toISOString();
        stats.certificationReason = "quality-coverage-scale-thresholds";
        certified += 1;
      } else if (stats.rowCount > 0) {
        stats.certification = "DEGRADED";
        stats.certificationReason = "below-cert-threshold";
      } else {
        stats.certification = "UNVERIFIED";
        stats.certificationReason = "no-data";
      }
    }

    await this.saveCatalog();
    await this.log("info", "Auto certification completed", { certified, scanned: this.datasetCatalog.size });
    this.publishStreamEvent({
      type: "certification-updated",
      payload: {
        certified,
        scanned: this.datasetCatalog.size,
      },
    });
    return certified;
  }

  private async syncKind(
    kind: DatasetKind,
    options?: { fromTs?: number; toTs?: number; assets?: string[]; source?: string }
  ): Promise<{ versions: VersionRecord[] }> {
    const versions: VersionRecord[] = [];
    const providers = this.platform.providers.listProviders().filter((provider) => provider.supports.includes(kind));

    for (const provider of providers) {
      const status = this.ensureProviderState(provider);
      this.recoverProviderIfCooldownElapsed(status);
      if (!status.active) {
        continue;
      }

      const startedAt = Date.now();
      const cursor = this.cursors.get(`${kind}:${provider.id}`)?.cursor;

      try {
        const response = await provider.pullIncremental({
          kind,
          cursor,
          fromTs: options?.fromTs,
          toTs: options?.toTs,
          assets: options?.assets,
        });

        const elapsed = Date.now() - startedAt;
        const version = await this.platform.ingest(kind, response.records);
        versions.push(version);

        if (response.nextCursor) {
          this.cursors.set(`${kind}:${provider.id}`, {
            kind,
            provider: provider.id,
            cursor: response.nextCursor,
          });
        }

        status.successes += 1;
        status.lastLatencyMs = elapsed;
        status.lastSyncAt = new Date().toISOString();
        status.lastError = undefined;
        status.health = status.failures >= 3 ? "degraded" : "healthy";

        await this.updateCatalog(kind, provider.id, response.records, version);
        await this.log("info", "Provider sync succeeded", {
          kind,
          provider: provider.id,
          records: response.records.length,
          source: options?.source,
          versionId: version.id,
          elapsedMs: elapsed,
        });
        this.publishStreamEvent({
          type: "provider-sync-ok",
          kind,
          providerId: provider.id,
          payload: {
            records: response.records.length,
            source: options?.source ?? "unknown",
            versionId: version.id,
            elapsedMs: elapsed,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown provider error";
        status.failures += 1;
        status.lastError = message;
        status.health = status.failures >= 5 ? "offline" : "degraded";

        await this.log("error", "Provider sync failed", {
          kind,
          provider: provider.id,
          source: options?.source,
          error: message,
        });

        this.publishStreamEvent({
          type: "provider-sync-failed",
          kind,
          providerId: provider.id,
          payload: {
            source: options?.source ?? "unknown",
            error: message,
          },
        });

        this.rotateProvider(status);
      }
    }

    if (versions.length > 0) {
      await this.autoCertifyDatasets([kind]);
    }

    await this.saveCatalog();
    this.cache.clear();

    return { versions };
  }

  private async updateCatalog(kind: DatasetKind, providerId: string, records: DataRecord[], version: VersionRecord): Promise<void> {
    const byAsset = new Map<string, DataRecord[]>();

    for (const record of records) {
      const asset = (record.asset ?? "GLOBAL").toUpperCase();
      const current = byAsset.get(asset) ?? [];
      current.push(record);
      byAsset.set(asset, current);
    }

    for (const [asset, rows] of byAsset.entries()) {
      const datasetId = `${kind}:${providerId}:${asset}`;
      const current = this.datasetCatalog.get(datasetId);

      const next: DatasetStats = {
        datasetId,
        kind,
        provider: providerId,
        asset,
        rowCount: (current?.rowCount ?? 0) + rows.length,
        sizeBytes: (current?.sizeBytes ?? 0) + estimateByteSize(rows),
        qualityScore: computeQuality(rows),
        coverageScore: computeCoverage(rows),
        latestVersionId: version.id,
        lastUpdatedAt: new Date().toISOString(),
        certification: current?.certification ?? "UNVERIFIED",
        lastCertifiedAt: current?.lastCertifiedAt,
        certificationReason: current?.certificationReason,
      };

      this.datasetCatalog.set(datasetId, next);
    }
  }

  private ensureProviderState(provider: DataProviderAdapter): ProviderStatus {
    const existing = this.providerStatus.get(provider.id);
    if (existing) {
      return existing;
    }

    const created: ProviderStatus = {
      providerId: provider.id,
      priority: provider.priority,
      health: "healthy",
      active: true,
      successes: 0,
      failures: 0,
      rotationCount: 0,
    };

    this.providerStatus.set(provider.id, created);
    return created;
  }

  private rotateProvider(current: ProviderStatus): void {
    current.rotationCount += 1;

    if (current.failures >= 5) {
      current.active = false;
      current.cooldownUntil = addMs(new Date(), 10 * 60 * 1000).toISOString();
    }

    const alternatives = this.getProviderStatus().filter((status) => status.providerId !== current.providerId && status.active);
    if (alternatives.length > 0) {
      alternatives.sort((a, b) => a.priority - b.priority);
      alternatives[0].health = alternatives[0].health === "offline" ? "degraded" : alternatives[0].health;
    }
  }

  private recoverProviderIfCooldownElapsed(status: ProviderStatus): void {
    if (!status.cooldownUntil) {
      return;
    }

    const until = new Date(status.cooldownUntil).getTime();
    if (Date.now() >= until) {
      status.active = true;
      status.health = "degraded";
      status.cooldownUntil = undefined;
    }
  }

  private registerIntervalJob(id: string, intervalMs: number, handler: () => Promise<void>): void {
    const status: SchedulerJobStatus = {
      id,
      frequency: "interval",
      enabled: true,
      nextRunAt: addMs(new Date(), intervalMs).toISOString(),
      runCount: 0,
    };

    const job: SchedulerJobInternal = { status, handler, intervalMs };
    job.timerId = setInterval(async () => {
      await this.executeJob(job);
      status.nextRunAt = addMs(new Date(), intervalMs).toISOString();
    }, intervalMs);

    this.jobs.set(id, job);
  }

  private registerDailyJob(id: string, hourUtc: number, handler: () => Promise<void>): void {
    const status: SchedulerJobStatus = {
      id,
      frequency: "daily",
      enabled: true,
      runCount: 0,
      nextRunAt: nextDailyRun(hourUtc).toISOString(),
    };

    const job: SchedulerJobInternal = { status, handler, dailyHourUtc: hourUtc };

    const schedule = () => {
      const nextRun = nextDailyRun(hourUtc);
      status.nextRunAt = nextRun.toISOString();
      const delay = Math.max(1, nextRun.getTime() - Date.now());

      job.timeoutId = setTimeout(async () => {
        await this.executeJob(job);
        schedule();
      }, delay);
    };

    schedule();
    this.jobs.set(id, job);
  }

  private registerWeeklyJob(id: string, dayUtc: number, hourUtc: number, handler: () => Promise<void>): void {
    const status: SchedulerJobStatus = {
      id,
      frequency: "weekly",
      enabled: true,
      runCount: 0,
      nextRunAt: nextWeeklyRun(dayUtc, hourUtc).toISOString(),
    };

    const job: SchedulerJobInternal = { status, handler, weeklyDayUtc: dayUtc, dailyHourUtc: hourUtc };

    const schedule = () => {
      const nextRun = nextWeeklyRun(dayUtc, hourUtc);
      status.nextRunAt = nextRun.toISOString();
      const delay = Math.max(1, nextRun.getTime() - Date.now());

      job.timeoutId = setTimeout(async () => {
        await this.executeJob(job);
        schedule();
      }, delay);
    };

    schedule();
    this.jobs.set(id, job);
  }

  private async executeJob(job: SchedulerJobInternal): Promise<void> {
    try {
      await job.handler();
      job.status.lastError = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : "job execution error";
      job.status.lastError = message;
      await this.log("error", "Scheduler job failed", {
        jobId: job.status.id,
        error: message,
      });
    } finally {
      job.status.lastRunAt = new Date().toISOString();
      job.status.runCount += 1;
    }
  }

  private async loadCatalog(): Promise<void> {
    try {
      const raw = await readFile(this.catalogPath, "utf8");
      const parsed = JSON.parse(raw) as CatalogFileSchema;

      this.datasetCatalog.clear();
      for (const entry of parsed.entries) {
        this.datasetCatalog.set(entry.datasetId, entry);
      }

      this.cursors.clear();
      for (const cursor of parsed.cursors) {
        this.cursors.set(`${cursor.kind}:${cursor.provider}`, cursor);
      }
    } catch {
      await mkdir(dirname(this.catalogPath), { recursive: true });
      await this.saveCatalog();
    }
  }

  private async saveCatalog(): Promise<void> {
    const payload: CatalogFileSchema = {
      updatedAt: new Date().toISOString(),
      entries: Array.from(this.datasetCatalog.values()),
      cursors: Array.from(this.cursors.values()),
    };

    await mkdir(dirname(this.catalogPath), { recursive: true });
    await writeFile(this.catalogPath, JSON.stringify(payload, null, 2));
  }

  private assertConsumerAccess(moduleId: string, scope: ConsumerAccessScope): void {
    const normalizedId = moduleId.trim();
    if (!normalizedId) {
      throw new Error("moduleId is required");
    }

    const consumer = this.consumerModules.get(normalizedId);
    if (!consumer || !consumer.enabled) {
      if (consumer) {
        consumer.blockedAttempts += 1;
      }
      throw new Error(`Module ${normalizedId} is not authorized to consume official datasets`);
    }

    if (!consumer.scopes.includes(scope)) {
      consumer.blockedAttempts += 1;
      throw new Error(`Module ${normalizedId} missing required scope: ${scope}`);
    }

    consumer.lastAccessAt = new Date().toISOString();
  }

  private publishStreamEvent(input: {
    type: OfficialStreamEventType;
    payload: unknown;
    kind?: DatasetKind;
    providerId?: string;
    moduleId?: string;
  }): void {
    const event: OfficialSourceStreamEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
      type: input.type,
      kind: input.kind,
      providerId: input.providerId,
      moduleId: input.moduleId,
      payload: input.payload,
    };

    this.streamEvents.push(event);
    if (this.streamEvents.length > 10_000) {
      this.streamEvents.splice(0, this.streamEvents.length - 10_000);
    }
  }

  private async log(level: "info" | "error", message: string, payload?: unknown): Promise<void> {
    await mkdir(dirname(this.logPath), { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      payload: payload ?? {},
    };

    await appendFile(this.logPath, `${JSON.stringify(entry)}\n`, "utf8");
  }
}
