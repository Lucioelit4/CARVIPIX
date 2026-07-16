/**
 * POST /api/internal/trust-conversion/detect
 * Ejecuta el ciclo de detección de momentos comerciales
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { runDetectionCycle } from '@/app/lib/trust-conversion/momentDetector';
import { processDetectedMoments } from '@/app/lib/trust-conversion/conversionEngine';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Ejecutar detección de momentos
    await runDetectionCycle();

    // 2. Procesar momentos detectados (generar sugerencias)
    await processDetectedMoments();

    return NextResponse.json({
      ok: true,
      message: 'Ciclo de detección ejecutado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error en detección:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
