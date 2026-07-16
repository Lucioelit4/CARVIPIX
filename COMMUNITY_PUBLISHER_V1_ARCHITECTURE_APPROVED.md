# COMMUNITY PUBLISHER V1 — ARQUITECTURA APROBADA Y CONGELADA

**Versión**: 1.0-APPROVED  
**Fecha**: 2026-07-14  
**Estado**: 🔒 CONGELADA — No agregar funciones V2/V3 durante implementación  
**Propósito**: Publicar decisiones del Observador V3 en Telegram con medición exacta

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
13. [Blindaje](#blindaje)
14. [Alcance V2/V3](#alcance-v2v3)

---

## VISIÓN

**Community Publisher V1 es un publicador de eventos automático que distribuye decisiones reales del Observador Maestro V3 a través de Telegram de forma profesional y medible.**

### No es:
- ❌ Analizador de mercado (Observador V3 lo hace)
- ❌ Redactor de señales (ChatGPT las crea, CP las publica)
- ❌ Sistema de recomendaciones (solo comunica lo que existe)
- ❌ Moderador de comunidad (sin interacción bidireccional)
- ❌ Procesador de pagos (integra con PayPal, no reemplaza)

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
5. **Simplicidad**: 1,300 LOC, no 6,000+
6. **Congelamiento**: V1 es V1, cambios a V2/V3

---

## FLUJO PRINCIPAL

```
┌────────────────────────────┐
│  OBSERVADOR MAESTRO V3     │
│  (Análisis + Decisiones)   │
└────────┬───────────────────┘
         │
  ┌──────▼─────────┐
  │   DISPARADOR   │
  │  (Eventos)    │
  └──────┬─────────┘
         │
  ┌──────▼──────────────────────┐
  │ COMMUNITY PUBLISHER V1       │
  │                              │
  │ 1. Validar evento            │
  │ 2. Mapear a tipo             │
  │ 3. Pasar 4 filtros          │
  │ 4. Enqueue con prioridad     │
  │ 5. Generar plantilla         │
  │ 6. Enviar a Telegram         │
  │ 7. Registrar + tracking      │
  └──────┬──────────────────────┘
         │
  ┌──────▼──────────┐
  │  TELEGRAM BOT   │
  │  @carvipix_bot  │
  └──────┬──────────┘
         │
  ┌──────▼──────────────────┐
  │ CANAL @carvipix_official │
  │ (Mensaje público)        │
  └──────┬───────────────────┘
         │
  ┌──────▼────────────────────────┐
  │ URL CON TRACKING              │
  │ https://carvipix.app/alert?   │
  │ pub_id=X&sig=Y&source=tg     │
  └──────┬─────────────────────────┘
         │
  ┌──────▼───────────────────┐
  │ LANDING PAGE             │
  │ (Captura conversión)     │
  │ Click→Visit→Signup→Pay   │
  └─────────────────────────┘
```

---

## TIPOS DE PUBLICACIÓN

### 1. FREE_ALERT (Alerta Gratuita)

```
Prioridad: 1 (máxima)
Límite: 2 por día (America/Mazatlan)
Triggers: DisparadorAnalysisCompleted
  decision IN ["ENTER_BUY", "ENTER_SELL"]
  probability >= 70
  
Publicación: INMEDIATA
  No esperar para comparar con otras alertas
  No acumular

Contenido:
  - Instrumento
  - Dirección (BUY/SELL)
  - Entrada
  - Stop Loss
  - Take Profit (opcional)
  - Probabilidad
  - Link de tracking

Ejemplo:
  🚀 EURUSD Señal Alcista
  📍 Entrada: 1.0950
  🛑 Stop: 1.0920
  ✅ Prob: 78%
  [Seguir →](https://carvipix.app/...&sig=...)
```

### 2. MARKET_STATUS (Estado del Mercado)

```
Prioridad: 3 (media)
Límite: Ilimitado
Triggers: DisparadorAnalysisCompleted
  decision = "HOLD"
  analysis_public incluye market state

Publicación: Cuando se genere

Contenido:
  - Resumen de mercado
  - Instrumentos principales
  - Contexto técnico
  - Sin recomendaciones explícitas

Ejemplo:
  📊 ESTADO DEL MERCADO
  Tendencia: Alcista (+2.5%)
  Volatilidad: Media
  XAUUSD: Recuperación en proceso
  [Análisis completo →](https://carvipix.app/...&sig=...)
```

### 3. OPPORTUNITY_DEVELOPING (Oportunidad en Desarrollo)

```
Prioridad: 4 (baja)
Límite: Ilimitado
Triggers: Setup en formación, condiciones previas

Publicación: Cuando se genere

Contenido:
  - Setup técnico
  - Niveles clave
  - Tiempo estimado
  - Próximos pasos

Ejemplo:
  🔍 OPORTUNIDAD EN DESARROLLO
  GOLD: Doble suelo en formación
  Niveles: 2080-2085
  Tiempo: 4-6 horas
  [Seguimiento →](https://carvipix.app/...&sig=...)
```

### 4. TRADE_RESULT (Resultado de Operación)

```
Prioridad: 2 (alta)
Límite: Ilimitado (solo de alertas publicadas)
Triggers: DisparadorTradeClosed
  paper_trade_id existe
  associated_signal_id fue publicado previamente

Validación obligatoria:
  findBySignalAndChannel(associated_signal_id, channel_id)
  if (!result || result.status != DELIVERED) {
    REJECT: "Alerta asociada no publicada en este canal"
  }

Clasificación:
  - ANALYTICAL_PAPER: Papel analítico
  - MT5_DEMO: Demo MT5
  - LIVE_VERIFIED: Operación en vivo

Contenido:
  - Tag de tipo
  - Resultado (ganancias/pérdidas)
  - Duración
  - PnL en pips
  - Instrumento

Ejemplo:
  ✅ RESULTADO: EURUSD +25 pips
  Type: MT5_DEMO
  Duración: 45 min
  Entry: 1.0950
  Exit: 1.0985
  PnL: +25 pips, $250 USD
  [Ver análisis →](https://carvipix.app/...&sig=...)
```

### 5. EDUCATIONAL_OR_PROMOTIONAL (Educación / Promoción)

```
Prioridad: 5 (baja)
Límite: 1 promoción cada 48 horas
        Máx 20% de últimas 20 publicaciones
        Ninguna después de pérdida

Promocional:
  - Anuncio de producto/servicio
  - Oferta especial
  - Invitación a webinar

Educación:
  - Artículo técnico
  - Explicación de setup
  - Historia de caso

Validaciones:
  - Última alerta fue resultado positivo (si promo después)
  - No inmediatamente después de TRADE_RESULT pérdida
  - Max 20% de últimas 20 publicaciones

Contenido:
  - Información clara
  - Llamada a acción específica
  - Sin estrategia privada

Ejemplo:
  📚 EDUCACIÓN: Doble Suelo
  ¿Cómo reconocer este patrón?
  Aplicación en XAUUSD
  [Leer más →](https://carvipix.app/...&sig=...)
```

---

## COMPONENTES

### 1. Event Processor
```
Entrada: DisparadorEvent (del Disparador)
Tarea: Mapear evento a PublicationRequest
Salida: PublicationRequest validado
Falla: Registra en error log, descarta

Validaciones:
- UUID válidos (analysis_id, signal_id, etc)
- Campos required presentes
- Valores en rangos válidos
- analysis_private siempre NULL/undefined
```

### 2. Filter Pipeline (4 filtros)

```
1. TYPE_CHECK
   ✓ Tipo de publicación válido
   ✓ Campo payload coherente

2. TIME_CHECK
   ✓ Si FREE_ALERT: hora actual en ventana America/Mazatlan
   ✓ Si PROMO: respeta 48h entre promociones

3. RATE_LIMITS
   ✓ FREE_ALERT: max 2/día (zona Mazatlan)
   ✓ PROMO: max 1 cada 48h
   ✓ PROMO: max 20% de últimas 20 publicaciones

4. SECURITY_CHECK
   ✓ Sin palabras bloqueadas
   ✓ Sin análisis_privado
   ✓ Sin credenciales/tokens
   ✓ HMAC signature válido
```

### 3. Content Generator
```
Entrada: PublicationRequest validado + variante
Tarea: Generar Markdown para Telegram
Salida: Mensaje + URL con tracking + firma

Pasos:
1. Seleccionar variante (random o ponderado)
2. Interpolar variables
3. Generar URL con parámetros
4. Calcular HMAC-SHA256
5. Insertar link en Markdown
```

### 4. Priority Queue
```
Estructura: 5 niveles de prioridad

Prioridad 1: FREE_ALERT
Prioridad 2: TRADE_RESULT
Prioridad 3: MARKET_STATUS
Prioridad 4: OPPORTUNITY_DEVELOPING
Prioridad 5: EDUCATIONAL_OR_PROMOTIONAL

Persistencia: queue.json
Deduplicación: por publication_id + channel_id
```

### 5. Scheduler
```
Intervalo: Cada 5 minutos
Operación:
  1. Leer queue.json
  2. Tomar siguiente item (por prioridad)
  3. Enviar a Telegram
  4. Recibir message_id
  5. Marcar DELIVERED
  6. Persistir
  7. Log de auditoría

Manejo de errores:
  - Intento 1-3: FAILED, reintentar en próximo tick
  - Intento 4+: DEAD_LETTER, admin revisará
  - Rate limit Telegram: esperar, reintentar
```

### 6. Tracking Service
```
Entrada: TrackingEvent (click, visit, signup, payment)
Tarea: Validar firma, registrar evento
Salida: event_id generado

Validaciones:
- HMAC signature correcta
- pub_id existe
- event no es duplicado (por event_id)

Persistencia: tracking/[YYYYMMDD].json
Historial: Inmutable, archivable
```

---

## FILTROS Y VALIDACIÓN

### Filtro 1: TYPE_CHECK
```
Valida que el tipo de publicación sea uno de 5:
  ✓ FREE_ALERT
  ✓ MARKET_STATUS
  ✓ OPPORTUNITY_DEVELOPING
  ✓ TRADE_RESULT
  ✓ EDUCATIONAL_OR_PROMOTIONAL

Valida campos obligatorios por tipo:
  FREE_ALERT: entry_price, stop_loss, probability >= 70
  MARKET_STATUS: análisis público incluye market_state
  OPPORTUNITY_DEVELOPING: setup, niveles
  TRADE_RESULT: associated_signal_id, entry_price, exit_price, pnl
  PROMO: content, clear CTA
```

### Filtro 2: TIME_CHECK
```
Si FREE_ALERT:
  - Timezone: America/Mazatlan
  - Hoy = de medianoche a medianoche local
  - Hora actual < próxima medianoche
  - ✓ PASS si es dentro del día
  - ✗ REJECT si pasó medianoche

Si EDUCATIONAL_OR_PROMOTIONAL:
  - Si promocional: última promo >= 48 horas atrás
  - ✓ PASS si es educación O (promo Y dentro de 48h)
  - ✗ REJECT si promo Y dentro de 48h

Si TRADE_RESULT:
  - No hay restricción de horario
  - ✓ PASS siempre
```

### Filtro 3: RATE_LIMITS
```
LIMITE 1: FREE_ALERT máximo 2 por día
  Hoy = desde medianoche America/Mazatlan hasta medianoche
  Contar: select count(*) from publications 
          where type="FREE_ALERT" AND date(created_at)=hoy
  if (count >= 2) REJECT

LIMITE 2: PROMO máximo 1 cada 48 horas
  select max(created_at) from publications 
  where type="EDUCATIONAL_OR_PROMOTIONAL" 
    AND subtype="PROMOTIONAL"
  if (max_created_at > now - 48h) REJECT

LIMITE 3: PROMO máximo 20% de últimas 20
  select count(*) from publications 
  order by created_at desc limit 20
  where type="EDUCATIONAL_OR_PROMOTIONAL" 
    AND subtype="PROMOTIONAL"
  if (promo_count > 4) REJECT

LIMITE 4: No PROMO después de TRADE_RESULT pérdida
  select last created_at from publications 
  where type="TRADE_RESULT" 
  order by created_at desc limit 1
  if (last.pnl < 0 AND now - last.created_at < 4h) REJECT PROMO
```

### Filtro 4: SECURITY_CHECK
```
BLOQUEO 1: Palabras clave
  blockedKeywords = ["prompt", "api_key", "secret", 
                     "password", "token", "firebase_key", ...]
  for keyword in blockedKeywords:
    if content.toLowerCase().includes(keyword):
      REJECT "Blocked keyword"

BLOQUEO 2: Análisis privado
  if (analysis_private != null AND analysis_private != undefined):
    REJECT "Private analysis detected"

BLOQUEO 3: Credenciales
  patterns = [/[A-Z0-9]{20,}/,  // API key-like
              /password[^a-z0-9]*/i, // password field
              /token[^a-z0-9]*/i]   // token field
  if content matches any pattern:
    REJECT "Credentials detected"

BLOQUEO 4: HMAC válido
  computed_sig = HMAC-SHA256(url_params, SECRET)
  if (computed_sig != provided_signature):
    REJECT "Invalid signature"
```

---

## ALERTAS GRATUITAS - REGLAS DEFINITIVAS

### Regla 1: Máximo 2 por día
```
Zona horaria: America/Mazatlan (UTC-7 / UTC-6 con DST)
Día = de medianoche a medianoche local

Contador diario:
  hoy_start = today 00:00:00 America/Mazatlan
  hoy_end = today 23:59:59 America/Mazatlan
  
  count = select COUNT(*)
          from publications
          where type="FREE_ALERT"
            AND created_at >= hoy_start
            AND created_at <= hoy_end
  
  if (count >= 2):
    REJECT "Daily limit reached"
  else:
    ALLOW
```

### Regla 2: Probabilidad >= 70%
```
Disparador envía: probability (0-100)

if (probability >= 70):
  ALLOW
else:
  REJECT "Probability too low"
```

### Regla 3: Publicación inmediata
```
Decisión: ENTER_BUY O ENTER_SELL
Acción: Publicar sin esperar

NO HACER:
  - Esperar a más análisis
  - Comparar con otras alertas
  - Recalcular probabilidad
  - Ajustar tiempo de entrada

SÍ HACER:
  - Validar (4 filtros)
  - Enqueue
  - Publicar tan pronto como haya espacio en scheduler
```

### Regla 4: Una alerta != múltiples publicaciones el mismo día
```
Si same signal_id + same channel_id:
  REJECT (ya publicada hoy)

Si signal_id distinto:
  ALLOW (son señales diferentes)
```

### Regla 5: Política de silencio (8 horas sin contenido útil)
```
Si pasan 8 horas sin:
  - FREE_ALERT
  - MARKET_STATUS
  - OPPORTUNITY_DEVELOPING
  - TRADE_RESULT

Entonces:
  ALLOW publicar EDUCATIONAL_OR_PROMOTIONAL
  (educación aprobada, no promoción agresiva)
```

### Regla 6: No inventar ni recalcular
```
NUNCA:
  - Cambiar probability Disparador envía
  - Ajustar entry_price
  - Modificar stop_loss
  - Crear campos nuevos

SIEMPRE:
  - Usar datos exactos del Disparador
  - Documentar origen
  - Registrar timestamp
```

---

## RESULTADOS DE OPERACIÓN

### Regla 1: Solo si alerta previamente publicada
```
Trigger: DisparadorTradeClosed
  associated_signal_id = sig_123

Validación:
  publication = find(
    type="FREE_ALERT",
    signal_id="sig_123",
    channel_id=target_channel,
    status="DELIVERED"
  )
  
  if (!publication):
    REJECT "Associated alert not published in this channel"
  else:
    ALLOW
```

### Regla 2: Clasificación obligatoria
```
Tag requerido:
  - ANALYTICAL_PAPER (paper trading, análisis)
  - MT5_DEMO (demo MetaTrader 5)
  - LIVE_VERIFIED (operación en vivo real)

Sin tag = REJECT
```

### Regla 3: No modificar datos de operación
```
Campos desde DisparadorTradeClosed:
  entry_price, exit_price, entry_time, exit_time
  pnl_usd, pnl_pips, duration

NUNCA:
  - Redondear resultado
  - Cambiar tag post-publicación
  - Omitir pérdidas
  - Magnificar ganancias
```

---

## TRACKING INTERNO

### URL de Tracking
```
Base: https://carvipix.app/[page]

Parámetros:
  pub_id=xY9mK2nL              (obligatorio)
  campaign_id=aB1cD2eF         (opcional)
  variant_id=FREE_ALERT_001    (obligatorio)
  content_type=FREE_ALERT      (obligatorio)
  source=telegram              (siempre "telegram")
  signature=HMAC(...)          (obligatorio)

Ejemplo:
  https://carvipix.app/free-alert
    ?pub_id=pub_xY9mK2nL
    &variant_id=FREE_ALERT_ENTRY_001
    &content_type=FREE_ALERT
    &source=telegram
    &signature=5f7d2e8a9c1b2d3f...
```

### Firma HMAC
```
algorithm: SHA-256
key: process.env.TRACKING_SECRET

message para firmar:
  "pub_id=X&campaign_id=Y&variant_id=Z&content_type=T&source=tg"

signature = HMAC-SHA256(message, key)

Validación en landing:
  computed = HMAC-SHA256(url_params, key)
  if (computed != provided_signature):
    LOG error
    REJECT event
```

### Eventos Rastreados (5 total)

#### 1. CLICK
```
Cuándo: Usuario hace clic en link de Telegram
Dónde: Client-side (JavaScript en Telegram client)
Qué se captura:
  - timestamp
  - user_agent (tipo de cliente)
  - device_type (mobile/desktop/unknown)

Registración:
  POST /api/webhooks/community-publisher/tracking
  {
    event: "CLICK",
    pub_id: "...",
    signature: "...",
    timestamp: 1726271000000,
    user_agent: "...",
    device_type: "mobile"
  }
```

#### 2. PAGE_VISIT
```
Cuándo: Landing page cargada
Dónde: Server-side (Next.js)
Qué se captura:
  - timestamp
  - referer (debe contener pub_id)
  - device_type (desktop/mobile)
  - session_id (hash anónimo)

Registración:
  Server-side, automático
```

#### 3. SIGNUP_STARTED
```
Cuándo: Usuario abre formulario de registro
Dónde: Server-side (Next.js)
Qué se captura:
  - timestamp
  - pub_id (de sesión)

Registración:
  Server-side, cuando formulario se abre
```

#### 4. SIGNUP_COMPLETED
```
Cuándo: Usuario registrado exitosamente
Dónde: Auth service (existente)
Qué se captura:
  - timestamp
  - user_id (nuevo, asignado por auth)
  - pub_id (de sesión)

Registración:
  Auth service llama a Community Publisher
  POST /api/webhooks/community-publisher/tracking
  {
    event: "SIGNUP_COMPLETED",
    user_id: "user_abc123",
    pub_id: "pub_xyz",
    signature: "..."
  }
```

#### 5. PAYMENT_APPROVED
```
Cuándo: Pago procesado por PayPal
Dónde: Payment service (EXISTENTE)
Cómo funciona:
  1. Usuario paga en PayPal (flujo existente)
  2. PayPal webhook llega a /api/webhooks/payment (EXISTENTE)
  3. Servicio de pagos registra pago
  4. Servicio de pagos LLAMA a Community Publisher:
     POST /api/webhooks/community-publisher/tracking
     {
       event: "PAYMENT_APPROVED",
       transaction_id: "PayPal_TXN_123",
       user_id: "user_abc123",
       amount_usd: 9.99,
       pub_id: "pub_xyz",
       signature: "..."
     }
  5. Community Publisher REGISTRA solo atribución:
     {
       event_id: "evt_...",
       event_type: "PAYMENT_APPROVED",
       timestamp: 1726271000000,
       publication: { pub_id: "pub_xyz", campaign_id: null, ... },
       data: { transaction_id: "...", amount_usd: 9.99 }
     }

IMPORTANTE:
  - Community Publisher NO procesa dinero
  - Community Publisher NO aprueba pagos
  - Community Publisher NO modifica base de datos de pagos
  - Community Publisher SOLO registra atribución
  - Webhook PayPal va SOLO a payment service
  - Payment service OPTA POR llamar a Community Publisher
  - Si payment service no existe, Community Publisher NO hace nada
```

### Correlación

```
publication_id = fuente de verdad única

Flujo:
  1. Click en Telegram
     → event.pub_id = "pub_xyz"
  
  2. Landing page recibe request
     → sesión.pub_id = "pub_xyz"
  
  3. Usuario se registra
     → SIGNUP_COMPLETED.pub_id = "pub_xyz"
     → SIGNUP_COMPLETED.user_id = "user_123"
  
  4. Usuario paga
     → PAYMENT_APPROVED.pub_id = "pub_xyz"
     → PAYMENT_APPROVED.user_id = "user_123"
     → PAYMENT_APPROVED.amount_usd = 9.99
  
  5. Atribución final:
     pub_id "pub_xyz" = 1 CLICK + 1 SIGNUP + 1 PAYMENT
     attribution[pub_xyz] = {
       clicks: 1,
       signups: 1,
       revenue_usd: 9.99
     }
```

### Protecciones

```
✓ Validar HMAC antes de registrar evento
✓ No guardar IPs completas (hash + salt)
✓ No guardar información privada de usuario
✓ No usar cookies de terceros
✓ Session ID = hash anónimo, no identificable
✓ Registrar en archivo JSON local por fecha
✓ Deduplicación por event_id después de reinicio
✓ Nunca modificar datos de pagos core
✓ No guardar tokens, contraseñas, secretos
✓ Auditar acceso al tracking
```

---

## INTEGRACIÓN TELEGRAM

### Capacidades Reales (V1 soporta)
```
✅ sendMessage (texto con Markdown)
✅ editMessage (cambiar contenido después de envío)
✅ getUpdates (recibir mensajes del grupo)
✅ getChat (info del canal)
✅ getChatMember (pertenencia)
✅ Markdown link format: [text](https://url)
✅ forward_count (en chat info)
```

### Capacidades NO Soportadas (V1 marca explícitamente)
```
❌ NOT_SUPPORTED: Automático welcome en canal
   → No existe evento "user entered channel"
   → Workaround: Admin manual o bot en privado

❌ NOT_SUPPORTED: Bot sabe si usuario clickeó link externo
   → Telegram no reporta clics en enlaces
   → Workaround: URL con tracking interno (CARVIPIX landing page)

❌ NOT_SUPPORTED: Bot obtiene view counts de mensajes
   → Telegram no expone estadísticas a bots
   → Workaround: Tracking interno en landing page
```

### Configuración del Bot

```
Bot token: .env.local (NUNCA en repo)
Nombre: @carvipix_bot
Descripción: "Signal distribution bot for Observador V3"
Comandos públicos: /help, /status
Permisos: chat_member, can_delete_messages, can_edit_messages
Webhook: No (usar polling en V1)

Canal oficial:
  @carvipix_official
  Channel ID: -100[numero_largo]
  
Canal de prueba:
  @carvipix_test
  Channel ID: -100[numero_prueba]
```

### Manejo de Errores

```
429 Too Many Requests (Rate limit):
  → Esperar 30-60 segundos
  → Reintentar (máximo 3 intentos)
  → Pasar a DEAD_LETTER después de 3 fallos

400 Bad Request:
  → Loguear detalle
  → Pasar a DEAD_LETTER
  → Admin revisará

401 Unauthorized:
  → Token inválido o expirado
  → STOP sistema, alertar admin

404 Not Found:
  → Canal/usuario no existe
  → STOP para ese destino
```

---

## PANEL ADMINISTRATIVO

### Área 1: Estado y Controles

```
Componentes:
  ✓ Indicador de conexión Telegram (🟢/🔴)
  ✓ Bot token status (sin mostrar token)
  ✓ Canal actual (OFFICIAL / TEST)
  ✓ Selector de canal
  ✓ Botón PAUSE / RESUME
  ✓ Botón "Send Test Message"
  ✓ Indicador: "Alertas hoy: X/2"
  ✓ Última publicación (preview)
  ✓ Próxima en cola (preview)

Acciones:
  - Cambiar canal TEST ↔ OFFICIAL
  - Pausar/reanudar publicaciones
  - Enviar mensaje de prueba
  - Ver límite de alertas del día
```

### Área 2: Cola e Historial

```
COLA (Próximas a enviar):
  Tabla:
    ID | Tipo | Prioridad | Status | Acciones
    ---|------|-----------|--------|----------
    pub_xyz | FREE_ALERT | 1 | PENDING | [Enviar ahora] [Cancelar]
    pub_abc | MARKET_STATUS | 3 | PENDING | [Enviar ahora] [Cancelar]

HISTORIAL (Últimas 50):
  Tabla:
    ID | Tipo | Status | Enviado | Timestamp | Acciones
    ---|------|--------|--------|-----------|----------
    pub_123 | FREE_ALERT | DELIVERED | ✓ | 14:30 | [Ver]
    pub_456 | TRADE_RESULT | FAILED | ✗ | 14:25 | [Reintentar]

Acciones:
  - Enviar publicación de cola ahora
  - Cancelar publicación pendiente
  - Reintentar publicación fallida
  - Ver detalles completos
  - Ver URL de tracking
```

### Área 3: Configuración Básica

```
Campos editables:
  ☑ Paused (true/false)
  ☑ Test only (true/false)
  ☑ Channel (OFFICIAL / TEST)
  ☑ Blocked keywords (lista)
  ☑ Limits.free_alerts_per_day (1-3)
  ☑ Limits.promo_hours_between (12-72)

Botones:
  [Guardar cambios]
  [Restaurar defaults]
  [Ver config actual]

Avisos:
  - "⚠️ TEST_ONLY activo: no enviar al canal oficial"
  - "⚠️ Sistema pausado"
  - "ℹ️ Cambios guardados"
```

---

## PERSISTENCIA E IDEMPOTENCIA

### Corrección 1: Clave de Idempotencia

**Clave principal**: `publication_id + channel_id`

```
NO usar signal_id o analysis_id como clave única
```

**Razón**: Una misma señal puede originar múltiples publicaciones legítimas:
- Alerta inicial cuando sale análisis
- Actualización si análisis se modifica
- Resultado final cuando se cierra operación

**Estas NO deben bloquearse entre ellas.**

**Referencias secundarias** (mantener en PublishedMessage):
```
source.signal_id          ← Referencia, no clave
source.analysis_id        ← Referencia, no clave
source.paper_trade_id     ← Referencia, no clave
```

**Lógica de deduplicación**:
```typescript
// Antes de publicar
const existing = await findByIdempotenceKey(
  publication_id,
  channel_id
);

if (existing && existing.status === "DELIVERED") {
  SKIP("Ya publicada");
} else if (existing && existing.status === "FAILED") {
  RETRY();
}
```

### Corrección 2: Persistencia con Garantías

#### Escritura Atómica (temp → validate → replace)

```typescript
const writeAtomic = async (filePath, data) => {
  const tempPath = filePath + '.tmp';
  const backupPath = filePath + '.bak';
  
  // 1. Escribir a archivo temporal
  await fs.writeFile(
    tempPath, 
    JSON.stringify(data, null, 2),
    { encoding: 'utf-8' }
  );
  
  // 2. Validar JSON válido
  try {
    JSON.parse(await fs.readFile(tempPath, 'utf-8'));
  } catch (e) {
    await fs.unlink(tempPath);
    throw new Error('Temp file invalid: ' + e.message);
  }
  
  // 3. Hacer respaldo si archivo actual existe
  if (await fileExists(filePath)) {
    await fs.copyFile(filePath, backupPath);
  }
  
  // 4. Reemplazar (operación atómica a nivel FS)
  await fs.rename(tempPath, filePath);
};
```

#### Bloqueo de Escrituras Paralelas

```typescript
const lockFile = (path) => path + '.lock';

const withLock = async (filePath, callback) => {
  const lock = lockFile(filePath);
  
  // Esperar hasta 5 segundos por el lock
  let attempts = 0;
  while (await fileExists(lock) && attempts < 50) {
    await sleep(100);
    attempts++;
  }
  
  if (await fileExists(lock)) {
    throw new Error('Lock timeout for ' + filePath);
  }
  
  // Adquirir lock
  await fs.writeFile(lock, Date.now().toString());
  
  try {
    return await callback();
  } finally {
    // Liberar lock (ignore errors)
    try {
      await fs.unlink(lock);
    } catch (e) {
      // Ignorar
    }
  }
};
```

#### Respaldo y Recuperación

```
Scenario: Archivo corrupto detectado

1. Validar JSON al cargar
2. Si invalid:
   - Intentar cargar .bak
   - Si .bak válido: restaurar + log error
   - Si .bak también inválido: usar fallback
   - Reanudar sin perder historial

Fallback (último recurso):
   - queue.json vacío → []
   - publications/[date].json vacío → { publications: [] }
   - Continuar normalmente
```

#### Historial Inmutable

```
Rotación de archivos:

data/community-publisher/
├── publications/
│   ├── 20260714.json        (hoy, ESCRIBIBLE)
│   ├── 20260713.json        (ayer, CONGELADO)
│   └── archive/
│       ├── 2026-Q2.json     (Q2 completo)
│       └── 2026-Q1.json     (Q1 anterior)
│
├── tracking/
│   ├── 20260714.json        (hoy)
│   └── archive/
│       └── 2026-Q2.json

Rotación automática (fin del día):
  - Renombrar 20260714.json → 20260713.json
  - Crear nuevo 20260714.json vacío
  - Archivar Q completo cuando termina
  
Propiedades:
  - Archivos antiguos NUNCA se modifican
  - Solo append-only para históricos
  - Búsquedas siempre usan índice
  - Retención: Indefinida (guardar todo)
```

### Estados de Publicación

```
PENDING
  ↓ (scheduler intenta enviar)
  
DELIVERED (éxito)
  ✓ Enviado a Telegram
  ✓ message_id confirmado
  ✓ NO reintentar
  [FIN]

o

FAILED (error temporal)
  ✗ Intento 1-3 falló
  ✓ Reintentar en próximo tick
  → DELIVERED (si siguiente intento éxito)
  → DEAD_LETTER (si 3+ fallos)
  [FIN después de DEAD_LETTER]

o

SKIPPED (rechazada por filtros)
  ✗ Validación falló
  ✓ NO reintentar
  [FIN]

o

DEAD_LETTER (imposible entregar)
  ✗ 3+ intentos fallaron
  ✓ Admin debe revisar
  ✓ Posible Telegram down o token inválido
  [Pausa del sistema]
```

### Recuperación Ante Reinicio

```
Cuándo: Servidor restart

Pasos:
  1. Cargar queue.json
  2. Para cada item con status PROCESSING:
     - Si telegram_message_id existe → ya fue enviada
       → marcar DELIVERED (evitar duplicación)
     - Si no existe → reintentar (intento++)
  3. Para cada item con status PENDING:
     - Continuar normalmente
  4. Scheduler reinicia

Garantía:
  ✓ No duplicar mensajes
  ✓ No perder estado
  ✓ Reanudar desde donde paró
```

### Estructura de Archivos

```json
// publications/20260714.json
{
  "date": "20260714",
  "publications": [
    {
      "publication_id": "pub_xY9mK2nL",
      "type": "FREE_ALERT",
      "status": "DELIVERED|FAILED|SKIPPED|DEAD_LETTER",
      
      "source": {
        "signal_id": "sig_abc123",
        "analysis_id": "ana_def456",
        "paper_trade_id": null
      },
      
      "content": "🚀 EURUSD Señal Alcista...",
      "variant_id": "FREE_ALERT_ENTRY_001",
      
      "telegram": {
        "channel_id": "-1001234567890",
        "message_id": 12345,
        "sent_at": "2026-07-14T10:00:00Z",
        "attempts": 1,
        "last_error": null
      },
      
      "tracking": {
        "url": "https://carvipix.app/free-alert?pub_id=...",
        "signature": "5f7d2e8a9c1b2d3f..."
      },
      
      "metadata": {
        "created_at": "2026-07-14T09:55:00Z",
        "updated_at": "2026-07-14T10:00:00Z"
      }
    }
  ]
}
```

---

## SEGURIDAD

### Protecciones Activas

```
1. Token Telegram
   ✓ Guardado en .env.local (NUNCA repo)
   ✓ Nunca impreso en logs
   ✓ Nunca enviado en request públicos
   ✓ Verificación de permisos mínimos

2. URLs de Tracking
   ✓ HMAC-SHA256 sobre parámetros
   ✓ Validación antes de registrar
   ✓ Firma = prevención de tampering
   ✓ Timestamp de validez

3. Datos Privados
   ✓ analysis_private NUNCA procesada
   ✓ Bloqueadas en 4 filtros
   ✓ Auditoría de acceso
   ✓ Logs sin datos sensibles

4. Auditoría
   ✓ Todos los eventos registrados
   ✓ Archivo de error.log
   ✓ Timestamp UTC para correlación
   ✓ Immutable history

5. Idempotencia
   ✓ Reinicio sin duplicación
   ✓ publication_id único
   ✓ channel_id correlación
```

---

## BLINDAJE

**No modificar durante la implementación**:

```
🔒 Expediente Maestro V3
🔒 Prompt Maestro
🔒 Scheduler analítico
🔒 Señal Maestra
🔒 Lógica del Disparador
🔒 PayPal (excepto webhook entrada a PAYMENT_APPROVED)
🔒 Usuarios y login
🔒 Resend (email)
🔒 Bot Engine
```

---

## ALCANCE V2/V3

### FUERA DE V1 (Deferred)

```
❌ Calendario editorial semanal
❌ Campañas multi-fase con variantes ponderadas
❌ Moderación de UGC (user generated content)
❌ Bienvenida automática en canal
❌ Webhooks propios de Telegram
❌ Panel administrativo completo (8+ módulos)
❌ Escalabilidad para 100K miembros
❌ Redis caching
❌ Integración Telegram Premium
❌ A/B testing de templates
❌ Machine learning de timing
❌ Alertas por canal privado
❌ Notificaciones push
❌ Reporte de ROI automatizado
```

### Posible en V2 (No toquen)

```
Si usuario explícitamente autoriza después de V1:
  - Webhooks de Telegram si Telegram lo permite
  - A/B testing de variantes
  - Calendario editorial
  - Campañas multi-fase
```

---

## RESUMEN

```
┌─────────────────────────────────────────┐
│ COMMUNITY PUBLISHER V1 - ESPECIFICACIÓN │
└─────────────────────────────────────────┘

ENTRADA:
  2 tipos de evento: ANALYSIS_COMPLETED, TRADE_CLOSED
  Validación: 4 filtros
  
PROCESAMIENTO:
  6 componentes: EventProcessor, FilterPipeline,
  ContentGenerator, PriorityQueue, Scheduler,
  TrackingService
  
TIPOS DE PUBLICACIÓN:
  5: FREE_ALERT (2/día), MARKET_STATUS,
  OPPORTUNITY_DEVELOPING, TRADE_RESULT,
  EDUCATIONAL_OR_PROMOTIONAL

SALIDA:
  Mensajes a Telegram con tracking URLs
  Eventos registrados: CLICK, PAGE_VISIT,
  SIGNUP_COMPLETED, PAYMENT_APPROVED

PERSISTENCIA:
  JSON files, escritura atómica,
  bloqueos, respaldo, recuperación,
  idempotencia por (pub_id, channel_id)

PANEL ADMIN:
  3 áreas: Estado, Cola, Config

IMPLEMENTACIÓN:
  ~1,300 LOC
  120 horas (3 semanas)
  1 dev

CONGELAMIENTO:
  V1 = V1, sin cambios durante implementación
  V2/V3 = Después de validación de V1
```

---

**DOCUMENTO CONGELADO**: 🔒 No modificar. Usar como estándar oficial para implementación.

**SIGUIENTE**: COMMUNITY_PUBLISHER_V1_CONTRACT_APPROVED.md + Inicio Fase 1
