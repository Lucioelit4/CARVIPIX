import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile, appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";

import type {
  MemoryCategory,
  MemoryEvent,
  MemoryEventType,
  MemoryIntegrityReport,
  MemoryRecord,
  MemorySearchFilters,
  MemorySearchResult,
  MemorySnapshotMeta,
  MemoryStatistics,
  MemoryStatus,
  MemoryTimelineItem,
  VersionComparisonResult,
} from "./types";

type RememberInput = {
  id?: string;
  sourceId?: string;
  version?: number;
  tags?: string[];
  searchableText?: string;
  status?: MemoryStatus;
  payload: Record<string, unknown>;
};

type SnapshotPayload = {
  snapshotId: string;
  label: string;
  createdAt: string;
  records: MemoryRecord[];
  events: MemoryEvent[];
};

type SearchCacheEntry = {
  value: MemorySearchResult;
  expiresAt: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function sortedObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortedObject(item));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      output[key] = sortedObject(input[key]);
    }

    return output;
  }

  return value;
}

function checksumOf(value: unknown): string {
  const serialized = JSON.stringify(sortedObject(value));
  return createHash("sha256").update(serialized).digest("hex");
}

function toSearchableText(input: RememberInput): string {
  const fromPayload = JSON.stringify(input.payload);
  const fromCustom = input.searchableText ?? "";
  const fromTags = (input.tags ?? []).join(" ");
  return `${fromCustom} ${fromTags} ${fromPayload}`.trim();
}

function clampLimit(limit: number | undefined, fallback = 100, max = 10_000): number {
  if (typeof limit === "undefined" || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.trunc(limit), max));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(filePath: string, payload: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID().slice(0, 6)}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
  await rm(tempPath, { force: true });
}

export class LearningMemoryRepository {
  private readonly rootDir: string;
  private readonly recordsPath: string;
  private readonly eventsPath: string;
  private readonly snapshotsDir: string;
  private readonly backupsDir: string;
  private readonly archivesDir: string;

  private readonly records = new Map<string, MemoryRecord>();
  private readonly events: MemoryEvent[] = [];
  private readonly byCategory = new Map<MemoryCategory, Set<string>>();
  private readonly byStatus = new Map<MemoryStatus, Set<string>>();
  private readonly byToken = new Map<string, Set<string>>();
  private readonly bySource = new Map<string, Set<string>>();
  private readonly cache = new Map<string, SearchCacheEntry>();
  private lastEventHash = "GENESIS";

  constructor(rootDir?: string) {
    this.rootDir = rootDir ?? join(process.cwd(), "data", "learning-engine", "memory");
    this.recordsPath = join(this.rootDir, "records.json");
    this.eventsPath = join(this.rootDir, "events.ndjson");
    this.snapshotsDir = join(this.rootDir, "snapshots");
    this.backupsDir = join(this.rootDir, "backups");
    this.archivesDir = join(this.rootDir, "archives");
  }

  async bootstrap(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await mkdir(this.snapshotsDir, { recursive: true });
    await mkdir(this.backupsDir, { recursive: true });
    await mkdir(this.archivesDir, { recursive: true });

    if (await fileExists(this.recordsPath)) {
      const raw = await readFile(this.recordsPath, "utf8");
      const list = JSON.parse(raw) as MemoryRecord[];
      this.records.clear();
      for (const record of list) {
        this.records.set(record.id, record);
      }
    } else {
      await writeJsonAtomic(this.recordsPath, []);
    }

    if (await fileExists(this.eventsPath)) {
      const raw = await readFile(this.eventsPath, "utf8");
      this.events.length = 0;
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        this.events.push(JSON.parse(trimmed) as MemoryEvent);
      }

      const last = this.events[this.events.length - 1];
      this.lastEventHash = last?.eventHash ?? "GENESIS";
    }

