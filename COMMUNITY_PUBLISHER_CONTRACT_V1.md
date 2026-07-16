# COMMUNITY PUBLISHER V1 — CONTRATO DE INTERFAZ

**Especificación Técnica**  
**Versión**: 1.0  
**Estado**: Pre-Implementación  
**Fecha**: 2026-07-14  
**Propósito**: Definir exactamente inputs/outputs, tipos, persistencia y contratos entre componentes

---

## TABLA DE CONTENIDOS

1. [Tipos Globales](#tipos-globales)
2. [Flujo de Datos Principal](#flujo-de-datos-principal)
3. [Componentes y Contratos](#componentes-y-contratos)
4. [Persistencia](#persistencia)
5. [API Endpoints](#api-endpoints)
6. [Estados y Transiciones](#estados-y-transiciones)
7. [Validaciones](#validaciones)
8. [Decisiones No-Implementables](#decisiones-no-implementables)

---

## TIPOS GLOBALES

### Enums

```typescript
// Estados de canal
enum ChannelState {
  ACTIVE = "ACTIVE",       // < 4h sin publicar
  SLOW = "SLOW",          // 4-12h sin publicar
  DORMANT = "DORMANT"     // > 12h sin publicar
}

// Tipos de publicación
enum PublicationType {
  FREE_ALERT = "FREE_ALERT",
  TRADE_RESULT = "TRADE_RESULT",
  MARKET_STATUS = "MARKET_STATUS",
  OPORTUNIDAD_EN_DESARROLLO = "OPORTUNIDAD_EN_DESARROLLO",
  EDUCACION = "EDUCACION",
  ACTIVIDAD_DEL_SISTEMA = "ACTIVIDAD_DEL_SISTEMA",
  PROMOCION = "PROMOCION",
  BIENVENIDA = "BIENVENIDA",
  ANUNCIOS_ESPECIALES = "ANUNCIOS_ESPECIALES"
}

// Categorías de contenido (para límite 20%)
enum ContentCategory {
  VALUE = "VALUE",               // FREE_ALERT, TRADE_RESULT, MARKET_STATUS, EDUCACION
  OPERATIONAL = "OPERATIONAL",   // OPORTUNIDAD, ACTIVIDAD
  PROMOTIONAL = "PROMOTIONAL"    // PROMOCION, BIENVENIDA
}

// Estados de publicación
enum PublicationStatus {
  PUBLISHED = "PUBLISHED",       // Salió en Telegram
  PENDING = "PENDING",           // En queue, esperando publicar
  SCHEDULED = "SCHEDULED",       // Programada para fecha futura
  FAILED = "FAILED",            // Falló al enviar
  SKIPPED = "SKIPPED",          // Rechazada por filtros
  ARCHIVED = "ARCHIVED"         // Vieja, movida a archivo
}

// Estados de campaña
enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED"
}

// Estados de fase de campaña
enum CampaignPhaseStatus {
  PENDING = "PENDING",          // Esperando condición
  READY = "READY",              // Condición cumplida, lista para publicar
  PUBLISHED = "PUBLISHED",      // Ya publicada
  SKIPPED = "SKIPPED",          // No pasó filtros
  FAILED = "FAILED"             // Error al publicar
}

// Tonos de variante
enum VariantTone {
  TECHNICAL = "TECHNICAL",
  CASUAL = "CASUAL",
  CAUTIOUS = "CAUTIOUS",
  ENTHUSIASTIC = "ENTHUSIASTIC"
}

// Estrategias de selección de variante
enum VariantSelectionStrategy {
  RANDOM = "RANDOM",           // Aleatoria
  ROUND_ROBIN = "ROUND_ROBIN", // Rotación
  WEIGHTED = "WEIGHTED"        // Ponderada
}

// Tipos de evento de tracking
enum TrackingEventType {
  CLICK = "CLICK",                    // Usuario hace clic en link
  PAGE_VISIT = "PAGE_VISIT",          // Llega a landing
  SCROLL_TRACKING = "SCROLL_TRACKING", // Scrolleo de página
  SIGNUP_STARTED = "SIGNUP_STARTED",   // Abre formulario
  EMAIL_VERIFIED = "EMAIL_VERIFIED",   // Email confirmado
  SIGNUP_COMPLETED = "SIGNUP_COMPLETED", // Cuenta creada
  PURCHASE_INITIATED = "PURCHASE_INITIATED", // Carrito abierto
  PAYMENT_APPROVED = "PAYMENT_APPROVED"     // Pago exitoso
}

// Tipo de scheduling para campañas
enum SchedulingType {
  FIXED = "FIXED",              // Fecha específica
  TRIGGER = "TRIGGER"           // Condicional
}

// Condiciones de trigger
enum TriggerCondition {
  AFTER_PREVIOUS_PUBLISHED = "AFTER_PREVIOUS_PUBLISHED",
  MANUAL = "MANUAL"
}
```

### Tipos Principales

```typescript
// ============ PUBLICACIONES ============

interface Publication {
  id: string;                      // pub_YYMMDD_HHmm_nnn
  type: PublicationType;
  content: string;                 // Markdown final
  variantId?: string;             // ID de variante usada
  status: PublicationStatus;
  
  // Origen
  source: "DISPARADOR" | "CALENDAR" | "CAMPAIGN" | "MANUAL";
  sourceData: {
    analysisId?: string;           // De Observador V3
    campaignId?: string;           // De campaña
    calendarEventId?: string;      // De calendario
  };
  
  // Tracking
  tracking: {
    publication_id: string;        // pub_YYMMDD_HHmm_nnn
    campaign_id?: string;          // camp_YYMMDD_nnn
    content_type: PublicationType;
    source: "telegram";
    variant_id?: string;
  };
  
  // Destinos
  destinations: ("TELEGRAM" | "DASHBOARD")[];
  
  // Ejecución
  publishedAt?: Date;             // Cuándo salió
  telegramMessageId?: number;    // ID de mensaje en Telegram
  telegramViewEstimate?: number; // Vistas (de Telegram API)
  telegramReactions?: number;    // Reacciones
  telegramForwards?: number;     // Reenvíos
  
  // Métricas
  metrics?: {
    clicks: number;
    visits: number;
    signups_started: number;
    signups_completed: number;
    purchases_initiated: number;
    purchases_completed: number;
    revenue_generated: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;             // Usuario (si manual)
}

// ============ QUEUE DE PRIORIDADES ============

interface QueuedPublication {
  id: string;                      // Único en queue
  publication: Publication;
  priority: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;  // 1 = máxima
  enqueuedAt: Date;
  status: "PENDING" | "SCHEDULED" | "PROCESSING" | "FAILED";
  attempts: number;               // Reintentos
  nextRetry?: Date;
  error?: string;
}

// ============ CAMPAÑAS ============

interface Campaign {
  id: string;                      // camp_YYMMDD_nnn
  name: string;                    // "Nueva versión del Bot"
  description: string;
  type: "PRODUCT" | "FEATURE" | "EVENT" | "PROMOTION";
  
  dates: {
    startDate: Date;
    endDate: Date;
  };
  
  status: CampaignStatus;
  phases: CampaignPhase[];
  
  metrics: CampaignMetrics;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface CampaignPhase {
  id: string;                      // phase_camp_001
  campaignId: string;
  sequenceNumber: number;         // 1, 2, 3...
  name: string;                   // "Anuncio", "Avance", etc.
  
  publicationType: PublicationType;
  content?: string;               // Si es contenido fijo
  variantPoolType?: string;       // Si usa librería (EDUCACION, etc)
  
  scheduling: {
    type: SchedulingType;
    date?: Date;                  // Si FIXED
    triggerCondition?: TriggerCondition;
    delayHours?: number;          // Delay desde fase anterior
  };
  
  priority: number;               // Override (1-8)
  status: CampaignPhaseStatus;
  publishedAt?: Date;
  error?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CampaignMetrics {
  phasesCompleted: number;
  phasesSkipped: number;
  phasesFailed: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenueUSD: number;
}

// ============ CALENDARIO EDITORIAL ============

interface CalendarEditorialEvent {
  id: string;                      // cal_evt_001
  name: string;                   // "Gestión de Riesgo"
  description?: string;
  
  schedule: {
    dayOfWeek: 0-6;              // 0 = Sunday, 1 = Monday
    hour: 0-23;
    minute: 0-59;
    timezone: "UTC";             // Siempre UTC
  };
  
  publicationType: PublicationType;
  theme: string;                 // "Gestión de Riesgo"
  
  content?: string;              // Si es contenido fijo
  variantPoolType?: string;      // Si usa variantes
  
  recurrence: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  enabled: boolean;
  
  lastExecuted?: Date;
  nextExecution?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============ VARIANTES ============

interface PublicationVariant {
  id: string;                      // MARKET_STATUS_NEUTRAL_001
  template: PublicationType;
  
  content: string;                // Markdown con ${variable}
  tone: VariantTone;
  length: "SHORT" | "MEDIUM" | "LONG";
  keywords: string[];            // Para análisis de engagement
  
  enabled: boolean;
  usageCount: number;            // Para round-robin
  performanceScore?: number;     // Para weighted (0-100)
  
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariantSet {
  type: PublicationType;
  variants: PublicationVariant[];
  selectionStrategy: VariantSelectionStrategy;
  lastSelectedVariantId?: string;  // Para round-robin
  usageStats: { [variantId: string]: number };
}

// ============ EVENTOS DE TRACKING ============

interface TrackingEvent {
  id: string;                      // evt_YYMMDD_nnn
  type: TrackingEventType;
  timestamp: number;              // ms since epoch
  
  publication: {
    publication_id: string;
    campaign_id?: string;
    content_type: PublicationType;
    source: "telegram";
  };
  
  // Por tipo de evento
  click?: {
    referrer: string;
    userAgent: string;
  };
  
  visit?: {
    page: string;
    deviceType: "MOBILE" | "DESKTOP";
    botScore: number;             // 0-100 (>99 = rechaza)
    sessionId: string;
    scrollPercent?: number;
    timeOnPage?: number;
  };
  
  signup?: {
    userEmail?: string;            // Primeros 2 caracteres + hash
    userId?: string;              // Solo si completado
  };
  
  purchase?: {
    transactionId: string;
    amountUSD: number;
    userId: string;
  };
  
  createdAt: Date;
}

// ============ ESTADO DEL CANAL ============

interface ChannelState {
  state: ChannelState;            // ACTIVE, SLOW, DORMANT
  lastPublicationAt: Date;
  timeSinceLastPublicationMs: number;
  
  dailyStats: {
    date: string;                 // YYYYMMDD
    value: number;
    operational: number;
    promotional: number;
    total: number;
    promotionalRatio: number;     // 0-1
  };
  
  updatedAt: Date;
}

// ============ CONFIGURACIÓN ============

interface FilterConfiguration {
  // F1: Type Check
  enabledTypes: PublicationType[];
  
  // F2: Time Check
  timeWindow: {
    startHour: 0-23;             // 8
    endHour: 0-23;               // 22
    timezone: "UTC";
    excludeWeekends: boolean;
  };
  
  // F3: Daily Limits
  dailyLimits: {
    FREE_ALERT: number;          // 2
    EDUCACION: number;           // 2
    [type]: number;
  };
  maxPromotionalRatioDaily: number; // 0.20
  
  // F4: Quality
  minQualityScore: number;        // 30
  
  // F5: Duplicates
  similarityThreshold: number;    // 0.80 (80%)
  lookbackHours: number;          // 12
  
  // F6: Security
  blockedKeywords: string[];
  whitelistedUrls: string[];
}
```

---

## FLUJO DE DATOS PRINCIPAL

### Entrada (Disparador)

```typescript
// Evento del Disparador (de Observador V3)
interface DisparadorEvent {
  id: string;
  type: "ANALYSIS_COMPLETED" | "TRADE_CLOSED" | "MARKET_STATE_CHANGED";
  timestamp: Date;
  data: {
    // ANALYSIS_COMPLETED
    instrument?: string;
    decision?: "ENTER_BUY" | "ENTER_SELL" | "HOLD";
    probability?: number;         // 0-100
    entryPrice?: number;
    stopLoss?: number;
    
    // TRADE_CLOSED
    entryPrice?: number;
    exitPrice?: number;
    pnl?: number;
    duration?: string;            // "2h 30m"
    
    // MARKET_STATE_CHANGED
    state?: string;               // "VOLATILE", "CALM", etc
  };
}

// Procesamiento:
// 1. EventProcessor recibe
// 2. Determina PublicationType
// 3. Crea Publication (draft)
// 4. Pasa por FilterPipeline
// 5. Si pasa, → QueuedPublication
// 6. CommunityScheduler publica
```

### Salida (Telegram)

```typescript
// POST a Telegram API
interface TelegramSendRequest {
  chat_id: string;               // @carvipix_official
  text: string;                  // Markdown content
  parse_mode: "Markdown";
  reply_markup?: InlineKeyboardMarkup;  // Links con tracking
}

// Respuesta
interface TelegramSendResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    text: string;
    date: number;
  };
  error_code?: number;
  description?: string;
}

// Nuestro wrapper
interface PublicationResult {
  success: boolean;
  publication_id: string;
  telegram_message_id?: number;
  timestamp: Date;
  error?: string;
}
```

---

## COMPONENTES Y CONTRATOS

### 1. EVENT PROCESSOR

**Input**: DisparadorEvent (del Disparador)

**Output**: Publication (draft, no publicada aún)

```typescript
interface EventProcessor {
  process(event: DisparadorEvent): Promise<Publication | null>;
}

// Lógica:
// 1. Validar event.data no es null
// 2. Map tipo de evento → PublicationType
// 3. Extraer datos relevantes
// 4. Crear Publication con status="PENDING"
// 5. Return Publication
```

**Contrato de Conversión**:
```
ANALYSIS_COMPLETED con decision="ENTER_BUY" y probability >= 70
  → type = FREE_ALERT
  → priority = 1
  → destinos = ["TELEGRAM", "DASHBOARD"]

TRADE_CLOSED
  → type = TRADE_RESULT
  → priority = 2
  → destinos = ["TELEGRAM", "DASHBOARD"]

MARKET_STATE_CHANGED
  → type = MARKET_STATUS
  → priority = 3
  → destinos = ["TELEGRAM", "DASHBOARD"]
```

---

### 2. FILTER PIPELINE

**Input**: Publication (draft)

**Output**: Publication (draft) + FilterResult

```typescript
interface FilterResult {
  pass: boolean;
  filters: {
    f1_type_check: { pass: boolean; reason?: string };
    f2_time_check: { pass: boolean; reason?: string };
    f3_daily_limits: { pass: boolean; reason?: string };
    f4_quality_gate: { pass: boolean; reason?: string };
    f5_duplicate_detection: { pass: boolean; reason?: string };
    f6_security_check: { pass: boolean; reason?: string };
  };
}

interface FilterPipeline {
  validate(pub: Publication, config: FilterConfiguration): Promise<FilterResult>;
}

// Ejecución:
// 1. Aplicar F1 (type check)
// 2. Si falla, return FAIL
// 3. Aplicar F2 (time check)
// 4. Si falla, return FAIL
// ... etc hasta F6
// Si pasan todos, return PASS
```

**Verdad de Cada Filtro**:

**F1: Type Check**
```typescript
f1_pass = publication.type IN enabledTypes AND publication.type NOT DISABLED_BY_ADMIN
```

**F2: Time Check**
```typescript
currentHour = Date.now().getUTCHours()
f2_pass = (currentHour >= timeWindow.startHour) 
       AND (currentHour <= timeWindow.endHour)
       AND (if excludeWeekends && dayOfWeek IN [0,6] then false else true)
```

**F3: Daily Limits**
```typescript
dailyStats = loadDailyStats(Date.now())

// Check límite por tipo
if (publication.type IN ["FREE_ALERT", "EDUCACION"]) {
  f3_type_pass = dailyStats[publication.type] < limit[publication.type]
} else {
  f3_type_pass = true
}

// Check límite de promoción
if (publication.type IN ["PROMOCION", "BIENVENIDA"]) {
  category = "PROMOTIONAL"
} else if (publication.type IN ["OPORTUNIDAD", "ACTIVIDAD"]) {
  category = "OPERATIONAL"
} else {
  category = "VALUE"
}

newTotal = dailyStats[category] + 1
newRatio = newTotal / (sum(dailyStats))
f3_promo_pass = newRatio <= maxPromotionalRatioDaily

f3_pass = f3_type_pass AND f3_promo_pass
```

**F4: Quality Gate**
```typescript
qualityScore = calculateScore(publication)
  // Para FREE_ALERT: probability (0-100) → score = probability
  // Para TRADE_RESULT: cualquier resultado → score = 100
  // Para MARKET_STATUS: volatility % → score = min(volatility * 50, 100)
  // Para EDUCACION: tema relevante → score = 80

f4_pass = qualityScore >= minQualityScore
```

**F5: Duplicate Detection**
```typescript
recent = loadPublications(lastHours=lookbackHours)
for pub in recent {
  similarity = calculateSimilarity(publication.content, pub.content)
  if (similarity >= similarityThreshold) {
    f5_pass = false
    break
  }
}
f5_pass = true  // Si no encontró duplicado
```

**F6: Security Check**
```typescript
f6_pass = true
for keyword in blockedKeywords {
  if (publication.content.toLowerCase().includes(keyword)) {
    f6_pass = false
    reason = "Contiene keyword prohibido: " + keyword
    break
  }
}
// Validar URLs
urls = extractUrls(publication.content)
for url in urls {
  if (url NOT IN whitelistedUrls) {
    f6_pass = false
    reason = "URL no whitelisted"
    break
  }
}
```

---

### 3. CONTENT GENERATOR

**Input**: Publication (draft)

**Output**: Publication (con content generado)

```typescript
interface ContentGenerator {
  generate(pub: Publication, templateSet: TemplateVariantSet): Promise<Publication>;
}

// Lógica:
// 1. Si publication.content ya existe, devolver
// 2. Cargar template set para publication.type
// 3. Seleccionar variante según strategy (random/round-robin/weighted)
// 4. Componer URL de tracking con parámetros
// 5. Reemplazar variables en template
// 6. Validar Markdown
// 7. Devolver Publication actualizada
```

**Variables Disponibles** (dependen del tipo):
```
${instrument}        // XAUUSD, EURUSD
${probability}       // 0-100
${entry_price}       // 1234.56
${stop_loss}         // 1232.00
${exit_price}        // 1235.50
${pnl}              // +50.00 USD
${duration}         // 2h 30m
${volatility}       // 2.5%
${theme}            // Gestión de Riesgo
${nextLevel}        // 1237.00
```

**URL de Tracking**:
```
Base: https://carvipix.app/community/[action]

Formato completo:
https://carvipix.app/community/free-alert
  ?pub_id=pub_1726_0714_001
  &campaign_id=camp_1726_0714_001
  &content_type=FREE_ALERT
  &source=telegram
  &variant_id=MARKET_STATUS_NEUTRAL_001

Componentes:
  pub_id: publication.id (requerido)
  campaign_id: publication.sourceData.campaignId (opcional)
  content_type: publication.type (requerido)
  source: "telegram" (requerido)
  variant_id: publication.variantId (opcional)
```

---

### 4. PRIORITY QUEUE MANAGER

**Input**: Publication (validada), QueuedPublication[] (cola existente)

**Output**: QueuedPublication (encolada) + ordenamiento automático

```typescript
interface PriorityQueueManager {
  enqueue(pub: Publication): Promise<QueuedPublication>;
  getNext(): Promise<QueuedPublication | null>;
  remove(id: string): Promise<void>;
  reorder(id: string, newPriority: number): Promise<void>;
  getAll(): Promise<QueuedPublication[]>;
}

// Enqueue logic:
// 1. Crear QueuedPublication con priority asignada
// 2. Agregar a queue
// 3. Reordenar por (priority ASC, enqueuedAt ASC)
// 4. Persistir

// GetNext logic:
// 1. Ordenar queue por (priority ASC, enqueuedAt ASC)
// 2. Devolver primero
// 3. NO remover de queue (scheduler lo marca como publicado)

// Persistencia:
// Archivo: data/community-publisher/queue.json
queue = [
  {
    id: "queue_1",
    publication: {...},
    priority: 2,
    enqueuedAt: "2026-07-14T10:00:00Z",
    status: "PENDING"
  },
  {
    id: "queue_2",
    publication: {...},
    priority: 5,
    enqueuedAt: "2026-07-14T10:05:00Z",
    status: "PENDING"
  }
]
```

**Assigning Priority**:
```
FREE_ALERT        → priority = 1
TRADE_RESULT      → priority = 2
MARKET_STATUS     → priority = 3
OPORTUNIDAD       → priority = 4
EDUCACION         → priority = 5
ACTIVIDAD         → priority = 6
PROMOCION         → priority = 7
BIENVENIDA        → priority = 8
ANUNCIOS          → priority = 3
```

---

### 5. COMMUNITY SCHEDULER

**Input**: ChannelState, QueuedPublication[], CalendarEditorialEvent[], Campaign[]

**Output**: TelegramSendRequest (a Telegram API)

```typescript
interface CommunityScheduler {
  tick(): Promise<void>;  // Ejecutado cada 5 minutos
}

// Lógica (pseudocódigo exacto):
async function schedulerTick() {
  // 1. Actualizar estado del canal
  channelState = updateChannelState()
  
  // 2. Chequear eventos calendáricos (cada hora)
  if (currentMinute == 0) {
    await checkCalendarEvents()
  }
  
  // 3. Chequear campañas (cada hora)
  if (currentMinute == 0) {
    await checkCampaignPhases()
  }
  
  // 4. Si canal no está DORMANT, publicar reactivo
  if (channelState.state != DORMANT) {
    next = await priorityQueue.getNext()
    
    if (next) {
      result = await publishToTelegram(next.publication)
      
      if (result.success) {
        next.status = "PUBLISHED"
        next.publication.status = "PUBLISHED"
        next.publication.publishedAt = Date.now()
        next.publication.telegramMessageId = result.telegram_message_id
        await persistQueue()
        await persistPublication(next.publication)
      } else {
        next.attempts += 1
        if (next.attempts >= 3) {
          next.status = "FAILED"
        } else {
          next.nextRetry = Date.now() + (2 ** next.attempts) * 60000  // exponential backoff
        }
      }
    }
  }
  
  // 5. Persistir estado
  await persistChannelState(channelState)
}
```

**Publicar a Telegram**:
```typescript
async function publishToTelegram(pub: Publication): Promise<PublicationResult> {
  try {
    response = await telegramAPI.sendMessage({
      chat_id: TELEGRAM_CHANNEL_ID,
      text: pub.content,
      parse_mode: "Markdown"
    })
    
    if (response.ok) {
      return {
        success: true,
        publication_id: pub.id,
        telegram_message_id: response.result.message_id,
        timestamp: Date.now()
      }
    } else {
      return {
        success: false,
        publication_id: pub.id,
        error: response.description
      }
    }
  } catch (error) {
    return {
      success: false,
      publication_id: pub.id,
      error: error.message
    }
  }
}
```

**updateChannelState**:
```typescript
function updateChannelState(): ChannelState {
  lastPubTime = getLastPublicationTimestamp()
  now = Date.now()
  diff = now - lastPubTime
  
  if (diff < 4 * 60 * 60 * 1000) {
    state = ACTIVE
  } else if (diff < 12 * 60 * 60 * 1000) {
    state = SLOW
  } else {
    state = DORMANT
  }
  
  dailyStats = getDailyStats(Date.now())
  
  return {
    state,
    lastPublicationAt: new Date(lastPubTime),
    timeSinceLastPublicationMs: diff,
    dailyStats,
    updatedAt: Date.now()
  }
}
```

---

### 6. TRACKING SERVICE

**Input**: TrackingEvent (de landing page)

**Output**: Persistencia + PublicationMetrics

```typescript
interface TrackingService {
  recordEvent(event: TrackingEvent): Promise<void>;
  getMetricsForPublication(pubId: string): Promise<PublicationMetrics>;
  getConversionFunnel(): Promise<ConversionFunnelStats>;
}

// Persistencia:
// Archivo: data/community-publisher/tracking/[YYYYMMDD].json

// Correlación:
// 1. Recibir evento con publication_id
// 2. Buscar publication original por ID
// 3. Agregar evento a publication.metrics
// 4. Calcular conversion rates
// 5. Persistir

interface PublicationMetrics {
  publication_id: string;
  campaign_id?: string;
  content_type: PublicationType;
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
  
  revenue_generated: number;
  average_order_value: number;
}

interface ConversionFunnelStats {
  total_clicks: number;
  total_visits: number;
  total_signups: number;
  total_purchases: number;
  funnel: {
    clicks: number;
    visits: number;
    signups: number;
    purchases: number;
    conversion_click_to_purchase: number;
  };
  by_type: { [PublicationType]: PublicationMetrics };
  by_campaign: { [campaignId]: PublicationMetrics };
}
```

---

## PERSISTENCIA

### Estructura de Directorios

```
data/community-publisher/
├── publications/
│   ├── [YYYYMMDD].json        # Publicaciones del día
│   └── archive/
│       └── [YYYY].json        # Publicaciones antiguas (anual)
├── queue.json                 # Priority queue actual
├── channel-state.json         # Estado actual del canal
├── campaigns/
│   ├── active.json            # Campañas activas
│   └── archive/
│       └── [campaignId].json  # Campañas completadas
├── calendar-events.json       # Eventos calendáricos
├── templates/
│   ├── FREE_ALERT_variants.json
│   ├── TRADE_RESULT_variants.json
│   ├── MARKET_STATUS_variants.json
│   ├── EDUCACION_variants.json
│   └── ... (uno por tipo)
├── tracking/
│   ├── [YYYYMMDD].json        # Eventos de tracking del día
│   └── archive/
│       └── [YYYY_MM].json     # Eventos antiguos (mensual)
├── config/
│   └── filters.json           # Configuración de filtros
└── logs/
    ├── scheduler.log          # Logs del scheduler
    ├── errors.log             # Errores
    └── audit.log              # Auditoría
```

### Formato de Archivos

**publications/[YYYYMMDD].json**
```json
{
  "date": "20260714",
  "publications": [
    {
      "id": "pub_1726_0714_001",
      "type": "FREE_ALERT",
      "content": "📊 ${instrument}...",
      "variantId": "FREE_ALERT_ENTRY_001",
      "status": "PUBLISHED",
      "source": "DISPARADOR",
      "destinations": ["TELEGRAM", "DASHBOARD"],
      "tracking": {
        "publication_id": "pub_1726_0714_001",
        "campaign_id": null,
        "content_type": "FREE_ALERT",
        "source": "telegram"
      },
      "publishedAt": "2026-07-14T10:00:00Z",
      "telegramMessageId": 12345,
      "metrics": {
        "clicks": 23,
        "visits": 18,
        "signups_started": 5,
        "signups_completed": 3,
        "purchases_initiated": 1,
        "purchases_completed": 1,
        "revenue_generated": 99.00
      },
      "createdAt": "2026-07-14T09:55:00Z",
      "updatedAt": "2026-07-14T10:00:00Z"
    }
  ]
}
```

**queue.json**
```json
{
  "lastUpdated": "2026-07-14T10:05:00Z",
  "queue": [
    {
      "id": "queue_001",
      "priority": 2,
      "enqueuedAt": "2026-07-14T10:00:00Z",
      "status": "PENDING",
      "attempts": 0,
      "publication": { ... }
    }
  ]
}
```

**channel-state.json**
```json
{
  "state": "ACTIVE",
  "lastPublicationAt": "2026-07-14T10:00:00Z",
  "timeSinceLastPublicationMs": 300000,
  "dailyStats": {
    "date": "20260714",
    "value": 12,
    "operational": 3,
    "promotional": 2,
    "total": 17,
    "promotionalRatio": 0.118
  },
  "updatedAt": "2026-07-14T10:05:00Z"
}
```

---

## API ENDPOINTS

### Endpoints Internos (Admin Only)

#### GET /api/internal/community-publisher/publications
```
Parámetros:
  date?: string (YYYYMMDD)
  type?: PublicationType
  status?: PublicationStatus
  limit?: number (default 50)

Respuesta:
{
  publications: Publication[],
  total: number,
  timestamp: Date
}
```

#### POST /api/internal/community-publisher/publications
```
Body:
{
  type: PublicationType,
  content: string,
  destinations: ("TELEGRAM" | "DASHBOARD")[],
  source?: "MANUAL" // para admin
}

Respuesta:
{
  success: boolean,
  publication: Publication,
  error?: string
}
```

#### GET /api/internal/community-publisher/queue
```
Respuesta:
{
  queue: QueuedPublication[],
  nextToPublish: QueuedPublication | null,
  timestamp: Date
}
```

#### POST /api/internal/community-publisher/campaigns
```
Body:
{
  name: string,
  description?: string,
  type: "PRODUCT" | "FEATURE" | "EVENT" | "PROMOTION",
  startDate: Date,
  endDate: Date,
  phases: CampaignPhase[]
}

Respuesta:
{
  success: boolean,
  campaign: Campaign,
  error?: string
}
```

#### GET /api/internal/community-publisher/metrics
```
Parámetros:
  date_from?: string (YYYYMMDD)
  date_to?: string (YYYYMMDD)
  type?: PublicationType
  campaign_id?: string

Respuesta:
{
  summary: ConversionFunnelStats,
  publications: PublicationMetrics[],
  timestamp: Date
}
```

#### POST /api/webhooks/community-publisher/tracking
```
Body: TrackingEvent

Respuesta:
{
  success: boolean,
  event_id: string
}
```

### Webhooks Entrantes

#### POST /api/webhooks/community-publisher/tracking
Recibe eventos de landing page (clic, visita, registro, pago)

---

## ESTADOS Y TRANSICIONES

### Ciclo de Vida de Publication

```
PENDING
  │
  ├─ Filtros rechazan → SKIPPED
  │
  └─ Filtros aprueban → Priority Queue
       │
       └─ Scheduler elige → Intenta publicar
            │
            ├─ Éxito → PUBLISHED
            │          └─ Tracking inicia
            │             └─ Métricas se acumulan
            │                └─ ARCHIVED (después 90d)
            │
            └─ Falla
               │
               ├─ Intento 1 → Retry 2m
               ├─ Intento 2 → Retry 4m
               ├─ Intento 3 → Retry 8m
               └─ Intento 3 falla → FAILED
```

### Ciclo de Vida de Campaign

```
DRAFT
  │
  └─ Admin activa → ACTIVE
                     │
                     ├─ Fases se ejecutan secuencialmente
                     ├─ Cada fase: PENDING → READY → PUBLISHED/SKIPPED/FAILED
                     │
                     ├─ Admin pausa → PAUSED → ACTIVE (reanudar)
                     │
                     └─ Última fase completada → COMPLETED
                                                 │
                                                 └─ Admin archiva → ARCHIVED
```

### Ciclo de Vida de CalendarEvent

```
CREATED
  │
  ├─ Habilitado: true
  │   │
  │   └─ Cada semana, en hora/día:
  │       ├─ Si pasa filtros → se publica
  │       ├─ Si falla → se intenta siguiente día
  │       └─ Marca lastExecuted
  │
  └─ Habilitado: false
      └─ Se ignora hasta que se habilite
```

---

## VALIDACIONES

### Validaciones de Input

```typescript
// Publication
- content: string, min 10 chars, max 4096 chars, valid Markdown
- type: debe estar en PublicationType enum
- destinations: array, min 1 item

// Campaign
- name: string, min 5 chars, max 200 chars
- startDate < endDate
- phases: array, min 1 item, max 10 items
- cada phase debe ser válida

// CalendarEvent
- dayOfWeek: 0-6
- hour: 0-23
- minute: 0-59
- publicationType: válida
- recurrence: válida enum

// TrackingEvent
- type: válida enum
- publication_id: requerido, existe en DB
- timestamp: valid number, < ahora
```

### Validaciones de Seguridad

```typescript
// BlockedKeywords check
if (content.toLowerCase().includes(blockedKeyword)) {
  reject("Contiene keyword prohibido")
}

// URL validation
urls = extractUrls(content)
for url in urls {
  if (!isWhitelisted(url)) {
    reject("URL no whitelisted: " + url)
  }
}

// Markdown validation
if (!isValidMarkdown(content)) {
  reject("Markdown inválido")
}

// Telegram API validation
if (content.length > 4096) {
  reject("Contenido demasiado largo para Telegram")
}
```

---

## DECISIONES NO-IMPLEMENTABLES

### Restricciones Técnicas

1. **Telegram API**: No proporciona acceso directo a botones/links clickeados
   - Solución: URL de tracking único, landing page propia
   
2. **Telegram API**: View counts solo estimados para canales públicos
   - Solución: Confiar en Telegram API cuando esté disponible, usar tracking interno como principal

3. **Telegram API**: No es posible editar mensajes después de publicar
   - Solución: Una vez publicado, no se modifica. Se publica "corrección" como nuevo mensaje si es necesario

4. **Scaling**: Si hay >10K publicaciones/día, JSON files se vuelven lento
   - Solución: Migrar a PostgreSQL en Fase 3

5. **Email de usuarios**: No almacenar completo por privacidad
   - Solución: Hash solo de primeros 2 caracteres + random suffix

---

## RESUMEN TÉCNICO

| Componente | Input | Output | Persistencia |
|-----------|-------|--------|--------------|
| EventProcessor | DisparadorEvent | Publication | publications/ |
| FilterPipeline | Publication | FilterResult | N/A |
| ContentGenerator | Publication | Publication (con content) | N/A |
| PriorityQueueMgr | Publication | QueuedPublication | queue.json |
| Scheduler | Channel + Queue + Calendar | TelegramRequest | channel-state.json |
| TrackingService | TrackingEvent | Métricas | tracking/ |
| | | | |

---

**DOCUMENTO LISTO PARA APROBACIÓN**

✅ Tipos completamente especificados (TypeScript)
✅ Flujos de datos precisos (pseudocódigo + lógica)
✅ Persistencia definida (directorios + formatos JSON)
✅ API endpoints especificados (requests/responses)
✅ Validaciones incluidas
✅ Decisiones no-implementables documentadas

**SIGUIENTE PASO**: Aprobación de ambos documentos (Arquitectura + Contrato) antes de iniciar implementación.
