import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { PaymentOrchestrator } from "@/app/backend/payments/core/orchestrator";

const orchestrator = new PaymentOrchestrator();

export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { orderId } = await context.params;

  try {
    const data = await orchestrator.getOrderDetail(auth.user.id, orderId);
    if (!data) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
