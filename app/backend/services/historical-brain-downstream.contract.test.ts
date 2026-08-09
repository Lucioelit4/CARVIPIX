import assert from "node:assert/strict";
import test from "node:test";

import { CadpMasterSignalBuilder } from "@/app/ai/cadpV2/masterSignalBuilder";
import { communicationEngine } from "@/app/ai/cadpV2/communicationEngine";
import { telegramNotificationService } from "@/app/ai/cadpV2/telegramNotificationService";
import type { RespuestaMaestraV3 } from "@/app/ai/cadpV2/typesMaestroV3";
import type { MasterSignalRecord } from "@/app/ai/cadpV2/masterSignalStore";
import { backendDatabase } from "@/app/backend/core/database";
import { publishMasterSignal } from "./master-signal-publisher";
import { RealSignalLifecycleService } from "./real-signal-lifecycle-service";
import { mapLifecycleRecordToAlert } from "./alerts-domain-service";

const SNAPSHOT_UTC = "2026-08-09T12:00:00.000Z";

function buildResponse(
  decision: "ENTER_BUY" | "ENTER_SELL" | "WAIT" | "NO_TRADE",
  horizon: "SHORT" | "MEDIUM" | "EXTENDED",
  validityMinutes: number,
): RespuestaMaestraV3 {
  const direction = decision === "ENTER_BUY" ? "BUY" : decision === "ENTER_SELL" ? "SELL" : "NEUTRAL";
  const entry = decision === "ENTER_SELL" ? 2400 : 2400;
  const executable = decision === "ENTER_BUY" || decision === "ENTER_SELL";
  return {
    decision,
    direction,
    horizon,
    quality: executable ? "A" : "NOT_APPLICABLE",
    confidence: executable ? "HIGH" : "LOW",
    entry_price: executable ? entry : null,
    stop_loss: decision === "ENTER_BUY" ? 2390 : decision === "ENTER_SELL" ? 2410 : null,
    take_profit: decision === "ENTER_BUY" ? 2420 : decision === "ENTER_SELL" ? 2380 : null,
    risk_reward: executable ? 2 : null,
    decisive_evidence: executable ? ["Certified deterministic fixture"] : [],
    opposing_evidence: [],
    critical_veto: decision === "NO_TRADE" ? "Certified veto" : null,
    missing_condition: decision === "WAIT" ? "Await certified market confirmation" : null,
    technical_explanation: "Certified technical explanation for downstream compatibility.",
    public_explanation: "Certified public explanation for downstream compatibility.",
    master_decision: {
      decision,
      direction,
      strategy_selected: executable ? "CARVIPIX_MAESTRO_DISCRETIONARY_V1" : "CARVIPIX_NO_TRADE_V1",
      conviction: executable ? "HIGH" : "LOW",
      probability_estimated: executable ? 75 : null,
      probability_basis: executable ? "Deterministic compatibility fixture" : null,
    },
    analysis_private: {
      analysis_summary: "Deterministic compatibility fixture.",
      decisive_evidence: executable ? ["Certified deterministic fixture"] : [],
      opposing_evidence: [],
      primary_risk: "Controlled local test only.",
      missing_condition: decision === "WAIT" ? "Await certified market confirmation" : null,
      market_context_observed: "Controlled local test context.",
      what_must_change: "No production action.",
      probability_detail: {
        estimated: executable ? 75 : null,
        basis: "Deterministic compatibility fixture",
        confidence_in_estimate: executable ? "HIGH" : "LOW",
        disclaimer: "ANALYTICAL_ESTIMATE_NOT_MATHEMATICAL_PROBABILITY",
      },
    },
    analysis_public: {
      market_visual_state: executable ? "FAVORABLE" : "COMPLICADO",
      supporting_facts: ["Controlled fixture"],
      public_summary: "Controlled local contract test.",
      action_taken: executable ? "ENTRY_SIGNALED" : "NO_ACTION",
      public_warning: null,
    },
    order_plan: executable ? {
      entry_type: "MARKET",
      entry_price: entry,
      entry_zone_min: entry,
      entry_zone_max: entry,
      stop_loss: decision === "ENTER_BUY" ? 2390 : 2410,
      stop_loss_anchor: "Certified structure",
      take_profit: decision === "ENTER_BUY" ? 2420 : 2380,
      take_profit_anchor: "Certified target",
      risk_reward_ratio: 2,
      validity_minutes: validityMinutes,
      cancellation_condition: "Certified cancellation condition",
    } : null,
    adaptive_state: {
      proximity_to_entry: executable ? "IMMEDIATE" : "FAR",
      recheck_minutes: 15,
      watch_conditions: [],
      wake_up_triggers: [],
      missing_for_entry: decision === "WAIT" ? "Await certified market confirmation" : null,
      scenario_classification: executable ? "READY" : "NO_SETUP",
    },
    analyst_observations: {
      summary: "Controlled compatibility fixture.",
      scenario_narrative: "Controlled compatibility fixture.",
      key_observation: null,
    },
    _meta: {
      analysis_id: `ANA-${decision}-${horizon}`,
      canonical_symbol: "XAUUSD",
      snapshot_utc: SNAPSHOT_UTC,
      model_used: "fixture-only",
      tokens_in: 0,
      tokens_out: 0,
      tokens_cached: 0,
      cost_usd_estimated: 0,
      latency_ms: 0,
      prompt_version: "CARVIPIX_MASTER_ANALYST_PROMPT_V1_DRAFT",
      cadp_version: "maestro-v3",
      response_schema_version: "maestro_v3_response",
      human_review_required: true,
      auto_execution_eligible: false,
    },
  };
}

