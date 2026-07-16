/**
 * GET /api/internal/observer-v3/status
 * Returns summary of all recent analyses by symbol
 */

import { NextResponse } from "next/server";
import { analysisStore } from "@/app/ai/cadpV2/analysisStore";
import { paperTradeMonitor } from "@/app/ai/cadpV2/paperTradeMonitor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const summary = analysisStore.getSummary();
    const paperAccount = paperTradeMonitor.getAccountState();

    return NextResponse.json({
      timestamp_utc_ms: Date.now(),
      success: true,
      instruments: summary,
      paper_account: paperAccount,
      total_analyses: Object.values(summary).reduce((sum, s) => sum + s.total_analyses, 0),
      total_cost_usd: Object.values(summary).reduce((sum, s) => sum + s.total_cost_usd, 0),
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
