import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE, AUTH_SESSION_COOKIE, revokeSession } from "@/app/lib/auth/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;

  if (token) {
    await revokeSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: AUTH_SESSION_COOKIE, value: "", path: "/", maxAge: 0, httpOnly: true });
  response.cookies.set({ name: AUTH_ROLE_COOKIE, value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "carvipix_membership_status", value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "carvipix_membership_plan", value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "carvipix_admin_dashboard_access", value: "", path: "/", maxAge: 0, httpOnly: true });
  return response;
}
