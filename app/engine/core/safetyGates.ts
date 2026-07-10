/**
 * SAFETY GATES - Pre-Trade Validation Layer
 * 
 * 5 gates que vetoan trades si condiciones son peligrosas
 * Evita operaciones en mercados inapropiados
 */

import { TradeSignal } from '../types/index';

export interface GateCheckResult {
  passed: boolean;
  gate: string;
  reason: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation?: string;
}

export interface AuditableSafetyGateResult {
  name: string;
  state: 'PASS' | 'BLOCK' | 'WARN';
  reason: string;
  severity: 'info' | 'warning' | 'critical';
  blocking: boolean;
  observedValue: string;
  limit: string;
}

/**
 * GATE 1: LIQUIDEZ
 * Verifica que haya liquidez suficiente en el mercado actual
 * 
 * MODO PROVISIONAL: Si datos faltantes (spread=-1, volume=0), retorna PASS_WITH_WARNING
 * No bloquea señales solo porque faltan datos
 */
export function checkLiquidityGate(params: {
  symbol: string;
  currentSpread: number; // pips (-1 = dato no disponible)
  medianSpread: number; // promedio histórico
  volume: number; // volumen actual (-1 = dato no disponible)
  medianVolume: number; // volumen promedio
}): GateCheckResult {
  // MODO PROVISIONAL: Si datos no disponibles, pass con warning
  if (params.currentSpread < 0 || params.medianSpread <= 0) {
    return {
      passed: true,
      gate: 'LIQUIDITY',
      reason: `Datos de spread NO DISPONIBLES aún (connect real broker data)`,
      severity: 'warning',
      recommendation: 'Datos en modo placeholder - verificar cuando datos reales conectados'
    };
  }

  if (params.volume < 0 || params.medianVolume <= 0) {
    return {
      passed: true,
      gate: 'LIQUIDITY',
      reason: `Datos de volumen NO DISPONIBLES aún`,
      severity: 'warning',
      recommendation: 'Datos en modo placeholder - verificar cuando datos reales conectados'
    };
  }

  // MODO REAL: Verificación con datos verdaderos
  const spreadRatio = params.currentSpread / params.medianSpread;
  const volumeRatio = params.volume / params.medianVolume;

  if (spreadRatio > 5) {
    return {
      passed: false,
      gate: 'LIQUIDITY',
      reason: `Spread demasiado amplio: ${params.currentSpread.toFixed(1)} pips vs ${params.medianSpread.toFixed(1)} promedio (${(spreadRatio * 100).toFixed(0)}% higher)`,
      severity: 'critical',
      recommendation: 'Esperar a que liquidity mejore o cambiar de símbolo'
    };
  }

  if (spreadRatio > 2 || volumeRatio < 0.3) {
    return {
      passed: true,
      gate: 'LIQUIDITY',
      reason: `Liquidity moderada: spread ${(spreadRatio * 100).toFixed(0)}% vs promedio, volumen ${(volumeRatio * 100).toFixed(0)}% vs promedio`,
      severity: 'warning',
      recommendation: 'Reducir tamaño de posición en 30%'
    };
  }

  return {
    passed: true,
    gate: 'LIQUIDITY',
    reason: `Liquidity excelente: spread ${params.currentSpread.toFixed(1)} pips, volumen normal`,
    severity: 'info'
  };
}

/**
 * GATE 2: VOLATILIDAD
 * Si volatilidad es extrema, riesgo de slippage y gaps
 * 
 * MODO PROVISIONAL: Si ATR no disponible (≤0), retorna PASS_WITH_WARNING
 */
