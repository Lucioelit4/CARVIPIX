import { NextResponse } from "next/server";
import { getLatestSystemValidationReport } from "@/app/backend/system/system-validation";
import { snapshotExecutionDashboard } from "@/app/backend/system/execution-runtime";

export async function GET() {
  const [validationResult, executionResult] = await Promise.allSettled([
    getLatestSystemValidationReport(),
    snapshotExecutionDashboard(),
  ]);

  const validation = validationResult.status === "fulfilled" ? validationResult.value : null;
  const execution = executionResult.status === "fulfilled" ? executionResult.value : null;
  const degraded = validationResult.status === "rejected" || executionResult.status === "rejected";

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "ok",
      service: "carvipix",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      safeMode: execution?.safeMode ?? true,
      execution: {
        queue: execution?.orderQueue.length ?? 0,
        openPositions: execution?.openPositions.length ?? 0,
        accountStatus: execution?.account.accountStatus ?? "warning",
      },
      validation: validation
        ? {
            id: validation.id,
            overallStatus: validation.overallStatus,
            summary: validation.summary,
            createdAt: validation.createdAt,
          }
        : null,
      components: {
        validation: validationResult.status,
        execution: executionResult.status,
      },
    },
    { status: 200 },
  );
}
