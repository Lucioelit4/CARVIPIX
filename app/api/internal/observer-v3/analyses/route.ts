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
      summary: {
        total_cycles: analyses.length,
        api_calls_made: analyses.filter((a) => a.api_called).length,
        api_calls_avoided: analyses.filter((a) => a.status === "REUSED_PREVIOUS_ANALYSIS").length,
        reuse_pct: analyses.length > 0
          ? Math.round((analyses.filter((a) => a.status === "REUSED_PREVIOUS_ANALYSIS").length / analyses.length) * 10000) / 100
          : 0,
        tokens_input: analyses.reduce((sum, a) => sum + (a.tokens_input ?? 0), 0),
        tokens_output: analyses.reduce((sum, a) => sum + (a.tokens_output ?? 0), 0),
        tokens_avoided: analyses.reduce((sum, a) => sum + (a.tokens_avoided ?? 0), 0),
        cost_usd_consumed: analyses.reduce((sum, a) => sum + (a.response_cost_usd ?? 0), 0),
        cost_usd_avoided: analyses.reduce((sum, a) => sum + (a.cost_avoided_usd ?? 0), 0),
      },
      analyses: analyses.map((a) => ({
        analysis_id: a.analysis_id,
        signal_id: a.signal_id,
        canonical_symbol: a.canonical_symbol,
        timestamp_utc_ms: a.timestamp_utc_ms,
        trigger_reason: a.trigger_reason,
        status: a.status,
        decision: a.respuesta_maestra?.master_decision?.decision ?? "N/A",
        horizon: a.respuesta_maestra?.horizon ?? "N/A",
        quality: a.respuesta_maestra?.quality ?? "N/A",
        confidence_level: a.respuesta_maestra?.confidence ?? "N/A",
        public_explanation: a.respuesta_maestra?.public_explanation?.slice(0, 220) ?? null,
        probability: a.respuesta_maestra?.master_decision?.probability_estimated ?? 0,
        conviction: a.respuesta_maestra?.master_decision?.conviction ?? "NONE",
        api_called: a.api_called,
        reuse_of_analysis_id: a.reuse_of_analysis_id ?? null,
        reuse_reason: a.reuse_reason ?? null,
        material_changes_detected: a.material_changes_detected ?? [],
        scenario_signature: a.scenario_signature ?? null,
        tokens_input: a.tokens_input ?? 0,
        tokens_output: a.tokens_output ?? 0,
        tokens_avoided: a.tokens_avoided ?? 0,
        cost_usd: a.response_cost_usd,
        cost_avoided_usd: a.cost_avoided_usd ?? 0,
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
