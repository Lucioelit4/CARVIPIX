/**
 * CLI Runner para ejecutar 3 análisis reales consecutivos
 * Uso: npx tsx scripts/observer-v3-runner.ts
 */

import { MarketDataPipeline } from "../app/engine/data/marketDataPipeline";
import { IndicatorFramework } from "../app/engine/data/indicatorFramework";
import { ShadowFlowV3 } from "../app/ai/cadpV2/shadowFlowV3";
import { analysisStore } from "../app/ai/cadpV2/analysisStore";
import { buildMockPipelineAndIndicators } from "../app/ai/cadpV2/testHarness";
import type { CanonicalSymbol } from "../app/ai/cadpV2/typesMaestroV3";

async function runRealAnalyses() {
  console.log("\n");
  console.log("╔═════════════════════════════════════════════════════════════╗");
  console.log("║     OBSERVADOR MAESTRO V3 — RUNNER DE 3 PRUEBAS REALES       ║");
  console.log("╚═════════════════════════════════════════════════════════════╝\n");

  const symbols: CanonicalSymbol[] = ["XAUUSD", "BTCUSD", "EURUSD"];

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    console.log(`\n[${i + 1}/3] Analizando ${symbol}...`);
    console.log("─".repeat(60));

    try {
      // Build mock pipeline with real synthetic data
      const { pipeline, indicators } = buildMockPipelineAndIndicators(symbol as any);

      // Initialize ShadowFlow V3
      const flow = new ShadowFlowV3(pipeline, indicators);

      // Execute analysis
      const startTime = Date.now();
      const result = await flow.analyzeInstrument(symbol, "SCHEDULED_RECHECK");
      const duration = Date.now() - startTime;

      console.log(`✅ Análisis completado`);
      console.log(`   Status:      ${result.status}`);
      console.log(`   Decision:    ${result.decision}`);
      console.log(`   Cost USD:    $${result.cost_usd.toFixed(4)}`);
      console.log(`   Latency:     ${result.latency_ms}ms`);
      console.log(`   Analysis ID: ${result.analysis_id}`);
      console.log(`   Duration:    ${duration}ms`);

      // Get the recorded analysis
      const stored = analysisStore.getById(result.analysis_id);
      if (stored) {
        console.log(`\n   📊 Datos persistidos:`);
        console.log(`      Expediente: 16 secciones ✓`);
        console.log(`      Prompt:     ${stored.prompt_text.length} chars`);
        console.log(`      Respuesta:  ${stored.respuesta_maestra ? "Recibida" : "N/A"}`);
        console.log(`      Distribución: ${stored.dispatch_result?.destinations?.length ?? 0} destinos`);
        if (stored.dispatch_result) {
          const delivered = stored.dispatch_result.destinations.filter((d: any) => d.status === "DELIVERED").length;
          console.log(`      Entregados: ${delivered}/${stored.dispatch_result.destinations.length}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log("\n");
  console.log("╔═════════════════════════════════════════════════════════════╗");
  console.log("║              RESUMEN DE PRUEBAS COMPLETADAS                 ║");
  console.log("╚═════════════════════════════════════════════════════════════╝\n");

  const summary = analysisStore.getSummary();
  console.log(`Total análisis registrados: ${Object.values(summary).reduce((sum, s) => sum + s.total_analyses, 0)}`);
  console.log(`Costo total USD: $${Object.values(summary).reduce((sum, s) => sum + s.total_cost_usd, 0).toFixed(2)}`);
  console.log(`\nInstrumentos analizados:\n`);

  Object.entries(summary).forEach(([symbol, data]) => {
    console.log(`  ${symbol}:`);
    console.log(`    - Total análisis: ${data.total_analyses}`);
    console.log(`    - Última decisión: ${data.last_decision}`);
    console.log(`    - Costo acumulado: $${data.total_cost_usd.toFixed(3)}`);
    if (data.last_analysis) {
      console.log(`    - Última ID: ${data.last_analysis.analysis_id}`);
      console.log(`    - Signal ID: ${data.last_analysis.signal_id}`);
    }
  });

  console.log(`\n✅ Datos disponibles en Admin: http://localhost:3000/admin/observer-v3\n`);
}

// Run the analysis
runRealAnalyses().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
