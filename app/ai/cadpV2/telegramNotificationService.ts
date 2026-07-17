/**
 * Telegram Notification Service — Maestro V3
 * Envía alertas de trading a Telegram en tiempo real
 * 
 * FILOSOFÍA: Resiliente. Si falla, no bloquea el análisis.
 * SEGURIDAD: Solo envía analysis_public (sin datos privados)
 */

import type { PayloadTelegram, CadpDecisionV3 } from "./typesMaestroV3";

export interface TelegramNotificationResult {
  success: boolean;
  message_id?: string;
  channel_id?: string;
  error?: string;
  latency_ms: number;
}

export class TelegramNotificationService {
  private readonly botToken: string;
  private readonly channelId: string;
  private readonly apiBaseUrl = "https://api.telegram.org";

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    // Usar TELEGRAM_CHANNEL_TEST en desarrollo, TELEGRAM_CHANNEL_OFFICIAL en producción
    this.channelId = process.env.TELEGRAM_CHANNEL_OFFICIAL || 
                     process.env.TELEGRAM_CHANNEL_TEST || 
                     "";
    
    if (!this.botToken || !this.channelId) {
      console.warn(
        "[Telegram] Missing configuration: " +
        `TOKEN=${!!this.botToken ? "✓" : "✗"}, ` +
        `CHANNEL=${!!this.channelId ? "✓" : "✗"}`,
      );
    }
  }

  async sendTradeAlert(
    payload: PayloadTelegram,
    symbol: string,
    decision: CadpDecisionV3,
  ): Promise<TelegramNotificationResult> {
    const started = Date.now();

    if (!this.botToken || !this.channelId) {
      return {
        success: false,
        error: "Telegram credentials not configured",
        latency_ms: Date.now() - started,
      };
    }

    try {
      // Determinar acción y emoji
      const actionMap: Record<string, { action: string; emoji: string }> = {
        "ENTER_BUY": { action: "🟢 BUY SIGNAL", emoji: "📈" },
        "ENTER_SELL": { action: "🔴 SELL SIGNAL", emoji: "📉" },
        "WAIT": { action: "⏳ WAIT", emoji: "⏸️" },
        "CONDITIONAL_ENTRY": { action: "⚠️ CONDITIONAL", emoji: "🔔" },
        "NO_TRADE": { action: "❌ NO TRADE", emoji: "⛔" },
      };

      const decisionInfo = actionMap[decision] || { action: "❓ UNKNOWN", emoji: "❓" };

      // Construir mensaje
      const message = this.buildMessage(symbol, payload, decisionInfo);

      // Enviar a Telegram
      const response = await fetch(
        `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: this.channelId,
            text: message,
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
          channel_id: this.channelId,
          latency_ms: latency,
        };
      }

      const result = await response.json();

      return {
        success: result.ok === true,
        message_id: result.result?.message_id?.toString(),
        channel_id: this.channelId,
        latency_ms: latency,
      };

    } catch (err) {
      const latency = Date.now() - started;
      console.error("[Telegram] Send failed:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        channel_id: this.channelId,
        latency_ms: latency,
      };
    }
  }

  private buildMessage(
    symbol: string,
    payload: PayloadTelegram,
    decision: { action: string; emoji: string },
  ): string {
    const { public_summary, market_status, public_warning } = payload;

    let message = `${decision.emoji} <b>${symbol} — ${decision.action}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `\n`;

    // Market status
    if (market_status) {
      message += `📊 <b>Market:</b> ${market_status}\n`;
    }

    // Public summary
    if (public_summary) {
      message += `\n📈 <b>Analysis:</b>\n`;
      message += `${public_summary}\n`;
    }

    // Warning if exists
    if (public_warning) {
      message += `\n⚠️ <b>Warning:</b>\n`;
      message += `${public_warning}\n`;
    }

    // Action taken
    if (payload.action_taken) {
      message += `\n✅ <b>Action:</b>\n`;
      message += `${payload.action_taken}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🔔 CARVIPIX Trading Engine\n`;
    message += `⏰ ${new Date().toLocaleString("es-ES")}\n`;

    return message;
  }
}

export const telegramNotificationService = new TelegramNotificationService();
