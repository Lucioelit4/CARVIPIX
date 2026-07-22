import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { globalResultsService, type ValidatedProbabilisticRunInput } from "../app/backend/results/global-results-service";
import type { ProbabilisticProfileDefinition } from "../app/backend/results/probabilistic-profile-factory";
import type { ProbabilisticScenario, SimulatedProfileResult } from "../app/backend/results/probabilistic-simulation-engine";

type ArtifactProfile = ProbabilisticProfileDefinition & SimulatedProfileResult;
type ProbabilisticArtifact = {
  runId: string;
  period: { start: string; end: string };
  dataSource: string;
  dataHash: string;
  seed: string;
  iterations: number;
  methodologyVersion: string;
  assumptions: Record<string, unknown>;
  limitations: Record<string, unknown>;
  metrics: Record<string, unknown>;
  scenarios: ProbabilisticScenario[];
  profiles: ArtifactProfile[];
  botProfileIds: string[];
};

async function main(): Promise<void> {
  if (process.env.PROBABILISTIC_HISTORICAL_RESULTS_ENABLED !== "true") {
    throw new Error("PROBABILISTIC_HISTORICAL_RESULTS_ENABLED_MUST_BE_TRUE");
  }
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const artifactPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(repositoryRoot, "artifacts", "probabilistic-results", "probabilistic-20260321-20260721-v1.json");
  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as ProbabilisticArtifact;
  const profileDefinitions = artifact.profiles.map(profile => ({
    profileId: profile.profileId,
    initialBalance: profile.initialBalance,
    riskType: profile.riskType,
    displayName: profile.displayName,
    avatarKey: profile.avatarKey,
    isBotProfile: profile.isBotProfile,
    isRealUser: false as const,
    profileType: "PROBABILISTIC_SIMULATION" as const,
    excludeFromMembers: true as const,
    excludeFromRevenue: true as const,
    excludeFromLiveResults: true as const,
    excludeFromTestimonials: true as const,
  }));
  const profileResults = artifact.profiles.map(profile => ({
    profileId: profile.profileId,
    initialBalance: profile.initialBalance,
    finalBalance: profile.finalBalance,
    pnl: profile.pnl,
    returnPct: profile.returnPct,
    maxDrawdownPct: profile.maxDrawdownPct,
    estimatedPips: profile.estimatedPips,
    alertsApplied: profile.alertsApplied,
    simulatedOperations: profile.simulatedOperations,
    takeProfits: profile.takeProfits,
    stopLosses: profile.stopLosses,
    notActivated: profile.notActivated,
    observedOperations: profile.observedOperations,
    simulatedComponentPct: profile.simulatedComponentPct,
    observedComponentPct: profile.observedComponentPct,
    probabilityOfLoss: profile.probabilityOfLoss,
    probableBalanceRange: profile.probableBalanceRange,
    equityCurve: profile.equityCurve,
    outcomes: profile.outcomes,
  }));
  const input: ValidatedProbabilisticRunInput = {
    runId: artifact.runId,
    methodologyVersion: artifact.methodologyVersion,
    periodStart: new Date(artifact.period.start),
    periodEnd: new Date(artifact.period.end),
    dataSource: artifact.dataSource,
    dataHash: artifact.dataHash,
    seed: artifact.seed,
    iterations: artifact.iterations,
    assumptions: artifact.assumptions,
    limitations: artifact.limitations,
    metrics: artifact.metrics,
    scenarios: artifact.scenarios,
    profileDefinitions,
    profileResults,
    botProfileIds: artifact.botProfileIds,
  };
  const persisted = await globalResultsService.persistValidatedProbabilisticRun(input);
  console.log(JSON.stringify({ persisted, runId: input.runId, scenarios: input.scenarios.length, profiles: input.profileResults.length }, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});