import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { CadpSnapshotBuilder } from "./snapshotBuilder";

test("snapshot builder returns a CADP v2 request with multimodal hashes", () => {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();
  const builder = new CadpSnapshotBuilder(pipeline, indicators);

  const request = builder.build({
    analysisId: "analysis_123",
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });

  assert.equal(request.identity.analysis_id, "analysis_123");
  assert.equal(request.identity.analysis_profile, "XAUUSD_INTRADAY_H1_M45_M5_V1");
  assert.equal(request.authorized_strategies.length > 0, true);
  assert.equal(request.visual_manifest.visual_manifest_hash.length > 0, true);
  assert.equal(request.final_context_hash.length > 0, true);
});