export function checkVolatilityGate(params: {
  symbol: string;
  atr: number; // Average True Range actual (-1 = no disponible)
  atrPercentile: number; // 0-100 (-1 = no disponible)
  isNewsEventSoon: boolean; // ¿hay noticia importante en próximas 2 horas?
}): GateCheckResult {
  // MODO PROVISIONAL: Si datos no disponibles
  if (params.atr <= 0 || params.atrPercentile < 0) {
    return {
      passed: true,
      gate: 'VOLATILITY',
      reason: `Datos de volatilidad (ATR) NO DISPONIBLES aún`,
      severity: 'warning',
      recommendation: 'Datos en modo placeholder - verificar con datos reales de broker'
    };
  }

  // MODO REAL: Verificación con datos verdaderos
  // Si está en percentil > 90 = volatilidad extrema
  if (params.atrPercentile > 90) {
    return {
      passed: false,
      gate: 'VOLATILITY',
      reason: `Volatilidad extrema (percentil ${params.atrPercentile}). ATR ${params.atr.toFixed(4)}`,
      severity: 'critical',
      recommendation: 'Esperar a normalización de volatilidad (5-30 minutos)'
    };
  }

  // Si > 80 percentil = volatilidad alta
  if (params.atrPercentile > 80 || params.isNewsEventSoon) {
    return {
      passed: true,
      gate: 'VOLATILITY',
      reason: `Volatilidad elevada (percentil ${params.atrPercentile})${params.isNewsEventSoon ? ' + evento próximo' : ''}`,
      severity: 'warning',
      recommendation: 'Reducir tamaño de posición en 40%'
    };
  }

  return {
    passed: true,
    gate: 'VOLATILITY',
    reason: `Volatilidad normal (percentil ${params.atrPercentile})`,
    severity: 'info'
  };
}

/**
 * GATE 3: EVENTOS/NOTICIAS
 * Si evento importante < 3 horas = NO OPERAR
 * 
 * MODO PROVISIONAL: Sin calendar API, retorna PASS_WITH_WARNING
 */
export function checkNewsGate(params: {
  symbol: string;
  minutesUntilNextEvent: number; // (-1 = dato no disponible)
  eventSeverity: 'minor' | 'medium' | 'high' | 'critical' | 'none';
}): GateCheckResult {
  // MODO PROVISIONAL: Si datos no disponibles (no hay calendar API conectada)
  if (params.minutesUntilNextEvent < 0) {
    return {
      passed: true,
      gate: 'NEWS',
      reason: `Datos de noticias/eventos NO DISPONIBLES aún (economic calendar API not connected)`,
      severity: 'warning',
      recommendation: 'Integrar calendar API cuando esté disponible'
    };
  }

  // MODO REAL: Verificación con datos verdaderos
  if (params.eventSeverity === 'critical' || params.eventSeverity === 'high') {
    if (params.minutesUntilNextEvent < 180) { // 3 horas
      return {
        passed: false,
        gate: 'NEWS',
        reason: `Evento ${params.eventSeverity} en ${params.minutesUntilNextEvent} minutos. Riesgo de gap/slippage.`,
        severity: 'critical',
        recommendation: 'Esperar a después del evento (30+ minutos para volatilidad normalizarse)'
      };
    }

    if (params.minutesUntilNextEvent < 240) { // 4 horas
      return {
        passed: true,
        gate: 'NEWS',
        reason: `Evento ${params.eventSeverity} en ${params.minutesUntilNextEvent} minutos`,
        severity: 'warning',
        recommendation: 'Reducir posición en 50%. Considerar skip.'
      };
    }
  }

  return {
    passed: true,
    gate: 'NEWS',
    reason: `Sin eventos significativos en próximas 4 horas`,
    severity: 'info'
  };
}

/**
 * GATE 4: SALUD DE CUENTA
 * Si drawdown es muy profundo = NO OPERAR
 * 
 * MODO PROVISIONAL: Sin datos de cuenta en tiempo real, retorna PASS_WITH_WARNING
 */
