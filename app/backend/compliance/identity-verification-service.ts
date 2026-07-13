import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { backendDatabase } from "@/app/backend/core/database";
import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { emailNotificationService } from "@/app/backend/notifications";
import {
  addIdentityVerificationAccessLog,
  countIdentityVerificationRequestsByStatus,
  createIdentityVerificationId,
  getIdentityVerificationRetentionPolicy,
  getIdentityVerificationRequestById,
  getIdentityVerificationRequestByUserId,
  listAllIdentityVerificationAccessLogs,
  listIdentityVerificationRequests,
  listIdentityVerificationRequirements,
  saveIdentityVerificationRequirements,
  saveIdentityVerificationRetentionPolicy,
  upsertIdentityVerificationRequest,
  type IdentityVerificationAccessLogRecord,
  type IdentityVerificationFileRecord,
  type IdentityVerificationRequestRecord,
  type IdentityVerificationRetentionPolicy,
  type IdentityVerificationServiceKey,
  type IdentityVerificationSide,
  type IdentityVerificationStatus,
} from "@/app/backend/core/local-identity-verification-store";

export type IdentityVerificationDocumentInput = {
  side: IdentityVerificationSide;
  fileName: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  buffer: Buffer;
};

export type IdentityVerificationSubmissionInput = {
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string | null;
  declarationAccepted: boolean;
  declarationAuthorizedUse: boolean;
  frontDocument: IdentityVerificationDocumentInput;
  backDocument: IdentityVerificationDocumentInput;
};

export type IdentityVerificationReviewInput = {
  requestId: string;
  adminId: string;
  adminEmail?: string | null;
  action: "approve" | "reject" | "request-new-document";
  observations?: string;
  rejectionReason?: string;
};

export type IdentityVerificationRequestSummary = IdentityVerificationRequestRecord & {
  documentCount: number;
};

const STORAGE_ROOT = path.join(process.cwd(), "data", "identity-verification");
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_ADMIN_EMAIL = "admin@carvipix.com";

function nowIso(): string {
  return new Date().toISOString();
}

function requestFolder(requestId: string): string {
  return path.join(STORAGE_ROOT, requestId);
}

