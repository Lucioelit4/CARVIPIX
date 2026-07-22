import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
  if (process.env.PROBABILISTIC_HISTORICAL_RESULTS_ENABLED === "true") {
    throw new Error("MIGRATION_REQUIRES_PROBABILISTIC_FLAG_OFF");
  }
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const migrationPath = path.join(repositoryRoot, "app", "backend", "db", "migrations", "20260721_probabilistic_results.sql");
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(await readFile(migrationPath, "utf8"));
    const tables = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'probabilistic_%'
      ORDER BY table_name
    `);
    console.log(JSON.stringify({ migration: "ok", tables: tables.rows.map(row => row.table_name) }));
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});