import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { brotliCompressSync, brotliDecompressSync, gzipSync, gunzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";

import { InMemoryBackendCache } from "@/app/backend/core/cache";
import type {
  BenchmarkCaseResult,
  BenchmarkSuiteResult,
  CompressionCodec,
  DatasetLineageRecord,
  DataProviderAdapter,
  DataQuery,
  DataRecord,
  DatasetKind,
  IngestionCursor,
  IntegrityIssue,
  ProviderPullRequest,
  RepairAction,
  VersionRecord,
} from "./types";

type PartitionManifest = {
  checksum: string;
  recordCount: number;
  codec: CompressionCodec;
  updatedAt: string;
};

type QueryResultRow = Record<string, unknown>;
type QueryResult<T extends QueryResultRow> = { rows: T[] };
type PoolClientLike = {
  query<T extends QueryResultRow>(sql: string, params?: Array<string | number | null>): Promise<QueryResult<T>>;
};
type BackendDatabaseLike = {
  enabled: boolean;
  query<T extends QueryResultRow>(sql: string, params?: Array<string | number | null>): Promise<QueryResult<T>>;
  withTransaction<T>(runner: (client: PoolClientLike) => Promise<T>): Promise<T>;
};

let backendDatabasePromise: Promise<BackendDatabaseLike | null> | null = null;

async function resolveBackendDatabase(): Promise<BackendDatabaseLike | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  if (!backendDatabasePromise) {
    backendDatabasePromise = import("@/app/backend/core/database")
      .then((module) => module.backendDatabase as BackendDatabaseLike)
      .catch(() => null);
  }

  return backendDatabasePromise;
}

type IngestionResult = {
  version: VersionRecord;
  totalRecords: number;
  partitionsUpdated: string[];
};

function normalizeAsset(asset: string | undefined): string {
  return (asset && asset.trim().length > 0 ? asset.trim().toUpperCase() : "GLOBAL").replace(/[^A-Z0-9_-]/g, "_");
}

function stableSortAndDeduplicate(records: DataRecord[]): DataRecord[] {
  const byId = new Map<string, DataRecord>();
  for (const record of records) {
    byId.set(record.id, record);
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.ts === b.ts) {
      return a.id.localeCompare(b.id);
    }

    return a.ts - b.ts;
  });
}

function encodeWithCodec(payload: Buffer, codec: CompressionCodec): Buffer {
  if (codec === "gzip") {
    return gzipSync(payload);
  }

  if (codec === "brotli") {
    return brotliCompressSync(payload);
  }

  return payload;
}

function decodeWithCodec(payload: Buffer, codec: CompressionCodec): Buffer {
  if (codec === "gzip") {
    return gunzipSync(payload);
  }

  if (codec === "brotli") {
    return brotliDecompressSync(payload);
  }

  return payload;
}

function ndjsonString(records: DataRecord[]): string {
  return records.map((record) => JSON.stringify(record)).join("\n");
}

function parseNdjson(raw: string): DataRecord[] {
  if (!raw.trim()) {
    return [];
  }

  const lines = raw.split("\n");
  const parsed: DataRecord[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    parsed.push(JSON.parse(trimmed) as DataRecord);
  }

  return parsed;
}

