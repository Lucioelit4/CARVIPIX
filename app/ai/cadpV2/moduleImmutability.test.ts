import assert from "node:assert/strict";
import test from "node:test";

import { masterSignalStore } from "./masterSignalStore";

test("master signal identity fields stay stable across shared reads", async () => {
  const base = masterSignalStore.save({
    signal_id: "sig-immut-1",
    analysis_id: "ana-immut-1",
    symbol: "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
    selected_strategy_id: "CARVIPIX_NO_TRADE_V1",
    direction: "BUY",
    entry: 123,
    stop_loss: 120,
    take_profit: 130,
    calculated_gross_rr: 2,
    calculated_net_rr: 1.7,
    expires_at: null,
    status: "SHADOW",
    human_review_required: true,
    auto_execution_eligible: false,
  });

  const a = masterSignalStore.getLatest();
  const b = masterSignalStore.getLatest();

  assert.ok(a);
  assert.ok(b);
  assert.equal(a?.signal_id, base.signal_id);
  assert.equal(a?.analysis_id, base.analysis_id);
  assert.equal(a?.signal.symbol, base.signal.symbol);
  assert.equal(a?.signal.entry, base.signal.entry);
  assert.equal(a?.signal.stop_loss, base.signal.stop_loss);
  assert.equal(a?.signal.take_profit, base.signal.take_profit);
  assert.equal(a?.signal.selected_strategy_id, base.signal.selected_strategy_id);
  assert.deepEqual(a, b);
});

test("non-publishable decisions remain non-entry at signal layer", async () => {
  const decisions: Array<"NONE"> = ["NONE"];

  for (const decision of decisions) {
    masterSignalStore.save({
      signal_id: `sig-nonpub-${decision}`,
      analysis_id: `ana-nonpub-${decision}`,
      symbol: "XAUUSD",
      analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
      selected_strategy_id: "CARVIPIX_NO_TRADE_V1",
      direction: decision,
      entry: null,
      stop_loss: null,
      take_profit: null,
      calculated_gross_rr: null,
      calculated_net_rr: null,
      expires_at: null,
      status: "SHADOW",
      human_review_required: true,
      auto_execution_eligible: false,
    });
    const latest = masterSignalStore.getLatest();
    assert.equal(latest?.signal.direction, "NONE");
  }
});