function buildRecord(decision: "ENTER_BUY" | "ENTER_SELL" | "WAIT" | "NO_TRADE", horizon: "SHORT" | "MEDIUM" | "EXTENDED", validityMinutes: number): MasterSignalRecord {
  const response = buildResponse(decision, horizon, validityMinutes);
  const signal = new CadpMasterSignalBuilder().buildV3({
    signalId: `SIG-${decision}-${horizon}`,
    analysisId: response._meta.analysis_id,
    symbol: "XAUUSD",
    response,
  });
  return {
    signal,
    signal_id: signal.signal_id,
    analysis_id: signal.analysis_id,
    created_at: SNAPSHOT_UTC,
  };
}

test("Signal Maestra preserves BUY SHORT, SELL MEDIUM, and EXTENDED contracts", () => {
  const cases = [
    buildRecord("ENTER_BUY", "SHORT", 30),
    buildRecord("ENTER_SELL", "MEDIUM", 240),
    buildRecord("ENTER_BUY", "EXTENDED", 1200),
  ];

  assert.deepEqual(cases.map(record => record.signal.decision), ["ENTER_BUY", "ENTER_SELL", "ENTER_BUY"]);
  assert.deepEqual(cases.map(record => record.signal.direction), ["BUY", "SELL", "BUY"]);
  assert.deepEqual(cases.map(record => record.signal.horizon), ["SHORT", "MEDIUM", "EXTENDED"]);
  assert.deepEqual(cases.map(record => record.signal.validity_minutes), [30, 240, 1200]);
  assert.equal(cases[0].signal.stop_loss! < cases[0].signal.entry!, true);
  assert.equal(cases[0].signal.take_profit! > cases[0].signal.entry!, true);
  assert.equal(cases[1].signal.stop_loss! > cases[1].signal.entry!, true);
  assert.equal(cases[1].signal.take_profit! < cases[1].signal.entry!, true);
  assert.deepEqual(cases.map(record => record.signal.calculated_gross_rr), [2, 2, 2]);
});

test("publisher preserves contract and dispatches each executable Signal Maestra once", async () => {
  for (const record of [
    buildRecord("ENTER_BUY", "SHORT", 30),
    buildRecord("ENTER_SELL", "MEDIUM", 240),
    buildRecord("ENTER_BUY", "EXTENDED", 1200),
  ]) {
    const lifecycleRecords: MasterSignalRecord[] = [];
    const dispatched: unknown[] = [];
    await publishMasterSignal(record, {
      lifecycle: { async upsertFromMasterSignalRecord(input) { lifecycleRecords.push(input); } },
      dispatcher: { async receiveMasterSignal(input, options) { dispatched.push({ input, options }); return { success: true, eventId: `EVT-${record.signal_id}` }; } },
    });

    assert.equal(lifecycleRecords.length, 1);
    assert.equal(dispatched.length, 1);
    assert.deepEqual((dispatched[0] as { input: Record<string, unknown> }).input.horizon, record.signal.horizon);
    assert.deepEqual((dispatched[0] as { input: Record<string, unknown> }).input.validity_minutes, record.signal.validity_minutes);
    assert.deepEqual((dispatched[0] as { options: Record<string, unknown> }).options.sendTelegram, false);
  }
});

