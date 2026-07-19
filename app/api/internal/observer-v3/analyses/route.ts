/**
 * GET /api/internal/observer-v3/analyses
 * Returns list of recent analyses
 */

import { NextRequest, NextResponse } from "next/server";
import { analysisStore } from "@/app/ai/cadpV2/analysisStore";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import type { CanonicalSymbol } from "@/app/ai/cadpV2/typesMaestroV3";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnalysisSummary = {
  dispatch_result?: {
    destinations?: Array<{ status?: string }>;
  };
};

export async function GET(req: NextRequest) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);
    const symbol = req.nextUrl.searchParams.get("symbol");

    let analyses;
    if (symbol) {
      analyses = analysisStore.getBySymbol(symbol as CanonicalSymbol, limit);
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
        dispatch_delivered: ((a as AnalysisSummary).dispatch_result?.destinations ?? []).filter((destination) => destination.status === "DELIVERED").length,
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
