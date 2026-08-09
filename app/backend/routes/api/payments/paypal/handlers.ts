/**
 * PayPal Webhook & Payment Endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { paypalService } from "@/app/backend/services/paypalService";

//+------------------------------------------------------------------+
// CREATE ORDER
//+------------------------------------------------------------------+

export async function POST_CreateOrder(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, returnUrl } = body;

    if (!tier || !returnUrl) {
      return NextResponse.json(
        { error: "tier and returnUrl required" },
        { status: 400 }
      );
    }

    const order = await paypalService.createOrder(tier, returnUrl);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[PAYPAL_CREATE_ORDER]", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

//+------------------------------------------------------------------+
// CAPTURE ORDER & CREATE LICENSE
//+------------------------------------------------------------------+

export async function POST_CaptureOrder(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, userEmail } = body;

    if (!orderId || !userId || !userEmail) {
      return NextResponse.json(
        { error: "orderId, userId, userEmail required" },
        { status: 400 }
      );
    }

    const result = await paypalService.captureOrder(orderId, userId, userEmail);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[PAYPAL_CAPTURE_ORDER]", error);
    return NextResponse.json(
      { error: "Failed to capture order" },
      { status: 500 }
    );
  }
}

//+------------------------------------------------------------------+
// PAYPAL WEBHOOK
//+------------------------------------------------------------------+

export async function POST_Webhook(request: NextRequest) {
  try {
    // Obtener headers del webhook
    const transmissionId = request.headers.get("paypal-transmission-id") || "";
    const transmissionTime = request.headers.get("paypal-transmission-time") || "";
    const certUrl = request.headers.get("paypal-cert-url") || "";
    const signature = request.headers.get("paypal-auth-algo") || "";

    // Obtener body
    const webhookBody = await request.text();

    // Verificar firma
    const isValid = await paypalService.verifyWebhookSignature(
      transmissionId,
      transmissionTime,
      certUrl,
      webhookBody,
      signature
    );

    if (!isValid) {
      console.warn("[PAYPAL_WEBHOOK] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // Procesar evento
    const event = JSON.parse(webhookBody);

    console.log(`[PAYPAL_WEBHOOK] Event: ${event.event_type}`);

    // Aquí puedes procesar diferentes tipos de eventos
    // Por ahora solo logged

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[PAYPAL_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

//+------------------------------------------------------------------+
// Route Handlers
//+------------------------------------------------------------------+

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/create-order")) return POST_CreateOrder(request);
  if (pathname.includes("/capture-order")) return POST_CaptureOrder(request);
  if (pathname.includes("/webhook")) return POST_Webhook(request);

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
