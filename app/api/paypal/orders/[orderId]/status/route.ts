import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import { getPayPalOrderStatus } from "@/app/backend/paypal/sandbox";

export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  const { orderId } = await context.params;

  try {
    const data = await getPayPalOrderStatus({
      orderId,
      userId: auth.user.id,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar la orden";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
