# COMMUNITY PUBLISHER V1 — ARQUITECTURA SIMPLIFICADA

**Versión**: 1.0 (Production-Ready)  
**Fecha**: 2026-07-14  
**Propósito**: Publicar decisiones reales del Observador V3 en Telegram de forma profesional y medible  
**Metodología**: Arquitectura → Contrato → Implementación → Certificación → Congelamiento

---

## TABLA DE CONTENIDOS

1. [Visión](#visión)
2. [Flujo Principal](#flujo-principal)
3. [Tipos de Publicación (5)](#tipos-de-publicación)
4. [Componentes](#componentes)
5. [Filtros y Validación](#filtros-y-validación)
6. [Alertas Gratuitas - Reglas Definitivas](#alertas-gratuitas---reglas-definitivas)
7. [Resultados de Operación](#resultados-de-operación)
8. [Tracking Interno](#tracking-interno)
9. [Integración Telegram](#integración-telegram)
10. [Panel Administrativo](#panel-administrativo)
11. [Persistencia e Idempotencia](#persistencia-e-idempotencia)
12. [Seguridad](#seguridad)
13. [Alcance V2/V3](#alcance-v2v3)

---

## VISIÓN

**Community Publisher V1 es un publicador de eventos automático que distribuye decisiones reales del Observador Maestro V3 a través de Telegram de forma profesional.**

### No es:
- ❌ Analizador de mercado (eso es Observador V3)
- ❌ Redactor de señales (ChatGPT las crea, CP las publica)
- ❌ Sistema de recomendaciones (solo comunica lo que existe)
- ❌ Moderador de comunidad (sin interacción bidireccional)

### Sí es:
- ✅ Consumidor de eventos del Disparador
- ✅ Validador de integridad
- ✅ Distribuidor a Telegram
- ✅ Sistema de rastreo de conversión (clic → registro → pago)
- ✅ Historial y auditoría inmutable

### Principios
1. **Integridad**: Nunca modifica, crea ni omite datos sin registrarlo
2. **Transparencia**: Todo es verificable, nada es oculto
3. **Profesionalismo**: Cada publicación es precisa y valiosa
4. **Medición**: Rastreo end-to-end de conversión
5. **Simplicidad**: 1,600 LOC, no 6,000+

---

## FLUJO PRINCIPAL

```
┌────────────────────────────┐
│  OBSERVADOR MAESTRO V3     │
│  (Análisis + Decisiones)   │
└────────────┬───────────────┘
             │
    ┌────────▼─────────┐
    │   DISPARADOR     │
    │  (Eventos reales)│
    └────────┬─────────┘
             │
    ┌────────▼──────────────────┐
    │ COMMUNITY PUBLISHER V1     │
    │                            │
    │ 1. Validar evento          │
    │ 2. Mapear a tipo           │
    │ 3. Pasar filtros (4x)      │
    │ 4. Enqueue con prioridad   │
    │ 5. Generar plantilla       │
    │ 6. Enviar a Telegram       │
    │ 7. Registrar + tracking    │
    └────────┬──────────────────┘
             │
    ┌────────▼─────────┐
    │  TELEGRAM BOT    │
    │  @carvipix_bot   │
    └────────┬─────────┘
             │
    ┌────────▼─────────────────┐
    │  CANAL OFICIAL            │
    │  @carvipix_official       │
    │  (Mensaje público)        │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────────┐
    │  URL CON TRACKING             │
    │  https://carvipix.app/alert?  │
    │  pub_id=X&sig=Y&source=tg    │
    └────────┬─────────────────────┘
             │
    ┌────────▼──────────────────┐
    │  CARVIPIX LANDING PAGE    │
    │  (Captura conversión)     │
    │  Click → Visit → Signup   │
    │          → Payment        │
    └───────────────────────────┘
```

---

## TIPOS DE PUBLICACIÓN

**Total: 5 tipos (obligatorios v1)**

### 1. FREE_ALERT
**Origen**: Observador V3 (ANALYSIS_COMPLETED, decision = ENTER_BUY | ENTER_SELL)  
**Frecuencia**: Máx 2 por día (zona `America/Mazatlan`)  
**Prioridad**: 1 (máxima)  
**Destino**: Telegram público  
**Contenido**: Instrument, entrada, stop loss, probability, timeframe  
**Tracking**: Click → Landing → Seguimiento

```
Ejemplo:
🚀 EURUSD Señal Alcista
📍 Entrada: 1.0950
🛑 Stop Loss: 1.0920
⚡ Probabilidad: 78%
📊 Timeframe: H1

Únete: [link with tracking]
```

### 2. MARKET_STATUS
**Origen**: Observador V3 (MARKET_STATUS_CHANGED o análisis público)  
**Frecuencia**: Sin límite  
**Prioridad**: 3  
**Destino**: Telegram público  
**Contenido**: Instrument, estado, niveles clave, contexto  
**Tracking**: Click → Landing

```
Ejemplo:
📊 XAUUSD en consolidación
Nivel clave: 2,500 USD
Próxima resistencia: 2,510
Volatilidad normal.
```

### 3. OPPORTUNITY_DEVELOPING
**Origen**: Observador V3 (nivel técnico o setup en formación)  
**Frecuencia**: Sin límite  
**Prioridad**: 4  
**Destino**: Telegram público  
**Contenido**: Instrument, setup, confirmación esperada  
**Tracking**: Click → Landing

```
Ejemplo:
🔍 GBPUSD: Doble piso formándose
Esperar ruptura de 1.2650
Seguimiento en tiempo real.
```

### 4. TRADE_RESULT
**Origen**: Paper Trading Monitor (posición cerrada, asociada a alerta previa)  
**Frecuencia**: Sin límite (solo si fue publicada alerta)  
**Prioridad**: 2  
**Destino**: Telegram público  
**Contenido**: Entrada, salida, P&L, duración, tipo (`ANALYTICAL_PAPER`, `MT5_DEMO`, `LIVE_VERIFIED`)  
**Tracking**: Click → Landing

```
Ejemplo:
✅ Resultado: EURUSD [ANALYTICAL_PAPER]
📍 Entrada: 1.0950
🎯 Salida: 1.0975
💰 Ganancia: +25 pips
⏱️ Duración: 1h 45m
```

### 5. EDUCATIONAL_OR_PROMOTIONAL
**Origen**: Sistema (educación aprobada, promoción controlada)  
**Frecuencia**: Máx 1 cada 48h (promoción) + educación según reglas  
**Prioridad**: 5 (promoción), 4 (educación)  
**Destino**: Telegram público  
**Contenido**: Tema, mensaje, CTA  
**Tracking**: Click → Landing → Conversión

```
EDUCACIÓN:
📚 Gestión de Riesgo: ¿Cómo calcular la posición correcta?
El tamaño de la posición es 80% del éxito...
[Leer más]

PROMOCIÓN:
🎁 Acceso anticipado a la nueva versión del Bot
Pruébalo gratis: [link]
```

---

## COMPONENTES

### 1. Event Processor
**Entrada**: DisparadorEvent  
**Output**: PublicationRequest (draft, no validada)  
**Lógica**:
- Validar estructura del evento
- Mapear a PublicationType
- Extraer campos relevantes
- Generar `publication_id` único (alphanumeric random)
- Return PublicationRequest o NULL

### 2. Filter Pipeline (4 filtros)
**Entrada**: PublicationRequest  
**Output**: ACCEPTED / REJECTED con razón  

```
F1: Type Check
    ¿Es uno de 5 tipos permitidos?
    ¿Está habilitado en config?
    → ACEPTADO / RECHAZADO

F2: Time Check
    ¿Es horario permitido (8-22 UTC)?
    → ACEPTADO / RECHAZADO

F3: Rate Limits
    FREE_ALERT: máx 2/día
    TRADE_RESULT: sin límite
    EDUCATIONAL: sin límite
    PROMOTIONAL: máx 1/48h
    → ACEPTADO / ENQUEUE_PARA_MAÑANA / RECHAZADO

F4: Security Check
    ¿Contiene keyword bloqueado?
    ¿URL es segura?
    ¿Datos privados expuestos?
    → ACEPTADO / RECHAZADO
```

### 3. Content Generator
**Entrada**: PublicationRequest (validada)  
**Output**: FinalMessage (Markdown + URL tracking)  
**Lógica**:
- Cargar plantilla para tipo
- Seleccionar variante (8-12 por tipo)
- Reemplazar variables
- Generar URL con tracking: `pub_id`, `campaign_id`, `variant_id`, `source=telegram`, `sig=HMAC`
- Validar Markdown
- Return FinalMessage

### 4. Priority Queue
**Entrada**: PublicationRequest (validada)  
**Output**: QueuedPublication (ordenada)  
**Lógica**:
- Asignar prioridad (1-5)
- Insertar en cola ordenada
- Persistir a disco
- Max queue size: 100 items (drop si overflow)

**Prioridades**:
```
1. FREE_ALERT
2. TRADE_RESULT
3. MARKET_STATUS
4. OPPORTUNITY_DEVELOPING
5. EDUCATIONAL_OR_PROMOTIONAL
```

### 5. Simple Scheduler
**Entrada**: Queue, ChannelState  
**Output**: Telegram message  
**Ejecución**: Cada 5 minutos  

```pseudocode
function schedulerTick() {
  if (not paused AND not test_only) {
    next = queue.getFirst()
    if (next) {
      result = sendToTelegram(next)
      if (result.success) {
        mark(next, DELIVERED, result.message_id)
      } else {
        increment(next.attempts)
        if (next.attempts >= 3) {
          mark(next, DEAD_LETTER)
        }
      }
    }
  }
}
```

### 6. Tracking Service
**Entrada**: TrackingEvent (de landing page)  
**Output**: Persistencia + correlación con publication  
**Lógica**:
- Recibir evento (CLICK, PAGE_VISIT, SIGNUP_STARTED, SIGNUP_COMPLETED, PAYMENT_APPROVED)
- Validar HMAC signature
- Buscar publication por `pub_id`
- Agregar evento a publication.tracking_events
- Persistir
- Optonal: enviar a analytics backend

---

## FILTROS Y VALIDACIÓN

### Validaciones de Entrada (Disparador)

```typescript
// ANALYSIS_COMPLETED
- analysis_id: string (uuid)
- signal_id: string (uuid)
- instrument: string (XAUUSD, EURUSD, etc)
- decision: "ENTER_BUY" | "ENTER_SELL" | "HOLD"
- probability: 0-100 (número)
- conviction: 0-100 (número)
- entry_price: número positivo
- stop_loss: número positivo < entry_price
- take_profit?: número positivo > entry_price
- timeframe: string (M5, M15, H1, H4, D1)
- analysis_public: { ... }           ← SOLO ESTO
- analysis_private: null | undefined ← NUNCA USAR

// TRADE_CLOSED
- paper_trade_id: string (uuid)
- associated_signal_id: string (uuid o null)
- associated_analysis_id: string (uuid o null)
- instrument: string
- entry_price: número
- exit_price: número
- entry_time: timestamp
- exit_time: timestamp
- pnl_usd: número (puede ser negativo)
- pnl_pips: número
- duration_seconds: número
```

### Filtro 1: Type Check
```
if (type NOT IN [FREE_ALERT, MARKET_STATUS, ...]) REJECT
if (type IN disabled_types) REJECT
```

### Filtro 2: Time Check
```
if (hour < 8 OR hour > 22 in UTC) {
  if (type != FREE_ALERT) REJECT
  if (probability < 80) REJECT  // Solo alertas críticas fuera de horario
}
```

### Filtro 3: Rate Limits
```
if (type == FREE_ALERT) {
  count = countToday(FREE_ALERT, timezone=America/Mazatlan)
  if (count >= 2) REJECT_AND_ENQUEUE_FOR_TOMORROW
}

if (type == EDUCATIONAL_OR_PROMOTIONAL AND isPromotional) {
  last_promo = getLastPromotional()
  if (now - last_promo < 48h) ENQUEUE_FOR_LATER
}
```

### Filtro 4: Security Check
```
blockedKeywords = [
  "prompt", "api_key", "secret", "/home/", 
  "password", "reasoning", "analysis_private"
]

for keyword in blockedKeywords {
  if (content.includes(keyword)) REJECT
}

// Signature validation
if (!validateHMAC(url, signature)) REJECT
```

---

## ALERTAS GRATUITAS - REGLAS DEFINITIVAS

### Regla 1: Máximo 2 por día
**Zona horaria**: `America/Mazatlan` (UTC-7 / UTC-6 con DST)  
**Ventana**: Medianoche a medianoche local  
**Inicio contador**: Cuando se entrega primera alerta del día  
**Reset**: Medianoche local (automático)

### Regla 2: Decisión y Probabilidad
**Solo publicar si**:
- `decision == "ENTER_BUY"` O `decision == "ENTER_SELL"`
- `probability >= 70`
- `conviction >= 60`
- `signal_complete == true`
- `signal_expired == false`

### Regla 3: Publicación Inmediata
```
Cuando llega alert que pasa filtros:
  → Publica INMEDIATAMENTE
  → NO espera a futuras alertas para comparar
  → NO descarta por "baja calidad"
  
Si ya se publicaron 2 alertas hoy:
  → Rechaza con razón SKIPPED_DAILY_LIMIT
  → NO intenta mañana automáticamente
```

### Regla 4: Idempotencia
```
Clave única: signal_id + channel_id

Si llega alert con signal_id + channel_id ya en historial:
  → NO publicar nuevamente
  → Registrar como SKIPPED_DUPLICATE
```

### Regla 5: Vigencia
```
Una alerta se considera "vigente" si:
  - Entrada aún no alcanzada (price != entry)
  - No más de 8 horas desde creación
  - Resultado no ya cerrado (trade_closed == false)

Si alerta expirada llega: REJECT
```

### Regla 6: Ejemplo Completo
```
09:30 UTC (02:30 Mazatlan)
  REJECT (fuera de horario)

10:00 UTC (03:00 Mazatlan)
  ACCEPT (en horario)
  Publica alerta #1
  count_today = 1

12:30 UTC (05:30 Mazatlan)
  ACCEPT (en horario, prob 75%)
  Publica alerta #2
  count_today = 2

14:00 UTC (07:00 Mazatlan)
  REJECT (count_today >= 2)
  Razón: SKIPPED_DAILY_LIMIT

00:01 UTC (17:01 Mazatlan anterior)
  Reset: count_today = 0
  Próxima alerta será #1 del día siguiente
```

---

## RESULTADOS DE OPERACIÓN

### Regla 1: Solo Previamente Publicados
```
TRADE_CLOSED solo se publica si:
  ✅ associated_signal_id fue publicado en FREE_ALERT
  ✅ publication_id de esa alerta existe
  ✅ publication.status == DELIVERED
```

### Regla 2: Etiqueta Obligatoria
```
Cada resultado debe indicar:

ANALYTICAL_PAPER:
  "Resultado de análisis sobre datos históricos"
  → Backtest o simulación

MT5_DEMO:
  "Resultado en cuenta demo"
  → Paper trading en MT5 demo

LIVE_VERIFIED:
  "Resultado en cuenta verificada"
  → Requiere certificado de broker

NUNCA usar solo "REAL" sin mecanismo.
```

### Regla 3: Contenido
```
✅ Entrada, salida, pips, USD, duración
✅ Etiqueta de tipo (ANALYTICAL_PAPER, etc)
✅ Link a Telegram para verificación

❌ Predicción de futuros resultados
❌ Garantía de ganancias
❌ Análisis no verificado
```

---

## TRACKING INTERNO

### URL de Tracking
```
Base: https://carvipix.app/[page]

Con parámetros:
  ?pub_id=xY9mK2nL
  &campaign_id=aB1cD2eF
  &variant_id=EDU_RISK_001
  &content_type=FREE_ALERT
  &source=telegram
  &sig=5f7d2e8a9c1b2d3f... (HMAC-SHA256)

Ejemplo completo:
https://carvipix.app/free-alert
  ?pub_id=xY9mK2nL
  &campaign_id=
  &variant_id=
  &content_type=FREE_ALERT
  &source=telegram
  &sig=HMAC(...)
```

### Firma HMAC
```
signature = HMAC-SHA256(
  message: "pub_id=X&campaign_id=Y&...",
  secret: process.env.TRACKING_SECRET
)

Validación en landing:
  computed_sig = HMAC-SHA256(url_params, secret)
  if (computed_sig != provided_sig) REJECT_TRACKING_EVENT
```

### Eventos Rastreados (5 total)
```
1. CLICK
   - Usuario hace clic en link de Telegram
   - Tiempo
   - User agent, device
   - Registrado: client-side (JS)

2. PAGE_VISIT
   - Llega a landing page
   - Page URL, referrer
   - Device type, bot score
   - Registrado: server-side

3. SIGNUP_STARTED
   - Abre formulario de registro
   - Email (primeros 2 chars + hash)
   - Registrado: server-side

4. SIGNUP_COMPLETED
   - Cuenta creada exitosamente
   - User ID (nuevo)
   - Registrado: server-side (auth service)

5. PAYMENT_APPROVED
   - Pago procesado por Stripe/PayPal
   - Transaction ID, amount
   - Registrado: server-side (payment webhook)
```

### Correlación y Atribución
```
Flow:
  1. Usuario hace clic en Telegram → CLICK event
  2. Landing page recibe request con pub_id
  3. Registra PAGE_VISIT con pub_id
  4. Usuario se registra → SIGNUP_COMPLETED
  5. Usuario paga → PAYMENT_APPROVED
  
Atribución:
  publication_id (pub_id) correlaciona todos los eventos
  Sin modificar lógica de pagos existente
  Sin duplicar eventos de registro
```

### No incluido en V1
```
❌ SCROLL_TRACKING
❌ BOT_DETECTION (score solo)
❌ A/B testing
❌ Métricas de Telegram (view count, reactions)
```

---

## INTEGRACIÓN TELEGRAM

### Bot Configuration
```
Bot Name: @carvipix_bot
Token: (en .env.local, NEVER en código)
Permisos: send_messages, edit_message_text, delete_message

Canales:
  - TEST: @carvipix_test (privado, testing)
  - OFFICIAL: @carvipix_official (público, producción)
```

### Capacidades Reales vs Aspiracionales

```
✅ SOPORTADO:
  - Enviar mensajes a canal
  - Editar mensajes enviados
  - Obtener forward_count
  - Usar Markdown con links

❌ NO SOPORTADO:
  - Recibir evento "usuario entró al canal"
  - Saber si usuario clickeó link externo
  - Obtener view counts automáticos
  - Enviar DM individual automático
  - Leer miembros del canal

⚠️ REQUIERE WORKAROUND:
  - Clics: rastreo INTERNO (CARVIPIX recibe clic)
  - Vistas: usar tracking de landing page
  - Engagement: usar reacciones (no identifica usuario)
```

### Reintentos
```
Intento 1: Inmediato
Si falla:
  Intento 2: +2 minutos
  Intento 3: +4 minutos
  Intento 4: +8 minutos (máx 3 reintentos)

Si 3 intentos fallan:
  Status = DEAD_LETTER
  Admin revisará manualmente
```

### Rate Limiting
```
Telegram API: máx 30 mensajes/segundo
CARVIPIX usa: <1 msg/segundo esperado
SIN PROBLEMA: Margen amplio
```

---

## PANEL ADMINISTRATIVO

### Área 1: Estado y Controles
```
Indicadores:
  - Conectado: SI / NO
  - Pausado: SI / NO
  - Canal: TEST / OFFICIAL
  - Alertas de hoy: X/2 usadas

Controles:
  - Pause/Resume toggle
  - Switch canal (TEST → OFFICIAL)
  - Manual publish (botón)
  - Conectar bot (si desconectado)
```

### Área 2: Cola e Historial
```
Cola de pendientes:
  - Tipo, contenido preview, prioridad
  - Botones: Publicar ahora, Rechazar, Mover arriba/abajo

Historial de hoy:
  - Tabla: Hora, Tipo, Estado (DELIVERED/FAILED/SKIPPED)
  - Click: expand para ver contenido completo
  - Filtro: por tipo, por estado
```

### Área 3: Configuración Básica
```
Parámetros editables:
  - Límite diario alertas: [número]
  - Pausa automática: [hora/hora]
  - Canal de prueba ID: [@...]
  - Canal oficial ID: [@...]
  - Intervalo educación: [número horas]
  - Modo TEST_ONLY: [checkbox]

Guardar aplicar inmediatamente (sin redeploy)
```

---

## PERSISTENCIA E IDEMPOTENCIA

### Estructura de Datos

```json
{
  "publication": {
    "id": "pub_xY9mK2nL",
    "type": "FREE_ALERT",
    "status": "DELIVERED|FAILED|SKIPPED|DEAD_LETTER",
    
    "source": {
      "analysis_id": "ana_...",
      "signal_id": "sig_...",
      "paper_trade_id": null
    },
    
    "content": "📊 EURUSD...",
    "template": "FREE_ALERT_v1",
    "variant_id": "FREE_ALERT_ENTRY_001",
    
    "telegram": {
      "channel_id": "-1001234567890",
      "message_id": 12345,
      "sent_at": "2026-07-14T10:00:00Z",
      "edited_at": null
    },
    
    "tracking": {
      "url": "https://carvipix.app/free-alert?pub_id=...",
      "signature": "5f7d2e8a...",
      "events": [
        { "type": "CLICK", "timestamp": "...", "user_agent": "..." },
        { "type": "PAGE_VISIT", "timestamp": "...", "device": "mobile" },
        { "type": "SIGNUP_COMPLETED", "timestamp": "..." }
      ]
    },
    
    "metadata": {
      "created_at": "2026-07-14T09:55:00Z",
      "attempts": 1,
      "error": null,
      "reason_skipped": null
    }
  }
}
```

### Idempotencia
```
Clave única: publication_id + channel_id

Antes de publicar:
  publication = loadBySignalAndChannel(signal_id, channel_id)
  if (publication.exists AND publication.status == DELIVERED) {
    REJECT: "Ya publicada"
  }
```

### Estados
```
PENDING
  ↓
DELIVERED (éxito en Telegram)
  ↓
  [fin]

ó

PENDING
  ↓
FAILED (intento 1-3 falló)
  ↓
DEAD_LETTER (>3 intentos, admin revisará)

ó

PENDING
  ↓
SKIPPED (rechazada por filtros)
  [fin]
```

### Persistencia
```
Archivo: data/community-publisher/publications/[YYYYMMDD].json

Directorio: data/community-publisher/
├── publications/
│   ├── 20260714.json
│   ├── 20260713.json
│   └── archive/
│       └── 2026-Q2.json
├── queue.json
├── config.json
├── tracking/
│   └── [YYYYMMDD].json
└── logs/
    └── error.log
```

### Reinicio sin Duplicación
```
1. Server inicia
2. Carga queue.json
3. Para cada item en queue con status PROCESSING:
   - Si telegram_message_id existe: ya fue publicada, marcar DELIVERED
   - Si no existe: reintentar (intento++)
4. Continúa scheduler
```

---

## SEGURIDAD

### Protecciones
```
✅ Token Telegram:
   - Guardado en .env.local (gitignored)
   - Nunca loguear
   - Rotar cada 90 días

✅ Datos Privados:
   - Nunca usar analysis_private
   - Nunca exponer prompts
   - Nunca exponer estrategia o credenciales

✅ URLs de Tracking:
   - Sin datos personales
   - Con firma HMAC
   - pub_id alphanumeric random (no secuencial)

✅ API Admin:
   - Requiere autenticación
   - Token en header
   - Logs sanitizados (sin tokens, no passwords)

✅ Validación:
   - Blocklist de keywords (prompt, api_key, secret, etc)
   - URL whitelist
   - HMAC signature validation
```

### Auditoría
```
Registrar:
  ✅ Cada publicación (timestamp, channel, content)
  ✅ Cada rechazo (razón)
  ✅ Cada intento (número, error si falla)
  ✅ Cada tracking event (sin datos personales)

NO registrar:
  ❌ Token de Telegram
  ❌ Contraseñas
  ❌ Emails completos (solo hash)
  ❌ Datos privados

Retención: 90 días en DB, 1 año en archivo
```

---

## ALCANCE V2/V3

### Aplazado para V2
```
❌ Calendario Editorial (semanal, biweekly, monthly)
❌ Sistema de Campañas (multi-fase con gating)
❌ Moderación de UGC
❌ Bienvenida automática en canal
❌ Webhooks de eventos de Telegram
❌ Panel Admin completo (8 módulos)
❌ Variantes avanzadas (weighted selection)
❌ Políticas de silencio complejas
❌ Escalabilidad a 100K miembros
❌ Redis caching
❌ Particiones de base de datos
```

### Aplazado para V3
```
❌ Integración con Telegram Premium metrics
❌ A/B testing de variantes
❌ Análisis de conversión por variante
❌ Machine learning para timing óptimo
❌ Integración con CRM
❌ Multi-canal (Discord, Twitter, etc)
❌ Análisis de sentiment de reacciones
```

---

## RESUMEN

| Aspecto | V1 |
|---------|-----|
| Tipos de publicación | 5 |
| Componentes | 6 |
| Filtros | 4 |
| Líneas de código | ~1,600 |
| Tiempo implementación | 120 horas |
| Estados de publicación | 4 |
| Eventos de tracking | 5 |
| Panel admin áreas | 3 |
| Capacidades Telegram | 6 confirmadas |
| Características no soportadas | 3 (marcadas claramente) |

---

**ESTADO**: Arquitectura V1 simplificada y verificada  
**SIGUIENTE**: Aprobación y proceder a Contrato V1
