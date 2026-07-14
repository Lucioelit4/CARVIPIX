import { NextRequest, NextResponse } from "next/server";

import { ecosystemServices } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";
import { realSignalLifecycleService } from "@/app/backend/services/real-signal-lifecycle-service";

type IngestBody = {
  signal: {
    signal_id: string;
    analysis_id: string;
    symbol: "XAUUSD" | "EURUSD" | "GBPUSD" | "BTCUSD";
    direction: "BUY" | "SELL" | "NONE";
    entry: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    selected_strategy_id: string;
    status?: string;
    human_review_required?: boolean;
    auto_execution_eligible?: boolean;
    analysis_profile?: string;
    calculated_gross_rr?: number | null;
    calculated_net_rr?: number | null;
    expires_at?: string | null;
  };
  source?: string;
  tags?: string[];
  signalTimestamp?: string;
};

function isAllowed(request: NextRequest): boolean {
  const expected = String(process.env.CARVIPIX_INTERNAL_INGEST_TOKEN ?? "").trim();
  const provided = String(request.headers.get("x-carvipix-ingest-token") ?? "").trim();

  if (expected) {
    return provided === expected;
  }

  const host = String(request.headers.get("host") ?? "").toLowerCase();
  return host.includes("localhost") || host.includes("127.0.0.1");
}

function toDecision(direction: "BUY" | "SELL" | "NONE") {
  if (direction === "BUY") return "ENTER_BUY" as const;
  if (direction === "SELL") return "ENTER_SELL" as const;
  return "WAIT" as const;
}

function toStatus(direction: "BUY" | "SELL" | "NONE") {
  if (direction === "BUY" || direction === "SELL") return "CREATED" as const;
  return "CLOSED" as const;
}

export async function POST(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as IngestBody | null;
  if (!body?.signal?.signal_id || !body.signal.analysis_id || !body.signal.symbol) {
    return NextResponse.json({ ok: false, error: "Missing signal payload" }, { status: 400 });
  }

  const signal = body.signal;
  const tags = Array.isArray(body.tags) && body.tags.length > 0
    ? body.tags.map((item) => String(item))
    : ["TEST_ONLY", "SHADOW", "NON_EXECUTABLE", "NOT_FOR_CLIENTS"];

  const upserted = await realSignalLifecycleService.upsertSignal({
    signalId: signal.signal_id,
    analysisId: signal.analysis_id,
    symbol: signal.symbol,
    decision: toDecision(signal.direction),
    entry: signal.entry,
    stopLoss: signal.stop_loss,
    takeProfit: signal.take_profit,
    strategyId: signal.selected_strategy_id,
    status: toStatus(signal.direction),
    source: body.source ?? "CONTROLLED_E2E_INGEST",
    dataOrigin: "REAL",
    trackingAccount: "INTERNAL",
    signalTimestamp: new Date(body.signalTimestamp ?? Date.now()),
    metadata: {
      tags,
      analysisProfile: signal.analysis_profile ?? "XAUUSD_INTRADAY_H1_M30_M5_V1",
      grossRR: signal.calculated_gross_rr ?? null,
      netRR: signal.calculated_net_rr ?? null,
      expiresAt: signal.expires_at ?? null,
      shadowStatus: signal.status ?? "SHADOW",
      humanReviewRequired: signal.human_review_required ?? true,
      autoExecutionEligible: signal.auto_execution_eligible ?? false,
    },
  });

  const [alerts, history, dashboard, stats, results, countBySignal, operationsCount] = await Promise.all([
    ecosystemServices.alerts.getAlerts({ limit: 100, includeAuditOnly: true }),
    ecosystemServices.history.getHistory(undefined, 100),
    ecosystemServices.dashboard.getSnapshot(),
    ecosystemServices.stats.getSnapshot(),
    ecosystemServices.results.getPlatformResults("monthly"),
    backendDatabase.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM real_signal_lifecycle WHERE signal_id = $1`,
      [signal.signal_id]
    ),
    backendDatabase.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM operations WHERE COALESCE(metadata->>'signalId','') = $1`,
      [signal.signal_id]
    ),
  ]);

  const alertRows = alerts.filter((row) => row.id === signal.signal_id);
  const historyRows = history.filter((row) => row.signalId === signal.signal_id);

  return NextResponse.json({
    ok: true,
    data: {
      signalId: signal.signal_id,
      analysisId: signal.analysis_id,
      lifecycle: upserted,
      lifecycleRowsForSignalId: Number(countBySignal.rows[0]?.total ?? 0),
      consumers: {
        alertsCount: alertRows.length,
        historyCount: historyRows.length,
        dashboardRecentSignals: dashboard.recentSignals,
        statsTotalEvents: stats.totalEvents,
        resultsMasterSignalId: results.masterSignal?.signalId ?? null,
        operationsLinked: Number(operationsCount.rows[0]?.total ?? 0),
      },
      alertSample: alertRows[0] ?? null,
      historySample: historyRows[0] ?? null,
    },
  });
}