export function checkAccountHealthGate(params: {
  currentBalance: number; // (-1 = dato no disponible)
  peakBalance: number;
  maxAllowedDrawdown: number; // porcentaje (ej: 20%)
  activePositions: number;
  maxConcurrentPositions: number;
}): GateCheckResult {
  // MODO PROVISIONAL: Si datos no disponibles
  if (params.currentBalance < 0 || params.peakBalance <= 0) {
    return {
      passed: true,
      gate: 'ACCOUNT_HEALTH',
      reason: `Datos de cuenta NO DISPONIBLES aún (real broker account not connected)`,
      severity: 'warning',
      recommendation: 'Conectar datos de broker cuando trading en cuenta real'
    };
  }

  // MODO REAL: Verificación con datos verdaderos
  const currentDrawdown = ((params.peakBalance - params.currentBalance) / params.peakBalance) * 100;
  const drawdownUsed = (currentDrawdown / params.maxAllowedDrawdown) * 100;

  if (currentDrawdown > params.maxAllowedDrawdown) {
    return {
      passed: false,
      gate: 'ACCOUNT_HEALTH',
      reason: `Drawdown ${currentDrawdown.toFixed(1)}% exceeds máx permitido ${params.maxAllowedDrawdown}%`,
      severity: 'critical',
      recommendation: 'Cerrar todas las posiciones y esperar recuperación a 50% del drawdown'
    };
  }

  if (drawdownUsed > 80) {
    return {
      passed: true,
      gate: 'ACCOUNT_HEALTH',
      reason: `Drawdown ${currentDrawdown.toFixed(1)}% está al ${drawdownUsed.toFixed(0)}% del límite`,
      severity: 'warning',
      recommendation: 'Reducir tamaño en 50%. Ser muy selectivo.'
    };
  }

  if (params.activePositions >= params.maxConcurrentPositions) {
    return {
      passed: false,
      gate: 'ACCOUNT_HEALTH',
      reason: `Max posiciones abiertas (${params.activePositions}/${params.maxConcurrentPositions})`,
      severity: 'warning',
      recommendation: 'Cerrar una posición antes de entrar a la nueva'
    };
  }

  return {
    passed: true,
    gate: 'ACCOUNT_HEALTH',
    reason: `Salud de cuenta OK. Drawdown ${currentDrawdown.toFixed(1)}% / ${params.maxAllowedDrawdown}%`,
    severity: 'info'
  };
}

/**
 * GATE 5: CORRELACIÓN
 * Si posición correlaciona mucho con abierta = riesgo concentrado
 * 
 * MODO PROVISIONAL: Sin matriz de correlación real, retorna PASS_WITH_WARNING
 */
export function checkCorrelationGate(params: {
  newSymbol: string;
  newDirection: 'long' | 'short';
  openPositions: Array<{ symbol: string; direction: 'long' | 'short'; size: number }>;
  correlationMatrix: Record<string, Record<string, number>> | null; // null = datos no disponibles
}): GateCheckResult {
  // MODO PROVISIONAL: Sin matriz de correlación conectada
  if (!params.correlationMatrix || Object.keys(params.correlationMatrix).length === 0) {
    return {
      passed: true,
      gate: 'CORRELATION',
      reason: `Datos de correlación NO DISPONIBLES aún (correlation matrix not calculated)`,
      severity: 'warning',
      recommendation: 'Calcular correlation matrix cuando datos históricos suficientes'
    };
  }

  // MODO REAL: Verificación con datos verdaderos
  const correlationThreshold = 0.75; // Si correlación > 0.75 = muy correlacionado
  const conflicts: string[] = [];

  for (const openPos of params.openPositions) {
    const correlation = params.correlationMatrix[params.newSymbol]?.[openPos.symbol] ?? 0;

    // Misma dirección + correlación alta = riesgo concentrado
    if (params.newDirection === openPos.direction && correlation > correlationThreshold) {
      conflicts.push(`${params.newSymbol} (${params.newDirection}) correlaciona ${correlation.toFixed(2)} con ${openPos.symbol} (${openPos.direction})`);
    }

    // Dirección opuesta + correlación alta = hedge doble (desperdicio)
    if (params.newDirection !== openPos.direction && correlation > correlationThreshold) {
      conflicts.push(`${params.newSymbol} (${params.newDirection}) vs ${openPos.symbol} (${openPos.direction}) - hedge innecesario?`);
    }
  }

  if (conflicts.length > 0) {
    return {
      passed: false,
      gate: 'CORRELATION',
      reason: `Riesgo de correlación: ${conflicts.join(' + ')}`,
      severity: 'warning',
      recommendation: 'Ajustar posición o esperar a cerrar conflictiva'
    };
  }

  return {
    passed: true,
    gate: 'CORRELATION',
    reason: `Sin conflictos de correlación detectados`,
    severity: 'info'
  };
}

/**
 * RUN ALL GATES
 * Función helper para correr todos los gates
 * 
 * MODO PROVISIONAL: Todos los gates en modo PASS_WITH_WARNING cuando faltan datos
 * Ningún gate VETO automático solo porque falta un dato
 */
