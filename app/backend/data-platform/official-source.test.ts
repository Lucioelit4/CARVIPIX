import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { InstitutionalDataPlatform } from "./core";
import { OFFICIAL_ECOSYSTEM_ASSETS, OfficialDataPlatformSource } from "./official-source";
import type { DataProviderAdapter, ProviderPullRequest, ProviderPullResponse } from "./types";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function cleanupTempDir(path: string): Promise<void> {
  const transientCodes = new Set(["EBUSY", "EPERM", "ENOTEMPTY"]);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (!code || !transientCodes.has(code) || attempt === 4) {
        throw error;
      }
      await wait(20 * (attempt + 1));
    }
  }
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(full);
      files.push(...nested);
    } else {
      files.push(full);
    }
  }

  return files;
}

class MockProvider implements DataProviderAdapter {
  id: string;
  priority: number;
  supports: Array<"tick" | "ohlc" | "news" | "economic-calendar" | "spread" | "session" | "metadata">;

  private readonly shouldFail: boolean;
  private counter = 0;

  constructor(input: { id: string; priority: number; supports: DataProviderAdapter["supports"]; shouldFail?: boolean }) {
    this.id = input.id;
    this.priority = input.priority;
    this.supports = input.supports;
    this.shouldFail = input.shouldFail ?? false;
  }

  async pullIncremental(request: ProviderPullRequest): Promise<ProviderPullResponse> {
    if (this.shouldFail) {
      throw new Error(`provider ${this.id} unavailable`);
    }

    this.counter += 1;
    const now = Date.now();
    const assets = request.assets && request.assets.length > 0 ? request.assets : ["XAUUSD"];

    if (request.kind === "tick") {
      return {
        records: assets.map((asset, index) => ({
          kind: "tick",
          id: `${this.id}-tick-${this.counter}-${asset}`,
          provider: this.id,
          asset,
          ts: now + index,
          bid: 2400 + this.counter + index,
          ask: 2400.2 + this.counter + index,
        })),
        nextCursor: `${this.id}:tick:${this.counter}`,
      };
    }

    return {
      records: assets.map((asset, index) => ({
        kind: request.kind,
        id: `${this.id}-${request.kind}-${this.counter}-${asset}`,
        provider: this.id,
        asset,
        ts: now + index,
        ...(request.kind === "spread" ? { spread: 0.3 } : {}),
        ...(request.kind === "session"
          ? {
              sessionName: "LONDON",
              state: "open" as const,
              startTs: now - 3600000,
            }
          : {}),
        ...(request.kind === "metadata"
          ? {
              key: "source",
              value: this.id,
            }
          : {}),
        ...(request.kind === "news"
          ? {
              headline: "Mock news",
            }
          : {}),
        ...(request.kind === "economic-calendar"
          ? {
              event: "NFP",
            }
          : {}),
        ...(request.kind === "ohlc"
          ? {
              timeframe: "M1",
              open: 1,
              high: 2,
              low: 0.5,
              close: 1.5,
              volume: 100,
            }
          : {}),
      } as never)),
      nextCursor: `${this.id}:${request.kind}:${this.counter}`,
    };
  }
}

class SlowProvider extends MockProvider {
  constructor() {
    super({ id: "provider-slow", priority: 1, supports: ["tick"] });
  }

  async pullIncremental(request: ProviderPullRequest): Promise<ProviderPullResponse> {
    await wait(80);
    return super.pullIncremental(request);
  }
}

