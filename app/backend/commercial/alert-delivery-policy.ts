import type { PlanEntitlements } from "./access-control";

export function buildPlanAlertDeliveryPolicy(
  entitlements: PlanEntitlements,
  requestedLimit: number | undefined,
  now = new Date(),
): { limit: number; symbols?: string[]; since: Date } {
  const requested = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.floor(requestedLimit as number))
    : entitlements.maxAlertsPerDay;
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return {
    limit: Math.max(0, Math.min(requested, entitlements.maxAlertsPerDay)),
    symbols: entitlements.allowedPairs?.map(symbol => symbol.toUpperCase()),
    since,
  };
}