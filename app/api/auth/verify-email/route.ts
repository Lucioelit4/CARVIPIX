import { NextRequest, NextResponse } from "next/server";
import { emailNotificationService } from "@/app/backend/notifications";
import { consumeVerificationToken, resolveVerificationTokenRecipient } from "@/app/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = String(body.token ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const recipient = await resolveVerificationTokenRecipient(token);

    const ok = await consumeVerificationToken(token);
    if (!ok) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    if (recipient) {
      try {
        await emailNotificationService.sendWelcomeActivated({
          recipientEmail: recipient.email,
          recipientName: recipient.nombre || recipient.email,
        });
      } catch (error) {
        console.error("[CARVIPIX][AUTH][VERIFY_EMAIL][WELCOME_ACTIVATED_FAILED]", {
          userId: recipient.userId,
          reason: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return NextResponse.json({ ok: true, message: "Correo verificado" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el correo" }, { status: 500 });
  }
}
