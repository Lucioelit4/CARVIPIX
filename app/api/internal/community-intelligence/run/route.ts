import { NextRequest, NextResponse } from "next/server";
import { analysisStore } from "@/app/ai/cadpV2/analysisStore";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { processStoredAnalysisForCommunity } from "@/app/lib/community-intelligence/runtime";
import { COMMUNITY_AUTOMATION_DISABLED_REASON, isCommunityAutomationEnabled } from "@/app/lib/community-intelligence/automation";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.COMMUNITY_CRON_TOKEN?.trim();
  const providedToken = request.headers.get("x-community-cron-token")?.trim();
  return Boolean(expectedToken && providedToken && expectedToken === providedToken) || isSameOriginRequest(request);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (!isCommunityAutomationEnabled()) {
    return NextResponse.json({ ok: true, disabled: true, reason: COMMUNITY_AUTOMATION_DISABLED_REASON });
  }
  if (process.env.COMMUNITY_INTELLIGENCE_ENABLED !== "true") {
    return NextResponse.json({ ok: false, error: "COMMUNITY_INTELLIGENCE_DISABLED" }, { status: 503 });
  }

  const configuredBatchSize = Number(process.env.COMMUNITY_CRON_BATCH_SIZE ?? 20);
  const batchSize = Number.isFinite(configuredBatchSize)
    ? Math.min(Math.max(Math.trunc(configuredBatchSize), 1), 100)
    : 20;
  const analyses = analysisStore
    .getLatest(100)
    .filter((analysis) => analysis.status === "COMPLETED")
    .slice(0, batchSize)
    .reverse();
  const results: unknown[] = [];
  for (const analysis of analyses) {
    try {
      results.push(await processStoredAnalysisForCommunity(analysis));
    } catch (error) {
      results.push({
        analysis_id: analysis.analysis_id,
        failed: true,
        error: error instanceof Error ? error.message : "COMMUNITY_UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({
    ok: results.every((result) => !(result as { failed?: boolean }).failed),
    processed_at: new Date().toISOString(),
    source_count: analyses.length,
    results,
  });
}