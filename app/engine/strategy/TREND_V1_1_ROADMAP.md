/**
 * ROADMAP TÉCNICO - Trend Validator v1.1
 * Qué datos necesita / Qué función calcula / Qué falta
 * 
 * Estructura: Para cada condición, resolver
 * 1. ¿QUÉ DATOS NECESITA?
 * 2. ¿CÓMO SE CALCULA MATEMÁTICAMENTE?
 * 3. ¿QUÉ ESTÁ IMPLEMENTADO?
 * 4. ¿QUÉ FALTA?
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONDICIÓN 1: PRECIO VS EMA200
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface Condicion1_Requerimientos {
  // DATOS NECESARIOS:
  datos: {
    currentPrice: number;           // Cierre actual de 1H
    ema200: number;                 // EMA200 actual
  };

  // CÁLCULO MATEMÁTICO:
  formula: `
    IF currentPrice > ema200 THEN
      distancePips = currentPrice - ema200
      IF distancePips >= minThreshold THEN
        return TRUE (met = true, score = 25)
      ELSE
        return FALSE (met = false, score = 0)
    ELSE
      return FALSE
  `;

  // VARIABLES PENDING (v1.1):
  pending: {
    minThreshold_pips: "¿0? ¿5? ¿10? ¿Dinámico por asset?",
    maxThreshold_pips: "¿Hay máximo? ¿100 pips = sobrecalentado?",
    asset_specific: "¿XAUUSD ≠ EURUSD en distancia?",
  };

  // IMPLEMENTACIÓN ACTUAL:
  current: {
    implemented: "✅ Comparación currentPrice > ema200",
    working: "✅ Retorna true/false correcto",
    missing: "❌ No valida distancia en pips (threshold)",
  };

  // TODO v1.1:
  todo: [
    "[ ] Definir minThreshold en pips (constante o dinámico)",
    "[ ] ¿Validar maxThreshold? (para evitar aberraciones)",
    "[ ] ¿Diferentes thresholds por asset?",
    "[ ] Agregar al TrendValidator.validateTrend() parámetro 'direction'",
    "[ ] Implementar logic para DOWN (currentPrice < ema200 - threshold)",
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONDICIÓN 2: ORDEN DE EMAs (EMA20, EMA50, EMA200)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface Condicion2_Requerimientos {
  // DATOS NECESARIOS:
  datos: {
    ema20: number;
    ema50: number;
    ema200: number;
    direction: 'UP' | 'DOWN';       // ← FALTA en implementación actual
  };

  // CÁLCULO MATEMÁTICO PARA UP:
  formula_UP: `
    IF ema20 > ema50 AND ema50 > ema200 THEN
      return TRUE (met = true, score = 25)
    ELSE
      return FALSE (met = false, score = 0)
  `;

  // CÁLCULO MATEMÁTICO PARA DOWN:
  formula_DOWN: `
    IF ema20 < ema50 AND ema50 < ema200 THEN
      return TRUE (met = true, score = 25)
    ELSE
      return FALSE (met = false, score = 0)
  `;

  // VARIABLES PENDING (v1.1):
  pending: {
    exactitud_orden: "¿Debe ser perfecta 20>50>200? ¿O flexibilidad?",
    alternativa_valida: "¿Orden alternativa válida? Ej: 20 > 50 sin importar 200?",
    tolerance: "¿Permitir solapamientos (20 ≈ 50)?",
    direction_logic: "¿Cómo decidir UP vs DOWN? ¿Primera condición?",
  };

  // IMPLEMENTACIÓN ACTUAL:
  current: {
    implemented: "✅ UP orden: ema20 > ema50 > ema200",
    working: "✅ Comparaciones correctas",
    missing: [
      "❌ DOWN COMPLETAMENTE SIN IMPLEMENTAR (comentado)",
      "❌ No recibe parámetro 'direction'",
      "❌ No hay lógica para elegir UP vs DOWN",
    ],
  };

  // TODO v1.1:
  todo: [
    "[ ] Descomentar y implementar DOWN: ema20 < ema50 < ema200",
    "[ ] Agregar parámetro 'direction' a evaluateCondition2",
    "[ ] Crear switch (direction) para validar UP o DOWN",
    "[ ] Definir: ¿orden alternativa válida?",
    "[ ] Definir: ¿tolerance para solapamientos?",
    "[ ] Test: ambas direcciones con datos reales",
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONDICIÓN 3: PENDIENTE DE EMAs (SLOPE)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface Condicion3_Requerimientos {
  // DATOS NECESARIOS (OPCIÓN A - CALCULAR INTERNAMENTE):
  datos_opcionA: {
    ema20_actual: number;
    ema20_anterior: number;        // Vela anterior
    ema50_actual: number;
    ema50_anterior: number;
    ema200_actual: number;
    ema200_anterior: number;
    timeframeMinutes: number;      // 60 para 1H
  };

  // DATOS NECESARIOS (OPCIÓN B - RECIBIR PRECALCULADO):
  datos_opcionB: {
    ema20Slope: number;            // (actual - anterior) / timeframe
    ema50Slope: number;
    ema200Slope: number;
    direction: 'UP' | 'DOWN';
  };

  // CÁLCULO MATEMÁTICO:
  formula: `
    OPCIÓN A - Calcular internamente:
    ema20Slope = (ema20_actual - ema20_anterior) / timeframeMinutes
    ema50Slope = (ema50_actual - ema50_anterior) / timeframeMinutes
    ema200Slope = (ema200_actual - ema200_anterior) / timeframeMinutes
    
    IF direction == 'UP' THEN
      IF (ema20Slope > minSlope AND ema50Slope > minSlope) THEN
        IF (ema20Slope < maxSlope AND ema50Slope < maxSlope) THEN  // Evitar sobrecalentamiento
          return TRUE
      
    IF direction == 'DOWN' THEN
      IF (ema20Slope < -minSlope AND ema50Slope < -minSlope) THEN
        return TRUE
  `;

  // VARIABLES PENDING (v1.1):
  pending: {
    decision: "¿OPCIÓN A (calcular) o OPCIÓN B (recibir)?",
    minSlope: "¿Qué valor mínimo? 0.0001? 0.001? 0.01?",
    maxSlope: "¿Qué valor máximo? Evitar sobrecalentamiento",
    ema200_requerido: "¿Validar slope de EMA200 o solo 20/50?",
    tolerance_direction: "¿Qué tolerance en dirección?",
  };

  // IMPLEMENTACIÓN ACTUAL:
  current: {
    decision_actual: "OPCIÓN B (recibir precalculado)",
    implemented: "⚠️ Solo IF slopes vienen del exterior",
    working: "⚠️ Valida > 0 si vienen completados",
    missing: [
      "❌ NO calcula slope internamente",
      "❌ NO recibe histórico de velas",
      "❌ Si slope = undefined → asume 0 → FALLA",
      "❌ Threshold '> 0' es ARBITRARY sin definición",
      "❌ NO hay validación de máximo",
      "❌ NO hay dirección (DOWN completamente falta)",
    ],
  };

  // TODO v1.1 - ELEGIR CAMINO:
  todo_decision: {
    opcionA_ventajas: [
      "Validador es self-contained",
      "No depende del caller",
      "Más seguro",
    ],
    opcionA_desventajas: [
      "Necesita histórico de velas",
      "Más complejidad",
      "Más cálculos",
    ],
    opcionB_ventajas: [
      "Caller calcula una sola vez",
      "Eficiente",
      "Separación de concerns",
    ],
    opcionB_desventajas: [
      "Caller debe calcular bien",
      "Error del caller → error del validador",
      "Contrato implícito",
    ],
  };

  // TODO v1.1 - ACCIONES:
  todo: [
    "[ ] DECISIÓN: ¿Opción A o B?",
    "[ ] Definir: minSlope valor exacto",
    "[ ] Definir: maxSlope valor exacto",
    "[ ] Implementar: validación DOWN (slopes negativos)",
    "[ ] Implementar: if (ema20Slope < minSlope) {...}",
    "[ ] Test: cálculos con datos reales XAUUSD 1H",
    "[ ] Validar: que slopes tiene sense comercial",
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONDICIÓN 4: ESTRUCTURA DE MERCADO (HH/HL/LH/LL)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface Condicion4_Requerimientos {
  // DATOS NECESARIOS:
  datos: {
    velas_historicas: Array<{
      index: number;         // 0 = más antigua
      open: number;
      high: number;
      low: number;
      close: number;
    }>;
    cantidad_minima: number; // ¿5? ¿10? ¿20 velas?
    direction: 'UP' | 'DOWN';
  };

  // CÁLCULO MATEMÁTICO PARA UP (Higher Highs + Higher Lows):
  formula_UP: `
    ANALIZAR últimas N velas:
    higherHighs = 0
    higherLows = 0
    
    FOR i = 1 TO length-1:
      IF velas[i].high > velas[i-1].high THEN
        higherHighs++
      IF velas[i].low > velas[i-1].low THEN
        higherLows++
    
    IF higherHighs >= minHigherHighs AND higherLows >= minHigherLows THEN
      return TRUE (estructura válida para UP)
  `;

  // CÁLCULO MATEMÁTICO PARA DOWN (Lower Highs + Lower Lows):
  formula_DOWN: `
    ANALIZAR últimas N velas:
    lowerHighs = 0
    lowerLows = 0
    
    FOR i = 1 TO length-1:
      IF velas[i].high < velas[i-1].high THEN
        lowerHighs++
      IF velas[i].low < velas[i-1].low THEN
        lowerLows++
    
    IF lowerHighs >= minLowerHighs AND lowerLows >= minLowerLows THEN
      return TRUE (estructura válida para DOWN)
  `;

  // VARIABLES PENDING (v1.1):
  pending: {
    velas_cantidad: "¿5? ¿10? ¿20? ¿Dinámico?",
    higherHighs_min: "¿2 consecutivos? ¿3?",
    higherLows_min: "¿2 consecutivos? ¿3?",
    consecutivos: "¿Deben ser TODOS consecutivos o permitir excepciones?",
    contradiccion_logic: "¿Si estructura contradice → bajar score o cancelar?",
  };

  // IMPLEMENTACIÓN ACTUAL:
  current: {
    implemented: "❌ SOLO cuenta últimas 3 velas en dirección",
    working: "⚠️ Cuenta velas UP/DOWN",
    missing: [
      "❌ NO accede a velas reales (open, high, low, close)",
      "❌ NO calcula HH, HL, LH, LL",
      "❌ Fields hardcoded a false: higherHighs, higherLows, lowerHighs, lowerLows",
      "❌ NO hay lógica de contradicción/override",
      "❌ Estructura es FALSO POSITIVO",
    ],
  };

  // TODO v1.1:
  todo: [
    "[ ] Recibir velas_historicas como Array de candles",
    "[ ] Definir: cantidad mínima de velas a analizar",
    "[ ] Implementar: loop para calcular HH, HL, LH, LL",
    "[ ] Definir: cantidad mínima de HH/HL para validar UP",
    "[ ] Definir: cantidad mínima de LH/LL para validar DOWN",
    "[ ] Implementar: lógica de contradicción (si HH pero downtrend)",
    "[ ] Implementar: bajar confianza si hay contradicción",
    "[ ] Test: con 20 velas reales XAUUSD 1H",
    "[ ] Validar: estructura tiene PRIORIDAD",
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DETERMINACIÓN FINAL DE DIRECCIÓN
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface DireccionLogica {
  // DATOS NECESARIOS:
  datos: {
    condicion1_met: boolean;     // Precio vs EMA200
    condicion1_direction: 'UP' | 'DOWN';
    condicion2_met: boolean;     // EMA Order
    condicion2_direction: 'UP' | 'DOWN';
    condicion3_met: boolean;     // Slope
    condicion3_direction: 'UP' | 'DOWN';
    condicion4_met: boolean;     // Estructura
    condicion4_direction: 'UP' | 'DOWN';
    condicion4_contradicts: boolean; // Estructura contradice?
  };

  // CÁLCULO LÓGICO:
  formula: `
    // Contar votos por dirección
    upVotes = 0
    downVotes = 0
    
    IF condicion1_met THEN
      IF condicion1_direction == 'UP' THEN upVotes++
      ELSE downVotes++
    
    IF condicion2_met THEN
      IF condicion2_direction == 'UP' THEN upVotes++
      ELSE downVotes++
    
    IF condicion3_met THEN
      IF condicion3_direction == 'UP' THEN upVotes++
      ELSE downVotes++
    
    IF condicion4_met THEN
      // ESTRUCTURA TIENE PRIORIDAD/OVERRIDE
      IF condicion4_contradicts THEN
        // Contradice a otros → bajar confianza general
        return NEUTRAL o downgrade confidenceLevel
      
      IF condicion4_direction == 'UP' THEN upVotes++
      ELSE downVotes++
    
    // Mayoría simple
    IF upVotes > downVotes THEN
      return 'BUY'
    ELSE IF downVotes > upVotes THEN
      return 'SELL'
    ELSE
      return 'NEUTRAL'
  `;

  // VARIABLES PENDING (v1.1):
  pending: {
    voto_ponderado: "¿Todos los votos valen igual? ¿Pesos diferentes?",
    estructura_override: "¿Estructura contradictoria = veto automático?",
    umbral_confianza: "¿Cuántos votos = A+/A/B/C?",
  };

  // IMPLEMENTACIÓN ACTUAL:
  current: {
    implemented: "❌ PSEUDOCÓDIGO",
    working: "⚠️ Cuenta condiciones met (sin dirección)",
    missing: [
      "❌ NO tiene dirección por condición",
      "❌ NO hace lógica booleana de UP vs DOWN",
      "❌ Solo: if (metCount >= 3) return BUY - ARBITRARIO",
      "❌ NO diferencia UP de DOWN",
    ],
  };

  // TODO v1.1:
  todo: [
    "[ ] REFACTORIZAR: cada condición retorna direction",
    "[ ] Implementar: lógica de votación UP vs DOWN",
    "[ ] Implementar: mayoría simple o ponderada?",
    "[ ] Implementar: lógica de OVERRIDE por estructura",
    "[ ] Implementar: bajar confidenceLevel si contradicción",
    "[ ] Test: casos UP, DOWN, NEUTRAL, contradicción",
  ];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RESUMEN - TODO PARA v1.1
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * CRÍTICO:
 * [ ] Condición 2: Implementar DOWN (línea 174 comentada)
 * [ ] Condición 3: Decisión OPCIÓN A o B, luego implementar
 * [ ] Condición 4: Acceso a velas reales, calcular HH/HL/LH/LL
 * [ ] Dirección: Refactorizar para votación UP vs DOWN
 * 
 * IMPORTANTE:
 * [ ] Condición 1: Definir threshold en pips
 * [ ] Todas: Agregar parámetro 'direction' a evaluaciones
 * [ ] Todas: Implementar lógica DOWN
 * [ ] Estructura: Implementar lógica de OVERRIDE/contradicción
 * 
 * VALIDACIÓN:
 * [ ] Unit tests cada condición
 * [ ] Integration test con datos reales XAUUSD 1H
 * [ ] Backtesting: 354k velas 2025, validar tendencias detectadas
 * 
 * TIMELINE ESTIMADO: 3-5 días si hay claridad en cada punto
 */

export const ROADMAP_VERSION = '1.1';
export const STATUS = 'READY_FOR_IMPLEMENTATION';
