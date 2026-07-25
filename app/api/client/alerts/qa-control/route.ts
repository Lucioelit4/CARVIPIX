import { NextRequest, NextResponse } from "next/server";

import { requireClientSession } from "@/app/api/client/_auth";
import {
  getAlertsQaPayload,
  isAlertsQaControlAuthorized,
  isAlertsQaModeEnabled,
  listAlertsQaScenarios,
  setAlertsQaScenario,
  type AlertsQaScenario,
} from "@/app/backend/services/alerts-qa-dataset";

function isSupportedScenario(value: string): value is AlertsQaScenario {
  return (listAlertsQaScenarios() as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  if (!isAlertsQaModeEnabled()) {
    return NextResponse.json({ error: "QA mode unavailable" }, { status: 404 });
  }

  if (!isAlertsQaControlAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized QA control" }, { status: 403 });
  }

  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json(
    {
      data: {
        enabled: true,
        scenarios: listAlertsQaScenarios(),
        current: getAlertsQaPayload(auth.user.id),
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  if (!isAlertsQaModeEnabled()) {
    return NextResponse.json({ error: "QA mode unavailable" }, { status: 404 });
  }

  if (!isAlertsQaControlAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized QA control" }, { status: 403 });
  }

  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    scenario?: string;
  };

  const scenario = String(body.scenario ?? "").trim();
  if (!isSupportedScenario(scenario)) {
    return NextResponse.json({ error: "Scenario not supported" }, { status: 400 });
  }

  const payload = setAlertsQaScenario(auth.user.id, scenario);
  return NextResponse.json({ data: payload }, { status: 200 });
}