function sideExtension(mimeType: string): string {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

function normalizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getRetentionReferenceTimestamp(record: IdentityVerificationRequestRecord): number {
  return parseTimestamp(record.reviewedAt) || parseTimestamp(record.submittedAt) || parseTimestamp(record.updatedAt) || parseTimestamp(record.createdAt);
}

function getRequestRetentionDays(policy: IdentityVerificationRetentionPolicy, status: IdentityVerificationStatus): number {
  switch (status) {
    case "approved":
      return policy.approvedDays;
    case "rejected":
      return policy.rejectedDays;
    case "canceled":
      return policy.canceledDays;
    case "pending":
      return policy.pendingDays;
    default:
      return policy.pendingDays;
  }
}

export function buildWatermarkSvg(params: { width: number; height: number; userName: string; when: Date }): string {
  const lines = [
    "CARVIPIX",
    "Solo para verificacion",
    `Usuario: ${params.userName}`,
    `Fecha: ${params.when.toLocaleDateString("es-ES")}`,
    `Hora: ${params.when.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
  ];

  const lineSpacing = 26;
  const boxWidth = 420;
  const boxHeight = lines.length * lineSpacing + 30;
  const x = Math.max(20, Math.floor(params.width - boxWidth - 24));
  const y = Math.max(20, Math.floor(params.height - boxHeight - 24));

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}">
    <defs>
      <filter id="blur"><feGaussianBlur stdDeviation="0.2" /></filter>
    </defs>
    <rect x="${x - 12}" y="${y - 12}" width="${boxWidth}" height="${boxHeight}" rx="18" fill="rgba(0,0,0,0.28)" stroke="rgba(212,175,55,0.55)" stroke-width="2"/>
    <g filter="url(#blur)" fill="rgba(255,255,255,0.92)" font-family="Arial, Helvetica, sans-serif">
      ${lines.map((line, index) => `<text x="${x}" y="${y + 22 + index * lineSpacing}" font-size="22" font-weight="700">${escapeXml(line)}</text>`).join("")}
    </g>
  </svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function sanitizeIdentityDocumentBuffer(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string; width: number; height: number }> {
  const pipeline = sharp(buffer, { failOnError: true }).rotate();

  if (mimeType === "image/png") {
    const output = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer({ resolveWithObject: true });
    return { buffer: output.data, mimeType: "image/png", width: output.info.width ?? 0, height: output.info.height ?? 0 };
  }

  if (mimeType === "image/webp") {
    const output = await pipeline.webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
    return { buffer: output.data, mimeType: "image/webp", width: output.info.width ?? 0, height: output.info.height ?? 0 };
  }

  const output = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  return { buffer: output.data, mimeType: "image/jpeg", width: output.info.width ?? 0, height: output.info.height ?? 0 };
}

function canLogicallyDeleteDocuments(record: IdentityVerificationRequestRecord, policy: IdentityVerificationRetentionPolicy, now: number): boolean {
  if (record.documentLifecycle !== "active") {
    return false;
  }

  if (record.status === "pending") {
    return now >= addDays(new Date(getRetentionReferenceTimestamp(record)), policy.pendingDays).getTime();
  }

  if (record.status === "approved" || record.status === "rejected" || record.status === "canceled") {
    return now >= addDays(new Date(getRetentionReferenceTimestamp(record)), getRequestRetentionDays(policy, record.status)).getTime();
  }

  return false;
}

function canPhysicallyDeleteDocuments(record: IdentityVerificationRequestRecord, policy: IdentityVerificationRetentionPolicy, now: number): boolean {
  if (!record.documentsDeletedAt || record.documentLifecycle !== "logical_deleted") {
    return false;
  }

  return now >= addDays(new Date(record.documentsDeletedAt), policy.purgeAfterLogicalDeleteDays).getTime();
}

function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(12) !== 0x49484452) {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8 ") {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunkType === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  if (chunkType === "VP8X") {
    const width = buffer.readUIntLE(24, 3) + 1;
    const height = buffer.readUIntLE(27, 3) + 1;
    return { width, height };
  }

  return null;
}

export function inspectIdentityDocument(buffer: Buffer, mimeType: string): { width: number; height: number } {
  if (mimeType === "image/png") {
    const dimensions = parsePngDimensions(buffer);
    if (!dimensions) throw new Error("PNG invalido");
    return dimensions;
  }

  if (mimeType === "image/webp") {
    const dimensions = parseWebpDimensions(buffer);
    if (!dimensions) throw new Error("WEBP invalido");
    return dimensions;
  }

  const dimensions = parseJpegDimensions(buffer);
  if (!dimensions) throw new Error("JPEG invalido");
  return dimensions;
}

export function validateIdentityDocument(file: { mimeType: string; byteSize: number; width: number; height: number }) {
  if (!ALLOWED_MIMES.has(file.mimeType)) {
    throw new Error("Formato de documento no permitido");
  }

  if (file.byteSize <= 0 || file.byteSize > MAX_BYTES) {
    throw new Error("El peso del archivo excede el limite permitido");
  }

  if (file.width < MIN_WIDTH || file.height < MIN_HEIGHT) {
    throw new Error(`La resolucion minima es ${MIN_WIDTH}x${MIN_HEIGHT}`);
  }
}

async function ensureStorageRoot() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

async function writeIdentityDocument(requestId: string, input: IdentityVerificationDocumentInput) {
  await ensureStorageRoot();
  const folder = requestFolder(requestId);
  await fs.mkdir(folder, { recursive: true });
  const filePath = path.join(folder, `${input.side}${sideExtension(input.mimeType)}`);
  await fs.writeFile(filePath, input.buffer);
  return filePath;
}

function buildFileRecord(input: IdentityVerificationDocumentInput, storagePath: string): IdentityVerificationFileRecord {
  return {
    side: input.side,
    fileName: normalizeFileName(input.fileName),
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    width: input.width,
    height: input.height,
    storagePath,
    sha256: crypto.createHash("sha256").update(input.buffer).digest("hex"),
    uploadedAt: nowIso(),
  };
}

async function persistRequest(record: IdentityVerificationRequestRecord) {
  if (!backendDatabase.enabled) {
    return upsertIdentityVerificationRequest(record);
  }

  await backendDatabase.query(
    `
    INSERT INTO identity_verification_requests (
      id, user_id, user_name, user_email, user_role, status, declaration_accepted, declaration_authorized_use,
      observations, rejection_reason, reviewed_by, reviewed_at, submitted_at, canceled_at, documents_deleted_at,
      documents_purged_at, document_lifecycle, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    )
    ON CONFLICT (id) DO UPDATE SET
      user_name = EXCLUDED.user_name,
      user_email = EXCLUDED.user_email,
      user_role = EXCLUDED.user_role,
      status = EXCLUDED.status,
      declaration_accepted = EXCLUDED.declaration_accepted,
      declaration_authorized_use = EXCLUDED.declaration_authorized_use,
      observations = EXCLUDED.observations,
      rejection_reason = EXCLUDED.rejection_reason,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = EXCLUDED.reviewed_at,
      submitted_at = EXCLUDED.submitted_at,
      canceled_at = EXCLUDED.canceled_at,
      documents_deleted_at = EXCLUDED.documents_deleted_at,
      documents_purged_at = EXCLUDED.documents_purged_at,
      document_lifecycle = EXCLUDED.document_lifecycle,
      updated_at = EXCLUDED.updated_at
    `,
    [
      record.id,
      record.userId,
      record.userName,
      record.userEmail,
      record.userRole,
      record.status,
      record.declarationAccepted,
      record.declarationAuthorizedUse,
      record.observations,
      record.rejectionReason,
      record.reviewedBy,
      record.reviewedAt,
      record.submittedAt,
      record.canceledAt,
      record.documentsDeletedAt,
      record.documentsPurgedAt,
      record.documentLifecycle,
      record.createdAt,
      record.updatedAt,
    ]
  );

  await backendDatabase.query(`DELETE FROM identity_verification_files WHERE request_id = $1`, [record.id]);
  for (const file of Object.values(record.files)) {
    if (!file) continue;
    await backendDatabase.query(
      `
      INSERT INTO identity_verification_files (
        id, request_id, side, file_name, mime_type, byte_size, width, height, storage_path, sha256, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [createIdentityVerificationId("ivf"), record.id, file.side, file.fileName, file.mimeType, file.byteSize, file.width, file.height, file.storagePath, file.sha256, file.uploadedAt]
    );
  }

  return record;
}

async function recordAudit(event: IdentityVerificationAccessLogRecord) {
  await addIdentityVerificationAccessLog(event);
  await recordCommercialAuditEvent({
    actorType: event.actorRole === "admin" ? "admin" : event.actorRole === "system" ? "system" : "client",
    userId: event.actorId,
    action: event.action,
    resource: `identity:${event.requestId}`,
    result: "success",
    metadata: { actorRole: event.actorRole, actorEmail: event.actorEmail },
  }).catch(() => null);
}

async function cleanupDocumentPath(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) {
    return;
  }

  await fs.unlink(storagePath).catch(() => null);
}

