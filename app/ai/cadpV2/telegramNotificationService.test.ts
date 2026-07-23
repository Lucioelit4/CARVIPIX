import assert from "node:assert/strict";
import test from "node:test";

import { telegramNotificationService } from "./telegramNotificationService";
import { communicationEngine } from "./communicationEngine";

const originalPrepareTelegramPlan = communicationEngine.prepareTelegramPlan.bind(communicationEngine);
const originalFetch = globalThis.fetch;

test("TelegramNotificationService blocks WAIT summaries from Telegram", async () => {
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called for WAIT");
  }) as typeof fetch;

  communicationEngine.prepareTelegramPlan = () => ({
    shouldSend: true,
    channel: "notes",
    category: "GLOBAL_SUMMARY",
    reason: "RESUMEN_GLOBAL",
    message: "🟡 Mercado en espera\n\nEsperando confirmación",
    fingerprint: "GLOBAL:WAITING_MARKET:test",
    summaryHash: "test",
    symbol: "GLOBAL",
    decision: "WAIT",
  });

  try {
    const result = await telegramNotificationService.sendTradeAlert(
      {
        market_status: "NEUTRAL",
        public_summary: "Esperando confirmación",
        public_warning: null,
        action_taken: "WATCHING",
      } as never,
      "XAUUSD",
      "WAIT",
      undefined,
      {
        analysis_id: "analysis-test-1",
        signal_id: "signal-test-1",
        event_id: "event-test-1",
        test_only: true,
      },
    );

    assert.equal(fetchCalled, false);
    assert.equal(result.success, true);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, "NON_OFFICIAL_ALERT_BLOCKED");
  } finally {
    communicationEngine.prepareTelegramPlan = originalPrepareTelegramPlan;
    globalThis.fetch = originalFetch;
  }
});

test("TelegramNotificationService still sends FREE_ALERT plans", async () => {
  let fetchCalled = false;
  const serviceState = telegramNotificationService as unknown as {
    botToken: string;
    freeAlertsChannelId: string;
    freeNotesChannelId: string;
    testChannelId: string;
  };
  const originalBotToken = serviceState.botToken;
  const originalFreeAlertsChannelId = serviceState.freeAlertsChannelId;
  const originalFreeNotesChannelId = serviceState.freeNotesChannelId;
  const originalTestChannelId = serviceState.testChannelId;

  serviceState.botToken = "dummy-token";
  serviceState.freeAlertsChannelId = "dummy-alerts-channel";
  serviceState.freeNotesChannelId = "dummy-notes-channel";
  serviceState.testChannelId = "dummy-test-channel";

  globalThis.fetch = (async () => {
    fetchCalled = true;
    return {
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 777 } }),
    } as Response;
  }) as typeof fetch;

  communicationEngine.prepareTelegramPlan = () => ({
    shouldSend: true,
    channel: "alerts",
    category: "OFFICIAL_ALERT",
    reason: "ALERTA",
    message: "BUY\nXAUUSD\n\nEntrada: 1\nSL: 2\nTP: 3\nR/B: 1:2\nEstado: Lista para ejecutar",
    fingerprint: "OFFICIAL:test",
    summaryHash: "test",
    symbol: "XAUUSD",
    decision: "ENTER_BUY",
  });

  try {
    const result = await telegramNotificationService.sendTradeAlert(
      {
        market_status: "FAVORABLE",
        public_summary: "Nueva oportunidad lista para ejecutar",
        public_warning: null,
        action_taken: "ENTRY_SIGNALED",
      } as never,
      "XAUUSD",
      "ENTER_BUY",
      {
        action: "BUY",
        entry: 1,
        stop_loss: 2,
        take_profit: 3,
        rr: "1:2",
      } as never,
      {
        analysis_id: "analysis-test-2",
        signal_id: "signal-test-2",
        event_id: "event-test-2",
        test_only: true,
      },
    );

    assert.equal(fetchCalled, true);
    assert.equal(result.success, true);
    assert.equal(result.skipped, undefined);
    assert.equal(result.message_id, "777");
  } finally {
    communicationEngine.prepareTelegramPlan = originalPrepareTelegramPlan;
    serviceState.botToken = originalBotToken;
    serviceState.freeAlertsChannelId = originalFreeAlertsChannelId;
    serviceState.freeNotesChannelId = originalFreeNotesChannelId;
    serviceState.testChannelId = originalTestChannelId;
    globalThis.fetch = originalFetch;
  }
});
