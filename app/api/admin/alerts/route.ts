import { NextRequest, NextResponse } from "next/server";

import { ecosystemServices } from "@/app/backend";
import { realSignalLifecycleService } from "@/app/backend/services/real-signal-lifecycle-service";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

  const data = await ecosystemServices.alerts.getAlerts({
    limit,
    includeAuditOnly: true,
  });

  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    symbol?: "XAUUSD" | "EURUSD" | "GBPUSD" | "BTCUSD";
  };

  const symbol = body.symbol ?? "XAUUSD";
  const now = Date.now();
  const signalId = `admin-test-shadow-${now}`;
  const analysisId = `admin-analysis-shadow-${now}`;

  const saved = await realSignalLifecycleService.upsertSignal({
    signalId,
    analysisId,
    symbol,
    decision: "NO_TRADE",
    entry: null,
    stopLoss: null,
    takeProfit: null,
    strategyId: "ADMIN_VISIBILITY_TEST",
    status: "CLOSED",
    source: "ADMIN_ALERT_TEST",
    dataOrigin: "REAL",
    trackingAccount: "INTERNAL",
    signalTimestamp: new Date(now),
    metadata: {
      tags: ["TEST_ONLY", "NON_EXECUTABLE", "NOT_FOR_CLIENTS", "SHADOW"],
      analysisProfile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
      reason: "Admin visual test alert",
      executable: false,
      deliveryBlocked: true,
      stage: "SHADOW",
    },
  });

  return NextResponse.json({ ok: true, data: saved }, { status: 200 });
}
