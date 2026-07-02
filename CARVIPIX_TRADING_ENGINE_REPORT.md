# 🚀 CARVIPIX Trading Engine - Phase 1 Complete Report

**Fecha:** 2 de Julio, 2026
**Status:** ✅ COMPLETADO Y PUBLICADO
**Hash Commit:** a9143c5
**URL:** http://localhost:3000/engine

---

## 📋 Resumen Ejecutivo

Se ha construido la **CARVIPIX Trading Engine Phase 1**, un motor profesional de decisiones de trading basado en **consenso de 11 agentes especializados**. 

**Filosofía Central:** No hay decisiones solitarias. Cada trade requiere aprobación de 9 de 11 agentes.

---

## 🎯 Configuración Seleccionada

| Parámetro | Valor |
|-----------|-------|
| Ubicación | `/app/engine/` |
| Sistema Puntuación | 0-100 |
| Umbral Consenso | 9 de 11 agentes |
| Confianza Mínima | 70% |
| Dashboard | Motor + Agentes + Estadísticas |

---

## 📊 Estadísticas del Proyecto

```
Tiempo de Build: 3.5 segundos
Rutas Totales: 36/36 (nueva ruta /engine agregada)
Errores TypeScript: 0
Líneas de Código: ~2,500
Archivos Creados: 9
Componentes React: 2
Estados de Alerta: 7
Agentes de Análisis: 11
Escenarios Demo: 3
```

---

## 📁 Estructura de Archivos Creados

### 1. **app/engine/types/index.ts** (100 líneas)
**Propósito:** Definiciones de tipos TypeScript

**Tipos Principales:**
- `AgentScore` - Puntuación de agente (score, reasoning, confidence)
- `ConsensusResult` - Resultado de votación (approved/rejected/pending)
- `TradeAlert` - Alerta de trade con 7 estados
- `AlertState` - Union type: 'activa' | 'tp' | 'sl' | 'breakeven' | 'cancelada' | 'caducada' | 'pendiente'
- `DecisionLogEntry` - Registro de cada decisión tomada
- `TradeSignal` - Señal preparada para votación
- `EngineMetrics` - Métricas de desempeño
- `EngineState` - Estado completo del motor
- `EngineConfig` - Configuración del motor
- `TradeOutcome` - Resultado de trade cerrado

**Uso:**
```typescript
import { TradeAlert, ConsensusResult, AgentScore } from '@/app/engine/types';
```

---

### 2. **app/engine/core/engine.ts** (250 líneas)
**Propósito:** Motor central de decisiones

**Clase Principal: CARVIPIXEngine**

**Métodos:**
```typescript
constructor(config?: Partial<EngineConfig>)
evaluateConsensus(agentScores: AgentScore[]): ConsensusResult
createAlert(signal: TradeSignal): TradeAlert | null
updateAlertState(alertId: string, newState: AlertState): boolean
getState(): EngineState
getAlerts(): TradeAlert[]
getActiveAlerts(): TradeAlert[]
getDecisionLog(): DecisionLogEntry[]
reset(): void
```

**Lógica de Consenso:**
```
IF approvals >= 9 AND confidence >= 70%
  → APPROVED (crear alerta)
ELSE IF rejections >= 2 OR confidence < 70%
  → REJECTED (no operar)
ELSE
  → PENDING (esperar claridad)
```

**Features:**
- ✅ Votación de agentes
- ✅ Cálculo de confianza promedio
- ✅ Logging automático de decisiones
- ✅ Gestión de ciclo de vida de alertas
- ✅ Tracking de métricas en tiempo real
- ✅ Singleton exportado: `export const engine = new CARVIPIXEngine()`

---

### 3. **app/engine/agents/index.ts** (600 líneas)
**Propósito:** 11 agentes especializados de análisis

**Los 11 Agentes:**

#### 1. **Market Regime Analyst** - analyzeMarketRegime()
- Evalúa: condiciones de mercado (trending vs ranging)
- Entrada: symbol, atr, volatility, trend
- Score: 25 puntos si trending fuerte, -20 si choppy
- Confidence: 80% si trending, 40% si choppy

#### 2. **Trend Analyst** - analyzeTrend()
- Evalúa: dirección y fuerza de tendencia
- Entrada: ema20, ema50, ema200, price, direction
- Score: 85 si golden/death cross alineados
- Verdicts: "Strong uptrend", "Downtrend present", etc.

