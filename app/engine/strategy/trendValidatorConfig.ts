/**
 * Configuración de TrendValidator v1.1
 * Parámetros configurables y sus valores por defecto
 */

export const TREND_VALIDATOR_CONFIG = {
  // Penalización por contradicción en cálculo de confianza
  // Cómo se interpreta:
  //   0.0 = sin penalización (solo cuenta confirming, ignora contradicting)
  //   0.5 = penalización media (default test)
  //   1.0 = penalización máxima (contradicting cuenta completo)
  // 
  // Formula: effectiveConditions = confirming - (contradicting * penaltyFactor)
  // 
  // PROVISIONAL: Valor recomendado tras testing = 0.5
  // Decisión final pendiente tras validación en Pullback stage
  
  contradictionPenalty: 0.5,
  
  // Metadata
  version: '1.1',
  status: 'PROVISIONAL - testing different penalty values',
  lastUpdated: '2026-07-02',
};

/**
 * Get configuration value or use override for testing
 */
export function getTrendValidatorConfig(override?: Partial<typeof TREND_VALIDATOR_CONFIG>) {
  return {
    ...TREND_VALIDATOR_CONFIG,
    ...override,
  };
}

/**
 * Supported penalty values for testing
 */
export const PENALTY_TEST_VALUES = [0.25, 0.5, 0.75] as const;
