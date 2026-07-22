/**
 * POST /api/internal/community-publisher/templates/[templateId]/send-test
 * Enviar test de plantilla a Carvipix test group
 *
 * Respeta TEST_ONLY=true — solo envía a grupo de prueba
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { getTemplate } from '@/app/lib/community-publisher/templatePersistence';
import { renderTemplate } from '@/app/lib/community-publisher/templateEngine';
import { appendTemplateTestLog } from '@/app/lib/community-publisher/templatePersistence';
import type { OriginType, Publication } from '@/app/lib/community-publisher/types';
import { COMMUNITY_AUTOMATION_DISABLED_REASON, isCommunityAutomationEnabled } from '@/app/lib/community-intelligence/automation';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_TEST = process.env.TELEGRAM_CHANNEL_TEST || '-5370238696';
const TEST_ONLY = process.env.TEST_ONLY === 'true';

async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<{ ok: boolean; message_id?: number; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { ok: false, error };
    }

    const data = await response.json() as { result?: { message_id?: number } };
    return {
      ok: true,
      message_id: data.result?.message_id,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!isCommunityAutomationEnabled()) {
    return NextResponse.json({ status: 'BLOCKED', reason: COMMUNITY_AUTOMATION_DISABLED_REASON, no_message_sent: true });
  }

  // TEST_ONLY check
  if (!TEST_ONLY) {
    return NextResponse.json(
      { error: 'Template testing only allowed in TEST_ONLY=true mode' },
      { status: 403 }
    );
  }

  const { templateId } = await params;
  const body = (await request.json()) as {
    variant_id?: string;
    publication_id?: string;
    test_data?: Record<string, unknown>;
  };

  const template = await getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.status === 'DRAFT') {
    return NextResponse.json(
      { error: 'Cannot send DRAFT template (must be APPROVED or FROZEN)' },
      { status: 400 }
    );
  }

  // Crear Publication de test
  const td = (body.test_data ?? {}) as {
    instrument?: string;
    origin?: OriginType;
    entry?: string;
    stop_loss?: string;
    take_profit?: string;
    risk_reward?: string;
    decision?: string;
    confidence_level?: string;
    trade_result?: {
      result?: string;
      pnl_pips?: number;
      pnl_percent?: number;
    };
  };
  const tradeResult = td.trade_result ?? {};
  
  const mockPublication: Publication = {
    publication_id: `TEST-${templateId}-${Date.now()}`,
    publication_type: template.type,
    analysis_id: body.publication_id || 'test-analysis',
    signal_id: 'test-signal',
    channel_id: TELEGRAM_CHANNEL_TEST,
    priority: 1,
    status: 'READY',
    created_at: new Date().toISOString(),
    content_preview: '[Test Preview]',
    attempts: 0,
    max_attempts: 3,
    instrument: td.instrument || 'XAUUSD',
    origin: td.origin ?? 'PAPER',
    test_only: true,
    idempotency_key: `test-${templateId}-${Date.now()}`,
    metadata: {
      analysis_public: {
        instrument: td.instrument || 'XAUUSD',
        entry: td.entry || '2320.00',
        stop_loss: td.stop_loss || '2310.00',
        take_profit: td.take_profit || '2340.00',
        risk_reward: td.risk_reward || '2.0',
      },
      decision: td.decision || 'BUY',
      confidence_level: td.confidence_level || 'HIGH',
      trade_result: tradeResult.result || tradeResult.pnl_pips || tradeResult.pnl_percent
        ? {
            result: tradeResult.result || 'WIN',
            pnl_pips: tradeResult.pnl_pips || 50,
            pnl_percent: tradeResult.pnl_percent || 2.5,
          }
        : undefined,
    },
  };

  // Renderizar
  const render = await renderTemplate(templateId, { publication: mockPublication }, body.variant_id);

  if (!render.safe) {
    return NextResponse.json(
      {
        ok: false,
        error: render.reason,
        variant_used: render.variant_id,
      },
      { status: 400 }
    );
  }

  // Enviar a Telegram
  const teleResult = await sendTelegramMessage(TELEGRAM_CHANNEL_TEST, render.text);

  // Registrar
  const logEntry = {
    template_id: templateId,
    variant_used: render.variant_id,
    ok: teleResult.ok,
    message_id: teleResult.message_id,
    message_preview: render.text.substring(0, 100),
    error: teleResult.error,
    processed_at: new Date().toISOString(),
  };

  await appendTemplateTestLog(logEntry);

  if (!teleResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: teleResult.error,
        variant_used: render.variant_id,
        message_preview: render.text,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message_id: teleResult.message_id,
    variant_used: render.variant_id,
    message_preview: render.text,
    sent_to_chat: TELEGRAM_CHANNEL_TEST,
    test_only: true,
    timestamp: new Date().toISOString(),
  });
}
