/**
 * POST /api/internal/community-publisher/events
 * Recibe eventos ANALYSIS_COMPLETED y TRADE_CLOSED.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { processEvent } from '@/app/lib/community-publisher/eventProcessor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const result = await processEvent(body);
  const statusCode = result.accepted ? 201 : 200;
  return NextResponse.json(result, { status: statusCode });
}
