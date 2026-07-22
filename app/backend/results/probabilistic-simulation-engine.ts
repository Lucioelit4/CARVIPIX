export type SimulationRiskType = "CONSERVATIVE" | "MODERATE" | "DYNAMIC";
export type SimulationOutcome = "TP" | "SL" | "NOT_ACTIVATED";

export interface ProbabilisticScenario {
  scenarioId: string;
  occurredAt: string;
  symbol: string;
  direction: "BUY" | "SELL";
  originalProbability: number;
  decisionQuality: number;
  riskReward: number;
  activationProbability: number;
  volatilityFactor: number;
  trendFactor: number;
  contextFactor: number;
  riskPips: number;
  spreadPips: number;
  commissionPips: number;
  slippagePips: number;
  sourceType: "RECORDED_ANALYSIS" | "DOCUMENTED_MODEL";
  observedOutcome?: SimulationOutcome;
  observedSignalId?: string;
}

export interface SimulationProfileConfig {
  profileId: string;
  initialBalance: number;
  riskType: SimulationRiskType;
}

export interface SimulatedProfileResult {
  profileId: string;
  initialBalance: number;
  finalBalance: number;
  pnl: number;
  returnPct: number;
  maxDrawdownPct: number;
  estimatedPips: number;
  alertsApplied: number;
  simulatedOperations: number;
  takeProfits: number;
  stopLosses: number;
  notActivated: number;
  observedOperations: number;
  simulatedComponentPct: number;
  observedComponentPct: number;
  probabilityOfLoss: number;
  probableBalanceRange: { low: number; median: number; high: number };
  equityCurve: Array<{ occurredAt: string; balance: number; source: "SIMULATED" | "OBSERVED" }>;
  outcomes: Array<{
    scenarioId: string;
    outcome: SimulationOutcome;
    source: "SIMULATED" | "OBSERVED";
    pnl: number;
    pips: number;
  }>;
}

export interface ProbabilisticSimulationResult {
  seed: string;
  iterations: number;
  expectedValueR: number;
  profiles: SimulatedProfileResult[];
  generatedAt: string;
}

const RISK_PCT: Record<SimulationRiskType, number> = {
  CONSERVATIVE: 0.45,
  MODERATE: 0.85,
  DYNAMIC: 1.35,
};

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimals = 4): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))];
}

export function adjustedWinProbability(scenario: ProbabilisticScenario): number {
  const original = clamp(scenario.originalProbability, 0, 1);
  const qualityAdjustment = (clamp(scenario.decisionQuality, 0, 1) - 0.5) * 0.12;
  const marketAdjustment = (
    clamp(scenario.volatilityFactor, 0, 1)
    + clamp(scenario.trendFactor, 0, 1)
    + clamp(scenario.contextFactor, 0, 1)
    - 1.5
  ) * 0.05;
  return clamp(original + qualityAdjustment + marketAdjustment, 0.05, 0.95);
}

export function expectedValueR(scenario: ProbabilisticScenario): number {
  const winProbability = adjustedWinProbability(scenario);
  const costR = scenario.riskPips > 0
    ? (scenario.spreadPips + scenario.commissionPips + scenario.slippagePips) / scenario.riskPips
    : 0;
  const activatedValue = winProbability * scenario.riskReward - (1 - winProbability) - costR;
  return round(clamp(scenario.activationProbability, 0, 1) * activatedValue, 6);
}

function resolveOutcome(scenario: ProbabilisticScenario, random: () => number): SimulationOutcome {
  if (scenario.observedOutcome) return scenario.observedOutcome;
  if (random() > clamp(scenario.activationProbability, 0, 1)) return "NOT_ACTIVATED";
  return random() <= adjustedWinProbability(scenario) ? "TP" : "SL";
}

