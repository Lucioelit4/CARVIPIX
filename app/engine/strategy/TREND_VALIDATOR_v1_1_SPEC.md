# TrendValidator v1.1 - Especificación Oficial

**Status:** ✅ CONSTRUCCIÓN COMPLETADA | 🔧 PROVISIONAL (configurable)  
**Version:** 1.1  
**Last Updated:** July 2, 2026  
**Mode:** Platform Construction (no optimization)

---

## 📋 Visión General

**Propósito:** Detectar dirección y confianza de tendencia en 1 hora (H1) usando análisis multi-condición.

**Entrada:** 1 vela H1 + histórico de EMAs + histórico de velas  
**Salida:** `TrendValidation { direction: "BUY"|"SELL"|"NEUTRAL", confidenceLevel: "A+"|"A"|"B"|"C", scores }`

**Arquitectura:** 4 condiciones independientes evaluadas como bullish/bearish/neutral

---

## 🎯 Sistema de Voting

### Estructura Base

```
4 Condiciones × 25 puntos = 100 puntos totales

Rango bullish:  0-100 puntos
Rango bearish:  0-100 puntos
```

### Votación (Definitiva)

```typescript
bullishScore = sum of bullish votes (25 points each)
bearishScore = sum of bearish votes (25 points each)

if (bullishScore > bearishScore)       → direction = "BUY"
if (bearishScore > bullishScore)       → direction = "SELL"
if (bullishScore === bearishScore)     → direction = "NEUTRAL"
```

**Status:** ✅ DEFINITIVO (no cambia)

---

## 🔍 Condiciones (v1.1)

### Condición 1: Precio vs EMA200 (DEFINITIVA)

**Lógica:**
```
if (price > EMA200)  → BULLISH (+25 bullish)
if (price < EMA200)  → BEARISH (+25 bearish)
if (price == EMA200) → NEUTRAL (no voto)
```

**Por qué:** EMA200 es resistencia/soporte primaria  
**Status:** ✅ DEFINITIVA

---

### Condición 2: EMA Order (DEFINITIVA)

**Lógica:**
```
if (EMA20 > EMA50 > EMA200)    → BULLISH (+25 bullish)
if (EMA20 < EMA50 < EMA200)    → BEARISH (+25 bearish)
if (NO cumplen orden estricto) → NEUTRAL (no voto)
```

**Nota:** Orden ESTRICTA (no permite iguales)  
**Por qué:** Confirmación de estructura trend clean  
**Status:** ✅ DEFINITIVA

---

### Condición 3: EMA Slope (DEFINITIVA)

**Lógica:**
```
Calcular slopes en últimas 5 velas:
  slope_20 = EMA20[current] - EMA20[5_velas_atrás]
  slope_50 = EMA50[current] - EMA50[5_velas_atrás]

if (slope_20 > 0 AND slope_50 > 0)  → BULLISH (+25 bullish)
if (slope_20 < 0 AND slope_50 < 0)  → BEARISH (+25 bearish)
if (NO ambos positivos/negativos)   → NEUTRAL (no voto)
```

**Por qué:** Confirma dirección del momentum  
**Nota:** Requiere historiales de EMA (al menos 6 velas)  
**Status:** ✅ DEFINITIVA

---

### Condición 4: Structure (DEFINITIVA v1.1)

**Lógica (Simple Swings - v1.1):**
```
Comparar vela actual vs vela anterior:

if (high_current > high_prev AND low_current > low_prev)
  → BULLISH (+25 bullish)  // Higher High + Higher Low

if (high_current < high_prev AND low_current < low_prev)
  → BEARISH (+25 bearish)  // Lower High + Lower Low

else
  → NEUTRAL (no voto)  // Mixed (HH+LL o HL+LL, etc)
```

**Versión:** v1.1 Simple Swings  
**Nota:** NO es BOS/CHoCH (institucional), solo comparación directa  
**Limitación:** Requiere al menos 2 velas (prev + current)  
**Status:** ✅ DEFINITIVA (v1.1)

