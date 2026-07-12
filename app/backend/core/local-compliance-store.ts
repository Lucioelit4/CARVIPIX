import fs from "fs/promises";
import path from "path";

import {
  LEGAL_DOCUMENTS_BASE,
  MULTIMEDIA_VIDEOS_BASE,
  type LegalDocument,
  type MultimediaVideo,
} from "@/app/lib/legal/compliance-catalog";

export type LegalAcceptanceRecord = {
  id: string;
  userId: string;
  documentSlug: string;
  documentVersion: string;
  acceptedAt: string;
  source: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type AdminAuditLogRecord = {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type LocalComplianceStore = {
  legalDocuments: LegalDocument[];
  videos: MultimediaVideo[];
  acceptances: LegalAcceptanceRecord[];
  adminAuditLogs: AdminAuditLogRecord[];
};

const STORE_PATH = path.join(process.cwd(), "data", "compliance-state.json");

function nowIso() {
  return new Date().toISOString();
}

export function createComplianceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function blankStore(): LocalComplianceStore {
  return {
    legalDocuments: LEGAL_DOCUMENTS_BASE,
    videos: MULTIMEDIA_VIDEOS_BASE,
    acceptances: [],
    adminAuditLogs: [],
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<LocalComplianceStore> {
  await ensureStoreDir();

  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = (JSON.parse(raw) as Partial<LocalComplianceStore>) ?? {};
    return {
      ...blankStore(),
      ...parsed,
      legalDocuments: Array.isArray(parsed.legalDocuments) ? parsed.legalDocuments : LEGAL_DOCUMENTS_BASE,
      videos: Array.isArray(parsed.videos) ? parsed.videos : MULTIMEDIA_VIDEOS_BASE,
      acceptances: Array.isArray(parsed.acceptances) ? parsed.acceptances : [],
      adminAuditLogs: Array.isArray(parsed.adminAuditLogs) ? parsed.adminAuditLogs : [],
    };
  } catch {
    const store = blankStore();
    await writeStore(store);
    return store;
  }
}

async function writeStore(store: LocalComplianceStore) {
  await ensureStoreDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getLocalLegalDocuments() {
  const store = await readStore();
  return store.legalDocuments;
}

export async function saveLocalLegalDocuments(nextDocuments: LegalDocument[]) {
  const store = await readStore();
  store.legalDocuments = nextDocuments;
  await writeStore(store);
  return store.legalDocuments;
}

export async function getLocalVideos() {
  const store = await readStore();
  return store.videos;
}

export async function saveLocalVideos(nextVideos: MultimediaVideo[]) {
  const store = await readStore();
  store.videos = nextVideos;
  await writeStore(store);
  return store.videos;
}

export async function addLocalAcceptance(record: LegalAcceptanceRecord) {
  const store = await readStore();
  store.acceptances = [record, ...store.acceptances].slice(0, 10000);
  await writeStore(store);
  return record;
}

export async function listLocalAcceptancesByUser(userId: string) {
  const store = await readStore();
  return store.acceptances.filter((item) => item.userId === userId).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
}

export async function addLocalAdminAuditLog(log: AdminAuditLogRecord) {
  const store = await readStore();
  store.adminAuditLogs = [log, ...store.adminAuditLogs].slice(0, 10000);
  await writeStore(store);
  return log;
}

export async function listLocalAdminAuditLogs(limit = 80) {
  const store = await readStore();
  return store.adminAuditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.max(1, limit));
}

export function buildLocalComplianceMetadata() {
  return {
    capturedAt: nowIso(),
  };
}
