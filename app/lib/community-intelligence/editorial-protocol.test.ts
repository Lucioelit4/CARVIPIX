import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVE_OPERATION_TEXT, REQUIRED_DISCLAIMER, assertCommunityContentSafe } from "./contract";
import {
  COMMUNITY_EDITORIAL_PRIORITY,
  COMMUNITY_EDITORIAL_LIMITS,
  CommunityEditorialPolicy,
  OFFICIAL_ALERT_PRIORITY,
  resolveCommunitySession,
  type CommunityEditorialHistoryEntry,
} from "./editorial-policy";
import { CommunityIntelligenceService } from "./service";
import type {
  CommunityEditorialControl,
  CommunityEditorialDecision,
  CommunityEvidenceEntry,
  CommunityMarketDossier,
  CommunityPublication,
  CommunityPublicationType,
} from "./types";

function dossier(overrides: Partial<CommunityMarketDossier> = {}): CommunityMarketDossier {
  return {
    dossier_id: "CMD-PROTOCOL-001",
    analysis_id: "ANA-PROTOCOL-001",
    asset: "XAUUSD",
    market_state: "RANGE",
    context: "El mercado permanece lateral y todavía no ofrece confirmación suficiente.",
    reasons: ["Estructura mixta", "Confirmación pendiente"],
    scenarios: ["El panorama cambiaría con una ruptura estructural validada"],
    risk_level: "MEDIUM",
    volatility: "NORMAL",
    relevant_news: [],
    scenario_classification: "RANGE_NO_EDGE",
    timestamp: "2026-07-20T13:00:00.000Z",
    editorial: { source: "ANALYSIS_PUBLIC", reason: "Cambio real verificado en analysis_public" },
    ...overrides,
  } as CommunityMarketDossier;
}

function content(type: CommunityPublicationType, body: string) {
  return { title: "Actualización CARVIPIX", body, type, disclaimer: REQUIRED_DISCLAIMER };
}

class MemoryHistory {
  entries: CommunityEditorialHistoryEntry[] = [];
  async recent(asset: string, since: Date) {
    return this.entries.filter((entry) => entry.asset === asset && new Date(entry.created_at) >= since);
  }
}

test("1 - lateral market explains disciplined waiting", () => {
  assert.doesNotThrow(() => assertCommunityContentSafe(content(
    "NO_TRADE_WAIT",
    "El oro continúa sin una estructura suficientemente clara. CARVIPIX mantiene la observación y prioriza la calidad sobre la cantidad.",
  )));
});

test("2 - high volatility reports risk without alarmism", () => {
  assert.doesNotThrow(() => assertCommunityContentSafe(content(
    "MARKET_STATUS",
    "La volatilidad aumentó y requiere una lectura prudente. El contexto se mantiene bajo observación institucional.",
  )));
});

test("3 - material change is immediate and remains informational", async () => {
  const policy = new CommunityEditorialPolicy(new MemoryHistory());
  const decision = await policy.evaluate(dossier({ editorial: {
    source: "ANALYSIS_PUBLIC",
    reason: "Ruptura estructural verificada",
    material_change: true,
  } }), new Date("2026-07-20T16:00:00.000Z"));
  assert.equal(decision.allowed, true);
  assert.equal(decision.category, "MATERIAL_CHANGE");
  assert.equal(decision.cooldown_minutes, 0);
});

test("4 - active operation only permits the approved neutral sentence", () => {
  assert.doesNotThrow(() => assertCommunityContentSafe(content("ACTIVE_OPERATION", ACTIVE_OPERATION_TEXT), "ACTIVE_OPERATION", "ACTIVE"));
  assert.throws(
    () => assertCommunityContentSafe(content("ACTIVE_OPERATION", "Conviene cerrar y asegurar ganancias."), "ACTIVE_OPERATION", "ACTIVE"),
    /COMMUNITY_FORBIDDEN_TRADING_CLAIM/,
  );
});

test("5 - TP result requires an official terminal status", () => {
  assert.doesNotThrow(() => assertCommunityContentSafe(
    content("OFFICIAL_RESULT", "TP alcanzado. El resultado oficial fue registrado sin modificar estadísticas."),
    "OFFICIAL_RESULT",
    "TP_HIT",
  ));
  assert.throws(() => assertCommunityContentSafe(content("OFFICIAL_RESULT", "TP alcanzado."), "OFFICIAL_RESULT"));
});

test("6 - SL result is professional and requires official confirmation", () => {
  assert.doesNotThrow(() => assertCommunityContentSafe(
    content("OFFICIAL_RESULT", "SL alcanzado. El cierre oficial fue registrado con normalidad."),
    "OFFICIAL_RESULT",
    "SL_HIT",
  ));
});

test("7 - operational-language infiltration is blocked", () => {
  for (const phrase of ["cerrar", "mover SL", "comprar", "vender", "Entry", "TP", "SL"]) {
    assert.throws(
      () => assertCommunityContentSafe(content("GENERAL_ANALYSIS", `Sugerencia: ${phrase}.`)),
      /COMMUNITY_FORBIDDEN_TRADING_CLAIM/,
      phrase,
    );
  }
});

