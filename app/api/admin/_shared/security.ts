import { NextRequest } from "next/server";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";

function extractOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin && origin.trim()) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (referer && referer.trim()) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

export function isSameOriginRequest(request: NextRequest): boolean {
  if (isValidAdminSession(request)) {
    return true;
  }

  const internalToken = request.headers.get("x-internal-token")?.trim();
  const expectedInternalToken = process.env.INTERNAL_OBSERVER_TOKEN?.trim();
  if (expectedInternalToken && internalToken && internalToken === expectedInternalToken) {
    return true;
  }

  const ingestToken = request.headers.get("x-carvipix-ingest-token")?.trim();
  const expectedIngestToken = process.env.CARVIPIX_INTERNAL_INGEST_TOKEN?.trim();
  if (expectedIngestToken && ingestToken && ingestToken === expectedIngestToken) {
    return true;
  }

  const extracted = extractOrigin(request);
  if (!extracted) {
    return process.env.NODE_ENV !== "production";
  }

  return process.env.NODE_ENV !== "production" && extracted === request.nextUrl.origin;
}

export function isInternalIngestRequest(request: NextRequest): boolean {
  const expectedToken = process.env.CARVIPIX_INTERNAL_INGEST_TOKEN?.trim();
  const providedToken = request.headers.get("x-carvipix-ingest-token")?.trim();
  return Boolean(expectedToken && providedToken && providedToken === expectedToken);
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
