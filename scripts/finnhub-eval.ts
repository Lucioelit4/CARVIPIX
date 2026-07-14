import { runFinnhubConnectionProbe } from "@/app/backend/data-platform/providers/finnhub";

function summarize(checks: Awaited<ReturnType<typeof runFinnhubConnectionProbe>>["checks"]) {
  const ok = checks.filter((c) => c.ok).length;
  const failed = checks.length - ok;
  const blockedByPlan = checks.filter((c) => c.blockedByPlan).length;
  const blockedByAuth = checks.filter((c) => c.blockedByAuth).length;

  return {
    total: checks.length,
    ok,
    failed,
    blockedByPlan,
    blockedByAuth,
  };
}

async function main(): Promise<void> {
  try {
    const result = await runFinnhubConnectionProbe();
    const summary = summarize(result.checks);

    console.log(JSON.stringify({
      provider: result.provider,
      mode: result.mode,
      at: result.at,
      summary,
      checks: result.checks,
    }, null, 2));

    if (summary.failed > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({
      provider: "finnhub",
      mode: "evaluation",
      ok: false,
      error: message,
    }, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({
    provider: "finnhub",
    mode: "evaluation",
    ok: false,
    error: message,
  }, null, 2));
  process.exitCode = 1;
});
