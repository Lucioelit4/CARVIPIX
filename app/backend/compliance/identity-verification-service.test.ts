import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { after, before } from "node:test";

import sharp from "sharp";

import {
  applyIdentityVerificationRetentionPolicy,
  buildWatermarkSvg,
  sanitizeIdentityDocumentBuffer,
} from "./identity-verification-service";
import {
  getIdentityVerificationRequestById,
  getIdentityVerificationStoreSnapshot,
  saveIdentityVerificationRetentionPolicy,
  upsertIdentityVerificationRequest,
  type IdentityVerificationRequestRecord,
} from "../core/local-identity-verification-store";

const STORE_PATH = path.join(process.cwd(), "data", "identity-verification-state.json");
const DOCUMENTS_ROOT = path.join(process.cwd(), "data", "identity-verification");
let storeBackup: string | null = null;

before(async () => {
  try {
    storeBackup = await fs.readFile(STORE_PATH, "utf8");
  } catch {
    storeBackup = null;
  }
});

after(async () => {
  if (storeBackup !== null) {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, storeBackup, "utf8");
  } else {
    await fs.rm(STORE_PATH, { force: true });
  }

  await fs.rm(DOCUMENTS_ROOT, { recursive: true, force: true });
});

test("sanitizeIdentityDocumentBuffer strips metadata and preserves resolution", async () => {
  const sourceBuffer = await sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: { r: 18, g: 24, b: 40 },
    },
  })
    .jpeg()
    .withMetadata({ density: 300 })
    .toBuffer();

  const sourceMeta = await sharp(sourceBuffer).metadata();
  assert.equal(sourceMeta.density, 300);

  const sanitized = await sanitizeIdentityDocumentBuffer(sourceBuffer, "image/jpeg");
  const sanitizedMeta = await sharp(sanitized.buffer).metadata();

  assert.equal(sanitized.mimeType, "image/jpeg");
  assert.equal(sanitized.width, 1600);
  assert.equal(sanitized.height, 1200);
  assert.equal(sanitizedMeta.width, 1600);
  assert.equal(sanitizedMeta.height, 1200);
  assert.notEqual(sanitizedMeta.density ?? null, 300);
  assert.ok(sanitized.buffer.byteLength > 0);
});

test("buildWatermarkSvg includes dynamic CARVIPIX verification text", () => {
  const svg = buildWatermarkSvg({
    width: 1200,
    height: 900,
    userName: "Ana Perez",
    when: new Date("2026-07-12T14:35:10.000Z"),
  });

  assert.match(svg, /CARVIPIX/);
  assert.match(svg, /Solo para verificacion/);
  assert.match(svg, /Ana Perez/);
  assert.match(svg, /Fecha:/);
  assert.match(svg, /Hora:/);
});

test("applyIdentityVerificationRetentionPolicy cancels stale pending records and purges documents", async () => {
  await saveIdentityVerificationRetentionPolicy({
    pendingDays: 0,
    approvedDays: 0,
    rejectedDays: 0,
    canceledDays: 0,
    purgeAfterLogicalDeleteDays: 0,
  });

  const requestId = `iv-test-${Date.now()}`;
  const frontPath = path.join(DOCUMENTS_ROOT, `${requestId}-front.jpg`);
  const backPath = path.join(DOCUMENTS_ROOT, `${requestId}-back.jpg`);

  await fs.mkdir(DOCUMENTS_ROOT, { recursive: true });
  await fs.writeFile(frontPath, Buffer.from("front-document"));
  await fs.writeFile(backPath, Buffer.from("back-document"));

  const now = new Date().toISOString();
  const request: IdentityVerificationRequestRecord = {
    id: requestId,
    userId: "user-retention",
    userName: "Usuario Retencion",
    userEmail: "retencion@example.com",
    userRole: "client",
    status: "pending",
    declarationAccepted: true,
    declarationAuthorizedUse: true,
    observations: "",
    rejectionReason: "",
    reviewedBy: null,
    reviewedAt: null,
    submittedAt: now,
    canceledAt: null,
    documentsDeletedAt: null,
    documentsPurgedAt: null,
    documentLifecycle: "active",
    createdAt: now,
    updatedAt: now,
    files: {
      front: {
        side: "front",
        fileName: "front.jpg",
        mimeType: "image/jpeg",
        byteSize: 15,
        width: 1600,
        height: 1200,
        storagePath: frontPath,
        sha256: "front-sha",
        uploadedAt: now,
      },
      back: {
        side: "back",
        fileName: "back.jpg",
        mimeType: "image/jpeg",
        byteSize: 14,
        width: 1600,
        height: 1200,
        storagePath: backPath,
        sha256: "back-sha",
        uploadedAt: now,
      },
    },
  };

  await upsertIdentityVerificationRequest(request);
  await applyIdentityVerificationRetentionPolicy();

  const stored = await getIdentityVerificationRequestById(requestId);
  assert.ok(stored);
  assert.equal(stored?.status, "canceled");
  assert.equal(stored?.documentLifecycle, "purged");
  assert.ok(stored?.canceledAt);
  assert.ok(stored?.documentsDeletedAt);
  assert.ok(stored?.documentsPurgedAt);

  await assert.rejects(fs.access(frontPath));
  await assert.rejects(fs.access(backPath));

  const snapshot = await getIdentityVerificationStoreSnapshot();
  assert.equal(snapshot.requests.some((item) => item.id === requestId), true);
});
