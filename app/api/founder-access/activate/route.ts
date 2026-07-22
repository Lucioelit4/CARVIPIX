import { NextRequest, NextResponse } from "next/server";

import { isSameOriginRequest } from "@/app/api/admin/_shared/security";
import { requireClientSession } from "@/app/api/client/_auth";
import { InMemoryRateLimiter } from "@/app/backend/core/rate-limiter";
import { activateFounderAccess, hashFounderActorKey } from "@/app/backend/founder-access/service";

const founderActivationLimiter = new InMemoryRateLimiter();

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const auth = await requireClientSession(request);
  if (!auth.ok) return auth.response;
  if (auth.isAdminSession) {
    return NextResponse.json({ ok: false, error: "Client session required" }, { status: 401 });
  }

  const ipAddress = getClientIp(request);
  const rateLimit = founderActivationLimiter.check({
    scope: "founder.activate",
    key: `${auth.user.id}:${ipAddress}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "No se pudo activar el acceso", retryAfter: rateLimit.resetAt.toISOString() },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const rawCode = String(body.code ?? "");
  if (!rawCode || rawCode.length > 64) {
    return NextResponse.json({ ok: false, error: "No se pudo activar el acceso" }, { status: 400 });
  }

  const result = await activateFounderAccess({
    userId: auth.user.id,
    userEmail: auth.user.email,
    rawCode,
    actorKeyHash: hashFounderActorKey(auth.user.id),
  });
  if (!result.ok) {
    const status = result.code === "DISABLED" ? 503 : result.code === "LOCKED" ? 429 : 400;
    return NextResponse.json(
      { ok: false, error: "No se pudo activar el acceso", retryAfterSeconds: result.retryAfterSeconds },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    access: {
      role: "FOUNDER",
      accessLevel: "ALL_ACCESS",
      billingRequired: false,
      expiresAt: null,
      entitlementCount: result.access.entitlements.length,
      licenseStatus: result.access.licenseStatus,
    },
  });
}