/**
 * POST /api/internal/community-publisher/templates/[templateId]/approve
 * Aprobar plantilla (DRAFT → APPROVED)
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { approveTemplate, getTemplate } from '@/app/lib/community-publisher/templatePersistence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { templateId } = await params;
  const body = (await request.json()) as { approved_by?: string };

  const existing = await getTemplate(templateId);
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (existing.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Can only approve DRAFT templates' },
      { status: 400 }
    );
  }

  const updated = await approveTemplate(templateId, body.approved_by || 'system');
  return NextResponse.json({
    ok: true,
    template: updated,
    message: 'Template approved successfully',
  });
}
