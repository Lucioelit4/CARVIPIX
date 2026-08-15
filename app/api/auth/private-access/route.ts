import { NextRequest, NextResponse } from "next/server";

import { InMemoryRateLimiter } from "@/app/backend/core/rate-limiter";
import { setPrivateAccessCookie, verifyPrivateAccessPassword } from "@/app/lib/auth/private-access";

const privateAccessRateLimiter = new InMemoryRateLimiter();

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });

  const clientIp = getClientIp(request);
  const rateLimit = privateAccessRateLimiter.check({
    scope: "auth.private-access",
    key: clientIp,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Intenta mas tarde." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const candidate = typeof body.password === "string" ? body.password : "";

  try {
    if (!candidate || !verifyPrivateAccessPassword(candidate)) {
      return NextResponse.json({ ok: false, error: "Acceso no autorizado." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Acceso privado no disponible." }, { status: 503 });
  }

  privateAccessRateLimiter.reset("auth.private-access", clientIp);
  const response = NextResponse.json({ ok: true });
  setPrivateAccessCookie(response);
  return response;
}