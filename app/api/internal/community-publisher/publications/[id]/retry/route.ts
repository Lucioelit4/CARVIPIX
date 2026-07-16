/**
 * POST /api/internal/community-publisher/publications/[id]/retry
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { retryPublication } from '@/app/lib/community-publisher/queueService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const pub = await retryPublication(id);
  if (!pub) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  return NextResponse.json({ ok: true, publication: pub });
}
