import { Client } from "pg";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const lifecycle = await client.query(`
      SELECT COUNT(*)::int AS total,
        MIN(signal_timestamp) AS oldest,
        MAX(signal_timestamp) AS newest,
        COUNT(*) FILTER (WHERE decision IN ('ENTER_BUY', 'ENTER_SELL'))::int AS entries,
        COUNT(*) FILTER (WHERE activated_at IS NOT NULL)::int AS activated,
        COUNT(*) FILTER (WHERE signal_status IN ('TP_HIT', 'SL_HIT', 'CLOSED'))::int AS terminal,
        COUNT(*) FILTER (WHERE metadata ? 'grossRR' OR metadata ? 'netRR')::int AS with_rr,
        COUNT(*) FILTER (WHERE metadata ? 'probability' OR metadata ? 'probabilityEstimated')::int AS with_probability
      FROM real_signal_lifecycle
    `);
    const market = await client.query(`
      SELECT COUNT(*)::int AS candles,
        MIN(open_time) AS oldest,
        MAX(open_time) AS newest,
        COUNT(DISTINCT symbol)::int AS symbols,
        COUNT(DISTINCT timeframe)::int AS timeframes
      FROM ie_candles
    `);
    console.log(JSON.stringify({
      lifecycle: lifecycle.rows[0],
      market: market.rows[0],
      twelveDataConfigured: Boolean(process.env.TWELVE_DATA_API_KEY),
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});