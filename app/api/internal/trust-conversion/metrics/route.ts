/**
 * GET /api/internal/trust-conversion/metrics
 * Retorna métricas de conversión en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { calculateMetrics, generateConversionReport } from '@/app/lib/trust-conversion/trackingService';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [metrics, report] = await Promise.all([calculateMetrics(), generateConversionReport()]);

    return NextResponse.json({
      ok: true,
      metrics,
      report,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error calculando métricas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
