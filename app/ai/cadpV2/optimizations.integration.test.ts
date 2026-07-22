import test from "node:test";
import assert from "node:assert/strict";

import { buildMockPipelineAndIndicators } from "./testHarness";
import { MaestroV3SnapshotBuilder } from "./snapshotBuilderV3";
import { NarrativeContextBuilder } from "./narrativeContextBuilder";
import { ExecutiveSummaryBuilder } from "./executiveSummaryBuilder";
import { MaestroV3PromptBuilder } from "./promptBuilderV3";
import { idempotencyStore } from "./idempotencyStore";

test("smart expediente reduces prompt size when enabled", async () => {
  const { pipeline, indicators } = buildMockPipelineAndIndicators("XAUUSD");
  const builder = new MaestroV3SnapshotBuilder(pipeline, indicators);
  const narrativeBuilder = new NarrativeContextBuilder();
  const summaryBuilder = new ExecutiveSummaryBuilder();
  const promptBuilder = new MaestroV3PromptBuilder();

  const snapshot = await builder.build({
    analysis_id: `opt-test-${Date.now()}`,
    signal_id: `opt-sig-${Date.now()}`,
    canonical_symbol: "XAUUSD",
    trigger_reason: "SCHEDULED_RECHECK",
  });

  const narrative = narrativeBuilder.build(snapshot.expediente);
  const withNarrative = { ...snapshot.expediente, narrative_context: narrative };
  const summary = summaryBuilder.build(withNarrative);
  const expediente = { ...withNarrative, executive_summary: summary };

  const full = promptBuilder.build(expediente, { smartExpedientEnabled: false });
  const smart = promptBuilder.build(expediente, { smartExpedientEnabled: true });

  assert.ok(smart.estimated_tokens < full.estimated_tokens, "smart prompt should use fewer tokens");
});

test("idempotent second snapshot is marked as reuse when context is equivalent", async () => {
  const prevFlag = process.env.SMART_CHANGE_DETECTOR_ENABLED;
  process.env.SMART_CHANGE_DETECTOR_ENABLED = "true";

  const { pipeline, indicators } = buildMockPipelineAndIndicators("XAUUSD");
  const snapshotBuilder = new MaestroV3SnapshotBuilder(pipeline, indicators);

  const first = await snapshotBuilder.build({
    analysis_id: `idem-key-${Date.now()}`,
    signal_id: `idem-sig-${Date.now()}`,
    canonical_symbol: "XAUUSD",
    trigger_reason: "SCHEDULED_RECHECK",
  });
  idempotencyStore.register(first.idempotency_key.full_key, "seed-idem-analysis");

  const second = await snapshotBuilder.build({
    analysis_id: `idem-key-2-${Date.now()}`,
    signal_id: `idem-sig-2-${Date.now()}`,
    canonical_symbol: "XAUUSD",
    trigger_reason: "SCHEDULED_RECHECK",
  });

  assert.equal(second.expediente.quality.skip_before_ai?.skip_reason, "IDEMPOTENT_REUSE");

  if (prevFlag === undefined) {
    delete process.env.SMART_CHANGE_DETECTOR_ENABLED;
  } else {
    process.env.SMART_CHANGE_DETECTOR_ENABLED = prevFlag;
  }
});
