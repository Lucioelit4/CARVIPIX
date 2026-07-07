import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  findMembershipByUserId,
  readSessionUser,
} from "@/app/lib/auth/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await readSessionUser(token);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const membership = (await findMembershipByUserId(user.id)) ?? {
    plan: user.plan,
    estado: "inactivo" as const,
    active: false,
  };

  return NextResponse.json({
    authenticated: true,
    membership,
    user: { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, plan: user.plan },
  });
}
