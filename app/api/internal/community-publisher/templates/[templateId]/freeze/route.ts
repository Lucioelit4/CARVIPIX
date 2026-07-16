/**
 * POST /api/internal/community-publisher/templates/[templateId]/freeze
 * Congelar plantilla (APPROVED → FROZEN)
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { freezeTemplate, getTemplate } from '@/app/lib/community-publisher/templatePersistence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId } = await params;

  const existing = await getTemplate(templateId);
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (existing.status !== 'APPROVED') {
    return NextResponse.json(
      { error: 'Can only freeze APPROVED templates' },
      { status: 400 }
    );
  }

  const updated = await freezeTemplate(templateId);
  return NextResponse.json({
    ok: true,
    template: updated,
    message: 'Template frozen successfully',
  });
}
