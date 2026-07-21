import assert from "node:assert/strict";
import test from "node:test";
import type { ExpedienteMaestroV3, RespuestaMaestraV3 } from "@/app/ai/cadpV2/typesMaestroV3";
import {
  assertCommunityContentSafe,
  assertCommunitySafePayload,
  buildCommunityMarketDossier,
} from "./contract";
import { CommunityIntelligenceService } from "./service";
import type {
  CommunityEditorialControl,
  CommunityEditorialDecision,
  CommunityEvidenceEntry,
  CommunityPublication,
} from "./types";

function allowEditorialControl(): CommunityEditorialControl {
  const decision: CommunityEditorialDecision = {
    allowed: true,
    category: "NO_TRADE_WAIT",
    priority: 5,
    reason: "Estado lateral con espera disciplinada",
    session: "NEW_YORK",
    content_hash: "hash-001",
    semantic_key: "range medium normal",
    cooldown_minutes: 120,
  };
  return {
    evaluate: async () => decision,
    reserve: async () => true,
    recordBlocked: async () => undefined,
    recordPublished: async () => undefined,
    recordFailed: async () => undefined,
  };
}

function sourceFixture(): { response: RespuestaMaestraV3; expediente: ExpedienteMaestroV3 } {
  const response = {
    master_decision: { conviction: "LOW", decision: "NO_TRADE", direction: "NEUTRAL" },
    analysis_public: {
      market_visual_state: "RANGE",
      supporting_facts: ["Volatilidad contenida", "Estructura sin confirmación"],
      public_summary: "El mercado permanece en consolidación y requiere paciencia.",
      action_taken: "NO_ACTION",
      public_warning: null,
    },
    adaptive_state: {
      scenario_classification: "RANGE_NO_EDGE",
      watch_conditions: [{ condition: "Esperar confirmación estructural", level: 2500, timeframe: "H1" }],
    },
    analyst_observations: { scenario_narrative: "La consolidación puede continuar durante la sesión." },
  } as unknown as RespuestaMaestraV3;

  const expediente = {
    identity: {
      analysis_id: "ANA-001",
      signal_id: "SIG-SECRET",
      canonical_symbol: "XAUUSD",
      snapshot_hash: "snapshot-001",
      timestamp_iso: "2026-07-20T12:00:00.000Z",
    },
    volatility_and_session: { atr_h1_percentile: 55 },
    news_and_risk: {
      events_within_operation_window: [
        { event_id: "NEWS-1", event_name: "Decisión de tasas", impact: "HIGH", minutes_to: 30 },
      ],
      events: [
        { event_id: "NEWS-1", event_name: "Decisión de tasas", impact: "HIGH", scheduled_iso: "2026-07-20T12:30:00.000Z" },
      ],
    },
  } as unknown as ExpedienteMaestroV3;

  return { response, expediente };
}

test("dossier only exposes the approved informational contract", () => {
  const { response, expediente } = sourceFixture();
  const dossier = buildCommunityMarketDossier(response, expediente);
  const serialized = JSON.stringify(dossier);

  assert.deepEqual(Object.keys(dossier).sort(), [
    "analysis_id",
    "asset",
    "context",
    "dossier_id",
    "editorial",
    "market_state",
    "reasons",
    "relevant_news",
    "risk_level",
    "scenario_classification",
    "scenarios",
    "timestamp",
    "volatility",
  ]);
  assert.equal(dossier.risk_level, "HIGH");
  assert.equal(serialized.includes("SIG-SECRET"), false);
  assert.doesNotMatch(serialized, /entry|stop_loss|take_profit|order_plan|analysis_private/i);
});

test("contract rejects trading fields and actionable claims", () => {
  assert.throws(
    () => assertCommunitySafePayload({ context: "informativo", entry_price: 2500 }),
    /COMMUNITY_FORBIDDEN_FIELD/,
  );
  assert.throws(
    () =>
      assertCommunityContentSafe({
        title: "Panorama",
        body: "Compra ahora con TP definido.",
        type: "GENERAL_ANALYSIS",
        disclaimer: "Contenido informativo. No representa una alerta oficial ni una recomendación operativa.",
      }),
    /COMMUNITY_FORBIDDEN_TRADING_CLAIM/,
  );
});

