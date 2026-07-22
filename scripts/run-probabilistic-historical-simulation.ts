import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

import { getTwelveDataRuntimeConfig } from "../app/backend/data-platform/providers/twelve-data/config";
import { TwelveDataTimeSeriesService } from "../app/backend/data-platform/providers/twelve-data/timeSeries";
import { createProbabilisticProfiles } from "../app/backend/results/probabilistic-profile-factory";
import {
  buildProbabilisticScenarios,
  type HistoricalMarketCandle,
} from "../app/backend/results/probabilistic-scenario-builder";
import { runProbabilisticSimulation, type SimulationOutcome } from "../app/backend/results/probabilistic-simulation-engine";

const PERIOD_START = "2026-03-21T00:00:00.000Z";
const PERIOD_END = "2026-07-21T00:00:00.000Z";
const RUN_ID = "probabilistic-20260321-20260721-v1";
const SEED = "carvipix-probabilistic-v1-20260321-20260721";
const ITERATIONS = 1_000;
const SYMBOLS = [
  { canonical: "XAUUSD", provider: "XAU/USD" },
  { canonical: "EURUSD", provider: "EUR/USD" },
  { canonical: "GBPUSD", provider: "GBP/USD" },
  { canonical: "BTCUSD", provider: "BTC/USD" },
] as const;

type ObservedClosure = {
  signal_id: string;
  symbol: string;
  signal_status: "TP_HIT" | "SL_HIT";
  closed_at: Date;
};

async function loadCandles(): Promise<HistoricalMarketCandle[]> {
  const service = new TwelveDataTimeSeriesService(getTwelveDataRuntimeConfig());
  const candles: HistoricalMarketCandle[] = [];
  for (const symbol of SYMBOLS) {
    const series = await service.getSeries({
      symbol: symbol.provider,
      interval: "1h",
      outputsize: 5_000,
      timezone: "UTC",
      startDate: PERIOD_START.replace("T", " ").replace(".000Z", ""),
      endDate: PERIOD_END.replace("T", " ").replace(".000Z", ""),
    });
    for (const row of series.rows) {
      if (!row.datetime || ![row.open, row.high, row.low, row.close].every(Number.isFinite)) continue;
      candles.push({
        symbol: symbol.canonical,
        occurredAt: new Date(`${row.datetime.replace(" ", "T")}Z`).toISOString(),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      });
    }
    console.log(`[ProbabilisticSimulation] ${symbol.canonical}: ${series.rows.length} real H1 candles`);
  }
  return candles;
}

async function loadObservedClosures(): Promise<ObservedClosure[]> {
  if (!process.env.DATABASE_URL) return [];
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const result = await client.query<ObservedClosure>(`
      SELECT signal_id, symbol, signal_status, closed_at
      FROM real_signal_lifecycle
      WHERE decision IN ('ENTER_BUY', 'ENTER_SELL')
        AND activated_at IS NOT NULL
        AND signal_status IN ('TP_HIT', 'SL_HIT')
        AND closed_at BETWEEN $1 AND $2
        AND source NOT IN ('ADMIN_ALERT_TEST', 'CONTROLLED_E2E_AUTOMATION')
        AND NOT COALESCE(metadata->'tags', '[]'::jsonb) ?| ARRAY['TEST_ONLY', 'E2E', 'NOT_FOR_CLIENTS']
      ORDER BY closed_at
    `, [PERIOD_START, PERIOD_END]);
    return result.rows;
  } finally {
    await client.end();
  }
}

