import { NextRequest, NextResponse } from "next/server";
import { emailNotificationService } from "@/app/backend/notifications";
import { consumePasswordResetToken, hashPassword, resolvePasswordResetTokenRecipient } from "@/app/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!token || password.length < 8) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const recipient = await resolvePasswordResetTokenRecipient(token);

    const ok = await consumePasswordResetToken(token, hashPassword(password));
    if (!ok) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    if (recipient) {
      try {
        await emailNotificationService.sendPasswordChangedConfirmation({
          recipientEmail: recipient.email,
          recipientName: recipient.nombre || recipient.email,
        });
      } catch (error) {
        console.error("[CARVIPIX][AUTH][RESET_PASSWORD][PASSWORD_CHANGED_EMAIL_FAILED]", {
          userId: recipient.userId,
          reason: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return NextResponse.json({ ok: true, message: "Contraseña actualizada" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la contraseña" }, { status: 500 });
  }
}
