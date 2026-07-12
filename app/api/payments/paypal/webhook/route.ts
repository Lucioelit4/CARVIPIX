import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { verifyAndProcessPayPalWebhook } from "@/app/backend/paypal/sandbox";

export async function POST(request: NextRequest) {
  if (!backendDatabase.enabled) {
    return NextResponse.json({ error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  const payloadRaw = await request.text();

  const headers = {
    "paypal-transmission-id": request.headers.get("paypal-transmission-id"),
    "paypal-transmission-time": request.headers.get("paypal-transmission-time"),
    "paypal-transmission-sig": request.headers.get("paypal-transmission-sig"),
    "paypal-cert-url": request.headers.get("paypal-cert-url"),
    "paypal-auth-algo": request.headers.get("paypal-auth-algo"),
  };

  try {
    const data = await verifyAndProcessPayPalWebhook({
      headers,
      payloadRaw,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar webhook PayPal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
