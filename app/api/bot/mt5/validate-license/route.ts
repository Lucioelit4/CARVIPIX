import { NextRequest, NextResponse } from "next/server";
import { findActiveMt5License } from "../_auth";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const licenseKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const body = (await request.json().catch(() => ({}))) as { license_id?: unknown };
  const licenseId = String(body.license_id ?? "").trim();

  if (!licenseKey || !licenseId || licenseKey !== licenseId) {
    return NextResponse.json({ valid: false, error: "Unauthorized" }, { status: 401 });
  }

  const license = await findActiveMt5License(licenseId);
  if (!license) {
    return NextResponse.json({ valid: false, error: "Licencia invalida o inactiva" }, { status: 401 });
  }

  return NextResponse.json({ valid: true, license_id: licenseId }, { status: 200 });
}