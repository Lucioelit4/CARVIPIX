import { randomUUID } from "crypto";
import { backendDatabase } from "@/app/backend/core/database";
import type {
  CommunityAnalysisFeed,
  CommunityEditorialControl,
  CommunityEditorialDecision,
  CommunityEvidenceEntry,
  CommunityEvidenceStore,
  CommunityMarketDossier,
  CommunityPublication,
} from "./types";
import { CommunityEditorialPolicy, type CommunityEditorialHistoryEntry, type CommunityEditorialHistoryReader } from "./editorial-policy";

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    await backendDatabase.query(`
      CREATE TABLE IF NOT EXISTS community_analysis_publications (
        publication_id TEXT PRIMARY KEY,
        dossier_id TEXT NOT NULL UNIQUE,
        analysis_id TEXT NOT NULL UNIQUE,
        asset TEXT NOT NULL,
        content JSONB NOT NULL,
        image_id TEXT NOT NULL,
        image_mime_type TEXT NOT NULL,
        image_base64 TEXT NOT NULL,
        image_prompt_version TEXT NOT NULL,
        image_generated_at TIMESTAMPTZ NOT NULL,
        category TEXT NOT NULL DEFAULT 'GENERAL_ANALYSIS',
        source TEXT NOT NULL DEFAULT 'ANALYSIS_PUBLIC',
        publication_reason TEXT NOT NULL DEFAULT '',
        content_hash TEXT NOT NULL DEFAULT '',
        semantic_key TEXT NOT NULL DEFAULT '',
        model_used TEXT NOT NULL DEFAULT '',
        approximate_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_time_ms INTEGER NOT NULL DEFAULT 0,
        labels JSONB NOT NULL DEFAULT '["INFORMATIVO","NO ES ALERTA","NO CONTABILIZAR COMO RESULTADO"]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
    await backendDatabase.query("ALTER TABLE community_analysis_publications ALTER COLUMN image_id DROP NOT NULL");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ALTER COLUMN image_mime_type DROP NOT NULL");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ALTER COLUMN image_base64 DROP NOT NULL");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ALTER COLUMN image_prompt_version DROP NOT NULL");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ALTER COLUMN image_generated_at DROP NOT NULL");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'GENERAL_ANALYSIS'");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ANALYSIS_PUBLIC'");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS publication_reason TEXT NOT NULL DEFAULT ''");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS content_hash TEXT NOT NULL DEFAULT ''");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS semantic_key TEXT NOT NULL DEFAULT ''");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS model_used TEXT NOT NULL DEFAULT ''");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS approximate_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS total_time_ms INTEGER NOT NULL DEFAULT 0");
    await backendDatabase.query("ALTER TABLE community_analysis_publications ADD COLUMN IF NOT EXISTS labels JSONB NOT NULL DEFAULT '[\"INFORMATIVO\",\"NO ES ALERTA\",\"NO CONTABILIZAR COMO RESULTADO\"]'::jsonb");
    await backendDatabase.query(`
      CREATE TABLE IF NOT EXISTS community_editorial_events (
        event_id TEXT PRIMARY KEY,
        trace_id TEXT NOT NULL,
        analysis_id TEXT NOT NULL UNIQUE,
        publication_id TEXT,
        asset TEXT NOT NULL,
        category TEXT NOT NULL,
        priority INTEGER NOT NULL,
        status TEXT NOT NULL,
        reason TEXT NOT NULL,
        blocked_by TEXT,
        content_hash TEXT NOT NULL,
        semantic_key TEXT NOT NULL,
        source TEXT NOT NULL,
        session TEXT NOT NULL,
        cooldown_minutes INTEGER NOT NULL,
        model_used TEXT,
        approximate_cost_usd DOUBLE PRECISION,
        total_time_ms INTEGER,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
    await backendDatabase.query(`
      CREATE TABLE IF NOT EXISTS community_flow_evidence (
        id BIGSERIAL PRIMARY KEY,
        trace_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        module TEXT NOT NULL,
        received JSONB NOT NULL,
        processed JSONB NOT NULL,
        sent JSONB NOT NULL,
        result TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
    await backendDatabase.query(
      "CREATE INDEX IF NOT EXISTS idx_community_analysis_created ON community_analysis_publications(created_at DESC)",
    );
    await backendDatabase.query(
      "CREATE INDEX IF NOT EXISTS idx_community_evidence_trace ON community_flow_evidence(trace_id, id)",
    );
    await backendDatabase.query(
      "CREATE INDEX IF NOT EXISTS idx_community_editorial_asset_time ON community_editorial_events(asset, created_at DESC)",
    );
  })();
  return schemaReady;
}

type PublicationRow = {
  publication_id: string;
  dossier_id: string;
  analysis_id: string;
  asset: CommunityPublication["asset"];
  content: CommunityPublication["content"];
  image_id: string | null;
  image_mime_type: NonNullable<CommunityPublication["image"]>["mime_type"] | null;
  image_base64: string | null;
  image_prompt_version: string | null;
  image_generated_at: Date | null;
  category: CommunityPublication["category"];
  source: CommunityPublication["source"];
  publication_reason: string;
  content_hash: string;
  semantic_key: string;
  model_used: string;
  approximate_cost_usd: number;
  total_time_ms: number;
  labels: CommunityPublication["labels"];
  created_at: Date;
};

export class PostgresCommunityRepository implements CommunityAnalysisFeed, CommunityEvidenceStore {
  async append(entry: CommunityEvidenceEntry): Promise<void> {
    await ensureSchema();
    await backendDatabase.query(
      `INSERT INTO community_flow_evidence
       (trace_id, stage, module, received, processed, sent, result, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)`,
      [
        entry.trace_id,
        entry.stage,
        entry.module,
        JSON.stringify(entry.received),
        JSON.stringify(entry.processed),
        JSON.stringify(entry.sent),
        entry.result,
        new Date(entry.timestamp),
      ],
    );
  }

  async store(publication: CommunityPublication): Promise<{ feed_id: string; stored_at: string }> {
    await ensureSchema();
    await backendDatabase.query(
      `INSERT INTO community_analysis_publications
       (publication_id, dossier_id, analysis_id, asset, content, image_id, image_mime_type,
        image_base64, image_prompt_version, image_generated_at, category, source, publication_reason,
        content_hash, semantic_key, model_used, approximate_cost_usd, total_time_ms, labels, created_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20)
       ON CONFLICT (analysis_id) DO NOTHING`,
      [
        publication.publication_id,
        publication.dossier_id,
        publication.analysis_id,
        publication.asset,
        JSON.stringify(publication.content),
        publication.image?.image_id ?? null,
        publication.image?.mime_type ?? null,
        publication.image?.bytes_base64 ?? null,
        publication.image?.prompt_version ?? null,
        publication.image ? new Date(publication.image.generated_at) : null,
        publication.category,
        publication.source,
        publication.reason,
        publication.content_hash,
        publication.semantic_key,
        publication.model_used,
        publication.approximate_cost_usd,
        publication.total_time_ms,
        JSON.stringify(publication.labels),
        new Date(publication.created_at),
      ],
    );
    return { feed_id: publication.publication_id, stored_at: new Date().toISOString() };
  }

  async hasAnalysis(analysisId: string): Promise<boolean> {
    await ensureSchema();
    const result = await backendDatabase.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM community_analysis_publications WHERE analysis_id = $1) AS exists",
      [analysisId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async list(limit = 50): Promise<CommunityPublication[]> {
    await ensureSchema();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const result = await backendDatabase.query<PublicationRow>(
      `SELECT * FROM community_analysis_publications ORDER BY created_at DESC LIMIT $1`,
      [safeLimit],
    );
    return result.rows.map((row) => ({
      publication_id: row.publication_id,
      dossier_id: row.dossier_id,
      analysis_id: row.analysis_id,
      asset: row.asset,
      content: row.content,
      image: row.image_id && row.image_mime_type && row.image_base64 && row.image_prompt_version && row.image_generated_at ? {
        image_id: row.image_id,
        mime_type: row.image_mime_type,
        bytes_base64: row.image_base64,
        prompt_version: row.image_prompt_version,
        generated_at: row.image_generated_at.toISOString(),
      } : null,
      category: row.category,
      source: row.source,
      reason: row.publication_reason,
      content_hash: row.content_hash,
      semantic_key: row.semantic_key,
      model_used: row.model_used,
      approximate_cost_usd: row.approximate_cost_usd,
      total_time_ms: row.total_time_ms,
      labels: row.labels,
      created_at: row.created_at.toISOString(),
    }));
  }

  async evidence(traceId: string): Promise<CommunityEvidenceEntry[]> {
    await ensureSchema();
    const result = await backendDatabase.query<{
      trace_id: string;
      stage: CommunityEvidenceEntry["stage"];
      module: string;
      received: Record<string, unknown>;
      processed: Record<string, unknown>;
      sent: Record<string, unknown>;
      result: CommunityEvidenceEntry["result"];
      created_at: Date;
    }>("SELECT * FROM community_flow_evidence WHERE trace_id = $1 ORDER BY id", [traceId]);
    return result.rows.map((row) => ({
      trace_id: row.trace_id,
      stage: row.stage,
      module: row.module,
      received: row.received,
      processed: row.processed,
      sent: row.sent,
      result: row.result,
      timestamp: row.created_at.toISOString(),
    }));
  }
}

class PostgresCommunityEditorialControl implements CommunityEditorialControl, CommunityEditorialHistoryReader {
  private readonly policy = new CommunityEditorialPolicy(this);

  async recent(asset: string, since: Date): Promise<CommunityEditorialHistoryEntry[]> {
    await ensureSchema();
    const result = await backendDatabase.query<CommunityEditorialHistoryEntry>(
      `SELECT analysis_id, asset, category, status, content_hash, semantic_key, created_at
       FROM community_editorial_events
       WHERE asset = $1 AND created_at >= $2
       ORDER BY created_at DESC`,
      [asset, since],
    );
    return result.rows.map((row) => ({ ...row, created_at: new Date(row.created_at).toISOString() }));
  }

  evaluate(dossier: CommunityMarketDossier, now: Date): Promise<CommunityEditorialDecision> {
    return this.policy.evaluate(dossier, now);
  }

  async recordBlocked(decision: CommunityEditorialDecision, dossier: CommunityMarketDossier, traceId: string): Promise<void> {
    try {
      await this.insertEvent(decision, dossier, traceId, "BLOCKED", null);
    } catch (error) {
      if ((error as { code?: string }).code !== "23505") throw error;
    }
  }

  async recordPublished(decision: CommunityEditorialDecision, publication: CommunityPublication): Promise<void> {
    await ensureSchema();
    await backendDatabase.query(
      `UPDATE community_editorial_events
       SET status = 'PUBLISHED', publication_id = $1, model_used = $2,
           approximate_cost_usd = $3, total_time_ms = $4
       WHERE analysis_id = $5`,
      [publication.publication_id, publication.model_used, publication.approximate_cost_usd, publication.total_time_ms, publication.analysis_id],
    );
  }

  async reserve(decision: CommunityEditorialDecision, dossier: CommunityMarketDossier, traceId: string): Promise<boolean> {
    await ensureSchema();
    const result = await backendDatabase.query(
      `INSERT INTO community_editorial_events
       (event_id, trace_id, analysis_id, publication_id, asset, category, priority, status, reason,
        blocked_by, content_hash, semantic_key, source, session, cooldown_minutes, created_at)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, 'APPROVED', $7, NULL, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (analysis_id) DO UPDATE
       SET event_id = EXCLUDED.event_id, trace_id = EXCLUDED.trace_id, category = EXCLUDED.category,
           priority = EXCLUDED.priority, status = 'APPROVED', reason = EXCLUDED.reason,
           blocked_by = NULL, content_hash = EXCLUDED.content_hash, semantic_key = EXCLUDED.semantic_key,
           source = EXCLUDED.source, session = EXCLUDED.session, cooldown_minutes = EXCLUDED.cooldown_minutes,
           created_at = NOW()
       WHERE community_editorial_events.status = 'FAILED'
       RETURNING analysis_id`,
      [
        `CME-${randomUUID()}`, traceId, dossier.analysis_id, dossier.asset, decision.category,
        decision.priority, decision.reason, decision.content_hash, decision.semantic_key,
        dossier.editorial.source, decision.session, decision.cooldown_minutes,
      ],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async recordFailed(dossier: CommunityMarketDossier, errorCode: string, totalTimeMs: number): Promise<void> {
    await ensureSchema();
    await backendDatabase.query(
      `UPDATE community_editorial_events
       SET status = 'FAILED', reason = $1, total_time_ms = $2
       WHERE analysis_id = $3 AND status = 'APPROVED'`,
      [errorCode, totalTimeMs, dossier.analysis_id],
    );
  }

  private async insertEvent(
    decision: CommunityEditorialDecision,
    dossier: CommunityMarketDossier,
    traceId: string,
    status: "APPROVED" | "BLOCKED",
    publicationId: string | null,
  ): Promise<void> {
    await ensureSchema();
    await backendDatabase.query(
      `INSERT INTO community_editorial_events
       (event_id, trace_id, analysis_id, publication_id, asset, category, priority, status, reason,
        blocked_by, content_hash, semantic_key, source, session, cooldown_minutes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
      [
        `CME-${randomUUID()}`, traceId, dossier.analysis_id, publicationId, dossier.asset,
        decision.category, decision.priority, status, decision.reason, decision.blocked_by ?? null,
        decision.content_hash, decision.semantic_key, dossier.editorial.source, decision.session, decision.cooldown_minutes,
      ],
    );
  }
}

export const communityRepository = new PostgresCommunityRepository();
export const communityEditorialControl = new PostgresCommunityEditorialControl();