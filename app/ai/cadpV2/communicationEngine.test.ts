import test from "node:test";
import assert from "node:assert/strict";
import { CommunicationEngine, type CommunicationMemoryBackend } from "./communicationEngine";
import type { PayloadTelegram, PayloadAlertaPremium } from "./typesMaestroV3";

function createMemoryStore(): CommunicationMemoryBackend {
  let memory = { date: new Date().toISOString().slice(0, 10), events: [] as Array<{
    symbol: string;
    decision: string;
    category: string;
    fingerprint: string;
    summary_hash: string;
    sent_at_ms: number;
    channel: string;
  }> };

  return {
    load() {
      return memory;
    },
    save(next) {
      memory = next as typeof memory;
    },
  };
}

function buildPayload(overrides: Partial<PayloadTelegram> = {}): PayloadTelegram {
  return {
    public_summary: "Mercado sin ventaja estadística clara por ahora.",
    market_status: "NEUTRAL",
    action_taken: "NO_ACTION",
    public_warning: "Esperando confirmación limpia.",
    recheck_minutes: 15,
    scenario_classification: "NO_SETUP",
    proximity_to_entry: "INVALID",
    ...overrides,
  };
}

function buildPremiumPayload(action: "BUY" | "SELL"): PayloadAlertaPremium {
  return {
    canonical_symbol: "XAUUSD",
    action,
    entry: 3333.1,
    stop_loss: 3322.2,
    take_profit: 3355.5,
    rr: 2.0,
    probability: 81,
    market_condition: "Ruptura con ventaja estadística.",
    primary_warning: null,
  };
}

test("official alerts always pass through immediately", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "XAUUSD",
    decision: "ENTER_BUY",
    payload: buildPayload(),
    premiumPayload: buildPremiumPayload("BUY"),
  });

  assert.equal(plan.shouldSend, true);
  assert.equal(plan.channel, "alerts");
  assert.equal(plan.category, "OFFICIAL_ALERT");
  assert.match(plan.message ?? "", /Entrada: 3333.1/);
});

test("repeated no-trade notes are suppressed after first send", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const payload = buildPayload();
  const symbol = `BTCUSD-${Date.now()}`;

  const first = engine.prepareTelegramPlan({
    symbol,
    decision: "NO_TRADE",
    payload,
  });

  assert.equal(first.shouldSend, true);
  engine.registerSent(first);

  const second = engine.prepareTelegramPlan({
    symbol,
    decision: "NO_TRADE",
    payload,
  });

  assert.equal(second.shouldSend, false);
  assert.match(second.reason, /duplicate-message-suppressed|global-no-trade-suppressed/);
});

test("tone becomes calmer after negative session context", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "XAUUSD",
    decision: "NO_TRADE",
    payload: buildPayload(),
    communityContext: {
      dailyPnlUsd: -120,
      winCount: 0,
      lossCount: 2,
      closedTrades: 2,
    },
  });

  assert.equal(plan.shouldSend, true);
  assert.match(plan.message ?? "", /calma|disciplina|protegiendo capital|forzar/);
});

test("tone stays measured after positive session context", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "GBPUSD",
    decision: "WAIT",
    payload: buildPayload({ recheck_minutes: 20 }),
    communityContext: {
      dailyPnlUsd: 180,
      winCount: 2,
      lossCount: 0,
      closedTrades: 2,
    },
  });

  assert.equal(plan.shouldSend, true);
  assert.match(plan.message ?? "", /selectivos|ventaja del día|calma/);
});

test("watch notes stay concise and include next review guidance", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "EURUSD",
    decision: "WAIT",
    payload: buildPayload({
      public_summary: "Esperando confirmación de ruptura con cierre limpio antes de considerar entrada.",
      recheck_minutes: 10,
    }),
  });

  assert.equal(plan.shouldSend, true);
  assert.equal(plan.channel, "notes");
  assert.ok((plan.message ?? "").length < 220);
  assert.doesNotMatch(plan.message ?? "", /Próxima revisión|10 min/);
});

test("four simultaneous no-trade analyses produce only one global note", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const payload = buildPayload({
    public_summary: "No hay ventaja clara en los principales instrumentos.",
  });

  const first = engine.prepareTelegramPlan({ symbol: "XAUUSD", decision: "NO_TRADE", payload });
  assert.equal(first.shouldSend, true);
  assert.match(first.message ?? "", /Mercado en espera|Seguimos monitoreando con paciencia|Sin entrada por ahora/);
  assert.doesNotMatch(first.message ?? "", /Próxima revisión|NOT_BROKER_VERIFIED/);
  engine.registerSent(first);

  for (const symbol of ["BTCUSD", "EURUSD", "GBPUSD"]) {
    const next = engine.prepareTelegramPlan({ symbol, decision: "NO_TRADE", payload });
    assert.equal(next.shouldSend, false);
    assert.match(next.reason, /duplicate-message-suppressed|global-no-trade-suppressed/);
  }
});

test("daily context messages are capped at three", () => {
  const engine = new CommunicationEngine(createMemoryStore());

  for (const symbol of ["XAUUSD-A", "XAUUSD-B", "XAUUSD-C"]) {
    const plan = engine.prepareTelegramPlan({
      symbol,
      decision: "WAIT",
      payload: buildPayload({ public_summary: `Seguimiento ${symbol}` }),
    });
    assert.equal(plan.shouldSend, true);
    engine.registerSent(plan);
  }

  const blocked = engine.prepareTelegramPlan({
    symbol: "XAUUSD-D",
    decision: "WAIT",
    payload: buildPayload({ public_summary: "Seguimiento adicional" }),
  });

  assert.equal(blocked.shouldSend, false);
  assert.equal(blocked.reason, "daily-context-limit-reached");
});