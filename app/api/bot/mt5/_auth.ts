import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";

export async function findActiveMt5License(licenseKey: string): Promise<{ userId: string } | null> {
  if (!licenseKey || !backendDatabase.enabled) {
    return null;
  }

  const result = await backendDatabase.query<{ user_id: string }>(
    `
    SELECT user_id
    FROM bot_mt5_licenses
    WHERE license_id = $1 AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())
    UNION ALL
    SELECT user_id
    FROM bot_licenses
    WHERE license_key = $1 AND active = true AND (expiry_date IS NULL OR expiry_date > NOW())
    LIMIT 1
    `,
    [licenseKey],
  );

  const userId = result.rows[0]?.user_id;
  return userId ? { userId } : null;
}

export async function requireActiveMt5License(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const licenseKey = authorization.slice(7).trim();
  if (!licenseKey) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const license = await findActiveMt5License(licenseKey);
  if (!license) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true as const, licenseKey, userId: license.userId };
}