import assert from "node:assert/strict";
import test from "node:test";

import { masterSignalStore } from "./masterSignalStore";
import type { CadpShadowSignal } from "./types";

function fixture(): CadpShadowSignal {
  return {
    signal_id: "sig-1",
    analysis_id: "ana-1",
    symbol: "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M45_M5_V1",
    selected_strategy_id: "CARVIPIX_NO_TRADE_V1",
    direction: "NONE",
    entry: null,
    stop_loss: null,
    take_profit: null,
    calculated_gross_rr: null,
    calculated_net_rr: null,
    expires_at: null,
    status: "SHADOW",
    human_review_required: true,
    auto_execution_eligible: false,
  };
}

test("master signal store saves and retrieves latest signal", () => {
  const saved = masterSignalStore.save(fixture());
  const latest = masterSignalStore.getLatest();

  assert.ok(latest);
  assert.equal(saved.signal_id, "sig-1");
  assert.equal(latest?.analysis_id, "ana-1");
  assert.equal(latest?.signal.symbol, "XAUUSD");
});
