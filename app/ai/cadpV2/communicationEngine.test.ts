import test from "node:test";
import assert from "node:assert/strict";
import { CommunicationEngine } from "./communicationEngine";
import type { PayloadTelegram, PayloadAlertaPremium } from "./typesMaestroV3";

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
  const engine = new CommunicationEngine();
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
  const engine = new CommunicationEngine();
  const payload = buildPayload();

  const first = engine.prepareTelegramPlan({
    symbol: "BTCUSD",
    decision: "NO_TRADE",
    payload,
  });

  assert.equal(first.shouldSend, true);
  engine.registerSent(first);

  const second = engine.prepareTelegramPlan({
    symbol: "BTCUSD",
    decision: "NO_TRADE",
    payload,
  });

  assert.equal(second.shouldSend, false);
  assert.equal(second.reason, "duplicate-message-suppressed");
});

test("watch notes stay concise and include next review guidance", () => {
  const engine = new CommunicationEngine();
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
  assert.match(plan.message ?? "", /10 min/);
  assert.ok((plan.message ?? "").length < 220);
});