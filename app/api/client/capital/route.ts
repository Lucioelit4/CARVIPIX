import { NextRequest, NextResponse } from "next/server";
import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { listCapitalRequests } from "@/app/backend/commercial/portal-service";
import { ecosystemServices } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";
import { requireClientSession } from "@/app/api/client/_auth";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const account = await ecosystemServices.capital.getCapitalAccount(auth.user.id);
  const [movements, reports, investorStats] = await Promise.all([
    account ? ecosystemServices.capital.getCapitalMovements(account.accountId) : Promise.resolve([]),
    account ? ecosystemServices.capital.getMonthlyReports(account.accountId) : Promise.resolve([]),
    ecosystemServices.capital.getInvestorStats(),
  ]);
  const requests = await listCapitalRequests(auth.user.id);

  return NextResponse.json(
    {
      data: {
        account,
        movements,
        reports,
        investorStats,
        requests,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "submitRequest" | "requestEvaluation";
    targetCapital?: number;
    riskProfile?: string;
    notes?: string;
    requestId?: string;
  };
  if (body.action !== "submitRequest" && body.action !== "requestEvaluation") {
    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
  }

  if (body.action === "requestEvaluation") {
    const requestId = String(body.requestId ?? "").trim();
    if (!requestId) {
      return NextResponse.json({ error: "requestId invalido" }, { status: 400 });
    }

    await backendDatabase.query(
      `
      UPDATE capital_requests
      SET status = 'contract_sent', updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      `,
      [requestId, auth.user.id]
    );

    await recordCommercialAuditEvent({
      userId: auth.user.id,
      actorType: "client",
      action: "capital.request.evaluation",
      resource: requestId,
      result: "success",
    });

    return NextResponse.json({ ok: true, id: requestId }, { status: 200 });
  }

  const targetCapital = Number(body.targetCapital ?? 0);
  if (!Number.isFinite(targetCapital) || targetCapital <= 0) {
    return NextResponse.json({ error: "targetCapital invalido" }, { status: 400 });
  }

  const id = createId("capitalreq");
  await backendDatabase.query(
    `
    INSERT INTO capital_requests (id, user_id, target_capital, status, risk_profile, notes, created_at, updated_at)
    VALUES ($1, $2, $3, 'pending', $4, $5, NOW(), NOW())
    `,
    [id, auth.user.id, targetCapital, String(body.riskProfile ?? "moderado"), String(body.notes ?? "")]
  );
  await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "capital.request.create", resource: id, result: "success", metadata: { targetCapital } });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