async function logDocumentLifecycleChange(record: IdentityVerificationRequestRecord, action: string, actorId: string, actorEmail: string | null) {
  await recordAudit({
    id: createIdentityVerificationId("log"),
    requestId: record.id,
    actorId,
    actorEmail,
    actorRole: "system",
    action,
    createdAt: nowIso(),
  });
}

async function updateRequestRecord(record: IdentityVerificationRequestRecord) {
  if (!backendDatabase.enabled) {
    return upsertIdentityVerificationRequest(record);
  }

  await persistRequest(record);
  return record;
}

async function applyRetentionForRecord(record: IdentityVerificationRequestRecord, policy: IdentityVerificationRetentionPolicy, now: number) {
  let next = record;
  const maintenanceIso = new Date(now).toISOString();

  if (record.status === "pending" && canLogicallyDeleteDocuments(record, policy, now)) {
    next = {
      ...next,
      status: "canceled",
      canceledAt: next.canceledAt ?? maintenanceIso,
      reviewedBy: next.reviewedBy ?? "system-retention",
      reviewedAt: next.reviewedAt ?? maintenanceIso,
      observations: next.observations || "Solicitud cancelada por politica de retencion",
      updatedAt: maintenanceIso,
    };

    await logDocumentLifecycleChange(next, "identity.verification.retention.cancelled", "system-retention", null);
  }

  if (canLogicallyDeleteDocuments(next, policy, now)) {
    next = {
      ...next,
      documentLifecycle: "logical_deleted",
      documentsDeletedAt: next.documentsDeletedAt ?? maintenanceIso,
      updatedAt: maintenanceIso,
    };

    await logDocumentLifecycleChange(next, "identity.verification.documents.logical_delete", "system-retention", null);
  }

  if (canPhysicallyDeleteDocuments(next, policy, now)) {
    await Promise.all(Object.values(next.files).map((file) => cleanupDocumentPath(file?.storagePath)));
    next = {
      ...next,
      documentLifecycle: "purged",
      documentsPurgedAt: next.documentsPurgedAt ?? maintenanceIso,
      updatedAt: maintenanceIso,
    };

    await logDocumentLifecycleChange(next, "identity.verification.documents.purged", "system-retention", null);
  }

  if (next !== record) {
    await updateRequestRecord(next);
  }

  return next;
}

