import { randomUUID } from "node:crypto";

export type TelegramDeliveryState = "SENT" | "SKIPPED" | "FAILED";
export type TelegramDeliveryClassification = "OFFICIAL_ALERT" | "GLOBAL_SUMMARY";
export type TelegramDestinationMode = "OFFICIAL" | "TEST_ONLY";

export interface TelegramDeliveryRecord {
  delivery_id: string;
  event_id: string;
  analysis_id: string;
  signal_id: string;
  symbol: string;
  decision: string;
  classification: TelegramDeliveryClassification;
  state: TelegramDeliveryState;
  destination_mode: TelegramDestinationMode;
  channel_id: string | null;
  message_id: string | null;
  reason: string;
  error: string | null;
  created_at: string;
}

type DeliveryWriter = (record: TelegramDeliveryRecord) => Promise<void>;

async function writeDelivery(record: TelegramDeliveryRecord): Promise<void> {
  const { backendDatabase } = await import("@/app/backend/core/database");
  await backendDatabase.withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO telegram_delivery_ledger (
        delivery_id, event_id, analysis_id, signal_id, symbol, decision,
        classification, delivery_state, destination_mode, channel_id,
        message_id, reason, error_message, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      `,
      [
        record.delivery_id,
        record.event_id,
        record.analysis_id,
        record.signal_id,
        record.symbol,
        record.decision,
        record.classification,
        record.state,
        record.destination_mode,
        record.channel_id,
        record.message_id,
        record.reason,
        record.error,
        new Date(record.created_at),
      ],
    );

    await client.query(
      `
      UPDATE real_signal_lifecycle
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW()
      WHERE signal_id = $1
      `,
      [
        record.signal_id,
        JSON.stringify({
          telegramDelivery: {
            deliveryId: record.delivery_id,
            eventId: record.event_id,
            classification: record.classification,
            state: record.state,
            destinationMode: record.destination_mode,
            channelId: record.channel_id,
            messageId: record.message_id,
            reason: record.reason,
            error: record.error,
            recordedAt: record.created_at,
          },
        }),
      ],
    );
  });
}

export class TelegramDeliveryLedger {
  constructor(private readonly writer: DeliveryWriter = writeDelivery) {}

  async record(input: Omit<TelegramDeliveryRecord, "delivery_id" | "created_at">): Promise<TelegramDeliveryRecord> {
    const record: TelegramDeliveryRecord = {
      ...input,
      delivery_id: `tdl-${randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    await this.writer(record);
    return record;
  }
}

export const telegramDeliveryLedger = new TelegramDeliveryLedger();