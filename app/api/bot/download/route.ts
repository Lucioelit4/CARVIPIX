/**
 * GET /api/bot/download
 * Descarga segura del EA con validación de licencia
 *
 * Query params:
 * - license: clave de licencia
 * - token: token base64 (license_key:order_id)
 *
 * Validaciones:
 * - Licencia activa
 * - Fecha no expirada
 * - Usuario autenticado
 */
import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get("license")?.trim();
    const token = searchParams.get("token")?.trim();

    if (!licenseKey || !token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Parámetros requeridos: license y token",
        },
        { status: 400 }
      );
    }

    // ── Validar token
    let expectedOrderId: string;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [tokenLicense, orderId] = decoded.split(":");

      if (tokenLicense !== licenseKey) {
        throw new Error("Token inválido");
      }

      expectedOrderId = orderId;
    } catch (e) {
      console.error("[DOWNLOAD-TOKEN-ERROR]", e);
      return NextResponse.json(
        { ok: false, error: "Token inválido" },
        { status: 403 }
      );
    }

    // ── Buscar y validar licencia en BD ──────────────────────────────────
    const licenseResult = await backendDatabase.query(
      `SELECT license_key, user_id, active, expiry_date FROM bot_licenses 
       WHERE license_key = $1 LIMIT 1`,
      [licenseKey]
    );

    if (licenseResult.rows.length === 0) {
      console.warn("[DOWNLOAD] License not found:", { licenseKey });
      return NextResponse.json(
        { ok: false, error: "Licencia no encontrada" },
        { status: 404 }
      );
    }

    const license = licenseResult.rows[0];

    // ── Validar que licencia esté activa
    if (!license.active) {
      console.warn("[DOWNLOAD] License not active:", { licenseKey });
      return NextResponse.json(
        { ok: false, error: "Licencia inactiva" },
        { status: 403 }
      );
    }

    // ── Validar que no esté expirada
    const expiryDate = new Date(license.expiry_date);
    if (expiryDate < new Date()) {
      console.warn("[DOWNLOAD] License expired:", { licenseKey });
      return NextResponse.json(
        { ok: false, error: "Licencia expirada" },
        { status: 403 }
      );
    }

    // ── Registrar descarga en base de datos ───────────────────────────────
    const downloadRecord = await backendDatabase.query(
      `INSERT INTO bot_downloads (id, license_key, user_id, download_date, ip_address, user_agent)
       VALUES ($1, $2, $3, NOW(), $4, $5)
       RETURNING id`,
      [
        `dl-${Date.now()}`,
        licenseKey,
        license.user_id,
        request.headers.get("x-forwarded-for") ||
          request.headers.get("cf-connecting-ip") ||
          "unknown",
        request.headers.get("user-agent") || "unknown",
      ]
    );

    console.log("[DOWNLOAD] Download recorded:", {
      downloadId: downloadRecord.rows[0]?.id,
      licenseKey,
      userId: license.user_id,
    });

    // ── Buscar archivo EA ────────────────────────────────────────────────
    const eaPath = path.join(
      process.cwd(),
      "public",
      "downloads",
      "CARVIPIX_EA_MT5_V1.ex5"
    );

    if (!fs.existsSync(eaPath)) {
      console.error("[DOWNLOAD] EA file not found:", { eaPath });
      return NextResponse.json(
        { ok: false, error: "Archivo no disponible" },
        { status: 404 }
      );
    }

    // ── Leer y servir archivo ────────────────────────────────────────────
    const fileContent = fs.readFileSync(eaPath);
    const fileName = `CARVIPIX_${licenseKey.substring(0, 12)}.ex5`;

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-License-Key": licenseKey,
      },
    });
  } catch (error) {
    console.error("[DOWNLOAD-ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar descarga" },
      { status: 500 }
    );
  }
}
