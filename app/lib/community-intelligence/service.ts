import { randomUUID } from "crypto";
import { ACTIVE_OPERATION_TEXT, REQUIRED_DISCLAIMER, assertCommunityContentSafe, assertCommunitySafePayload } from "./contract";
import type {
  CommunityAnalysisFeed,
  CommunityContent,
  CommunityContentGenerator,
  CommunityEditorialControl,
  CommunityEvidenceEntry,
  CommunityEvidenceStore,
  CommunityImageGenerator,
  CommunityMarketDossier,
  CommunityPublishResult,
  CommunityPublication,
  CommunityTelegramPublisher,
} from "./types";

export interface CommunityIntelligenceDependencies {
  contentGenerator: CommunityContentGenerator;
  imageGenerator: CommunityImageGenerator;
  telegramPublisher: CommunityTelegramPublisher;
  analysisFeed: CommunityAnalysisFeed;
  evidenceStore: CommunityEvidenceStore;
  editorialControl: CommunityEditorialControl;
  now?: () => Date;
  id?: () => string;
}

export class CommunityIntelligenceService {
  constructor(private readonly dependencies: CommunityIntelligenceDependencies) {}

  async publish(dossier: CommunityMarketDossier): Promise<CommunityPublishResult> {
    const startedAt = Date.now();
    assertCommunitySafePayload(dossier);
    const now = this.dependencies.now ?? (() => new Date());
    const id = this.dependencies.id ?? randomUUID;
    const traceId = `CMT-${id()}`;
    const evidence: CommunityEvidenceEntry[] = [];

    await this.record(evidence, {
      trace_id: traceId,
      stage: "DOSSIER_RECEIVED",
      module: "GPT_COMMUNITY",
      received: { dossier_id: dossier.dossier_id, fields: Object.keys(dossier) },
      processed: { contract: "COMMUNITY_MARKET_DOSSIER_V1", safe: true },
      sent: { destination: "CONTENT_GENERATOR" },
      timestamp: now().toISOString(),
      result: "COMPLETED",
    });

    const editorialDecision = await this.dependencies.editorialControl.evaluate(dossier, now());
    if (!editorialDecision.allowed) {
      await this.dependencies.editorialControl.recordBlocked(editorialDecision, dossier, traceId);
      await this.record(evidence, {
        trace_id: traceId,
        stage: "EDITORIAL_BLOCKED",
        module: "COMMUNITY_EDITORIAL_POLICY",
        received: { dossier_id: dossier.dossier_id, category: editorialDecision.category },
        processed: {
          reason: editorialDecision.reason,
          blocked_by: editorialDecision.blocked_by,
          cooldown_minutes: editorialDecision.cooldown_minutes,
        },
        sent: {},
        timestamp: now().toISOString(),
        result: "COMPLETED",
      });
      return {
        skipped: true,
        trace_id: traceId,
        analysis_id: dossier.analysis_id,
        category: editorialDecision.category,
        reason: editorialDecision.reason,
        blocked_by: editorialDecision.blocked_by,
        evidence,
      };
    }
    if (!(await this.dependencies.editorialControl.reserve(editorialDecision, dossier, traceId))) {
      return {
        skipped: true,
        trace_id: traceId,
        analysis_id: dossier.analysis_id,
        category: editorialDecision.category,
        reason: "Editorial analysis already reserved",
        blocked_by: "DUPLICATE",
        evidence,
      };
    }
    await this.record(evidence, {
      trace_id: traceId,
      stage: "EDITORIAL_APPROVED",
      module: "COMMUNITY_EDITORIAL_POLICY",
      received: { dossier_id: dossier.dossier_id },
      processed: {
        category: editorialDecision.category,
        priority: editorialDecision.priority,
        session: editorialDecision.session,
        cooldown_minutes: editorialDecision.cooldown_minutes,
      },
      sent: { destination: "CONTENT_GENERATOR" },
      timestamp: now().toISOString(),
      result: "COMPLETED",
    });

    let content: CommunityContent;
    try {
      content = {
        ...(await this.dependencies.contentGenerator.generate(dossier)),
        type: editorialDecision.category,
      };
    } catch (error) {
      await this.recordFailure(evidence, traceId, "CONTENT_GENERATED", "GPT_COMMUNITY", dossier.dossier_id, error, now);
      await this.markFailed(dossier, error, startedAt);
      throw error;
    }
    try {
      assertCommunityContentSafe(content, editorialDecision.category, dossier.editorial.official_status);
    } catch (error) {
      await this.recordFailure(evidence, traceId, "CONTENT_GENERATED", "COMMUNITY_CONTENT_GUARD", dossier.dossier_id, error, now);
      content = this.safeFallbackContent(dossier, editorialDecision.category);
      assertCommunityContentSafe(content, editorialDecision.category, dossier.editorial.official_status);
    }
    await this.record(evidence, {
      trace_id: traceId,
      stage: "CONTENT_GENERATED",
      module: "GPT_COMMUNITY",
      received: { dossier_id: dossier.dossier_id },
      processed: { publication_type: content.type, title: content.title },
      sent: { destinations: ["IMAGE_GENERATOR", "TELEGRAM", "ANALYSIS_FEED"] },
      timestamp: now().toISOString(),
      result: "COMPLETED",
    });

    let image = null;
    try {
      image = await this.dependencies.imageGenerator.generate(dossier, content);
    } catch (error) {
      await this.recordFailure(evidence, traceId, "IMAGE_GENERATED", "COMMUNITY_IMAGE_GENERATOR", dossier.dossier_id, error, now);
    }
    if (image) {
      await this.record(evidence, {
        trace_id: traceId,
        stage: "IMAGE_GENERATED",
        module: "COMMUNITY_IMAGE_GENERATOR",
        received: { dossier_id: dossier.dossier_id, title: content.title },
        processed: { image_id: image.image_id, mime_type: image.mime_type, prompt_version: image.prompt_version },
        sent: { destinations: ["TELEGRAM", "ANALYSIS_FEED"] },
        timestamp: now().toISOString(),
        result: "COMPLETED",
      });
    }

    const publication: CommunityPublication = {
      publication_id: `CMP-${id()}`,
      dossier_id: dossier.dossier_id,
      analysis_id: dossier.analysis_id,
      asset: dossier.asset,
      content,
      image,
      category: editorialDecision.category,
      source: dossier.editorial.source,
      reason: editorialDecision.reason,
      content_hash: editorialDecision.content_hash,
      semantic_key: editorialDecision.semantic_key,
      model_used: process.env.COMMUNITY_TEXT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "UNSPECIFIED",
      approximate_cost_usd: 0,
      total_time_ms: Date.now() - startedAt,
      labels: ["INFORMATIVO", "NO ES ALERTA", "NO CONTABILIZAR COMO RESULTADO"],
      created_at: now().toISOString(),
    };

    let telegram;
    try {
      telegram = await this.dependencies.telegramPublisher.publish(publication);
    } catch (error) {
      await this.recordFailure(evidence, traceId, "TELEGRAM_DELIVERED", "COMMUNITY_TELEGRAM", dossier.dossier_id, error, now);
      await this.markFailed(dossier, error, startedAt);
      throw error;
    }
    await this.record(evidence, {
      trace_id: traceId,
      stage: "TELEGRAM_DELIVERED",
      module: "COMMUNITY_TELEGRAM",
      received: { publication_id: publication.publication_id, image_id: image?.image_id ?? null },
      processed: { channel_kind: "COMMUNITY_INFORMATIONAL" },
      sent: { message_id: telegram.message_id, sent_at: telegram.sent_at },
      timestamp: now().toISOString(),
      result: "COMPLETED",
    });

    let feed;
    try {
      feed = await this.dependencies.analysisFeed.store(publication);
    } catch (error) {
      await this.recordFailure(evidence, traceId, "ANALYSIS_FEED_STORED", "COMMUNITY_ANALYSIS_FEED", dossier.dossier_id, error, now);
      await this.markFailed(dossier, error, startedAt);
      throw error;
    }
    await this.record(evidence, {
      trace_id: traceId,
      stage: "ANALYSIS_FEED_STORED",
      module: "COMMUNITY_ANALYSIS_FEED",
      received: { publication_id: publication.publication_id, telegram_message_id: telegram.message_id },
      processed: { separated_from_alert_history: true },
      sent: { feed_id: feed.feed_id, stored_at: feed.stored_at },
      timestamp: now().toISOString(),
      result: "COMPLETED",
    });
    publication.total_time_ms = Date.now() - startedAt;
    await this.dependencies.editorialControl.recordPublished(editorialDecision, publication);

    return {
      trace_id: traceId,
      publication_id: publication.publication_id,
      telegram_message_id: telegram.message_id,
      analysis_feed_id: feed.feed_id,
      evidence,
    };
  }

