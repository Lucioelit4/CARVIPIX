/**
 * GET /api/internal/community-publisher/queue
 * Devuelve la cola con stats y lista de publicaciones.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { listQueue, getQueueStats } from '@/app/lib/community-publisher/queueService';
import { readProcessorLog } from '@/app/lib/community-publisher/persistence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [queue, stats, processorLog] = await Promise.all([
    listQueue(),
    getQueueStats(),
    readProcessorLog(),
  ]);

  // Última entrada del disparador
  const lastEvent = processorLog.length > 0
    ? processorLog[processorLog.length - 1]
    : null;

  return NextResponse.json({
    ok: true,
    stats,
    queue,
    last_event: lastEvent,
    fetched_at: new Date().toISOString(),
  });
}
