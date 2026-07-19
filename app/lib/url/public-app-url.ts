import "server-only";

import { getRuntimeStage } from "@/app/backend/core/config";

const CANONICAL_PRODUCTION_URL = "https://carvipix.com";

function normalizeOrigin(rawValue: string | undefined): string | null {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function isUnsafeProductionHost(origin: string): boolean {
  const host = new URL(origin).hostname.toLowerCase();
  return host.includes("vercel.app") || host === "localhost" || host.endsWith(".localhost");
}

export function resolvePublicAppUrl(options?: { requestUrl?: string }): string {
  const runtimeStage = getRuntimeStage();

  const envCandidates = [
    normalizeOrigin(process.env.APP_PUBLIC_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(process.env.CANONICAL_PUBLIC_URL),
  ].filter((value): value is string => Boolean(value));

  if (runtimeStage === "production") {
    const safeCandidate = envCandidates.find((candidate) => !isUnsafeProductionHost(candidate));
    return safeCandidate ?? CANONICAL_PRODUCTION_URL;
  }

  if (envCandidates.length > 0) {
    return envCandidates[0];
  }

  const requestOrigin = normalizeOrigin(options?.requestUrl);
  if (requestOrigin) {
    return requestOrigin;
  }

  const vercelOrigin = normalizeOrigin(process.env.VERCEL_URL);
  if (vercelOrigin) {
    return vercelOrigin;
  }

  return "http://localhost:3000";
}
