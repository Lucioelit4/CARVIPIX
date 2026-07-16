import { buildMockPipelineAndIndicators } from "../app/ai/cadpV2/testHarness";
import { MaestroV3SnapshotBuilder } from "../app/ai/cadpV2/snapshotBuilderV3";
import { NarrativeContextBuilder } from "../app/ai/cadpV2/narrativeContextBuilder";
import { ExecutiveSummaryBuilder } from "../app/ai/cadpV2/executiveSummaryBuilder";
import { MaestroV3PromptBuilder } from "../app/ai/cadpV2/promptBuilderV3";

async function run() {
  const { pipeline, indicators } = buildMockPipelineAndIndicators("XAUUSD");
  const sb = new MaestroV3SnapshotBuilder(pipeline, indicators);
  const { expediente } = await sb.build({
    analysis_id: "demo-001",
    signal_id: "sig-demo-001",
    canonical_symbol: "XAUUSD",
    trigger_reason: "SCHEDULED_RECHECK",
  });
  const narrative = new NarrativeContextBuilder().build(expediente);
  const withN = { ...expediente, narrative_context: narrative };
  const summary = new ExecutiveSummaryBuilder().build(withN);
  const full = { ...withN, executive_summary: summary };
  const { prompt_text, estimated_tokens, section_order } = new MaestroV3PromptBuilder().build(full);

  console.log("╔═════════════════════════════════════════════════════════════╗");
  console.log("║        EXPEDIENTE MAESTRO V3 — XAUUSD REAL DEMO             ║");
  console.log("╚═════════════════════════════════════════════════════════════╝\n");

  console.log("▶ IDENTITY");
  console.log(`  Analysis ID:      ${full.identity.analysis_id}`);
  console.log(`  Signal ID:        ${full.identity.signal_id}`);
  console.log(`  Canonical Symbol: ${full.identity.canonical_symbol}`);
  console.log(`  Broker Symbol:    ${full.identity.broker_symbol}`);
  console.log(`  Timestamp UTC:    ${new Date(full.identity.timestamp_utc_ms).toISOString()}`);

  console.log("\n▶ QUALITY GATE");
  console.log(`  Data fresh:       ${full.quality.data_fresh}`);
  console.log(`  Skip before AI:   ${full.quality.skip_before_ai ? JSON.stringify(full.quality.skip_before_ai) : "null"}`);

  console.log("\n▶ MARKET H1");
  console.log(`  Closed candles:   ${full.market_h1.closed_candles.length}`);
  console.log(`  EMA20:            ${full.market_h1.ema20.toFixed(2)}`);
  console.log(`  EMA50:            ${full.market_h1.ema50.toFixed(2)}`);
  console.log(`  EMA200:           ${full.market_h1.ema200.toFixed(2)}`);
  console.log(`  ADX:              ${full.market_h1.adx.toFixed(1)}`);
  console.log(`  ATR:              ${full.market_h1.atr.toFixed(4)}`);
  console.log(`  EMA Order:        ${full.market_h1.ema_order}`);

  console.log("\n▶ MARKET M30");
  console.log(`  Closed candles:   ${full.market_m30.closed_candles.length}`);
  console.log(`  EMA20:            ${full.market_m30.ema20.toFixed(2)}`);
  console.log(`  EMA50:            ${full.market_m30.ema50.toFixed(2)}`);
  console.log(`  EMA Order:        ${full.market_m30.ema_order}`);

  console.log("\n▶ MARKET M5");
  console.log(`  Closed candles:   ${full.market_m5.closed_candles.length}`);
  console.log(`  EMA20:            ${full.market_m5.ema20.toFixed(2)}`);
  console.log(`  EMA50:            ${full.market_m5.ema50.toFixed(2)}`);
  console.log(`  EMA Order:        ${full.market_m5.ema_order}`);

  console.log("\n▶ MULTI-TIMEFRAME ALIGNMENT");
  console.log(`  EMA Alignment Score (H1): ${full.multi_timeframe.ema_alignment_score.h1.toFixed(2)}`);
  console.log(`  ADX H1:                   ${full.multi_timeframe.adx_values.h1.toFixed(1)}`);
  console.log(`  Price vs EMA200 (H1):     ${full.multi_timeframe.price_vs_ema200.h1}`);

  console.log("\n▶ NEWS & RISK");
  console.log(`  Events found:     ${full.news_and_risk.events.length}`);
  console.log(`  In window (120m): ${full.news_and_risk.events_within_operation_window.length}`);

  console.log("\n▶ NARRATIVE CONTEXT (Section 15)");
  console.log(`  Price situation:  ${full.narrative_context.price_situation.slice(0, 120)}...`);
  console.log(`  H1 facts length:  ${full.narrative_context.h1_facts.length} chars`);
  console.log(`  M30 facts length: ${full.narrative_context.m30_facts.length} chars`);

  console.log("\n▶ EXECUTIVE SUMMARY (Section 16)");
  console.log(`  One-liner:        "${full.executive_summary.one_line}"`);
  console.log(`  Attention items:  ${full.executive_summary.attention_items.length}`);
  console.log(`  Missing items:    ${full.executive_summary.missing_items.length}`);
  console.log(`  H1 candles:       ${full.executive_summary.data_inventory.h1_candles_closed}`);
  console.log(`  M30 candles:      ${full.executive_summary.data_inventory.m30_candles_closed}`);
  console.log(`  M5 candles:       ${full.executive_summary.data_inventory.m5_candles_closed}`);

  console.log("\n▶ PROMPT GENERATION");
  console.log(`  Sections:         ${section_order.join(" → ")}`);
  console.log(`  Estimated tokens: ${estimated_tokens}`);
  console.log(`  Prompt length:    ${prompt_text.length} chars`);
  console.log(`\n  First 400 chars of prompt:`);
  console.log(`  ${prompt_text.slice(0, 400)}...`);

  console.log("\n✅ Expediente Maestro V3 construido exitosamente para XAUUSD");
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
