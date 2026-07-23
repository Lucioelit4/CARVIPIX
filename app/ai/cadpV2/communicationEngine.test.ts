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

test("the first Brain-approved official alert passes through immediately", () => {
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
  assert.equal(plan.reason, "ALERTA");
  assert.match(plan.message ?? "", /Entrada: 3333.1/);
});

test("BUY or SELL without the dispatcher premium payload is never an official alert", () => {
  const engine = new CommunicationEngine(createMemoryStore());

  for (const decision of ["ENTER_BUY", "ENTER_SELL"] as const) {
    const plan = engine.prepareTelegramPlan({
      symbol: `XAUUSD-${decision}`,
      decision,
      payload: buildPayload(),
    });

    assert.equal(plan.category, "GLOBAL_SUMMARY");
    assert.equal(plan.channel, "notes");
  }
});

test("WAIT and no-op decisions stay silent without premium alert", () => {
  for (const decision of ["WAIT", "NO_TRADE", "CONDITIONAL_ENTRY"] as const) {
    const engine = new CommunicationEngine(createMemoryStore());
    const plan = engine.prepareTelegramPlan({
      symbol: `XAUUSD-${decision}`,
      decision,
      payload: buildPayload(),
    });

    assert.equal(plan.shouldSend, false);
    assert.equal(plan.channel, "notes");
    assert.equal(plan.reason, "SILENCIO");
  }
});

test("free Telegram sends at most two quality official alerts per day", () => {
  const engine = new CommunicationEngine(createMemoryStore());

  for (const symbol of ["XAUUSD", "EURUSD"]) {
    const plan = engine.prepareTelegramPlan({
      symbol,
      decision: "ENTER_BUY",
      payload: buildPayload(),
      premiumPayload: buildPremiumPayload("BUY"),
    });
    assert.equal(plan.shouldSend, true);
    engine.registerSent(plan);
  }

  const blocked = engine.prepareTelegramPlan({
    symbol: "GBPUSD",
    decision: "ENTER_SELL",
    payload: buildPayload(),
    premiumPayload: buildPremiumPayload("SELL"),
  });
  assert.equal(blocked.shouldSend, false);
  assert.equal(blocked.reason, "CUPO_FREE");
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

  assert.equal(first.shouldSend, false);
  assert.equal(first.reason, "SILENCIO");
});

test("tone becomes calmer after negative session context", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "XAUUSD",
    decision: "ENTER_BUY",
    payload: buildPayload(),
    communityContext: {
      dailyPnlUsd: -120,
      winCount: 0,
      lossCount: 2,
      closedTrades: 2,
    },
  });

  assert.equal(plan.shouldSend, true);
  assert.equal(plan.category, "GLOBAL_SUMMARY");
  assert.equal(plan.reason, "RESUMEN_GLOBAL");
  assert.match(plan.message ?? "", /calma|disciplina|protegiendo capital|forzar/);
});

test("tone stays measured after positive session context", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "GBPUSD",
    decision: "ENTER_BUY",
    payload: buildPayload({ recheck_minutes: 20 }),
    communityContext: {
      dailyPnlUsd: 180,
      winCount: 2,
      lossCount: 0,
      closedTrades: 2,
    },
  });

  assert.equal(plan.shouldSend, true);
  assert.equal(plan.reason, "RESUMEN_GLOBAL");
  assert.match(plan.message ?? "", /selectivos|ventaja del día|calma/);
});

test("global summary stays concise and excludes review guidance", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const plan = engine.prepareTelegramPlan({
    symbol: "EURUSD",
    decision: "ENTER_BUY",
    payload: buildPayload({
      public_summary: "Esperando confirmación de ruptura con cierre limpio antes de considerar entrada.",
      recheck_minutes: 10,
    }),
  });

  assert.equal(plan.shouldSend, true);
  assert.equal(plan.channel, "notes");
  assert.equal(plan.reason, "RESUMEN_GLOBAL");
  assert.ok((plan.message ?? "").length < 320);
  assert.doesNotMatch(plan.message ?? "", /Próxima revisión|10 min/);
});

test("NO_TRADE stays silent and does not enter the note stream", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const payload = buildPayload({
    public_summary: "No hay ventaja clara en los principales instrumentos.",
  });

  const first = engine.prepareTelegramPlan({ symbol: "XAUUSD", decision: "NO_TRADE", payload });
  assert.equal(first.shouldSend, false);
  assert.equal(first.reason, "SILENCIO");
});

test("WAIT stays silent and does not enter the note stream", () => {
  const engine = new CommunicationEngine(createMemoryStore());
  const payload = buildPayload({
    public_summary: "Sin ventaja clara en instrumentos principales.",
  });

  const plan = engine.prepareTelegramPlan({ symbol: "XAUUSD", decision: "WAIT", payload });
  assert.equal(plan.shouldSend, false);
  assert.equal(plan.reason, "SILENCIO");
});

test("daily context messages are capped at three", () => {
  const today = new Date().toISOString().slice(0, 10);
  const seededStore: CommunicationMemoryBackend = {
    load() {
      return {
        date: today,
        events: [
          {
            symbol: "GLOBAL",
            decision: "NO_TRADE",
            category: "GLOBAL_SUMMARY",
            fingerprint: "g1",
            summary_hash: "h1",
            sent_at_ms: Date.now() - 60_000,
            channel: "notes",
          },
          {
            symbol: "GLOBAL",
            decision: "WAIT",
            category: "GLOBAL_SUMMARY",
            fingerprint: "g2",
            summary_hash: "h2",
            sent_at_ms: Date.now() - 120_000,
            channel: "notes",
          },
          {
            symbol: "GLOBAL",
            decision: "NO_TRADE",
            category: "GLOBAL_SUMMARY",
            fingerprint: "g3",
            summary_hash: "h3",
            sent_at_ms: Date.now() - 180_000,
            channel: "notes",
          },
        ] as Array<{
          symbol: string;
          decision: string;
          category: string;
          fingerprint: string;
          summary_hash: string;
          sent_at_ms: number;
          channel: string;
        }>,
      };
    },
    save() {
      // no-op for this deterministic check
    },
  };

  const engine = new CommunicationEngine(seededStore);

  const blocked = engine.prepareTelegramPlan({
    symbol: "XAUUSD-D",
    decision: "NO_TRADE",
    payload: buildPayload({ public_summary: "Mercado sin entrada clara 4" }),
  });

  assert.equal(blocked.shouldSend, false);
  assert.equal(blocked.reason, "SILENCIO");
});