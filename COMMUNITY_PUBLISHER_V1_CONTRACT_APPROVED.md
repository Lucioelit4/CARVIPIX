# COMMUNITY PUBLISHER V1 — CONTRATO TÉCNICO APROBADO Y CONGELADO

**Versión**: 1.0-APPROVED  
**Fecha**: 2026-07-14  
**Estado**: 🔒 CONGELADA — Especificación exacta para implementación  
**Propósito**: Tipos, interfaces, endpoints, persistencia, validaciones

---

## TABLA DE CONTENIDOS

1. [Tipos de Entrada (Disparador)](#tipos-de-entrada)
2. [Tipos Internos](#tipos-internos)
3. [Tipos de Salida (Telegram)](#tipos-de-salida)
4. [Persistencia](#persistencia)
5. [API Endpoints](#api-endpoints)
6. [Validaciones](#validaciones)
7. [Variables de Entorno](#variables-de-entorno)
8. [Archivo Esperado](#archivos-previstos)

---

## TIPOS DE ENTRADA

### Event: ANALYSIS_COMPLETED (del Disparador)

```typescript
interface DisparadorAnalysisCompleted {
  // Identificadores únicos
  analysis_id: string;              // UUID: "ana_..."
  signal_id: string;                // UUID: "sig_..."
  timestamp: number;                // ms since epoch
  
  // DECISIÓN (core)
  decision: "ENTER_BUY" | "ENTER_SELL" | "HOLD";
  probability: number;              // 0-100
  conviction: number;               // 0-100
  
  // CONFIGURACIÓN DE ENTRADA
  instrument: string;               // "XAUUSD", "EURUSD", etc
  entry_price: number;              // > 0
  stop_loss: number;                // 0 < stop_loss < entry_price
  take_profit?: number;             // > entry_price (opcional)
  
  // CONTEXTO
  timeframe: string;                // "M5" | "M15" | "H1" | "H4" | "D1" | "W1"
  reasoning: string;                // Resumen de análisis
  
  // DATOS PÚBLICOS (permitidos, sí usables)
  analysis_public: {
    market_state: string;           // "Bullish" | "Bearish" | "Consolidation"
    technical_setup: string;        // Descripción del setup
    support_levels: number[];       // Niveles de soporte
    resistance_levels: number[];    // Niveles de resistencia
    volatility_percent: number;     // Volatilidad %
    // ... otros datos públicos
  };
  
  // DATOS PRIVADOS (NUNCA usar, must be null/undefined)
  analysis_private: null | undefined;
  
  // METADATA
  expediente_id?: string;           // Referencia (opcional)
  quality_score?: number;           // Calculado por ChatGPT, no modificar
}
```

**Validaciones de Entrada**:
```
✓ OBLIGATORIO: analysis_id (UUID válido)
✓ OBLIGATORIO: signal_id (UUID válido)
✓ OBLIGATORIO: decision ∈ ["ENTER_BUY", "ENTER_SELL", "HOLD"]
✓ OBLIGATORIO: probability ∈ [0-100]
✓ OBLIGATORIO: conviction ∈ [0-100]
✓ OBLIGATORIO: instrument (string, 3-10 chars)
✓ OBLIGATORIO: entry_price > 0
✓ OBLIGATORIO: stop_loss tal que 0 < stop_loss < entry_price
✓ OBLIGATORIO: analysis_public (object, not null)
✓ PROHIBIDO: analysis_private != null && != undefined

❌ RECHAZAR SI:
  - analysis_private es not null/undefined
  - Cualquier OBLIGATORIO falta
  - probability < 0 o > 100
  - entry_price <= stop_loss
```

### Event: TRADE_CLOSED (del Disparador)

```typescript
interface DisparadorTradeClosed {
  // Identificadores
  paper_trade_id: string;           // UUID: "pap_..."
  associated_signal_id: string | null;  // UUID de alerta origen
  associated_analysis_id: string | null;
  
  // EJECUCIÓN
  instrument: string;               // "XAUUSD", "EURUSD", etc
  entry_price: number;              // > 0
  exit_price: number;               // > 0
  entry_time: number;               // ms since epoch
  exit_time: number;                // ms since epoch
  
  // RESULTADO
  pnl_usd: number;                  // Puede ser negativo
  pnl_pips: number;                 // Puede ser negativo
  duration_seconds: number;         // > 0
  
  // CLASIFICACIÓN (requerida)
  trade_type: "ANALYTICAL_PAPER" | "MT5_DEMO" | "LIVE_VERIFIED";
  
  // METADATA
  timestamp: number;
  quality_score?: number;
}
```

**Validaciones de Entrada**:
```
✓ OBLIGATORIO: paper_trade_id (UUID válido)
✓ OBLIGATORIO: instrument (string, 3-10 chars)
✓ OBLIGATORIO: entry_price > 0
✓ OBLIGATORIO: exit_price > 0
✓ OBLIGATORIO: pnl_usd (number, puede ser negativo)
✓ OBLIGATORIO: pnl_pips (number, puede ser negativo)
✓ OBLIGATORIO: trade_type ∈ ["ANALYTICAL_PAPER", "MT5_DEMO", "LIVE_VERIFIED"]
✓ OBLIGATORIO: associated_signal_id si es TRADE_RESULT

❌ RECHAZAR SI:
  - Cualquier OBLIGATORIO falta
  - entry_price <= 0
  - trade_type no es válido
```

---

## TIPOS INTERNOS

### PublicationRequest (generado internamente)

```typescript
interface PublicationRequest {
  // Generado por CP
  id: string;                       // "pub_" + random alphanumeric
  type: PublicationType;            // 1 de 5 tipos
  
  // Origen
  source: {
    from: "DISPARADOR" | "SYSTEM";
    analysis_id?: string;
    signal_id?: string;
    paper_trade_id?: string;
  };
  
  // Datos extraídos del evento original
  raw_content: {
    instrument?: string;
    entry_price?: number;
    stop_loss?: number;
    probability?: number;
    pnl_usd?: number;
    pnl_pips?: number;
    trade_type?: string;
    // ... otros campos según tipo
  };
  
  // Control
  metadata: {
    created_at: number;             // ms since epoch
    timezone: "America/Mazatlan";
    channel: "TEST" | "OFFICIAL";
  };
}

type PublicationType = 
  | "FREE_ALERT"
  | "MARKET_STATUS"
  | "OPPORTUNITY_DEVELOPING"
  | "TRADE_RESULT"
  | "EDUCATIONAL_OR_PROMOTIONAL";
```

### FilterResult (resultado de cada filtro)

```typescript
type FilterResult = 
  | { pass: true; reason: null }
  | { pass: false; reason: 
      | "INVALID_TYPE"
      | "OUTSIDE_TIME_WINDOW"
      | "DAILY_LIMIT_REACHED"
      | "DUPLICATE_SIGNAL"
      | "BLOCKED_KEYWORD"
      | "SECURITY_CHECK_FAILED"
      | "EXPIRED_SIGNAL"
    };
```

### PublishedMessage (persistida)

```typescript
interface PublishedMessage {
  // Identificadores
  publication_id: string;           // "pub_" + random
  type: PublicationType;
  status: "PENDING" | "DELIVERED" | "FAILED" | "SKIPPED" | "DEAD_LETTER";
  
  // Contenido generado
  content: {
    markdown: string;               // Mensaje final para Telegram
    html?: string;                  // Si se usa HTML
  };
  
  // Tracking
  tracking: {
    url: string;                    // https://carvipix.app/...?pub_id=X&sig=Y
    signature: string;              // HMAC-SHA256 (hex)
    variant_id: string;             // Cuál variante se usó
    source: "telegram";
  };
  
  // Telegram
  telegram: {
    channel_id: string;             // "-1001234567890"
    message_id?: number;            // ID del mensaje (después de enviar)
    sent_at?: number;               // ms since epoch
    attempts: number;               // Contador de reintentos
    last_error?: string;            // Último error si existe
  };
  
  // Origen / Referencias
  source: {
    signal_id?: string;             // De ANALYSIS_COMPLETED
    analysis_id?: string;
    paper_trade_id?: string;        // De TRADE_CLOSED
  };
  
  // Metadata
  metadata: {
    created_at: number;             // ms since epoch
    updated_at: number;
    reason_skipped?: string;        // Si status=SKIPPED
  };
}
```

### TrackingEvent (registrado en webhook)

```typescript
interface TrackingEvent {
  // Identificadores
  event_id: string;                 // "evt_" + random
  type: "CLICK" | "PAGE_VISIT" | "SIGNUP_STARTED" | "SIGNUP_COMPLETED" | "PAYMENT_APPROVED";
  timestamp: number;                // ms since epoch
  
  // Qué publicación origina el evento
  publication: {
    pub_id: string;                 // Recuperado de URL
    campaign_id?: string;           // Si aplica
    variant_id?: string;            // Variante de contenido
    content_type: string;           // Tipo de publicación
  };
  
  // Datos específicos por evento
  data: {
    // CLICK
    user_agent?: string;            // String completo
    device_type?: "MOBILE" | "DESKTOP" | "OTHER";
    
    // PAGE_VISIT
    page_url?: string;              // URL completa
    referrer?: string;              // De dónde vino
    session_id?: string;            // Hash anónimo (cookie)
    
    // SIGNUP_STARTED / SIGNUP_COMPLETED
    user_id?: string;               // Si COMPLETED
    email_preview?: string;         // Hash de email (no completo)
    
    // PAYMENT_APPROVED
    transaction_id?: string;        // De PayPal
    amount_usd?: number;            // Monto
    
    // Común
    ip_address_hash?: string;       // Hash de IP (nunca IP completa)
  };
}
```

---

## TIPOS DE SALIDA

### Telegram Message Format

```typescript
interface TelegramSendMessage {
  chat_id: string;                  // "-1001234567890"
  text: string;                     // Markdown o HTML
  parse_mode: "Markdown" | "HTML";
  
  // Links como buttons
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      url: string;                  // URL con tracking
    }>>;
  };
  
  // NO soportar en V1:
  // reply_to_message_id, etc
}
```

### Telegram Response

```typescript
interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: { id: number };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}
```

---

## PERSISTENCIA

### Estructura de Directorios

```
data/community-publisher/
├── config.json
│   {
│     "timezone": "America/Mazatlan",
│     "channel_test": "@carvipix_test",
│     "channel_official": "@carvipix_official",
│     "limits": {
│       "free_alerts_per_day": 2,
│       "promo_hours_between": 48
│     },
│     "blocked_keywords": [
│       "prompt", "api_key", "secret", "password", "token", ...
│     ],
│     "paused": false,
│     "test_only": false
│   }
│
├── queue.json
│   {
│     "last_updated": 1726270800000,
│     "items": [
│       {
│         "queue_id": "queue_001",
│         "publication_id": "pub_xY9mK2nL",
│         "priority": 1,
│         "enqueued_at": 1726270800000,
│         "status": "PENDING",
│         "attempts": 0
│       }
│     ]
│   }
│
├── publications/
│   ├── 20260714.json       (hoy, ESCRIBIBLE)
│   │   {
│   │     "date": "20260714",
│   │     "publications": [ ... ]
│   │   }
│   │
│   ├── 20260713.json       (ayer, CONGELADO)
│   └── archive/
│       ├── 2026-Q2.json    (trimestre)
│       └── 2026-Q1.json
│
├── tracking/
│   ├── 20260714.json       (hoy)
│   │   {
│   │     "date": "20260714",
│   │     "events": [ ... ]
│   │   }
│   │
│   └── archive/
│       └── 2026-Q2.json
│
├── templates/
│   ├── FREE_ALERT.json
│   │   {
│   │     "type": "FREE_ALERT",
│   │     "variants": [
│   │       {
│   │         "id": "FREE_ALERT_ENTRY_001",
│   │         "content": "🚀 ${instrument} ${direction}\n..."
│   │       },
│   │       { "id": "FREE_ALERT_ENTRY_002", "content": "..." }
│   │     ]
│   │   }
│   │
│   ├── MARKET_STATUS.json
│   ├── OPPORTUNITY_DEVELOPING.json
│   ├── TRADE_RESULT.json
│   └── EDUCATIONAL_OR_PROMOTIONAL.json
│
└── logs/
    └── error.log
```

### Garantías de Persistencia

#### Escritura Atómica
```
NUNCA escribir directamente al archivo.

SIEMPRE:
  1. Crear temp file
  2. Validar JSON válido
  3. Si existe original, hacer .bak
  4. Reemplazar (atomic rename)
```

#### Bloqueo de Acceso Concurrente
```
Usar .lock file para evitar race conditions:

lock_file = filePath + '.lock'

Adquirir:
  Esperar hasta 5s si existe lock
  Crear lock file con timestamp

Liberar:
  Eliminar lock file (finally block)

Timeout:
  Si lock > 5s, error + alertar admin
```

#### Recuperación Ante Corrupción
```
Si archivo corrupto:
  1. Intentar cargar .bak
  2. Si .bak válido: restaurar + log error
  3. Si .bak también corrupto: usar fallback vacío
  4. Reanudar operación
```

#### Historial Inmutable
```
Rotación automática (fin del día):
  - Renombrar 20260714.json → 20260713.json
  - Crear nuevo 20260714.json vacío
  - Nunca modificar archivos viejos
  
Archivación (fin de trimestre):
  - Copiar mes completo a archive/YYYY-MM.json
  - Solo append-only para históricos
  - Retención: Indefinida
```

#### Deduplicación Post-Reinicio
```
Reinicio del servidor:

1. Cargar queue.json
2. Para cada item con status PROCESSING:
   - Si telegram_message_id existe: ya fue enviado
     → Marcar DELIVERED (evitar duplicación)
   - Si no existe: reintentar (attempts++)
3. Para cada item status PENDING:
   - Continuar normalmente
4. Scheduler reinicia

Garantía: ✓ No duplicar, ✓ No perder, ✓ Reanudar
```

---

## API ENDPOINTS

### GET /api/internal/community-publisher/status

**Autenticación**: Admin auth token (Bearer)  
**Método**: GET  
**Query params**: None

**Respuesta**: 200 OK
```json
{
  "connected": true,
  "paused": false,
  "channel": "OFFICIAL",
  "test_only": false,
  "alerts_today": 1,
  "queue_length": 3,
  "last_published": {
    "publication_id": "pub_xY9mK2nL",
    "type": "FREE_ALERT",
    "sent_at": "2026-07-14T10:00:00Z",
    "message_id": 12345
  },
  "next_in_queue": {
    "publication_id": "pub_aB1cD2eF",
    "type": "MARKET_STATUS",
    "priority": 3,
    "enqueued_at": "2026-07-14T10:05:00Z"
  }
}
```

### GET /api/internal/community-publisher/publications

**Autenticación**: Admin auth token  
**Método**: GET  
**Query params**:
- `date` (YYYYMMDD, optional)
- `limit` (default 50)
- `status` (optional): DELIVERED, FAILED, SKIPPED, DEAD_LETTER

**Respuesta**: 200 OK
```json
{
  "publications": [
    {
      "publication_id": "pub_xY9mK2nL",
      "type": "FREE_ALERT",
      "status": "DELIVERED",
      "created_at": "2026-07-14T09:55:00Z",
      "sent_at": "2026-07-14T10:00:00Z",
      "message_id": 12345,
      "content_preview": "🚀 EURUSD...",
      "telegram_url": "https://t.me/c/12345/12345"
    }
  ],
  "total": 5,
  "timestamp": "2026-07-14T10:30:00Z"
}
```

### GET /api/internal/community-publisher/queue

**Autenticación**: Admin auth token  
**Método**: GET

**Respuesta**: 200 OK
```json
{
  "queue": [
    {
      "queue_id": "queue_001",
      "publication_id": "pub_aB1cD2eF",
      "type": "MARKET_STATUS",
      "priority": 3,
      "enqueued_at": "2026-07-14T10:05:00Z",
      "content_preview": "📊 XAUUSD..."
    }
  ],
  "next_to_publish": {
    "queue_id": "queue_001",
    "priority": 3,
    "attempts": 0
  }
}
```

### POST /api/internal/community-publisher/publish-now

**Autenticación**: Admin auth token  
**Método**: POST  
**Body**:
```json
{
  "publication_id": "pub_xY9mK2nL"
}
```

**Respuesta**: 200 OK
```json
{
  "success": true,
  "message_id": 12345,
  "sent_at": "2026-07-14T10:00:00Z",
  "channel": "OFFICIAL"
}
```

**Respuesta**: 400 Error
```json
{
  "success": false,
  "error": "Publication not found" | "Already delivered" | "Telegram error"
}
```

### POST /api/internal/community-publisher/pause

**Autenticación**: Admin auth token  
**Método**: POST  
**Body**:
```json
{
  "paused": true,
  "reason": "Maintenance"
}
```

**Respuesta**: 200 OK
```json
{
  "success": true,
  "paused": true,
  "timestamp": "2026-07-14T10:30:00Z"
}
```

### POST /api/internal/community-publisher/config

**Autenticación**: Admin auth token  
**Método**: POST  
**Body**:
```json
{
  "limits.free_alerts_per_day": 2,
  "test_only": false,
  "channel": "OFFICIAL",
  "blocked_keywords": ["prompt", "api_key", ...]
}
```

**Respuesta**: 200 OK
```json
{
  "success": true,
  "config": { ... }
}
```

### POST /api/webhooks/community-publisher/tracking

**Autenticación**: HMAC signature validation  
**Método**: POST  
**Headers**: 
- `X-Signature: HMAC-SHA256(...)`

**Body**:
```json
{
  "event_type": "CLICK|PAGE_VISIT|SIGNUP_STARTED|SIGNUP_COMPLETED|PAYMENT_APPROVED",
  "pub_id": "pub_xY9mK2nL",
  "campaign_id": null,
  "variant_id": "FREE_ALERT_ENTRY_001",
  "timestamp": 1726271000000,
  "signature": "HMAC(...)",
  "data": {
    "user_agent": "Mozilla/5.0...",
    "device_type": "mobile",
    "transaction_id": "PayPal_TXN_123" (si PAYMENT_APPROVED)
  }
}
```

**Respuesta**: 200 OK
```json
{
  "success": true,
  "event_id": "evt_abc123"
}
```

**Respuesta**: 400 Error
```json
{
  "success": false,
  "error": "Invalid signature" | "Missing pub_id" | "Duplicate event"
}
```

---

## VALIDACIONES

### Validaciones de Entrada (DisparadorAnalysisCompleted)

```
REQUIRED FIELDS:
  ✓ analysis_id: UUID format ("ana_...")
  ✓ signal_id: UUID format ("sig_...")
  ✓ decision: IN ["ENTER_BUY", "ENTER_SELL", "HOLD"]
  ✓ probability: number, 0-100 inclusive
  ✓ conviction: number, 0-100 inclusive
  ✓ instrument: string, length 3-10
  ✓ entry_price: number > 0
  ✓ stop_loss: number, 0 < stop_loss < entry_price
  ✓ timestamp: number (valid ms since epoch)
  ✓ analysis_public: object, not null/undefined

OPTIONAL FIELDS:
  ? take_profit: if present, > entry_price
  ? analysis_private: MUST be null or undefined (never use)
  ? expediente_id: string
  ? quality_score: number

REJECT IF:
  ✗ analysis_private != null && != undefined
  ✗ Any REQUIRED field missing
  ✗ probability < 0 || > 100
  ✗ conviction < 0 || > 100
  ✗ entry_price <= 0
  ✗ entry_price <= stop_loss
  ✗ take_profit exists && take_profit <= entry_price
```

### Validaciones de Seguridad

```
BLOQUEO 1: Palabras clave bloqueadas
  for each keyword in blockedKeywords:
    if content.toLowerCase().includes(keyword):
      REJECT with reason "BLOCKED_KEYWORD"

BLOQUEO 2: Análisis privado detectado
  if (analysis_private != null && != undefined):
    REJECT with reason "SECURITY_CHECK_FAILED"

BLOQUEO 3: Credenciales/secrets
  patterns = [
    /[A-Z0-9]{20,}/,           // API key-like
    /password[:\s]*/i,          // password
    /token[:\s]*/i,             // token
    /secret[:\s]*/i,            // secret
    /api[_-]?key[:\s]*/i        // api_key / api-key
  ]
  for each pattern:
    if content matches:
      REJECT with reason "BLOCKED_KEYWORD"

BLOQUEO 4: HMAC signature válido
  computed_sig = HMAC-SHA256(url_params, SECRET)
  if (computed_sig != provided_signature):
    REJECT with reason "SECURITY_CHECK_FAILED"
```

---

## VARIABLES DE ENTORNO

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=7123456789:ABCdef...              # NUNCA loguear
TELEGRAM_CHANNEL_TEST=-1001234567890                 # Channel ID
TELEGRAM_CHANNEL_OFFICIAL=-1001234567890             # Channel ID

# Seguridad
TRACKING_SECRET=aB1cD2eF...                          # Para HMAC signing
ADMIN_API_TOKEN=xyz...                               # Para endpoints admin
COMMUNITY_PUBLISHER_ENABLED=true

# URLs
TRACKING_BASE_URL=https://carvipix.app               # Base para tracking URLs
WEBHOOK_SECRET=abc123...                             # Para validar webhooks

# Timezone
CARVIPIX_TIMEZONE=America/Mazatlan

# Modo
TEST_ONLY=false                                      # true = no enviar oficial
PAUSED=false                                         # true = no enviar nada
```

---

## ARCHIVOS PREVISTOS

```
Servicios Backend (~600 LOC):
  app/lib/types/
    └─ cpTypes.ts                          (120 LOC)
      - PublicationRequest, PublishedMessage,
        TrackingEvent, etc

  app/lib/services/
    ├─ cpEventProcessorService.ts          (80 LOC)
    ├─ cpFilterPipelineService.ts          (120 LOC)
    ├─ cpContentGeneratorService.ts        (100 LOC)
    ├─ cpPriorityQueueService.ts           (60 LOC)
    ├─ cpSchedulerService.ts               (100 LOC)
    └─ cpTrackingService.ts                (80 LOC)

API Endpoints (~130 LOC):
  app/api/internal/community-publisher/
    ├─ route.ts                            (80 LOC)
      - GET /status, GET /publications, etc
    ├─ publish-now/route.ts                (30 LOC)
    ├─ config/route.ts                     (30 LOC)
    └─ pause/route.ts                      (20 LOC)

  app/api/webhooks/community-publisher/
    └─ tracking/route.ts                   (50 LOC)

Admin Panel (~250 LOC):
  app/admin/community-publisher/
    ├─ page.tsx                            (150 LOC)
      - Main dashboard, queue, config
    └─ components/
        ├─ StatusCard.tsx                  (50 LOC)
        ├─ QueueTable.tsx                  (80 LOC)
        └─ ConfigForm.tsx                  (100 LOC)

Data & Config (~30 LOC):
  data/community-publisher/
    ├─ config.json                         (JSON)
    ├─ queue.json                          (JSON)
    ├─ templates/
    │   ├─ FREE_ALERT.json
    │   ├─ MARKET_STATUS.json
    │   ├─ OPPORTUNITY_DEVELOPING.json
    │   ├─ TRADE_RESULT.json
    │   └─ EDUCATIONAL_OR_PROMOTIONAL.json
    └─ (directories for publications, tracking)

TOTAL: ~1,300 LOC
```

---

## ESTIMACIÓN DE TRABAJO

```
Phase 1: Telegram Integration              25 hours
  - Bot client setup
  - Channel validation
  - Token management
  - Error handling

Phase 2: Core Publisher                    30 hours
  - Event processor
  - Disparador integration
  - 5 publication types
  - Queue + priority

Phase 3: Templates                         20 hours
  - Template library
  - Variant management
  - Content generation

Phase 4: Persistence                       15 hours
  - Atomic writes
  - Locking mechanism
  - Recovery logic

Phase 5: Admin Panel                       20 hours
  - Dashboard UI
  - Queue management
  - Config controls

Phase 6: Tracking                          15 hours
  - HMAC signing
  - Event registration
  - PayPal integration

Testing + Debugging                        10 hours

─────────────────────────────────
TOTAL: ~120 hours (3 weeks, 1 dev)
```

---

**DOCUMENTO CONGELADO**: 🔒 No modificar. Usar como estándar técnico para implementación.

**SIGUIENTE**: Crear IMPLEMENTATION_PLAN_V1.md + Comenzar Fase 1
