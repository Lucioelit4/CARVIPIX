import { NextRequest, NextResponse } from "next/server";
import { enterpriseAudit, logger } from "@/app/backend";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

const ADMIN_DASHBOARD_ACCESS_COOKIE = "carvipix_admin_dashboard_access";
const ADMIN_DASHBOARD_ACCESS_TTL_SECONDS = 10 * 60;

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  return origin === request.nextUrl.origin;
}

function getRequestIp(request: NextRequest): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    logger.warn("admin.client-panel", "Solicitud rechazada por origen no valido.", {
      origin: request.headers.get("origin") ?? null,
    });

    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  if (!isValidAdminSession(request)) {
    logger.warn("admin.client-panel", "Intento no autorizado para acceder al panel de clientes desde admin.", {
      path: request.nextUrl.pathname,
    });

    enterpriseAudit.record({
      actor: { id: "unknown", type: "user", roles: ["guest"] },
      action: "admin.enter_client_panel",
      resource: "dashboard",
      result: "denied",
      origin: {
        ip: getRequestIp(request),
        userAgent: request.headers.get("user-agent") ?? undefined,
        module: "admin",
      },
    });

    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const classification = String(process.env.CARVIPIX_DATA_CLASSIFICATION ?? "UNKNOWN").trim() || "UNKNOWN";
  const response = NextResponse.json(
    {
      ok: true,
      redirectTo: "/dashboard",
      dataSource: {
        origin: classification,
        status: classification === "REAL" ? "active" : "non-production",
        capturedAt: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
  response.cookies.set({
    name: ADMIN_DASHBOARD_ACCESS_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_DASHBOARD_ACCESS_TTL_SECONDS,
  });

  logger.audit("admin.client-panel", "Admin habilito acceso temporal al panel de clientes.", {
    redirectTo: "/dashboard",
    ttlSeconds: ADMIN_DASHBOARD_ACCESS_TTL_SECONDS,
  });

  enterpriseAudit.record({
    actor: { id: "admin-session", type: "user", roles: ["admin"] },
    action: "admin.enter_client_panel",
    resource: "dashboard",
    result: "success",
    origin: {
      ip: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      module: "admin",
    },
    metadata: {
      redirectTo: "/dashboard",
      ttlSeconds: ADMIN_DASHBOARD_ACCESS_TTL_SECONDS,
    },
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: ADMIN_DASHBOARD_ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  logger.audit("admin.client-panel", "Autorizacion temporal de admin al panel de clientes revocada.", {
    path: request.nextUrl.pathname,
  });

  enterpriseAudit.record({
    actor: { id: "admin-session", type: "user", roles: ["admin"] },
    action: "admin.exit_client_panel",
    resource: "dashboard",
    result: "success",
    origin: {
      ip: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      module: "admin",
    },
  });

  return response;
}