**Future:** v1.2 podría implementar BOS/CHoCH si se define profesionalmente  
**Status Futuro:** 🔄 PENDING REQUIREMENTS

---

## 📊 Cálculo de Confianza

### Fórmula (Definitiva)

```typescript
// Determinar dirección primero
if (bullishScore > bearishScore) direction = "BUY"
if (bearishScore > bullishScore) direction = "SELL"
if (bullishScore === bearishScore) direction = "NEUTRAL"

// Calcular condiciones efectivas
confirming = sum of votes in direction        // 0-4
contradicting = sum of votes opposite to direction  // 0-4

// AQUÍ ENTRA PENALIZACIÓN CONFIGURABLE
effectiveConditions = confirming - (contradicting × contradictionPenalty)

// Mapear a nivel
if (direction === "NEUTRAL")     → confidenceLevel = "C"
if (effectiveConditions >= 4.0)  → confidenceLevel = "A+"
if (effectiveConditions >= 3.0)  → confidenceLevel = "A"
if (effectiveConditions >= 2.0)  → confidenceLevel = "B"
if (effectiveConditions >= 1.0)  → confidenceLevel = "C"
if (effectiveConditions < 1.0)   → confidenceLevel = "C"
```

**Interpretación:**
```
A+ = 4/4 perfecto (0 contradicciones)
A  = 3/4 ó 3/1 fuerte (pocas contradicciones)
B  = 2/4 ó 2/2 balanceado (muchas contradicciones)
C  = ≤1/4 débil (muy pocas confirmaciones)
```

**Status:** ✅ DEFINITIVA (estructura)

---

## ⚙️ Configuración

### Parámetro: `contradictionPenalty` (CONFIGURABLE PROVISIONAL)

**Ubicación:** `trendValidatorConfig.ts`

```typescript
TREND_VALIDATOR_CONFIG = {
  contradictionPenalty: 0.5,  // ← CONFIGURABLE
  version: '1.1',
  status: 'PROVISIONAL',
}
```

**Rango válido:** 0.0 - 1.0

**Valores probados:**
```
0.25 = Soft   (contradictions barely penalized)
0.50 = Medium (RECOMENDADO) ← Current
0.75 = Strong (contradictions heavily penalized)
```

**Test Results:** Todos producen distribución idéntica en June 2026  
→ Parámetro seguro, no ultrasensible

**Status:** 🔧 PROVISIONAL  
**Decisión Final:** Pending Pullback validator testing

---

## 📁 Archivos

**Core Implementation:**
- `trendValidation.ts` - Lógica principal
- `tradingEngine.ts` - Tipos (TrendValidation)
- `trendValidatorConfig.ts` - Configuración

**Testing (NO ejecutar sin autorización):**
- `testTrendValidator.js` - Test base (250 candles)
- `testPenaltyComparison.js` - Test penalties (250 candles × 3)
- `PENALTY_COMPARISON_RESULTS.json` - Resultados

**Documentation:**
- `TREND_VALIDATOR_v1_1_SPEC.md` (this file)
- `PENALTY_CONFIGURATION_ANALYSIS.md`

---

## 🔄 Definiciones de Estados

| Estado | Significado | Acción |
|--------|-----------|--------|
| ✅ DEFINITIVO | Regla fija, no cambia | Usar tal cual |
| 🔧 PROVISIONAL | Valor recomendado, sujeto a ajuste | Usar ahora, cambiar si es necesario |
| 🔄 PENDING | Requiere análisis/decisión | No usar hasta tener spec |
| ⚠️ DEPRECATED | Reemplazado, no usar | Ignorar |

---

## 🎓 Ejemplos

### Ejemplo 1: BUY Fuerte (A+)

