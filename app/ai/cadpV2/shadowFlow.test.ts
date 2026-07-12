import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { CadpSnapshotBuilder } from "./snapshotBuilder";
import { CadpShadowFlow } from "./shadowFlow";

test("shadow flow builds draft prompt and validates the synthetic response", async () => {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();
  const snapshotBuilder = new CadpSnapshotBuilder(pipeline, indicators);
  const flow = new CadpShadowFlow(snapshotBuilder);

  const result = await flow.build({
    analysisId: "analysis_shadow_1",
    signalId: "signal_shadow_1",
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });

  assert.equal(result.validation.valid, true);
  assert.equal(result.signal.status, "SHADOW");
  assert.equal(result.prompt.prompt_id, "CARVIPIX_ANALYTICAL_CORE_V1");
  assert.equal(result.prompt.cache_eligible, true);
  assert.equal(result.signal.auto_execution_eligible, false);
  assert.equal(result.signal.human_review_required, true);
  assert.ok(result.prompt.prompt_cache_key.length > 0);
  assert.ok(result.prompt.core_hash.length > 0);
  assert.ok(result.prompt.section_order[0]?.startsWith("1. Núcleo Analítico CARVIPIX V1"));
  assert.equal(result.response?.analysis_id, "analysis_shadow_1");
  assert.equal(typeof result.response?.system_validation_result, "string");
  assert.ok((result.response?.system_validation_result?.length ?? 0) > 0);
  assert.equal(typeof result.response?.final_system_status, "string");
  assert.ok((result.response?.final_system_status?.length ?? 0) > 0);
  assert.equal(result.request.identity.analysis_id, "analysis_shadow_1");
  assert.equal(result.request.visual_manifest.images.length, 3);
});

test("shadow flow deduplicates by canonical expediente and keeps one master signal in shadow", async () => {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();
  const snapshotBuilder = new CadpSnapshotBuilder(pipeline, indicators);
  const flow = new CadpShadowFlow(snapshotBuilder);

  const analysisId = "analysis_shadow_dedupe_1";
  const signalId = "signal_shadow_dedupe_1";

  const a = await flow.build({
    analysisId,
    signalId,
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });

  const b = await flow.build({
    analysisId,
    signalId,
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });

  assert.equal(a.signal.signal_id, b.signal.signal_id);
  assert.equal(a.signal.analysis_id, b.signal.analysis_id);
  assert.equal(a.signal.status, "SHADOW");
  assert.equal(a.signal.auto_execution_eligible, false);
  assert.equal(a.signal.human_review_required, true);
});
