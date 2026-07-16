import "server-only";
import { NextResponse } from "next/server";
import { observerV3 } from "@/app/ai/cadpV2/observerV3";
import { paperTradeMonitor } from "@/app/ai/cadpV2/paperTradeMonitor";
import { adaptiveScheduler } from "@/app/ai/cadpV2/schedulerAdaptativo";
import { isObserverRunning } from "@/app/ai/cadpV2/observerRunner";

/**
 * GET /api/internal/observer
 * Returns full Observer state for the admin panel.
 * Admin access only — never exposed to public clients.
 */
export async function GET(request: Request): Promise<NextResponse> {
  // Basic internal auth — production should use proper session check
  const authHeader = request.headers.get("x-internal-token");
  const expectedToken = process.env["INTERNAL_OBSERVER_TOKEN"];

  if (!expectedToken || authHeader !== expectedToken) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const state = observerV3.getObserverState();
  const paper = paperTradeMonitor.getAccountState();
  const schedules = adaptiveScheduler.getAllSchedules();

  return NextResponse.json({
    running: isObserverRunning(),
    observer: {
      started_at: state.started_at,
      total_analyses: state.total_analyses,
      total_skipped: state.total_skipped,
      total_openai_cost_usd: state.total_openai_cost_usd,
      errors_recent: state.errors,
      daily_summary: state.daily_summary,
    },
    paper_account: {
      balance: paper.current_balance_usd,
      equity: paper.equity_usd,
      daily_pnl: paper.daily_pnl_usd,
      total_pnl: paper.total_pnl_usd,
      open_trades: paper.open_trades.length,
      win_count: paper.win_count,
      loss_count: paper.loss_count,
      expired_count: paper.expired_count,
      win_rate: paper.win_rate,
      avg_rr: paper.avg_rr_achieved,
      max_drawdown_usd: paper.max_drawdown_usd,
      drawdown_pct: paper.drawdown_pct,
      openai_cost_total_usd: paper.openai_cost_total_usd,
    },
    schedules: schedules.map(s => ({
      symbol: s.canonical_symbol,
      proximity: s.proximity,
      recheck_minutes: s.recheck_minutes,
      next_review_at: new Date(s.next_review_at_ms).toISOString(),
    })),
    latest_by_symbol: Object.fromEntries(
      Object.entries(state.latest_by_symbol).map(([sym, rec]) => [
        sym,
        rec
          ? {
              analysis_id: rec.analysis_id,
              timestamp: rec.timestamp_iso,
              status: rec.status,
              decision: rec.response_raw?.master_decision.decision ?? null,
              probability: rec.response_raw?.master_decision.probability_estimated ?? null,
              conviction: rec.response_raw?.master_decision.conviction ?? null,
              market_visual_state: rec.response_raw?.analysis_public.market_visual_state ?? null,
              scenario_classification: rec.response_raw?.adaptive_state.scenario_classification ?? null,
              proximity: rec.response_raw?.adaptive_state.proximity_to_entry ?? null,
              analyst_summary: rec.response_raw?.analyst_observations.summary ?? null,
              cost_usd: rec.cost_usd,
              latency_ms: rec.latency_ms,
            }
          : null,
      ])
    ),
  });
}
