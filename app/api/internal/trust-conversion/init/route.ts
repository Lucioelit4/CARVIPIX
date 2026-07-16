/**
 * POST /api/internal/trust-conversion/init
 * Inicializa o reinicia el Trust & Conversion Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { initializeTrustConversionEngine, getEngineStatus } from '@/app/lib/trust-conversion/initialization';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await initializeTrustConversionEngine();
    const status = await getEngineStatus();

    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      config: result.config,
      engine_status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error inicializando:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const status = await getEngineStatus();
    return NextResponse.json({
      ok: true,
      engine_status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error obteniendo status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
