/**
 * GET /api/internal/shadow-production/health
 * Comprueba salud de todos los módulos
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { getModulesStatus, checkModuleHealth } from '@/app/lib/shadow-production/healthChecker';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const moduleFilter = searchParams.get('module') as string | null;

    if (moduleFilter) {
      const health = await checkModuleHealth(moduleFilter);
      return NextResponse.json({
        ok: health !== null,
        health: health || { module_name: moduleFilter, status: 'NOT_FOUND' },
        timestamp: new Date().toISOString(),
      });
    }

    const status = await getModulesStatus();

    return NextResponse.json({
      ok: true,
      status: status.status,
      ready_count: status.ready_count,
      total_count: status.total_count,
      modules: status.checks.map(c => ({
        name: c.module_name,
        status: c.status,
        is_ready: c.is_ready,
        last_activity: c.last_activity,
        error_count_24h: c.error_count_24h,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SHADOW] Error en health check:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
