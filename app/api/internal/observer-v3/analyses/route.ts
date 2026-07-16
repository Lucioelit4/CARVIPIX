/**
 * GET /api/internal/observer-v3/analyses
 * Returns list of recent analyses
 */

import { NextRequest, NextResponse } from "next/server";
import { analysisStore } from "@/app/ai/cadpV2/analysisStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);
    const symbol = req.nextUrl.searchParams.get("symbol") as any;

    let analyses;
    if (symbol) {
      analyses = analysisStore.getBySymbol(symbol, limit);
    } else {
      analyses = analysisStore.getLatest(limit);
    }

    return NextResponse.json({
      timestamp_utc_ms: Date.now(),
      success: true,
      count: analyses.length,
      analyses: analyses.map((a) => ({
        analysis_id: a.analysis_id,
        signal_id: a.signal_id,
        canonical_symbol: a.canonical_symbol,
        timestamp_utc_ms: a.timestamp_utc_ms,
        trigger_reason: a.trigger_reason,
        status: a.status,
        decision: a.respuesta_maestra?.master_decision?.decision ?? "N/A",
        probability: a.respuesta_maestra?.master_decision?.probability_estimated ?? 0,
        conviction: a.respuesta_maestra?.master_decision?.conviction ?? "NONE",
        cost_usd: a.response_cost_usd,
        latency_ms: a.response_latency_ms,
        paper_pnl_usd: a.paper_pnl_usd ?? 0,
        dispatch_delivered: a.dispatch_result?.destinations?.filter((d: any) => d.status === "DELIVERED").length ?? 0,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
