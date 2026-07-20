import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

import { rateLimiter } from "@/app/backend";
import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";
import {
  clearAdminPasskeyChallengeCookie,
  getAdminPasskeyConfig,
  readAdminPasskeyChallenge,
} from "@/app/lib/auth/admin-passkey";
import { setAdminSessionCookie } from "@/app/lib/auth/admin-server";

type VerifyRequest = {
  response?: AuthenticationResponseJSON;
};

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
  }

  const config = getAdminPasskeyConfig(request);
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error: "Passkey admin no configurada en este entorno",
      },
      { status: 503 }
    );
  }

  const rateLimit = rateLimiter.check({
    scope: "auth.admin.passkey.verify",
    key: getClientIp(request),
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiados intentos",
        retryAfter: rateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as VerifyRequest;
  if (!body.response) {
    return NextResponse.json({ ok: false, error: "Respuesta de passkey inválida" }, { status: 400 });
  }

  const expectedChallenge = readAdminPasskeyChallenge(request);
  if (!expectedChallenge) {
    return NextResponse.json({ ok: false, error: "Challenge expirado. Intenta de nuevo." }, { status: 401 });
  }

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpId,
    credential: {
      id: body.response.id,
      publicKey: Uint8Array.from(config.credentialPublicKey),
      counter: config.counter,
      transports: ["internal", "hybrid", "usb", "ble", "nfc"],
    },
    requireUserVerification: false,
  }).catch(() => null);

  if (!verification?.verified) {
    return NextResponse.json({ ok: false, error: "Passkey no válida" }, { status: 401 });
  }

  rateLimiter.reset("auth.admin.passkey.verify", getClientIp(request));

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAdminPasskeyChallengeCookie(response);
  setAdminSessionCookie(response, request);

  return response;
}