export function runAllSafetyGates(
  signal: TradeSignal,
  marketData: {
    currentSpread: number; // (-1 = no disponible)
    medianSpread: number;
    volume: number; // (-1 = no disponible)
    medianVolume: number;
    atr: number; // (-1 = no disponible)
    atrPercentile: number; // (-1 = no disponible)
    isNewsEventSoon: boolean;
    minutesUntilNextEvent: number; // (-1 = no disponible)
    eventSeverity: 'minor' | 'medium' | 'high' | 'critical' | 'none';
  },
  accountData: {
    currentBalance: number; // (-1 = no disponible)
    peakBalance: number;
    maxAllowedDrawdown: number;
    activePositions: number;
    maxConcurrentPositions: number;
  },
  openPositions: Array<{ symbol: string; direction: 'long' | 'short'; size: number }>,
  correlationMatrix: Record<string, Record<string, number>> | null
): {
  allPassed: boolean;
  gates: GateCheckResult[];
  criticalFailures: GateCheckResult[];
  warnings: GateCheckResult[];
  recommendation: string;
  modeProvisional: boolean;
} {
  const gates: GateCheckResult[] = [];

  // Run all gates
  gates.push(checkLiquidityGate({
    symbol: signal.symbol,
    currentSpread: marketData.currentSpread,
    medianSpread: marketData.medianSpread,
    volume: marketData.volume,
    medianVolume: marketData.medianVolume,
  }));

  gates.push(checkVolatilityGate({
    symbol: signal.symbol,
    atr: marketData.atr,
    atrPercentile: marketData.atrPercentile,
    isNewsEventSoon: marketData.isNewsEventSoon,
  }));

  gates.push(checkNewsGate({
    symbol: signal.symbol,
    minutesUntilNextEvent: marketData.minutesUntilNextEvent,
    eventSeverity: marketData.eventSeverity,
  }));

  gates.push(checkAccountHealthGate({
    currentBalance: accountData.currentBalance,
    peakBalance: accountData.peakBalance,
    maxAllowedDrawdown: accountData.maxAllowedDrawdown,
    activePositions: accountData.activePositions,
    maxConcurrentPositions: accountData.maxConcurrentPositions,
  }));

  gates.push(checkCorrelationGate({
    newSymbol: signal.symbol,
    newDirection: signal.type === 'compra' ? 'long' : 'short',
    openPositions,
    correlationMatrix,
  }));

  // Analyze results
  const criticalFailures = gates.filter(g => g.severity === 'critical' && !g.passed && 
    // NO contar como fallo crítico si es solo por datos faltantes (con "NO DISPONIBLES" en el mensaje)
    !g.reason.includes('NO DISPONIBLES')
  );
  
  const warnings = gates.filter(g => g.severity === 'warning' && !g.passed);
  
  // Check if we're in provisional mode (any gate has missing data)
  const modeProvisional = gates.some(g => g.reason.includes('NO DISPONIBLES'));
  
  const allPassed = gates.every(g => g.passed);

  let recommendation = 'PROCEED - Todos los gates pasaron ✓';
  
  if (criticalFailures.length > 0 && !modeProvisional) {
    recommendation = `REJECT - ${criticalFailures.length} gates críticos fallaron: ${criticalFailures.map(g => g.gate).join(', ')}`;
  } else if (modeProvisional) {
    recommendation = `PROCEED_PROVISIONAL - Modo provisional: ${gates.filter(g => g.reason.includes('NO DISPONIBLES')).length} gates sin datos reales. Conectar cuando broker disponible.`;
  } else if (warnings.length > 0) {
    recommendation = `CONDITIONAL - ${warnings.length} warnings. Reducir tamaño en 50%+`;
  }

  return {
    allPassed,
    gates,
    criticalFailures,
    warnings,
    recommendation,
    modeProvisional,
  };
}

export function toAuditableSafetyGateResult(
  gate: GateCheckResult,
  observedValue: string,
  limit: string
): AuditableSafetyGateResult {
  const blocking = !gate.passed && gate.severity === 'critical';
  return {
    name: gate.gate,
    state: blocking ? 'BLOCK' : gate.severity === 'warning' ? 'WARN' : 'PASS',
    reason: gate.reason,
    severity: gate.severity,
    blocking,
    observedValue,
    limit,
  };
}
