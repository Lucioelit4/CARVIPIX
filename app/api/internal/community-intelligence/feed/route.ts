import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { communityRepository } from "@/app/lib/community-intelligence/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const publications = await communityRepository.list(limit);
  return NextResponse.json({
    ok: true,
    informational_only: true,
    separated_from_alert_history: true,
    fetched_at: new Date().toISOString(),
    publications,
  });
}