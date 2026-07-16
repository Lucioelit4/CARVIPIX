/**
 * PUT /api/internal/community-publisher/templates/[templateId]/update
 * Actualizar plantilla (agregar variantes, cambiar descripción, etc.)
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { getTemplate, updateTemplate } from '@/app/lib/community-publisher/templatePersistence';
import type { Template } from '@/app/lib/community-publisher/template-types';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId } = await params;
  const body = (await request.json()) as Partial<Template>;

  const existing = await getTemplate(templateId);
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Validar que status sea permitido en actualización (solo para DRAFT)
  if (body.status && existing.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Cannot modify template that is not DRAFT' },
      { status: 400 }
    );
  }

  const updated = await updateTemplate(templateId, body);
  return NextResponse.json({
    ok: true,
    template: updated,
    message: 'Template updated successfully',
  });
}
