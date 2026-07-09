import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { PaymentOrchestrator } from "@/app/backend/payments/core/orchestrator";
import { getPaymentRuntimeConfiguration } from "@/app/backend/payments/core/provider-config";

const orchestrator = new PaymentOrchestrator();

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    returnUrl?: string;
    cancelUrl?: string;
  };

  const returnUrl = String(body.returnUrl ?? "").trim();
  const cancelUrl = String(body.cancelUrl ?? "").trim();

  if (!returnUrl || !cancelUrl) {
    return NextResponse.json({ error: "returnUrl y cancelUrl son requeridos" }, { status: 400 });
  }

  const { orderId } = await context.params;

  try {
    const runtimeConfiguration = await getPaymentRuntimeConfiguration();
    if (runtimeConfiguration.connectionStatus !== "connected") {
      return NextResponse.json(
        {
          error: "La pasarela de pago no está conectada todavía. No se puede iniciar un checkout real hasta completar la integración del proveedor.",
        },
        { status: 409 }
      );
    }

    const data = await orchestrator.createCheckoutSession({
      orderId,
      userId: auth.user.id,
      returnUrl,
      cancelUrl,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
