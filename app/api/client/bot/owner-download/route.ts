import { NextRequest, NextResponse } from "next/server";

// Backward-compatible bridge for legacy email links that still target
// /api/client/bot/owner-download?token=...
export async function GET(request: NextRequest) {
  const target = new URL("/api/bot/mt5/download", request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return NextResponse.redirect(target, { status: 307 });
}
