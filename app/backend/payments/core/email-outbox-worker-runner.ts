import "server-only";

import { PaymentEmailOutboxWorker } from "./email-outbox-worker";

async function run(): Promise<void> {
  const worker = new PaymentEmailOutboxWorker({
    batchSize: Number(process.env.PAYMENT_EMAIL_WORKER_BATCH_SIZE ?? 20),
    maxRetries: Number(process.env.PAYMENT_EMAIL_WORKER_MAX_RETRIES ?? 5),
  });

  const result = await worker.processBatch();

  console.info("[CARVIPIX][PAYMENTS][EMAIL_WORKER]", {
    processed: result.processed,
    sent: result.sent,
    failed: result.failed,
    retried: result.retried,
  });
}

run().catch((error) => {
  console.error("[CARVIPIX][PAYMENTS][EMAIL_WORKER][FATAL]", error);
  process.exitCode = 1;
});
