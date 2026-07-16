/**
 * GET /api/internal/shadow-production/daily-report
 * Genera reporte diario de métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { generateDailyReport, aggregateDailyMetrics } from '@/app/lib/shadow-production/metricsAggregator';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') as string | null;

    const metrics = await aggregateDailyMetrics(date || undefined);
    const report = await generateDailyReport(date || undefined);

    return NextResponse.json({
      ok: true,
      date: metrics.date,
      metrics,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SHADOW] Error generando reporte:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
