/**
 * POST /api/internal/community-publisher/publications/[id]/cancel
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { cancelPublication } from '@/app/lib/community-publisher/queueService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const pub = await cancelPublication(id);
  if (!pub) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  return NextResponse.json({ ok: true, publication: pub });
}
