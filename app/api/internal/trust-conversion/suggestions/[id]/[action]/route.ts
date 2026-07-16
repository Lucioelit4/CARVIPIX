/**
 * POST /api/internal/trust-conversion/suggestions/[id]/approve
 * POST /api/internal/trust-conversion/suggestions/[id]/cancel
 * POST /api/internal/trust-conversion/suggestions/[id]/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import {
  approveSuggestion,
  cancelSuggestion,
  publishApprovedSuggestion,
} from '@/app/lib/trust-conversion/conversionEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, action } = await params;

    if (action === 'approve') {
      const result = await approveSuggestion(id);
      if (!result) {
        return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, suggestion: result });
    }

    if (action === 'cancel') {
      const result = await cancelSuggestion(id);
      if (!result) {
        return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, suggestion: result });
    }

    if (action === 'publish') {
      const result = await publishApprovedSuggestion(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Error en acción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
