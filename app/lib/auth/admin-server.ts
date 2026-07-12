import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "carvipix_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  exp: number;
  fp: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("CARVIPIX_STARTUP_BLOCKED: Missing required environment variable: ADMIN_SECRET");
  }
  return secret;
}

function buildFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown";
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  return createHash("sha256").update(`${userAgent}:${ip}`).digest("hex");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(request: NextRequest): string {
  const payload: AdminSessionPayload = {
    exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000,
    fp: buildFingerprint(request),
  };

  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function isValidAdminSession(request: NextRequest): boolean {
  const raw = request.cookies.get(ADMIN_SESSION_COOKIE)?.value?.trim();
  if (!raw) {
    return false;
  }

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const encoded = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);
  const expectedSignature = signPayload(encoded);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as AdminSessionPayload;
    return Boolean(payload?.exp && payload?.fp && Date.now() < payload.exp && payload.fp === buildFingerprint(request));
  } catch {
    return false;
  }
}

export function setAdminSessionCookie(response: NextResponse, request: NextRequest): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(request),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}