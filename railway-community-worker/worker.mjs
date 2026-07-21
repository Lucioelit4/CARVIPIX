const runUrl = process.env.COMMUNITY_RUN_URL?.trim();
const cronToken = process.env.COMMUNITY_CRON_TOKEN?.trim();
const configuredInterval = Number(process.env.COMMUNITY_WORKER_INTERVAL_SECONDS ?? 300);
const intervalMs = Math.max(300, Number.isFinite(configuredInterval) ? configuredInterval : 300) * 1000;

if (!runUrl || !cronToken) {
  throw new Error("COMMUNITY_WORKER_CONFIG_MISSING");
}

let running = false;
let stopping = false;

async function runCycle() {
  if (running || stopping) return;
  running = true;
  try {
    const response = await fetch(runUrl, {
      method: "POST",
      headers: { "x-community-cron-token": cronToken },
      signal: AbortSignal.timeout(90_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      throw new Error(`COMMUNITY_WORKER_HTTP_${response.status}`);
    }
    const results = Array.isArray(payload.results) ? payload.results : [];
    const nextRunAt = new Date(Date.now() + intervalMs).toISOString();
    console.log(JSON.stringify({
      event: "COMMUNITY_EDITORIAL_CYCLE_COMPLETED",
      http_status: response.status,
      route_ok: payload.ok === true,
      source_count: payload.source_count ?? 0,
      published_count: results.filter((result) => !result.skipped && !result.failed).length,
      failed_count: results.filter((result) => result.failed).length,
      completed_at: new Date().toISOString(),
      next_run_at: nextRunAt,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      event: "COMMUNITY_EDITORIAL_CYCLE_FAILED",
      error_code: error instanceof Error ? error.message : "COMMUNITY_WORKER_UNKNOWN_ERROR",
      failed_at: new Date().toISOString(),
    }));
  } finally {
    running = false;
  }
}

const timer = setInterval(runCycle, intervalMs);
timer.unref();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    clearInterval(timer);
    process.exitCode = 0;
  });
}

await runCycle();
await new Promise((resolve) => {
  const keepAlive = setInterval(() => {
    if (stopping) {
      clearInterval(keepAlive);
      resolve();
    }
  }, 1000);
});