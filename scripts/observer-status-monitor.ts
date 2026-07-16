/**
 * Observer Status Monitor - Shows real-time state of Maestro V3 scheduler
 * This is NOT a runner. The scheduler runs automatically.
 * This script simply displays current status.
 * 
 * Uso: npx tsx scripts/observer-status-monitor.ts
 */

import { observerV3 } from "../app/ai/cadpV2/observerV3";
import { adaptiveScheduler } from "../app/ai/cadpV2/schedulerAdaptativo";
import { analysisStore } from "../app/ai/cadpV2/analysisStore";
import { ALL_CANONICAL_SYMBOLS } from "../app/ai/cadpV2/instrumentRegistry";

function displayStatus() {
  const state = observerV3.getObserverState();
  const now = Date.now();
  const recentAnalyses = analysisStore.getLatest(10);

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║      OBSERVADOR MAESTRO V3 — ESTADO EN VIVO               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Overall state
  console.log("📊 ESTADO GENERAL:");
  console.log(`   Scheduler:    ${state.running ? "✅ Activo" : "❌ Inactivo"}`);
  console.log(`   Timestamp:    ${new Date(now).toISOString()}`);
  console.log(`   Total análisis:  ${state.total_analyses}`);
  console.log(`   Costo acumulado: $${(state.daily_summary?.openai_cost_total_usd ?? 0).toFixed(4)}`);
  console.log();

  // Per-instrument status
  console.log("🎯 ESTADO POR INSTRUMENTO:");
  for (const symbol of ALL_CANONICAL_SYMBOLS) {
    const latest = analysisStore.getBySymbol(symbol, 1)?.[0];
    if (latest) {
      const lastAnalysisAge = (now - (latest.timestamp_utc_ms ?? 0)) / 1000 / 60; // minutes
      console.log(`   ${symbol}:`);
      console.log(`      Último análisis: hace ${Math.round(lastAnalysisAge)}m`);
      console.log(`      Status: ${latest.response_valid ? "✅ Válido" : "⚠️ Inválido"}`);
      console.log(`      Decisión: ${latest.respuesta_maestra?.master_decision?.decision ?? "—"}`);
      console.log(`      Analysis ID: ${latest.analysis_id}`);
    } else {
      console.log(`   ${symbol}: (sin análisis)`);
    }
  }
  console.log();

  // Recent analyses
  console.log("📈 ÚLTIMOS ANÁLISIS COMPLETADOS:");
  if (recentAnalyses.length === 0) {
    console.log("   (ninguno registrado aún)");
  } else {
    recentAnalyses.slice(0, 3).forEach((a, i) => {
      console.log(`   [${i + 1}] ${a.canonical_symbol}`);
      console.log(`       Status: ${a.status}`);
      console.log(`       Decision: ${a.respuesta_maestra?.master_decision?.decision ?? "—"}`);
      console.log(`       Cost: $${a.response_cost_usd.toFixed(4)}`);
      console.log(`       Latency: ${a.response_latency_ms}ms`);
      console.log(`       Analysis ID: ${a.analysis_id}`);
    });
  }
  console.log();

  // Paper account
  console.log("💰 CUENTA PAPER (USD 10,000):");
  console.log(`   Balance: $${state.paper_account?.current_balance_usd.toFixed(2) ?? "—"}`);
  console.log(`   Equity: $${state.paper_account?.equity_usd.toFixed(2) ?? "—"}`);
  console.log(`   Win Rate: ${state.paper_account?.win_rate ? (state.paper_account.win_rate * 100).toFixed(1) : "—"}%`);
  console.log(`   Operaciones abiertas: ${state.paper_account?.open_trades.length ?? 0}`);
  console.log();

  console.log("ℹ️  El Scheduler está activo y monitoreando. Los análisis ocurren automáticamente.");
  console.log("    Visita http://localhost:3000/admin/observer-v3 para ver en vivo.\n");
}

// Show status once
displayStatus();

// Optionally show updates every 10 seconds
const args = process.argv.slice(2);
if (args.includes("--live")) {
  console.log("📡 Modo en vivo (actualiza cada 10 segundos). Presiona Ctrl+C para salir.\n");
  setInterval(displayStatus, 10000);
}
