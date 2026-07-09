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

  return NextResponse.json(
    {
      error: "Este endpoint legacy de pagos ya no procesa compras. Usa /api/client/payment-orders y /checkout-session para el flujo comercial vigente.",
    },
    { status: 410 }
  );
}
