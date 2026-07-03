# CARVIPIX Strategy v1.0 - Especificación Oficial

**Fecha:** 2026-07-02  
**Estado:** Definition (Pending Rules v1.1)  
**Acceso:** Privado / Admin  

---

## 1. Objetivo Estratégico

CARVIPIX es una estrategia **algorítmica multi-temporalidad** enfocada en:
- **Capturar movimientos de tendencia confirmados** en oro (XAUUSD) como activo principal
- **Validación mediante consenso multi-agente** (11 agentes de análisis independientes)
- **Entrada en retrocesos dentro de tendencia** con confirmación de estructura
- **Gestión de riesgo matemática** basada en volatilidad y capital
- **Generación de alertas** para ejecutores (humanos o futuro AutoBot)
- **Sin apalancamiento excesivo** en operaciones reales

---

## 2. Activos Iniciales

| Activo    | Rol Primario | Rol Secundario | Validación |
|-----------|--------------|----------------|------------|
| XAUUSD    | Principal    | -              | ✓ Backtesting activo |
| BTCUSD    | Correlación  | Alternativo    | ⏳ Pending |
| EURUSD    | Correlación  | Alternativo    | ⏳ Pending |
| GBPUSD    | Correlación  | Alternativo    | ⏳ Pending |

**Principal:** XAUUSD (Oro/USD 1 minuto HistData real)  
**Máximo de activos simultáneos:** 2 (control de correlación)

---

## 3. Temporalidades Operacionales

### 3.1 Estructura Multi-Timeframe

```
Timeframe   | Rol                | EMAs           | Muestreo
-----------|-------------------|----------------|----------
1H         | Tendencia primaria | 20, 50, 200    | 60 velas
45M        | Confirmación       | 20, 50, 200    | 53 velas
5M         | Entrada táctica    | 20, 50, 200    | 240 velas
```

### 3.2 Sincronización

- **1H (Trend):** Define dirección primaria y estructura mayor
- **45M (Confirmation):** Confirma retroceso y estructura dentro de 1H
- **5M (Entry):** Detección de entrada táctica, confluencia final

**Lógica:** Entra en 5M solo si tendencia 1H + confirmación 45M = aligned

---

## 4. Media Móviles Exponenciales (EMAs)

### 4.1 Configuración Base

```
EMA 20  → Precio reciente / Momentum corto plazo
EMA 50  → Sesión media / Equilibrio dinámi0
EMA 200 → Tendencia long-term / Sesgo estratégico
```

### 4.2 Roles en Análisis

| EMA    | Propósito | Timeframe | Uso |
|--------|-----------|-----------|-----|
| 20     | Velocidad | 5M, 45M, 1H | Entrada, SL dinámico |
| 50     | Soporte   | 5M, 45M, 1H | Zona neutra, confirmación |
| 200    | Sesgo     | 1H primario | Sesgo estratégico general |

**Cálculo:** Standard exponential (period=20, 50, 200)

---

## 5. Filosofía Estratégica

### 5.1 Principios Core

1. **Tendencia es Amiga:** Solo operar con tendencia primaria confirmada (1H)
2. **Retroceso es Entrada:** Buscar retrocesos profundos (no contratendencia)
3. **Confirmación Múltiple:** Min 7/11 agentes aprueban = Señal válida
4. **Gestión Estricta:** SL y TP predefinidos, sin manual override
5. **Privacidad Total:** Cero exposición a cliente durante development

### 5.2 No Hacer

- ❌ Operar contra tendencia primaria (1H)
- ❌ Entrada sin confirmación multi-agente
- ❌ Trading real sin reglas completamente especificadas
- ❌ Apalancamiento > 2x en testing
- ❌ Ignorar señales de rechazo de agentes

---

## 6. Flujo de Decisión (High Level)

