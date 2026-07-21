import { NextRequest, NextResponse } from "next/server";

import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { rateLimiter } from "@/app/backend";
import { setAdminAccessCode } from "@/app/lib/auth/admin-access-code";
import { consumeAdminRecoveryToken } from "@/app/lib/auth/admin-recovery";
import { setAdminSessionCookie } from "@/app/lib/auth/admin-server";

type ResetCodeBody = {
  token?: string;
  newCode?: string;
};

function isValidNewCode(value: string): boolean {
  return value.length >= 8 && value.length <= 64;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  const rateLimit = rateLimiter.check({
    scope: "auth.admin.recovery.reset_code",
    key: getClientIp(request),
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiados intentos",
        retryAfter: rateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as ResetCodeBody;
  const token = String(body.token ?? "").trim();
  const newCode = String(body.newCode ?? "").trim();

  if (!isValidNewCode(newCode)) {
    return NextResponse.json({ ok: false, error: "La nueva contraseña debe tener entre 8 y 64 caracteres" }, { status: 400 });
  }

  if (!(await consumeAdminRecoveryToken(token))) {
    return NextResponse.json({ ok: false, error: "Token inválido, expirado o utilizado" }, { status: 401 });
  }

  await setAdminAccessCode(newCode);

  rateLimiter.reset("auth.admin.recovery.reset_code", getClientIp(request));

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setAdminSessionCookie(response, request);

  return response;
}