function simulatePath(
  scenarios: ProbabilisticScenario[],
  profile: SimulationProfileConfig,
  random: () => number,
  includeOutcomes: boolean,
): Omit<SimulatedProfileResult, "probabilityOfLoss" | "probableBalanceRange"> {
  let balance = profile.initialBalance;
  let peak = balance;
  let maxDrawdownPct = 0;
  let estimatedPips = 0;
  let takeProfits = 0;
  let stopLosses = 0;
  let notActivated = 0;
  let observedOperations = 0;
  const outcomes: SimulatedProfileResult["outcomes"] = [];
  const equityCurve: SimulatedProfileResult["equityCurve"] = [{
    occurredAt: scenarios[0]?.occurredAt ?? new Date(0).toISOString(),
    balance,
    source: "SIMULATED",
  }];

  for (const scenario of scenarios) {
    const outcome = resolveOutcome(scenario, random);
    const source = scenario.observedOutcome ? "OBSERVED" : "SIMULATED";
    const costPips = scenario.spreadPips + scenario.commissionPips + scenario.slippagePips;
    const riskAmount = balance * (RISK_PCT[profile.riskType] / 100);
    let pnl = 0;
    let pips = 0;

    if (outcome === "TP") {
      takeProfits += 1;
      pips = scenario.riskPips * scenario.riskReward - costPips;
      pnl = riskAmount * (scenario.riskReward - (scenario.riskPips > 0 ? costPips / scenario.riskPips : 0));
    } else if (outcome === "SL") {
      stopLosses += 1;
      pips = -scenario.riskPips - costPips;
      pnl = -riskAmount * (1 + (scenario.riskPips > 0 ? costPips / scenario.riskPips : 0));
    } else {
      notActivated += 1;
    }

    balance = Math.max(0, balance + pnl);
    peak = Math.max(peak, balance);
    maxDrawdownPct = Math.max(maxDrawdownPct, peak > 0 ? ((peak - balance) / peak) * 100 : 0);
    estimatedPips += pips;
    if (source === "OBSERVED" && outcome !== "NOT_ACTIVATED") observedOperations += 1;
    equityCurve.push({ occurredAt: scenario.occurredAt, balance: round(balance, 2), source });
    if (includeOutcomes) outcomes.push({ scenarioId: scenario.scenarioId, outcome, source, pnl: round(pnl, 2), pips: round(pips, 2) });
  }

  const operations = takeProfits + stopLosses;
  const observedComponentPct = operations > 0 ? (observedOperations / operations) * 100 : 0;
  return {
    profileId: profile.profileId,
    initialBalance: profile.initialBalance,
    finalBalance: round(balance, 2),
    pnl: round(balance - profile.initialBalance, 2),
    returnPct: round(((balance - profile.initialBalance) / profile.initialBalance) * 100, 4),
    maxDrawdownPct: round(maxDrawdownPct, 4),
    estimatedPips: round(estimatedPips, 2),
    alertsApplied: scenarios.length,
    simulatedOperations: operations,
    takeProfits,
    stopLosses,
    notActivated,
    observedOperations,
    simulatedComponentPct: round(100 - observedComponentPct, 2),
    observedComponentPct: round(observedComponentPct, 2),
    equityCurve,
    outcomes,
  };
}

export function runProbabilisticSimulation(input: {
  seed: string;
  iterations: number;
  scenarios: ProbabilisticScenario[];
  profiles: SimulationProfileConfig[];
  generatedAt: string;
}): ProbabilisticSimulationResult {
  if (!input.seed.trim()) throw new Error("PROBABILISTIC_SIMULATION_SEED_REQUIRED");
  if (input.iterations < 100) throw new Error("PROBABILISTIC_SIMULATION_MINIMUM_100_ITERATIONS");
  if (input.scenarios.length === 0) throw new Error("PROBABILISTIC_SIMULATION_SCENARIOS_REQUIRED");

  const profiles = input.profiles.map(profile => {
    const primary = simulatePath(input.scenarios, profile, createRandom(`${input.seed}:${profile.profileId}:primary`), true);
    const balances: number[] = [];
    let lossCount = 0;
    for (let iteration = 0; iteration < input.iterations; iteration += 1) {
      const result = simulatePath(input.scenarios, profile, createRandom(`${input.seed}:${profile.profileId}:${iteration}`), false);
      balances.push(result.finalBalance);
      if (result.finalBalance < profile.initialBalance) lossCount += 1;
    }
    return {
      ...primary,
      probabilityOfLoss: round((lossCount / input.iterations) * 100, 2),
      probableBalanceRange: {
        low: round(percentile(balances, 0.05), 2),
        median: round(percentile(balances, 0.5), 2),
        high: round(percentile(balances, 0.95), 2),
      },
    };
  });

  return {
    seed: input.seed,
    iterations: input.iterations,
    expectedValueR: round(input.scenarios.reduce((sum, scenario) => sum + expectedValueR(scenario), 0) / input.scenarios.length, 6),
    profiles,
    generatedAt: input.generatedAt,
  };
}