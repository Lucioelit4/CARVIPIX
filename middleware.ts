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

  const redirectToLogin = () => {
    const target = new URL("/login", request.url);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  };

  // ── Block all /api/dev/* endpoints in production ──────────────────────
  if (pathname.startsWith("/api/dev/") && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const hasClientSession = Boolean(request.cookies.get("carvipix_auth_session")?.value);

  if (pathname === "/" && hasClientSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/gestion" || pathname.startsWith("/gestion/")) {
    const suffix = pathname === "/gestion" ? "" : pathname.slice("/gestion".length);
    return NextResponse.redirect(new URL(`/gestion-capital${suffix}`, request.url));
  }

  if (pathname === "/gestion-de-capital" || pathname.startsWith("/gestion-de-capital/")) {
    const suffix = pathname === "/gestion-de-capital" ? "" : pathname.slice("/gestion-de-capital".length);
    return NextResponse.redirect(new URL(`/gestion-capital${suffix}`, request.url));
  }

  const hasAdminDashboardAccess = request.cookies.get("carvipix_admin_dashboard_access")?.value === "1";
  const hasAdminSession = Boolean(request.cookies.get("carvipix_admin_session")?.value);
  const snapshot = await readSessionSnapshot(request);
  const cookieMembership = getMembershipFromCookie(request);
  const cookieRole = getRoleFromCookie(request);
  const isSessionAuthenticated = Boolean(snapshot.authenticated);
  const isMembershipActive = Boolean(
    (isSessionAuthenticated && snapshot.membership?.active) || cookieMembership === "activo"
  );
  // If admin cookie is stale but there is no admin session, treat authenticated traffic as client.
  const effectiveRole: AuthRole = hasAdminSession
    ? "admin"
    : hasClientSession || isSessionAuthenticated
      ? "cliente"
      : cookieRole === "cliente"
        ? "cliente"
        : "invitado";

  const context = {
    role: effectiveRole,
    isAdminSession: hasAdminSession,
    membershipStatus: isMembershipActive ? "activo" : cookieMembership,
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
      return redirectToLogin();
    }
  }

  if (pathname !== "/admin" && pathname.startsWith("/admin") === false && pathname !== "/") {
    const isMemberOnlyRoute =
      pathname.startsWith("/alertas") ||
      pathname.startsWith("/resultados") ||
      pathname.startsWith("/analisis") ||
      pathname.startsWith("/bot") ||
      pathname.startsWith("/fondeo") ||
      pathname.startsWith("/herramientas") ||
      pathname.startsWith("/academia");

    if (isMemberOnlyRoute) {
      if (!hasClientSession) {
        return redirectToLogin();
      }

      const hasExplicitInactiveMembership =
        (isSessionAuthenticated && snapshot.membership?.active === false) ||
        (!isSessionAuthenticated && cookieMembership !== null && cookieMembership !== "activo");

      if (hasExplicitInactiveMembership) {
        return NextResponse.redirect(new URL("/servicios", request.url));
      }
    }

    if ((pathname.startsWith("/capital") || pathname.startsWith("/gestion") || pathname.startsWith("/gestion-capital") || pathname.startsWith("/perfil") || pathname.startsWith("/comunidad") || pathname.startsWith("/soporte")) && !hasClientSession) {
      return redirectToLogin();
    }
  }

  if (canAccessRoute(pathname, context)) {
    return NextResponse.next();
  }

  if (!hasClientSession) {
    return redirectToLogin();
  }

  return NextResponse.redirect(new URL("/servicios", request.url));
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/servicios",
    "/servicios/:path*",
    "/alertas/:path*",
    "/resultados/:path*",
    "/analisis/:path*",
    "/academia/:path*",
    "/comunidad/:path*",
    "/bot/:path*",
    "/capital/:path*",
    "/fondeo/:path*",
    "/gestion/:path*",
    "/gestion-de-capital/:path*",
    "/gestion-capital/:path*",
    "/herramientas/:path*",
    "/perfil/:path*",
    "/soporte/:path*",
    "/admin/:path*",
  ],
};
