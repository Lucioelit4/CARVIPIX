/**
 * Telegram Notification Service — Maestro V3
 * Envía alertas de trading a Telegram en tiempo real
 * 
 * FILOSOFÍA: Resiliente. Si falla, no bloquea el análisis.
 * SEGURIDAD: Solo envía analysis_public (sin datos privados)
 */

import type { PayloadTelegram, CadpDecisionV3, PayloadAlertaPremium } from "./typesMaestroV3";
import { communicationEngine } from "./communicationEngine";

export interface TelegramNotificationResult {
  success: boolean;
  message_id?: string;
  channel_id?: string;
  error?: string;
  latency_ms: number;
  skipped?: boolean;
}

export class TelegramNotificationService {
  private readonly botToken: string;
  private readonly freeAlertsChannelId: string;
  private readonly freeNotesChannelId: string;
  private readonly apiBaseUrl = "https://api.telegram.org";

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    // Canal del grupo gratuito para alertas operativas.
    this.freeAlertsChannelId = process.env.TELEGRAM_CHANNEL_FREE ||
      process.env.TELEGRAM_CHANNEL_OFFICIAL ||
      process.env.TELEGRAM_CHANNEL_TEST ||
      "";

    // Canal para notas de actividad (mantener grupo vivo). Si no se define, usa el mismo del grupo gratuito.
    this.freeNotesChannelId = process.env.TELEGRAM_CHANNEL_FREE_NOTES ||
      this.freeAlertsChannelId;
    
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
  ): Promise<TelegramNotificationResult> {
    const started = Date.now();

    if (!this.botToken || !this.freeAlertsChannelId || !this.freeNotesChannelId) {
      return {
        success: false,
        error: "Telegram credentials not configured",
        latency_ms: Date.now() - started,
      };
    }

    try {
      const plan = communicationEngine.prepareTelegramPlan({
        symbol,
        decision,
        payload,
        premiumPayload,
      });

      if (!plan.shouldSend || !plan.message) {
        console.log(`[CommunicationEngine] Skipped ${symbol} ${decision}: ${plan.reason}`);
        return {
          success: true,
          skipped: true,
          channel_id: this.resolveTargetChannel(plan.channel),
          latency_ms: Date.now() - started,
        };
      }

      const targetChannelId = this.resolveTargetChannel(plan.channel);

      // Enviar a Telegram
      const response = await fetch(
        `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: targetChannelId,
            text: plan.message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        },
      );

      const latency = Date.now() - started;

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Telegram] API Error:", errorData);
        return {
          success: false,
          error: errorData.description || `HTTP ${response.status}`,
          channel_id: targetChannelId,
          latency_ms: latency,
        };
      }

      const result = await response.json();
      if (result.ok === true) {
        communicationEngine.registerSent(plan);
      }

      return {
        success: result.ok === true,
        message_id: result.result?.message_id?.toString(),
        channel_id: targetChannelId,
        latency_ms: latency,
      };

    } catch (err) {
      const latency = Date.now() - started;
      console.error("[Telegram] Send failed:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        channel_id: this.resolveTargetChannel(decision === "ENTER_BUY" || decision === "ENTER_SELL" ? "alerts" : "notes"),
        latency_ms: latency,
      };
    }
  }

  private resolveTargetChannel(channel: ChannelKind | CadpDecisionV3): string {
    if (channel === "alerts" || channel === "ENTER_BUY" || channel === "ENTER_SELL") {
      return this.freeAlertsChannelId;
    }

    return this.freeNotesChannelId;
  }
}

export const telegramNotificationService = new TelegramNotificationService();
