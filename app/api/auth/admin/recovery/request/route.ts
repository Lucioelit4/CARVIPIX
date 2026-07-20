import { NextRequest, NextResponse } from "next/server";

import { emailNotificationService } from "@/app/backend/notifications";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { createAdminRecoveryToken, getAdminRecoveryEmail } from "@/app/lib/auth/admin-recovery";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  const recoveryEmail = getAdminRecoveryEmail();
  if (!recoveryEmail) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const token = createAdminRecoveryToken();
  const publicBaseUrl = (process.env.APP_PUBLIC_URL || request.nextUrl.origin).replace(/\/$/, "");
  const recoveryUrl = `${publicBaseUrl}/admin?admin_recovery_token=${encodeURIComponent(token)}`;

  try {
    await emailNotificationService.sendEmail({
      senderRole: "soporte",
      to: { email: recoveryEmail, name: "Administrador" },
      replyTo: { email: process.env.EMAIL_SUPPORT_ADDRESS || "support@carvipix.com", name: "CARVIPIX Soporte" },
      subject: "Recuperar y cambiar contraseña admin CARVIPIX",
      html: `<p>Se solicitó recuperación de acceso al panel administrador.</p><p><strong>Paso 1:</strong> abre este enlace.</p><p><a href="${recoveryUrl}">Cambiar contraseña admin</a></p><p><strong>Paso 2:</strong> escribe la nueva contraseña en la pantalla y guarda.</p><p>Este enlace expira en 10 minutos.</p><p>Si el botón no abre, copia y pega este enlace en tu navegador:</p><p>${recoveryUrl}</p>`,
      text: `Se solicitó recuperación de acceso admin.\n\nPaso 1: abre este enlace (expira en 10 minutos):\n${recoveryUrl}\n\nPaso 2: escribe la nueva contraseña admin y guarda.`,
      headers: {
        "X-CARVIPIX-Template": "security-admin-recovery",
      },
    });
  } catch {
    // Keep response generic to avoid information disclosure.
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
