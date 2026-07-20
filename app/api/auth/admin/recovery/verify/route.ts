import { NextRequest, NextResponse } from "next/server";

import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { rateLimiter } from "@/app/backend";
import { verifyAdminRecoveryToken } from "@/app/lib/auth/admin-recovery";
import { setAdminSessionCookie } from "@/app/lib/auth/admin-server";

type VerifyBody = {
  token?: string;
};

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  const rateLimit = rateLimiter.check({
    scope: "auth.admin.recovery.verify",
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

  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const token = String(body.token ?? "").trim();

  if (!verifyAdminRecoveryToken(token)) {
    return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 401 });
  }

  rateLimiter.reset("auth.admin.recovery.verify", getClientIp(request));

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setAdminSessionCookie(response, request);

  return response;
}
