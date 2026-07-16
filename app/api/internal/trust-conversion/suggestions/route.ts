/**
 * GET /api/internal/trust-conversion/suggestions
 * Lista todas las sugerencias comerciales con filtros
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { loadSuggestions } from '@/app/lib/trust-conversion/persistence';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as string | null;
    const product = searchParams.get('product') as string | null;

    const suggestions = await loadSuggestions();

    let filtered = [...suggestions];
    if (status) filtered = filtered.filter(s => s.status === status);
    if (product) filtered = filtered.filter(s => s.product === product);

    // Ordenar por fecha descendente
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      ok: true,
      total: filtered.length,
      suggestions: filtered,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error listando sugerencias:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
