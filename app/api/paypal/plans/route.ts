import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import { PAYPAL_OFFERINGS, ensureSubscriptionPlanForOffering } from "@/app/backend/paypal/sandbox";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      {
        data: Object.values(PAYPAL_OFFERINGS).filter((item) => item.type === "subscription"),
      },
      { status: 200 }
    );
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  try {
    const data = await ensureSubscriptionPlanForOffering(productId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar el plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as { productId?: string };
  const productId = String(body.productId || "").trim();

  if (!productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }

  try {
    const data = await ensureSubscriptionPlanForOffering(productId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear/consultar el plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
