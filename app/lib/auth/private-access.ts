import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const PRIVATE_ACCESS_COOKIE = "carvipix_private_access";
export const PRIVATE_ACCESS_PATH = "/acceso-privado";
const PRIVATE_ACCESS_TTL_SECONDS = 12 * 60 * 60;

export function isMaintenanceModeEnabled(): boolean {
  return process.env.MAINTENANCE_MODE?.trim().toLowerCase() === "true";
}

function getPrivateAccessPassword(): string {
  const password = process.env.CARVIPIX_PRIVATE_ACCESS_PASSWORD?.trim();
  if (!password) throw new Error("CARVIPIX_PRIVATE_ACCESS_PASSWORD_REQUIRED");
  return password;
}

function sign(value: string): string {
  return createHmac("sha256", getPrivateAccessPassword()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPrivateAccessPassword(candidate: string): boolean {
  return safeEqual(candidate, getPrivateAccessPassword());
}

export function createPrivateAccessToken(now = Date.now()): string {
  const payload = `v1.${now + PRIVATE_ACCESS_TTL_SECONDS * 1000}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function hasValidPrivateAccess(request: NextRequest, now = Date.now()): boolean {
  const token = request.cookies.get(PRIVATE_ACCESS_COOKIE)?.value?.trim();
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const parts = payload.split(".");
  const expiresAt = Number(parts[1]);

  return parts.length === 3
    && parts[0] === "v1"
    && Number.isFinite(expiresAt)
    && now < expiresAt
    && safeEqual(signature, sign(payload));
}

export function setPrivateAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: PRIVATE_ACCESS_COOKIE,
    value: createPrivateAccessToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: PRIVATE_ACCESS_TTL_SECONDS,
  });
}