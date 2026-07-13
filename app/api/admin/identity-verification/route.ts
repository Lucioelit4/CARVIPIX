import { NextRequest, NextResponse } from "next/server";

import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import {
  listIdentityVerificationAdminView,
  getIdentityVerificationRetentionPolicySnapshot,
  reviewIdentityVerification,
  updateIdentityVerificationRetentionPolicy,
  updateIdentityVerificationRequirements,
} from "@/app/backend/compliance/identity-verification-service";

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [data, retentionPolicy] = await Promise.all([listIdentityVerificationAdminView(), getIdentityVerificationRetentionPolicySnapshot()]);
    return NextResponse.json({ ok: true, data: { ...data, retentionPolicy } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el modulo" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject" | "request-new-document" | "update-requirements" | "update-retention-policy";
    requestId?: string;
    observations?: string;
    rejectionReason?: string;
    requirements?: Array<{ serviceKey: "alerts" | "bot" | "capital-management" | "funding-program"; required: boolean }>;
    retentionPolicy?: {
      pendingDays: number;
      approvedDays: number;
      rejectedDays: number;
      canceledDays: number;
      purgeAfterLogicalDeleteDays: number;
    };
  };

  try {
    if (body.action === "update-requirements") {
      const data = await updateIdentityVerificationRequirements({ requirements: body.requirements ?? [], updatedBy: "admin" });
      return NextResponse.json({ ok: true, data }, { status: 200 });
    }

    if (body.action === "update-retention-policy") {
      const data = await updateIdentityVerificationRetentionPolicy(body.retentionPolicy ?? {
        pendingDays: 30,
        approvedDays: 365,
        rejectedDays: 90,
        canceledDays: 30,
        purgeAfterLogicalDeleteDays: 30,
      });
      return NextResponse.json({ ok: true, data }, { status: 200 });
    }

    if (!body.requestId) {
      return NextResponse.json({ ok: false, error: "requestId es requerido" }, { status: 400 });
    }

    if (body.action === "approve" || body.action === "reject" || body.action === "request-new-document") {
      const data = await reviewIdentityVerification({
        requestId: body.requestId,
        adminId: "admin",
        adminEmail: "admin@carvipix.com",
        action: body.action,
        observations: body.observations,
        rejectionReason: body.rejectionReason,
      });

      return NextResponse.json({ ok: true, data }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo ejecutar la accion" }, { status: 500 });
  }
}