```
┌─────────────────────────────────┐
│ Nueva vela 5M recibida          │
└──────────────┬──────────────────┘
               │
       ┌───────▼────────┐
       │ Analizar 1H    │
       │ (Tendencia)    │
       └───────┬────────┘
               │
       ┌───────▼─────────────┐
       │ ¿Tendencia clara?   │
       └───────┬──────┬──────┘
           SÍ  │      │ NO
             └──┴─┐┌──┴──┐
        ┌────────▼▼─┐   NO SIGNAL
        │ Analizar  │   (Skip)
        │ 45M       │
        │(Confirm)  │
        └────┬──────┘
             │
      ┌──────▼──────────┐
      │ ¿Retroceso      │
      │ + Confirmación? │
      └──┬───────┬──────┘
      SÍ │       │ NO
    ┌────▼───┐   NO SIGNAL
    │ Análisis│  (Skip)
    │ Agentes │
    │  (11)   │
    └────┬────┘
         │
    ┌────▼─────────────┐
    │ ¿Consenso ≥ 7/11?│
    └────┬────────┬────┘
    SÍ   │        │ NO
    ┌────▼────┐  REJECT
    │  SIGNAL │  (Log)
    │ GENERADA│
    └─────────┘
```

---

## 7. Análisis de Tendencia (1H)

### 7.1 Criterios (PENDING EXACT RULES V1.1)

**Contexto Requerido:**
- EMA 20, 50, 200 posicionamiento
- Últimas 3 velas dirección
- Estructura de máximos/mínimos

**Tendencia UP:**
- ❌ Criterio exacto PENDING

**Tendencia DOWN:**
- ❌ Criterio exacto PENDING

**No Tendencia / Rango:**
- ❌ Criterio exacto PENDING

---

## 8. Análisis de Retroceso (45M)

### 8.1 Definición Retroceso (PENDING EXACT RULES V1.1)

**Dentro de tendencia confirmada (1H), buscar:**
- Movimiento contra tendencia primaria
- Profundidad mínima: ❌ PENDING %
- Máxima profundidad: ❌ PENDING %
- Invalidación: ❌ PENDING criterio

**Zonas de Retroceso:**
- ❌ Fibonacci levels: 38.2%, 50%, 61.8% → PENDING

---

## 9. Confirmación de Entrada (5M)

### 9.1 Trigger de Entrada (PENDING EXACT RULES V1.1)

**Dentro de retroceso 45M confirmado:**
- Ruptura de resistencia local
- O: Rechazo de soporte + impulso
- O: Cruce EMA 20 con direction específica
- Cierre válido: ❌ PENDING criterio

**Invalidación Pre-Entrada:**
- ❌ Ruptura de estructura: PENDING
- ❌ Cierre por debajo nivel: PENDING

---

## 10. Entrada - Orden de Mercado

### 10.1 Disparo

**Condiciones Simultáneas:**
1. Tendencia 1H válida (EMA stack o criterio)
2. Retroceso 45M dentro de rango
3. Confirmación 5M disparada
4. Consenso ≥ 7/11 agentes aprobados

**Tipo Orden:** Market (no pending)  
**Volumen:** Basado en SL calculado

---

## 11. Stop Loss (SL) - PENDING EXACT CALCULATION V1.1

### 11.1 Niveles Candidatos

**Opción 1: ATR-based**
- SL = Precio entrada ± N × ATR(14)
- N = ❌ PENDING (1.5, 2.0, 2.5)

**Opción 2: Structure-based**
- SL = Debajo último soporte local
- Offset: ❌ PENDING pips/points

**Opción 3: EMA-based**
- SL = Debajo EMA 50 (5M o 45M)
- Buffer: ❌ PENDING pips

**Selección:** ❌ PENDING criteria

**Máximo SL permitido:** ❌ PENDING pips (control de riesgo)

---

## 12. Take Profit (TP) - PENDING EXACT CALCULATION V1.1

### 12.1 Targets Múltiples

