import assert from "node:assert/strict";
import test from "node:test";
import type { MasterSignalRecord } from "@/app/ai/cadpV2/masterSignalStore";
import { publishMasterSignal } from "./master-signal-publisher";

function buildRecord(): MasterSignalRecord {
  return {
    signal_id: "SIG-1",
    analysis_id: "ANA-1",
    created_at: "2026-08-09T00:00:00.000Z",
    signal: {
      signal_id: "SIG-1",
      analysis_id: "ANA-1",
      symbol: "XAUUSD",
      decision: "ENTER_BUY",
      horizon: "SHORT",
      validity_minutes: 30,
      source: "CADP_V3_HISTORICAL_BRAIN",
      analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
      selected_strategy_id: "STRATEGY-1",
      direction: "BUY",
      entry: 2400,
      stop_loss: 2390,
      take_profit: 2420,
      calculated_gross_rr: 2,
      calculated_net_rr: 1.8,
      expires_at: null,
      status: "SHADOW",
      human_review_required: true,
      auto_execution_eligible: false,
    },
  };
}

test("persists lifecycle before dispatching once without duplicate Telegram", async () => {
  const calls: string[] = [];

  await publishMasterSignal(buildRecord(), {
    lifecycle: {
      async upsertFromMasterSignalRecord() {
        calls.push("lifecycle");
      },
    },
    dispatcher: {
      async receiveMasterSignal(signal, options) {
        calls.push(`dispatcher:${signal.direction}:${signal.risk_reward}:${options?.sendTelegram}`);
        return { success: true, eventId: "EVT-1" };
      },
    },
  });

  assert.deepEqual(calls, ["lifecycle", "dispatcher:BUY:1.8:false"]);
});

test("persists but does not dispatch an incomplete signal", async () => {
  const record = buildRecord();
  record.signal.entry = null;
  let dispatchCount = 0;

  await publishMasterSignal(record, {
    lifecycle: {
      async upsertFromMasterSignalRecord() {},
    },
    dispatcher: {
      async receiveMasterSignal() {
        dispatchCount += 1;
        return { success: true };
      },
    },
  });

  assert.equal(dispatchCount, 0);
});