    this.rebuildIndices();
  }

  async remember(category: MemoryCategory, input: RememberInput): Promise<MemoryRecord> {
    const id = input.id ?? randomUUID();
    const existing = this.records.get(id);
    const record: MemoryRecord = {
      id,
      sourceId: input.sourceId?.trim() || existing?.sourceId || id,
      category,
      status: input.status ?? existing?.status ?? "active",
      version: input.version ?? existing?.version ?? 1,
      tags: Array.from(new Set((input.tags ?? existing?.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      searchableText: toSearchableText(input),
      payload: input.payload,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      checksum: "",
    };

    record.checksum = checksumOf({ ...record, checksum: undefined });

    if (existing) {
      this.deindexRecord(existing);
    }

    this.records.set(record.id, record);
    this.indexRecord(record);
    this.clearCache();

    await this.persistRecords();
    await this.appendEvent("upsert", record.id, {
      category,
      sourceId: record.sourceId,
      version: record.version,
      status: record.status,
    });

    return record;
  }

  async rememberKnowledgeCard(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("knowledge-card", input);
  }

  async rememberEvidence(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("evidence", input);
  }

  async rememberExperiment(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("experiment", input);
  }

  async rememberHypothesis(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("hypothesis", input);
  }

  async rememberDecision(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("decision", input);
  }

  async rememberResult(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("result", input);
  }

  async rememberVersion(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("version", input);
  }

  async rememberWeight(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("weight", input);
  }

  async rememberCalibration(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("calibration", input);
  }

  async rememberImprovement(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("improvement", input);
  }

  async rememberError(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("error", input);
  }

  async rememberConfidence(input: RememberInput): Promise<MemoryRecord> {
    return this.remember("confidence", input);
  }

  async markStatus(recordId: string, status: MemoryStatus, reason?: string): Promise<MemoryRecord> {
    const record = this.records.get(recordId);
    if (!record) {
      throw new Error(`Record not found: ${recordId}`);
    }

    this.deindexRecord(record);
    record.status = status;
    record.updatedAt = nowIso();
    record.checksum = checksumOf({ ...record, checksum: undefined });
    this.indexRecord(record);
    this.clearCache();

    await this.persistRecords();
    await this.appendEvent("status-change", recordId, { status, reason: reason ?? "" });
    return record;
  }

  async markLogicallyDeleted(recordId: string, reason?: string): Promise<MemoryRecord> {
    return this.markStatus(recordId, "logically-deleted", reason);
  }

  getById(recordId: string): MemoryRecord | null {
    return this.records.get(recordId) ?? null;
  }

  search(query: string, filters?: MemorySearchFilters): MemorySearchResult {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = JSON.stringify({ normalizedQuery, filters: filters ?? {} });
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const limit = clampLimit(filters?.limit, 100, 5000);
    let candidateIds: Set<string>;

    if (!normalizedQuery) {
      candidateIds = new Set(this.records.keys());
    } else {
      const tokens = tokenize(normalizedQuery);
      if (tokens.length === 0) {
        candidateIds = new Set(this.records.keys());
      } else {
        const tokenSets = tokens.map((token) => this.byToken.get(token) ?? new Set<string>());
        const [first, ...rest] = tokenSets;
        candidateIds = new Set(first);
        for (const tokenSet of rest) {
          for (const id of Array.from(candidateIds.values())) {
            if (!tokenSet.has(id)) {
              candidateIds.delete(id);
            }
          }
        }
      }
    }

    const results = Array.from(candidateIds.values())
      .map((id) => this.records.get(id))
      .filter((record): record is MemoryRecord => Boolean(record))
      .filter((record) => this.applyFilters(record, filters))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);

    const response: MemorySearchResult = {
      records: results,
      total: results.length,
    };

    this.cache.set(cacheKey, {
      value: response,
      expiresAt: Date.now() + 30_000,
    });

    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    return response;
  }

  getKnowledgeHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("knowledge-card", sourceId);
  }

  getEvidenceHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("evidence", sourceId);
  }

  getDecisionHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("decision", sourceId);
  }

  getExperimentHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("experiment", sourceId);
  }

  getCalibrationHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("calibration", sourceId);
  }

  getWeightHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("weight", sourceId);
  }

  getVersionHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("version", sourceId);
  }

  getConfidenceHistory(sourceId?: string): MemoryRecord[] {
    return this.getHistoryByCategory("confidence", sourceId);
  }

  compareVersions(sourceId: string, leftVersion: number, rightVersion: number): VersionComparisonResult {
    const left = this.findVersionRecord(sourceId, leftVersion);
    const right = this.findVersionRecord(sourceId, rightVersion);

    if (!left || !right) {
      throw new Error(`Missing versions for source ${sourceId}`);
    }

    const leftPayload = left.payload;
    const rightPayload = right.payload;
    const keys = new Set<string>([...Object.keys(leftPayload), ...Object.keys(rightPayload)]);

    const changedFields = Array.from(keys.values())
      .filter((key) => JSON.stringify(leftPayload[key]) !== JSON.stringify(rightPayload[key]))
      .sort();

    return {
      sourceId,
      leftVersion,
      rightVersion,
      changedFields,
      leftRecord: left,
      rightRecord: right,
    };
  }

  async createSnapshot(label: string): Promise<MemorySnapshotMeta> {
    const snapshotId = `snapshot_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const snapshotPath = join(this.snapshotsDir, `${snapshotId}.json.gz`);

    const payload: SnapshotPayload = {
      snapshotId,
      label,
      createdAt: nowIso(),
      records: Array.from(this.records.values()),
      events: [...this.events],
    };

    const binary = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"));
    await writeFile(snapshotPath, binary);

    await this.appendEvent("snapshot-created", undefined, {
      snapshotId,
      label,
      path: snapshotPath,
    });

    return {
      snapshotId,
      label,
      createdAt: payload.createdAt,
      recordCount: payload.records.length,
      eventCount: payload.events.length,
      path: snapshotPath,
    };
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshotPath = join(this.snapshotsDir, `${snapshotId}.json.gz`);
    if (!(await fileExists(snapshotPath))) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const binary = await readFile(snapshotPath);
    const payload = JSON.parse(gunzipSync(binary).toString("utf8")) as SnapshotPayload;

    this.records.clear();
    for (const record of payload.records) {
      this.records.set(record.id, record);
    }

    this.rebuildIndices();
    this.clearCache();
    await this.persistRecords();
    await this.appendEvent("snapshot-restored", undefined, {
      snapshotId,
      restoredRecordCount: payload.records.length,
      restoredEventCount: payload.events.length,
    });
  }

  async createBackup(label?: string): Promise<string> {
    const backupId = `backup_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const backupPath = join(this.backupsDir, `${backupId}.json.gz`);

    const payload = {
      backupId,
      label: label ?? "manual-backup",
      createdAt: nowIso(),
      records: Array.from(this.records.values()),
      events: [...this.events],
    };

    await writeFile(backupPath, gzipSync(Buffer.from(JSON.stringify(payload), "utf8")));
    await this.appendEvent("backup-created", undefined, {
      backupId,
      label: payload.label,
      path: backupPath,
    });

    return backupPath;
  }

  async runCompressionArchive(): Promise<string | null> {
    const candidates = Array.from(this.records.values()).filter(
      (record) => record.status === "archived" || record.status === "obsolete" || record.status === "logically-deleted",
    );

    if (candidates.length === 0) {
      return null;
    }

    const archiveId = `archive_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const archivePath = join(this.archivesDir, `${archiveId}.json.gz`);
    await writeFile(
      archivePath,
      gzipSync(Buffer.from(JSON.stringify({ archiveId, createdAt: nowIso(), records: candidates }), "utf8")),
    );

    await this.appendEvent("compression-run", undefined, {
      archiveId,
      archivedRecords: candidates.length,
      path: archivePath,
    });

    return archivePath;
  }

  verifyIntegrity(): MemoryIntegrityReport {
    const invalidRecordChecksums: string[] = [];
    const invalidEventChainIds: string[] = [];

    for (const record of this.records.values()) {
      const expected = checksumOf({ ...record, checksum: undefined });
      if (record.checksum !== expected) {
        invalidRecordChecksums.push(record.id);
      }
    }

    let prev = "GENESIS";
    for (const event of this.events) {
      const expected = checksumOf({
        id: event.id,
        type: event.type,
        ts: event.ts,
        recordId: event.recordId,
        details: event.details,
        prevHash: event.prevHash,
      });

      if (event.prevHash !== prev || event.eventHash !== expected) {
        invalidEventChainIds.push(event.id);
      }

      prev = event.eventHash;
    }

    return {
      checkedAt: nowIso(),
      recordCount: this.records.size,
      eventCount: this.events.length,
      invalidRecordChecksums,
      invalidEventChainIds,
      ok: invalidRecordChecksums.length === 0 && invalidEventChainIds.length === 0,
    };
  }

  rebuildIndices(): void {
    this.byCategory.clear();
    this.byStatus.clear();
    this.byToken.clear();
    this.bySource.clear();

    for (const record of this.records.values()) {
      this.indexRecord(record);
    }
  }

  async rebuildIndicesWithEvent(): Promise<void> {
    this.rebuildIndices();
    await this.appendEvent("index-rebuilt", undefined, {
      recordCount: this.records.size,
    });
  }

  getTimeline(limit = 500, fromTs?: string, toTs?: string): MemoryTimelineItem[] {
    const capped = clampLimit(limit, 500, 20_000);
    return this.events
      .filter((event) => {
        if (fromTs && event.ts < fromTs) {
          return false;
        }

        if (toTs && event.ts > toTs) {
          return false;
        }

        return true;
      })
      .slice(-capped)
      .map((event) => ({
        id: event.id,
        ts: event.ts,
        type: event.type,
        recordId: event.recordId,
        details: event.details,
      }));
  }

  async listSnapshots(): Promise<MemorySnapshotMeta[]> {
    const entries = await readdir(this.snapshotsDir, { withFileTypes: true });
    const snapshots: MemorySnapshotMeta[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json.gz")) {
        continue;
      }

      const snapshotPath = join(this.snapshotsDir, entry.name);
      const binary = await readFile(snapshotPath);
      const payload = JSON.parse(gunzipSync(binary).toString("utf8")) as SnapshotPayload;
      snapshots.push({
        snapshotId: payload.snapshotId,
        label: payload.label,
        createdAt: payload.createdAt,
        recordCount: payload.records.length,
        eventCount: payload.events.length,
        path: snapshotPath,
      });
    }

    return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listBackups(): Promise<string[]> {
    const entries = await readdir(this.backupsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json.gz"))
      .map((entry) => join(this.backupsDir, entry.name))
      .sort((a, b) => b.localeCompare(a));
  }

  getStatistics(): MemoryStatistics {
    const byCategory = {
      "knowledge-card": 0,
      evidence: 0,
      experiment: 0,
      hypothesis: 0,
      decision: 0,
      result: 0,
      version: 0,
      weight: 0,
      calibration: 0,
      improvement: 0,
      error: 0,
      confidence: 0,
    } satisfies Record<MemoryCategory, number>;

    const byStatus = {
      active: 0,
      obsolete: 0,
      archived: 0,
      "logically-deleted": 0,
    } satisfies Record<MemoryStatus, number>;

    for (const record of this.records.values()) {
      byCategory[record.category] += 1;
      byStatus[record.status] += 1;
    }

    const totalSnapshots = this.events.filter((event) => event.type === "snapshot-created").length;
    const totalBackups = this.events.filter((event) => event.type === "backup-created").length;

    return {
      totalRecords: this.records.size,
      totalEvents: this.events.length,
      totalSnapshots,
      totalBackups,
      byCategory,
      byStatus,
      cacheEntries: this.cache.size,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getHistoryByCategory(category: MemoryCategory, sourceId?: string): MemoryRecord[] {
    return Array.from(this.records.values())
      .filter((record) => record.category === category)
      .filter((record) => (sourceId ? record.sourceId === sourceId : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private findVersionRecord(sourceId: string, version: number): MemoryRecord | null {
    const records = this.bySource.get(sourceId);
    if (!records) {
      return null;
    }

    const matching = Array.from(records.values())
      .map((id) => this.records.get(id))
      .filter((record): record is MemoryRecord => Boolean(record))
      .filter((record) => record.version === version)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return matching[0] ?? null;
  }

  private applyFilters(record: MemoryRecord, filters?: MemorySearchFilters): boolean {
    if (!filters) {
      return true;
    }

    if (filters.category && record.category !== filters.category) {
      return false;
    }

    if (filters.status && record.status !== filters.status) {
      return false;
    }

    if (filters.sourceId && record.sourceId !== filters.sourceId) {
      return false;
    }

    if (filters.fromTs && record.updatedAt < filters.fromTs) {
      return false;
    }

    if (filters.toTs && record.updatedAt > filters.toTs) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      const set = new Set(record.tags);
      for (const tag of filters.tags) {
        if (!set.has(tag)) {
          return false;
        }
      }
    }

    return true;
  }

  private indexRecord(record: MemoryRecord): void {
    const categoryBucket = this.byCategory.get(record.category) ?? new Set<string>();
    categoryBucket.add(record.id);
    this.byCategory.set(record.category, categoryBucket);

    const statusBucket = this.byStatus.get(record.status) ?? new Set<string>();
    statusBucket.add(record.id);
    this.byStatus.set(record.status, statusBucket);

    const sourceBucket = this.bySource.get(record.sourceId) ?? new Set<string>();
    sourceBucket.add(record.id);
    this.bySource.set(record.sourceId, sourceBucket);

    for (const token of tokenize(record.searchableText)) {
      const tokenBucket = this.byToken.get(token) ?? new Set<string>();
      tokenBucket.add(record.id);
      this.byToken.set(token, tokenBucket);
    }
  }

  private deindexRecord(record: MemoryRecord): void {
    this.byCategory.get(record.category)?.delete(record.id);
    this.byStatus.get(record.status)?.delete(record.id);
    this.bySource.get(record.sourceId)?.delete(record.id);

    for (const token of tokenize(record.searchableText)) {
      this.byToken.get(token)?.delete(record.id);
    }
  }

  private async persistRecords(): Promise<void> {
    await writeJsonAtomic(this.recordsPath, Array.from(this.records.values()));
  }

  private async appendEvent(type: MemoryEventType, recordId: string | undefined, details: Record<string, unknown>): Promise<void> {
    const eventDraft = {
      id: `evt_${Date.now()}_${randomUUID().slice(0, 8)}`,
      type,
      ts: nowIso(),
      recordId,
      details,
      prevHash: this.lastEventHash,
    };

    const eventHash = checksumOf(eventDraft);
    const event: MemoryEvent = {
      ...eventDraft,
      eventHash,
    };

    this.lastEventHash = eventHash;
    this.events.push(event);

    await appendFile(this.eventsPath, `${JSON.stringify(event)}\n`, "utf8");
  }
}