  private async record(evidence: CommunityEvidenceEntry[], entry: CommunityEvidenceEntry): Promise<void> {
    evidence.push(entry);
    await this.dependencies.evidenceStore.append(entry);
  }

  private async recordFailure(
    evidence: CommunityEvidenceEntry[],
    traceId: string,
    stage: CommunityEvidenceEntry["stage"],
    module: string,
    dossierId: string,
    error: unknown,
    now: () => Date,
  ): Promise<void> {
    const errorCode = error instanceof Error ? error.message : "COMMUNITY_UNKNOWN_ERROR";
    await this.record(evidence, {
      trace_id: traceId,
      stage,
      module,
      received: { dossier_id: dossierId },
      processed: { error_code: errorCode },
      sent: {},
      timestamp: now().toISOString(),
      result: "FAILED",
    });
  }

  private async markFailed(dossier: CommunityMarketDossier, error: unknown, startedAt: number): Promise<void> {
    const errorCode = error instanceof Error ? error.message : "COMMUNITY_UNKNOWN_ERROR";
    await this.dependencies.editorialControl.recordFailed(dossier, errorCode, Date.now() - startedAt);
  }

  private safeFallbackContent(
    dossier: CommunityMarketDossier,
    category: CommunityPublication["category"],
  ): CommunityContent {
    if (category === "ACTIVE_OPERATION") {
      return {
        title: `${dossier.asset}: seguimiento informativo`,
        body: ACTIVE_OPERATION_TEXT,
        type: category,
        disclaimer: REQUIRED_DISCLAIMER,
      };
    }
    if (category === "OFFICIAL_RESULT") {
      const status = dossier.editorial.official_status;
      const body = status === "TP_HIT"
        ? "TP alcanzado. El resultado oficial fue registrado con normalidad."
        : status === "SL_HIT"
          ? "SL alcanzado. El resultado oficial fue registrado con normalidad."
          : "El cierre oficial fue registrado con normalidad.";
      return { title: `${dossier.asset}: resultado oficial`, body, type: category, disclaimer: REQUIRED_DISCLAIMER };
    }
    return {
      title: `${dossier.asset}: actualización informativa`,
      body: "El contexto actual todavía no ofrece una confirmación suficientemente clara. CARVIPIX mantiene la observación y prioriza información verificada antes de comunicar un cambio relevante.",
      type: category,
      disclaimer: REQUIRED_DISCLAIMER,
    };
  }
}