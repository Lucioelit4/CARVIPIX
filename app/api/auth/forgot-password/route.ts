import { NextRequest, NextResponse } from "next/server";
import { emailNotificationService } from "@/app/backend/notifications";
import { checkTokenIssueGuard, createPasswordResetToken, findUserByEmail } from "@/app/lib/auth/server";
import { resolvePublicAppUrl } from "@/app/lib/url/public-app-url";

function buildResetUrl(request: NextRequest, resetToken: string): string {
  const resetUrl = new URL("/recuperar-password", resolvePublicAppUrl({ requestUrl: request.url }));
  resetUrl.searchParams.set("token", resetToken);
  return resetUrl.toString();
}

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

    const guard = await checkTokenIssueGuard({
      userId: user.id,
      kind: "password-reset",
      maxInWindow: 5,
      windowMinutes: 60,
      minIntervalSeconds: 45,
    });

    if (!guard.allowed) {
      return NextResponse.json({ ok: true, message: "Si el correo existe, enviaremos instrucciones." }, { status: 200 });
    }

    const resetToken = await createPasswordResetToken(user.id);
    const resetUrl = buildResetUrl(request, resetToken);

    try {
      const result = await emailNotificationService.sendPasswordReset({
        recipientEmail: user.email,
        recipientName: user.nombre || user.email,
        resetToken,
      });

      console.info("[CARVIPIX][AUTH][FORGOT_PASSWORD][EMAIL]", {
        email: user.email,
        provider: result.provider,
        accepted: result.accepted,
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("[CARVIPIX][AUTH][FORGOT_PASSWORD][EMAIL_FAILED]", {
        email: user.email,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Si el correo existe, enviaremos instrucciones.",
        resetUrl,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 });
  }
}
