import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSKEY_CHALLENGE_COOKIE = "carvipix_admin_passkey_challenge";
const CHALLENGE_TTL_SECONDS = 60 * 5;

type ChallengePayload = {
  challenge: string;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSigningSecret(): string {
  const secret = process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("CARVIPIX_STARTUP_BLOCKED: Missing required environment variable: ADMIN_SECRET");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

export function isAdminPasskeyEnabled(): boolean {
  return process.env.ADMIN_PASSKEY_ENABLED?.trim() === "true";
}

export function setAdminPasskeyChallengeCookie(response: NextResponse, challenge: string): void {
  const payload: ChallengePayload = {
    challenge,
    exp: Date.now() + CHALLENGE_TTL_SECONDS * 1000,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  response.cookies.set({
    name: ADMIN_PASSKEY_CHALLENGE_COOKIE,
    value: `${encodedPayload}.${signature}`,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

export function clearAdminPasskeyChallengeCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_PASSKEY_CHALLENGE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function readAdminPasskeyChallenge(request: NextRequest): string | null {
  const raw = request.cookies.get(ADMIN_PASSKEY_CHALLENGE_COOKIE)?.value?.trim();
  if (!raw) {
    return null;
  }

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const encodedPayload = raw.slice(0, separator);
  const providedSignature = raw.slice(separator + 1);
  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ChallengePayload;
    if (!payload.challenge || Date.now() >= payload.exp) {
      return null;
    }
    return payload.challenge;
  } catch {
    return null;
  }
}

export function getAdminPasskeyConfig(request: NextRequest): {
  rpId: string;
  origin: string;
  credentialId: string;
  credentialPublicKey: Uint8Array;
  counter: number;
} | null {
  if (!isAdminPasskeyEnabled()) {
    return null;
  }

  const rpId = process.env.ADMIN_PASSKEY_RP_ID?.trim() || request.nextUrl.hostname;
  const origin = process.env.ADMIN_PASSKEY_ORIGIN?.trim() || process.env.APP_PUBLIC_URL?.trim();
  const credentialId = process.env.ADMIN_PASSKEY_CREDENTIAL_ID?.trim();
  const credentialPublicKey = process.env.ADMIN_PASSKEY_CREDENTIAL_PUBLIC_KEY?.trim();

  if (!rpId || !origin || !credentialId || !credentialPublicKey) {
    return null;
  }

  const counter = Number(process.env.ADMIN_PASSKEY_COUNTER ?? "0");

  return {
    rpId,
    origin,
    credentialId,
    credentialPublicKey: Buffer.from(credentialPublicKey, "base64url"),
    counter: Number.isFinite(counter) && counter >= 0 ? counter : 0,
  };
}