function sha256OfText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function clampLimit(limit: number | undefined, fallback = 1000, max = 1_000_000): number {
  if (typeof limit === "undefined") {
    return fallback;
  }

  if (!Number.isFinite(limit)) {
    return fallback;
  }

  const normalized = Math.trunc(limit);
  return Math.max(1, Math.min(normalized, max));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFilesRecursive(root: string): Promise<string[]> {
  if (!(await fileExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const all: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFilesRecursive(fullPath);
      all.push(...nested);
      continue;
    }

    all.push(fullPath);
  }

  return all;
}

export class MultiProviderManager {
  private readonly providers = new Map<string, DataProviderAdapter>();

  register(adapter: DataProviderAdapter): void {
    this.providers.set(adapter.id, adapter);
  }

  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  listProviders(): DataProviderAdapter[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  async pullIncremental(request: ProviderPullRequest): Promise<{ records: DataRecord[]; cursors: IngestionCursor[] }> {
    const providers = this.listProviders().filter((provider) => provider.supports.includes(request.kind));
    const records: DataRecord[] = [];
    const cursors: IngestionCursor[] = [];

    for (const provider of providers) {
      const response = await provider.pullIncremental(request);
      for (const record of response.records) {
        records.push({ ...record, provider: provider.id });
      }

      if (response.nextCursor) {
        cursors.push({ kind: request.kind, provider: provider.id, cursor: response.nextCursor });
      }
    }

    return { records, cursors };
  }
}

class DatasetVersionControl {
  private readonly versionsByKind = new Map<DatasetKind, VersionRecord[]>();

  register(input: Omit<VersionRecord, "id" | "createdAt">): VersionRecord {
    const current = this.versionsByKind.get(input.kind) ?? [];
    const version: VersionRecord = {
      ...input,
      id: `ver_${Date.now()}_${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };

    current.push(version);
    this.versionsByKind.set(input.kind, current);
    return version;
  }

  latest(kind: DatasetKind): VersionRecord | null {
    const versions = this.versionsByKind.get(kind) ?? [];
    if (versions.length === 0) {
      return null;
    }

    return versions[versions.length - 1] ?? null;
  }

  list(kind: DatasetKind): VersionRecord[] {
    return [...(this.versionsByKind.get(kind) ?? [])];
  }
}

class DataLake {
  private readonly rootDir: string;
  private readonly codec: CompressionCodec;
  private readonly compressionThreshold: number;

  constructor(options?: { rootDir?: string; codec?: CompressionCodec; compressionThreshold?: number }) {
    this.rootDir = options?.rootDir ?? join(process.cwd(), "data", "data-platform", "lake");
    this.codec = options?.codec ?? "gzip";
    this.compressionThreshold = options?.compressionThreshold ?? 100_000;
  }

  private buildPartitionBasePath(kind: DatasetKind, provider: string, asset: string | undefined, ts: number): string {
    const date = new Date(ts);
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    return join(this.rootDir, kind, provider, normalizeAsset(asset), year, month);
  }

  private manifestPath(basePath: string): string {
    return `${basePath}.manifest.json`;
  }

  private rawDataPath(basePath: string): string {
    return `${basePath}.ndjson`;
  }

  private compressedDataPath(basePath: string): string {
    return `${basePath}.ndjson.${this.codec === "brotli" ? "br" : "gz"}`;
  }

  private async loadPartition(basePath: string): Promise<{ records: DataRecord[]; codec: CompressionCodec }> {
    const rawPath = this.rawDataPath(basePath);
    const compressedPath = this.compressedDataPath(basePath);

    if (await fileExists(rawPath)) {
      const raw = await readFile(rawPath, "utf8");
      return { records: parseNdjson(raw), codec: "none" };
    }

    if (await fileExists(compressedPath)) {
      const binary = await readFile(compressedPath);
      const decoded = decodeWithCodec(binary, this.codec).toString("utf8");
      return { records: parseNdjson(decoded), codec: this.codec };
    }

    return { records: [], codec: "none" };
  }

  private async writePartition(basePath: string, records: DataRecord[]): Promise<PartitionManifest> {
    const normalized = stableSortAndDeduplicate(records);
    const payload = ndjsonString(normalized);
    const checksum = sha256OfText(payload);

    await mkdir(dirname(basePath), { recursive: true });

    const useCompression = normalized.length >= this.compressionThreshold;
    const rawPath = this.rawDataPath(basePath);
    const compressedPath = this.compressedDataPath(basePath);

    if (useCompression) {
      const binary = encodeWithCodec(Buffer.from(payload, "utf8"), this.codec);
      await writeFile(compressedPath, binary);
      if (await fileExists(rawPath)) {
        await rm(rawPath, { force: true });
      }
    } else {
      await writeFile(rawPath, payload.length > 0 ? `${payload}\n` : "");
      if (await fileExists(compressedPath)) {
        await rm(compressedPath, { force: true });
      }
    }

    const manifest: PartitionManifest = {
      checksum,
      recordCount: normalized.length,
      codec: useCompression ? this.codec : "none",
      updatedAt: new Date().toISOString(),
    };

    await writeFile(this.manifestPath(basePath), JSON.stringify(manifest, null, 2));
    return manifest;
  }

  async ingest(kind: DatasetKind, records: DataRecord[]): Promise<IngestionResult> {
    if (records.length === 0) {
      const checksum = sha256OfText("[]");
      return {
        version: {
          id: `ver_${Date.now()}_empty`,
          kind,
          createdAt: new Date().toISOString(),
          recordCount: 0,
          partitionsUpdated: [],
          checksum,
        },
        totalRecords: 0,
        partitionsUpdated: [],
      };
    }

    const grouped = new Map<string, DataRecord[]>();

    for (const record of records) {
      const basePath = this.buildPartitionBasePath(kind, record.provider, record.asset, record.ts);
      const current = grouped.get(basePath) ?? [];
      current.push(record);
      grouped.set(basePath, current);
    }

    const partitionsUpdated: string[] = [];
    const checksums: string[] = [];
    let totalRecords = 0;

    for (const [basePath, incoming] of grouped.entries()) {
      const loaded = await this.loadPartition(basePath);
      const merged = stableSortAndDeduplicate([...loaded.records, ...incoming]);
      const manifest = await this.writePartition(basePath, merged);
      partitionsUpdated.push(basePath);
      checksums.push(manifest.checksum);
      totalRecords += incoming.length;
    }

    const checksum = sha256OfText(checksums.sort().join("|"));
    const version: VersionRecord = {
      id: `ver_${Date.now()}_${randomUUID().slice(0, 8)}`,
      kind,
      createdAt: new Date().toISOString(),
      recordCount: totalRecords,
      partitionsUpdated,
      checksum,
    };

    return { version, totalRecords, partitionsUpdated };
  }

  async query(query: DataQuery): Promise<DataRecord[]> {
    const files = await collectFilesRecursive(join(this.rootDir, query.kind));
    const partitions = files.filter((filePath) => filePath.endsWith(".ndjson") || filePath.endsWith(".ndjson.gz") || filePath.endsWith(".ndjson.br"));

    const all: DataRecord[] = [];

    for (const partitionPath of partitions) {
      const binary = await readFile(partitionPath);
      const text = partitionPath.endsWith(".ndjson")
        ? binary.toString("utf8")
        : partitionPath.endsWith(".ndjson.gz")
          ? gunzipSync(binary).toString("utf8")
          : brotliDecompressSync(binary).toString("utf8");

      const records = parseNdjson(text);
      all.push(...records);
    }

    const filtered = all.filter((record) => {
      if (query.provider && record.provider !== query.provider) {
        return false;
      }

      if (query.asset && normalizeAsset(record.asset) !== normalizeAsset(query.asset)) {
        return false;
      }

      if (typeof query.fromTs === "number" && record.ts < query.fromTs) {
        return false;
      }

      if (typeof query.toTs === "number" && record.ts > query.toTs) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => a.ts - b.ts);
    if (query.sort === "desc") {
      filtered.reverse();
    }

    return filtered.slice(0, clampLimit(query.limit));
  }

  async verifyIntegrity(kind: DatasetKind): Promise<IntegrityIssue[]> {
    const files = await collectFilesRecursive(join(this.rootDir, kind));
    const partitions = files.filter((filePath) => filePath.endsWith(".ndjson") || filePath.endsWith(".ndjson.gz") || filePath.endsWith(".ndjson.br"));
    const issues: IntegrityIssue[] = [];

    for (const partitionPath of partitions) {
      const basePath = partitionPath.replace(/\.ndjson(\.gz|\.br)?$/, "");
      const manifestPath = this.manifestPath(basePath);
      if (!(await fileExists(manifestPath))) {
        issues.push({
          kind: "missing-manifest",
          partitionPath,
          detail: "No existe archivo manifest para la particion",
        });
        continue;
      }

      const manifestRaw = await readFile(manifestPath, "utf8");
      const manifest = JSON.parse(manifestRaw) as PartitionManifest;

      const binary = await readFile(partitionPath);
      const text = partitionPath.endsWith(".ndjson")
        ? binary.toString("utf8")
        : partitionPath.endsWith(".ndjson.gz")
          ? gunzipSync(binary).toString("utf8")
          : brotliDecompressSync(binary).toString("utf8");

      try {
        const records = parseNdjson(text);
        const normalized = ndjsonString(stableSortAndDeduplicate(records));
        const checksum = sha256OfText(normalized);
        if (checksum !== manifest.checksum) {
          issues.push({
            kind: "checksum-mismatch",
            partitionPath,
            detail: "Checksum en manifest no coincide con contenido actual",
          });
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "JSON invalido";
        issues.push({
          kind: "invalid-json",
          partitionPath,
          detail,
        });
      }
    }

    return issues;
  }

  async detectRepairs(kind: DatasetKind): Promise<RepairAction[]> {
    const files = await collectFilesRecursive(join(this.rootDir, kind));
    const partitions = files.filter((filePath) => filePath.endsWith(".ndjson") || filePath.endsWith(".ndjson.gz") || filePath.endsWith(".ndjson.br"));
    const actions: RepairAction[] = [];

    for (const partitionPath of partitions) {
      const binary = await readFile(partitionPath);
      const text = partitionPath.endsWith(".ndjson")
        ? binary.toString("utf8")
        : partitionPath.endsWith(".ndjson.gz")
          ? gunzipSync(binary).toString("utf8")
          : brotliDecompressSync(binary).toString("utf8");

      let records: DataRecord[] = [];
      try {
        records = parseNdjson(text);
      } catch {
        actions.push({ kind: "rebuild-partition", reason: "JSON corrupto detectado", partitionPath });
        continue;
      }

      const ids = new Set<string>();
      let duplicateFound = false;
      let outOfOrderFound = false;
      let invalidNumbersFound = false;
      let previousTs = Number.MIN_SAFE_INTEGER;

      for (const record of records) {
        if (ids.has(record.id)) {
          duplicateFound = true;
        }
        ids.add(record.id);

        if (record.ts < previousTs) {
          outOfOrderFound = true;
        }
        previousTs = record.ts;

        const numericFields = Object.values(record).filter((value) => typeof value === "number") as number[];
        if (numericFields.some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
          invalidNumbersFound = true;
        }
      }

      if (duplicateFound) {
        actions.push({ kind: "deduplicate", reason: "IDs duplicados detectados", partitionPath });
      }

      if (outOfOrderFound) {
        actions.push({ kind: "sort-by-ts", reason: "Registros fuera de orden temporal", partitionPath });
      }

      if (invalidNumbersFound) {
        actions.push({ kind: "drop-invalid-number", reason: "Valores numericos invalidos", partitionPath });
      }
    }

    return actions;
  }

  async applyRepairs(kind: DatasetKind): Promise<number> {
    const files = await collectFilesRecursive(join(this.rootDir, kind));
    const partitions = files.filter((filePath) => filePath.endsWith(".ndjson") || filePath.endsWith(".ndjson.gz") || filePath.endsWith(".ndjson.br"));
    let repairedPartitions = 0;

    for (const partitionPath of partitions) {
      const binary = await readFile(partitionPath);
      const text = partitionPath.endsWith(".ndjson")
        ? binary.toString("utf8")
        : partitionPath.endsWith(".ndjson.gz")
          ? gunzipSync(binary).toString("utf8")
          : brotliDecompressSync(binary).toString("utf8");

      let records: DataRecord[] = [];
      try {
        records = parseNdjson(text);
      } catch {
        records = [];
      }

      const validOnly = records.filter((record) => {
        const numericFields = Object.values(record).filter((value) => typeof value === "number") as number[];
        return numericFields.every((value) => Number.isFinite(value));
      });

      const repaired = stableSortAndDeduplicate(validOnly);
      const basePath = partitionPath.replace(/\.ndjson(\.gz|\.br)?$/, "");
      await this.writePartition(basePath, repaired);
      repairedPartitions += 1;
    }

    return repairedPartitions;
  }
}

class DataWarehouse {
  private schemaReady = false;

  async initialize(): Promise<void> {
    const database = await resolveBackendDatabase();
    if (!database?.enabled || this.schemaReady) {
      return;
    }

    await database.query(`
      CREATE TABLE IF NOT EXISTS data_platform_events (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        provider TEXT NOT NULL,
        asset TEXT,
        ts BIGINT NOT NULL,
        payload JSONB NOT NULL,
        ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (kind, id, provider)
      );

      CREATE INDEX IF NOT EXISTS idx_data_platform_kind_ts
        ON data_platform_events(kind, ts DESC);

      CREATE INDEX IF NOT EXISTS idx_data_platform_asset_provider_ts
        ON data_platform_events(asset, provider, ts DESC);

      CREATE INDEX IF NOT EXISTS idx_data_platform_kind_provider_asset_ts
        ON data_platform_events(kind, provider, asset, ts DESC);

      CREATE INDEX IF NOT EXISTS idx_data_platform_provider_kind_ts
        ON data_platform_events(provider, kind, ts DESC);

      CREATE INDEX IF NOT EXISTS idx_data_platform_ts_brin
        ON data_platform_events USING BRIN(ts);

      CREATE INDEX IF NOT EXISTS idx_data_platform_payload_gin
        ON data_platform_events USING GIN(payload);
    `);

    this.schemaReady = true;
  }

  async upsert(kind: DatasetKind, records: DataRecord[]): Promise<void> {
    const database = await resolveBackendDatabase();
    if (!database?.enabled || records.length === 0) {
      return;
    }

    await this.initialize();

    await database.withTransaction(async (client) => {
      for (const record of records) {
        await client.query(
          `
            INSERT INTO data_platform_events(kind, id, provider, asset, ts, payload)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            ON CONFLICT (kind, id, provider)
            DO UPDATE SET payload = EXCLUDED.payload, ts = EXCLUDED.ts, asset = EXCLUDED.asset
          `,
          [kind, record.id, record.provider, record.asset ?? null, record.ts, JSON.stringify(record)]
        );
      }
    });
  }

  async query(request: DataQuery): Promise<DataRecord[]> {
    const database = await resolveBackendDatabase();
    if (!database?.enabled) {
      return [];
    }

    await this.initialize();

    const params: Array<string | number | null> = [request.kind];
    const predicates = ["kind = $1"];

    if (request.provider) {
      params.push(request.provider);
      predicates.push(`provider = $${params.length}`);
    }

    if (request.asset) {
      params.push(request.asset);
      predicates.push(`asset = $${params.length}`);
    }

    if (typeof request.fromTs === "number") {
      params.push(request.fromTs);
      predicates.push(`ts >= $${params.length}`);
    }

    if (typeof request.toTs === "number") {
      params.push(request.toTs);
      predicates.push(`ts <= $${params.length}`);
    }

    params.push(clampLimit(request.limit));

    const order = request.sort === "desc" ? "DESC" : "ASC";
    const where = predicates.join(" AND ");

    const result = await database.query<{ payload: DataRecord }>(
      `SELECT payload FROM data_platform_events WHERE ${where} ORDER BY ts ${order} LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => row.payload);
  }
}

class QueryOptimizer {
  private readonly cache = new InMemoryBackendCache(30_000, 50_000);

  async execute(request: DataQuery, input: { lake: DataLake; warehouse: DataWarehouse }): Promise<DataRecord[]> {
    const cacheKey = JSON.stringify(request);
    const cached = this.cache.get<DataRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = request.mode === "aggregate"
      ? await input.warehouse.query(request)
      : await input.lake.query(request);

    this.cache.set(cacheKey, data);
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

class HistoricalReplayEngine {
  async replay(
    request: DataQuery,
    input: { lake: DataLake },
    onRecord: (record: DataRecord, index: number) => Promise<void> | void
  ): Promise<number> {
    const records = await input.lake.query({ ...request, sort: "asc", mode: "raw", limit: request.limit ?? 1_000_000 });
    for (let index = 0; index < records.length; index += 1) {
      await onRecord(records[index], index);
    }

    return records.length;
  }
}

class BenchmarkSuite {
  async run(platform: InstitutionalDataPlatform): Promise<BenchmarkSuiteResult> {
    const startedAt = new Date();
    const cases: BenchmarkCaseResult[] = [];

    const baseTs = Date.now() - 86_400_000;
    const synthetic: DataRecord[] = [];

    for (let i = 0; i < 10_000; i += 1) {
      synthetic.push({
        kind: "tick",
        id: `bm_${i}`,
        provider: "benchmark",
        asset: i % 2 === 0 ? "XAUUSD" : "EURUSD",
        ts: baseTs + i,
        bid: 2000 + i * 0.0001,
        ask: 2000.2 + i * 0.0001,
      });
    }

    const ingestStart = performance.now();
    await platform.ingest("tick", synthetic);
    const ingestEnd = performance.now();

    cases.push({
      caseName: "ingest-10k-ticks",
      elapsedMs: Math.round((ingestEnd - ingestStart) * 1000) / 1000,
      recordsProcessed: synthetic.length,
    });

    const queryStart = performance.now();
    const queried = await platform.query({ kind: "tick", asset: "XAUUSD", limit: 5000 });
    const queryEnd = performance.now();

    cases.push({
      caseName: "query-5k-ticks",
      elapsedMs: Math.round((queryEnd - queryStart) * 1000) / 1000,
      recordsProcessed: queried.length,
    });

    const replayStart = performance.now();
    let replayed = 0;
    await platform.replay({ kind: "tick", provider: "benchmark", limit: 2000 }, async () => {
      replayed += 1;
    });
    const replayEnd = performance.now();

    cases.push({
      caseName: "historical-replay-2k",
      elapsedMs: Math.round((replayEnd - replayStart) * 1000) / 1000,
      recordsProcessed: replayed,
    });

    const finishedAt = new Date();

    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      cases,
    };
  }
}

export class InstitutionalDataPlatform {
  readonly providers = new MultiProviderManager();
  readonly versionControl = new DatasetVersionControl();
  readonly lake: DataLake;
  readonly warehouse = new DataWarehouse();
  readonly optimizer = new QueryOptimizer();
  readonly replayEngine = new HistoricalReplayEngine();
  readonly benchmarkSuite = new BenchmarkSuite();
  private readonly lineageByVersionId = new Map<string, DatasetLineageRecord>();

  constructor(options?: { lakeRootDir?: string; compressionCodec?: CompressionCodec; compressionThreshold?: number }) {
    this.lake = new DataLake({
      rootDir: options?.lakeRootDir,
      codec: options?.compressionCodec,
      compressionThreshold: options?.compressionThreshold,
    });
  }

  async bootstrap(): Promise<void> {
    await this.warehouse.initialize();
  }

  async ingest(kind: DatasetKind, records: DataRecord[]): Promise<VersionRecord> {
    const normalized = records.filter((record) => record.kind === kind);
    const ingestion = await this.lake.ingest(kind, normalized);
    await this.warehouse.upsert(kind, normalized);

    const version = this.versionControl.register({
      kind,
      recordCount: ingestion.totalRecords,
      partitionsUpdated: ingestion.partitionsUpdated,
      checksum: ingestion.version.checksum,
    });

    const providerIds = Array.from(new Set(normalized.map((record) => record.provider))).sort();
    const assets = Array.from(new Set(normalized.map((record) => normalizeAsset(record.asset)))).sort();
    const fromTs = normalized.length === 0 ? 0 : Math.min(...normalized.map((record) => record.ts));
    const toTs = normalized.length === 0 ? 0 : Math.max(...normalized.map((record) => record.ts));

    const lineage: DatasetLineageRecord = {
      lineageId: `lin_${Date.now()}_${randomUUID().slice(0, 8)}`,
      versionId: version.id,
      kind,
      providerIds,
      assets,
      fromTs,
      toTs,
      recordCount: normalized.length,
      partitionCount: ingestion.partitionsUpdated.length,
      checksum: version.checksum,
      createdAt: new Date().toISOString(),
    };
    this.lineageByVersionId.set(version.id, lineage);

    return version;
  }

  async ingestFromProviders(request: ProviderPullRequest): Promise<{ version: VersionRecord; cursors: IngestionCursor[] }> {
    const pulled = await this.providers.pullIncremental(request);
    const version = await this.ingest(request.kind, pulled.records);
    return { version, cursors: pulled.cursors };
  }

  async query(request: DataQuery): Promise<DataRecord[]> {
    return this.optimizer.execute(request, { lake: this.lake, warehouse: this.warehouse });
  }

  async verifyIntegrity(kind: DatasetKind): Promise<IntegrityIssue[]> {
    return this.lake.verifyIntegrity(kind);
  }

  async detectRepairActions(kind: DatasetKind): Promise<RepairAction[]> {
    return this.lake.detectRepairs(kind);
  }

  async autoRepair(kind: DatasetKind): Promise<number> {
    this.optimizer.clearCache();
    return this.lake.applyRepairs(kind);
  }

  async replay(request: DataQuery, onRecord: (record: DataRecord, index: number) => Promise<void> | void): Promise<number> {
    return this.replayEngine.replay(request, { lake: this.lake }, onRecord);
  }

  async runBenchmarks(): Promise<BenchmarkSuiteResult> {
    return this.benchmarkSuite.run(this);
  }

  getLineageByVersion(versionId: string): DatasetLineageRecord | null {
    return this.lineageByVersionId.get(versionId) ?? null;
  }

  listLineage(kind?: DatasetKind, limit = 200): DatasetLineageRecord[] {
    const capped = Math.max(1, Math.min(Math.trunc(limit), 10_000));
    const items = Array.from(this.lineageByVersionId.values())
      .filter((entry) => (kind ? entry.kind === kind : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return items.slice(0, capped);
  }
}

export async function createTemporaryPlatform(): Promise<InstitutionalDataPlatform> {
  const tempRoot = join(tmpdir(), `carvipix-data-platform-${Date.now()}-${randomUUID().slice(0, 6)}`);
  const platform = new InstitutionalDataPlatform({
    lakeRootDir: tempRoot,
    compressionCodec: "gzip",
    compressionThreshold: 200,
  });

  await platform.bootstrap();
  return platform;
}
