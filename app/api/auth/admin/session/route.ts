import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/app/backend';
import { getClientIp, isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { verifyAdminAccessCode } from '@/app/lib/auth/admin-access-code';
import { clearAdminSessionCookie, isValidAdminSession, setAdminSessionCookie } from '@/app/lib/auth/admin-server';

const ADMIN_DASHBOARD_ACCESS_COOKIE = 'carvipix_admin_dashboard_access';

async function isValidAdminCode(code: unknown): Promise<boolean> {
  if (typeof code !== 'string' || !code.trim()) {
    return false;
  }

  const normalizedCode = code.trim();

  // Prefer persisted admin code (changeable from recovery flow) when available.
  const isPersistedCodeValid = await verifyAdminAccessCode(normalizedCode).catch(() => false);
  if (isPersistedCodeValid) {
    return true;
  }

  const configuredCode = process.env.ADMIN_ACCESS_CODE;
  if (!configuredCode) {
    return false;
  }

  return normalizedCode === configuredCode;
}

export async function GET(request: NextRequest) {
  if (isValidAdminSession(request)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Origen no permitido' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { code?: unknown };

  if (!(await isValidAdminCode(body.code))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const rateLimit = rateLimiter.check({
    scope: 'auth.admin.login',
    key: getClientIp(request),
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Demasiados intentos',
        retryAfter: rateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  rateLimiter.reset('auth.admin.login', getClientIp(request));

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setAdminSessionCookie(response, request);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAdminSessionCookie(response);
  response.cookies.set({
    name: ADMIN_DASHBOARD_ACCESS_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
