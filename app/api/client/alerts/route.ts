import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const [alerts, stats, rules] = await Promise.all([
    ecosystemServices.alerts.getAlerts({ userId: auth.user.id, limit: Number.isFinite(limit) && limit > 0 ? limit : 50 }),
    ecosystemServices.alerts.getAlertStats(auth.user.id),
    ecosystemServices.alerts.getAlertRules(auth.user.id),
  ]);

  return NextResponse.json(
    {
      data: {
        alerts,
        stats,
        rules,
      },
    },
    { status: 200 }
  );
}
