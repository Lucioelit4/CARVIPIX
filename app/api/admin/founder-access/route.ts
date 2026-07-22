import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import {
  initializeFounderCodes,
  listFounderAdminState,
  replaceFounderCode,
  setFounderAccessStatus,
} from "@/app/backend/founder-access/service";

function adminActorId(request: NextRequest): string {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  return `admin:${createHash("sha256").update(ipAddress).digest("hex")}`;
}

function isStrictSameOriginRequest(request: NextRequest): boolean {
  const source = request.headers.get("origin")?.trim() || request.headers.get("referer")?.trim();
  if (!source) return process.env.NODE_ENV !== "production";

  try {
    const sourceOrigin = new URL(source).origin;
    const allowedOrigins = new Set([request.nextUrl.origin]);
    const publicUrl = process.env.APP_PUBLIC_URL?.trim();
    if (publicUrl) allowedOrigins.add(new URL(publicUrl).origin);
    return allowedOrigins.has(sourceOrigin);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, data: await listFounderAdminState() });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar Founder Access" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request) || !isStrictSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    emails?: string[];
    userId?: string;
    codeId?: string;
    assignedEmail?: string;
  };
  const actorId = adminActorId(request);

  try {
    if (body.action === "initialize") {
      const result = await initializeFounderCodes(Array.isArray(body.emails) ? body.emails : [], actorId);
      return NextResponse.json({ ok: true, created: result.created, codes: result.codes });
    }
    if (body.action === "revoke" || body.action === "block") {
      const userId = String(body.userId ?? "").trim();
      if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
      const changed = await setFounderAccessStatus({
        userId,
        status: body.action === "block" ? "BLOCKED" : "REVOKED",
        adminActorId: actorId,
      });
      return NextResponse.json({ ok: changed });
    }
    if (body.action === "replace") {
      const codeId = String(body.codeId ?? "").trim();
      const assignedEmail = String(body.assignedEmail ?? "").trim();
      if (!codeId || !assignedEmail) {
        return NextResponse.json({ ok: false, error: "codeId and assignedEmail required" }, { status: 400 });
      }
      const replacement = await replaceFounderCode({ codeId, assignedEmail, adminActorId: actorId });
      return NextResponse.json({ ok: true, replacement });
    }
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FOUNDER_ADMIN_ERROR";
    const safeError = [
      "EXACTLY_THREE_UNIQUE_EMAILS_REQUIRED",
      "INVALID_FOUNDER_EMAIL",
      "CODE_MUST_BE_REVOKED_BEFORE_REPLACEMENT",
      "FOUNDER_CODE_SLOT_COUNT_INVALID",
    ].includes(message) ? message : "No se pudo completar la operacion";
    return NextResponse.json({ ok: false, error: safeError }, { status: 400 });
  }
}