import { Client } from "pg";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const result = await client.query<{
      runs: number;
      scenarios: number;
      observed_scenarios: number;
      profiles: number;
      bot_profiles: number;
      balances: number;
      events: number;
      observed_events: number;
      isolation_violations: number;
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM probabilistic_simulation_runs WHERE status = 'COMPLETED') AS runs,
        (SELECT COUNT(*)::int FROM probabilistic_simulation_scenarios) AS scenarios,
        (SELECT COUNT(*)::int FROM probabilistic_simulation_scenarios WHERE observed_signal_id IS NOT NULL) AS observed_scenarios,
        (SELECT COUNT(*)::int FROM probabilistic_profiles) AS profiles,
        (SELECT COUNT(*)::int FROM probabilistic_bot_profiles) AS bot_profiles,
        (SELECT COUNT(*)::int FROM probabilistic_profile_balances) AS balances,
        (SELECT COUNT(*)::int FROM probabilistic_profile_events) AS events,
        (SELECT COUNT(*)::int FROM probabilistic_profile_events WHERE source_type = 'OBSERVED_OFFICIAL_CLOSURE') AS observed_events,
        (SELECT COUNT(*)::int FROM probabilistic_profiles
          WHERE is_real_user OR profile_type <> 'PROBABILISTIC_SIMULATION'
            OR NOT exclude_from_members OR NOT exclude_from_revenue
            OR NOT exclude_from_live_users OR NOT exclude_from_testimonials) AS isolation_violations
    `);
    const counts = result.rows[0];
    if (counts.runs !== 1 || counts.scenarios !== 456 || counts.observed_scenarios !== 1) throw new Error("PERSISTED_RUN_COUNTS_INVALID");
    if (counts.profiles !== 60 || counts.bot_profiles !== 24 || counts.isolation_violations !== 0) throw new Error("PROFILE_ISOLATION_INVALID");
    if (counts.balances !== 27_420 || counts.events !== 27_360 || counts.observed_events !== 60) throw new Error("PROFILE_ARTIFACT_COUNTS_INVALID");
    console.log(JSON.stringify({ integrity: "ok", featureFlagEnabled: process.env.PROBABILISTIC_HISTORICAL_RESULTS_ENABLED === "true", ...counts }));
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});