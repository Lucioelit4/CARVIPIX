/**
 * Community Publisher V1 - Initialization Endpoint
 * 
 * GET /api/internal/community-publisher/init
 * Inicializar el sistema de Community Publisher
 */

import { NextRequest, NextResponse } from 'next/server';
import CommunityPublisherInitService from '@/app/lib/services/cpInitService';

/**
 * Variable global para ejecutar inicialización solo una vez
 * (Next.js puede recrear módulos, por eso necesitamos control adicional)
 */
let initializationExecuted = false;

export async function GET(request: NextRequest) {
  try {
    // Verificar que es una request interna usando token interno
    const internalToken = request.headers.get('x-internal-token');
    const expectedToken = process.env.INTERNAL_OBSERVER_TOKEN;

    if (!expectedToken || internalToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Si ya se inicializó, simplemente retornar el estado actual
    if (!initializationExecuted) {
      initializationExecuted = true;

      const initService = CommunityPublisherInitService.getInstance();
      const result = await initService.initialize();

      console.log('[INIT ENDPOINT] Resultado de inicialización:', {
        success: result.success,
        error: result.error || null
      });

      return NextResponse.json({
        success: true,
        message: 'Community Publisher inicializado',
        result: {
          success: result.success,
          error: result.error || null
        }
      }, { status: 200 });
    }

    // Si ya se ejecutó, retornar estado actual
    const initService = CommunityPublisherInitService.getInstance();
    const isInitialized = initService.getIsInitialized();
    const initError = initService.getInitError();

    return NextResponse.json({
      success: true,
      message: 'Community Publisher ya está inicializado',
      initialized: isInitialized,
      error: initError || null
    }, { status: 200 });
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[INIT ENDPOINT] Error durante inicialización:', errorMsg);

    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