#### 3. **Structure Analyst** - analyzeStructure()
- Evalúa: soportes, resistencias, breakouts
- Entrada: price, resistance, support, breakout
- Score: 80 si breakout confirmado
- Mide: distancia a niveles clave

#### 4. **Momentum Analyst** - analyzeMomentum()
- Evalúa: RSI, MACD, momentum indicators
- Entrada: rsi, macdHistogram, momentum
- Score: +20 si strong_bullish, -20 si strong_bearish
- Status RSI: "Oversold", "Overbought", "Bullish zone"

#### 5. **Pullback Analyst** - analyzePullback()
- Evalúa: oportunidades de pullback
- Entrada: isPullback, pullbackDepth, trend
- Score: 70+ si pullback < 25%
- Verdicts: "Shallow pullback", "Normal pullback", "Deep pullback"

#### 6. **Session Analyst** - analyzeSession()
- Evalúa: sesión de trading actual
- Entrada: currentSession ('asian'|'european'|'us'|'overlap')
- Score: 80 si overlap (alta volatilidad esperada)
- Score: 70 si european/us, 55 si asian

#### 7. **News Analyst** - analyzeNews()
- Evalúa: noticias fundamentales, eventos
- Entrada: hasMajorNews, newsImpact, volatilityExpected
- Score: 70 si sin noticias mayores
- Score: 35-65 si hay noticias (según impacto)
- Warnings: Volatilidad esperada si news importante

#### 8. **Risk Manager** - analyzeRisk()
- Evalúa: ratio Risk/Reward, sizing
- Entrada: entryPrice, stopLossPrice, takeProfitPrice, accountRisk
- Score: 85 si RR >= 2.0
- Score: 75 si RR >= 1.5
- Score: 20 si RR < 1.0
- Warnings: Si account risk > 3%

#### 9. **Confidence Scoring** - scoreConfidence()
- Meta-análisis de confianza de otros agentes
- Entrada: agentAgreement, dataQuality, marketConditions, timeframe
- Ajusta: +15 si data alta, -20 si data baja
- Penalidad: -25 si chaotic conditions, -10 si unusual

#### 10. **Trade Validator** - validateTrade()
- Validación final antes de trade
- Entrada: hasAllRequiredData, noFundamentalEvents, priceActionClean
- Score: 50-100 basado en checks
- Warnings: Si falta datos o price action unclear

#### 11. **Learning Engine** - learnFromHistory()
- Adapta según desempeño histórico
- Entrada: winRate, totalTrades, profitFactor, recentPerformance
- Score: 80 si win rate > 60%
- Score: 70 si win rate > 55%
- Penalidad: -15 si profit factor < 0.8

**Cada Agente Retorna:**
```typescript
{
  agent: AgentType,
  score: number,           // 0-100
  reasoning: string,       // Explicación en inglés
  confidence: number,      // 0-100
  keyMetrics?: Record<string, any>,
  timestamp: number
}
```

---

### 4. **app/engine/demo/scenarios.ts** (400 líneas)
**Propósito:** Datos realistas de demostración

**Tres Escenarios Completos:**

#### Scenario 1: EUR/USD Bullish Setup ✅
```
Symbol: EURUSD
Type: COMPRA (Buy)
Timeframe: 4H
Entry: 1.0960
TP: 1.1060
SL: 1.0880
RR: 2.0:1
Agentes Aprobados: 8/11
Consensus Score: 82/100
Confidence: 85%
```
**Razonamiento:**
- Strong uptrend (EMA20 > 50 > 200)
- Pullback 15% en soporte
- Momentum bullish, RSI 45
- No hay noticias mayores
- Excelente RR 2:1
- **Resultado:** APPROVED ✅

---

#### Scenario 2: GBP/USD Overbought ❌
```
Symbol: GBPUSD
Type: COMPRA
Timeframe: 1H
Entry: 1.2795
TP: 1.2850
SL: 1.2750
RR: 1.0:1
Agentes Aprobados: 2/11
Consensus Score: 48/100
Confidence: 38%
```
**Razonamiento:**
- RSI overbought 72
- Precio en resistencia 1.2800
- No hay pullback
- Noticias negativas (volatilidad esperada)
- Poor RR 1:1
- Desempeño reciente declinando
- **Resultado:** REJECTED ❌

