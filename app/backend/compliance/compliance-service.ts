import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import {
  addLocalAcceptance,
  addLocalAdminAuditLog,
  buildLocalComplianceMetadata,
  createComplianceId,
  getLocalLegalDocuments,
  getLocalVideos,
  listLocalAcceptancesByUser,
  listLocalAdminAuditLogs,
  saveLocalLegalDocuments,
  saveLocalVideos,
  type AdminAuditLogRecord,
} from "@/app/backend/core/local-compliance-store";
import {
  latestActiveLegalDocuments,
  activeVideos,
  LEGAL_DOCUMENTS_BASE,
  MULTIMEDIA_VIDEOS_BASE,
  type LegalDocument,
  type MultimediaVideo,
} from "@/app/lib/legal/compliance-catalog";

type LegalDocumentRow = {
  id: string;
  slug: string;
  title: string;
  route: string;
  version: string;
  updated_at: Date;
  author: string;
  status: LegalDocument["status"];
  related_modules: string[];
  required_before_payment: boolean;
};

type ComplianceVideoRow = {
  id: string;
  scope: MultimediaVideo["scope"];
  title: string;
  description: string;
  video_url: string;
  poster_url: string;
  active: boolean;
  updated_at: Date;
};

type LegalAcceptanceRow = {
  id: string;
  user_id: string;
  document_slug: string;
  document_version: string;
  accepted_at: Date;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  created_at: Date;
};

let seeded = false;

function toDateString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