test("same informational publication reaches Telegram and Analysis with complete evidence", async () => {
  const { response, expediente } = sourceFixture();
  const dossier = buildCommunityMarketDossier(response, expediente);
  const evidence: CommunityEvidenceEntry[] = [];
  let telegramPublication: CommunityPublication | undefined;
  let analysisPublication: CommunityPublication | undefined;
  let idCounter = 0;

  const service = new CommunityIntelligenceService({
    id: () => `ID-${++idCounter}`,
    now: () => new Date("2026-07-20T13:00:00.000Z"),
    contentGenerator: {
      generate: async () => ({
        title: "XAUUSD: mercado en consolidación",
        body: "La estructura permanece sin confirmación. El enfoque prudente es observar el desarrollo del escenario.",
        type: "NO_TRADE_WAIT",
        disclaimer: "Contenido informativo. No representa una alerta oficial ni una recomendación operativa.",
      }),
    },
    imageGenerator: {
      generate: async () => ({
        image_id: "IMG-001",
        mime_type: "image/png",
        bytes_base64: "aW1hZ2U=",
        prompt_version: "community-cover-v1",
        generated_at: "2026-07-20T13:00:00.000Z",
      }),
    },
    telegramPublisher: {
      publish: async (publication) => {
        telegramPublication = publication;
        return { message_id: 701, sent_at: "2026-07-20T13:00:01.000Z" };
      },
    },
    analysisFeed: {
      store: async (publication) => {
        analysisPublication = publication;
        return { feed_id: "FEED-001", stored_at: "2026-07-20T13:00:02.000Z" };
      },
    },
    evidenceStore: { append: async (entry) => void evidence.push(entry) },
    editorialControl: allowEditorialControl(),
  });

  const result = await service.publish(dossier);

  assert.deepEqual(analysisPublication, telegramPublication);
  assert.equal(result.telegram_message_id, 701);
  assert.equal(result.analysis_feed_id, "FEED-001");
  assert.deepEqual(
    evidence.map((entry) => entry.stage),
    [
      "DOSSIER_RECEIVED",
      "EDITORIAL_APPROVED",
      "CONTENT_GENERATED",
      "IMAGE_GENERATED",
      "TELEGRAM_DELIVERED",
      "ANALYSIS_FEED_STORED",
    ],
  );
  assert.ok(evidence.every((entry) => entry.trace_id === result.trace_id && entry.timestamp));
});

test("failed destinations leave stage-specific evidence", async () => {
  const { response, expediente } = sourceFixture();
  const dossier = buildCommunityMarketDossier(response, expediente);
  const evidence: CommunityEvidenceEntry[] = [];
  const service = new CommunityIntelligenceService({
    id: () => "FAIL-001",
    now: () => new Date("2026-07-20T14:00:00.000Z"),
    contentGenerator: {
      generate: async () => ({
        title: "Mercado sin confirmación",
        body: "La estructura permanece sin confirmación y el escenario requiere más desarrollo antes de extraer conclusiones.",
        type: "NO_TRADE_WAIT",
        disclaimer: "Contenido informativo. No representa una alerta oficial ni una recomendación operativa.",
      }),
    },
    imageGenerator: {
      generate: async () => ({
        image_id: "IMG-FAIL",
        mime_type: "image/png",
        bytes_base64: "aW1hZ2U=",
        prompt_version: "community-cover-v1",
        generated_at: "2026-07-20T14:00:00.000Z",
      }),
    },
    telegramPublisher: { publish: async () => { throw new Error("TELEGRAM_UNAVAILABLE"); } },
    analysisFeed: { store: async () => ({ feed_id: "unused", stored_at: "unused" }) },
    evidenceStore: { append: async (entry) => void evidence.push(entry) },
    editorialControl: allowEditorialControl(),
  });

  await assert.rejects(() => service.publish(dossier), /TELEGRAM_UNAVAILABLE/);
  assert.equal(evidence.at(-1)?.stage, "TELEGRAM_DELIVERED");
  assert.equal(evidence.at(-1)?.result, "FAILED");
  assert.deepEqual(evidence.at(-1)?.processed, { error_code: "TELEGRAM_UNAVAILABLE" });
});