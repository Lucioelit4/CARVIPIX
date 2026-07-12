import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { AIDecisionAudit } from "./aiDecisionAudit";

test("audit writes and can list records", () => {
  const dir = path.join(process.cwd(), "data", "ai-audit-test");
  fs.rmSync(dir, { recursive: true, force: true });

  const audit = new AIDecisionAudit();
  audit.save({
    analysis_id: "analysis_test",
    strategy_id: "CARVIPIX_TREND_PULLBACK_SHORT_V1",
    strategy_version: "1.0.0",
    prompt_version: "p1",
    mode: "SHADOW",
    model: "gpt-4o-mini",
    request: {} as unknown as Parameters<AIDecisionAudit["save"]>[0]["request"],
    raw_response: {},
    validated_response: null,
    decision_final: "WAIT",
    validation_errors: [],
    usage: null,
    latency_ms: 10,
    external_errors: [],
    human_approved: null,
    engine_version: "v1",
    created_at_utc: new Date().toISOString(),
  });

  const saved = audit.get("analysis_test");
  assert.ok(saved);
  assert.equal(saved?.analysis_id, "analysis_test");
});
