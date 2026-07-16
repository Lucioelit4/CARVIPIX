/**
 * POST /api/internal/community-publisher/process
 * Procesa la cola: convierte publications READY en mensajes Telegram y los entrega
 * Esta es la automatización del sistema.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { listQueue } from '@/app/lib/community-publisher/queueService';
import { processPublicationForDelivery } from '@/app/lib/community-publisher/telegramDelivery';

const TEST_CHANNEL = process.env.TELEGRAM_CHANNEL_TEST ?? '';
const OFFICIAL_CHANNEL = process.env.TELEGRAM_CHANNEL_OFFICIAL ?? '';
const MAX_BATCH_SIZE = 10; // Procesar máximo 10 por invocación

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Validar origen
  if (!isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 },
    );
  }

  try {
    // 1. Obtener publicaciones READY ordenadas por prioridad
    const queue = await listQueue({ status: 'READY' });
    const batch = queue.slice(0, MAX_BATCH_SIZE);

    if (batch.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: 'No hay publicaciones listas',
      });
    }

    // 2. Procesar cada una
    let processed = 0;
    let succeeded = 0;
    const results = [];

    for (const publication of batch) {
      processed++;

      try {
        // Procesar entrega a Telegram
        // Usa content_preview como fallback si no hay template renderizado
        const success = await processPublicationForDelivery(
          publication,
          TEST_CHANNEL,
          OFFICIAL_CHANNEL,
        );

        if (success) {
          succeeded++;
          results.push({
            publication_id: publication.publication_id,
            status: 'DELIVERED',
          });
        } else {
          results.push({
            publication_id: publication.publication_id,
            status: 'FAILED',
          });
        }
      } catch (error) {
        console.error(`[CP PROCESS] Error procesando ${publication.publication_id}:`, error);
        results.push({
          publication_id: publication.publication_id,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      succeeded,
      results,
      message: `Procesadas ${succeeded}/${processed} publicaciones`,
    });
  } catch (error) {
    console.error('[CP PROCESS] Error general:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
