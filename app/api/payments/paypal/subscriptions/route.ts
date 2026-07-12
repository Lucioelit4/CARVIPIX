import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import { backendDatabase } from "@/app/backend/core/database";
import { listMissingRequiredPaymentAcceptances } from "@/app/backend/compliance/compliance-service";
import { createSandboxSubscription } from "@/app/backend/paypal/sandbox";

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

  const missingRequired = await listMissingRequiredPaymentAcceptances(auth.user.id);
  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: "Debes aceptar todos los documentos legales activos antes de pagar",
        requiredDocuments: missingRequired,
      },
      { status: 412 }
    );
  }

  try {
    const data = await createSandboxSubscription({
      productId,
      user: auth.user,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la suscripcion PayPal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
