/**
 * GET /api/internal/community-publisher/publications
 * Devuelve todas las publicaciones (historial completo).
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { readPublications } from '@/app/lib/community-publisher/persistence';
import { listQueue } from '@/app/lib/community-publisher/queueService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [history, queue] = await Promise.all([readPublications(), listQueue()]);

  // Unir historial + cola activa (sin duplicar DELIVERED)
  const deliveredIds = new Set(history.map(p => p.publication_id));
  const activeNotDelivered = queue.filter(p => !deliveredIds.has(p.publication_id));
  const all = [...history, ...activeNotDelivered];

  // Ordenar por created_at DESC
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    ok: true,
    total: all.length,
    publications: all,
    fetched_at: new Date().toISOString(),
  });
}
