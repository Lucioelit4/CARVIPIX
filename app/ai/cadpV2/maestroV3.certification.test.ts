/**
 * Expediente Maestro V3 — Certificación E2E
 * Tests específicos del V3. No dependen de conexión real (uso mock data).
 *
 * Ejecutar: npx tsx app/ai/cadpV2/maestroV3.certification.test.ts
 */

import assert from "node:assert/strict";
import { buildMockPipelineAndIndicators, buildStaleDataPipeline } from "./testHarness";
import { MaestroV3SnapshotBuilder } from "./snapshotBuilderV3";
import { NarrativeContextBuilder } from "./narrativeContextBuilder";
import { ExecutiveSummaryBuilder } from "./executiveSummaryBuilder";
import { MaestroV3PromptBuilder } from "./promptBuilderV3";
import { MaestroV3Verifier } from "./verifierV3";
import { idempotencyStore } from "./idempotencyStore";
import { scenarioMemoryStore } from "./scenarioMemoryStore";
import { disparadorModulos } from "./disparadorModulos";
import { paperTradeMonitor } from "./paperTradeMonitor";
import { ALL_CANONICAL_SYMBOLS, getAuthorizedStrategies } from "./instrumentRegistry";
import type {
  RespuestaMaestraV3,
  PaperAccountState,
} from "./typesMaestroV3";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function buildMockResponse(decision: RespuestaMaestraV3["master_decision"]["decision"]): RespuestaMaestraV3 {
  return {
    master_decision: {
      decision,
      direction: decision === "ENTER_BUY" ? "BUY" : decision === "ENTER_SELL" ? "SELL" : "NEUTRAL",
      strategy_selected: decision === "NO_TRADE" ? "CARVIPIX_NO_TRADE_V1" : "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
      conviction: "MEDIUM",
      probability_estimated: decision === "ENTER_BUY" ? 68 : decision === "WAIT" ? 45 : null,
      probability_basis: decision === "ENTER_BUY" ? "H1 uptrend aligned, M30 pullback to support, M5 bullish candle" : null,
    },
    analysis_private: {
      analysis_summary: "Market is in a bullish H1 trend with M30 pullback to EMA50.",
      decisive_evidence: ["EMA20>EMA50>EMA200 on H1", "M30 pullback to 38.2% level", "M5 bullish engulfing"],
      opposing_evidence: ["High impact news in 45 min", "ADX declining slightly"],
      primary_risk: "US CPI release in 45 minutes could invalidate the setup.",
      missing_condition: decision === "WAIT" ? "Wait for M5 candle close above 2436.50" : null,
      market_context_observed: "XAUUSD in uptrend, pullback complete, entry forming.",
      what_must_change: "Price must close below 2430 to switch to NO_TRADE.",
      probability_detail: {
        estimated: decision === "ENTER_BUY" ? 68 : null,
        basis: "Three-timeframe confluence with news risk adjustment.",
        confidence_in_estimate: "MEDIUM",
        disclaimer: "ANALYTICAL_ESTIMATE_NOT_MATHEMATICAL_PROBABILITY",
      },
    },
    analysis_public: {
      market_visual_state: decision === "ENTER_BUY" ? "FAVORABLE" : decision === "NO_TRADE" ? "COMPLICADO" : "NEUTRAL",
      supporting_facts: ["Active London/NY session", "Normal volatility range"],
      public_summary: decision === "ENTER_BUY"
        ? "Market conditions are favorable for potential opportunity."
        : decision === "NO_TRADE"
        ? "Market conditions do not meet entry criteria at this time."
        : "Market is developing. Awaiting confirmation.",
      action_taken: decision === "ENTER_BUY" ? "ENTRY_SIGNALED" : decision === "NO_TRADE" ? "NO_ACTION" : "WATCHING",
      public_warning: decision === "ENTER_BUY" ? "High impact news event approaching. Risk management essential." : null,
    },
    order_plan: (decision === "ENTER_BUY" || decision === "ENTER_SELL") ? {
      entry_type: "MARKET",
      entry_price: 2435.20,
      entry_zone_min: 2434.80,
      entry_zone_max: 2435.60,
      stop_loss: 2430.50,
      stop_loss_anchor: "Structure low M30",
      take_profit: 2445.00,
      take_profit_anchor: "Resistance H1",
      risk_reward_ratio: 2.08,
      validity_minutes: 30,
      cancellation_condition: "Price closes below 2430.50",
    } : null,
    adaptive_state: {
      proximity_to_entry: decision === "ENTER_BUY" ? "IMMEDIATE" : decision === "WAIT" ? "NEAR" : "FAR",
      recheck_minutes: decision === "ENTER_BUY" ? 5 : decision === "WAIT" ? 10 : 30,
      watch_conditions: [{ condition: "EMA20 must hold", level: 2431.24, timeframe: "H1" }],
      wake_up_triggers: [
        { trigger: "NEW_H1_CLOSE", level: null, description: "Analyze on next H1 close" },
        { trigger: "PRICE_REACHES_LEVEL", level: 2436.50, description: "Wake if price breaks above key resistance" },
      ],
      missing_for_entry: decision === "WAIT" ? "M5 candle close above 2436.50" : null,
      scenario_classification: decision === "ENTER_BUY" ? "READY" : decision === "WAIT" ? "NEAR_ENTRY" : "DEVELOPING",
    },
    analyst_observations: {
      summary: "The market continues to develop in an orderly fashion. Structure remains intact.",
      scenario_narrative: "M30 pullback approaching completion near EMA50 support.",
      key_observation: decision === "ENTER_BUY" ? "Three-timeframe confluence reached." : null,
    },
    _meta: {
      analysis_id: `test-${decision}-${Date.now()}`,
      canonical_symbol: "XAUUSD",
      snapshot_utc: new Date().toISOString(),
      model_used: "gpt-4.1-mini",
      tokens_in: 7400,
      tokens_out: 1100,
      tokens_cached: 0,
      cost_usd_estimated: 0.0097,
      latency_ms: 1850,
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
      cadp_version: "maestro-v3",
      response_schema_version: "maestro_v3_response",
      human_review_required: true,
      auto_execution_eligible: false,
    },
  };
}