test("WAIT and NO_TRADE persist distinctly and never dispatch executable events", async () => {
  for (const decision of ["WAIT", "NO_TRADE"] as const) {
    const record = buildRecord(decision, "SHORT", 15);
    let lifecycleCount = 0;
    let dispatchCount = 0;
    await publishMasterSignal(record, {
      lifecycle: { async upsertFromMasterSignalRecord() { lifecycleCount += 1; } },
      dispatcher: { async receiveMasterSignal() { dispatchCount += 1; return { success: true }; } },
    });

    assert.equal(record.signal.decision, decision);
    assert.equal(lifecycleCount, 1);
    assert.equal(dispatchCount, 0);
  }
});

test("real lifecycle persists the historical contract idempotently", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const rows = new Map<string, Record<string, unknown>>();
  let insertAttempts = 0;

  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    if (sql.includes("INSERT INTO real_signal_lifecycle")) {
      insertAttempts += 1;
      const metadata = JSON.parse(String(params[13] ?? "{}")) as Record<string, unknown>;
      rows.set(String(params[0]), {
        signal_id: params[0],
        analysis_id: params[1],
        symbol: params[2],
        decision: params[3],
        entry_price: params[4],
        stop_loss: params[5],
        take_profit: params[6],
        strategy_id: params[7],
        signal_status: params[8],
        source: params[9],
        data_origin: params[10],
        tracking_account: params[11],
        classification: "REAL_SIGNAL_RESULT",
        signal_timestamp: params[12],
        activated_at: null,
        closed_at: null,
        realized_pnl: 0,
        metadata,
      });
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("UPDATE real_signal_lifecycle AS lifecycle")) {
      return { rows: [], rowCount: 0 };
    }
    if (sql.includes("FROM real_signal_lifecycle") && sql.includes("WHERE signal_id = $1")) {
      const row = rows.get(String(params[0]));
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }
    throw new Error(`Unexpected lifecycle SQL: ${sql}`);
  };

  try {
    const service = new RealSignalLifecycleService();
    const record = buildRecord("ENTER_BUY", "EXTENDED", 1200);
    const first = await service.upsertFromMasterSignalRecord(record);
    const second = await service.upsertFromMasterSignalRecord(record);

    assert.equal(insertAttempts, 2);
    assert.equal(rows.size, 1);
    assert.equal(first?.signalId, record.signal_id);
    assert.equal(second?.analysisId, record.analysis_id);
    assert.equal(second?.decision, "ENTER_BUY");
    assert.equal(second?.source, "CADP_V3_HISTORICAL_BRAIN");
    assert.equal(second?.entry, 2400);
    assert.equal(second?.stopLoss, 2390);
    assert.equal(second?.takeProfit, 2420);
    assert.equal(second?.metadata.horizon, "EXTENDED");
    assert.equal(second?.metadata.validityMinutes, 1200);
    assert.equal(second?.metadata.expiresAt, "2026-08-10T08:00:00.000Z");
  } finally {
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("Alerts CARVIPIX recognizes BUY and SELL without exposing internal codes", () => {
  const base = {
    signalId: "SIG-ALERT-1",
    analysisId: "ANA-ALERT-1",
    symbol: "XAUUSD",
    entry: 2400,
    stopLoss: 2390,
    takeProfit: 2420,
    strategyId: "CARVIPIX_MAESTRO_DISCRETIONARY_V1",
    status: "CREATED" as const,
    source: "CADP_V3_HISTORICAL_BRAIN",
    dataOrigin: "MOCK" as const,
    trackingAccount: "UNASSIGNED" as const,
    classification: "REAL_SIGNAL_RESULT" as const,
    signalTimestamp: new Date(SNAPSHOT_UTC),
    activatedAt: null,
    closedAt: null,
    realizedPnl: 0,
    metadata: { horizon: "SHORT", validityMinutes: 30, expiresAt: "2026-08-09T12:30:00.000Z" },
  };

  const buy = mapLifecycleRecordToAlert({ ...base, decision: "ENTER_BUY" });
  const sell = mapLifecycleRecordToAlert({
    ...base,
    signalId: "SIG-ALERT-2",
    decision: "ENTER_SELL",
    stopLoss: 2410,
    takeProfit: 2380,
  });

  assert.equal(buy.id, "SIG-ALERT-1");
  assert.equal(buy.title, "Compra XAUUSD");
  assert.ok(buy.data);
  assert.ok(sell.data);
  assert.equal(buy.data.direction, "Compra");
  assert.equal(buy.data.entryPrice, 2400);
  assert.equal(buy.data.stopLossPrice, 2390);
  assert.equal(buy.data.takeProfitPrice, 2420);
  assert.equal(buy.data.signalId, "SIG-ALERT-1");
  assert.equal(sell.title, "Venta XAUUSD");
  assert.equal(sell.data.direction, "Venta");
  assert.equal(sell.data.stopLossPrice, 2410);
  assert.equal(sell.data.takeProfitPrice, 2380);
  assert.doesNotMatch(buy.title + buy.description, /REAL_SIGNAL_RESULT|ENTER_BUY|CADP_V3/);
});

test("one Signal Maestra produces exactly one captured Telegram delivery", async () => {
  const record = buildRecord("ENTER_BUY", "SHORT", 30);
  const originalFetch = globalThis.fetch;
  const originalPrepare = communicationEngine.prepareTelegramPlan.bind(communicationEngine);
  const serviceState = telegramNotificationService as unknown as {
    botToken: string;
    freeAlertsChannelId: string;
    freeNotesChannelId: string;
    testChannelId: string;
  };
  const originalState = { ...serviceState };
  let transportCalls = 0;
  let dispatcherTelegramCalls = 0;

  serviceState.botToken = "local-fixture-token";
  serviceState.freeAlertsChannelId = "local-fixture-channel";
  serviceState.freeNotesChannelId = "local-fixture-channel";
  serviceState.testChannelId = "local-fixture-channel";
  globalThis.fetch = (async () => {
    transportCalls += 1;
    return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) } as Response;
  }) as typeof fetch;
  communicationEngine.prepareTelegramPlan = () => ({
    shouldSend: true,
    channel: "alerts",
    category: "OFFICIAL_ALERT",
    reason: "ALERTA",
    message: "Captured local BUY XAUUSD",
    fingerprint: "fixture-signal",
    summaryHash: "fixture-summary",
    symbol: "XAUUSD",
    decision: "ENTER_BUY",
  });

  try {
    await publishMasterSignal(record, {
      lifecycle: { async upsertFromMasterSignalRecord() {} },
      dispatcher: {
        async receiveMasterSignal(_input, options) {
          if (options?.sendTelegram !== false) dispatcherTelegramCalls += 1;
          return { success: true, eventId: "EVT-TELEGRAM-1" };
        },
      },
    });
    const result = await telegramNotificationService.sendTradeAlert(
      {
        market_status: "FAVORABLE",
        public_summary: "Captured local opportunity",
        public_warning: null,
        action_taken: "ENTRY_SIGNALED",
      } as never,
      "XAUUSD",
      "ENTER_BUY",
      { action: "BUY", entry: 2400, stop_loss: 2390, take_profit: 2420, rr: "1:2" } as never,
    );

    assert.equal(result.success, true);
    assert.equal(dispatcherTelegramCalls, 0);
    assert.equal(transportCalls, 1);
    assert.equal(dispatcherTelegramCalls + transportCalls, 1);
  } finally {
    communicationEngine.prepareTelegramPlan = originalPrepare;
    Object.assign(serviceState, originalState);
    globalThis.fetch = originalFetch;
  }
});