test("8 - repeated equivalent states do not produce two publications", async () => {
  const history = new MemoryHistory();
  const policy = new CommunityEditorialPolicy(history);
  const input = dossier({ editorial: { source: "ANALYSIS_PUBLIC", reason: "Estado lateral", category_hint: "NO_TRADE_WAIT" } });
  const first = await policy.evaluate(input, new Date("2026-07-20T13:00:00.000Z"));
  history.entries.push({
    analysis_id: input.analysis_id,
    asset: input.asset,
    category: first.category,
    status: "PUBLISHED",
    content_hash: first.content_hash,
    semantic_key: first.semantic_key,
    created_at: "2026-07-20T13:00:00.000Z",
  });
  const second = await policy.evaluate({ ...input, analysis_id: "ANA-PROTOCOL-002" }, new Date("2026-07-20T15:30:00.000Z"));
  assert.equal(second.allowed, false);
  assert.equal(second.blocked_by, "DUPLICATE");
});

test("9 - image failure publishes text and leaves failure evidence", async () => {
  const evidence: CommunityEvidenceEntry[] = [];
  let delivered: CommunityPublication | undefined;
  const decision: CommunityEditorialDecision = {
    allowed: true,
    category: "GENERAL_ANALYSIS",
    priority: 6,
    reason: "General analysis adds verified context",
    session: "NEW_YORK",
    content_hash: "image-fallback-hash",
    semantic_key: "verified context",
    cooldown_minutes: 360,
  };
  const editorialControl: CommunityEditorialControl = {
    evaluate: async () => decision,
    reserve: async () => true,
    recordBlocked: async () => undefined,
    recordPublished: async () => undefined,
    recordFailed: async () => undefined,
  };
  const service = new CommunityIntelligenceService({
    editorialControl,
    now: () => new Date("2026-07-20T13:00:00.000Z"),
    id: (() => { let value = 0; return () => String(++value); })(),
    contentGenerator: { generate: async () => content("GENERAL_ANALYSIS", "El contexto verificado aporta una lectura general y prudente del mercado observado.") },
    imageGenerator: { generate: async () => { throw new Error("IMAGE_PROVIDER_UNAVAILABLE"); } },
    telegramPublisher: { publish: async (publication) => { delivered = publication; return { message_id: 900, sent_at: "2026-07-20T13:00:01.000Z" }; } },
    analysisFeed: { store: async () => ({ feed_id: "FEED-900", stored_at: "2026-07-20T13:00:02.000Z" }) },
    evidenceStore: { append: async (entry) => void evidence.push(entry) },
  });
  const result = await service.publish(dossier({ editorial: { source: "ANALYSIS_PUBLIC", reason: decision.reason, category_hint: "GENERAL_ANALYSIS" } }));
  assert.equal("skipped" in result, false);
  assert.equal(delivered?.image, null);
  assert.equal(evidence.some((entry) => entry.stage === "IMAGE_GENERATED" && entry.result === "FAILED"), true);
  assert.equal(evidence.some((entry) => entry.stage === "TELEGRAM_DELIVERED" && entry.result === "COMPLETED"), true);
});

test("unsafe generated language falls back to validated institutional content", async () => {
  let delivered: CommunityPublication | undefined;
  const decision: CommunityEditorialDecision = {
    allowed: true,
    category: "NO_TRADE_WAIT",
    priority: 5,
    reason: "Wait for verified context",
    session: "NEW_YORK",
    content_hash: "guard-fallback-hash",
    semantic_key: "guard fallback",
    cooldown_minutes: 120,
  };
  const service = new CommunityIntelligenceService({
    editorialControl: {
      evaluate: async () => decision,
      reserve: async () => true,
      recordBlocked: async () => undefined,
      recordPublished: async () => undefined,
      recordFailed: async () => undefined,
    },
    contentGenerator: { generate: async () => content("NO_TRADE_WAIT", "Conviene comprar y mover SL ahora.") },
    imageGenerator: { generate: async () => { throw new Error("IMAGE_UNAVAILABLE"); } },
    telegramPublisher: { publish: async (publication) => { delivered = publication; return { message_id: 901, sent_at: new Date().toISOString() }; } },
    analysisFeed: { store: async () => ({ feed_id: "FEED-901", stored_at: new Date().toISOString() }) },
    evidenceStore: { append: async () => undefined },
  });
  await service.publish(dossier());
  assert.equal(delivered?.content.title, "XAUUSD: actualización informativa");
  assert.doesNotThrow(() => assertCommunityContentSafe(delivered!.content));
});

test("10 - official alerts have absolute priority over every Community category", () => {
  assert.ok(Object.values(COMMUNITY_EDITORIAL_PRIORITY).every((priority) => OFFICIAL_ALERT_PRIORITY < priority));
});

test("frequency limits and sessions match the approved protocol", () => {
  assert.equal(COMMUNITY_EDITORIAL_LIMITS.categoryCooldownMinutes.MARKET_STATUS, 90);
  assert.equal(COMMUNITY_EDITORIAL_LIMITS.categoryCooldownMinutes.NO_TRADE_WAIT, 120);
  assert.equal(COMMUNITY_EDITORIAL_LIMITS.generalAnalysisDailyMaximum, 2);
  assert.equal(COMMUNITY_EDITORIAL_LIMITS.normalDailyMaximum, 6);
  assert.equal(resolveCommunitySession("XAUUSD", new Date("2026-07-20T07:30:00.000Z")), "LONDON");
  assert.equal(resolveCommunitySession("XAUUSD", new Date("2026-07-20T13:00:00.000Z")), "NEW_YORK");
  assert.equal(resolveCommunitySession("XAUUSD", new Date("2026-07-20T10:30:00.000Z")), "TRANSITION");
  assert.equal(resolveCommunitySession("XAUUSD", new Date("2026-07-20T20:30:00.000Z")), "DAILY_CLOSE");
  assert.equal(resolveCommunitySession("BTCUSD", new Date("2026-07-20T03:00:00.000Z")), "BTC_24_7");
});
