import { NextResponse } from "next/server";
import { getLatestSystemValidationReport } from "@/app/backend/system/system-validation";
import { snapshotExecutionDashboard } from "@/app/backend/system/execution-runtime";

export async function GET() {
  const [validation, execution] = await Promise.all([
    getLatestSystemValidationReport(),
    snapshotExecutionDashboard(),
  ]);

  return NextResponse.json(
    {
      status: "ok",
      service: "carvipix",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      safeMode: execution.safeMode,
      execution: {
        queue: execution.orderQueue.length,
        openPositions: execution.openPositions.length,
        accountStatus: execution.account.accountStatus,
      },
      validation: validation
        ? {
            id: validation.id,
            overallStatus: validation.overallStatus,
            summary: validation.summary,
            createdAt: validation.createdAt,
          }
        : null,
    },
    { status: 200 },
  );
}
