import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/app/backend";
import {
  AUTH_ROLE_COOKIE,
  AUTH_SESSION_COOKIE,
  createSession,
  ensureInactiveMembership,
  findUserByEmail,
  findMembershipByUserId,
  verifyPassword,
} from "@/app/lib/auth/server";

function setMembershipCookies(response: NextResponse, membership: { active: boolean; estado: string; plan: string; fechaFin?: Date }) {
  const expiresAt = membership.fechaFin && membership.active ? membership.fechaFin : new Date(Date.now() + 12 * 60 * 60 * 1000);

  response.cookies.set({
    name: "carvipix_membership_status",
    value: membership.active ? "activo" : membership.estado,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  response.cookies.set({
    name: "carvipix_membership_plan",
    value: membership.plan,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
    }

    const loginRateLimit = rateLimiter.check({
      scope: "auth.login",
      key: `${getClientIp(request)}:${email}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!loginRateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Demasiados intentos. Intenta nuevamente más tarde.",
          retryAfter: loginRateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!user.verificado) {
      return NextResponse.json({ error: "Correo no verificado", requiresVerification: true }, { status: 403 });
    }

    const { token, expiresAt } = await createSession(user.id);
    const membership =
      (await findMembershipByUserId(user.id)) ??
      (await ensureInactiveMembership(user.id, {
        preferredPlan: user.plan,
        userStatus: user.estado,
      }));
    const response = NextResponse.json({
      success: true,
      ok: true,
      user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, plan: user.plan },
      membership,
    });

    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    response.cookies.set({
      name: AUTH_ROLE_COOKIE,
      value: "cliente",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    setMembershipCookies(response, membership);
    rateLimiter.reset("auth.login", `${getClientIp(request)}:${email}`);

    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
