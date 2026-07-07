import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const period = (request.nextUrl.searchParams.get("period") as "monthly" | "yearly" | "all-time" | null) ?? "monthly";
  const months = Number(request.nextUrl.searchParams.get("months") ?? 12);

  const [results, history] = await Promise.all([
    ecosystemServices.results.getPlatformResults(period),
    ecosystemServices.results.getHistory(Number.isFinite(months) && months > 0 ? months : 12),
  ]);

  return NextResponse.json(
    {
      data: {
        results,
        history,
      },
    },
    { status: 200 }
  );
}