function applyObservedClosures(
  scenarios: ReturnType<typeof buildProbabilisticScenarios>["scenarios"],
  closures: ObservedClosure[],
): number {
  const used = new Set<string>();
  let replacements = 0;
  for (const closure of closures) {
    const closedAt = new Date(closure.closed_at).getTime();
    const candidate = scenarios
      .filter(scenario => scenario.symbol === closure.symbol && !used.has(scenario.scenarioId))
      .map(scenario => ({ scenario, distance: Math.abs(Date.parse(scenario.occurredAt) - closedAt) }))
      .filter(item => item.distance <= 7 * 24 * 60 * 60 * 1_000)
      .sort((left, right) => left.distance - right.distance)[0]?.scenario;
    if (!candidate) continue;
    candidate.observedOutcome = (closure.signal_status === "TP_HIT" ? "TP" : "SL") as SimulationOutcome;
    candidate.observedSignalId = closure.signal_id;
    used.add(candidate.scenarioId);
    replacements += 1;
  }
  return replacements;
}

async function main(): Promise<void> {
  const candles = await loadCandles();
  const scenarioBuild = buildProbabilisticScenarios({ candles });
  const observedClosures = await loadObservedClosures();
  const observedReplacements = applyObservedClosures(scenarioBuild.scenarios, observedClosures);
  const profiles = createProbabilisticProfiles(RUN_ID);
  const simulation = runProbabilisticSimulation({
    seed: SEED,
    iterations: ITERATIONS,
    scenarios: scenarioBuild.scenarios,
    profiles,
    generatedAt: PERIOD_END,
  });
  const enrichedProfiles = profiles.map(profile => ({
    ...profile,
    ...simulation.profiles.find(result => result.profileId === profile.profileId),
    label: "Perfil de simulacion probabilistica",
  }));
  const output = {
    runId: RUN_ID,
    title: "Resultados de simulacion probabilistica historica",
    description: "Escenarios calculados mediante probabilidades, condiciones historicas del mercado y reglas operativas de CARVIPIX.",
    disclaimer: "Resultados simulados. No corresponden a operaciones ejecutadas ni garantizan resultados futuros.",
    period: { start: PERIOD_START, end: PERIOD_END },
    seed: SEED,
    iterations: ITERATIONS,
    dataSource: "TWELVE_DATA_REAL_H1_AND_DOCUMENTED_PROBABILITY_MODEL",
    dataHash: scenarioBuild.dataHash,
    methodologyVersion: "CARVIPIX_PROBABILISTIC_SIMULATION_V1",
    assumptions: {
      scenarioModel: "Documented EMA, ATR, trend, context and volatility model without look-ahead",
      probabilityPolicy: "Versioned cost-adjusted prior; not an archived CARVIPIX probability",
      costs: {
        policy: "Conservative versioned assumptions by asset",
        included: ["spread", "commission", "slippage"],
      },
    },
    limitations: { items: scenarioBuild.limitations },
    sourceCoverage: {
      realCandles: candles.length,
      modeledScenarios: scenarioBuild.scenarios.filter(scenario => scenario.sourceType === "DOCUMENTED_MODEL").length,
      recordedProbabilityScenarios: scenarioBuild.scenarios.filter(scenario => scenario.sourceType === "RECORDED_ANALYSIS").length,
      observedClosuresAvailable: observedClosures.length,
      observedClosuresApplied: observedReplacements,
    },
    metrics: {
      expectedValueR: simulation.expectedValueR,
      scenarios: scenarioBuild.scenarios.length,
      profiles: profiles.length,
      botProfiles: profiles.filter(profile => profile.isBotProfile).length,
      observedClosuresApplied: observedReplacements,
    },
    scenarios: scenarioBuild.scenarios,
    profiles: enrichedProfiles,
    botProfileIds: profiles.filter(profile => profile.isBotProfile).map(profile => profile.profileId),
  };
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outputDirectory = path.join(repositoryRoot, "artifacts", "probabilistic-results");
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, `${RUN_ID}.json`);
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    outputPath,
    period: output.period,
    dataHash: output.dataHash,
    realCandles: output.sourceCoverage.realCandles,
    scenarios: output.scenarios.length,
    profiles: output.profiles.length,
    botProfiles: output.botProfileIds.length,
    observedClosuresApplied: output.sourceCoverage.observedClosuresApplied,
  }, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});