**TP1: Inicial (Partial Close)**
- Objetivo: Recuperar riesgo + ❌ PENDING %
- Volumen: ❌ PENDING % de posición
- Trigger: ❌ PENDING regla

**TP2: Medio (Trail)**
- Objetivo: Trend continuation
- SL trail: ❌ PENDING (ATR, % risk, puntos fijos)

**TP3: Final (Maximizar)**
- Objetivo: Resistencia estructura 1H
- O: Máximo de velas ❌ PENDING
- O: Divergencia agentes ❌ PENDING

**Cierre Forzado:**
- ❌ Tiempo máximo abierto: PENDING
- ❌ Cambio de tendencia 1H: PENDING

---

## 13. Gestión de Riesgo

### 13.1 Cálculo de Volumen

```
Risk$ = Capital × Risk% por trade
Risk$ = Precio entrada - SL (en puntos)
Volumen = Risk$ / SL puntos

Ejemplo (PENDING):
Capital = $10,000
Risk/trade = 1%
Risk$ = $100
Entry = 2500.50
SL = 2498.00 (2.50 puntos)
Volumen = $100 / 2.50 = 40 unidades
```

### 13.2 Límites Diarios

- **Max trades/día:** ❌ PENDING (2, 3, 5)
- **Max drawdown/día:** ❌ PENDING % (2%, 3%, 5%)
- **Stop operación:** ❌ PENDING regla
- **Capital máximo abierto:** ❌ PENDING % (30%, 50%)

### 13.3 Curvas de Tolerancia

| Métrica | Verde | Amarillo | Rojo |
|---------|-------|----------|------|
| Drawdown día | < 1% | 1-2% | > 2% |
| Trades fallidos consecutivos | < 2 | 2-3 | > 3 |
| Win rate sesión | > 50% | 40-50% | < 40% |

---

## 14. Objetivos de Alertas

### 14.1 Tipos de Alerta

```
SIGNAL_GENERATED      → Entrada disparada
SIGNAL_REJECTED       → Consenso < 7/11
SIGNAL_INVALIDATED    → Pre-entrada break
TRADE_OPENED          → Market order ejecutada
TRADE_PARTIAL_TP      → TP1 alcanzado
TRADE_CLOSED_SL       → SL hit
TRADE_CLOSED_TP       → TP final
TREND_CHANGED         → 1H trend reversal
ALERT_SKIPPED         → Rango / no tendencia
```

### 14.2 Payload Mínimo

```json
{
  "timestamp": "2026-07-02T14:30:00Z",
  "version": "1.0",
  "signal_type": "SIGNAL_GENERATED",
  "asset": "XAUUSD",
  "direction": "BUY|SELL",
  "entry_price": 2500.50,
  "sl": 2498.00,
  "tp1": 2502.00,
  "tp2": 2504.50,
  "tp3": 2506.00,
  "consensus": "8/11",
  "confidence": 75,
  "agents_approved": ["TrendAgent", "StructureAgent", "..."],
  "reason": "Human-readable reason"
}
```

---

## 15. Objetivos Future: AutoBot v1.0

### 15.1 Funcionalidades Planeadas

**Fase 1 (Not v1.0):**
- ❌ Auto-execution en vivo
- ❌ Conexión MT4/MT5 API
- ❌ Real account orders
- ❌ Portfolio management
- ❌ Performance tracking

**Habilitación:** Solo después que:
1. CARVIPIX v1.0 reglas completadas y backtested
2. Win rate > 55% en 6 meses datos reales
3. Aprobación explícita usuario
4. Validación regulatoria/legal

---

## 16. Operaciones NO Permitidas

- ❌ **Contra-tendencia:** Operar contra 1H
- ❌ **Scalping:** Trades < 5M duración
- ❌ **Martingala:** Aumentar volumen en pérdidas
- ❌ **Manual override:** Cambiar SL/TP en vivo
- ❌ **Overnight:** Mantener abierto sin SL
- ❌ **Alta apalancamiento:** > 2x en testing
- ❌ **News trading:** Ignorar calendarios económicos
- ❌ **Correlación:** Más de 2 posiciones activas