```
Vela H1 actual: close=2045.50, high=2046, low=2044

Cond 1: price (2045.50) > EMA200 (2040)        → BULLISH ✓
Cond 2: EMA20(2045) > EMA50(2042) > EMA200(2040) → BULLISH ✓
Cond 3: slope_20 (+5) > 0 AND slope_50 (+3) > 0 → BULLISH ✓
Cond 4: HH + HL en últimas velas              → BULLISH ✓

Result:
  bullishScore = 100
  bearishScore = 0
  direction = "BUY"
  confirming = 4, contradicting = 0
  effectiveConditions = 4 - (0 × 0.5) = 4.0
  confidenceLevel = "A+"
```

**Interpretación:** Señal muy sólida, 4 condiciones bullish, sin contradicciones

---

### Ejemplo 2: SELL Débil (C)

```
Vela H1 actual: close=2032, high=2033, low=2031

Cond 1: price (2032) < EMA200 (2040)         → BEARISH ✓
Cond 2: EMA20 > EMA50 (NO orden estricto)    → NEUTRAL ✗
Cond 3: slope_20 (+1) > 0, slope_50 (-2) < 0 → NEUTRAL ✗
Cond 4: LL pero HH (mixed)                   → NEUTRAL ✗

Result:
  bullishScore = 25 (solo cond 2 bullish?)
  bearishScore = 25 (cond 1 bearish)
  direction = "NEUTRAL"
  
  OR si hay 1 bearish vs 3 neutral:
  bearishScore = 25
  bullishScore = 0
  direction = "SELL"
  confirming = 1, contradicting = 0
  effectiveConditions = 1 - (0 × 0.5) = 1.0
  confidenceLevel = "C"
```

**Interpretación:** Señal débil, muy pocas confirmaciones

---

### Ejemplo 3: SELL Con Contradicción (B)

```
Vela H1 actual: close=2038, high=2039, low=2037

Cond 1: price (2038) < EMA200 (2040)        → BEARISH ✓
Cond 2: EMA20 > EMA50 > EMA200               → BULLISH ✓
Cond 3: slope_20 (+2) > 0, slope_50 (-3) < 0 → NEUTRAL ✗
Cond 4: LH + LL                              → BEARISH ✓

Result:
  bullishScore = 25 (cond 2)
  bearishScore = 50 (cond 1, 4)
  direction = "SELL"
  confirming = 2, contradicting = 1
  effectiveConditions = 2 - (1 × 0.5) = 1.5
  confidenceLevel = "C"
```

**Interpretación:** SELL con 1 contradicción bullish, nivel C (débil)

---

## 🚫 Lo Que NO es TrendValidator v1.1

- ❌ No es entry signal (solo tendencia H1)
- ❌ No reemplaza análisis de pullback
- ❌ No detecta BOS/CHoCH (v1.1 = simple swings)
- ❌ No es predicción (solo detección)
- ❌ No tiene stop loss definido
- ❌ No optimizado para spread/comisiones

---

## ✅ Checklist de Validación

- [x] 4 condiciones definidas y documentadas
- [x] Sistema de voting claro (BUY/SELL/NEUTRAL)
- [x] Fórmula de confianza especificada
- [x] Penalización configurable implementada
- [x] Parámetros testados (0.25, 0.50, 0.75)
- [x] Ejemplos incluidos
- [x] Estado de cada elemento (DEFINITIVO/PROVISIONAL/PENDING)
- [x] Archivos documentados
- [x] Test files no ejecutables por defecto

---

## 📝 Control de Cambios

| Date | Version | Change | Status |
|------|---------|--------|--------|
| Jul 2, 2026 | 1.1 | Initial release, 4 conditions final, penalty configurable | ✅ |
| — | 1.2 | BOS/CHoCH structure detection | 🔄 PENDING |
| — | 2.0 | Multiple timeframe aggregation | 🔄 PENDING |

---

## 🎯 Próximos Pasos

**Siguiente:** Pullback Validator 45M (structure only, PENDING configuration)  
**After:** Entry Validator 5M (structure only, PENDING configuration)  
**Final:** Integration & Admin Dashboard

---

**This is a construction spec. All provisional items subject to change. Final decision by platform lead.**