export async function applyIdentityVerificationRetentionPolicy() {
  const policy = await getIdentityVerificationRetentionPolicy();
  const requests = await listIdentityVerificationRequests();
  const now = Date.now();

  for (const request of requests) {
    await applyRetentionForRecord(request, policy, now);
  }
}

function mapStatusToLabel(status: IdentityVerificationStatus): string {
  if (status === "approved") return "Verificado";
  if (status === "pending") return "Pendiente";
  if (status === "rejected") return "Rechazado";
  return "No iniciado";
}

export async function getIdentityVerificationStatus(userId: string) {
  await applyIdentityVerificationRetentionPolicy();
  const request = await getIdentityVerificationRequestByUserId(userId);
  const requirements = await listIdentityVerificationRequirements();
  return {
    request,
    status: request?.status ?? "not_started",
    statusLabel: mapStatusToLabel((request?.status ?? "not_started") as IdentityVerificationStatus),
    requirements,
  };
}

export async function submitIdentityVerification(input: IdentityVerificationSubmissionInput) {
  await applyIdentityVerificationRetentionPolicy();
  const current = await getIdentityVerificationRequestByUserId(input.userId);
  if (current?.status === "approved") {
    throw new Error("La identidad ya fue verificada. Un administrador debe autorizar un nuevo intento.");
  }

  validateIdentityDocument(input.frontDocument);
  validateIdentityDocument(input.backDocument);

  const sanitizedFront = await sanitizeIdentityDocumentBuffer(input.frontDocument.buffer, input.frontDocument.mimeType);
  const sanitizedBack = await sanitizeIdentityDocumentBuffer(input.backDocument.buffer, input.backDocument.mimeType);

  const requestId = current?.id ?? createIdentityVerificationId("idv");
  const frontDocument = { ...input.frontDocument, ...sanitizedFront, fileName: input.frontDocument.fileName };
  const backDocument = { ...input.backDocument, ...sanitizedBack, fileName: input.backDocument.fileName };
  const frontPath = await writeIdentityDocument(requestId, frontDocument);
  const backPath = await writeIdentityDocument(requestId, backDocument);

  const record: IdentityVerificationRequestRecord = {
    id: requestId,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    userRole: input.userRole || "client",
    status: "pending",
    declarationAccepted: input.declarationAccepted,
    declarationAuthorizedUse: input.declarationAuthorizedUse,
    observations: current?.observations ?? "",
    rejectionReason: "",
    reviewedBy: null,
    reviewedAt: null,
    submittedAt: nowIso(),
    createdAt: current?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    canceledAt: null,
    documentsDeletedAt: null,
    documentsPurgedAt: null,
    documentLifecycle: "active",
    files: {
      front: buildFileRecord(frontDocument, frontPath),
      back: buildFileRecord(backDocument, backPath),
    },
  };

  await persistRequest(record);
  await recordAudit({
    id: createIdentityVerificationId("log"),
    requestId,
    actorId: input.userId,
    actorEmail: input.userEmail,
    actorRole: input.userRole || "client",
    action: "identity.verification.submitted",
    createdAt: nowIso(),
  });

  await emailNotificationService.sendIdentityVerificationReceived({
    recipientEmail: input.userEmail,
    recipientName: input.userName,
  }).catch(() => null);

  return record;
}