async function ensureComplianceSeeded() {
  if (!backendDatabase.enabled || seeded) {
    return;
  }

  const existingDocuments = await backendDatabase.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM legal_documents");
  if (Number(existingDocuments.rows[0]?.total ?? "0") === 0) {
    for (const doc of LEGAL_DOCUMENTS_BASE) {
      await backendDatabase.query(
        `
        INSERT INTO legal_documents (id, slug, title, route, version, updated_at, author, status, related_modules, required_before_payment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          `${doc.slug}::${doc.version}`,
          doc.slug,
          doc.title,
          doc.route,
          doc.version,
          new Date(doc.updatedAt),
          doc.author,
          doc.status,
          JSON.stringify(doc.relatedModules),
          doc.requiredBeforePayment,
        ]
      );
    }
  }

  const existingVideos = await backendDatabase.query<{ total: string }>("SELECT COUNT(*)::text AS total FROM compliance_videos");
  if (Number(existingVideos.rows[0]?.total ?? "0") === 0) {
    for (const video of MULTIMEDIA_VIDEOS_BASE) {
      await backendDatabase.query(
        `
        INSERT INTO compliance_videos (id, scope, title, description, video_url, poster_url, active, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
        `,
        [video.id, video.scope, video.title, video.description, video.videoUrl, video.posterUrl, video.active, new Date(video.updatedAt)]
      );
    }
  }

  seeded = true;
}

function mapLegalDocumentRow(row: LegalDocumentRow): LegalDocument {
  return {
    slug: row.slug,
    title: row.title,
    route: row.route,
    version: row.version,
    updatedAt: toDateString(row.updated_at),
    author: row.author,
    status: row.status,
    relatedModules: Array.isArray(row.related_modules) ? row.related_modules : [],
    requiredBeforePayment: Boolean(row.required_before_payment),
  };
}

function mapVideoRow(row: ComplianceVideoRow): MultimediaVideo {
  const normalizedVideoUrl = row.id === "video-home-corporate"
    ? "/training-videos/step-1-que-es-forex.mp4"
    : row.id === "video-member-dashboard-guide"
      ? "/training-videos/step-2-aplicaciones.mp4"
      : row.video_url;

  const normalizedPosterUrl = row.id === "video-home-corporate" || row.id === "video-member-dashboard-guide"
    ? "/logo/logo carvipix.png"
    : row.poster_url;

  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    description: row.description,
    videoUrl: normalizedVideoUrl,
    posterUrl: normalizedPosterUrl,
    active: Boolean(row.active),
    updatedAt: toDateString(row.updated_at),
  };
}

export async function listLegalDocuments(): Promise<LegalDocument[]> {
  if (!backendDatabase.enabled) {
    return getLocalLegalDocuments();
  }

  await ensureComplianceSeeded();
  const result = await backendDatabase.query<LegalDocumentRow>(
    `
    SELECT id, slug, title, route, version, updated_at, author, status, related_modules, required_before_payment
    FROM legal_documents
    ORDER BY slug ASC, updated_at DESC
    `
  );

  return result.rows.map(mapLegalDocumentRow);
}

export async function listLatestActiveRequiredPaymentDocuments(): Promise<LegalDocument[]> {
  const documents = await listLegalDocuments();
  return latestActiveLegalDocuments(documents).filter((item) => item.requiredBeforePayment);
}

export async function saveLegalDocuments(documents: LegalDocument[]): Promise<LegalDocument[]> {
  const normalized = documents.map((doc) => ({
    ...doc,
    slug: String(doc.slug).trim().toLowerCase(),
    title: String(doc.title).trim(),
    route: String(doc.route).trim() || "/legal",
    version: String(doc.version).trim() || "1.0.0",
    updatedAt: toDateString(doc.updatedAt),
    author: String(doc.author).trim() || "CARVIPIX Legal",
    status: doc.status,
    relatedModules: Array.isArray(doc.relatedModules)
      ? doc.relatedModules.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
      : [],
    requiredBeforePayment: Boolean(doc.requiredBeforePayment),
  }));

  if (!backendDatabase.enabled) {
    return saveLocalLegalDocuments(normalized);
  }

  await ensureComplianceSeeded();
  await backendDatabase.withTransaction(async (client) => {
    await client.query("DELETE FROM legal_documents");

    for (const doc of normalized) {
      await client.query(
        `
        INSERT INTO legal_documents (id, slug, title, route, version, updated_at, author, status, related_modules, required_before_payment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
        `,
        [
          `${doc.slug}::${doc.version}`,
          doc.slug,
          doc.title,
          doc.route,
          doc.version,
          new Date(doc.updatedAt),
          doc.author,
          doc.status,
          JSON.stringify(doc.relatedModules),
          doc.requiredBeforePayment,
        ]
      );
    }
  });

  return listLegalDocuments();
}

export async function listVideos(): Promise<MultimediaVideo[]> {
  if (!backendDatabase.enabled) {
    return getLocalVideos();
  }

  await ensureComplianceSeeded();
  const result = await backendDatabase.query<ComplianceVideoRow>(
    `
    SELECT id, scope, title, description, video_url, poster_url, active, updated_at
    FROM compliance_videos
    ORDER BY updated_at DESC
    `
  );

  return result.rows.map(mapVideoRow);
}

export async function saveVideos(videos: MultimediaVideo[]): Promise<MultimediaVideo[]> {
  const normalized = videos.map((video) => ({
    ...video,
    id: String(video.id).trim(),
    scope: video.scope,
    title: String(video.title).trim(),
    description: String(video.description).trim(),
    videoUrl:
      video.id === "video-home-corporate"
        ? "/training-videos/step-1-que-es-forex.mp4"
        : video.id === "video-member-dashboard-guide"
          ? "/training-videos/step-2-aplicaciones.mp4"
          : String(video.videoUrl).trim(),
    posterUrl:
      video.id === "video-home-corporate" || video.id === "video-member-dashboard-guide"
        ? "/logo/logo carvipix.png"
        : String(video.posterUrl).trim(),
    active: Boolean(video.active),
    updatedAt: toDateString(video.updatedAt),
  }));

  if (!backendDatabase.enabled) {
    return saveLocalVideos(normalized);
  }

  await ensureComplianceSeeded();
  await backendDatabase.withTransaction(async (client) => {
    await client.query("DELETE FROM compliance_videos");
    for (const video of normalized) {
      await client.query(
        `
        INSERT INTO compliance_videos (id, scope, title, description, video_url, poster_url, active, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [video.id, video.scope, video.title, video.description, video.videoUrl, video.posterUrl, video.active, new Date(video.updatedAt)]
      );
    }
  });

  return listVideos();
}

export async function listActiveVideos(): Promise<MultimediaVideo[]> {
  const videos = await listVideos();
  return activeVideos(videos);
}

export async function getLatestAcceptancesByUser(userId: string): Promise<Map<string, string>> {
  if (!userId.trim()) {
    return new Map();
  }

  if (!backendDatabase.enabled) {
    const records = await listLocalAcceptancesByUser(userId);
    const result = new Map<string, string>();
    for (const record of records) {
      if (!result.has(record.documentSlug)) {
        result.set(record.documentSlug, record.documentVersion);
      }
    }
    return result;
  }

  const rows = await backendDatabase.query<LegalAcceptanceRow>(
    `
    SELECT id, user_id, document_slug, document_version, accepted_at, source, ip_address, user_agent
    FROM legal_acceptances
    WHERE user_id = $1
    ORDER BY accepted_at DESC
    `,
    [userId]
  );

  const map = new Map<string, string>();
  rows.rows.forEach((row) => {
    if (!map.has(row.document_slug)) {
      map.set(row.document_slug, row.document_version);
    }
  });

  return map;
}

export async function listMissingRequiredPaymentAcceptances(userId: string): Promise<LegalDocument[]> {
  const required = await listLatestActiveRequiredPaymentDocuments();
  const accepted = await getLatestAcceptancesByUser(userId);

  return required.filter((doc) => accepted.get(doc.slug) !== doc.version);
}

export async function recordUserLegalAcceptances(input: {
  userId: string;
  source: string;
  ipAddress: string | null;
  userAgent: string | null;
  documentSlugs?: string[];
}) {
  const required = await listLatestActiveRequiredPaymentDocuments();
  const allActive = latestActiveLegalDocuments(await listLegalDocuments());

  const selectedSlugs = Array.isArray(input.documentSlugs) && input.documentSlugs.length > 0
    ? new Set(input.documentSlugs.map((item) => String(item).trim().toLowerCase()).filter(Boolean))
    : new Set(required.map((item) => item.slug));

  const selectedDocs = allActive.filter((doc) => selectedSlugs.has(doc.slug));

  if (!backendDatabase.enabled) {
    const acceptedRecords = [] as Array<{ slug: string; version: string }>;
    for (const doc of selectedDocs) {
      await addLocalAcceptance({
        id: createComplianceId("acc"),
        userId: input.userId,
        documentSlug: doc.slug,
        documentVersion: doc.version,
        acceptedAt: new Date().toISOString(),
        source: input.source,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      acceptedRecords.push({ slug: doc.slug, version: doc.version });
    }

    return {
      accepted: acceptedRecords,
      metadata: buildLocalComplianceMetadata(),
    };
  }

  const accepted = [] as Array<{ slug: string; version: string }>;

  await backendDatabase.withTransaction(async (client) => {
    for (const doc of selectedDocs) {
      await client.query(
        `
        INSERT INTO legal_acceptances (id, user_id, document_slug, document_version, accepted_at, source, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
        `,
        [
          createComplianceId("acc"),
          input.userId,
          doc.slug,
          doc.version,
          input.source,
          input.ipAddress,
          input.userAgent,
        ]
      );

      accepted.push({ slug: doc.slug, version: doc.version });
    }
  });

  return {
    accepted,
    metadata: {
      capturedAt: new Date().toISOString(),
    },
  };
}

export async function appendAdminAuditLog(input: {
  actorId: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
}) {
  if (!backendDatabase.enabled) {
    const log: AdminAuditLogRecord = {
      id: createComplianceId("audit"),
      actorId: input.actorId,
      action: input.action,
      resource: input.resource,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };
    return addLocalAdminAuditLog(log);
  }

  await backendDatabase.query(
    `
    INSERT INTO commercial_audit_events (id, user_id, actor_type, action, resource, result, metadata, created_at)
    VALUES ($1, NULL, $2, $3, $4, 'success', $5::jsonb, NOW())
    `,
    [
      createComplianceId("audit"),
      "admin",
      input.action,
      input.resource,
      JSON.stringify({ ...input.metadata, actorId: input.actorId }),
    ]
  );

  return true;
}

export async function listComplianceAuditLogs(limit = 80) {
  if (!backendDatabase.enabled) {
    return listLocalAdminAuditLogs(limit);
  }

  const rows = await backendDatabase.query<AuditRow>(
    `
    SELECT id, action, resource, metadata, created_at
    FROM commercial_audit_events
    WHERE resource LIKE 'compliance:%'
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [Math.max(1, Math.min(300, limit))]
  );

  return rows.rows.map((row) => ({
    id: row.id,
    actorId: typeof row.metadata?.actorId === "string" ? row.metadata.actorId : "admin",
    action: row.action,
    resource: row.resource,
    metadata: row.metadata,
    createdAt: toDateString(row.created_at),
  }));
}
