import { NextResponse } from "next/server";
import { listOfferings } from "@/app/backend/paypal/sandbox";

export async function GET() {
  try {
    const data = await listOfferings();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron listar productos PayPal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
