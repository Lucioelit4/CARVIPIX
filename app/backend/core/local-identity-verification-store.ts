import fs from "fs/promises";
import path from "path";

export type IdentityVerificationStatus = "not_started" | "pending" | "approved" | "rejected" | "canceled";
export type IdentityVerificationSide = "front" | "back";
export type IdentityVerificationServiceKey = "alerts" | "bot" | "capital-management" | "funding-program";
export type IdentityVerificationDocumentLifecycle = "active" | "logical_deleted" | "purged";

export type IdentityVerificationRetentionPolicy = {
  pendingDays: number;
  approvedDays: number;
  rejectedDays: number;
  canceledDays: number;
  purgeAfterLogicalDeleteDays: number;
};

export type IdentityVerificationFileRecord = {
  side: IdentityVerificationSide;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  storagePath: string;
  sha256: string;
  uploadedAt: string;
};

export type IdentityVerificationRequestRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  status: IdentityVerificationStatus;
  declarationAccepted: boolean;
  declarationAuthorizedUse: boolean;
  observations: string;
  rejectionReason: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  canceledAt: string | null;
  documentsDeletedAt: string | null;
  documentsPurgedAt: string | null;
  documentLifecycle: IdentityVerificationDocumentLifecycle;
  createdAt: string;
  updatedAt: string;
  files: Record<IdentityVerificationSide, IdentityVerificationFileRecord | null>;
};

export type IdentityVerificationRequirementRecord = {
  serviceKey: IdentityVerificationServiceKey;
  required: boolean;
  updatedBy: string | null;
  updatedAt: string;
};

export type IdentityVerificationAccessLogRecord = {
  id: string;
  requestId: string;
  actorId: string;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  createdAt: string;
};

type IdentityVerificationStore = {
  requests: IdentityVerificationRequestRecord[];
  requirements: IdentityVerificationRequirementRecord[];
  accessLogs: IdentityVerificationAccessLogRecord[];
  retentionPolicy: IdentityVerificationRetentionPolicy;
};

const STORE_PATH = path.join(process.cwd(), "data", "identity-verification-state.json");

export const DEFAULT_IDENTITY_VERIFICATION_RETENTION_POLICY: IdentityVerificationRetentionPolicy = {
  pendingDays: 30,
  approvedDays: 365,
  rejectedDays: 90,
  canceledDays: 30,
  purgeAfterLogicalDeleteDays: 30,
};

function nowIso(): string {
  return new Date().toISOString();
}

function blankStore(): IdentityVerificationStore {
  return {
    requests: [],
    requirements: [
      { serviceKey: "alerts", required: false, updatedBy: null, updatedAt: nowIso() },
      { serviceKey: "bot", required: false, updatedBy: null, updatedAt: nowIso() },
      { serviceKey: "capital-management", required: true, updatedBy: null, updatedAt: nowIso() },
      { serviceKey: "funding-program", required: true, updatedBy: null, updatedAt: nowIso() },
    ],
    accessLogs: [],
    retentionPolicy: DEFAULT_IDENTITY_VERIFICATION_RETENTION_POLICY,
  };
}

function normalizeRequest(record: Partial<IdentityVerificationRequestRecord>): IdentityVerificationRequestRecord {
  return {
    id: record.id ?? createIdentityVerificationId("idv"),
    userId: record.userId ?? "unknown",
    userName: record.userName ?? "Usuario",
    userEmail: record.userEmail ?? "unknown@example.com",
    userRole: record.userRole ?? "client",
    status: record.status ?? "pending",
    declarationAccepted: Boolean(record.declarationAccepted),
    declarationAuthorizedUse: Boolean(record.declarationAuthorizedUse),
    observations: record.observations ?? "",
    rejectionReason: record.rejectionReason ?? "",
    reviewedBy: record.reviewedBy ?? null,
    reviewedAt: record.reviewedAt ?? null,
    submittedAt: record.submittedAt ?? null,
    canceledAt: record.canceledAt ?? null,
    documentsDeletedAt: record.documentsDeletedAt ?? null,
    documentsPurgedAt: record.documentsPurgedAt ?? null,
    documentLifecycle: record.documentLifecycle ?? "active",
    createdAt: record.createdAt ?? nowIso(),
    updatedAt: record.updatedAt ?? nowIso(),
    files: {
      front: record.files?.front ?? null,
      back: record.files?.back ?? null,
    },
  };
}

