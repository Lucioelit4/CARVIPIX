/**
 * GET/POST /api/internal/shadow-production/init
 * Inicializa y activa Shadow Production
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import {
  initializeShadowProductionStorage,
  initializeShadowProduction,
  getConfig,
} from '@/app/lib/shadow-production/persistence';
import { getModulesStatus } from '@/app/lib/shadow-production/healthChecker';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const config = await getConfig();
    const moduleStatus = await getModulesStatus();

    return NextResponse.json({
      ok: true,
      config,
      module_status: moduleStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SHADOW] Error obteniendo config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await initializeShadowProductionStorage();
    const config = await initializeShadowProduction();
    const moduleStatus = await getModulesStatus();

    return NextResponse.json({
      ok: true,
      message: 'Shadow Production inicializado',
      config,
      module_status: moduleStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SHADOW] Error inicializando:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
