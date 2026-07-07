import "server-only";

import { emailNotificationService } from "@/app/backend/notifications";
import type { PaymentTransactionalEmailInput } from "@/app/backend/notifications/types";
import { backendDatabase } from "@/app/backend/core/database";
import { calculateNextRetryAt, shouldFinalizeAsFailed } from "./email-outbox-logic";
import { ACQUIRE_PENDING_EMAIL_OUTBOX_SQL } from "./email-outbox-worker-queries";

type OutboxStatus = "pending" | "processing" | "processed" | "failed";

type OutboxEmailRow = {
  id: string;
  aggregate_id: string;
  event_name: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  available_at: Date;
  created_at: Date;
};

type PaymentEmailOutboxPayload = PaymentTransactionalEmailInput & {
  dedupeKey: string;
  paymentTransactionId?: string;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asPayload(payload: unknown): PaymentEmailOutboxPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid outbox payload.");
  }

  const typed = payload as Partial<PaymentEmailOutboxPayload>;
  if (!typed.templateId || !typed.recipientEmail || !typed.paymentOrderId || !typed.recipientName || !typed.dedupeKey) {
    throw new Error("Outbox payload missing required fields.");
  }

  return typed as PaymentEmailOutboxPayload;
}

export type PaymentEmailOutboxWorkerOptions = {
  batchSize?: number;
  maxRetries?: number;
  now?: () => Date;
  sendTransactional?: (input: PaymentTransactionalEmailInput) => Promise<{ accepted: boolean; provider: string; messageId?: string }>;
};

export type PaymentEmailOutboxWorkerResult = {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
};

export class PaymentEmailOutboxWorker {
  private readonly batchSize: number;
  private readonly maxRetries: number;
  private readonly now: () => Date;
  private readonly sendTransactional: (input: PaymentTransactionalEmailInput) => Promise<{ accepted: boolean; provider: string; messageId?: string }>;

  constructor(options: PaymentEmailOutboxWorkerOptions = {}) {
    this.batchSize = Math.max(1, options.batchSize ?? 20);
    this.maxRetries = Math.max(1, options.maxRetries ?? 5);
    this.now = options.now ?? (() => new Date());
    this.sendTransactional = options.sendTransactional ?? ((input) => emailNotificationService.sendPaymentTransactional(input));
  }

  async processBatch(): Promise<PaymentEmailOutboxWorkerResult> {
    if (!backendDatabase.enabled) {
      return {
        processed: 0,
        sent: 0,
        failed: 0,
        retried: 0,
      };
    }

    const rows = await this.acquirePendingRows();
    const result: PaymentEmailOutboxWorkerResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
    };

    for (const row of rows) {
      const processed = await this.processSingleRow(row);
      result.processed += 1;

      if (processed === "sent") {
        result.sent += 1;
      }

      if (processed === "failed") {
        result.failed += 1;
      }

      if (processed === "retried") {
        result.retried += 1;
      }
    }

    return result;
  }

  private async acquirePendingRows(): Promise<OutboxEmailRow[]> {
    return backendDatabase.withTransaction(async (client) => {
      const { rows } = await client.query<OutboxEmailRow>(
        ACQUIRE_PENDING_EMAIL_OUTBOX_SQL,
        [this.batchSize]
      );

      return rows;
    });
  }

  private async processSingleRow(row: OutboxEmailRow): Promise<"sent" | "failed" | "retried"> {
    const now = this.now();
    let payload: PaymentEmailOutboxPayload;

    try {
      payload = asPayload(row.payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid payload.";
      await this.finalizeFailure(row, message, now);
      return "failed";
    }

    try {
      const sendResult = await this.sendTransactional({
        templateId: payload.templateId,
        recipientEmail: payload.recipientEmail,
        recipientName: payload.recipientName,
        paymentOrderId: payload.paymentOrderId,
        amount: payload.amount,
        currency: payload.currency,
        provider: payload.provider,
        providerEventId: payload.providerEventId,
        failureReason: payload.failureReason,
      });

      if (!sendResult.accepted) {
        throw new Error("Email provider rejected message.");
      }

      await backendDatabase.withTransaction(async (client) => {
        await client.query(
          `
          UPDATE payment_outbox_events
          SET status = 'processed',
              processed_at = $2,
              last_error = NULL
          WHERE id = $1
          `,
          [row.id, now]
        );

        await client.query(
          `
          INSERT INTO payment_timeline_events (
            id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
          ) VALUES (
            $1, $2, $3, 'email_sent', 'system', $4::jsonb, $5, $6, $7
          )
          `,
          [
            createId("ptle"),
            payload.paymentOrderId,
            payload.paymentTransactionId ?? null,
            JSON.stringify({
              outboxEventId: row.id,
              templateId: payload.templateId,
              recipientEmail: payload.recipientEmail,
              dedupeKey: payload.dedupeKey,
              provider: sendResult.provider,
              messageId: sendResult.messageId ?? null,
            }),
            payload.dedupeKey,
            now,
            "worker:payment-email",
          ]
        );
      });

      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email send failure.";
      const final = await this.finalizeFailure(row, message, now, payload);
      return final ? "failed" : "retried";
    }
  }

  private async finalizeFailure(
    row: OutboxEmailRow,
    errorMessage: string,
    now: Date,
    payload?: PaymentEmailOutboxPayload
  ): Promise<boolean> {
    const finalFailure = shouldFinalizeAsFailed({
      attempt: row.attempts,
      maxRetries: this.maxRetries,
    });

    const nextRetryAt = calculateNextRetryAt({ now, attempt: row.attempts });

    await backendDatabase.withTransaction(async (client) => {
      if (finalFailure) {
        await client.query(
          `
          UPDATE payment_outbox_events
          SET status = 'failed',
              available_at = $2,
              last_error = $3,
              processed_at = $2
          WHERE id = $1
          `,
          [row.id, now, errorMessage]
        );
      } else {
        await client.query(
          `
          UPDATE payment_outbox_events
          SET status = 'pending',
              available_at = $2,
              last_error = $3
          WHERE id = $1
          `,
          [row.id, nextRetryAt, errorMessage]
        );
      }

      await client.query(
        `
        INSERT INTO payment_timeline_events (
          id, payment_order_id, payment_transaction_id, event_type, event_source, event_data, correlation_id, occurred_at, actor
        ) VALUES (
          $1, $2, $3, 'email_failed', 'system', $4::jsonb, $5, $6, $7
        )
        `,
        [
          createId("ptle"),
          payload?.paymentOrderId ?? null,
          payload?.paymentTransactionId ?? null,
          JSON.stringify({
            outboxEventId: row.id,
            templateId: payload?.templateId ?? null,
            recipientEmail: payload?.recipientEmail ?? null,
            dedupeKey: payload?.dedupeKey ?? null,
            attempts: row.attempts,
            finalFailure,
            errorMessage,
          }),
          payload?.dedupeKey ?? row.id,
          now,
          "worker:payment-email",
        ]
      );
    });

    return finalFailure;
  }
}
