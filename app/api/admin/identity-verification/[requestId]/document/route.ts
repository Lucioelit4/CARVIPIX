import { NextRequest, NextResponse } from "next/server";

import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import { getIdentityVerificationDocumentFile, logIdentityVerificationDocumentAccess } from "@/app/backend/compliance/identity-verification-service";

export async function GET(request: NextRequest, context: { params: Promise<{ requestId: string }> }) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await context.params;
  const side = (request.nextUrl.searchParams.get("side") || "front") as "front" | "back";
  const isDownload = request.nextUrl.searchParams.get("download") === "1";

  try {
    const result = await getIdentityVerificationDocumentFile(requestId, side);
    if (!result) {
      return NextResponse.json({ ok: false, error: "Documento no encontrado" }, { status: 404 });
    }

    const action = isDownload ? `identity.document.download.${side}` : `identity.document.view.${side}`;

    await logIdentityVerificationDocumentAccess({
      requestId,
      actorId: "admin",
      actorEmail: "admin@carvipix.com",
      actorRole: "admin",
      action,
    });

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        "content-type": result.file.mimeType,
        "content-length": String(result.buffer.byteLength),
        "cache-control": "no-store",
        "content-disposition": `${isDownload ? "attachment" : "inline"}; filename=\"${result.file.fileName}\"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo abrir el documento" }, { status: 500 });
  }
}
