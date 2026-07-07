import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken } from "@/app/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const ok = await consumeVerificationToken(token);
    if (!ok) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Correo verificado" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el correo" }, { status: 500 });
  }
}