---

## 17. Estados de Señal

### 17.1 State Machine

```
PENDING → Esperando tendencia 1H
  ↓
TREND_DETECTED → Tendencia confirmada
  ↓
PULLBACK_DETECTED → Retroceso en marcha
  ↓
CONFIRMATION_PENDING → Esperando confirmación 5M
  ↓
CONSENSUS_CHECK → Evaluando 11 agentes
  ↓
SIGNAL_READY → Consenso ≥ 7/11 ✓
  ↓
ENTRY_TRIGGERED → Market order ejecutada
  ↓
TRADE_OPEN → Posición activa
  ├─→ TP1_HIT → Cierre parcial
  ├─→ TP2_TRAILING → Trailing SL
  └─→ SL_HIT → Stop loss ejecutado
  ↓
TRADE_CLOSED → Posición cerrada
  ↓
PENDING → Reinicio ciclo

(Ramas de rechazo):
PENDING ─→ NO_TREND ──→ PENDING
TREND_DETECTED ─→ PULLBACK_INVALID ─→ PENDING
CONSENSUS_CHECK ─→ CONSENSUS_FAILED ─→ PENDING
```

---

## 18. Formato de Alerta - JSON Completo

```json
{
  "alert": {
    "id": "UUID",
    "timestamp": "ISO8601",
    "version": "1.0",
    "status": "SIGNAL_GENERATED|...",
    
    "market": {
      "asset": "XAUUSD",
      "direction": "BUY|SELL",
      "timeframe_primary": "1H",
      "timeframe_confirm": "45M",
      "timeframe_entry": "5M"
    },
    
    "price_levels": {
      "entry": 2500.50,
      "entry_type": "market",
      "stop_loss": 2498.00,
      "tp_level_1": 2502.00,
      "tp_level_1_volume_pct": 50,
      "tp_level_2": 2504.50,
      "tp_level_2_volume_pct": 30,
      "tp_level_3": 2506.00,
      "tp_level_3_volume_pct": 20
    },
    
    "analysis": {
      "trend_context": "UP_CLEAR|DOWN_CLEAR|RANGE|UNCERTAIN",
      "pullback_depth_pct": 1.5,
      "confirmation_pattern": "EMA_CROSS|STRUCTURE_BREAK|...",
      "structure_level_tested": 2500.75,
      "structure_confirmed": true
    },
    
    "consensus": {
      "total_agents": 11,
      "approved_count": 8,
      "approval_threshold": 7,
      "confidence_score": 75,
      "agents_approved": ["Agent1", "Agent2", "..."],
      "agents_rejected": ["Agent3", "..."]
    },
    
    "risk_metrics": {
      "risk_amount_usd": 100,
      "risk_percentage": 1,
      "reward_ratio_estimated": 3.5,
      "position_size": 40,
      "position_size_currency": "units"
    },
    
    "execution_notes": "Text reason for signal",
    "state_diagram": "PENDING → ... → SIGNAL_READY"
  }
}
```

---

## 19. Agentes del Motor (11 Total)

### 19.1 Lista de Agentes Implementados

| # | Agente | Rol | Input | Output |
|---|--------|-----|-------|--------|
| 1 | Market Regime | Detectar tendencia/rango | 1H EMA | Trend/Range |
| 2 | Trend Agent | Validar dirección primary | 1H velas + EMA | UP/DOWN/NEUTRAL |
| 3 | Structure Agent | Analizar máximos/mínimos | 1H últimas 20 velas | Support/Resistance |
| 4 | Momentum Agent | Medir velocidad cambio | RSI, MACD | Strong/Weak |
| 5 | Pullback Agent | Detectar retroceso | 45M contra 1H | Valid/Invalid |
| 6 | Session Agent | Evaluar sesión trading | Hora + histórico | Active/Quiet |
| 7 | News Agent | Evitar news trades | Calendario + precio | Clear/Risky |
| 8 | Risk Manager | Validar SL/TP | Capital + levels | Safe/ToRisky |
| 9 | Confidence Scorer | Calcular certeza general | Todos agentes | 0-100 |
| 10 | Trade Validator | Check pre-entrada | Estado actual | Valid/Invalid |
| 11 | Learning Engine | Análisis histórico | Backtesting stats | Improvement/KeepAs |

