import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, findUserByEmail } from "@/app/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ ok: true, message: "Si el correo existe, enviaremos instrucciones." }, { status: 200 });
    }

    const resetToken = await createPasswordResetToken(user.id);

    return NextResponse.json(
      {
        ok: true,
        message: "Si el correo existe, enviaremos instrucciones.",
        resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 });
  }
}
