export type MemoryStatus = "active" | "obsolete" | "archived" | "logically-deleted";

export type MemoryCategory =
  | "knowledge-card"
  | "evidence"
  | "experiment"
  | "hypothesis"
  | "decision"
  | "result"
  | "version"
  | "weight"
  | "calibration"
  | "improvement"
  | "error"
  | "confidence";

export interface MemoryRecord {
  id: string;
  sourceId: string;
  category: MemoryCategory;
  status: MemoryStatus;
  version: number;
  tags: string[];
  searchableText: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  checksum: string;
}

export type MemoryEventType =
  | "upsert"
  | "status-change"
  | "snapshot-created"
  | "snapshot-restored"
  | "backup-created"
  | "compression-run"
  | "index-rebuilt";

export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  ts: string;
  recordId?: string;
  details: Record<string, unknown>;
  prevHash: string;
  eventHash: string;
}

export interface MemorySearchFilters {
  category?: MemoryCategory;
  status?: MemoryStatus;
  tags?: string[];
  sourceId?: string;
  fromTs?: string;
  toTs?: string;
  limit?: number;
}

export interface MemorySearchResult {
  records: MemoryRecord[];
  total: number;
}

export interface MemorySnapshotMeta {
  snapshotId: string;
  label: string;
  createdAt: string;
  recordCount: number;
  eventCount: number;
  path: string;
}

export interface VersionComparisonResult {
  sourceId: string;
  leftVersion: number;
  rightVersion: number;
  changedFields: string[];
  leftRecord: MemoryRecord;
  rightRecord: MemoryRecord;
}

export interface MemoryIntegrityReport {
  checkedAt: string;
  recordCount: number;
  eventCount: number;
  invalidRecordChecksums: string[];
  invalidEventChainIds: string[];
  ok: boolean;
}

export interface MemoryStatistics {
  totalRecords: number;
  totalEvents: number;
  totalSnapshots: number;
  totalBackups: number;
  byCategory: Record<MemoryCategory, number>;
  byStatus: Record<MemoryStatus, number>;
  cacheEntries: number;
}

export interface MemoryTimelineItem {
  id: string;
  ts: string;
  type: MemoryEventType;
  recordId?: string;
  details: Record<string, unknown>;
}
