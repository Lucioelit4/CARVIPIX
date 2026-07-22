export const COMMUNITY_AUTOMATION_DISABLED_REASON = "COMMUNITY_AUTOMATION_DISABLED";

export function isCommunityAutomationEnabled(
  env?: { COMMUNITY_AUTOMATION_ENABLED?: string },
): boolean {
  const value = env?.COMMUNITY_AUTOMATION_ENABLED
    ?? (process.env as unknown as { COMMUNITY_AUTOMATION_ENABLED?: string }).COMMUNITY_AUTOMATION_ENABLED;
  return value === "true";
}

export function assertCommunityAutomationEnabled(): void {
  if (!isCommunityAutomationEnabled()) {
    throw new Error(COMMUNITY_AUTOMATION_DISABLED_REASON);
  }
}