import { NextRequest, NextResponse } from "next/server";

import { requireClientSession } from "@/app/api/client/_auth";
import {
  getIdentityVerificationStatus,
  inspectIdentityDocument,
  submitIdentityVerification,
} from "@/app/backend/compliance/identity-verification-service";

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const status = await getIdentityVerificationStatus(auth.user.id);
    return NextResponse.json({ ok: true, data: status }, { status: 200 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo cargar la verificacion de identidad", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const frontFile = formData.get("frontDocument");
    const backFile = formData.get("backDocument");
    const declarationAccepted = String(formData.get("declarationAccepted") ?? "false") === "true";
    const declarationAuthorizedUse = String(formData.get("declarationAuthorizedUse") ?? "false") === "true";

    if (!(frontFile instanceof File) || !(backFile instanceof File)) {
      return jsonError("Debes subir frente y reverso del documento");
    }

    if (!declarationAccepted || !declarationAuthorizedUse) {
      return jsonError("Debes aceptar la declaracion antes de enviar la solicitud");
    }

    const [frontBuffer, backBuffer] = await Promise.all([frontFile.arrayBuffer(), backFile.arrayBuffer()]);
    const frontRaw = Buffer.from(frontBuffer);
    const backRaw = Buffer.from(backBuffer);

    const frontDimensions = inspectIdentityDocument(frontRaw, frontFile.type || "image/jpeg");
    const backDimensions = inspectIdentityDocument(backRaw, backFile.type || "image/jpeg");

    const record = await submitIdentityVerification({
      userId: auth.user.id,
      userName: `${auth.user.nombre ?? ""} ${auth.user.apellido ?? ""}`.trim() || auth.user.email || "Miembro",
      userEmail: auth.user.email,
      userRole: auth.user.user_role ?? "client",
      declarationAccepted,
      declarationAuthorizedUse,
      frontDocument: {
        side: "front",
        fileName: frontFile.name,
        mimeType: frontFile.type || "image/jpeg",
        byteSize: frontRaw.byteLength,
        width: frontDimensions.width,
        height: frontDimensions.height,
        buffer: frontRaw,
      },
      backDocument: {
        side: "back",
        fileName: backFile.name,
        mimeType: backFile.type || "image/jpeg",
        byteSize: backRaw.byteLength,
        width: backDimensions.width,
        height: backDimensions.height,
        buffer: backRaw,
      },
    });

    return NextResponse.json({ ok: true, data: record }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo enviar la verificacion de identidad", 400);
  }
}
