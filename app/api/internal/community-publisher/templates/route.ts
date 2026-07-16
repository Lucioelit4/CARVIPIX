/**
 * GET /api/internal/community-publisher/templates
 * Obtener todas las plantillas
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { loadTemplates } from '@/app/lib/community-publisher/templatePersistence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const templates = await loadTemplates();
  return NextResponse.json({
    ok: true,
    templates: Object.values(templates),
    count: Object.keys(templates).length,
    fetched_at: new Date().toISOString(),
  });
}
