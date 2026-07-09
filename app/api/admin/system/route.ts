import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

import { observability } from "@/app/backend/runtime";
import {
  cancelExecutionOrder,
  closeExecutionPosition,
  configureSandboxConnector,
  enqueueExecutionOrder,
  heartbeatExecution,
  modifyExecutionOrder,
  processExecutionQueue,
  reconnectExecution,
  recoverExecution,
  setExecutionRiskLimits,
  simulateMarketTick,
  syncExecutionFromSandbox,
  snapshotExecutionDashboard,
} from "@/app/backend/system/execution-runtime";
import {
  getLatestSystemValidationReport,
  listSystemValidationReports,
  runSystemValidationRuntime,
} from "@/app/backend/system/system-validation";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

function summarizeObservability() {
  const counters = observability.counters.slice(-300);
  const timings = observability.timings.slice(-300);

  const avgResponseMs = timings.length > 0
    ? timings.reduce((sum, item) => sum + item.durationMs, 0) / timings.length
    : 0;

  return {
    counters: counters.length,
    timings: timings.length,
    avgResponseMs: Number(avgResponseMs.toFixed(2)),
    recentCounters: counters.slice(-20),
    recentTimings: timings.slice(-20),
  };
}

async function buildPayload() {
  const [latestValidation, validationHistory, executionDashboard] = await Promise.all([
    getLatestSystemValidationReport(),
    listSystemValidationReports(10),
    snapshotExecutionDashboard(),
  ]);

  return {
    validation: {
      latest: latestValidation,
      history: validationHistory,
    },
    execution: executionDashboard,
    observability: summarizeObservability(),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await buildPayload();
  return NextResponse.json({ ok: true, data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    command?: string;
    orderId?: string;
    positionId?: string;
    ratio?: number;
    reason?: "crash" | "restart" | "disconnect" | "timeout" | "reboot" | "network-loss";
    order?: {
      userId?: string;
      symbol?: string;
      type?: "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP";
      lots?: number;
      requestedPrice?: number;
      stopLoss?: number;
      takeProfit?: number;
    };
    connector?: {
      provider?: "MT5_SANDBOX" | "SIMULATED_BROKER";
      server?: string;
      login?: string;
      password?: string;
    };
    patch?: Record<string, unknown>;
    riskLimits?: Record<string, unknown>;
  };

  if (body.action === "run-validation") {
    const report = await runSystemValidationRuntime();
    const data = await buildPayload();
    return NextResponse.json({ ok: true, report, data }, { status: 200 });
  }

  if (body.action === "execution-command") {
    const command = String(body.command ?? "").trim();

    if (command === "enqueue") {
      const order = body.order ?? {};
      await enqueueExecutionOrder({
        userId: String(order.userId ?? "admin-user"),
        symbol: String(order.symbol ?? "EURUSD"),
        type: (order.type ?? "BUY") as "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP",
        lots: Number(order.lots ?? 0.1),
        requestedPrice: Number.isFinite(order.requestedPrice) ? Number(order.requestedPrice) : undefined,
        stopLoss: Number.isFinite(order.stopLoss) ? Number(order.stopLoss) : undefined,
        takeProfit: Number.isFinite(order.takeProfit) ? Number(order.takeProfit) : undefined,
      });
    } else if (command === "process-queue") {
      await processExecutionQueue();
      await syncExecutionFromSandbox();
    } else if (command === "connect-sandbox") {
      const connector = body.connector ?? {};
      const password = String(connector.password ?? "").trim();
      if (!password) {
        return NextResponse.json({ ok: false, error: "connector.password is required" }, { status: 400 });
      }

      await configureSandboxConnector({
        provider: connector.provider ?? "MT5_SANDBOX",
        server: String(connector.server ?? "demo.carvipix.local"),
        login: String(connector.login ?? "demo_user"),
        password,
      });
    } else if (command === "sync-account") {
      await syncExecutionFromSandbox();
    } else if (command === "market-tick") {
      await simulateMarketTick();
    } else if (command === "modify-order") {
      const orderId = String(body.orderId ?? "").trim();
      if (!orderId) {
        return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
      }
      await modifyExecutionOrder(orderId, {
        lots: Number.isFinite((body.patch ?? {}).lots) ? Number((body.patch ?? {}).lots) : undefined,
        requestedPrice: Number.isFinite((body.patch ?? {}).requestedPrice) ? Number((body.patch ?? {}).requestedPrice) : undefined,
        stopLoss: Number.isFinite((body.patch ?? {}).stopLoss) ? Number((body.patch ?? {}).stopLoss) : undefined,
        takeProfit: Number.isFinite((body.patch ?? {}).takeProfit) ? Number((body.patch ?? {}).takeProfit) : undefined,
      });
    } else if (command === "cancel-order") {
      const orderId = String(body.orderId ?? "").trim();
      if (!orderId) {
        return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
      }
      await cancelExecutionOrder(orderId);
    } else if (command === "close-position") {
      const positionId = String(body.positionId ?? "").trim();
      if (!positionId) {
        return NextResponse.json({ ok: false, error: "positionId is required" }, { status: 400 });
      }
      await closeExecutionPosition(positionId, 1);
    } else if (command === "partial-close") {
      const positionId = String(body.positionId ?? "").trim();
      if (!positionId) {
        return NextResponse.json({ ok: false, error: "positionId is required" }, { status: 400 });
      }
      await closeExecutionPosition(positionId, Number(body.ratio ?? 0.5));
    } else if (command === "heartbeat") {
      await heartbeatExecution();
      await syncExecutionFromSandbox();
    } else if (command === "reconnect") {
      await reconnectExecution();
    } else if (command === "recover") {
      await recoverExecution(body.reason ?? "crash");
    } else if (command === "risk-limits") {
      const limits = body.riskLimits ?? {};
      await setExecutionRiskLimits({
        maximumRiskPct: Number.isFinite(limits.maximumRiskPct) ? Number(limits.maximumRiskPct) : undefined,
        dailyRiskPct: Number.isFinite(limits.dailyRiskPct) ? Number(limits.dailyRiskPct) : undefined,
        weeklyRiskPct: Number.isFinite(limits.weeklyRiskPct) ? Number(limits.weeklyRiskPct) : undefined,
        monthlyRiskPct: Number.isFinite(limits.monthlyRiskPct) ? Number(limits.monthlyRiskPct) : undefined,
        maxDrawdownPct: Number.isFinite(limits.maxDrawdownPct) ? Number(limits.maxDrawdownPct) : undefined,
        maxConsecutiveLosses: Number.isFinite(limits.maxConsecutiveLosses) ? Number(limits.maxConsecutiveLosses) : undefined,
        maxExposureLots: Number.isFinite(limits.maxExposureLots) ? Number(limits.maxExposureLots) : undefined,
        maxCorrelationRiskPct: Number.isFinite(limits.maxCorrelationRiskPct) ? Number(limits.maxCorrelationRiskPct) : undefined,
        maxSlippagePips: Number.isFinite(limits.maxSlippagePips) ? Number(limits.maxSlippagePips) : undefined,
        maxSpreadPips: Number.isFinite(limits.maxSpreadPips) ? Number(limits.maxSpreadPips) : undefined,
      });
    } else {
      return NextResponse.json({ ok: false, error: "Unsupported execution command" }, { status: 400 });
    }

    const data = await buildPayload();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}
