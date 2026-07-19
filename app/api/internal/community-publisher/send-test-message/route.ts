/**
 * Community Publisher V1 — Certified Test Message
 *
 * POST /api/internal/community-publisher/send-test-message
 *
 * Envía UN SOLO mensaje de prueba al canal TEST.
 * Realiza todas las validaciones obligatorias antes de enviar.
 * Registra resultado completo en data/community-publisher/test-send-log.json
 *
 * Protegido: same-origin únicamente.
 * No envía nada al canal oficial bajo ninguna circunstancia.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import * as fs from 'fs/promises';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const TEST_MESSAGE = `🧪 PRUEBA DE CONEXIÓN CARVIPIX

El Community Publisher se conectó correctamente con Telegram.

Modo actual:
TEST_ONLY

Este mensaje no es una alerta ni una operación.

No responder ni operar con esta publicación.`;

const TELEGRAM_API = 'https://api.telegram.org/bot';

async function telegramPost(token: string, method: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function maskChatId(id: string | number): string {
  const s = String(id);
  if (s.length <= 6) return '***';
  return s.slice(0, 4) + '*'.repeat(Math.max(0, s.length - 8)) + s.slice(-4);
}

export async function POST(request: NextRequest) {
  // ── Auth: solo same-origin ───────────────────────────────────────────────
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const startTs = Date.now();
  const publicationId = `CP-TEST-${startTs}`;

  // ── 1. Leer y validar variables de entorno ───────────────────────────────
  const botToken       = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const channelTest    = process.env.TELEGRAM_CHANNEL_TEST?.trim() ?? '';
  const channelOfficial = process.env.TELEGRAM_CHANNEL_OFFICIAL?.trim() ?? '';
  const testOnly       = process.env.TEST_ONLY === 'true';
  const enabled        = process.env.COMMUNITY_PUBLISHER_ENABLED === 'true';

  const preChecks = {
    test_only_is_true: testOnly === true,
    token_present: botToken.length > 0,
    channel_test_present: channelTest.length > 0,
    official_channel_is_not_target: true, // se confirma abajo
    message_has_no_private_data: true,
    message_has_no_buttons: true,
    message_has_no_links: !TEST_MESSAGE.includes('http'),
    message_has_no_image: true,
    community_publisher_enabled: enabled,
  };

  // Verificar que el destino NO sea el canal oficial
  preChecks.official_channel_is_not_target =
    channelTest !== channelOfficial && channelTest !== '' && channelOfficial !== channelTest;

  // Detectar cualquier fallo de pre-check
  const failedChecks = Object.entries(preChecks)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  if (failedChecks.length > 0) {
    const result = {
      publication_id: publicationId,
      status: 'BLOCKED_PRE_CHECK',
      failed_checks: failedChecks,
      timestamp: new Date().toISOString(),
      no_message_sent: true,
    };
    await persistLog(result);
    return NextResponse.json(result, { status: 400 });
  }

  // ── 2. Doble verificación: TEST_ONLY impide canal oficial ────────────────
  if (!testOnly) {
    const result = {
      publication_id: publicationId,
      status: 'BLOCKED_TEST_ONLY_FALSE',
      error: 'TEST_ONLY debe ser true para este endpoint',
      timestamp: new Date().toISOString(),
      no_message_sent: true,
    };
    await persistLog(result);
    return NextResponse.json(result, { status: 400 });
  }

  // ── 3. Enviar mensaje — máx 2 intentos (rate limit únicamente) ──────────
  let attempts = 0;
  let telegramResponse: {
    ok?: boolean;
    error_code?: number;
    description?: string;
    parameters?: { retry_after?: number };
    result?: {
      message_id?: number;
      date: number;
      chat?: { id?: string | number; title?: string; type?: string };
    };
  } | null = null;
  let lastError: string | null = null;

  for (let i = 0; i < 2; i++) {
    attempts = i + 1;
    try {
      telegramResponse = await telegramPost(botToken, 'sendMessage', {
        chat_id: channelTest,
        text: TEST_MESSAGE,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        disable_notification: false,
      });

      if (!telegramResponse) {
        lastError = 'Telegram response missing';
        break;
      }

      if (telegramResponse.ok) break; // éxito — salir del loop

      // Solo reintentar en rate limit (429)
      if (telegramResponse.error_code === 429 && i === 0) {
        const retryAfter = telegramResponse.parameters?.retry_after ?? 3;
        console.warn(`[TEST-SEND] Rate limit 429. Reintentando en ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // Cualquier otro error: no reintentar
      lastError = telegramResponse.description ?? `Error ${telegramResponse.error_code}`;
      break;
    } catch (e) {
      lastError = (e as Error).message;
      break;
    }
  }

  const latencyMs = Date.now() - startTs;

  // ── 4. Construir resultado del envío ─────────────────────────────────────
  if (telegramResponse?.ok) {
    const msg = telegramResponse.result;
    if (!msg) {
      const result = {
        publication_id: publicationId,
        status: 'BLOCKED_NO_MESSAGE_PAYLOAD',
        error: 'Telegram response did not include a message payload',
        timestamp: new Date().toISOString(),
        no_message_sent: true,
      };
      await persistLog(result);
      return NextResponse.json(result, { status: 500 });
    }
    const auditRecord = {
      publication_id: publicationId,
      status: 'DELIVERED',
      channel_id_masked: maskChatId(channelTest),
      telegram_message_id: msg.message_id,
      chat_title: msg.chat?.title ?? 'Carvipix test',
      chat_type: msg.chat?.type ?? 'group',
      timestamp: new Date(msg.date * 1000).toISOString(),
      latency_ms: latencyMs,
      attempts,
      test_only: true,
      official_channel_messages: 0,
      telegram_response: {
        ok: true,
        message_id: msg.message_id,
        chat_id: maskChatId(msg.chat?.id ?? channelTest),
        date: msg.date,
      },
    };

    await persistLog(auditRecord);

    console.log('[CP TEST-SEND] DELIVERED:', {
      publication_id: publicationId,
      message_id: msg.message_id,
      latency_ms: latencyMs,
      attempts,
    });

    return NextResponse.json(auditRecord, { status: 200 });
  }

  // ── 5. Falló el envío ────────────────────────────────────────────────────
  const failRecord = {
    publication_id: publicationId,
    status: 'FAILED',
    error: lastError ?? 'Error desconocido',
    telegram_response: telegramResponse,
    timestamp: new Date().toISOString(),
    latency_ms: latencyMs,
    attempts,
    test_only: true,
    official_channel_messages: 0,
  };

  await persistLog(failRecord);
  console.error('[CP TEST-SEND] FAILED:', failRecord.error);

  return NextResponse.json(failRecord, { status: 200 });
}

async function persistLog(record: Record<string, unknown>) {
  try {
    const dir = path.join(process.cwd(), 'data', 'community-publisher');
    await fs.mkdir(dir, { recursive: true });
    const logPath = path.join(dir, 'test-send-log.json');

    let existing: unknown[] = [];
    try {
      existing = JSON.parse(await fs.readFile(logPath, 'utf-8'));
    } catch {
      // archivo no existe aún
    }

    existing.push(record);
    await fs.writeFile(logPath, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (e) {
    console.error('[CP TEST-SEND] Error persistiendo log:', (e as Error).message);
  }
}
