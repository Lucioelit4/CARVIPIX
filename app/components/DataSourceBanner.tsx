"use client";

import { CARVIPIXBadge } from "@/app/design-system";

type AllowedDataOrigin = "REAL" | "SANDBOX" | "DEMO" | "MOCK";

function normalizeOrigin(raw: string | undefined): AllowedDataOrigin {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "REAL" || value === "SANDBOX" || value === "DEMO" || value === "MOCK") {
    return value;
  }
  return "MOCK";
}

export default function DataSourceBanner() {
  const origin = normalizeOrigin(process.env.NEXT_PUBLIC_DATA_SOURCE_ORIGIN);
  const capturedAt = process.env.NEXT_PUBLIC_DATA_SOURCE_CAPTURED_AT?.trim() || "N/A";
  const validUntil = process.env.NEXT_PUBLIC_DATA_SOURCE_VALID_UNTIL?.trim() || "N/A";
  const status = process.env.NEXT_PUBLIC_DATA_SOURCE_STATUS?.trim() || (origin === "REAL" ? "active" : "non-production");

  return (
    <div className="mb-4 rounded-xl border border-white/15 bg-[#0B0B0B]/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <CARVIPIXBadge variant={origin === "REAL" ? "success" : "warning"}>{`Fuente ${origin}`}</CARVIPIXBadge>
        <CARVIPIXBadge variant="info">{`Estado ${status}`}</CARVIPIXBadge>
      </div>
      <p className="mt-2 text-xs text-white/60">{`Origen: ${origin} · Captura: ${capturedAt} · Vigencia: ${validUntil}`}</p>
    </div>
  );
}
