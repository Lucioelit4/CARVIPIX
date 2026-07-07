import { NextRequest } from "next/server";

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
  const extracted = extractOrigin(request);
  if (!extracted) {
    return true;
  }

  return extracted === request.nextUrl.origin;
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
