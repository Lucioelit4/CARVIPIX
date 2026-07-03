# Pullback Validator 45M - Especificación

**Status:** 🔄 STRUCTURE ONLY - AWAITING REQUIREMENTS  
**Version:** 1.0 (DRAFT - NOT IMPLEMENTED)  
**Mode:** Professional Construction  
**Timeline:** Pending answers to configuration questions

---

## 📋 Visión General

**Propósito:** Detectar zonas de pullback válidas en timeframe 45M para filtrar señales de entrada.

**Entrada:** 1H TrendValidation (direction + confidence) + histórico 45M  
**Salida:** `PullbackValidation { isPullback: boolean, confirmationLevel: HIGH|MEDIUM|LOW|NONE }`

**Estado Actual:** Estructura creada, lógica PENDING

---

## ❓ Preguntas Fundamentales Pendientes

### 1. ¿Qué es un "Pullback Válido" en 45M?

**No definido aún. Necesita respuesta:**

- ¿Es solo retroceso de precio? O también estructura (HH/LL)?
- ¿Profundidad máxima permitida? (% del movimiento anterior)
- ¿Profundidad mínima requerida?
- ¿Puede romper soportes/resistencias o debe respetar niveles?

**Impacta:** Cálculo de `pullbackDepthPercent` y lógica de detección

---

### 2. ¿Qué es "Retracement" en Este Contexto?

**No definido aún. Necesita respuesta:**

- ¿Cuánto del movimiento original debe retracerse? (50%, 61.8%, flexible?)
- ¿Usa niveles Fibonacci (23.6, 38.2, 61.8%)?
- ¿O es cualquier % entre min/max?
- ¿Varía según si trend es A+ vs C?

**Impacta:** `retracement` filter y `pullbackDepth` calculation

---

### 3. ¿Cuántos Candles son "Pullback"?

**No definido aún. Necesita respuesta:**

- ¿Mínimo de candles 45M? (e.g., 3 = ~2.25h)
- ¿Máximo de candles antes de que sea otro trend? (e.g., 15)
- ¿Varía según trend confidence? (A+ menos, C más tolerante?)
- ¿Hay gap máximo permitido?

**Impacta:** `minPullbackCandles`, `maxPullbackCandles`

---

### 4. ¿Validan los EMAs de 45M?

**No definido aún. Necesita respuesta:**

- ¿Incluir validación EMA 45M o solo precio?
- ¿Qué estructura EMA es válida? (¿debe mantener orden? ¿slopes?)
- ¿Debe confirmar dirección 1H o puede ser neutral?
- ¿Qué períodos? (20, 50, 200 = como 1H? o diferentes?)
- ¿Obligatorio o confirmación adicional?

**Impacta:** `emaValidation` filter

---

### 5. ¿Confirmación por Volumen?

**No definido aún. Necesita respuesta:**

- ¿Es volumen relevante en forex? (XAUUSD tiene volumen)
- ¿Qué = "volumen de confirmación"? (spike? MA?)
- ¿Mínimo aumento requerido? (1.5x? 2x promedio?)
- ¿Sobre cuántos candles calcular promedio? (50? 100?)

**Impacta:** `volumeConfirmation` filter

---

### 6. ¿Qué es HIGH vs MEDIUM vs LOW?

**No definido aún. Necesita respuesta:**

- ¿Sistema de scoring? (0-100 puntos?)
- ¿Sistema de filtros? (cuántos deben pasar?)
- ¿HIGH = todos los filtros? MEDIUM = mayoría? LOW = algunos?
- ¿Varía por trend confidence? (A+ BUYs = HIGH automático?)
- ¿Hay peso diferente por filtro? (profundidad > volumen?)

**Impacta:** `determineConfirmationLevel()` logic

---

### 7. ¿Mercados Diferentes = Reglas Diferentes?

**No definido aún. Necesita respuesta:**

- ¿Mercado trending vs ranging = different pullback rules?
- ¿Alta volatilidad afecta profundidad permitida?
- ¿Horarios de trading (US/Asia/EU) = reglas diferentes?
- ¿XAUUSD diferente a EURUSD?

**Impacta:** `marketAdaptation` configuration

---

## 🏗️ Arquitectura (Estructura Lista)

```
PullbackValidator.validatePullback(params)
    ↓
    ├─ checkSwingHigh/Low() [PENDING: definition]
    ├─ calculatePullbackDepth() [PENDING: formula]
    ├─ checkEMAFilter() [PENDING: EMA rules]
    ├─ checkVolumeConfirmation() [PENDING: volume criteria]
    ├─ checkTimeRequirements() [PENDING: candle count]
    ├─ determineConfirmationLevel() [PENDING: threshold logic]
    └─ return { isPullback, confirmationLevel, diagnostics }
```

**Status:** Estructura creada, todas las funciones PENDING

---

## 📁 Archivos

**Code:**
- `pullbackValidator.ts` - Clase principal (estructura, PENDING logic)
- `pullbackValidatorConfig.ts` - Configuración (placeholder, PENDING values)