function normalizeAccessLog(record: Partial<IdentityVerificationAccessLogRecord>): IdentityVerificationAccessLogRecord {
  return {
    id: record.id ?? createIdentityVerificationId("log"),
    requestId: record.requestId ?? "unknown",
    actorId: record.actorId ?? "unknown",
    actorEmail: record.actorEmail ?? null,
    actorRole: record.actorRole ?? "system",
    action: record.action ?? "unknown",
    createdAt: record.createdAt ?? nowIso(),
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<IdentityVerificationStore> {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = (JSON.parse(raw) as Partial<IdentityVerificationStore>) ?? {};
    const defaults = blankStore();
    return {
      ...defaults,
      ...parsed,
      requests: Array.isArray(parsed.requests) ? parsed.requests.map((item) => normalizeRequest(item as Partial<IdentityVerificationRequestRecord>)) : [],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : defaults.requirements,
      accessLogs: Array.isArray(parsed.accessLogs) ? parsed.accessLogs.map((item) => normalizeAccessLog(item as Partial<IdentityVerificationAccessLogRecord>)) : [],
      retentionPolicy: parsed.retentionPolicy ?? defaults.retentionPolicy,
    };
  } catch {
    const store = blankStore();
    await writeStore(store);
    return store;
  }
}

async function writeStore(store: IdentityVerificationStore) {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function createIdentityVerificationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getIdentityVerificationStoreSnapshot() {
  return readStore();
}

export async function upsertIdentityVerificationRequest(record: IdentityVerificationRequestRecord) {
  const store = await readStore();
  store.requests = [record, ...store.requests.filter((item) => item.id !== record.id && item.userId !== record.userId)];
  await writeStore(store);
  return record;
}

export async function updateIdentityVerificationRequest(record: IdentityVerificationRequestRecord) {
  return upsertIdentityVerificationRequest(record);
}

export async function listIdentityVerificationRequests() {
  const store = await readStore();
  return store.requests.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getIdentityVerificationRequestByUserId(userId: string) {
  const store = await readStore();
  return store.requests.find((item) => item.userId === userId) ?? null;
}

export async function getIdentityVerificationRequestById(requestId: string) {
  const store = await readStore();
  return store.requests.find((item) => item.id === requestId) ?? null;
}

export async function listIdentityVerificationRequirements() {
  const store = await readStore();
  return store.requirements.sort((left, right) => left.serviceKey.localeCompare(right.serviceKey));
}

export async function saveIdentityVerificationRequirements(
  requirements: Array<{ serviceKey: IdentityVerificationServiceKey; required: boolean }>,
  updatedBy: string | null
) {
  const store = await readStore();
  const merged = new Map(store.requirements.map((item) => [item.serviceKey, item]));

  for (const item of requirements) {
    merged.set(item.serviceKey, {
      serviceKey: item.serviceKey,
      required: Boolean(item.required),
      updatedBy,
      updatedAt: nowIso(),
    });
  }

  store.requirements = Array.from(merged.values()).sort((left, right) => left.serviceKey.localeCompare(right.serviceKey));
  await writeStore(store);
  return store.requirements;
}

export async function addIdentityVerificationAccessLog(log: IdentityVerificationAccessLogRecord) {
  const store = await readStore();
  store.accessLogs = [log, ...store.accessLogs];
  await writeStore(store);
  return log;
}

export async function listIdentityVerificationAccessLogs(requestId: string) {
  const store = await readStore();
  return store.accessLogs.filter((item) => item.requestId === requestId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listAllIdentityVerificationAccessLogs(limit = 100) {
  const store = await readStore();
  return store.accessLogs.sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, Math.max(1, limit));
}

export async function countIdentityVerificationRequestsByStatus() {
  const store = await readStore();
  return store.requests.reduce<Record<IdentityVerificationStatus, number>>(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { not_started: 0, pending: 0, approved: 0, rejected: 0, canceled: 0 }
  );
}

export async function getIdentityVerificationRetentionPolicy() {
  const store = await readStore();
  return store.retentionPolicy ?? DEFAULT_IDENTITY_VERIFICATION_RETENTION_POLICY;
}

export async function saveIdentityVerificationRetentionPolicy(policy: IdentityVerificationRetentionPolicy) {
  const store = await readStore();
  store.retentionPolicy = policy;
  await writeStore(store);
  return policy;
}
