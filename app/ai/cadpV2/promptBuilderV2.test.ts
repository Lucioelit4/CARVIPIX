import test from "node:test";
import assert from "node:assert/strict";

import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { CadpSnapshotBuilder } from "./snapshotBuilder";
import { CadpPromptBuilderV2 } from "./promptBuilderV2";

test("prompt builder keeps deterministic order and cache metadata", () => {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();
  const snapshotBuilder = new CadpSnapshotBuilder(pipeline, indicators);
  const request = snapshotBuilder.build({
    analysisId: "analysis_prompt_1",
    symbol: "XAUUSD",
    brokerSymbol: "XAU_USD",
  });
  const builder = new CadpPromptBuilderV2();

  const a = builder.build({
    request,
    responseSchema: "SCHEMA",
  });
  const b = builder.build({
    request,
    responseSchema: "SCHEMA",
  });

  assert.equal(a.prompt_cache_key, b.prompt_cache_key);
  assert.equal(a.core_hash, b.core_hash);
  assert.equal(a.mission_hash, b.mission_hash);
  assert.equal(a.prompt_hash, b.prompt_hash);
  assert.equal(a.cache_eligible, true);
  assert.deepEqual(a.section_order, [
    "1. Núcleo Analítico CARVIPIX V1",
    "2. Mensaje Operativo del Analista",
    "3. Estrategias autorizadas",
    "4. Expediente numérico",
    "5. Contexto visual (H1 + M30 + M5)",
    "6. Noticias y contexto económico",
    "7. Sesiones de mercado",
    "8. Restricciones objetivas",
    "9. Esquema JSON oficial",
  ]);
  assert.ok(a.prompt_text.indexOf("1. Núcleo Analítico CARVIPIX V1") < a.prompt_text.indexOf("2. Mensaje Operativo del Analista"));
  assert.ok(a.prompt_text.indexOf("2. Mensaje Operativo del Analista") < a.prompt_text.indexOf("3. Estrategias autorizadas"));
  assert.ok(a.prompt_text.indexOf("4. Expediente numérico") < a.prompt_text.indexOf("9. Esquema JSON oficial"));
});
