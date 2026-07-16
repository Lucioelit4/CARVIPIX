import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { botMT5Service } from "@/app/backend/services/bot-mt5-service";
import { backendDatabase } from "@/app/backend/core/database";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";

// ============================================================================
// POST /api/bot/mt5/handshake
// EA valida licencia y registra instalación
// ============================================================================

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? request.nextUrl.searchParams.get("action") ?? "").trim();

  // EA V2 lightweight handshake — solo verifica conectividad, no valida licencia
  // El EA V2 envía {ea_version, environment, magic_number} sin license_id
  const isEAv2Handshake = body.ea_version !== undefined && body.license_id === undefined;
  if (isEAv2Handshake) {
    console.log(`[HANDSHAKE-V2] EA conectado. Version=${body.ea_version} Env=${body.environment}`);
    return NextResponse.json({
      success: true,
      status: "CONNECTED",
      server_time: new Date().toISOString(),
      message: "CARVIPIX Backend conectado"
    });
  }

  // HANDSHAKE
  if (action === "handshake" || request.nextUrl.pathname.endsWith("/handshake")) {
    const licenseId = String(body.license_id ?? "").trim();
    const installationId = String(body.installation_id ?? "").trim();
    const accountHash = String(body.account_hash ?? "").trim();
    const accountNumber = Number(body.account_number ?? 0);
    const brokerServer = String(body.broker_server ?? "").trim();
    const magicNumber = Number(body.magic_number ?? 0);
    const eaVersion = String(body.ea_version ?? "1.0.0").trim();

    if (!licenseId || !installationId || !accountHash) {
      return NextResponse.json(
        { error: "Parámetros requeridos: license_id, installation_id, account_hash" },
        { status: 400 }
      );
    }

    // Validar licencia existe y activa
    const license = await ecosystemServices.bot.getLicense(licenseId.split("-")[1] || "");
    if (!license || !license.active) {
      return NextResponse.json({ error: "Licencia inválida o inactiva", valid: false }, { status: 401 });
    }

    // Registrar instalación
    try {
      const installation = await botMT5Service.registerInstallation(
        license.userId,
        licenseId,
        installationId,
        accountHash,
        accountNumber,
        brokerServer,
        magicNumber,
        eaVersion
      );

      return NextResponse.json(
        {
          success: true,
          installation_id: installation.installationId,
          magic_number: installation.magicNumber,
          status: "ACTIVE",
        },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: "Error registrando instalación", valid: false },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const licenseId = request.nextUrl.searchParams.get("license_id") || "";
  const installationId = request.nextUrl.searchParams.get("installation_id") || "";

  // Validar auth
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sin autorización" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  if (token !== licenseId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // GET - VALIDATE
  if (request.nextUrl.pathname.endsWith("/validate")) {
    const installation = await botMT5Service.getInstallation(licenseId, installationId);

    if (!installation) {
      return NextResponse.json({ valid: false, error: "Instalación no encontrada" }, { status: 404 });
    }

    if (installation.isRevoked) {
      return NextResponse.json({ valid: false, error: "Licencia revocada" }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      status: installation.status,
      installation_id: installation.installationId,
    });
  }

  return NextResponse.json({ error: "Endpoint no reconocido" }, { status: 400 });
}