export async function reviewIdentityVerification(input: IdentityVerificationReviewInput) {
  await applyIdentityVerificationRetentionPolicy();
  const current = await getIdentityVerificationRequestById(input.requestId);
  if (!current) {
    throw new Error("No se encontro la solicitud");
  }

  const nextStatus: IdentityVerificationStatus = input.action === "approve" ? "approved" : input.action === "request-new-document" ? "pending" : "rejected";
  const rejectionReason = input.action === "approve" ? "" : (input.rejectionReason || input.observations || "Rechazado por administracion");

  const next: IdentityVerificationRequestRecord = {
    ...current,
    status: nextStatus,
    observations: input.observations ?? current.observations,
    rejectionReason,
    reviewedBy: input.adminId,
    reviewedAt: nowIso(),
    updatedAt: nowIso(),
    canceledAt: nextStatus === "canceled" ? nowIso() : current.canceledAt ?? null,
  };

  await persistRequest(next);
  await recordAudit({
    id: createIdentityVerificationId("log"),
    requestId: current.id,
    actorId: input.adminId,
    actorEmail: input.adminEmail ?? DEFAULT_ADMIN_EMAIL,
    actorRole: "admin",
    action: `identity.verification.${input.action}`,
    createdAt: nowIso(),
  });

  if (input.action === "approve") {
    await emailNotificationService.sendIdentityVerificationApproved({
      recipientEmail: current.userEmail,
      recipientName: current.userName,
    }).catch(() => null);
  } else if (input.action === "request-new-document") {
    await emailNotificationService.sendIdentityVerificationNewDocumentRequest({
      recipientEmail: current.userEmail,
      recipientName: current.userName,
      reason: rejectionReason,
    }).catch(() => null);
  } else {
    await emailNotificationService.sendIdentityVerificationRejected({
      recipientEmail: current.userEmail,
      recipientName: current.userName,
      reason: rejectionReason,
    }).catch(() => null);
  }

  return next;
}

export async function listIdentityVerificationAdminView() {
  await applyIdentityVerificationRetentionPolicy();
  const [requests, requirements, counts, accessLogs] = await Promise.all([
    listIdentityVerificationRequests(),
    listIdentityVerificationRequirements(),
    countIdentityVerificationRequestsByStatus(),
    listAllIdentityVerificationAccessLogs(100),
  ]);

  return {
    requests,
    requirements,
    counts,
    accessLogs,
  };
}

export async function updateIdentityVerificationRequirements(input: {
  requirements: Array<{ serviceKey: IdentityVerificationServiceKey; required: boolean }>;
  updatedBy: string | null;
}) {
  return saveIdentityVerificationRequirements(input.requirements, input.updatedBy);
}

export async function getIdentityVerificationRetentionPolicySnapshot() {
  return getIdentityVerificationRetentionPolicy();
}

export async function updateIdentityVerificationRetentionPolicy(input: IdentityVerificationRetentionPolicy) {
  return saveIdentityVerificationRetentionPolicy(input);
}

export async function getIdentityVerificationDocumentFile(requestId: string, side: IdentityVerificationSide) {
  await applyIdentityVerificationRetentionPolicy();
  const request = await getIdentityVerificationRequestById(requestId);
  const file = request?.files?.[side] ?? null;
  if (!request || !file || request.documentLifecycle !== "active") {
    return null;
  }

  const buffer = await fs.readFile(file.storagePath);
  const watermark = buildWatermarkSvg({ width: Math.max(file.width, 1), height: Math.max(file.height, 1), userName: request.userName, when: new Date() });
  const output = await sharp(buffer).composite([{ input: Buffer.from(watermark) }]).toBuffer({ resolveWithObject: true });
  return { request, file, buffer: output.data };
}

export async function logIdentityVerificationDocumentAccess(input: { requestId: string; actorId: string; actorEmail?: string | null; actorRole: string; action: string }) {
  await recordAudit({
    id: createIdentityVerificationId("log"),
    requestId: input.requestId,
    actorId: input.actorId,
    actorEmail: input.actorEmail ?? null,
    actorRole: input.actorRole,
    action: input.action,
    createdAt: nowIso(),
  });
}

export type { IdentityVerificationRequestSummary, IdentityVerificationRequirementRecord, IdentityVerificationStatus, IdentityVerificationServiceKey };