### 19.2 Votación

- **Threshold:** 7/11 aprobación para SIGNAL
- **Umbrales alternos:** 8/11 (strict), 9/11 (ultra-strict)
- **Diagnóstico disponible:** Muestra por qué cada agente rechaza

---

## 20. Lista de Pendientes - CARVIPIX v1.1

### 20.1 Reglas Exactas Faltantes

- [ ] **Tendencia 1H:** Criterio exacto (EMA stack, estructura, RSI)
- [ ] **Retroceso 45M:** % mínimo/máximo, invaliding rules
- [ ] **Confirmación 5M:** Trigger exacto (EMA cross, ruptura, etc)
- [ ] **SL Cálculo:** Fórmula (ATR, structure, EMA + buffer)
- [ ] **TP Cálculo:** Fórmula (RR ratio, estructura, ATR)
- [ ] **Score/Confidence:** Cómo combinar agentes → score 0-100
- [ ] **Límites diarios:** Max trades, drawdown, capital
- [ ] **News handling:** Calendario + reglas evitar

### 20.2 Backtesting Requerido

- [ ] Validar XAUUSD 2025 annual (354k velas)
- [ ] Win rate mínimo aceptable
- [ ] Máximo drawdown observable
- [ ] Consistency ratios (profit factor > 1.5)

### 20.3 Documentación Faltante

- [ ] Guía AutoBot integration (futuro)
- [ ] Troubleshooting manual
- [ ] Performance benchmarks
- [ ] Audit trail & compliance

### 20.4 Antes de Operación Real

- [ ] ✅ Especificación v1.0 completa (este documento)
- [ ] ⏳ Implementación v1.1 en código
- [ ] ⏳ Backtesting 6 meses datos reales
- [ ] ⏳ Forward testing 1 mes demo
- [ ] ⏳ Aprobación usuario + legal

---

## 21. Próximos Pasos

### Fase Inmediata (Hoy)
1. ✅ Especificación v1.0 registrada en docs
2. ⏳ Tipos TypeScript creados
3. ⏳ Config archivo CARVIPIX v1.0 creado
4. ⏳ Aviso privado en motor

### Fase v1.1 (Week 1)
1. Definir criterios de tendencia 1H
2. Definir retroceso 45M reglas
3. Definir confirmación 5M trigger
4. Implementar cálculos SL/TP
5. Implementar score/confidence

### Fase Backtesting (Week 2-3)
1. Cargar datos HistData XAUUSD 2025
2. Ejecutar 1000+ backtests
3. Validar win rate > 50%
4. Documentar resultados

### Fase Operación (TBD)
1. Aprobación explícita usuario
2. Demo trading 1 mes
3. Operación real (después aprobación)

---

## 22. Privacidad & Confidencialidad

**Estado:** 🔒 PRIVADO / ADMIN ONLY

- No exponer a cliente durante development
- No documentar en repos públicos
- Alertas solo internas de panel admin
- Backtesting resultados = privados
- AutoBot future = sin operación real todavía

---

## 23. Control de Versión

| Versión | Fecha | Estado | Cambios |
|---------|-------|--------|---------|
| 1.0 | 2026-07-02 | Definition | Especificación inicial, reglas core, pending list |
| 1.1 | TBD | TBD | Reglas exactas, cálculos, backtesting |
| 2.0 | TBD | TBD | AutoBot, operación real |

---

**FIN DE DOCUMENTO**
