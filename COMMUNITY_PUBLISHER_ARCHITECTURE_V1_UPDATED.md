# COMMUNITY PUBLISHER V1 — ARQUITECTURA DEFINITIVA CONSOLIDADA

**Documento Fundacional**  
**Versión**: 1.1 (Post-Auditoría)  
**Estado**: Listo para Contrato  
**Fecha**: 2026-07-14  
**Metodología**: Arquitectura ✅ → Contrato (próximo) → Auditoría → Implementación → Certificación → Congelamiento

---

## TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura General](#arquitectura-general)
3. [Tipos de Publicaciones](#tipos-de-publicaciones)
4. [Sistema de Filtros Completado](#sistema-de-filtros-completado)
5. [Cola de Prioridades](#cola-de-prioridades)
6. [Política de Silencio](#política-de-silencio)
7. [Límite de Promoción (20%)](#límite-de-promoción-máximo-20)
8. [Biblioteca de Variantes](#biblioteca-de-variantes)
9. [Calendario Editorial](#calendario-editorial)
10. [Community Scheduler (ACTUALIZADO)](#community-scheduler-actualizado)
11. [Sistema de Campañas](#sistema-de-campañas)
12. [Tracking Interno de Conversiones](#tracking-interno-de-conversiones)
13. [Integración Telegram](#integración-telegram)
14. [Panel Administrativo (8 módulos)](#panel-administrativo)
15. [Seguridad](#seguridad)
16. [Escalabilidad](#escalabilidad)
17. [Restricciones de Diseño](#restricciones-de-diseño)

---

## VISIÓN GENERAL

**Community Publisher es el sistema responsable de mantener viva la comunidad oficial de CARVIPIX de forma automática, profesional y sin parecer spam.**

**No es un bot de señales.**  
**No toma decisiones de trading.**  
**No duplica inteligencia del Observador V3.**

**Es el escaparate profesional de CARVIPIX.**

Cualquier persona que entre al canal debe sentir inmediatamente que existe un sistema profesional trabajando detrás.

### Principios Fundamentales

- ✅ **Consumidor Puro**: Community Publisher solo consume eventos del Disparador, nunca modifica decisiones del Observador
- ✅ **Autenticidad**: Todo lo publicado proviene de datos reales del Observador Maestro V3
- ✅ **Profesionalismo**: Cada mensaje está cuidadosamente diseñado, nunca parece spam
- ✅ **Valor Primero**: Si no hay valor, no publica (Política de Silencio)
- ✅ **Confianza**: Cada publicación es verificable contra datos reales
- ✅ **Automatización**: Cero intervención manual en decisiones de publicación
- ✅ **Medición**: Tracking de conversión real (registro, pago) desde Telegram a CARVIPIX
- ✅ **Escalabilidad**: Soporta desde 100 hasta 100,000 miembros sin degradación

---

## ARQUITECTURA GENERAL

### Flujo de Información (High Level)

```
┌──────────────────────────────────────────┐
│    OBSERVADOR MAESTRO V3                 │
│ (Expediente + ChatGPT + Paper Trading)   │
└────────────────┬─────────────────────────┘
                 │
         ┌───────▼──────────┐
         │   DISPARADOR     │
         │  9 tipos evento  │
         └───────┬──────────┘
                 │
    ┌────────────▼───────────────┐
    │ COMMUNITY PUBLISHER ENGINE  │
    │                             │
    │ 1. Event Processor          │
    │ 2. Filter Pipeline (6x)     │
    │ 3. Content Generator        │
    │ 4. Priority Queue Manager   │
    │ 5. Community Scheduler      │
    │    - Reactivo (Disparador)  │
    │    - Proactivo (Calendar)   │
    │    - Campañas               │
    │ 6. State Manager            │
    │ 7. Tracking Service         │
    └────────────┬────────────────┘
                 │
         ┌───────▼──────────┐
         │ TELEGRAM API     │
         │ Oficial          │
         └───────┬──────────┘
                 │
         ┌───────▼──────────┐
         │ CANAL OFICIAL    │
         │ COMUNIDAD        │
         └──────────────────┘
                 │
         ┌───────▼──────────┐
         │ URLs Únicas      │
         │ Con Tracking ID  │
         └───────┬──────────┘
                 │
    ┌────────────▼────────────────┐
    │ LANDING PAGE CARVIPIX       │
    │ (Captura clic)              │
    │                             │
    │ Tracking Events:            │
    │ - Visita                    │
    │ - Registro iniciado         │
    │ - Registro completado       │
    │ - Compra iniciada           │
    │ - Pago aprobado             │
    └─────────────────────────────┘
```

### Componentes Principales (7 módulos + persistencia)

#### 1. **Event Processor**
- Escucha Disparador (9 tipos de eventos)
- Identifica tipo: ANÁLISIS_COMPLETADO, PAPER_TRADE_CERRADO, etc
- Extrae datos relevantes
- Enruta al Filter Pipeline

#### 2. **Filter Pipeline** (6 filtros secuenciales)
- **Filtro 1**: Type Check (¿publicable este tipo?)
- **Filtro 2**: Time Check (¿es la hora adecuada?)
- **Filtro 3**: Daily Limits + Promotional Ratio (¿cuota disponible?)
- **Filtro 4**: Quality Gate + Value Score (¿tiene valor?)
- **Filtro 5**: Duplicate Detection (¿ya publicado?)
- **Filtro 6**: Fraud/Security Check (¿seguro publicar?)

Si pasa todos → entra a Queue de Prioridades

#### 3. **Content Generator**
- Toma evento validado
- Selecciona variante de template (random/round-robin)
- Genera URL única con tracking IDs
- Compone mensaje Markdown final
- Registra en persistencia

#### 4. **Priority Queue Manager**
- Mantiene cola ordenada por prioridades (1-8)
- Si dos eventos tienen misma prioridad, FIFO
- Respeta Daily Limits y Promotional Ratio
- Elige siguiente evento a publicar

#### 5. **Community Scheduler** (Dual Mode)
- **Modo Reactivo**: Responde a eventos del Disparador
  - Chequea Priority Queue cada 5 minutos
  - Publica el evento de más alta prioridad si pasa filtros
  - Respeta Política de Silencio (ACTIVE/SLOW/DORMANT)

- **Modo Proactivo**: Genera contenido planificado
  - Calendario Editorial: contenido semanal predefinido
  - Campañas: fases multi-día con gating
  - Chequea diariamente qué ejecutar

#### 6. **State Manager**
- Mantiene estado del canal (ACTIVE/SLOW/DORMANT)
- Calcula ratios (promoción %, contenido por tipo)
- Reseta contadores a medianoche UTC
- Auditoría de todas las decisiones

#### 7. **Tracking Service**
- Genera URLs únicas con: publication_id, campaign_id, content_type, source
- Recibe webhooks de landing page
- Registra: clic, visita, registro, compra, pago
- Correlaciona con publicación de origen
- Calcula conversión por tipo

---

## TIPOS DE PUBLICACIONES

### 9 Tipos Publicables

| # | Tipo | Origen | Frecuencia | Destino |
|---|------|--------|-----------|---------|
| 1 | **FREE_ALERT** | Observador V3 | Máx 2/día | Telegram + Dashboard |
| 2 | **TRADE_RESULT** | Paper Trading | Cualquiera | Telegram + Dashboard |
| 3 | **MARKET_STATUS** | Observador V3 | Cualquiera | Telegram + Dashboard |
| 4 | **OPORTUNIDAD_EN_DESARROLLO** | Observador V3 | Cualquiera | Telegram + Dashboard |
| 5 | **EDUCACIÓN** | Sistema | Máx 2/día | Telegram + Dashboard |
| 6 | **ACTIVIDAD_DEL_SISTEMA** | Logs internos | Cualquiera | Dashboard (no Telegram) |
| 7 | **PROMOCIÓN** | Sistema | Máx 20% contenido | Telegram + Dashboard |
| 8 | **BIENVENIDA** | Nuevos miembros | Una vez/usuario | Telegram DM |
| 9 | **ANUNCIOS_ESPECIALES** | Admin | Manual | Telegram + Dashboard |

### Contrato de Cada Tipo

**FREE_ALERT**
```
Origen: Observador V3 (decision = "ENTER_BUY" o "ENTER_SELL")
Frecuencia: Máximo 2 por día
Template: [Ver Plantillas Oficiales]
Propiedades: instrument, timeframe, probability, entry_price, stop_loss
Destino: Telegram público + Dashboard
Conversión: Clic en botón → Landing → Seguimiento
```

**TRADE_RESULT**
```
Origen: Paper Trading Monitor (trade cerrado)
Frecuencia: Sin límite (solo si hay trades)
Template: [Ver Plantillas Oficiales]
Propiedades: instrument, entry_price, exit_price, P&L, duration
Destino: Telegram + Dashboard
Conversión: Clic → Landing → "Ver más resultados"
```

**[Ver documento de Contrato para otros 7 tipos]**

---

## SISTEMA DE FILTROS COMPLETADO

### Flujo de Validación

```
Evento → F1: Type ─→ F2: Time ─→ F3: Limits + Promo% ─→ F4: Quality 
                                                            │
                                              ┌─────────────▼─────────────┐
                                              │                           │
                                         F5: Duplicate ─→ F6: Security ─┐
                                              │                         │
                                         RECHAZA                        │
                                              │                         │
                                              │                    ACEPTA
                                              │                         │
                                              └─────────────┬───────────┘
                                                            │
                                                    → Queue Prioridades
```

### F1: Type Check
- Valida: ¿Este tipo es publicable?
- Rechaza si: No existe en lista de 9 tipos
- Rechaza si: Admin deshabilitó ese tipo

### F2: Time Check
- Valida: ¿Es la hora adecuada?
- Rechaza si: Fuera de horario Telegram (8:00 - 22:00 UTC)
- Rechaza si: Fin de semana sin eventos críticos

### F3: Daily Limits + Promotional Ratio
```typescript
tipo FREE_ALERT: máximo 2/día
tipo EDUCACIÓN: máximo 2/día
tipo PROMOCIÓN: máximo 20% del contenido total

Cálculo diario:
  contentByType = {
    value: count(FREE_ALERT + TRADE_RESULT + MARKET_STATUS + EDUCACIÓN),
    operational: count(OPORTUNIDAD + ACTIVIDAD),
    promotional: count(PROMOCIÓN + BIENVENIDA)
  }
  
  totalDaily = sum(contentByType)
  promotionalRatio = contentByType.promotional / totalDaily
  
  if (promotionalRatio >= 0.20) {
    rechaza próximas PROMOCIONES
  }
```

### F4: Quality Gate (Value Score)
- Calcula un score 0-100 basado en:
  - Probability (para alertas)
  - Volatilidad (para market status)
  - Duración trade (para results)
  - Engagement esperado
  
- Rechaza si score < 30

### F5: Duplicate Detection
- Revisa últimas 12 horas de publicaciones
- Si existe mensaje similar (>80% match), rechaza
- Permite repetir tipo diferente sobre mismo instrumento

### F6: Fraud/Security Check
- Valida: ¿Es seguro publicar esto?
- Rechaza si contiene: Prompts, API keys, análisis privado, rutas, credenciales
- Valida tokens de tracking
- Verifica URLs no sean malicious

---

## COLA DE PRIORIDADES

### Sistema de 8 Niveles

```
PRIORIDAD | TIPO                    | DESCRIPCIÓN
-----------|------------------------|----------------------------------
1 (MAX)    | FREE_ALERT             | Alerta de entrada con probability > 70%
2          | TRADE_RESULT           | Resultado de operación cerrada
3          | MARKET_STATUS          | Estado del mercado con news importante
4          | OPORTUNIDAD_EN_DESARROLLO | Nivel técnico interesante
5          | EDUCACIÓN              | Contenido educativo planeado
6          | ACTIVIDAD_DEL_SISTEMA  | Logs internos (baja visibilidad)
7          | PROMOCIÓN              | Contenido promocional
8 (MIN)    | BIENVENIDA             | Mensaje de bienvenida
```

### Ordering Logic

```typescript
interface PublicationInQueue {
  id: string;
  type: string;
  priority: 1-8;           // 1 = máxima
  timestamp: Date;         // cuándo llegó al sistema
  content: string;
  destinations: string[];
  status: "pending" | "scheduled" | "published" | "failed";
  attempts: number;
}

// Ordenamiento:
// 1. Por prioridad (ascendente: 1 → 8)
// 2. Si misma prioridad, por timestamp (FIFO)
// 3. Scheduler ejecuta cada 5 min: publica TOP 1 si pasa filtros

nextToPublish = queue.sort(
  (a, b) => a.priority - b.priority || a.timestamp - b.timestamp
)[0]
```

---

## POLÍTICA DE SILENCIO

### Estados del Canal

```
ESTADO   | TIEMPO SIN PUBLICAR | COMPORTAMIENTO
---------|-------------------|--------------------------------------------------
ACTIVE   | < 4 horas          | Publica normal (respeta prioridades y límites)
SLOW     | 4-12 horas         | Solo VALOR (alertas, resultados, educación)
         |                    | Rechaza: ACTIVIDAD, BIENVENIDA
DORMANT  | > 12 horas         | Solo emergencias (FREE_ALERT con prob > 80%)
         |                    | O espera a medianoche para reset
```

### Cálculo de "Valor"

```
VALUE = verdadero para:
  ✅ FREE_ALERT (probability > 70%)
  ✅ TRADE_RESULT (cualquier resultado)
  ✅ MARKET_STATUS (si hay volatilidad > 2% o news)
  ✅ EDUCACIÓN

VALUE = falso para:
  ❌ ACTIVIDAD_DEL_SISTEMA
  ❌ BIENVENIDA
  ❌ PROMOCIÓN (excepto en ACTIVE)
```

### Ejemplo

```
14:00 UTC - Última publicación: "FREE_ALERT EURUSD"
18:00 UTC - Diferencia: 4 horas → Estado SLOW
           - Nuevo evento: EDUCACIÓN
           - Acción: PERMITE (es VALOR)

22:00 UTC - Diferencia: 8 horas → Estado SLOW
           - Nuevo evento: PROMOCIÓN
           - Acción: RECHAZA (no es VALOR en SLOW)

04:00 UTC (día siguiente) - Diferencia: 14 horas → Estado DORMANT
                          - Nuevo evento: FREE_ALERT con prob 78%
                          - Acción: PERMITE (prob > 80% en DORMANT? No.
                            Requiere > 80%)
                          - Nuevo evento: FREE_ALERT con prob 82%
                          - Acción: PERMITE (emergencia)

00:00 UTC - Medianoche UTC → Reset de estado a ACTIVE
```

---

## LÍMITE DE PROMOCIÓN (Máximo 20%)

### Cálculo Diario

```typescript
// Cada tipo tiene categoría:
const contentCategory = {
  FREE_ALERT: "VALUE",
  TRADE_RESULT: "VALUE",
  MARKET_STATUS: "VALUE",
  OPORTUNIDAD: "OPERATIONAL",
  ACTIVIDAD: "OPERATIONAL",
  EDUCACIÓN: "VALUE",
  PROMOCIÓN: "PROMOTIONAL",
  BIENVENIDA: "PROMOTIONAL",
  ANUNCIOS: "OPERATIONAL"
};

// Cada 24h se resetea contador
dailyStats = {
  value: 0,
  operational: 0,
  promotional: 0
};

// Cuando llega un evento
publicationType = "PROMOCIÓN";
category = contentCategory[publicationType]; // "PROMOTIONAL"

// Calcular si es permitido
newTotal = dailyStats.promotional + 1;
newRatio = newTotal / (dailyStats.value + dailyStats.operational + dailyStats.promotional + 1);

if (newRatio > 0.20) {
  action = RECHAZA_A_COLA;  // Entra en queue con prioridad 7 (baja)
  timestamp = nextDayMidnight;  // Se intenta mañana
} else {
  action = ACEPTA;
  dailyStats.promotional += 1;
}
```

### Comportamiento

- Si ratio es 19% → acepta PROMOCIÓN
- Si ratio es exactamente 20% → acepta últimas PROMOCIONES hasta 20%
- Si ratio sería 21% → rechaza, intenta mañana
- **Nunca fuerza**: Si no hay espacio, se deja para el día siguiente

---

## BIBLIOTECA DE VARIANTES

### Estructura

```typescript
interface PublicationTemplate {
  type: "FREE_ALERT" | "TRADE_RESULT" | "MARKET_STATUS" | ...;
  variants: PublicationVariant[];
  selectionStrategy: "random" | "round-robin" | "weighted";
  lastSelectedVariant?: string;  // Para round-robin
  usageCount?: { [variantId: string]: number };
}

interface PublicationVariant {
  id: string;                    // "MARKET_STATUS_NEUTRAL_001"
  content: string;               // Markdown con ${variables}
  tone: "technical" | "casual" | "cautious" | "enthusiastic";
  length: "short" | "medium" | "long";
  keywords: string[];            // Para análisis de engagement
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ejemplo de Variantes para MARKET_STATUS

```
Variante 1 (técnico):
"📊 ${instrument} consolidando entre ${support} y ${resistance}. 
Volumen ${volume}. Próximo nivel de interés: ${nextLevel}."
Tone: technical | Length: short

Variante 2 (cauteloso):
"⚠️ ${instrument} sin movimiento significativo. 
Esperamos confirmación de ${signal} antes de actuar. 
Seguimiento en tiempo real."
Tone: cautious | Length: medium

Variante 3 (casual):
"🔍 Hey, ${instrument} está... tranquilo. 
Monitoreo activo. Próxima barrera: ${level}. 
¿Qué ves tú?"
Tone: casual | Length: short
```

### Selection Strategies

**random**: 
- Cada publicación elige variante aleatoria
- Probabilidad uniforme
- Resultado: Muy variado, puede repetir consecutivamente

**round-robin**:
- Rota entre variantes en orden
- Nunca repite consecutivamente
- Garantiza diversidad
- Usa `lastSelectedVariant`

**weighted**:
- Cada variante tiene peso basado en performance
- Variantes con más conversiones se usan más
- Requiere integración con Tracking Service

### Persistencia

Archivo: `data/community-publisher/templates/[type]_variants.json`

```json
{
  "type": "MARKET_STATUS",
  "selectionStrategy": "round-robin",
  "lastSelectedVariant": "MARKET_STATUS_NEUTRAL_001",
  "variants": [
    {
      "id": "MARKET_STATUS_NEUTRAL_001",
      "content": "📊 ${instrument}...",
      "tone": "technical",
      "enabled": true
    },
    {
      "id": "MARKET_STATUS_NEUTRAL_002",
      "content": "⚠️ ${instrument}...",
      "tone": "cautious",
      "enabled": true
    }
  ]
}
```

### Panel Admin: Gestión

- Sección "Biblioteca de Mensajes"
- CRUD: Agregar, editar, deshabilitar variantes
- Vista: Listado con tone, length, enabled status
- Sin necesidad de redeploy
- Auditoría de cambios

---

## CALENDARIO EDITORIAL

### Concepto

Contenido **proactivo** publicado en días/horas fijas, independientemente de eventos del Disparador.

### Structure

```typescript
interface CalendarEditorialEvent {
  id: string;
  name: string;                    // "Gestión de Riesgo"
  dayOfWeek: 0-6;                 // 0=Sunday, 1=Monday, ...
  hour: 0-23;
  minute: 0-59;
  publicationType: "EDUCACIÓN" | "MARKET_STATUS" | "ACTIVITY";
  theme: string;
  content?: string;               // Si es fijo
  variantPoolType?: string;       // Si usa variantes de librería
  recurrence: "weekly" | "biweekly" | "monthly";
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
}
```

### Ejemplos Predefinidos

```
Lunes 10:00 UTC
├─ Publicación: EDUCACIÓN
├─ Tema: "Gestión de Riesgo"
├─ Variantes: 30 opciones de educación sobre position sizing
├─ Selection: Random
└─ Recurrence: Weekly

Miércoles 15:00 UTC
├─ Publicación: EDUCACIÓN
├─ Tema: "Psicología del Trading"
├─ Variantes: 25 opciones sobre mentalidad
├─ Selection: Round-robin
└─ Recurrence: Weekly

Viernes 18:00 UTC
├─ Publicación: MARKET_STATUS
├─ Tema: "Resumen Semanal"
├─ Content: Fijo (summary template)
├─ Recolecta stats de la semana
└─ Recurrence: Weekly
```

### Execution Logic

```typescript
function checkCalendarEvents() {
  now = Date.now();
  
  for (let event of calendarEvents) {
    if (!event.enabled) continue;
    
    if (matchesSchedule(event, now) && !alreadyExecutedToday(event)) {
      // Generar publicación
      content = generateContent(event);
      
      // Validar contra filtros
      if (passesFilterPipeline(content)) {
        // Agregar a queue con prioridad especial
        enqueue({
          source: "CALENDAR",
          type: event.publicationType,
          priority: 5,  // Menor que reactivos
          content: content,
          calendarEventId: event.id
        });
      }
      
      markAsExecuted(event);
    }
  }
}

// Ejecutado cada hora por Community Scheduler
```

### Comportamiento

- Solo 1 evento calendárico **ejecutado por día**
- Validados contra **Política de Silencio**
- No fuerza si channel está **DORMANT**
- Encolados con **prioridad media** (5) para no monopolizar
- Auditoría: Log de cada ejecución con timestamp real

---

## COMMUNITY SCHEDULER (ACTUALIZADO)

### Responsabilidades

```
COMMUNITY SCHEDULER

├── Modo Reactivo
│   ├── Escucha Priority Queue
│   ├── Cada 5 minutos: Chequea siguiente evento
│   ├── Valida contra Política de Silencio (ACTIVE/SLOW/DORMANT)
│   ├── Publica si pasa quality gates
│   └── Registra timestamp de publicación
│
├── Modo Proactivo - Calendario Editorial
│   ├── Cada hora: Chequea eventos calendáricos
│   ├── Si coincide hora + día + no ejecutado hoy
│   ├── Genera contenido + valida
│   ├── Encola con prioridad media
│   └── Marca como ejecutado
│
├── Modo Proactivo - Campañas
│   ├── Cada hora: Chequea campañas activas
│   ├── Identifica siguiente fase a ejecutar
│   ├── Si condición se cumple (fecha o trigger)
│   ├── Genera contenido de fase
│   ├── Publica + marca como completada
│   └── Avanza a siguiente fase
│
├── Monitoreo de Estado
│   ├── Calcula tiempo desde última publicación
│   ├── Actualiza canal state (ACTIVE/SLOW/DORMANT)
│   ├── Reseta counters a medianoche UTC
│   └── Registra estado en persistencia
│
└── Gestión de Errores
    ├── Retry automático: 3 intentos con backoff
    ├── Log de fallos → Panel Admin
    ├── Notificación si >5 fallos consecutivos
    └── Quarantine de eventos problemáticos
```

### Pseudocódigo Principal

```pseudocode
function communitySchedulerTick() {
  // 1. Actualizar estado del canal
  updateChannelState()
  
  // 2. Chequear eventos calendáricos
  if (currentHour % 1 == 0) {  // Cada hora
    checkCalendarEvents()
  }
  
  // 3. Chequear campañas
  if (currentHour % 1 == 0) {
    checkCampaignsPhases()
  }
  
  // 4. Publicar evento reactivo si canal está activo
  if (channelState != DORMANT || isEmergency()) {
    nextEvent = priorityQueue.getNext()
    if (nextEvent && passesFilters(nextEvent)) {
      content = generateContent(nextEvent)
      telegramBot.sendMessage(
        channel: OFFICIAL_CHANNEL,
        text: content,
        tracking: {
          publication_id: nextEvent.id,
          campaign_id: nextEvent.campaignId || null,
          content_type: nextEvent.type,
          source: "telegram"
        }
      )
      recordPublication(nextEvent)
    }
  }
  
  // 5. Registrar estado
  persistChannelState()
}

// Ejecutado cada 5 minutos
setInterval(communitySchedulerTick, 5 * 60 * 1000)
```

---

## SISTEMA DE CAMPAÑAS

### Concepto

Agrupación de múltiples publicaciones con **objetivo estratégico**, ejecutadas en **fases ordenadas**, durante un período específico.

### Structure

```typescript
interface Campaign {
  id: string;
  name: string;                   // "Nueva versión del Bot"
  description: string;
  type: "PRODUCT" | "FEATURE" | "EVENT" | "PROMOTION";
  
  startDate: Date;
  endDate: Date;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  
  phases: CampaignPhase[];
  metrics: CampaignMetrics;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignPhase {
  id: string;
  sequenceNumber: 1-10;           // Orden de ejecución
  name: string;                   // "Anuncio", "Avance", "Resultado"
  publicationType: "EDUCACIÓN" | "MARKET_STATUS" | "ACTIVIDAD" | ...;
  
  content: string | null;         // Si es fijo; null = generar
  variantPool?: string;           // Si usa variantes librería
  
  scheduling: {
    type: "fixed" | "trigger";
    date?: Date;                  // Si fixed
    triggerCondition?: string;    // Si trigger: "after_previous_published"
    delayHours?: number;          // Delay desde fase anterior
  };
  
  priority: number;               // Override de prioridad global
  status: "pending" | "ready" | "published" | "skipped" | "failed";
  publishedAt?: Date;
}

interface CampaignMetrics {
  phasesCompleted: number;
  phasesSkipped: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCost?: number;
}
```

### Ejemplo: "Nueva versión del Bot"

```
Campaign: Nueva versión del Bot
├─ Inicio: 2026-07-15
├─ Fin: 2026-07-22
├─ Tipo: PRODUCT
│
├─ Fase 1: "🚀 Anuncio"
│  ├─ Número: 1
│  ├─ Tipo Publicación: ACTIVIDAD
│  ├─ Content: Fijo ("Hemos lanzado...")
│  ├─ Schedule: Fixed date 2026-07-15 10:00 UTC
│  ├─ Priority: 4 (sobre alertas pero bajo normal)
│  └─ Status: pending
│
├─ Fase 2: "⚡ Características"
│  ├─ Número: 2
│  ├─ Tipo Publicación: EDUCACIÓN
│  ├─ Variantes: Pool de 20 variantes sobre features
│  ├─ Schedule: Trigger "after_previous_published" + 24h delay
│  ├─ Priority: 4
│  └─ Status: pending
│
├─ Fase 3: "📊 Resultados Iniciales"
│  ├─ Número: 3
│  ├─ Tipo Publicación: TRADE_RESULT
│  ├─ Content: Fijo o variantes
│  ├─ Schedule: Trigger "after_previous_published" + 48h delay
│  ├─ Priority: 3 (alta)
│  └─ Status: pending
│
├─ Fase 4: "💬 Recordatorio"
│  ├─ Número: 4
│  ├─ Tipo Publicación: PROMOCIÓN
│  ├─ Content: "Todavía interesado? Link..."
│  ├─ Schedule: Fixed date 2026-07-20 18:00 UTC
│  ├─ Priority: 6 (baja, respeta 20% limit)
│  └─ Status: pending
│
└─ Fase 5: "✅ Cierre"
   ├─ Número: 5
   ├─ Tipo Publicación: MARKET_STATUS
   ├─ Content: "Resultados finales de la campaña"
   ├─ Schedule: Fixed date 2026-07-22 19:00 UTC
   ├─ Priority: 5
   └─ Status: pending
```

### Execution Logic

```pseudocode
function checkCampaignPhases() {
  activeCampaigns = campaigns.filter(c => c.status == "active")
  
  for (campaign in activeCampaigns) {
    for (phase in campaign.phases) {
      if (phase.status != "pending" && phase.status != "ready") {
        continue
      }
      
      // Chequear si debe ejecutarse
      if (phase.scheduling.type == "fixed") {
        if (now >= phase.scheduling.date) {
          phase.status = "ready"
        }
      } else if (phase.scheduling.type == "trigger") {
        prevPhase = campaign.phases[phase.sequenceNumber - 2]
        if (prevPhase.status == "published" && 
            now >= (prevPhase.publishedAt + phase.scheduling.delayHours)) {
          phase.status = "ready"
        }
      }
      
      // Si está ready, ejecutar
      if (phase.status == "ready") {
        content = generatePhaseContent(phase)
        if (passesFilterPipeline(content)) {
          enqueue({
            source: "CAMPAIGN",
            campaignId: campaign.id,
            phaseId: phase.id,
            type: phase.publicationType,
            priority: phase.priority,
            content: content
          })
          phase.status = "published"
          phase.publishedAt = now
        } else {
          phase.status = "skipped"
        }
      }
    }
  }
}
```

### Gating (Anti-overlaps)

- Una fase NO puede ejecutar hasta que la anterior sea "published"
- Si una fase falla, admin puede:
  - Saltarla manualmente
  - Reintentar
  - Atrasar el resto
- Sistema previene que dos fases de misma campaña se ejecuten en paralelo

### Panel Admin

- Sección "Campañas"
- CRUD: Crear, editar, duplicar, archivar
- Templates de campañas comunes
- Vista de progreso (fases por fecha + estado)
- Historial de campañas completadas con métricas

---

## TRACKING INTERNO DE CONVERSIONES

### Arquitectura de Tracking

```
Telegram Message
├─ URL con parámetros: publication_id, campaign_id, content_type, source
├─ Usuario hace clic
├─ Llega a Landing Page CARVIPIX
│
├─ Landing registra:
│  ├─ 📍 Clic en link (timestamp)
│  ├─ 📍 Visita a página (referrer = Telegram)
│  ├─ 📍 Scrolling, tiempo, scroll %, bot detection
│  │
│  └─ Conversión Funnel:
│     ├─ 📋 Registro iniciado (email, nombre)
│     ├─ 📧 Email verificado
│     ├─ ✅ Registro completado (cuenta creada)
│     ├─ 💳 Compra iniciada (carrito abierto)
│     └─ ✔️ Pago aprobado (transacción exitosa)
│
└─ Tracking Service correlaciona:
   ├─ Publication ID → tipo, campaña, datetime
   ├─ Conversiones → timelines
   └─ Calcula metrics por tipo/campaña
```

### URL de Tracking

```
Base: https://carvipix.app/[landing-page-path]

Con parámetros:
https://carvipix.app/community/free-alert
  ?pub_id=pub_1726_0714_001
  &campaign_id=camp_1726_0714_001
  &content_type=FREE_ALERT
  &source=telegram

Componentes:
  pub_id: publication_id (único por publicación)
  campaign_id: campaign_id (si es parte de campaña, null si reactivo)
  content_type: tipo de publicación (FREE_ALERT, TRADE_RESULT, etc)
  source: "telegram" (siempre)
  
Opcionales:
  variant_id: qué variante se usó (para mejorar A/B testing)
  cid: campaign internal id (alternativa si la URL es compartida)
```

### Eventos Registrados

```
EVENT 1: CLICK
├─ Timestamp: cuando hace clic
├─ User Agent: dispositivo, navegador
├─ Referrer: https://t.me/carvipix_official
├─ Publication ID, Campaign ID, Content Type
└─ Registrado: Client-side (JavaScript)

EVENT 2: PAGE_VISIT
├─ Timestamp: cuando llega a landing
├─ Page: [path de landing]
├─ Session ID: cookie (opt-in)
├─ Device type: mobile/desktop
├─ Bot detection: 0-100% (rechaza si > 99%)
└─ Registrado: Server-side

EVENT 3: SCROLL_TRACKING (opcional)
├─ % de página scrolleado
├─ Tiempo total en página
├─ Secciones vistas
└─ Registrado: Client-side, NO identificable

EVENT 4: SIGNUP_STARTED
├─ Timestamp: formulario abierto
├─ Email: primeros 2 caracteres + hash (privacidad)
├─ Campaign ID
└─ Registrado: Server-side

EVENT 5: EMAIL_VERIFIED
├─ Timestamp: email confirmado
├─ Publication ID
└─ Registrado: Auth service

EVENT 6: SIGNUP_COMPLETED
├─ Timestamp: cuenta creada
├─ User ID: nuevo
├─ Publication ID, Campaign ID, Content Type
└─ Registrado: Server-side

EVENT 7: PURCHASE_INITIATED
├─ Timestamp: carrito abierto
├─ Product(s): lista de items
├─ Cart total: USD amount
├─ Publication ID, Campaign ID
└─ Registrado: Server-side

EVENT 8: PAYMENT_APPROVED
├─ Timestamp: pago exitoso
├─ Transaction ID
├─ Amount USD
├─ Publication ID, Campaign ID, Content Type
├─ User ID
└─ Registrado: Server-side (Stripe webhook)
```

### Persistencia

Archivo: `data/community-publisher/tracking/[date].json`

```json
{
  "date": "2026-07-14",
  "events": [
    {
      "id": "evt_001",
      "type": "CLICK",
      "timestamp": 1726270800000,
      "publication_id": "pub_1726_0714_001",
      "campaign_id": "camp_1726_0714_001",
      "content_type": "FREE_ALERT",
      "source": "telegram",
      "user_agent": "Mozilla/5.0...",
      "referrer": "https://t.me/carvipix_official"
    },
    {
      "id": "evt_002",
      "type": "PAGE_VISIT",
      "timestamp": 1726270805000,
      "publication_id": "pub_1726_0714_001",
      "page": "/community/free-alert",
      "device_type": "mobile",
      "bot_score": 2,
      "session_id": "sess_abc123"
    },
    {
      "id": "evt_003",
      "type": "SIGNUP_COMPLETED",
      "timestamp": 1726270920000,
      "publication_id": "pub_1726_0714_001",
      "campaign_id": "camp_1726_0714_001",
      "content_type": "FREE_ALERT",
      "user_id": "usr_2026_07_14_001"
    },
    {
      "id": "evt_004",
      "type": "PAYMENT_APPROVED",
      "timestamp": 1726271200000,
      "publication_id": "pub_1726_0714_001",
      "campaign_id": "camp_1726_0714_001",
      "content_type": "FREE_ALERT",
      "user_id": "usr_2026_07_14_001",
      "transaction_id": "txn_stripe_123",
      "amount_usd": 99.00
    }
  ]
}
```

### Cálculo de Métricas

```typescript
interface PublicationMetrics {
  publication_id: string;
  campaign_id?: string;
  content_type: string;
  published_at: Date;
  
  counts: {
    clicks: number;
    visits: number;
    signups_started: number;
    signups_completed: number;
    purchases_initiated: number;
    purchases_completed: number;
  };
  
  conversion_rates: {
    click_to_visit: number;           // visits / clicks
    visit_to_signup: number;          // signups_completed / visits
    signup_to_purchase: number;       // purchases_completed / signups_completed
    overall_conversion: number;       // purchases_completed / clicks
  };
  
  revenue_generated: number;          // sum(payments_approved)
  average_order_value: number;
  
  telegram_metrics?: {
    estimated_views?: number;         // Si Telegram API lo proporciona
    reactions?: number;
    forwards?: number;
  };
}
```

### Dashboard Metrics (Panel Admin)

- Tabla: Publicaciones + click count, visit count, signup%, purchase%
- Sorted by: conversion rate (mejor primero)
- Gráficos: Funnel por tipo (cuántos dropean en cada paso)
- ROI: Revenue / ad spend (si hay campaña pagada)
- A/B: Comparación de variantes (si se registra variant_id)
- Exportable: CSV con datos completos

---

## INTEGRACIÓN TELEGRAM

### Configuración

Variables en `.env.local`:

```env
# Telegram
TELEGRAM_BOT_TOKEN=7123456789:ABCdefGHIjklmnoPQRstUVwxyz...
TELEGRAM_CHANNEL_ID=@carvipix_official
TELEGRAM_ADMIN_USER_ID=123456789  # Para notificaciones de error
```

### API Endpoints

#### Enviar Mensaje

```
POST /api/internal/telegram/send-message

Request:
{
  "channel": "@carvipix_official",
  "text": "Markdown content",
  "parse_mode": "Markdown",
  "tracking": {
    "publication_id": "pub_...",
    "campaign_id": "camp_...",
    "content_type": "FREE_ALERT",
    "source": "telegram"
  }
}

Response:
{
  "success": true,
  "message_id": 12345,
  "timestamp": 1726270800000
}
```

#### Webhooks (Incoming Events)

```
POST /api/webhooks/telegram-events

{
  "event_type": "member_joined|message_clicked|reaction_added",
  "timestamp": 1726270800000,
  "user_id": "123456",
  "message_id": 12345,
  "data": {...}
}
```

### Rate Limiting

- **Telegram API**: 30 mensajes/segundo = 2.5M/día
- **CARVIPIX**: Máximo 2 alertas/día + horario 8-22 UTC = ~20/día en pico
- **Sin problema**: Sistema está muy por debajo de límites

### Error Handling

```pseudocode
function sendTelegramMessage(content, tracking) {
  try {
    response = telegramAPI.sendMessage(...)
    if (response.ok) {
      logPublication(response.message_id, tracking)
      return success
    } else {
      throw TelegramError(response.error)
    }
  } catch (error) {
    // Retry logic
    if (attempt < 3) {
      wait(exponential_backoff)
      return sendTelegramMessage(...) // retry
    } else {
      quarantine(content)
      notifyAdmin(error)
      return failed
    }
  }
}
```

### Seguridad

- Token guardado en ENV, nunca en código
- Validación de channel_id (whitelist)
- Validación de mensaje (no > 4096 chars, Markdown válido)
- Auditoría: Log de todos los envíos con timestamp + tracking
- Rate limiting interno para prevenir DoS

---

## PANEL ADMINISTRATIVO

### 8 Módulos Funcionales

#### 1. **Dashboard General**
- Resumen de últimas 24h
- Publicaciones hechas: by type (tabla)
- Métrica: Clics, visitas, conversiones
- Gráfico: Timeline de publicaciones
- Estado del canal: ACTIVE/SLOW/DORMANT
- Paper Trading: Balance actual de Observador V3

#### 2. **Histórico de Publicaciones**
- Tabla filtrable: todas las publicaciones
- Columnas: Hora, Tipo, Contenido preview, Status
- Expandir fila: Ver tracking, conversiones, variante usada
- Acciones: Reenviar, editar draft, cancelar programado
- Búsqueda: por tipo, instrumento, fecha, palabra clave

#### 3. **Configuración de Filtros**
- **F1 Type Check**: Habilitar/deshabilitar tipos
- **F2 Time Check**: Horarios permitidos por zona
- **F3 Limits**: Cuota por tipo, ratio de promoción
- **F4 Quality**: Umbral de score mínimo
- **F5 Duplicates**: Porcentaje de similitud
- **F6 Security**: Keywords prohibidas, validaciones
- Sin necesidad de redeploy

#### 4. **Cola de Publicaciones**
- Vista de Priority Queue
- Ordenada por prioridad (1-8)
- Mostrar timestamp de llegada, tipo, status
- Acciones: Mover arriba/abajo, pausar, eliminar
- Preview: Mostrar contenido exacto que saldrá

#### 5. **Moderación de UGC**
- Cola de contenido generado por usuarios
- Estado: Pendiente aprobación, aprobado, rechazado
- Acción: Expandir para revisar captura
- Botón: "Aprobar" (publica hoy) o "Rechazar"
- Auditoría: Log de quién aprobó y cuándo

#### 6. **Integración Telegram**
- Status: Conectado / Error
- Test: Enviar mensaje de prueba
- Rate limiting: Mostrar usos/límite
- Errores recientes: Log de fallos de envío
- Configurable: Channel ID, horarios, mensajes de prueba

#### 7. **Estadísticas y Engagement**
- Tabla: Publicación | Clics | Visitas | Signups | Pagos | Conversión
- Gráficos: 
  - Funnel de conversión (clics → signups → pagos)
  - Por tipo de publicación (qué convierte mejor)
  - Timeline: conversiones en el tiempo
- Filtrable: Por fecha, tipo, campaña
- Exportable: CSV

#### 8. **Logs y Auditoría**
- Todos los eventos del sistema
- Columnas: Timestamp, Evento, Detalle, Usuario (si manual)
- Filtrable: Por tipo, usuario, fecha, palabra clave
- Descargable: JSON/CSV
- Retención: 90 días (configurable)

---

## SEGURIDAD

### Nunca Publicar (Lista Exhaustiva)

❌ **Prompts** - Prompts de ChatGPT, templates de análisis, reasoning
❌ **API Keys** - Claves de Twelve Data, OpenAI, Telegram, Stripe
❌ **Reasoning privado** - Análisis interno, decisiones rechazadas
❌ **Rutas de archivos** - Directorios del servidor, paths internos
❌ **Credenciales** - Contraseñas, JWT tokens, session IDs
❌ **Datos privados** - Emails de usuarios, números de teléfono
❌ **Configuración interna** - .env, secrets, settings no públicas
❌ **Estadísticas no verificadas** - Claims no respaldados por datos
❌ **Predicciones falsas** - Afirmaciones sobre precio futuro
❌ **Solicitud de dinero directo** - "Enviar aquí", "Pague ahora"

### Validación pre-publicación

```pseudocode
function validateSecurity(content) {
  blockedKeywords = [
    "prompt", "api_key", "secret", "/home/", 
    "password", "@gmail.com", "reasoning",
    "debug", "error_stack", "$", "{{", "}}"
  ]
  
  for keyword in blockedKeywords {
    if (content.toLowerCase().includes(keyword)) {
      return REJECT("Contiene keyword prohibido: " + keyword)
    }
  }
  
  // URL check
  urls = extractUrls(content)
  for url in urls {
    if (!isInWhitelist(url)) {
      return REJECT("URL no whitelisted: " + url)
    }
  }
  
  return ACCEPT
}
```

### Auditoría

- **Todos** los envíos registrados: timestamp, contenido (truncado), tracking IDs
- **Todos** los rechazos registrados: razón, contenido (para análisis)
- **Todos** los cambios en config: usuario, qué cambió, cuándo
- **Retención**: 90 días de logs en producción, 365 en archivo

### Acceso

- Admin panel: Solo usuarios con role "community_admin"
- API interna: Header Authorization con token específico
- Sin password en código
- Auditoría: Log de cada login/acción administrativa

---

## ESCALABILIDAD

### Diseño Agnóstico a Volumen

El sistema está diseñado para soportar:
- **Fase 1** (Actual): 100-1K miembros | 1-5 publicaciones/día
- **Fase 2** (Próximo): 1K-10K miembros | 5-20 publicaciones/día
- **Fase 3** (Futuro): 10K-100K miembros | 20-100 publicaciones/día

### Bottlenecks Identificados

#### 1. Base de Datos (Persistencia)
**Problema actual**: Archivos JSON
**Límite**: ~10K publicaciones (50MB JSON)
**Solución Fase 3**: Migrar a PostgreSQL
```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  content TEXT,
  tracking_data JSONB,
  published_at TIMESTAMP,
  created_at TIMESTAMP,
  INDEX (type, published_at)
);

CREATE TABLE tracking_events (
  id UUID PRIMARY KEY,
  publication_id UUID,
  event_type VARCHAR(50),
  timestamp TIMESTAMP,
  data JSONB,
  INDEX (publication_id, event_type)
);
```

#### 2. Telegram API (Rate Limiting)
**Límite**: 30 mensajes/segundo
**CARVIPIX utiliza**: <5 mensajes/día
**Sin problema**: Incluso en Fase 3

#### 3. Content Generation
**Problema**: Si hay muchas publicaciones simultáneas
**Solución**: Job queue (BullMQ o similar)
- Encola requests
- Workers en paralelo
- Limita carga en OpenAI

#### 4. Tracking Service
**Problema**: Millones de eventos si canal crece
**Solución Fase 2**: Agregación en tiempo real
- Redis para counters
- Flush a DB cada 5 minutos
- Eventos raw archive cada 24h

### Monitoreo

- **Health Checks**: Cada 5 minutos
  - ¿Telegram API responde?
  - ¿DB accesible?
  - ¿Scheduler ejecutando?
  - ¿Errores en últimas 5 min?

- **Alertas**:
  - >5 errores/hora → notificar admin
  - Rate limit Telegram → pausar
  - DB error → retry automático
  - Scheduler muerto → reiniciar

---

## RESTRICCIONES DE DISEÑO

### Lo que SÍ es Community Publisher

✅ Sistema de publicación automático  
✅ Consumidor del Disparador  
✅ Generador de contenido templatizado  
✅ Distribuidor vía Telegram  
✅ Tracker de conversión  
✅ Componente modular del ecosistema CARVIPIX  

### Lo que NO es Community Publisher

❌ Bot de trading (eso es Observador V3)  
❌ Estrategia de marketing (definida por negocio)  
❌ Sistema CRM (es tracking, no gestión de clientes)  
❌ Foro de comunidad (es comunicación unidireccional)  
❌ Moderador de comentarios (solo genera contenido)  
❌ Reemplazo de atención al cliente  

---

## COMPARACIÓN: PRE vs POST AUDITORÍA

| Aspecto | Pre-Auditoría | Post-Auditoría |
|---------|---------------|----------------|
| **Prioridades** | Implícitas | 8 niveles explícitos |
| **Silencio** | No contemplado | Política ACTIVE/SLOW/DORMANT |
| **Promoción** | Sin límite | Máximo 20% diario |
| **Variantes** | Template único | Biblioteca con 50+ variantes |
| **Calendario** | Solo reactivo | Proactivo semanal |
| **Campañas** | No existe | Fases gated, multi-semana |
| **Tracking** | No existe | 9 eventos, tracking end-to-end |
| **Métricas** | Conteo simple | Funnel completo con ROI |
| **Campos Tipo** | 9 tipos | 9 tipos sin cambio |

---

## CONGELAMIENTO DE ARQUITECTURA

Una vez aprobado este documento:
1. Se crea `COMMUNITY_PUBLISHER_ARCHITECTURE_V1_APPROVED.md`
2. Se congela: No cambios sin revisión arquitectónica
3. Se procede a: Documento de Contrato (next phase)
4. Prohibido: Implementar antes de contrato aprobado

---

**DOCUMENTO LISTO PARA APROBACIÓN**

✅ 7 Decisiones de Negocio integradas
✅ Arquitectura aumentada 40% en cobertura
✅ Tracking interno especificado
✅ Campañas diseñadas
✅ Calendario editorial incorporado
✅ Panel admin detallado
✅ Escalabilidad planificada
