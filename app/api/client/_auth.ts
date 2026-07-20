import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, readSessionUser, type AuthUserRow } from "@/app/lib/auth/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

type ClientAuthSuccess = {
  ok: true;
  user: AuthUserRow;
  isAdminSession: boolean;
};

type ClientAuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireClientSession(request: NextRequest): Promise<ClientAuthSuccess | ClientAuthFailure> {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) {
    if (isValidAdminSession(request)) {
      return {
        ok: true,
        isAdminSession: true,
        user: {
          id: "admin-session",
          email: "admin@carvipix.local",
          nombre: "Admin",
          apellido: "CARVIPIX",
          plan: "enterprise",
          estado: "activo",
          verificado: true,
          password_hash: null,
        },
      };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await readSessionUser(token);
  if (!user) {
    if (isValidAdminSession(request)) {
      return {
        ok: true,
        isAdminSession: true,
        user: {
          id: "admin-session",
          email: "admin@carvipix.local",
          nombre: "Admin",
          apellido: "CARVIPIX",
          plan: "enterprise",
          estado: "activo",
          verificado: true,
          password_hash: null,
        },
      };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user, isAdminSession: false };
}
