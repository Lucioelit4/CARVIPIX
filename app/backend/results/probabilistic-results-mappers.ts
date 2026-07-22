import type { SimulatedProfileResult } from "./probabilistic-simulation-engine";

export function mapLifecycleStatusToObservedOutcome(status: string): "TP" | "SL" | null {
  if (status === "TP_HIT") return "TP";
  if (status === "SL_HIT") return "SL";
  return null;
}

export function buildProfileSummaries(profileResults: SimulatedProfileResult[]): Record<string, {
  returnPct: number;
  probabilityOfLoss: number;
  probableBalanceRange: { low: number; median: number; high: number };
  observedComponentPct: number;
  simulatedComponentPct: number;
}> {
  const output: Record<string, {
    returnPct: number;
    probabilityOfLoss: number;
    probableBalanceRange: { low: number; median: number; high: number };
    observedComponentPct: number;
    simulatedComponentPct: number;
  }> = {};

  for (const profile of profileResults) {
    output[profile.profileId] = {
      returnPct: profile.returnPct,
      probabilityOfLoss: profile.probabilityOfLoss,
      probableBalanceRange: profile.probableBalanceRange,
      observedComponentPct: profile.observedComponentPct,
      simulatedComponentPct: profile.simulatedComponentPct,
    };
  }

  return output;
}
