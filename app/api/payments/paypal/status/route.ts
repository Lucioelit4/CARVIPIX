import { NextResponse } from "next/server";
import { getPayPalSandboxStatus } from "@/app/backend/paypal/sandbox";

export async function GET() {
  try {
    const data = getPayPalSandboxStatus();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo resolver estado de PayPal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
