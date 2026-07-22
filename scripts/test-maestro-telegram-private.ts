import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function loadLocalEnv(): Promise<void> {
  const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8").catch(() => "");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  await loadLocalEnv();
  process.env.TEST_ONLY = "true";

  const testChannel = process.env.TELEGRAM_CHANNEL_TEST?.trim();
  const officialChannel = (
    process.env.TELEGRAM_CHANNEL_FREE
    || process.env.TELEGRAM_CHANNEL_OFFICIAL
  )?.trim();
  if (!process.env.TELEGRAM_BOT_TOKEN || !testChannel) {
    throw new Error("TEST_ONLY_REQUIRES_TELEGRAM_BOT_TOKEN_AND_TELEGRAM_CHANNEL_TEST");
  }
  if (officialChannel && officialChannel === testChannel) {
    throw new Error("TEST_ONLY_CHANNEL_MUST_DIFFER_FROM_OFFICIAL_CHANNEL");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("TEST_ONLY_REQUIRES_DATABASE_URL_FOR_DELIVERY_EVIDENCE");
  }

  const nonce = randomUUID();
  const analysisId = `test-analysis-${nonce}`;
  const signalId = `test-signal-${nonce}`;
  const eventId = `test-event-${nonce}`;
  const { TelegramNotificationService } = await import("../app/ai/cadpV2/telegramNotificationService");
  const service = new TelegramNotificationService();
  const result = await service.sendTradeAlert(
    {
      public_summary: "Validacion privada del contrato de entrega Maestro V3.",
      market_status: "SIN_MERCADO",
      action_taken: "TEST_ONLY_NO_OPERATION",
      public_warning: "Prueba tecnica. No es una senal operativa.",
      recheck_minutes: 15,
      scenario_classification: "NO_SETUP",
      proximity_to_entry: "INVALID",
    },
    "XAUUSD-TEST_ONLY",
    "ENTER_BUY",
    {
      canonical_symbol: "XAUUSD",
      action: "BUY",
      entry: 1,
      stop_loss: 0.5,
      take_profit: 2,
      rr: 2,
      probability: 0,
      market_condition: "TEST_ONLY: validacion tecnica sin mercado real.",
      primary_warning: "NO OPERAR. MENSAJE DE PRUEBA PRIVADA.",
    },
    {
      analysis_id: analysisId,
      signal_id: signalId,
      event_id: eventId,
      test_only: true,
    },
  );

  if (!result.success || result.skipped || !result.message_id || !result.delivery_id) {
    throw new Error(`PRIVATE_TELEGRAM_TEST_FAILED:${result.error ?? result.reason}`);
  }
  if (
    result.destination_mode !== "TEST_ONLY"
    || !result.channel_id
    || (officialChannel && result.channel_id === officialChannel)
  ) {
    throw new Error("PRIVATE_TELEGRAM_TEST_ROUTED_TO_UNEXPECTED_DESTINATION");
  }

  const { backendDatabase } = await import("../app/backend/core/database");
  const persisted = await backendDatabase.query<{ message_id: string; delivery_state: string }>(
    `SELECT message_id, delivery_state FROM telegram_delivery_ledger WHERE delivery_id = $1`,
    [result.delivery_id],
  );
  if (persisted.rows[0]?.message_id !== result.message_id || persisted.rows[0]?.delivery_state !== "SENT") {
    throw new Error("PRIVATE_TELEGRAM_DELIVERY_EVIDENCE_NOT_PERSISTED");
  }

  console.log(JSON.stringify({
    ok: true,
    destination_mode: result.destination_mode,
    classification: result.classification,
    message_id: result.message_id,
    delivery_id: result.delivery_id,
    persisted: true,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});