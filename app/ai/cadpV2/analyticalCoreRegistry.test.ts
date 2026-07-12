import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { AnalyticalCoreRegistry } from "./analyticalCoreRegistry";

test("official analytical core text is exact and hash is stable", () => {
  const registry = new AnalyticalCoreRegistry();
  const coreA = registry.getOfficialCore();
  const coreB = registry.getOfficialCore();

  assert.equal(coreA.core_id, "CARVIPIX_ANALYTICAL_CORE_V1");
  assert.equal(coreA.version, "1.0.0");
  assert.equal(coreA.status, "DRAFT");
  assert.equal(coreA.mode, "SHADOW_ONLY");
  assert.equal(coreA.approved_for_production, false);
  assert.equal(coreA.compatible_protocol, "CADP_V2");
  assert.equal(coreA.compatible_profile, "XAUUSD_INTRADAY_H1_M45_M5_V1");

  const hash = createHash("sha256").update(coreA.content).digest("hex");
  assert.equal(coreA.content_hash, hash);
  assert.equal(coreA.content_hash, coreB.content_hash);
  assert.equal(coreA.content, coreB.content);
});
