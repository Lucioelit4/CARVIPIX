/**
 * Trust & Conversion Engine — Initialization Utility
 * Inicializa y prepara el sistema de momentos comerciales
 */

import { initializeDataDir, loadConfig, saveConfig } from './persistence';
import type { TrustConversionConfig } from './types';

const DEFAULT_CONFIG: TrustConversionConfig = {
  enabled: true,
  test_only: true,
  
  max_promotions_per_week: 2,
  max_consecutive_promotions: 1,
  min_hours_between_promotions: 48,
  max_promotional_ratio: 0.2, // 20%

  detect_winning_streaks: true,
  winning_streak_threshold: 100,
  
  detect_notable_results: true,
  notable_result_threshold: 50,
  
  detect_high_activity: true,
  high_activity_threshold: 5,
  
  detect_engagement_peaks: true,

  timezone: process.env.CARVIPIX_TIMEZONE || 'America/Mexico_City',
  active_hours_start: 8,
  active_hours_end: 22,

  default_products: ['PREMIUM_ALERTS', 'BOT'],

  require_approval: true,

  paused: false,
};

/**
 * Inicializar el Trust & Conversion Engine
 */
export async function initializeTrustConversionEngine(): Promise<{
  ok: boolean;
  message: string;
  config: TrustConversionConfig;
}> {
  try {
    // 1. Crear directorio de datos
    await initializeDataDir();

    // 2. Cargar o crear config
    let config = await loadConfig();
    if (!config || Object.keys(config).length === 0) {
      config = DEFAULT_CONFIG;
      await saveConfig(config);
      console.log('[TCE INIT] ✓ Configuración creada');
    } else {
      console.log('[TCE INIT] ✓ Configuración existente cargada');
    }

    return {
      ok: true,
      message: 'Trust & Conversion Engine inicializado',
      config,
    };
  } catch (error) {
    console.error('[TCE INIT] Error:', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      config: DEFAULT_CONFIG,
    };
  }
}

/**
 * Obtener resumen del estado del sistema
 */
export async function getEngineStatus(): Promise<{
  is_initialized: boolean;
  config: TrustConversionConfig;
  status: string;
}> {
  try {
    const config = await loadConfig();
    const isReady =
      config && config.enabled && config.require_approval;

    return {
      is_initialized: true,
      config,
      status: isReady ? 'READY' : 'DEGRADED',
    };
  } catch (error) {
    return {
      is_initialized: false,
      config: DEFAULT_CONFIG,
      status: 'ERROR',
    };
  }
}

/**
 * Reset completo del sistema (DANGER - uso solo en testing)
 */
export async function resetTrustConversionEngine(): Promise<void> {
  try {
    // Reinicializar con config default
    await saveConfig(DEFAULT_CONFIG);
    console.log('[TCE INIT] ✓ Reset completado');
  } catch (error) {
    console.error('[TCE INIT] Error en reset:', error);
    throw error;
  }
}
