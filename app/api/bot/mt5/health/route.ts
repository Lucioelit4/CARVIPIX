import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "mt5",
      environment: process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV ?? "development",
    },
    { status: 200 }
  );
}
