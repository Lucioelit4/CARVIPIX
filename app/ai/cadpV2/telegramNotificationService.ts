/**
 * Telegram Notification Service — Maestro V3
 * Envía alertas de trading a Telegram en tiempo real
 * 
 * FILOSOFÍA: Resiliente. Si falla, no bloquea el análisis.
 * SEGURIDAD: Solo envía analysis_public (sin datos privados)
 */

import type { PayloadTelegram, CadpDecisionV3, PayloadAlertaPremium } from "./typesMaestroV3";
import { communicationEngine } from "./communicationEngine";
import { paperTradeMonitor } from "./paperTradeMonitor";
import {
  telegramDeliveryLedger,
  type TelegramDeliveryClassification,
  type TelegramDestinationMode,
} from "./telegramDeliveryLedger";

type TelegramTargetChannel = "alerts" | "notes";

export interface TelegramNotificationResult {
  success: boolean;
  message_id?: string;
  channel_id?: string;
  error?: string;
  latency_ms: number;
  skipped?: boolean;
  classification: TelegramDeliveryClassification;
  reason: string;
  delivery_id?: string;
  destination_mode: TelegramDestinationMode;
}

export interface TelegramDeliveryContext {
  analysis_id: string;
  signal_id: string;
  event_id: string;
  test_only?: boolean;
}

export class TelegramNotificationService {
  private readonly botToken: string;
  private readonly freeAlertsChannelId: string;
  private readonly freeNotesChannelId: string;
  private readonly testChannelId: string;
  private readonly apiBaseUrl = "https://api.telegram.org";

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    // Canal del grupo gratuito para alertas operativas.
    this.freeAlertsChannelId = process.env.TELEGRAM_CHANNEL_FREE ||
      process.env.TELEGRAM_CHANNEL_OFFICIAL ||
      "";

    // Canal para notas de actividad (mantener grupo vivo). Si no se define, usa el mismo del grupo gratuito.
    this.freeNotesChannelId = process.env.TELEGRAM_CHANNEL_FREE_NOTES ||
      this.freeAlertsChannelId;
    this.testChannelId = process.env.TELEGRAM_CHANNEL_TEST || "";
    
