/**
 * POST /api/internal/community-publisher/templates/initialize
 * Inicializar biblioteca de plantillas (crear si no existen)
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { loadTemplates, saveTemplates } from '@/app/lib/community-publisher/templatePersistence';
import { createTemplateLibrary } from '@/app/lib/community-publisher/templateFactory';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await loadTemplates();

  // Si ya existen todas, no hacer nada
  const hasAll =
    existing['free_alert'] &&
    existing['market_status'] &&
    existing['opportunity_developing'] &&
    existing['trade_result'] &&
    existing['educational_or_promotional'];

  if (hasAll) {
    return NextResponse.json({
      ok: true,
      message: 'Templates already initialized',
      templates: Object.values(existing),
      action: 'none',
    });
  }

  // Crear nueva biblioteca
  const library = createTemplateLibrary();
  const merged = { ...existing, ...library };

  await saveTemplates(merged);

  return NextResponse.json({
    ok: true,
    message: 'Templates initialized successfully',
    templates: Object.values(merged),
    action: 'created',
    created_at: new Date().toISOString(),
  });
}