**Documentation:**
- `PULLBACK_VALIDATOR_45M_SPEC.md` (this file)

**Status:** Ready para completar una vez que requisitos estén definidos

---

## 🚀 Roadmap para Implementación

### Phase 1: Requirements (CURRENT - BLOCKING)
```
[ ] Define pullback depth (% and/or Fibonacci)
[ ] Define retracement requirements
[ ] Define time requirements (min/max candles)
[ ] Define EMA validation rules (if any)
[ ] Define volume confirmation (if applicable)
[ ] Define confirmation level thresholds
[ ] Define market adaptation rules
```

### Phase 2: Configuration (READY TO START)
```
[ ] Populate pullbackValidatorConfig.ts with answers
[ ] Create tests for each configuration parameter
[ ] Validate parameter ranges
```

### Phase 3: Implementation (AFTER CONFIG)
```
[ ] Implement calculatePullbackDepth()
[ ] Implement checkEMAFilter()
[ ] Implement checkVolumeConfirmation()
[ ] Implement determineConfirmationLevel()
[ ] Add comprehensive logging/diagnostics
[ ] Create unit tests
```

### Phase 4: Integration (AFTER IMPLEMENTATION)
```
[ ] Integrate with TrendValidator 1H output
[ ] Create admin panel diagnostics
[ ] Test on historical data (DO NOT RUN YET)
[ ] Validate before production
```

---

## 💡 Design Principles (Already Applied)

✅ **No Parameters Invented**
- All settings documented as PENDING
- Configuration file has explanatory questions
- No hardcoded values

✅ **Everything Configurable**
- Will accept config override
- Can adjust without code changes
- Admin diagnostic shows current config

✅ **Professional Structure**
- Type-safe (TypeScript interfaces)
- Clear separation of concerns
- Comprehensive warnings for incomplete features

✅ **Admin-Only Diagnostics**
- `getPullbackValidatorDiagnostic()` shows status
- Lists pending items
- Not visible to production signals

---

## 🔄 Integration Points (PENDING IMPLEMENTATION)

### Input from TrendValidator
```typescript
// Receives
{
  direction: "BUY" | "SELL",
  confidenceLevel: "A+" | "A" | "B" | "C"
  // ... other trend data
}
```

### Used by Entry Validator (5M)
```typescript
// Provides
{
  isPullback: boolean,
  confirmationLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE"
  // Entry 5M uses this to filter signals
}
```

**Status:** Integration structure ready, logic PENDING

---

## ⚠️ Warnings & Constraints

🚫 **NOT READY FOR PRODUCTION** until:
- All configuration questions answered
- All methods implemented
- Tested on historical data
- Approved by platform lead

🚫 **DO NOT:**
- Invent default values
- Run backtests yet
- Deploy to live accounts
- Adjust without documenting

✅ **DO:**
- Answer requirements questions
- Document all decisions
- Review with team
- Test thoroughly before go-live

---

## 📋 Checklist para Completación

**Requirements Phase:**
- [ ] How deep pullback allowed? (answer pullback depth Q)
- [ ] How much retracement required? (answer retracement Q)
- [ ] How many candles 45M? (answer time Q)
- [ ] EMA rules? (answer EMA Q)
- [ ] Volume rules? (answer volume Q)
- [ ] Confidence level definitions? (answer threshold Q)
- [ ] Market adaptation? (answer adaptation Q)

**Configuration Phase:**
- [ ] Fill pullbackValidatorConfig.ts with answers
- [ ] Validate parameter ranges
- [ ] Document rationale for each choice

**Implementation Phase:**
- [ ] Implement all PENDING methods
- [ ] Add comprehensive logging
- [ ] Create unit tests
- [ ] Verify all code paths

**Integration Phase:**
- [ ] Connect to TrendValidator
- [ ] Connect to Entry Validator
- [ ] Admin panel diagnostics
- [ ] Historical validation

---

## 🎯 Resultado Esperado

Cuando se complete:
```typescript
const pullback = await PullbackValidator.validatePullback({
  trendDirection: 'BUY',
  trendConfidence: 'A+',
  currentCandle45M: { ... },
  // ... other params
});

console.log(pullback.isPullback); // true/false
console.log(pullback.confirmationLevel); // HIGH/MEDIUM/LOW/NONE
```

**Status:** Estructura 100% lista, lógica 0% implementada, esperando requisitos

---

## 📝 Próximos Pasos

### IMMEDIATE (Blocking)
1. **Responder las 7 preguntas fundamentales** (sección ❓ arriba)
2. **Documentar decisiones** en requirements file
3. **Actualizar pullbackValidatorConfig.ts** con valores

### THEN (Ready to implement)
1. Llenar todos los PENDING métodos
2. Crear tests
3. Validar end-to-end

### FINALLY
1. Integración con TrendValidator
2. Integración con Entry Validator
3. Admin panel
4. Production deployment

---

**This spec is INTENTIONALLY INCOMPLETE to prevent invented parameters.**

**When all 7 questions are answered, implementation can begin.**

**Status: 🔄 AWAITING REQUIREMENTS**
