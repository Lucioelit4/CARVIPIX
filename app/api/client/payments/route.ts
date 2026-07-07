import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const productId = request.nextUrl.searchParams.get("productId");

  const [products, product, orders] = await Promise.all([
    ecosystemServices.payments.getProducts(),
    productId ? ecosystemServices.payments.getProduct(productId) : Promise.resolve(null),
    ecosystemServices.payments.getOrderHistory(auth.user.id),
  ]);

  return NextResponse.json(
    {
      data: {
        products,
        product,
        orders,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      action?: "createOrder" | "processPayment";
      productId?: string;
      orderId?: string;
      method?: "card" | "crypto" | "bank_transfer";
    };

    if (body.action === "createOrder") {
      const data = await ecosystemServices.payments.createOrder(auth.user.id, String(body.productId ?? ""));
      return NextResponse.json({ data }, { status: 200 });
    }

    if (body.action === "processPayment") {
      const orderId = String(body.orderId ?? "");
      const orders = await ecosystemServices.payments.getOrderHistory(auth.user.id);
      if (!orders.some((order) => order.id === orderId)) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }

      const data = await ecosystemServices.payments.processPayment(orderId, body.method ?? "card");
      return NextResponse.json({ data }, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process payment request" }, { status: 500 });
  }
}