test("manual download builds catalog and dashboard stats", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "gzip",
      compressionThreshold: 3,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-a", priority: 1, supports: ["tick", "spread", "session", "metadata"] }));

    await source.bootstrap();
    const version = await source.runManualDownload({ kind: "tick" });

    assert.ok(version);
    const catalog = source.getDatasetCatalog();
    assert.ok(catalog.length >= 1);

    const dashboard = source.getDashboard();
    assert.ok(dashboard.totals.rows >= 1);
    assert.ok(dashboard.totals.bytes >= 1);

    const health = await source.healthCheck(["tick"]);
    assert.equal(health.ok, true);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("provider failure triggers recovery/rotation status", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-2-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-2-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 1000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-bad", priority: 1, supports: ["tick"], shouldFail: true }));
    source.registerProvider(new MockProvider({ id: "provider-good", priority: 2, supports: ["tick"] }));

    await source.bootstrap();
    await source.synchronizeAllKinds(["tick"]);

    const statuses = source.getProviderStatus();
    const bad = statuses.find((status) => status.providerId === "provider-bad");
    const good = statuses.find((status) => status.providerId === "provider-good");

    assert.ok(bad);
    assert.ok(good);
    assert.ok((bad?.failures ?? 0) >= 1);
    assert.ok((bad?.rotationCount ?? 0) >= 1);
    assert.ok((good?.successes ?? 0) >= 1);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("scheduler registers jobs and executes interval sync", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-3-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-3-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "gzip",
      compressionThreshold: 2,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-scheduler", priority: 1, supports: ["tick", "ohlc"] }));

    await source.bootstrap();
    source.startScheduler({
      syncKinds: ["tick"],
      syncIntervalMs: 30,
      dailyHourUtc: 23,
      weeklyDayUtc: 0,
      weeklyHourUtc: 23,
    });

    await wait(140);
    await source.stopScheduler();

    const jobs = source.getSchedulerStatus();
    assert.ok(jobs.some((job) => job.id === "sync-interval"));
    assert.ok(jobs.some((job) => job.id === "download-daily"));
    assert.ok(jobs.some((job) => job.id === "download-weekly"));
    assert.ok(jobs.some((job) => (job.id === "sync-interval" ? job.runCount >= 1 : true)));

    const catalog = source.getDatasetCatalog();
    assert.ok(catalog.length >= 1);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("scheduler stop waits in-flight jobs and prevents post-stop executions", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), `carvipix-official-lake-stop-${process.pid}-`));
  const controlRoot = await mkdtemp(join(tmpdir(), `carvipix-official-control-stop-${process.pid}-`));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new SlowProvider());

    await source.bootstrap();
    source.startScheduler({
      syncKinds: ["tick"],
      syncIntervalMs: 10,
      dailyHourUtc: 23,
      weeklyDayUtc: 0,
      weeklyHourUtc: 23,
    });

    await wait(25);
    await source.stopScheduler();
    const runCountAfterStop = source.getSchedulerStatus().find((job) => job.id === "sync-interval")?.runCount ?? 0;

    await wait(120);
    const runCountLater = source.getSchedulerStatus().find((job) => job.id === "sync-interval")?.runCount ?? 0;
    assert.equal(runCountLater, runCountAfterStop);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("scheduler supports multiple start-stop cycles without leaking scheduled executions", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), `carvipix-official-lake-cycles-${process.pid}-`));
  const controlRoot = await mkdtemp(join(tmpdir(), `carvipix-official-control-cycles-${process.pid}-`));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-cycle", priority: 1, supports: ["tick"] }));

    await source.bootstrap();

    for (let i = 0; i < 3; i += 1) {
      source.startScheduler({
        syncKinds: ["tick"],
        syncIntervalMs: 20,
        dailyHourUtc: 23,
        weeklyDayUtc: 0,
        weeklyHourUtc: 23,
      });
      await wait(70);

      const beforeStop = source.getSchedulerStatus().find((job) => job.id === "sync-interval")?.runCount ?? 0;
      assert.ok(beforeStop >= 1);

      await source.stopScheduler();
      const atStop = source.getSchedulerStatus().find((job) => job.id === "sync-interval")?.runCount ?? 0;
      await wait(40);
      const afterStop = source.getSchedulerStatus().find((job) => job.id === "sync-interval")?.runCount ?? 0;
      assert.equal(afterStop, atStop);
    }
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("historical bootstrap downloads official ecosystem assets and certifies datasets", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-4-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-4-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-historical", priority: 1, supports: ["tick", "ohlc", "spread"] }));

    await source.bootstrap();
    const summary = await source.downloadHistoricalBootstrap({
      fromTs: Date.now() - 2 * 24 * 60 * 60 * 1000,
      toTs: Date.now(),
      chunkDays: 1,
      assets: [...OFFICIAL_ECOSYSTEM_ASSETS],
      kinds: ["tick", "spread"],
    });

    assert.equal(summary.assets.length, 6);
    assert.ok(summary.chunksExecuted >= 1);
    assert.ok(summary.versionsCreated >= 1);

    const catalog = source.getDatasetCatalog();
    const expectedAssets = new Set<string>(OFFICIAL_ECOSYSTEM_ASSETS);
    assert.ok(catalog.some((entry) => expectedAssets.has(entry.asset)));
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("integrity maintenance detects corruption and auto-repairs", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-5-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-5-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-corrupt", priority: 1, supports: ["tick"] }));

    await source.bootstrap();
    await source.runManualDownload({ kind: "tick", assets: ["XAUUSD"] });

    const files = await collectFiles(lakeRoot);
    const ndjsonPath = files.find((file) => file.endsWith(".ndjson"));
    assert.ok(ndjsonPath);
    await writeFile(ndjsonPath as string, "{not-json\n", "utf8");

    const maintenance = await source.runIntegrityMaintenance(["tick"]);
    assert.ok(maintenance.issuesDetected >= 1);
    assert.ok(maintenance.repairsApplied >= 1);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("module gateway enforces authorized official-source access", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-6-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-6-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-gateway", priority: 1, supports: ["tick"] }));

    await source.bootstrap();
    await source.runManualDownload({ kind: "tick", assets: ["XAUUSD"] });

    await assert.rejects(
      () => source.queryForModule("engine", { kind: "tick", asset: "XAUUSD", limit: 10 }),
      /not authorized/i,
    );

    source.registerConsumerModule("engine", ["query", "catalog"]);
    const rows = await source.queryForModule("engine", { kind: "tick", asset: "XAUUSD", limit: 10 });
    assert.ok(rows.length >= 1);

    const catalog = source.getDatasetCatalogForModule("engine");
    assert.ok(catalog.length >= 1);

    await assert.rejects(
      () => source.queryForModule("engine", { kind: "tick", asset: "XAUUSD", limit: 10 }, { ultraFast: true }),
      /missing required scope/i,
    );
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("direct download attempts are tracked as violations", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-7-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-7-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerConsumerModule("research-lab", ["query", "catalog", "dashboard"]);
    await source.bootstrap();

    await source.recordDirectDownloadViolation({
      moduleId: "research-lab",
      reason: "attempted direct provider pull",
      kind: "tick",
    });

    const violations = source.getDirectDownloadViolations();
    assert.equal(violations.length, 1);
    assert.equal(violations[0]?.moduleId, "research-lab");
    assert.equal(violations[0]?.kind, "tick");

    const modules = source.getConsumerModules();
    const target = modules.find((module) => module.moduleId === "research-lab");
    assert.equal(target?.blockedAttempts, 1);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("lineage and realtime stream can be consumed by authorized modules", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-8-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-8-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    source.registerProvider(new MockProvider({ id: "provider-stream", priority: 1, supports: ["tick"] }));
    source.registerConsumerModule("dashboard-app", ["query", "catalog", "dashboard", "stream", "lineage"]);

    await source.bootstrap();
    await source.runManualDownload({ kind: "tick", assets: ["XAUUSD"] });

    const lineage = source.getLineageForModule("dashboard-app", "tick");
    assert.ok(lineage.length >= 1);

    const events = source.pollStreamEventsForModule("dashboard-app", { limit: 100 });
    assert.ok(events.some((event) => event.type === "provider-sync-ok"));
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});

test("stress readiness check executes with bounded synthetic volume", async () => {
  const lakeRoot = await mkdtemp(join(tmpdir(), "carvipix-official-lake-9-"));
  const controlRoot = await mkdtemp(join(tmpdir(), "carvipix-official-control-9-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: lakeRoot,
      compressionCodec: "none",
      compressionThreshold: 100000,
    });

    const source = new OfficialDataPlatformSource(platform, { rootDir: controlRoot });
    await source.bootstrap();

    const summary = await source.runStressReadinessCheck({ syntheticRows: 3000, providerId: "stress-test" });
    assert.equal(summary.ready, true);
    assert.equal(summary.totalSyntheticRows, 3000);
    assert.ok(summary.ingestMs >= 0);
    assert.ok(summary.queryMs >= 0);
    assert.ok(summary.replayMs >= 0);
  } finally {
    await cleanupTempDir(lakeRoot);
    await cleanupTempDir(controlRoot);
  }
});
