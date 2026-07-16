#!/usr/bin/env npx tsx
/**
 * Observer CLI — Comandos: start | stop | status | snapshot [symbol]
 * Uso: npx tsx scripts/observer-cli.ts [comando]
 */

const command = process.argv[2] ?? "status";
const symbol = process.argv[3] ?? "XAUUSD";
const token = process.env["INTERNAL_OBSERVER_TOKEN"] ?? "dev-token";
const baseUrl = process.env["OBSERVER_BASE_URL"] ?? "http://localhost:3000";

async function fetchObserver(path: string): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "x-internal-token": token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function main(): Promise<void> {
  switch (command) {
    case "status": {
      console.log("[Observer CLI] Fetching observer status...");
      try {
        const state = await fetchObserver("/api/internal/observer") as Record<string, unknown>;
        console.log("\n═══ Observer Status ═══");
        console.log(`Running:         ${state["running"]}`);
        const obs = state["observer"] as Record<string, unknown>;
        console.log(`Started at:      ${obs?.["started_at"] ?? "not started"}`);
        console.log(`Total analyses:  ${obs?.["total_analyses"] ?? 0}`);
        console.log(`Total skipped:   ${obs?.["total_skipped"] ?? 0}`);
        console.log(`OpenAI cost:     $${(obs?.["total_openai_cost_usd"] as number ?? 0).toFixed(4)}`);
        const paper = state["paper_account"] as Record<string, unknown>;
        console.log(`\n═══ Paper Account (USD 10,000) ═══`);
        console.log(`Balance:         $${(paper?.["balance"] as number ?? 10000).toFixed(2)}`);
        console.log(`Equity:          $${(paper?.["equity"] as number ?? 10000).toFixed(2)}`);
        console.log(`Daily P&L:       $${(paper?.["daily_pnl"] as number ?? 0).toFixed(2)}`);
        console.log(`Total P&L:       $${(paper?.["total_pnl"] as number ?? 0).toFixed(2)}`);
        console.log(`Open trades:     ${paper?.["open_trades"] ?? 0}`);
        console.log(`Win/Loss:        ${paper?.["win_count"] ?? 0}W / ${paper?.["loss_count"] ?? 0}L`);
        console.log(`Win rate:        ${paper?.["win_rate"] !== null ? `${((paper["win_rate"] as number) * 100).toFixed(1)}%` : "n/a"}`);
        console.log(`Max drawdown:    $${(paper?.["max_drawdown_usd"] as number ?? 0).toFixed(2)}`);
        const schedules = state["schedules"] as Array<Record<string, unknown>> ?? [];
        console.log(`\n═══ Scheduler ═══`);
        for (const s of schedules) {
          console.log(`  ${s["symbol"]}: ${s["proximity"]} → review in ${s["recheck_minutes"]}min (${s["next_review_at"]})`);
        }
        const latest = state["latest_by_symbol"] as Record<string, unknown>;
        console.log(`\n═══ Latest by Symbol ═══`);
        for (const [sym, rec] of Object.entries(latest ?? {})) {
          if (!rec) { console.log(`  ${sym}: no data`); continue; }
          const r = rec as Record<string, unknown>;
          console.log(`  ${sym}: ${r["decision"]} | ${r["market_visual_state"]} | prob: ${r["probability"] ?? "n/a"} | cost: $${(r["cost_usd"] as number ?? 0).toFixed(4)} | ${r["timestamp"]}`);
        }
      } catch (err) {
        console.error("Could not reach observer API:", err instanceof Error ? err.message : err);
        console.log("(Is the dev server running? npm run dev)");
      }
      break;
    }

    case "snapshot": {
      console.log(`[Observer CLI] Fetching snapshot for ${symbol}...`);
      try {
        const data = await fetchObserver(`/api/internal/observer/${symbol}`) as Record<string, unknown>;
        console.log(`\n═══ ${symbol} — Observador Snapshot ═══`);
        console.log(`Analysis ID:    ${data["analysis_id"]}`);
        console.log(`Timestamp:      ${data["timestamp"]}`);
        console.log(`\n── Decisión Maestra ──`);
        const md = data["master_decision"] as Record<string, unknown>;
        console.log(`Decision:       ${md?.["decision"]}`);
        console.log(`Direction:      ${md?.["direction"]}`);
        console.log(`Strategy:       ${md?.["strategy_selected"]}`);
        console.log(`Conviction:     ${md?.["conviction"]}`);
        console.log(`Probability:    ${md?.["probability_estimated"] ?? "n/a"}%`);
        console.log(`Basis:          ${md?.["probability_basis"] ?? "n/a"}`);
        console.log(`\n── Estado Visual ──`);
        console.log(`Market state:   ${data["market_visual_state"]}`);
        console.log(`Public summary: ${data["public_summary"]}`);
        console.log(`\n── Adaptive State ──`);
        const as_ = data["adaptive_state"] as Record<string, unknown>;
        console.log(`Proximity:      ${as_?.["proximity_to_entry"]}`);
        console.log(`Recheck:        ${as_?.["recheck_minutes"]}min`);
        console.log(`Scenario:       ${as_?.["scenario_classification"]}`);
        console.log(`Missing for entry: ${as_?.["missing_for_entry"] ?? "none"}`);
        console.log(`\n── Analyst Observations ──`);
        const ao = data["analyst_observations"] as Record<string, unknown>;
        console.log(`Summary:        ${ao?.["summary"]}`);
        console.log(`Narrative:      ${ao?.["scenario_narrative"]}`);
        console.log(`Key obs:        ${ao?.["key_observation"] ?? "none"}`);
        console.log(`\n── Analysis Private (Admin) ──`);
        const ap = data["analysis_private"] as Record<string, unknown>;
        console.log(`Summary:        ${ap?.["analysis_summary"]}`);
        console.log(`Primary risk:   ${ap?.["primary_risk"]}`);
        console.log(`Missing cond:   ${ap?.["missing_condition"] ?? "none"}`);
        console.log(`Decisive:       ${(ap?.["decisive_evidence"] as string[] ?? []).join(" / ")}`);
        console.log(`\n── Meta ──`);
        const m = data["meta"] as Record<string, unknown>;
        console.log(`Model:          ${m?.["model"]}`);
        console.log(`Tokens:         ${m?.["tokens_in"]} in / ${m?.["tokens_out"]} out`);
        console.log(`Cost:           $${m?.["cost_usd"]}`);
        console.log(`Latency:        ${m?.["latency_ms"]}ms`);
        console.log(`\n── Evolution ──`);
        const ev = data["decision_evolution"] as Record<string, unknown>;
        console.log(`Chain (${ev?.["period_hours"]}h): ${ev?.["decision_chain"]}`);
        console.log(`\n── Scenario Lifetime ──`);
        const lt = data["scenario_lifetime"] as Record<string, unknown>;
        console.log(`${lt?.["lifetime_label"]}`);
      } catch (err) {
        console.error("Could not fetch snapshot:", err instanceof Error ? err.message : err);
        console.log("(Is the dev server running? npm run dev)");
      }
      break;
    }

    case "start": {
      console.log("[Observer CLI] Observer starts automatically when the dev server runs.");
      console.log("To start: npm run dev");
      console.log("Observer runner must be integrated into app/api/internal/observer/route.ts startup.");
      break;
    }

    case "stop": {
      console.log("[Observer CLI] Observer stop is managed by the Next.js server lifecycle.");
      console.log("Stop the dev server to stop the observer: Ctrl+C in the server terminal.");
      break;
    }

    default: {
      console.log("Usage: npx tsx scripts/observer-cli.ts [status|snapshot|start|stop] [SYMBOL]");
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
