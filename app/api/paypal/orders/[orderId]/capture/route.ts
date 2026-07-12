import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import { captureSandboxOrder } from "@/app/backend/paypal/sandbox";

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  const { orderId } = await context.params;

  try {
    const data = await captureSandboxOrder({
      orderId,
      user: auth.user,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo capturar la orden PayPal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
