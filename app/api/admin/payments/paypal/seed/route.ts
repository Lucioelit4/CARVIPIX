import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { backendDatabase } from "@/app/backend/core/database";
import { seedPayPalCatalog } from "@/app/backend/paypal/sandbox";

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!backendDatabase.enabled) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL no configurado" }, { status: 409 });
  }

  try {
    const data = await seedPayPalCatalog();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo seedear catalogo PayPal";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
