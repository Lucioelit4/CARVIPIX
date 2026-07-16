# COMMUNITY PUBLISHER V1 — CONTRATO DE INTERFAZ

**Versión**: 1.0  
**Fecha**: 2026-07-14  
**Propósito**: Especificación técnica exacta de inputs, outputs, tipos, persistencia y endpoints

---

## TABLA DE CONTENIDOS

1. [Tipos de Entrada (Disparador)](#tipos-de-entrada)
2. [Tipos Internos](#tipos-internos)
3. [Tipos de Salida (Telegram)](#tipos-de-salida)
4. [Persistencia](#persistencia)
5. [API Endpoints](#api-endpoints)
6. [Validaciones](#validaciones)
7. [Flujo de Datos](#flujo-de-datos)
8. [Variables de Entorno](#variables-de-entorno)

---

## TIPOS DE ENTRADA

### Event: ANALYSIS_COMPLETED

```typescript
interface DisparadorAnalysisCompleted {
  // Identificadores
  analysis_id: string;              // UUID
  signal_id: string;                // UUID
  timestamp: number;                // ms since epoch
  
  // Decisión
  decision: "ENTER_BUY" | "ENTER_SELL" | "HOLD";
  probability: number;              // 0-100
  conviction: number;               // 0-100
  
  // Configuración de entrada
  instrument: string;               // XAUUSD, EURUSD, etc
  entry_price: number;              // > 0
  stop_loss: number;                // > 0, < entry_price
  take_profit?: number;             // > entry_price (opcional)
  
  // Contexto
  timeframe: string;                // M5, M15, H1, H4, D1, W1
  reasoning: string;                // Resumen de análisis
  
  // Públicos vs Privados
  analysis_public: {
    market_state: string;
    technical_setup: string;
    support_levels: number[];
    resistance_levels: number[];
    volatility_percent: number;
    // ... otros datos públicos
  };
  analysis_private: null | undefined;  // NUNCA usar
  
  // Metadata
  expediente_id?: string;           // Referencia
  quality_score?: number;           // Calculado por ChatGPT, no modificar
}
```

### Event: TRADE_CLOSED

```typescript
interface DisparadorTradeClosed {
  // Identificadores
  paper_trade_id: string;           // UUID
  associated_signal_id: string | null;  // UUID de alerta que originó
  associated_analysis_id: string | null;
  
  // Ejecución
  instrument: string;
  entry_price: number;
  exit_price: number;
  entry_time: number;               // ms since epoch
  exit_time: number;
  
  // Resultado
  pnl_usd: number;                  // Puede ser negativo
  pnl_pips: number;
  duration_seconds: number;
  
  // Clasificación
  trade_type: "ANALYTICAL_PAPER" | "MT5_DEMO" | "LIVE_VERIFIED";
  
  // Metadata
  timestamp: number;
  quality_score?: number;
}
```

---

## TIPOS INTERNOS

### PublicationRequest

```typescript
interface PublicationRequest {
  id: string;                       // pub_[alphanumeric] (generado)
  type: "FREE_ALERT" | "MARKET_STATUS" | "OPPORTUNITY_DEVELOPING" 
        | "TRADE_RESULT" | "EDUCATIONAL_OR_PROMOTIONAL";
  
  source: {
    from: "DISPARADOR" | "SYSTEM";
    analysis_id?: string;
    signal_id?: string;
    paper_trade_id?: string;
  };
  
  raw_content: {
    instrument?: string;
    entry_price?: number;
    stop_loss?: number;
    probability?: number;
    pnl_usd?: number;
    // ... datos extraídos del evento
  };
  
  metadata: {
    created_at: number;
    timezone: "America/Mazatlan";
    channel: "TEST" | "OFFICIAL";
  };
}
```

### FilterResult

```typescript
type FilterResult = 
  | { pass: true; reason: null }
  | { pass: false; reason: "INVALID_TYPE" | "OUTSIDE_TIME_WINDOW" | 
      "DAILY_LIMIT_REACHED" | "DUPLICATE_SIGNAL" | "BLOCKED_KEYWORD" | 
      "SECURITY_CHECK_FAILED" | "EXPIRED_SIGNAL" };
```

### PublishedMessage

```typescript
interface PublishedMessage {
  publication_id: string;           // pub_[alphanumeric]
  type: string;
  status: "PENDING" | "DELIVERED" | "FAILED" | "SKIPPED" | "DEAD_LETTER";
  
  content: {
    markdown: string;               // Mensaje final
    html?: string;                  // Si se usa HTML en Telegram
  };
  
  tracking: {
    url: string;                    // https://carvipix.app/...?pub_id=X&sig=Y
    signature: string;              // HMAC-SHA256
    variant_id: string;             // Cuál variante se usó
    source: "telegram";
  };
  
  telegram: {
    channel_id: string;             // -1001234567890
    message_id?: number;            // ID de mensaje Telegram (después de enviar)
    sent_at?: number;
    attempts: number;
    last_error?: string;
  };
  
  metadata: {
    created_at: number;
    signal_id?: string;             // Si es FREE_ALERT
    analysis_id?: string;
    updated_at: number;
  };
}
```

### TrackingEvent

```typescript
interface TrackingEvent {
  event_id: string;                 // evt_[alphanumeric]
  type: "CLICK" | "PAGE_VISIT" | "SIGNUP_STARTED" | "SIGNUP_COMPLETED" | "PAYMENT_APPROVED";
  timestamp: number;
  
  publication: {
    pub_id: string;                 // Recuperado de URL
    campaign_id?: string;
    variant_id?: string;
    content_type: string;
  };
  
  data: {
    // CLICK
    user_agent?: string;
    ip_address?: string;            // Hash, no IP completa
    device_type?: "MOBILE" | "DESKTOP";
    
    // PAGE_VISIT
    page_url?: string;
    referrer?: string;
    session_id?: string;            // Cookie hash
    
    // SIGNUP_STARTED / SIGNUP_COMPLETED
    user_id?: string;               // Si COMPLETED
    
    // PAYMENT_APPROVED
    transaction_id?: string;
    amount_usd?: number;
  };
}
```

---

## TIPOS DE SALIDA

### Telegram Message Format

```typescript
interface TelegramMessage {
  chat_id: string;                  // @carvipix_official
  text: string;                     // Markdown o HTML
  parse_mode: "Markdown" | "HTML";
  reply_markup?: {
    inline_keyboard: [
      [
        {
          text: string;
          url: string;              // URL con tracking
        }
      ]
    ];
  };
  // NO soportar: reply_to_message_id, etc
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

### Esquema de Archivos

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
│     "blocked_keywords": ["prompt", "api_key", "secret", ...],
│     "paused": false,
│     "test_only": false
│   }
│
├── queue.json
│   {
│     "last_updated": 1726270800000,
│     "items": [
│       {
│         "id": "queue_001",
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
│   ├── 20260714.json
│   │   {
│   │     "date": "20260714",
│   │     "publications": [
│   │       {
│   │         "publication_id": "pub_xY9mK2nL",
│   │         "type": "FREE_ALERT",
│   │         "status": "DELIVERED",
│   │         "content": "📊 EURUSD...",
│   │         "variant_id": "FREE_ALERT_ENTRY_001",
│   │         "tracking": { "url": "...", "signature": "..." },
│   │         "telegram": {
│   │           "channel_id": "-1001234567890",
│   │           "message_id": 12345,
│   │           "sent_at": 1726270800000
│   │         },
│   │         "source": { "signal_id": "sig_...", "analysis_id": "ana_..." },
│   │         "metadata": {
│   │           "created_at": 1726270755000,
│   │           "attempts": 1
│   │         }
│   │       }
│   │     ]
│   │   }
│   └── archive/
│       └── 2026-06.json
│
├── tracking/
│   ├── 20260714.json
│   │   {
│   │     "date": "20260714",
│   │     "events": [
│   │       {
│   │         "event_id": "evt_abc123",
│   │         "type": "CLICK",
│   │         "timestamp": 1726271000000,
│   │         "publication": { "pub_id": "pub_xY9mK2nL", ... },
│   │         "data": { "user_agent": "...", "device_type": "mobile" }
│   │       }
│   │     ]
│   │   }
│   └── archive/
│       └── 2026-06.json
│
├── templates/
│   ├── FREE_ALERT.json
│   │   {
│   │     "type": "FREE_ALERT",
│   │     "variants": [
│   │       {
│   │         "id": "FREE_ALERT_ENTRY_001",
│   │         "content": "🚀 ${instrument} ${direction}\n📍 Entrada: ${entry}\n..."
│   │       },
│   │       { "id": "FREE_ALERT_ENTRY_002", "content": "..." }
│   │     ]
│   │   }
│   ├── MARKET_STATUS.json
│   ├── OPPORTUNITY_DEVELOPING.json
│   ├── TRADE_RESULT.json
│   └── EDUCATIONAL_OR_PROMOTIONAL.json
│
└── logs/
    └── error.log
```

### Idempotencia

**Clave única para FREE_ALERT**:
```
hash(signal_id + channel_id)

Comprobación antes de publicar:
  publication = findBySignalAndChannel(signal_id, channel_id)
  if (publication && publication.status == DELIVERED) {
    SKIP (ya publicada)
  }
```

**Clave única para TRADE_RESULT**:
```
hash(paper_trade_id + channel_id)

Comprobación:
  result = findByTradeAndChannel(paper_trade_id, channel_id)
  if (result && result.status == DELIVERED) {
    SKIP (ya publicada)
  }
```

---

## API ENDPOINTS

### GET /api/internal/community-publisher/status

**Requiere**: Admin auth token  
**Respuesta**:
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
    "sent_at": "2026-07-14T10:00:00Z"
  },
  "next_in_queue": {
    "publication_id": "pub_aB1cD2eF",
    "type": "MARKET_STATUS",
    "priority": 3
  }
}
```

### GET /api/internal/community-publisher/publications

**Requiere**: Admin auth token  
**Query params**:
- `date` (YYYYMMDD, optional): Filtrar por fecha
- `limit` (default 50): Máximo de resultados
- `status` (optional): DELIVERED, FAILED, SKIPPED

**Respuesta**:
```json
{
  "publications": [
    {
      "publication_id": "pub_xY9mK2nL",
      "type": "FREE_ALERT",
      "status": "DELIVERED",
      "created_at": "2026-07-14T09:55:00Z",
      "content_preview": "🚀 EURUSD..."
    }
  ],
  "total": 5,
  "timestamp": "2026-07-14T10:30:00Z"
}
```

### GET /api/internal/community-publisher/queue

**Requiere**: Admin auth token  
**Respuesta**:
```json
{
  "queue": [
    {
      "queue_id": "queue_001",
      "publication_id": "pub_aB1cD2eF",
      "type": "MARKET_STATUS",
      "priority": 3,
      "content_preview": "📊 XAUUSD..."
    }
  ],
  "next_to_publish": {
    "queue_id": "queue_001",
    "priority": 3
  }
}
```

### POST /api/internal/community-publisher/publish-now

**Requiere**: Admin auth token  
**Body**:
```json
{
  "publication_id": "pub_xY9mK2nL"
}
```
**Respuesta**:
```json
{
  "success": true,
  "message_id": 12345,
  "sent_at": "2026-07-14T10:00:00Z"
}
```

### POST /api/internal/community-publisher/pause

**Requiere**: Admin auth token  
**Body**:
```json
{
  "paused": true,
  "reason": "Maintenance"
}
```

### POST /api/internal/community-publisher/config

**Requiere**: Admin auth token  
**Body**:
```json
{
  "limits.free_alerts_per_day": 2,
  "test_only": false,
  "channel": "OFFICIAL"
}
```

### POST /api/webhooks/community-publisher/tracking

**Auth**: Signature validation (HMAC)  
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
    "user_agent": "...",
    "device_type": "mobile"
  }
}
```
**Respuesta**:
```json
{
  "success": true,
  "event_id": "evt_abc123"
}
```

---

## VALIDACIONES

### Validaciones de Input (DisparadorAnalysisCompleted)

```typescript
// REQUIRED
- analysis_id: UUID format
- signal_id: UUID format
- decision: IN ["ENTER_BUY", "ENTER_SELL", "HOLD"]
- probability: 0-100, number
- conviction: 0-100, number
- instrument: string, length 3-10
- entry_price: > 0, number
- stop_loss: 0 < stop_loss < entry_price
- timestamp: valid number (ms)

// OPTIONAL
- take_profit: if present, > entry_price
- analysis_public: object, not null
- analysis_private: must be null or undefined

// MUST REJECT IF
- analysis_private: NOT null/undefined
- Any field missing from required list
- probability < 0 or > 100
- entry_price <= stop_loss
```

### Validaciones de Seguridad

```typescript
// ALWAYS REJECT IF
for (keyword in blockedKeywords) {
  if (content.toLowerCase().includes(keyword)) {
    REJECT("Blocked keyword: " + keyword)
  }
}

// ALWAYS VALIDATE
- HMAC signature valid: HMAC-SHA256(url_params, SECRET)
- No unescaped Markdown (prevent injection)
- URL length < 2048 chars
- No credentials, tokens, passwords

// ALWAYS SANITIZE
- Remove analysis_private before storing
- Hash IP addresses
- Remove full email addresses
```

---

## FLUJO DE DATOS

### FREE_ALERT Flow

```
ENTRADA (Disparador):
  DisparadorAnalysisCompleted
  └─ decision = ENTER_BUY, probability = 78

PROCESAMIENTO:
  1. EventProcessor
     → PublicationRequest(type=FREE_ALERT)
  
  2. FilterPipeline
     → F1: Type check ✓
     → F2: Time check ✓
     → F3: Daily limits (1/2) ✓
     → F4: Security check ✓
  
  3. ContentGenerator
     → Selecciona variante
     → Genera URL: https://carvipix.app/free-alert?pub_id=...&sig=...
     → Compone Markdown
  
  4. PriorityQueue
     → Inserta con priority=1
  
  5. Scheduler (tick cada 5 min)
     → Publica a Telegram
     → Recibe message_id
     → Marca DELIVERED
     → Persiste

SALIDA (Telegram):
  Message: "🚀 EURUSD Señal Alcista..." + link

TRACKING (Landing page):
  1. Usuario clickea
  2. Llega a landing con ?pub_id=X&sig=Y
  3. Valida firma
  4. Registra CLICK
  5. Muestra contenido
  6. Usuario se registra → SIGNUP_COMPLETED
  7. Usuario paga → PAYMENT_APPROVED

CORRELACIÓN:
  publication_id (pub_id) enlaza todos los eventos
```

### TRADE_RESULT Flow

```
ENTRADA (Disparador):
  DisparadorTradeClosed
  └─ associated_signal_id = sig_123 (fue publicado previamente)

VALIDACIÓN:
  publication = findBySignalAndChannel(sig_123, "@carvipix_official")
  if (!publication || publication.status != DELIVERED) {
    REJECT: "Alerta asociada no publicada"
  }

PROCESAMIENTO:
  1. EventProcessor → PublicationRequest(type=TRADE_RESULT)
  2. FilterPipeline (4 filtros) → pasa todos
  3. ContentGenerator → "✅ Resultado: +25 pips..."
  4. PriorityQueue (priority=2)
  5. Scheduler → Publica

SALIDA:
  Message con resultado + etiqueta (ANALYTICAL_PAPER, MT5_DEMO, LIVE_VERIFIED)
  + link de tracking

TRACKING:
  Igual a FREE_ALERT (5 eventos posibles)
```

---

## VARIABLES DE ENTORNO

```bash
# Telegram
TELEGRAM_BOT_TOKEN=7123456789:ABCdef...     # Nunca loguear
TELEGRAM_CHANNEL_TEST=-1001234567890
TELEGRAM_CHANNEL_OFFICIAL=-1001234567890

# Seguridad
TRACKING_SECRET=aB1cD2eF...                 # Para HMAC
ADMIN_API_TOKEN=xyz...                      # Para endpoints admin
COMMUNITY_PUBLISHER_ENABLED=true

# URLs
TRACKING_BASE_URL=https://carvipix.app
WEBHOOK_SECRET=abc123...

# Timezone
CARVIPIX_TIMEZONE=America/Mazatlan

# Mode
TEST_ONLY=false
PAUSED=false
```

---

## ARCHIVOS PREVISTOS

```
app/lib/types/
├── communityPublisherTypes.ts         (100 LOC)

app/lib/services/
├── cpEventProcessorService.ts         (80 LOC)
├── cpFilterPipelineService.ts         (120 LOC)
├── cpContentGeneratorService.ts       (80 LOC)
├── cpPriorityQueueService.ts          (60 LOC)
├── cpSchedulerService.ts              (100 LOC)
├── cpTrackingService.ts               (80 LOC)

app/api/internal/community-publisher/
├── route.ts                           (100 LOC - GET status, GET publications)
├── publish-now/route.ts               (40 LOC)
├── config/route.ts                    (40 LOC)
├── pause/route.ts                     (20 LOC)

app/api/webhooks/community-publisher/
├── tracking/route.ts                  (50 LOC)

app/admin/community-publisher/
├── page.tsx                           (180 LOC - Dashboard + Queue + Config)
├── components/
│   ├── StatusCard.tsx                 (50 LOC)
│   ├── QueueTable.tsx                 (80 LOC)
│   ├── ConfigForm.tsx                 (100 LOC)

data/community-publisher/
├── (JSON files y directorios)

Total: ~1,300 LOC
```

---

## ESTIMACIÓN

```
Services Backend:           40 hours
API Endpoints:              15 hours
Admin Panel UI:             20 hours
Telegram Integration:       15 hours
Tracking Service:           15 hours
Testing + Debugging:        15 hours
─────────────────────────
TOTAL:                      120 hours (3 semanas)
```

---

**ESTADO**: Contrato V1 simplificado, listo para aprobación

**SIGUIENTE**: Ambos documentos (Arquitectura + Contrato) requieren aprobación antes de iniciar implementación