---

#### Scenario 3: Gold (XAUUSD) Downtrend ✅
```
Symbol: XAUUSD
Type: VENTA (Short)
Timeframe: D (Diario)
Entry: 1968
TP: 1920
SL: 1985
RR: 2.27:1
Agentes Aprobados: 9/11
Consensus Score: 80/100
Confidence: 82%
```
**Razonamiento:**
- Strong downtrend (EMA20 < 50 < 200)
- Clean breakout bajo estructura
- Death cross alineado
- Momentum bearish, RSI 35
- Session overlap (alta liquidez)
- Excelente RR 2.27:1
- **Resultado:** APPROVED ✅

---

### 5. **app/engine/utils/formatting.ts** (200 líneas)
**Propósito:** Utilidades de formato y presentación

**Funciones Principales:**

```typescript
formatAgentScore(agent: AgentScore) 
  → { displayScore, statusBadge, confidence }

getAgentScoreColor(score: number) 
  → "#10B981" (verde) | "#fbbf24" (amarillo) | "#EF4444" (rojo)

formatDecisionEntry(entry: DecisionLogEntry) 
  → { id, timestamp, signal, outcome, approvalRate, confidence, reason }

generateConsensusReport(symbol, agentScores, outcome) 
  → Reporte de texto completo con todos los agentes

calculatePerformanceMetrics(successfulTrades, failedTrades)
  → { winRate, totalTrades, riskRewardAvg }

filterDecisionLog(log, filters)
  → Filtra por symbol, outcome, timeframe

exportDecisionLogAsCSV(log)
  → CSV descargable con historial de decisiones

getEngineStatusSummary(metrics)
  → Resumen de estado actual del motor
```

---

### 6. **app/engine/components/AgentConsensus.tsx** (150 líneas)
**Propósito:** Visualización del consenso de agentes

**Component: AgentConsensus**

Props:
```typescript
{
  agents: AgentScore[],
  outcome: 'approved' | 'rejected' | 'pending'
}
```

Renders:
- Grid de agentes ordenados por score descendente
- Cada agente muestra:
  - ✅/❌/◐ ícono según score
  - Nombre del agente
  - Score 0-100
  - Barra de progreso animada
  - Reasoning (2 líneas max)
  - Confidence %
- Summary box con conteos (Approvals, Neutral, Rejections)
- Animaciones Framer Motion

