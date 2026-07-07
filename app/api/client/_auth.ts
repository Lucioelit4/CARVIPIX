import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, readSessionUser, type AuthUserRow } from "@/app/lib/auth/server";

type ClientAuthSuccess = {
  ok: true;
  user: AuthUserRow;
};

type ClientAuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireClientSession(request: NextRequest): Promise<ClientAuthSuccess | ClientAuthFailure> {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await readSessionUser(token);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user };
}
