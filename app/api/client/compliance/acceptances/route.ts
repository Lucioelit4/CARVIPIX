import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import {
  getLatestAcceptancesByUser,
  listLegalDocuments,
  listMissingRequiredPaymentAcceptances,
  recordUserLegalAcceptances,
} from "@/app/backend/compliance/compliance-service";
import { latestActiveLegalDocuments } from "@/app/lib/legal/compliance-catalog";

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  return real || null;
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const [documents, acceptedMap, missing] = await Promise.all([
      listLegalDocuments(),
      getLatestAcceptancesByUser(auth.user.id),
      listMissingRequiredPaymentAcceptances(auth.user.id),
    ]);

    const activeDocuments = latestActiveLegalDocuments(documents);

    return NextResponse.json(
      {
        ok: true,
        data: {
          acceptedVersions: Object.fromEntries(acceptedMap.entries()),
          documents: activeDocuments,
          requiredBeforePayment: activeDocuments.filter((item) => item.requiredBeforePayment),
          missingRequiredBeforePayment: missing,
          canProceedToPayment: missing.length === 0,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo obtener el estado legal del cliente" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as { documentSlugs?: string[] };

  try {
    const result = await recordUserLegalAcceptances({
      userId: auth.user.id,
      source: "checkout-pre-payment",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      documentSlugs: body.documentSlugs,
    });

    const missing = await listMissingRequiredPaymentAcceptances(auth.user.id);

    return NextResponse.json(
      {
        ok: true,
        data: {
          accepted: result.accepted,
          metadata: result.metadata,
          canProceedToPayment: missing.length === 0,
          missingRequiredBeforePayment: missing,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar la aceptacion legal" }, { status: 500 });
  }
}
