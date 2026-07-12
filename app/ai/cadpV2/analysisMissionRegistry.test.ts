import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { AnalysisMissionRegistry } from "./analysisMissionRegistry";

test("analysis mission registry provides single immutable official source with stable hash", () => {
  const registry = new AnalysisMissionRegistry();
  const a = registry.getOfficialMission();
  const b = registry.getOfficialMission();

  assert.equal(a.mission_id, "CARVIPIX_ANALYSIS_MISSION_V1");
  assert.equal(a.version, "1.0.0");
  assert.equal(a.status, "DRAFT");
  assert.equal(a.mode, "SHADOW_ONLY");

  const hash = createHash("sha256").update(a.content).digest("hex");
  assert.equal(a.content_hash, hash);
  assert.equal(a.content_hash, b.content_hash);
  assert.equal(a.content, b.content);
});
