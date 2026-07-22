import { NextResponse } from "next/server";
import { globalResultsService } from "@/app/backend/results/global-results-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await globalResultsService.getSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}