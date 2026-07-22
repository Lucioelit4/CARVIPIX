export function isProbabilisticResultsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PROBABILISTIC_HISTORICAL_RESULTS_ENABLED === "true";
}

export function validateProbabilisticRun(input: {
  periodStart: Date;
  periodEnd: Date;
  dataSource: string;
  dataHash: string;
  seed: string;
  iterations: number;
  scenarioIds: string[];
}): void {
  const fourMonthsAfterStart = new Date(input.periodStart);
  fourMonthsAfterStart.setUTCMonth(fourMonthsAfterStart.getUTCMonth() + 4);
  if (input.periodEnd < fourMonthsAfterStart) throw new Error("PROBABILISTIC_RUN_REQUIRES_FOUR_MONTHS");
  if (!input.dataHash.startsWith("sha256:")) throw new Error("PROBABILISTIC_RUN_SHA256_DATA_HASH_REQUIRED");
  if (!input.seed.trim()) throw new Error("PROBABILISTIC_RUN_SEED_REQUIRED");
  if (input.iterations < 100) throw new Error("PROBABILISTIC_RUN_MINIMUM_100_ITERATIONS");
  if (!/TWELVE_DATA_REAL_H1/.test(input.dataSource)) throw new Error("PROBABILISTIC_RUN_REQUIRES_REAL_MARKET_DATA");
  if (input.scenarioIds.length === 0) throw new Error("PROBABILISTIC_RUN_SCENARIOS_REQUIRED");
  if (new Set(input.scenarioIds).size !== input.scenarioIds.length) {
    throw new Error("PROBABILISTIC_RUN_DUPLICATE_SCENARIO_ID");
  }
}

export function shouldApplyOfficialClosure(input: {
  decision: string;
  status: string;
  source: string;
  activatedAt?: Date | string | null;
  tags?: string[];
}): boolean {
  const tags = new Set((input.tags ?? []).map(tag => tag.toUpperCase()));
  return (input.decision === "ENTER_BUY" || input.decision === "ENTER_SELL")
    && (input.status === "TP_HIT" || input.status === "SL_HIT")
    && Boolean(input.activatedAt)
    && input.source !== "ADMIN_ALERT_TEST"
    && input.source !== "CONTROLLED_E2E_AUTOMATION"
    && !tags.has("TEST_ONLY")
    && !tags.has("E2E")
    && !tags.has("NOT_FOR_CLIENTS");
}