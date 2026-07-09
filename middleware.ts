import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute, type MembershipStatus } from "@/app/lib/auth/permissions";
import type { AuthRole } from "@/app/lib/auth/session";

function getRoleFromCookie(request: NextRequest): AuthRole {
  const role = request.cookies.get("carvipix_auth_role")?.value;
  if (role === "admin" || role === "cliente") {
    return role;
  }

  return "invitado";
}

function getMembershipFromCookie(request: NextRequest): MembershipStatus | null {
  const value = request.cookies.get("carvipix_membership_status")?.value;
  if (value === "activo" || value === "cancelado" || value === "vencido" || value === "inactivo") {
    return value;
  }

  return null;
}

async function readSessionSnapshot(request: NextRequest): Promise<{
  authenticated?: boolean;
  membership?: { active?: boolean; estado?: MembershipStatus };
}> {
  try {
    const response = await fetch(new URL("/api/auth/session", request.url), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {};
    }

    return (await response.json().catch(() => ({}))) as {
      authenticated?: boolean;
      membership?: { active?: boolean; estado?: MembershipStatus };
    };
  } catch {
    return {};
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasClientSession = Boolean(request.cookies.get("carvipix_auth_session")?.value);
  const hasAdminDashboardAccess = request.cookies.get("carvipix_admin_dashboard_access")?.value === "1";
  const snapshot = await readSessionSnapshot(request);
  const isMembershipActive = Boolean(snapshot.authenticated && snapshot.membership?.active);

  const context = {
    role: getRoleFromCookie(request),
    isAdminSession: Boolean(request.cookies.get("carvipix_admin_session")?.value),
    membershipStatus: isMembershipActive ? "activo" : getMembershipFromCookie(request),
  };

  // /admin is the only administrative route. Customers are redirected away from it.
  if (pathname.startsWith("/admin")) {
    if (context.role === "cliente" && hasClientSession && !context.isAdminSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (context.isAdminSession && hasAdminDashboardAccess) {
      return NextResponse.next();
    }

    if (!hasClientSession) {
      return NextResponse.redirect(new URL("/servicios", request.url));
    }
  }

  if (pathname !== "/admin" && pathname.startsWith("/admin") === false && pathname !== "/") {
    if ((pathname.startsWith("/alertas") || pathname.startsWith("/resultados") || pathname.startsWith("/analisis") || pathname.startsWith("/bot") || pathname.startsWith("/fondeo") || pathname.startsWith("/herramientas")) && !isMembershipActive) {
      return NextResponse.redirect(new URL("/servicios", request.url));
    }

    if ((pathname.startsWith("/capital") || pathname.startsWith("/gestion-capital") || pathname.startsWith("/perfil") || pathname.startsWith("/comunidad")) && !hasClientSession) {
      return NextResponse.redirect(new URL("/servicios", request.url));
    }
  }

  if (canAccessRoute(pathname, context)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/servicios", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alertas/:path*",
    "/resultados/:path*",
    "/analisis/:path*",
    "/comunidad/:path*",
    "/bot/:path*",
    "/capital/:path*",
    "/fondeo/:path*",
    "/gestion-capital/:path*",
    "/herramientas/:path*",
    "/perfil/:path*",
    "/admin/:path*",
  ],
};
