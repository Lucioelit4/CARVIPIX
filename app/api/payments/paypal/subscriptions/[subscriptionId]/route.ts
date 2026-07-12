import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import { getSandboxSubscriptionStatus } from "@/app/backend/paypal/sandbox";

export async function GET(request: NextRequest, context: { params: Promise<{ subscriptionId: string }> }) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  const { subscriptionId } = await context.params;

  try {
    const data = await getSandboxSubscriptionStatus({
      subscriptionId,
      userId: auth.user.id,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar la suscripcion";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
