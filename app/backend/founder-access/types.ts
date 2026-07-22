export const FOUNDER_ENTITLEMENTS = [
  "BASIC_ACCESS",
  "PRO_ACCESS",
  "BOT_ACCESS",
  "ALERTS_PREMIUM",
  "ANALYSIS_ACCESS",
  "COMMUNITY_ACCESS",
  "TOOLS_ACCESS",
  "RESULTS_ACCESS",
  "ACADEMY_ACCESS",
  "ALL_CURRENT_SERVICES",
] as const;

export type FounderEntitlement = (typeof FOUNDER_ENTITLEMENTS)[number];
export type FounderCodeStatus = "AVAILABLE" | "REDEEMED" | "REVOKED" | "REPLACED";
export type FounderAccessStatus = "ACTIVE" | "REVOKED" | "BLOCKED";

export const FOUNDER_ACCESS_SOURCE = "FOUNDER" as const;
export const FOUNDER_ACCESS_LEVEL = "ALL_ACCESS" as const;
export const FOUNDER_LICENSE_TYPE = "FOUNDER" as const;
export const FOUNDER_CODE_LIMIT = 3;

const FOUNDER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeFounderEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return FOUNDER_EMAIL_PATTERN.test(normalized) ? normalized : null;
}

export type FounderAccessState = {
  status: FounderAccessStatus;
  entitlements: string[];
  licenseStatus: "ACTIVE" | "REVOKED" | "BLOCKED" | null;
};

export function isFounderAccessSnapshotActive<T extends FounderAccessState>(access: T | null): access is T {
  return Boolean(
    access?.status === "ACTIVE"
    && access.licenseStatus === "ACTIVE"
    && access.entitlements.includes("ALL_CURRENT_SERVICES"),
  );
}

export function isFounderAccessEnabled(
  env?: { FOUNDER_ACCESS_ENABLED?: string },
): boolean {
  const value = env?.FOUNDER_ACCESS_ENABLED
    ?? (process.env as unknown as { FOUNDER_ACCESS_ENABLED?: string }).FOUNDER_ACCESS_ENABLED;
  return value === "true";
}