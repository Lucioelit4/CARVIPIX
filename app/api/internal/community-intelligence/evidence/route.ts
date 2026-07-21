import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { communityRepository } from "@/app/lib/community-intelligence/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const traceId = request.nextUrl.searchParams.get("trace_id")?.trim();
  if (!traceId) {
    return NextResponse.json({ ok: false, error: "trace_id is required" }, { status: 400 });
  }
  const evidence = await communityRepository.evidence(traceId);
  return NextResponse.json({
    ok: evidence.length > 0,
    trace_id: traceId,
    stage_count: evidence.length,
    evidence,
    fetched_at: new Date().toISOString(),
  });
}