**Colores:**
- Verde (#10B981): score >= 70
- Amarillo (#fbbf24): 60-69
- Gris (#666666): 40-59
- Naranja (#f97316): 30-39
- Rojo (#EF4444): < 30

---

### 7. **app/engine/components/EngineHub.tsx** (500 líneas)
**Propósito:** Dashboard principal del motor

**Component: EngineHub**

**3 Pestañas Principales:**

#### Tab 1: Overview 📊
- Engine Status section
  - Status: "Running" (online badge)
  - Agents: 11/11
  - Consensus Rule: 9 of 11
  - Confidence Min: 70%
- 4 Metric Cards
  - Total Alerts (con activos)
  - Successful (win rate)
  - Failed (count)
  - Consensus (approval rate)
- System Architecture info
  - 11 Agents listed
  - Decision Engine features
  - Analysis components

#### Tab 2: Alerts 🚨
- Lista de alertas activas
- Para cada alerta muestra:
  - Symbol + tipo (COMPRA/VENTA)
  - Entry/TP/SL prices
  - Risk/Reward ratio
  - Reasoning
  - Click para ver detalles
- Empty state si no hay alertas

#### Tab 3: Decisions 📋
- Log de últimas 10 decisiones (reverse order)
- Para cada decisión:
  - Ícono de estado (✅/❌)
  - Symbol + tipo + timeframe
  - Aprobaciones count (9/11)
  - Confidence %
  - Timestamp
  - Click para expandir

#### Demo Scenarios Modal
- 3 botones: Scenario 1, 2, 3
- Muestra:
  - Setup Details (reasoning)
  - Agent Consensus Analysis (AgentConsensus component)
  - Trade Signal details
  - Cerrable con X o click en backdrop

**Features:**
- ✅ Animaciones Framer Motion en todos lados
- ✅ Tema CARVIPIX oscuro/dorado
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Real-time updates cada 2 segundos
- ✅ Lucide React icons

---

### 8. **app/engine/page.tsx** (20 líneas)
**Propósito:** Ruta /engine del sitio

```typescript
import { EngineHub } from '../engine/components/EngineHub';

export const metadata = {
  title: 'CARVIPIX Trading Engine | Professional Analysis System',
  description: 'CARVIPIX Trading Engine Phase 1: 11 Agent Consensus Decision System',
};

export default function EnginePagePage() {
  return <EngineHub />;
}
```

---

### 9. **app/engine/README.md** (400 líneas)
**Propósito:** Documentación completa del motor

Contiene:
- Descripción general
- 11 Agentes detallados
- Motor de decisión explicado
- 7 Estados de alerta
- Dashboard overview
- Estructura del proyecto
- Principios clave (qué sí, qué no)
- Métricas rastreadas
- Learning engine
- Features de seguridad
- Fases futuras (Phase 2, 3, 4)
- Ejemplos de uso
- Preguntas frecuentes

---

## 🔧 Cómo Funciona el Motor

### Flujo de Decisión Completo

```
1. ENTRADA: TradeSignal con precio, SL, TP
   ↓
2. EVALUACIÓN: 11 agentes analizan independientemente
   - Market Regime Analyst
   - Trend Analyst
   - Structure Analyst
   - Momentum Analyst
   - Pullback Analyst
   - Session Analyst
   - News Analyst
   - Risk Manager
   - Confidence Scoring
   - Trade Validator
   - Learning Engine
   ↓
3. CONSENSO: evaluateConsensus()
   IF approvals >= 9 AND confidence >= 70%
     → APPROVED
   ELSE IF rejections >= 2 OR confidence < 70%
     → REJECTED
   ELSE
     → PENDING
   ↓
4. ACCIÓN: Si APPROVED
   → createAlert()
   → alertState = 'activa'
   → logDecision()
   → updateMetrics()
   ↓
5. GESTIÓN: Mientras active
   → updateAlertState('tp' | 'sl' | 'cancelada')
   → trackProfit/Loss
   → updateMetrics()
   ↓
6. LOGGING: Registro completo
   - DecisionLogEntry con timestamp
   - Todos los agentes scores
   - Razonamiento completo
   - Alerta creada (o por qué rechazada)
```

---

## 📊 Estados de Alerta (7 Total)

| Estado | Código | Significado |
|--------|--------|-------------|
| **activa** | 🟢 | Alerta activa, esperando TP o SL |
| **tp** | ✅ | Take Profit ejecutado (ganancia) |
| **sl** | ❌ | Stop Loss ejecutado (pérdida) |
| **breakeven** | ⏸️ | Movida a breakeven |
| **cancelada** | 🚫 | Cancelada manualmente |
| **caducada** | ⏰ | Expirada (7 días default) |
| **pendiente** | ⏳ | Esperando aprobación del consenso |

---

## 🎯 Reglas de Consenso

### Umbral de Aprobación: 9 de 11 agentes

```
Approvals >= 9 ✓
Confidence >= 70% ✓
→ APPROVED (crear alerta)

Approvals < 9 ✗ OR Confidence < 70% ✗
→ REJECTED (no operar)

3-8 Approvals + 40-70% Confidence
→ PENDING (esperar más claridad)
```

### Por qué 9 de 11?

- 70+ es mayoría clara pero no unanimidad
- Evita sesgo de un solo agente
- Permite cierta diversidad de opinión
- Professional threshold para decisiones importantes

### Por qué 70% de confianza mínima?

- Conservative approach
- Si no hay seguridad, no se opera
- Mejor perder opportunity que operar mal

---

## 📈 Métricas Rastreadas

```typescript
EngineMetrics = {
  totalAlertsGenerated: number,      // Todas las alertas creadas
  activeAlerts: number,               // Alertas en estado 'activa'
  closedAlerts: number,               // Total de alertas cerradas
  successfulTrades: number,           // Trades con TP ejecutado
  failedTrades: number,               // Trades con SL ejecutado
  averageWinRate: number,             // % sucessful/total
  averageRiskReward: number,          // RR promedio
  consensusApprovalRate: number,      // % de signals aprobadas
  lastDecisionTime: number            // Timestamp última decisión
}
```

---

## 🎨 Diseño & Temas

### Colores CARVIPIX
- **Background:** #05070B (muy oscuro)
- **Cards:** #0B111A (oscuro)
- **Primary Accent:** #D4AF37 (dorado)
- **Success:** #10B981 o #00D084 (verde)
- **Error:** #EF4444 o #ff6b6b (rojo)
- **Warning:** #fbbf24 (amarillo)
- **Borders:** white/10 (casi invisible)

### Componentes
- ✅ Framer Motion animaciones suaves
- ✅ Lucide React icons (30+ usados)
- ✅ Tailwind CSS responsive
- ✅ Mobile-first design
- ✅ Accesibilidad considerada

---

## 🚀 Instalación y Uso

### Acceder al Motor
```
URL: http://localhost:3000/engine
```

### Usar en Código
```typescript
import { CARVIPIXEngine } from '@/app/engine/core/engine';
import { getDemoScenarios } from '@/app/engine/demo/scenarios';

// Crear motor
const engine = new CARVIPIXEngine({
  consensusThreshold: 9,
  confidenceThreshold: 70,
});

// Evaluar escenario demo
const scenario = getDemoScenarios().scenario1;
const consensus = engine.evaluateConsensus(scenario.agents);

// Crear alerta si aprobado
if (consensus.outcome === 'approved') {
  const alert = engine.createAlert(scenario.signal);
  console.log(`Alert: ${alert.id}`);
}

// Ver estado
const state = engine.getState();
console.log(`Active: ${state.metrics.activeAlerts}`);
```

---

## 🔒 Características de Seguridad

1. **No hay decisiones solitarias**
   - Siempre necesita 9/11 votación

2. **Alto threshold de confianza**
   - 70% mínimo requerido
   - Si no hay seguridad, NO se opera

3. **Risk Management integrado**
   - Risk Manager evalúa cada trade
   - RR debe ser favorable (2:1 preferiblemente)
   - Account risk evaluado

4. **Auditoría completa**
   - Cada decisión registrada
   - Todos los scores guardados
   - Reasoning completo disponible
   - Exportable como CSV

5. **Validación final**
   - Trade Validator hace checks finales
   - Confirma datos presentes
   - Detecta eventos fundamentales

6. **Expiración de alertas**
   - Máximo 7 días de vida
   - Previene órdenes olvidadas
   - Auto-cleanup del sistema

---

## 📊 Archivos de Estadísticas

### Build Output
```
✓ Compiled successfully in 3.5s
✓ Finished TypeScript in 4.0s
✓ Collecting page data using 31 workers in 996ms
✓ Generating static pages using 31 workers (36/36) in 415ms
✓ Finalizing page optimization in 10ms

Total Routes: 36 (nueva ruta /engine agregada)
Errors: 0
Warnings: 0
```

### Git Commit
```
Hash: a9143c5
Message: "Inicia CARVIPIX Trading Engine Fase 1: Motor profesional de consenso con 11 agentes"
Files Changed: 9
Insertions: 2,746
Deletions: 0
Status: ✅ Pushed to origin/main
```

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Evaluar una señal
```typescript
const signal = {
  symbol: 'EURUSD',
  type: 'compra',
  entryPrice: 1.0960,
  stopLossPrice: 1.0880,
  takeProfitPrice: 1.1060,
  // ... resto de datos
};

const consensus = engine.evaluateConsensus(agentScores);

if (consensus.outcome === 'approved') {
  console.log(`✅ Signal approved: ${consensus.approvalCount}/11 agents`);
  console.log(`Confidence: ${consensus.overallConfidence.toFixed(1)}%`);
} else {
  console.log(`❌ Signal rejected`);
  console.log(`Reason: ${consensus.reasonForDecision}`);
}
```

### Ejemplo 2: Ver log de decisiones
```typescript
const log = engine.getDecisionLog();

log.forEach(entry => {
  console.log(`
    ${entry.symbol} ${entry.type.toUpperCase()}
    Outcome: ${entry.consensus.outcome}
    Approvals: ${entry.consensus.approvalCount}/11
    Confidence: ${entry.consensus.overallConfidence}%
    Timestamp: ${new Date(entry.timestamp).toLocaleString()}
  `);
});
```

### Ejemplo 3: Actualizar estado de alerta
```typescript
const alerts = engine.getAlerts();
const firstAlert = alerts[0];

// Simular que TP fue ejecutado
engine.updateAlertState(firstAlert.id, 'tp');

// Actualizar métricas
const state = engine.getState();
console.log(`Win rate: ${state.metrics.averageWinRate.toFixed(1)}%`);
console.log(`Active alerts: ${state.metrics.activeAlerts}`);
```

---

## 🔮 Fases Futuras

### Fase 1: COMPLETO ✅
- ✅ 11 Agentes implementados
- ✅ Motor de consenso 9/11
- ✅ Demo dashboard funcional
- ✅ 7 Estados de alerta
- ✅ Decision logging completo

### Fase 2: Real Data Integration ⏳
- API de precios en tiempo real
- Indicators reales (RSI, MACD, EMAs)
- News feeds integrados
- Economic calendar
- Datos históricos para backtesting

### Fase 3: Automated Execution ⏳
- MT4/MT5 bridge
- Ejecución automática de trades
- Gestión de posiciones
- Stop loss y take profit automáticos
- Real profit/loss tracking

### Fase 4: Advanced Learning ⏳
- Machine Learning en agentes
- Pesos adaptativos por performance
- Detección de patrones ganadores
- Optimización de parámetros
- Multi-pair portfolio analysis

---

## 🎯 Lo Que Hace Especial Este Motor

### 1. Transparencia Total
- Cada decisión explicada
- Todos los agentes visibles
- Reasonings completos
- Scores publicados

### 2. Sin Sesgo
- 11 agentes independientes
- Decisión matemática (9/11)
- Sin emoción humana
- Sin trades "hunch"

### 3. Conservador
- Threshold alto (70% confianza)
- Si no hay ventaja clara, NO se opera
- RR evaluado siempre
- Risk manager integrado

### 4. Profesional
- Arquitectura enterprise-ready
- TypeScript seguro
- Componentes React modernos
- Escalable para Phase 2

### 5. Demostrable
- 3 escenarios realistas
- Métricas en tiempo real
- Dashboard profesional
- Auditable completamente

---

## ⚠️ Lo Que NO Hace (Todavía)

- ❌ Conectar a MT4/MT5 (Fase 2)
- ❌ Ejecutar trades automáticos (Fase 3)
- ❌ Gestionar capital en vivo
- ❌ Prometer ganancias
- ❌ Usar datos reales (Fase 2)
- ❌ Machine learning (Fase 4)

---

## 📝 Notas Importantes

### Consenso, No Democracia
- 9 de 11 es mayoría CLARA, no simple
- Evita indecisión
- Evita cambios frecuentes
- Professional threshold

### Confianza > Cantidad
- 70% confianza mínima
- Mejor perder oportunidad que operar mal
- Quality over quantity en señales
- Histórico de performance considerado

### Explicabilidad
- Cada agente explica su score
- Razonamiento disponible siempre
- CSV exportable para auditoría
- Trazabilidad completa

### Seguridad Primera
- Risk Manager en cada decisión
- RR evaluado obligatoriamente
- News awareness integrado
- Session awareness integrado

---

## 🏆 Resumen Final

**CARVIPIX Trading Engine Phase 1** es un motor profesional de trading basado en consenso que:

✅ Analiza mercados con 11 agentes especializados
✅ Toma decisiones solo si hay mayoría clara (9/11)
✅ Mantiene confianza alta (70% mínimo)
✅ Evalúa riesgo en cada trade
✅ Registra cada decisión con razonamiento completo
✅ Usa datos demo realistas
✅ Dashboard profesional funcional
✅ Código TypeScript seguro
✅ Listo para conectar datos reales (Phase 2)
✅ Preparado para ejecución automática (Phase 3)

---

## 📞 Acceso

**URL del Motor:** http://localhost:3000/engine
**Código Fuente:** `/app/engine/`
**Documentación Completa:** `/app/engine/README.md`
**Commit Hash:** a9143c5
**Estado:** ✅ PUBLICADO EN GITHUB

---

**Creado:** 2 de Julio, 2026
**Version:** 1.0.0 (Phase 1)
**Status:** ✅ COMPLETADO Y FUNCIONANDO
**Próxima Fase:** Integración de datos reales (Fase 2)

---

*"No single agent decides. Consensus only. Always explain why."* - CARVIPIX Trading Engine Philosophy