    if (!this.botToken || !this.freeAlertsChannelId || !this.freeNotesChannelId) {
      console.warn(
        "[Telegram] Missing configuration: " +
        `TOKEN=${!!this.botToken ? "✓" : "✗"}, ` +
        `FREE_ALERTS_CHANNEL=${!!this.freeAlertsChannelId ? "✓" : "✗"}, ` +
        `FREE_NOTES_CHANNEL=${!!this.freeNotesChannelId ? "✓" : "✗"}`,
      );
    }
  }

  async sendTradeAlert(
    payload: PayloadTelegram,
    symbol: string,
    decision: CadpDecisionV3,
    premiumPayload?: PayloadAlertaPremium,
    context?: TelegramDeliveryContext,
  ): Promise<TelegramNotificationResult> {
    const started = Date.now();
    const destinationMode: TelegramDestinationMode = context?.test_only || process.env.TEST_ONLY === "true"
      ? "TEST_ONLY"
      : "OFFICIAL";

    try {
      const paperAccount = paperTradeMonitor.getAccountState();
      const plan = communicationEngine.prepareTelegramPlan({
        symbol,
        decision,
        payload,
        premiumPayload,
        communityContext: {
          dailyPnlUsd: paperAccount.daily_pnl_usd,
          winCount: paperAccount.win_count,
          lossCount: paperAccount.loss_count,
          closedTrades: paperAccount.closed_trades.length,
        },
      });

      if (plan.category !== "OFFICIAL_ALERT") {
        return this.recordResult({
          success: true,
          skipped: true,
          channel_id: undefined,
          latency_ms: Date.now() - started,
          classification: plan.category,
          reason: "NON_OFFICIAL_ALERT_BLOCKED",
          destination_mode: destinationMode,
        }, context, symbol, decision);
      }

      let targetChannelId = this.resolveTargetChannel(plan.channel, destinationMode);

      if (!this.botToken || !targetChannelId) {
        return this.recordResult({
          success: false,
          error: destinationMode === "TEST_ONLY"
            ? "Telegram TEST_ONLY credentials not configured"
            : "Telegram official credentials not configured",
          channel_id: targetChannelId || undefined,
          latency_ms: Date.now() - started,
          classification: plan.category,
          reason: "CONFIGURATION_MISSING",
          destination_mode: destinationMode,
        }, context, symbol, decision);
      }

      if (!plan.shouldSend || !plan.message) {
        console.log(`[CommunicationEngine] Skipped ${symbol} ${decision}: ${plan.reason}`);
        return this.recordResult({
          success: true,
          skipped: true,
          channel_id: targetChannelId,
          latency_ms: Date.now() - started,
          classification: plan.category,
          reason: plan.reason,
          destination_mode: destinationMode,
        }, context, symbol, decision);
      }

      // Enviar a Telegram
      let response = await this.sendMessage(targetChannelId, plan.message);

      if (!response.ok) {
        const errorData = await response.clone().json() as {
          parameters?: { migrate_to_chat_id?: string | number };
        };
        const migratedChatId = errorData.parameters?.migrate_to_chat_id;
        if (response.status === 400 && migratedChatId !== undefined) {
          targetChannelId = String(migratedChatId);
          response = await this.sendMessage(targetChannelId, plan.message);
        }
      }

      const latency = Date.now() - started;

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Telegram] API Error:", errorData);
        return this.recordResult({
          success: false,
          error: errorData.description || `HTTP ${response.status}`,
          channel_id: targetChannelId,
          latency_ms: latency,
          classification: plan.category,
          reason: plan.reason,
          destination_mode: destinationMode,
        }, context, symbol, decision);
      }

      const result = await response.json();
      if (result.ok === true) {
        communicationEngine.registerSent(plan);
      }

      return this.recordResult({
        success: result.ok === true,
        message_id: result.result?.message_id?.toString(),
        channel_id: targetChannelId,
        latency_ms: latency,
        classification: plan.category,
        reason: plan.reason,
        destination_mode: destinationMode,
      }, context, symbol, decision);

    } catch (err) {
      const latency = Date.now() - started;
      console.error("[Telegram] Send failed:", err);
      return this.recordResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        channel_id: this.resolveTargetChannel(
          decision === "ENTER_BUY" || decision === "ENTER_SELL" ? "alerts" : "notes",
          destinationMode,
        ) || undefined,
        latency_ms: latency,
        classification: premiumPayload ? "OFFICIAL_ALERT" : "GLOBAL_SUMMARY",
        reason: "SEND_EXCEPTION",
        destination_mode: destinationMode,
      }, context, symbol, decision);
    }
  }

  private resolveTargetChannel(
    channel: TelegramTargetChannel | CadpDecisionV3,
    destinationMode: TelegramDestinationMode,
  ): string {
    if (destinationMode === "TEST_ONLY") {
      return this.testChannelId;
    }

    if (channel === "alerts" || channel === "ENTER_BUY" || channel === "ENTER_SELL") {
      return this.freeAlertsChannelId;
    }

    return this.freeNotesChannelId;
  }

  private sendMessage(channelId: string, message: string): Promise<Response> {
    return fetch(
      `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
  }

  private async recordResult(
    result: TelegramNotificationResult,
    context: TelegramDeliveryContext | undefined,
    symbol: string,
    decision: CadpDecisionV3,
  ): Promise<TelegramNotificationResult> {
    if (!context) {
      return result;
    }

    try {
      const record = await telegramDeliveryLedger.record({
        event_id: context.event_id,
        analysis_id: context.analysis_id,
        signal_id: context.signal_id,
        symbol,
        decision,
        classification: result.classification,
        state: result.success ? (result.skipped ? "SKIPPED" : "SENT") : "FAILED",
        destination_mode: result.destination_mode,
        channel_id: result.channel_id ?? null,
        message_id: result.message_id ?? null,
        reason: result.reason,
        error: result.error ?? null,
      });
      return { ...result, delivery_id: record.delivery_id };
    } catch (error) {
      console.error("[TelegramDeliveryLedger] Persistence failed:", error instanceof Error ? error.message : String(error));
      return result;
    }
  }
}

export const telegramNotificationService = new TelegramNotificationService();
