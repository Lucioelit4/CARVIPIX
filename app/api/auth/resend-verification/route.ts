import { NextRequest, NextResponse } from "next/server";
import { emailNotificationService } from "@/app/backend/notifications";
import { checkTokenIssueGuard, createVerificationToken, findUserByEmail } from "@/app/lib/auth/server";

function buildVerificationUrl(request: NextRequest, verificationToken: string): string {
  const verificationUrl = new URL("/verificar-correo", request.url);
  verificationUrl.searchParams.set("token", verificationToken);
  return verificationUrl.toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Correo invalido" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || user.verificado) {
      return NextResponse.json({ ok: true, message: "Si la cuenta existe y no esta verificada, enviaremos instrucciones." }, { status: 200 });
    }

    const guard = await checkTokenIssueGuard({
      userId: user.id,
      kind: "verification",
      maxInWindow: 5,
      windowMinutes: 60,
      minIntervalSeconds: 45,
    });

    if (!guard.allowed) {
      return NextResponse.json({ ok: true, message: "Si la cuenta existe y no esta verificada, enviaremos instrucciones." }, { status: 200 });
    }

    const token = await createVerificationToken(user.id);
    const verificationUrl = buildVerificationUrl(request, token);

    try {
      const result = await emailNotificationService.sendWelcomeRegistration({
        recipientEmail: user.email,
        recipientName: user.nombre || user.email,
        verificationToken: token,
      });

      console.info("[CARVIPIX][AUTH][RESEND_VERIFICATION][EMAIL]", {
        email: user.email,
        provider: result.provider,
        accepted: result.accepted,
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("[CARVIPIX][AUTH][RESEND_VERIFICATION][EMAIL_FAILED]", {
        email: user.email,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Si la cuenta existe y no esta verificada, enviaremos instrucciones.",
        verificationUrl,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 500 });
  }
}
