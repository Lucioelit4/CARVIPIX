import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

import { rateLimiter } from "@/app/backend";
import { getClientIp, isSameOriginRequest } from "@/app/api/admin/_shared/security";
import {
  getAdminPasskeyConfig,
  setAdminPasskeyChallengeCookie,
} from "@/app/lib/auth/admin-passkey";

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
    scope: "auth.admin.passkey.options",
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

  const options = await generateAuthenticationOptions({
    rpID: config.rpId,
    allowCredentials: [
      {
        id: config.credentialId,
        transports: ["internal", "hybrid", "usb", "ble", "nfc"],
      },
    ],
    userVerification: "preferred",
  });

  const response = NextResponse.json({ ok: true, options }, { status: 200 });
  setAdminPasskeyChallengeCookie(response, options.challenge);

  return response;
}
