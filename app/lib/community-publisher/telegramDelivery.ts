/**
 * Community Publisher V1 — Telegram Delivery Service
 * Convierte publications en mensajes de Telegram y realiza seguimiento
 */

import type { Publication } from './types';
import { updatePublicationStatus } from './queueService';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_API_BASE = 'https://api.telegram.org';
const TIMEOUT_MS = 15_000;

export interface TelegramSendResult {
  ok: boolean;
  message_id?: number;
  error?: string;
  timestamp_utc_ms: number;
}

/**
 * Envía una publicación a Telegram
 * TEST_ONLY=true → solo canal de test
 * TEST_ONLY=false → canal oficial (si está habilitado)
 */
export async function deliverPublicationToTelegram(
  publication: Publication,
  messageText: string,
  testChannelId: string,
  officialChannelId?: string,
): Promise<TelegramSendResult> {
  const startTime = Date.now();

  // Validaciones
  if (!TELEGRAM_TOKEN) {
    return {
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN no configurado',
      timestamp_utc_ms: startTime,
    };
  }

  if (publication.test_only && !testChannelId) {
    return {
      ok: false,
      error: 'TEST_ONLY=true pero testChannelId no proporcionado',
      timestamp_utc_ms: startTime,
    };
  }

  // Determinar canal de destino
  let targetChannelId: string;
  if (publication.test_only) {
    targetChannelId = testChannelId;
  } else {
    if (!officialChannelId) {
      return {
        ok: false,
        error: 'TEST_ONLY=false pero officialChannelId no proporcionado',
        timestamp_utc_ms: startTime,
      };
    }
    targetChannelId = officialChannelId;
  }

  try {
    // Enviar a Telegram
    const url = `${BOT_API_BASE}/bot${TELEGRAM_TOKEN}/sendMessage`;
    const payload = {
      chat_id: targetChannelId,
      text: messageText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS),
      ),
    ]);

    if (!response.ok) {
      const error = await response.text();
      console.error(`[TELEGRAM] Envío fallido: ${response.status}`, error);
      return {
        ok: false,
        error: `HTTP ${response.status}`,
        timestamp_utc_ms: Date.now(),
      };
    }

    const data = (await response.json()) as { ok: boolean; result?: { message_id: number } };

    if (!data.ok) {
      return {
        ok: false,
        error: 'API returned ok=false',
        timestamp_utc_ms: Date.now(),
      };
    }

    const messageId = data.result?.message_id;
    if (!messageId) {
      return {
        ok: false,
        error: 'No message_id en respuesta',
        timestamp_utc_ms: Date.now(),
      };
    }

    console.log(
      `[TELEGRAM] ✓ Entregado: ${publication.publication_id} → msg_id=${messageId}`,
    );

    return {
      ok: true,
      message_id: messageId,
      timestamp_utc_ms: Date.now(),
    };
  } catch (error) {
    console.error(`[TELEGRAM] Error enviando ${publication.publication_id}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp_utc_ms: Date.now(),
    };
  }
}

/**
 * Procesa una publicación: renderiza template + envía a Telegram + actualiza estado
 */
export async function processPublicationForDelivery(
  publication: Publication,
  testChannelId: string,
  officialChannelId?: string,
): Promise<boolean> {
  try {
    // 1. Renderizar template con datos de la publicación
    const messageText = buildMessageFromPublication(publication);

    // 2. Enviar a Telegram
    const result = await deliverPublicationToTelegram(
      publication,
      messageText,
      testChannelId,
      officialChannelId,
    );

    if (result.ok && result.message_id) {
      // 3. Actualizar publicación como DELIVERED
      await updatePublicationStatus(publication.publication_id, {
        status: 'DELIVERED',
        telegram_message_id: result.message_id,
        delivered_at: new Date().toISOString(),
        attempts: publication.attempts + 1,
        last_attempt_at: new Date().toISOString(),
      });

      return true;
    } else {
      // 4. En caso de fallo, actualizar como FAILED (o DEAD_LETTER si max_attempts)
      const newAttempts = publication.attempts + 1;
      const isFinal = newAttempts >= publication.max_attempts;
      const newStatus = isFinal ? 'DEAD_LETTER' : 'FAILED';

      await updatePublicationStatus(publication.publication_id, {
        status: newStatus,
        attempts: newAttempts,
        last_attempt_at: new Date().toISOString(),
        last_error: result.error || 'Unknown error',
      });

      console.log(
        `[CP DELIVERY] ${publication.publication_id} → ${newStatus} (intento ${newAttempts}/${publication.max_attempts})`,
      );

      return false;
    }
  } catch (error) {
    console.error(
      `[CP DELIVERY] Error procesando ${publication.publication_id}:`,
      error,
    );
    return false;
  }
}

/**
 * Construye el mensaje final a partir de datos de publication
 */
function buildMessageFromPublication(publication: Publication): string {
  const metadata = publication.metadata as Record<string, unknown>;

  let text = '';

  // Encabezado según tipo
  if (publication.publication_type === 'FREE_ALERT') {
    text += `🎯 <b>ENTRADA ${publication.instrument}</b>\n\n`;
    const analysis = metadata.analysis_public as Record<string, unknown>;
    if (analysis) {
      text += `Entrada: ${analysis.entry}\n`;
      text += `SL: ${analysis.stop_loss}\n`;
      text += `TP: ${analysis.take_profit}\n`;
      text += `R/B: ${analysis.risk_reward}\n\n`;
    }
  } else if (publication.publication_type === 'TRADE_RESULT') {
    const result = metadata.trade_result as Record<string, unknown>;
    text += `📊 <b>RESULTADO</b>\n\n`;
    text += `${publication.instrument}: ${result?.result}\n`;
    text += `${result?.pnl_pips} pips (${result?.pnl_percent}%)\n\n`;
  } else if (publication.publication_type === 'MARKET_STATUS') {
    text += `📈 <b>ESTADO DEL MERCADO</b>\n\n`;
    text += `${publication.instrument}\n`;
    text += `${metadata.market_context || 'Contexto de mercado'}\n\n`;
  } else if (publication.publication_type === 'OPPORTUNITY_DEVELOPING') {
    text += `👀 <b>OPORTUNIDAD EN DESARROLLO</b>\n\n`;
    text += `${publication.instrument}\n`;
    text += `${metadata.decision}\n\n`;
  } else if (publication.publication_type === 'EDUCATIONAL_OR_PROMOTIONAL') {
    text += `📚 <b>EDUCACIÓN Y PROMOCIÓN</b>\n\n`;
    text += publication.content_preview + '\n\n';
  }

  // Pie de página
  text += `Origen: ${publication.origin}\n`;
  text += `Verificado por CARVIPIX`;

  return text;
}
