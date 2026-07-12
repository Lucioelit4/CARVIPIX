import { OandaV20DemoAdapter } from "../app/engine/data/oandaV20DemoAdapter";

async function main(): Promise<void> {
  const adapter = new OandaV20DemoAdapter();

  try {
    adapter.ensureCredentialsOrThrow();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("BLOCKED_BY_EXTERNAL_DEPENDENCY: OANDA_DEMO_CREDENTIALS")) {
      console.error("BLOCKED_BY_EXTERNAL_DEPENDENCY: OANDA_DEMO_CREDENTIALS");
      process.exit(2);
    }
    throw error;
  }

  const report = await adapter.runXauusdPilot(30);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
