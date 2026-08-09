import { NextRequest, NextResponse } from "next/server";
import { handleSignalNext } from "./handler";

/**
 * GET /api/bot/mt5/signal/next?license=...
 * El EA V2 llama este endpoint en cada polling para obtener
 * la próxima señal PENDING y marcarla como PROCESSING.
 */
export async function GET(request: NextRequest) {
  try {
    const licenseId = request.nextUrl.searchParams.get("license_id") || "";
    const installationId = request.nextUrl.searchParams.get("installation_id") || "";
    const rawMode = request.nextUrl.searchParams.get("signal_mode")?.toUpperCase() ?? "";
    const signalMode = rawMode === "SHORT" || rawMode === "MEDIUM" || rawMode === "EXTENDED" ? rawMode : null;
    return await handleSignalNext({ licenseId, installationId, signalMode }, request);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SIGNAL-NEXT]", errorMessage);
    return NextResponse.json({
      has_signal: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const licenseId = typeof body.license_id === "string" ? body.license_id : "";
    const installationId = typeof body.installation_id === "string" ? body.installation_id : "";
    const rawMode = String(body.signal_mode ?? "").toUpperCase();
    const signalMode = rawMode === "SHORT" || rawMode === "MEDIUM" || rawMode === "EXTENDED" ? rawMode : null;
    return await handleSignalNext({ licenseId, installationId, signalMode }, request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SIGNAL-NEXT-POST]", errorMessage);
    return NextResponse.json({
      has_signal: false,
      error: errorMessage
    }, { status: 500 });
  }
}
