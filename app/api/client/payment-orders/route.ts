import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { PaymentOrchestrator } from "@/app/backend/payments/core/orchestrator";
import type { PaymentOrderStatus } from "@/app/backend/payments/core/types";
import { backendDatabase } from "@/app/backend/core/database";

const orchestrator = new PaymentOrchestrator();

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json(
      { error: "La base de datos comercial de pagos no está configurada. No se pueden listar órdenes reales." },
      { status: 409 }
    );
  }

  try {
    const statusRaw = request.nextUrl.searchParams.get("status");
    const status = statusRaw as PaymentOrderStatus | null;

    const data = await orchestrator.listOrders(auth.user.id, status ?? undefined);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list payment orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json(
      { error: "La base de datos comercial de pagos no está configurada. No se pueden crear órdenes reales todavía." },
      { status: 409 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    paymentMethodRequested?: "card_credit" | "card_debit" | "bank_transfer" | "spei" | "cash_voucher" | "wallet" | "other";
    providerPreferred?: "stripe" | "mercadopago" | "openpay" | "custom";
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  };

  const productId = String(body.productId ?? "").trim();
  const idempotencyKey = String(body.idempotencyKey ?? "").trim();

  if (!productId || !idempotencyKey) {
    return NextResponse.json({ error: "productId e idempotencyKey son requeridos" }, { status: 400 });
  }

  try {
    const data = await orchestrator.createOrder({
      userId: auth.user.id,
      productId,
      idempotencyKey,
      paymentMethodRequested: body.paymentMethodRequested,
      providerPreferred: body.providerPreferred,
      metadata: body.metadata,
    });

    return NextResponse.json({ data }, { status: data.idempotent ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
