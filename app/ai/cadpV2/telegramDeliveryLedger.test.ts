import assert from "node:assert/strict";
import test from "node:test";

import { TelegramDeliveryLedger, type TelegramDeliveryRecord } from "./telegramDeliveryLedger";

test("delivery ledger preserves the complete Telegram delivery explanation", async () => {
  let persisted: TelegramDeliveryRecord | null = null;
  const ledger = new TelegramDeliveryLedger(async (record) => {
    persisted = record;
  });

  const result = await ledger.record({
    event_id: "evt-analysis-1",
    analysis_id: "analysis-1",
    signal_id: "signal-1",
    symbol: "XAUUSD",
    decision: "ENTER_BUY",
    classification: "OFFICIAL_ALERT",
    state: "SENT",
    destination_mode: "TEST_ONLY",
    channel_id: "private-test-channel",
    message_id: "98765",
    reason: "ALERTA",
    error: null,
  });

  assert.ok(result.delivery_id.startsWith("tdl-"));
  assert.equal(persisted?.analysis_id, "analysis-1");
  assert.equal(persisted?.signal_id, "signal-1");
  assert.equal(persisted?.classification, "OFFICIAL_ALERT");
  assert.equal(persisted?.message_id, "98765");
  assert.equal(persisted?.destination_mode, "TEST_ONLY");
});