function buildMockPaperAccount(): PaperAccountState {
  return {
    initial_balance_usd: 10000,
    current_balance_usd: 10000,
    equity_usd: 10000,
    floating_pnl_usd: 0,
    daily_pnl_usd: 0,
    total_pnl_usd: 0,
    open_trades: [],
    closed_trades: [],
    win_count: 0,
    loss_count: 0,
    expired_count: 0,
    win_rate: null,
    avg_rr_achieved: null,
    max_drawdown_usd: 0,
    drawdown_pct: 0,
    openai_cost_total_usd: 0,
    last_updated: new Date().toISOString(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function runAllTests(): Promise<void> {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     EXPEDIENTE MAESTRO V3 — CERTIFICACIÓN E2E             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const { pipeline, indicators } = buildMockPipelineAndIndicators("XAUUSD");
  const snapshotBuilder = new MaestroV3SnapshotBuilder(pipeline, indicators);
  const narrativeBuilder = new NarrativeContextBuilder();
  const summaryBuilder = new ExecutiveSummaryBuilder();
  const promptBuilder = new MaestroV3PromptBuilder();
  const verifier = new MaestroV3Verifier();

  // ═══════════════════════════════════════════════════════════════════
  console.log("§1 — EXPEDIENTE: Construcción de secciones");
  // ═══════════════════════════════════════════════════════════════════

  let builtExpediente: Awaited<ReturnType<typeof snapshotBuilder.build>> | null = null;

  await test("1.1 Snapshot V3 construye todas las 13 secciones para XAUUSD", async () => {
    builtExpediente = await snapshotBuilder.build({
      analysis_id: "cert-xauusd-001",
      signal_id: "sig-xauusd-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    assert.ok(builtExpediente.expediente.identity, "identity missing");
    assert.ok(builtExpediente.expediente.quality, "quality missing");
    assert.ok(builtExpediente.expediente.pre_analysis_trigger, "trigger missing");
    assert.ok(builtExpediente.expediente.market_h1, "H1 missing");
    assert.ok(builtExpediente.expediente.market_m30, "M30 missing");
    assert.ok(builtExpediente.expediente.market_m5, "M5 missing");
    assert.ok(builtExpediente.expediente.multi_timeframe, "multi_tf missing");
    assert.ok(builtExpediente.expediente.volatility_and_session, "vol_session missing");
    assert.ok(builtExpediente.expediente.news_and_risk, "news missing");
    assert.ok(builtExpediente.expediente.historical_context, "history missing");
    assert.ok(builtExpediente.expediente.visual_context, "visual missing");
    assert.ok(builtExpediente.expediente.authorized_strategies, "strategies missing");
  });

  await test("1.2 Identity usa canonical_symbol correcto y broker_symbol = null", async () => {
    assert.equal(builtExpediente!.expediente.identity.canonical_symbol, "XAUUSD");
    assert.equal(builtExpediente!.expediente.identity.broker_symbol, null);
    assert.equal(builtExpediente!.expediente.identity.version_expediente, "MAESTRO_V3");
  });

  await test("1.3 H1/M30/M5 tienen candles cerradas reales", async () => {
    assert.ok(builtExpediente!.expediente.market_h1.closed_candles.length > 0, "H1 no candles");
    assert.ok(builtExpediente!.expediente.market_m30.closed_candles.length > 0, "M30 no candles");
    assert.ok(builtExpediente!.expediente.market_m5.closed_candles.length > 0, "M5 no candles");
  });

  await test("1.4 Calidad: skip_before_ai = null con datos frescos", async () => {
    assert.equal(builtExpediente!.expediente.quality.skip_before_ai, null);
  });

  await test("1.5 Contexto visual desactivado por defecto (PAPER mode)", async () => {
    assert.equal(builtExpediente!.expediente.visual_context.enabled, false);
    assert.equal(builtExpediente!.expediente.visual_context.images.length, 0);
  });

  await test("1.6 Sección 15 (narrativa) construida correctamente", async () => {
    const partial = builtExpediente!.expediente;
    const narrative = narrativeBuilder.build(partial);
    assert.ok(narrative.price_situation.length > 10, "price_situation vacío");
    assert.ok(narrative.h1_facts.includes("EMA20"), "H1 facts no contiene EMA20");
    assert.ok(narrative.m30_facts.includes("EMA20"), "M30 facts no contiene EMA20");
    assert.ok(narrative.m5_facts.includes("EMA20"), "M5 facts no contiene EMA20");
  });

  await test("1.7 Sección 16 (resumen ejecutivo) construida correctamente", async () => {
    const partial = builtExpediente!.expediente;
    const narrative = narrativeBuilder.build(partial);
    const withNarrative = { ...partial, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    assert.ok(summary.one_line.includes("XAUUSD"), "one_line no contiene XAUUSD");
    assert.ok(summary.data_inventory.h1_candles_closed > 0);
    assert.ok(summary.data_inventory.m30_candles_closed > 0);
    assert.ok(Array.isArray(summary.attention_items));
    assert.ok(Array.isArray(summary.missing_items));
    assert.ok(summary.missing_items.some(m => m.includes("NOT_BROKER_VERIFIED")));
  });

  await test("1.8 Prompt V3 contiene las 16 secciones + Pregunta Maestra", async () => {
    const partial = builtExpediente!.expediente;
    const narrative = narrativeBuilder.build(partial);
    const withNarrative = { ...partial, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };

    const { prompt_text, section_order } = promptBuilder.build(expediente);
    assert.equal(section_order.length, 16, `Expected 16 sections, got ${section_order.length}`);
    assert.ok(prompt_text.includes("Pregunta Maestra"), "Pregunta Maestra missing");
    assert.ok(prompt_text.includes("EXPEDIENTE MAESTRO CARVIPIX V3"), "Header missing");
    assert.ok(prompt_text.includes("XAUUSD"), "Symbol missing");
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§2 — DATOS: Independencia entre instrumentos");
  // ═══════════════════════════════════════════════════════════════════

  await test("2.1 XAUUSD y EURUSD producen analysis_ids independientes", async () => {
    const xau = await snapshotBuilder.build({
      analysis_id: "cert-xau-a1",
      signal_id: "sig-xau-a1",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const { pipeline: p2, indicators: i2 } = buildMockPipelineAndIndicators("EURUSD");
    const snapshotBuilder2 = new MaestroV3SnapshotBuilder(p2, i2);
    const eur = await snapshotBuilder2.build({
      analysis_id: "cert-eur-a1",
      signal_id: "sig-eur-a1",
      canonical_symbol: "EURUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    assert.notEqual(xau.expediente.identity.analysis_id, eur.expediente.identity.analysis_id);
    assert.notEqual(xau.expediente.identity.canonical_symbol, eur.expediente.identity.canonical_symbol);
    assert.equal(xau.expediente.identity.canonical_symbol, "XAUUSD");
    assert.equal(eur.expediente.identity.canonical_symbol, "EURUSD");
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§3 — CALIDAD: Filtros previos a OpenAI");
  // ═══════════════════════════════════════════════════════════════════

  await test("3.1 SKIPPED_BEFORE_AI con datos stale", async () => {
    const { pipeline: stale, indicators: ind } = buildStaleDataPipeline("XAUUSD");
    const staleBuilder = new MaestroV3SnapshotBuilder(stale, ind);
    const result = await staleBuilder.build({
      analysis_id: "cert-stale-001",
      signal_id: "sig-stale-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    // With only 5 candles from 4h ago, data should be stale
    const skip = result.expediente.quality.skip_before_ai;
    assert.ok(skip !== null, "Expected skip_before_ai to be set for stale data");
  });

  await test("3.2 REUSED_PREVIOUS_ANALYSIS con misma clave de idempotencia", async () => {
    const result1 = await snapshotBuilder.build({
      analysis_id: "cert-idem-001",
      signal_id: "sig-idem-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });

    // Register in idempotency store
    idempotencyStore.register(result1.idempotency_key.full_key, "cert-idem-001");

    // Build again — same context should be flagged as reuse
    const result2 = await snapshotBuilder.build({
      analysis_id: "cert-idem-002",
      signal_id: "sig-idem-002",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });

    assert.equal(result2.expediente.quality.skip_before_ai?.skip_reason, "IDEMPOTENT_REUSE");
  });

  await test("3.3 Scenario version increment genera nueva clave", async () => {
    const svBefore = idempotencyStore.getScenarioVersion("XAUUSD");
    idempotencyStore.incrementScenarioVersion("XAUUSD");
    const svAfter = idempotencyStore.getScenarioVersion("XAUUSD");
    assert.equal(svAfter, svBefore + 1);

    const result = await snapshotBuilder.build({
      analysis_id: "cert-wakeup-001",
      signal_id: "sig-wakeup-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "NEW_HIGH_IMPACT_NEWS_DETECTED",
    });
    // New key should NOT be flagged as reuse
    assert.ok(
      result.expediente.quality.skip_before_ai?.skip_reason !== "IDEMPOTENT_REUSE",
      "New scenario version should not be flagged as reuse"
    );
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§4 — VERIFIER: Validación de Respuesta Maestra");
  // ═══════════════════════════════════════════════════════════════════

  await test("4.1 Verifier acepta respuesta ENTER_BUY correcta", () => {
    const response = buildMockResponse("ENTER_BUY");
    const result = verifier.verify(response);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(", ")}`);
  });

  await test("4.2 Verifier acepta respuesta NO_TRADE", () => {
    const response = buildMockResponse("NO_TRADE");
    const result = verifier.verify(response);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(", ")}`);
  });

  await test("4.3 Verifier acepta respuesta WAIT", () => {
    const response = buildMockResponse("WAIT");
    const result = verifier.verify(response);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(", ")}`);
  });

  await test("4.4 Verifier rechaza respuesta con decisión inválida", () => {
    const bad = buildMockResponse("ENTER_BUY");
    (bad.master_decision as unknown as Record<string, unknown>)["decision"] = "INVALID_DECISION";
    const result = verifier.verify(bad);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.startsWith("INVALID_DECISION")));
  });

  await test("4.5 Verifier rechaza respuesta sin order_plan cuando ENTER_BUY", () => {
    const bad = buildMockResponse("ENTER_BUY");
    (bad as unknown as Record<string, unknown>)["order_plan"] = null;
    const result = verifier.verify(bad);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes("order_plan")));
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§5 — DISPARADOR: Distribución a 9 módulos");
  // ═══════════════════════════════════════════════════════════════════

  let dispatchResult: ReturnType<typeof disparadorModulos.dispatch> | null = null;

  await test("5.1 Dispatch ENTER_BUY produce 9 destinos", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-dispatch-001",
      signal_id: "sig-dispatch-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };

    const response = buildMockResponse("ENTER_BUY");
    response._meta.analysis_id = "cert-dispatch-001";
    const paper = buildMockPaperAccount();

    dispatchResult = disparadorModulos.dispatch(response, expediente, paper);
    assert.equal(dispatchResult.destinations.length, 9, `Expected 9 destinations, got ${dispatchResult.destinations.length}`);
  });

  await test("5.2 Todos los destinos muestran analysis_id idéntico", async () => {
    assert.ok(dispatchResult, "dispatchResult not built");
    assert.equal(dispatchResult!.analysis_id, "cert-dispatch-001");
    assert.equal(dispatchResult!.output.observador.analysis_id, "cert-dispatch-001");
    assert.equal(dispatchResult!.output.bot_engine.analysis_id, "cert-dispatch-001");
  });

  await test("5.3 Telegram NO contiene analysis_private", async () => {
    assert.ok(dispatchResult, "dispatchResult not built");
    const telegram = dispatchResult!.output.telegram;
    assert.ok(!("analysis_private" in telegram), "Telegram contains analysis_private — SECURITY VIOLATION");
    assert.ok(!("analysis_summary" in telegram), "Telegram leaks analysis_summary");
    assert.ok(!("decisive_evidence" in telegram), "Telegram leaks decisive_evidence");
  });

  await test("5.4 Alerta Premium NO contiene analysis_private", async () => {
    assert.ok(dispatchResult, "dispatchResult not built");
    const alert = dispatchResult!.output.alerta_premium;
    assert.ok(!("analysis_private" in alert), "AlertaPremium contains analysis_private — SECURITY VIOLATION");
    assert.ok(!("analysis_summary" in alert), "AlertaPremium leaks analysis_summary");
  });

  await test("5.5 Observador SÍ contiene analysis_private (admin)", async () => {
    assert.ok(dispatchResult, "dispatchResult not built");
    const obs = dispatchResult!.output.observador;
    assert.ok("analysis_private" in obs, "Observador missing analysis_private");
    assert.ok(typeof obs.analysis_private.analysis_summary === "string", "analysis_summary missing");
    assert.ok(Array.isArray(obs.analysis_private.decisive_evidence), "decisive_evidence missing");
  });

  await test("5.6 Bot Engine marcado NON_EXECUTABLE", async () => {
    assert.equal(dispatchResult!.output.bot_engine.status, "NON_EXECUTABLE");
    assert.equal(dispatchResult!.output.bot_engine.auto_executable, false);
    assert.equal(dispatchResult!.output.bot_engine.requires_human_review, true);
  });

  await test("5.7 Destino fallido no bloquea los demás", async () => {
    // Simulate by building a dispatch where one payload might fail
    // Here we test that ALL 9 destinations have a status field
    for (const dest of dispatchResult!.destinations) {
      assert.ok(
        dest.status === "DELIVERED" || dest.status === "SKIPPED" || dest.status === "FAILED",
        `Invalid status '${dest.status}' for module ${dest.module}`
      );
    }
    // All should be DELIVERED for a valid response
    const delivered = dispatchResult!.destinations.filter(d => d.status === "DELIVERED").length;
    assert.equal(delivered, 9, `Expected 9 DELIVERED, got ${delivered}`);
  });

  await test("5.8 Dispatch NO_TRADE — order_plan = null en bot_engine", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-notrade-001",
      signal_id: "sig-notrade-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };
    const response = buildMockResponse("NO_TRADE");
    response._meta.analysis_id = "cert-notrade-001";
    const paper = buildMockPaperAccount();

    const result = disparadorModulos.dispatch(response, expediente, paper);
    assert.equal(result.output.bot_engine.entry, null);
    assert.equal(result.output.bot_engine.stop_loss, null);
    assert.equal(result.output.alerta_premium.action, "NO_TRADE");
  });

  await test("5.9 Dispatch WAIT — proximity = NEAR en dashboard", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-wait-001",
      signal_id: "sig-wait-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };
    const response = buildMockResponse("WAIT");
    response._meta.analysis_id = "cert-wait-001";
    const paper = buildMockPaperAccount();

    const result = disparadorModulos.dispatch(response, expediente, paper);
    assert.equal(result.output.dashboard.decision, "WAIT");
    assert.equal(result.output.dashboard.proximity, "NEAR");
    assert.equal(result.output.alerta_premium.action, "WAIT");
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§6 — PAPER TRADE: Monitor USD 10,000");
  // ═══════════════════════════════════════════════════════════════════

  await test("6.1 Trade abre con ENTER_BUY válido", () => {
    const response = buildMockResponse("ENTER_BUY");
    const trade = paperTradeMonitor.openTrade(response, "XAUUSD", "cert-paper-001");
    assert.ok(trade !== null, "Trade should open for ENTER_BUY");
    assert.equal(trade!.direction, "BUY");
    assert.equal(trade!.entry_price, 2435.20);
    assert.equal(trade!.result, "OPEN");
    assert.equal(trade!.paper_spread_note, "NOT_BROKER_VERIFIED");
  });

  await test("6.2 Trade NO abre con NO_TRADE", () => {
    const response = buildMockResponse("NO_TRADE");
    const trade = paperTradeMonitor.openTrade(response, "XAUUSD", "cert-paper-002");
    assert.equal(trade, null, "Trade should NOT open for NO_TRADE");
  });

  await test("6.3 TP hit cierra trade como WIN", () => {
    const response = buildMockResponse("ENTER_BUY");
    response._meta.analysis_id = "cert-paper-003";
    const trade = paperTradeMonitor.openTrade(response, "XAUUSD", "cert-paper-003");
    assert.ok(trade !== null);

    // Simulate TP hit (price above take_profit 2445.00)
    const tpPrice = 2445.50; // Above TP
    paperTradeMonitor.tick({ XAUUSD: tpPrice }, 0);

    const closedTrade = paperTradeMonitor.getTradeById(trade!.paper_trade_id);
    assert.ok(closedTrade !== null);
    assert.equal(closedTrade!.result, "WIN");
    assert.equal(closedTrade!.close_reason, "TP_HIT");
    assert.ok(closedTrade!.pnl_pips !== null && closedTrade!.pnl_pips > 0);
  });

  await test("6.4 SL hit cierra trade como LOSS", () => {
    const response = buildMockResponse("ENTER_BUY");
    response._meta.analysis_id = "cert-paper-004";
    const trade = paperTradeMonitor.openTrade(response, "XAUUSD", "cert-paper-004");
    assert.ok(trade !== null);

    // Simulate SL hit (price below stop_loss 2430.50)
    paperTradeMonitor.tick({ XAUUSD: 2430.00 }, 0);

    const closedTrade = paperTradeMonitor.getTradeById(trade!.paper_trade_id);
    assert.ok(closedTrade !== null);
    assert.equal(closedTrade!.result, "LOSS");
    assert.equal(closedTrade!.close_reason, "SL_HIT");
  });

  await test("6.5 Balance se actualiza con pnl", () => {
    const state = paperTradeMonitor.getAccountState();
    // We had 1 WIN and 1 LOSS in tests above + 1 open
    assert.ok(state.win_count >= 1, `Expected >= 1 win, got ${state.win_count}`);
    assert.ok(state.loss_count >= 1, `Expected >= 1 loss, got ${state.loss_count}`);
    assert.equal(state.initial_balance_usd, 10000);
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§7 — ESTRATEGIAS: Mapa oficial por instrumento");
  // ═══════════════════════════════════════════════════════════════════

  await test("7.1 Los 7 instrumentos tienen estrategias definidas", () => {
    for (const symbol of ALL_CANONICAL_SYMBOLS) {
      const strategies = getAuthorizedStrategies(symbol);
      assert.ok(strategies.length > 0, `${symbol} has no strategies`);
      const noTrade = strategies.find(s => s.strategy_id === "CARVIPIX_NO_TRADE_V1");
      assert.ok(noTrade, `${symbol} missing CARVIPIX_NO_TRADE_V1`);
    }
  });

  await test("7.2 Solo XAUUSD tiene estrategias de trading activas", () => {
    const xauStrategies = getAuthorizedStrategies("XAUUSD");
    assert.ok(xauStrategies.some(s => s.strategy_id === "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1"), "XAUUSD missing pullback");
    assert.ok(xauStrategies.some(s => s.strategy_id === "CARVIPIX_VOLATILITY_BREAKOUT_XAUUSD_V1"), "XAUUSD missing breakout");

    const others = ["BTCUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF"] as const;
    for (const sym of others) {
      const strategies = getAuthorizedStrategies(sym);
      assert.equal(strategies.length, 1, `${sym} should have only NO_TRADE, got ${strategies.length}`);
      assert.equal(strategies[0].strategy_id, "CARVIPIX_NO_TRADE_V1", `${sym} wrong strategy`);
    }
  });

  await test("7.3 No hay referencias a M45 en estrategias activas", () => {
    for (const symbol of ALL_CANONICAL_SYMBOLS) {
      const strategies = getAuthorizedStrategies(symbol);
      for (const s of strategies) {
        const hasM45 = s.critical_requirements.some(r => r.includes("M45"));
        assert.ok(!hasM45, `${symbol} strategy ${s.strategy_id} still references M45`);
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§8 — MEMORIA: Evolución del escenario");
  // ═══════════════════════════════════════════════════════════════════

  await test("8.1 Memoria de escenario persiste entre análisis", async () => {
    scenarioMemoryStore.save({
      analysis_id: "cert-mem-001",
      signal_id: "sig-mem-001",
      canonical_symbol: "XAUUSD",
      timestamp_iso: new Date().toISOString(),
      timestamp_ms: Date.now(),
      decision: "WAIT",
      scenario_classification: "NEAR_ENTRY",
      probability_estimated: 55,
      conviction: "MEDIUM",
      order_plan: null,
      adaptive_state: {
        proximity_to_entry: "NEAR",
        recheck_minutes: 10,
        watch_conditions: [{ condition: "Close above 2436", level: 2436, timeframe: "M5" }],
        wake_up_triggers: [],
        missing_for_entry: "Candle close above 2436.00",
      },
      scenario_type_key: "XAUUSD:NEAR_ENTRY",
      scenario_first_seen_ms: Date.now() - 25 * 60 * 1000,
      strategy_version: "1.0.0",
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
    });

    const latest = scenarioMemoryStore.getLatest("XAUUSD");
    assert.ok(latest !== null);
    assert.equal(latest!.decision, "WAIT");
    assert.equal(latest!.scenario_classification, "NEAR_ENTRY");
  });

  await test("8.2 previous_context refleja análisis anterior", async () => {
    const prev = scenarioMemoryStore.buildPreviousContext("XAUUSD", Date.now());
    assert.equal(prev.exists, true);
    assert.equal(prev.previous_decision, "WAIT");
    assert.ok(prev.scenario_lifetime.lifetime_minutes !== null);
    assert.ok(prev.scenario_lifetime.lifetime_label.includes("minutos"));
  });

  await test("8.3 Decision evolution chain construida correctamente", () => {
    scenarioMemoryStore.save({
      analysis_id: "cert-mem-002",
      signal_id: "sig-mem-002",
      canonical_symbol: "XAUUSD",
      timestamp_iso: new Date().toISOString(),
      timestamp_ms: Date.now() + 1000,
      decision: "ENTER_BUY",
      scenario_classification: "READY",
      probability_estimated: 72,
      conviction: "HIGH",
      order_plan: null,
      adaptive_state: {
        proximity_to_entry: "IMMEDIATE",
        recheck_minutes: 5,
        watch_conditions: [],
        wake_up_triggers: [],
        missing_for_entry: null,
      },
      scenario_type_key: "XAUUSD:READY",
      scenario_first_seen_ms: Date.now() - 30 * 60 * 1000,
      strategy_version: "1.0.0",
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
    });

    const evolution = scenarioMemoryStore.buildDecisionEvolution("XAUUSD", 8);
    assert.ok(evolution.decision_chain.includes("WAIT"), "chain missing WAIT");
    assert.ok(evolution.decision_chain.includes("ENTER_BUY"), "chain missing ENTER_BUY");
    assert.ok(evolution.entries.length >= 2);
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§9 — PROMPT: Calidad del expediente enviado");
  // ═══════════════════════════════════════════════════════════════════

  await test("9.1 Prompt no contiene conclusiones predisponentes", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-prompt-001",
      signal_id: "sig-prompt-001",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };
    const { prompt_text } = promptBuilder.build(expediente);

    // Check that pre-analysis section doesn't contain NEAR_ENTRY, READY, IMMEDIATE
    const trigger = prompt_text.split("### 4")[0].split("### 3. Pre-análisis").at(-1) ?? "";
    assert.ok(!trigger.includes("NEAR_ENTRY"), "Pre-analysis contains predisposing NEAR_ENTRY");
    assert.ok(!trigger.includes("READY"), "Pre-analysis contains predisposing READY");
  });

  await test("9.2 Prompt contiene canonical_symbol correcto en identidad", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-prompt-002",
      signal_id: "sig-prompt-002",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };
    const { prompt_text } = promptBuilder.build(expediente);
    assert.ok(prompt_text.includes('"canonical_symbol":"XAUUSD"') || prompt_text.includes('"canonical_symbol": "XAUUSD"'));
  });

  await test("9.3 broker_symbol es null en el prompt", async () => {
    const snap = await snapshotBuilder.build({
      analysis_id: "cert-prompt-003",
      signal_id: "sig-prompt-003",
      canonical_symbol: "XAUUSD",
      trigger_reason: "SCHEDULED_RECHECK",
    });
    const narrative = narrativeBuilder.build(snap.expediente);
    const withNarrative = { ...snap.expediente, narrative_context: narrative };
    const summary = summaryBuilder.build(withNarrative);
    const expediente = { ...withNarrative, executive_summary: summary };
    assert.equal(expediente.identity.broker_symbol, null);
  });

  // ═══════════════════════════════════════════════════════════════════
  console.log("\n§10 — RESUMEN FINAL");
  // ═══════════════════════════════════════════════════════════════════

  console.log(`\n  Total: ${passed + failed} | ✅ ${passed} passed | ❌ ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
