# COMMUNITY PUBLISHER V1 — PLAN DE IMPLEMENTACIÓN (6 FASES)

**Versión**: 1.0  
**Fecha**: 2026-07-14  
**Estado**: CONGELADO — Orden de trabajo oficial  
**Base arquitectónica**: COMMUNITY_PUBLISHER_V1_ARCHITECTURE_APPROVED.md  
**Base técnica**: COMMUNITY_PUBLISHER_V1_CONTRACT_APPROVED.md

---

## RESUMEN DE FASES

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: Integración Telegram Segura        [25 horas]   │
├─────────────────────────────────────────────────────────┤
│ FASE 2: Núcleo del Publisher               [30 horas]   │
├─────────────────────────────────────────────────────────┤
│ FASE 3: Plantillas                         [20 horas]   │
├─────────────────────────────────────────────────────────┤
│ FASE 4: Persistencia e Historial           [15 horas]   │
├─────────────────────────────────────────────────────────┤
│ FASE 5: Panel Administrativo               [20 horas]   │
├─────────────────────────────────────────────────────────┤
│ FASE 6: Tracking Interno                   [15 horas]   │
├─────────────────────────────────────────────────────────┤
│ Testing + Debugging                        [10 horas]   │
├─────────────────────────────────────────────────────────┤
│ TOTAL                                    [~120 horas]   │
└─────────────────────────────────────────────────────────┘

Estado esperado post-fases: TEST_ONLY=true (sin envío a oficial)
Pausa antes de envío: Entregar checklist de configuración
```

---

## FASE 1: INTEGRACIÓN TELEGRAM SEGURA [25 horas]

### Objetivos

```
✓ Cliente Telegram Bot API funcional
✓ Canal de prueba validado
✓ Autenticación de bot verificada
✓ Permisos mínimos configurados
✓ Token exclusivamente backend (nunca expuesto)
✓ Envío en modo TEST_ONLY
✓ Manejo de errores y rate limiting
```

### Tareas

#### 1.1 Setup del Cliente Telegram (5 horas)

```typescript
// app/lib/services/telegramClientService.ts

Requisitos:
  - Usar node-telegram-bot-api o similar
  - Client pooling (no crear instancia nueva por cada mensaje)
  - Timeouts: 10s para requests, 30s para polling
  - Retry logic con exponential backoff
  - Error logging (sin token en logs)

Métodos requeridos:
  - sendMessage(channelId, text, markdown_mode, buttons)
  - editMessage(channelId, messageId, newText)
  - getChat(channelId)
  - getChatMember(channelId, userId)
  - setWebhook() [configuración inicial]

Configuración:
  - Bot token de .env.local
  - No hardcodear credentials
  - Modo polling para V1 (no webhooks)
```

#### 1.2 Validación de Canal (5 horas)

```typescript
// app/lib/services/telegramValidationService.ts

Flujo:
  1. Leer TELEGRAM_CHANNEL_TEST de .env
  2. Llamar getChat(channel_id)
  3. Si respuesta OK:
     - Verificar que bot es admin
     - Verificar permisos necesarios
     - Guardar info de canal en config.json
  4. Si error:
     - Loguear detalle
     - System pausa hasta reparación manual

Permisos requeridos:
  ✓ can_send_messages
  ✓ can_edit_messages
  ✓ can_delete_messages
  ✓ can_read_all_group_messages
```

#### 1.3 Autenticación del Bot (3 horas)

```
Verificación:
  - Llamar getMe() al inicio
  - Confirmamos que token es válido
  - Guardamos bot username
  - Logueo: "Bot @username verificado"

Si error:
  - Token inválido → error + STOP
  - Timeout → retry hasta 3x, luego STOP
  - No recuperable → notificar admin
```

#### 1.4 Configuración de Permisos (5 horas)

```
Permisos del bot en el canal:
  - DELETE_MESSAGES (para limpiar si es necesario)
  - EDIT_MESSAGES (para actualizar contenido)
  - SEND_MESSAGES (core)
  - NO voice/video calls
  - NO location sharing
  - NO media permissions beyond text

Verificación:
  - getChatMember(bot_id) → revisar permissions
  - Si permisos insuficientes → loguear advertencia
  - Si permisos correctos → logging normal
```

#### 1.5 Token en Entorno Seguro (4 horas)

```
❌ NUNCA en código:
  - No en .env (versionado)
  - No en hardcoded strings
  - No en logs

✓ SIEMPRE en .env.local (no versionado):
  TELEGRAM_BOT_TOKEN=7123456789:ABCdef...

Carga:
  - process.env.TELEGRAM_BOT_TOKEN al iniciar
  - Validar que existe y no está vacío
  - Error fatal si no existe

Uso:
  - Solo en telegramClientService
  - Nunca pasar a componentes frontend
  - Nunca en request bodies públicos
```

#### 1.6 Modo TEST_ONLY (3 horas)

```
Configuración:
  process.env.TEST_ONLY=true (default durante desarrollo)

Comportamiento:
  - Todas las publicaciones van a @carvipix_test
  - NO enviar a @carvipix_official
  - Logging: "Enviando a TEST (test_only=true)"
  - Admin puede cambiar en config.json

Switch:
  - GET /api/internal/community-publisher/config
  - POST /api/internal/community-publisher/config
    { "test_only": false }
  - Cambio inmediato
```

#### 1.7 Manejo de Errores y Rate Limits (5 horas)

```
Error 429 (Rate Limit):
  Retry con delay:
  - Intento 1: esperar 1s
  - Intento 2: esperar 5s
  - Intento 3: esperar 30s
  - Intento 4: pasar a DEAD_LETTER

Error 400 (Bad Request):
  - Loguear detalle exacto
  - Pasar a DEAD_LETTER
  - Admin revisa manualmente

Error 401 (Unauthorized):
  - Token inválido
  - PAUSA SISTEMA
  - Alert admin: "Token inválido, revisar .env.local"

Error 404 (Channel not found):
  - Canal ya no existe
  - Loguear + pasar a DEAD_LETTER
```

### Deliverables Fase 1

```
ARCHIVOS CREADOS:
  ✓ app/lib/services/telegramClientService.ts
  ✓ app/lib/services/telegramValidationService.ts
  ✓ app/lib/utils/telegramErrorHandler.ts

ARCHIVOS MODIFICADOS:
  ✓ .env.local (TELEGRAM_BOT_TOKEN, CHANNEL_TEST, CHANNEL_OFFICIAL)

TESTING:
  ✓ Bot se conecta a Telegram
  ✓ Canal de prueba validado
  ✓ Envío de mensaje de prueba exitoso
  ✓ Error handling validado
  ✓ Rate limit handling simulado

EVIDENCIA:
  ✓ Log: "Bot @carvipix_bot verificado"
  ✓ Mensaje de prueba en @carvipix_test
  ✓ Config leída correctamente
```

---

## FASE 2: NÚCLEO DEL PUBLISHER [30 horas]

### Objetivos

```
✓ Entrada del Disparador procesada
✓ Validación de contratos correcta
✓ 5 tipos de publicación funcionando
✓ Cola priorizada por tipo
✓ Idempotencia por (pub_id, channel_id)
✓ Límites diarios aplicados
✓ Política de silencio implementada
✓ Pausa y reanudación funcional
```

### Tareas

#### 2.1 Event Processor (5 horas)

```typescript
// app/lib/services/cpEventProcessorService.ts

Entrada:
  - DisparadorAnalysisCompleted
  - DisparadorTradeClosed

Procesa:
  1. Validar estructura de evento
  2. Extraer fields requeridos
  3. Detectar tipo de publicación
  4. Crear PublicationRequest
  5. Pasar a FilterPipeline

Validaciones:
  ✓ UUID válidos
  ✓ Campos required presentes
  ✓ Valores en rangos
  ✓ analysis_private == null
  
Error handling:
  - Si falta field required → LOG + SKIP
  - Si análisis_privado exists → LOG + REJECT
  - Si error parsing → LOG + SKIP
```

#### 2.2 Filter Pipeline (6 horas)

```typescript
// app/lib/services/cpFilterPipelineService.ts

4 Filtros secuenciales:

FILTRO 1: TYPE_CHECK (2 horas)
  - Tipo ∈ {FREE_ALERT, MARKET_STATUS, ...}
  - Campos requeridos por tipo presentes
  - REJECT si falla

FILTRO 2: TIME_CHECK (2 horas)
  - Si FREE_ALERT: hora < medianoche (Mazatlan)
  - Si PROMO: >= 48h desde última promo
  - REJECT si falla

FILTRO 3: RATE_LIMITS (1 hora)
  - FREE_ALERT: max 2/día
  - PROMO: max 1/48h
  - PROMO: max 20% últimas 20
  - REJECT si falla

FILTRO 4: SECURITY_CHECK (1 hora)
  - No blocked keywords
  - No analysis_private
  - No credentials
  - HMAC válido
  - REJECT si falla

Resultado:
  - PASS → continuar a ContentGenerator
  - FAIL → crear PublishedMessage con status=SKIPPED
```

#### 2.3 Priority Queue (5 horas)

```typescript
// app/lib/services/cpPriorityQueueService.ts

Estructura:
  5 niveles:
    1 = FREE_ALERT
    2 = TRADE_RESULT
    3 = MARKET_STATUS
    4 = OPPORTUNITY_DEVELOPING
    5 = EDUCATIONAL_OR_PROMOTIONAL

Métodos:
  - enqueue(publication) → añade a cola respetando prioridad
  - dequeue() → saca siguiente (prioridad más alta)
  - peek() → ve siguiente sin sacar
  - clear() → limpia todo (admin)
  - size() → cantidad en cola

Persistencia:
  - Cargar de queue.json al iniciar
  - Guardar cada cambio
  - Usar writeAtomic con locks

Deduplicación:
  - Antes de enqueue, validar (pub_id, channel_id)
  - Si ya existe con status DELIVERED → SKIP
  - Si existe con status PENDING → ignorar duplicate
```

#### 2.4 Idempotencia (5 horas)

```typescript
// app/lib/services/cpIdempotenceService.ts

Clave principal:
  hash(publication_id + channel_id)

Métodos:
  - isAlreadyPublished(pub_id, channel_id)
  - registerPublication(pub_id, channel_id)
  - deduplicateOnRestart()

Recuperación post-restart:
  1. Cargar publications/[today].json
  2. Para cada con status DELIVERED:
     - Registrar en set de (pub_id, channel_id)
  3. Cargar queue.json
  4. Para cada PROCESSING con message_id:
     - Si (pub_id, channel_id) en set → DELIVERED (evita duplicate)
     - Si no → reintentar
```

#### 2.5 Límites Diarios (4 horas)

```typescript
// app/lib/services/cpRateLimitService.ts

Límite 1: FREE_ALERT máximo 2/día
  - Contar publications hoy con type=FREE_ALERT
  - Si count >= 2 → REJECT "Daily limit"
  - Reset automático a medianoche (Mazatlan)

Límite 2: PROMO máximo 1 cada 48h
  - Buscar última promo
  - Si (now - last_promo) < 48h → REJECT

Límite 3: PROMO máximo 20% últimas 20
  - Contar último 20 publicaciones
  - Count promos / 20 > 20% → REJECT

Límite 4: No PROMO después de pérdida
  - Buscar TRADE_RESULT más reciente
  - Si pnl < 0 Y (now - timestamp) < 4h → REJECT PROMO
```

#### 2.6 Política de Silencio (4 horas)

```
Regla: Si 8h sin contenido útil, permitir educación

Contenido útil:
  - FREE_ALERT
  - MARKET_STATUS
  - OPPORTUNITY_DEVELOPING
  - TRADE_RESULT

Implementación:
  - Buscar última publicación útil
  - Si (now - last_useful) >= 8h:
    - ALLOW EDUCATIONAL_OR_PROMOTIONAL
  - Si (now - last_useful) < 8h:
    - REJECT EDUCATIONAL si es solo llenar espacio
```

#### 2.7 Pausa y Reanudación (1 hora)

```
Variable de configuración:
  config.paused (true/false)

Comportamiento:
  - Si paused=true:
    - Scheduler no envía nada
    - Cola se acumula
    - Admin puede pausar/reanudar vía endpoint
  - Si paused=false:
    - Scheduler funciona normalmente

Endpoint:
  POST /api/internal/community-publisher/pause
  { "paused": true, "reason": "Maintenance" }
```

### Deliverables Fase 2

```
ARCHIVOS CREADOS:
  ✓ app/lib/services/cpEventProcessorService.ts
  ✓ app/lib/services/cpFilterPipelineService.ts
  ✓ app/lib/services/cpPriorityQueueService.ts
  ✓ app/lib/services/cpIdempotenceService.ts
  ✓ app/lib/services/cpRateLimitService.ts
  ✓ app/lib/types/cpTypes.ts (interfaces)

TESTING:
  ✓ Evento ANALYSIS_COMPLETED procesado
  ✓ 5 tipos de publicación generados
  ✓ Cola ordena por prioridad
  ✓ Límites diarios funcionan
  ✓ Idempotencia evita duplicación
  ✓ Pausa/reanudación funcionan

EVIDENCIA:
  ✓ PublicationRequest creado correctamente
  ✓ Queue.json muestra items ordenados por prioridad
  ✓ Contador de alertas del día funciona
```

---

## FASE 3: PLANTILLAS [20 horas]

### Objetivos

```
✓ 5 tipos de plantillas generadas
✓ Variantes iniciales por tipo (8-12 cada una)
✓ Sin revelar estrategia privada
✓ Markdown validado para Telegram
✓ Variables interpoladas correctamente
✓ Contenido profesional y medible
```

### Tareas

#### 3.1 Biblioteca de Plantillas (6 horas)

```typescript
// data/community-publisher/templates/[TYPE].json

PLANTILLA 1: FREE_ALERT (10 variantes)
  - Título + emoji
  - Instrumento y dirección
  - Entrada, stop, TP
  - Probabilidad
  - Link de tracking
  
  Ejemplos:
    1. "🚀 ${instrument} Señal ${direction}..."
    2. "📊 ANÁLISIS ACTIVO: ${instrument}..."
    3. "⚡ ${instrument} - Entrada confirmada..."
    
PLANTILLA 2: MARKET_STATUS (8 variantes)
  - Estado general
  - Instrumentos principales
  - Contexto sin recomendaciones
  - Link a análisis completo
  
  Ejemplos:
    1. "📊 ESTADO: Mercado ${state}..."
    2. "🔍 ANÁLISIS: Situación actual..."

PLANTILLA 3: OPPORTUNITY_DEVELOPING (8 variantes)
  - Setup técnico
  - Niveles
  - Tiempo estimado
  - Próximos pasos
  
PLANTILLA 4: TRADE_RESULT (10 variantes)
  - Tag de tipo
  - Instrumento
  - Resultado (+ o -)
  - Duración
  - Link
  
PLANTILLA 5: EDUCATIONAL_OR_PROMOTIONAL (8 variantes)
  - Para educación: setup explicado
  - Para promo: oferta clara y CTA
  - Sin estrategia privada
```

#### 3.2 Content Generator (7 horas)

```typescript
// app/lib/services/cpContentGeneratorService.ts

Entrada:
  - PublicationRequest validado
  - Tipo de publicación
  - Datos raw_content

Proceso:
  1. Seleccionar variante (random o ponderado)
  2. Interpolar variables:
     ${instrument} → valor del evento
     ${entry_price} → precio de entrada
     ${stop_loss} → precio de stop
     ${direction} → BUY / SELL
     ${probability} → 78%
     etc.
  3. Generar URL de tracking con HMAC
  4. Insertar link en formato Markdown
  5. Validar Markdown syntax
  6. Retornar markdown final

Seguridad:
  ✓ Escapar caracteres especiales
  ✓ No interpolar analysis_private
  ✓ Validar longitud (< 4096 chars para Telegram)
  ✓ No revelar rutas internas
```

#### 3.3 URL de Tracking (4 horas)

```typescript
// app/lib/utils/trackingUrlGenerator.ts

Generación:
  base = "https://carvipix.app/free-alert"
  params = {
    pub_id: publication_id,
    variant_id: variant_id,
    content_type: type,
    source: "telegram",
    campaign_id: campaign_id || null
  }
  
  message = serialize(params)
  signature = HMAC-SHA256(message, SECRET)
  
  url = base + "?" + message + "&signature=" + signature

Validación:
  ✓ URL válida
  ✓ < 2048 chars
  ✓ HMAC válido
  ✓ Sin espacios sin escape
```

#### 3.4 Inserción de Links (3 horas)

```
Formato Markdown para Telegram:
  [Texto del botón](https://url)

Colocación en plantilla:
  "📊 ${instrument} - Análisis Completo\n[Leer más →](${tracking_url})"

Validación:
  ✓ Link visible
  ✓ CTA clara
  ✓ No links múltiples en V1
```

### Deliverables Fase 3

```
ARCHIVOS CREADOS:
  ✓ data/community-publisher/templates/FREE_ALERT.json
  ✓ data/community-publisher/templates/MARKET_STATUS.json
  ✓ data/community-publisher/templates/OPPORTUNITY_DEVELOPING.json
  ✓ data/community-publisher/templates/TRADE_RESULT.json
  ✓ data/community-publisher/templates/EDUCATIONAL_OR_PROMOTIONAL.json
  ✓ app/lib/services/cpContentGeneratorService.ts
  ✓ app/lib/utils/trackingUrlGenerator.ts

TESTING:
  ✓ Plantilla cargada correctamente
  ✓ Variables interpoladas
  ✓ Markdown válido
  ✓ URL de tracking generada
  ✓ HMAC válido

EVIDENCIA:
  ✓ Mensaje generado en consola
  ✓ URL completa en tracking
  ✓ Link clicable en preview
```

---

## FASE 4: PERSISTENCIA E HISTORIAL [15 horas]

### Objetivos

```
✓ Cola persistente entre reinicios
✓ Historial de publicaciones inmutable
✓ Estados PENDING/DELIVERED/FAILED/SKIPPED/DEAD_LETTER
✓ Intentos registrados
✓ Errores documentados
✓ Deduplicación post-reinicio
✓ Recuperación ante corrupción de archivos
```

### Tareas

#### 4.1 Escritura Atómica (4 horas)

```typescript
// app/lib/services/cpPersistenceService.ts

Implementación:
  1. Crear archivo temp (.tmp)
  2. Escribir datos
  3. Validar JSON
  4. Si existe original, hacer .bak
  5. Renombrar temp → original (atomic op)

Métodos:
  - writeAtomic(filePath, data)
  - readAtomic(filePath)
  - backupIfCorrupted(filePath)
```

#### 4.2 Bloqueo de Concurrencia (3 horas)

```
Mecanismo de lock:
  - Crear archivo .lock
  - Esperar si existe
  - Timeout 5s
  - Liberar en finally

Uso:
  withLock(filePath, async () => {
    // operación de lectura/escritura
  })
```

#### 4.3 Respaldo y Recuperación (4 horas)

```
Detección de corrupción:
  - Intentar parse JSON
  - Si falla: cargar .bak
  - Si .bak válido: restaurar + log
  - Si .bak corrupto: usar fallback vacío

Fallback:
  - queue.json → []
  - publications → { publications: [] }
```

#### 4.4 Historial Inmutable y Rotación (2 horas)

```
Rotación automática:
  - Fin del día: renombrar 20260714.json → 20260713.json
  - Crear nuevo 20260714.json vacío
  - Archivos viejos nunca se modifican
  
Archivación (fin de trimestre):
  - Copiar mes a archive/YYYY-MM.json
  - Solo append-only
```

#### 4.5 Deduplicación Post-Reinicio (2 horas)

```
Procedimiento:
  1. Cargar queue.json
  2. Para cada item PROCESSING con message_id:
     - Marcar DELIVERED (ya fue enviado)
  3. Para cada item PENDING:
     - Continuar normalmente
  4. Reanudar scheduler
  
Garantía: ✓ No duplicar mensajes
```

### Deliverables Fase 4

```
ARCHIVOS CREADOS:
  ✓ app/lib/services/cpPersistenceService.ts
  ✓ Helpers para locks y atomic writes

ARCHIVOS MODIFICADOS:
  ✓ data/community-publisher/ (directorio completo)

TESTING:
  ✓ Archivo persiste correctamente
  ✓ Reinicio no duplica
  ✓ Recuperación ante corrupción funciona
  ✓ Locks evitan race conditions

EVIDENCIA:
  ✓ queue.json persiste entre reinicios
  ✓ publications/[date].json crece correctamente
  ✓ Archive rotado al fin del mes
```

---

## FASE 5: PANEL ADMINISTRATIVO [20 horas]

### Objetivos

```
✓ Dashboard visual de estado
✓ Cola e historial visible
✓ Controles de pausa/reanudación
✓ Configuración básica editable
✓ Indicadores en tiempo real
✓ UX profesional y responsive
```

### Tareas

#### 5.1 Área 1: Estado y Controles (6 horas)

```tsx
// app/admin/community-publisher/components/StatusCard.tsx

Componentes:
  ✓ Status Telegram (🟢 conectado / 🔴 error)
  ✓ Canal actual (TEST / OFFICIAL selector)
  ✓ Botón PAUSE / RESUME
  ✓ Botón "Send Test Message"
  ✓ Indicador "Alertas hoy: X/2"
  ✓ Última publicación (preview)
  ✓ Próxima en cola (preview)

Funcionalidad:
  - Cambiar canal TEST ↔ OFFICIAL
  - Pausar/reanudar publicaciones
  - Enviar mensaje de prueba
  - Ver límite de alertas
```

#### 5.2 Área 2: Cola e Historial (8 horas)

```tsx
// app/admin/community-publisher/components/QueueTable.tsx

COLA (Próximas a enviar):
  Columnas: ID | Tipo | Prioridad | Status
  Acciones: [Enviar Ahora] [Cancelar]

HISTORIAL (Últimas 50):
  Columnas: ID | Tipo | Status | Enviado | Timestamp
  Acciones: [Ver] [Reintentar] [Copiar URL]

Funcionalidad:
  - Pagination
  - Filtrar por status
  - Filtrar por tipo
  - Ver detalles completos
  - Reintentar fallidas
```

#### 5.3 Área 3: Configuración Básica (4 horas)

```tsx
// app/admin/community-publisher/components/ConfigForm.tsx

Campos editables:
  ☑ Paused (toggle)
  ☑ Test Only (toggle)
  ☑ Channel (dropdown)
  ☑ Blocked Keywords (textarea)
  ☑ Limits.free_alerts_per_day (number)
  ☑ Limits.promo_hours_between (number)

Botones:
  [Guardar Cambios]
  [Restaurar Defaults]
  [Ver Config Actual]

Validaciones:
  - free_alerts_per_day: 1-3
  - promo_hours_between: 12-72
  - Mostrar avisos si TEST_ONLY activo
```

#### 5.4 Main Page Layout (2 horas)

```tsx
// app/admin/community-publisher/page.tsx

Layout:
  [StatusCard]
  [QueueTable - Cola]
  [QueueTable - Historial]
  [ConfigForm]

Responsive:
  - Desktop: 3 columnas
  - Tablet: 2 columnas
  - Mobile: 1 columna

Styling:
  - Usar componentes existentes de CARVIPIX
  - Mantener consistencia visual
```

### Deliverables Fase 5

```
ARCHIVOS CREADOS:
  ✓ app/admin/community-publisher/page.tsx
  ✓ app/admin/community-publisher/components/StatusCard.tsx
  ✓ app/admin/community-publisher/components/QueueTable.tsx
  ✓ app/admin/community-publisher/components/ConfigForm.tsx
  ✓ app/admin/community-publisher/hooks/useCommunityPublisher.ts

TESTING:
  ✓ Dashboard carga correctamente
  ✓ Queue se actualiza en tiempo real
  ✓ Controles funcionan (pause, resume, config)
  ✓ Responsive en diferentes tamaños

EVIDENCIA:
  ✓ Captura: /admin/community-publisher visible
  ✓ Queue actualizado vía polling/SSE
  ✓ Config guardada persiste
```

---

## FASE 6: TRACKING INTERNO [15 horas]

### Objetivos

```
✓ URLs firmadas con HMAC
✓ Eventos CLICK registrados
✓ Eventos PAGE_VISIT registrados
✓ Eventos SIGNUP_COMPLETED registrados
✓ Eventos PAYMENT_APPROVED capturados
✓ Correlación pub_id→usuario→pago
✓ Sin datos personales en URLs
```

### Tareas

#### 6.1 HMAC Signing (3 horas)

```typescript
// app/lib/utils/hmacSigning.ts

Generación:
  secret = process.env.TRACKING_SECRET
  message = "pub_id=X&campaign_id=Y&variant_id=Z&source=tg&content_type=FREE_ALERT"
  signature = HMAC-SHA256(message, secret)
  
Validación:
  computed = HMAC-SHA256(url_params, secret)
  valid = (computed === provided_signature)

Métodos:
  - signUrlParams(params) → signature
  - validateSignature(params, signature) → boolean
```

#### 6.2 Webhook de Tracking (5 horas)

```typescript
// app/api/webhooks/community-publisher/tracking/route.ts

Endpoint:
  POST /api/webhooks/community-publisher/tracking
  
Body esperado:
  {
    event_type: "CLICK|PAGE_VISIT|SIGNUP_STARTED|SIGNUP_COMPLETED|PAYMENT_APPROVED",
    pub_id: "pub_xyz",
    variant_id: "FREE_ALERT_001",
    timestamp: 1726271000000,
    signature: "HMAC(...)",
    data: { ... }
  }

Validaciones:
  ✓ HMAC válido
  ✓ pub_id existe
  ✓ event no es duplicado (por event_id)
  ✓ timestamp dentro de ventana válida

Procesamiento:
  1. Validar HMAC
  2. Si inválido: LOG + 400 Unauthorized
  3. Si válido: generar event_id
  4. Guardar en tracking/[date].json
  5. Retornar 200 OK { success: true, event_id: "..." }
```

#### 6.3 Eventos Rastreados (4 horas)

```
EVENTO 1: CLICK
  - Usuario hace clic en link de Telegram
  - Capturado: client-side (landing page JS)
  - Datos: user_agent, device_type, timestamp
  
EVENTO 2: PAGE_VISIT
  - Landing page cargada
  - Capturado: server-side automático
  - Datos: referer, device_type, session_id
  
EVENTO 3: SIGNUP_STARTED
  - Usuario abre formulario de registro
  - Capturado: server-side (formulario)
  
EVENTO 4: SIGNUP_COMPLETED
  - Usuario registrado exitosamente
  - Capturado: auth service → webhookPublisher
  - Datos: user_id (nuevo)
  
EVENTO 5: PAYMENT_APPROVED
  - Pago procesado por PayPal
  - Capturado: payment service → webhookPublisher
  - Datos: transaction_id, amount_usd, user_id
  - IMPORTANTE: NO modificar lógica de PayPal
```

#### 6.4 Integración con PayPal (3 horas)

```
Flujo de pago existente (NO MODIFICAR):
  1. Usuario hace pago en PayPal
  2. PayPal webhook → /api/webhooks/payment (EXISTENTE)
  3. Servicio de pagos registra pago (EXISTENTE)

Nueva integración (Community Publisher):
  4. Servicio de pagos LLAMA a Community Publisher:
     POST /api/webhooks/community-publisher/tracking
     {
       event_type: "PAYMENT_APPROVED",
       pub_id: "pub_xyz",
       transaction_id: "PayPal_TXN_123",
       user_id: "user_abc",
       amount_usd: 9.99,
       signature: "HMAC(...)"
     }
  5. Community Publisher registra atribución
  6. NO modificar PayPal
  7. NO procesar dinero
  8. NO crear webhooks paralelos

Cambio requerido en payment service (1 línea):
  Después de registrar pago, llamar a tracking webhook
```

### Deliverables Fase 6

```
ARCHIVOS CREADOS:
  ✓ app/lib/utils/hmacSigning.ts
  ✓ app/api/webhooks/community-publisher/tracking/route.ts
  ✓ app/lib/services/cpTrackingService.ts

ARCHIVOS MODIFICADOS:
  ✓ app/api/webhooks/payment/route.ts (1 línea: llamada a tracking)
  ✓ data/community-publisher/tracking/ (directorio de datos)

TESTING:
  ✓ HMAC signature válido
  ✓ Webhook recibe evento
  ✓ Eventos registrados en archivo
  ✓ Deduplicación funciona
  ✓ PayPal integration validada

EVIDENCIA:
  ✓ tracking/[date].json contiene eventos
  ✓ HMAC válida en URLs
  ✓ Correlación pub_id → user_id → transaction
```

---

## TESTING Y DEBUGGING [10 horas]

### Flujo de Testing

```
UNIT TESTS (3 horas):
  ✓ Event processor valida correctamente
  ✓ Filtros aplican reglas correctas
  ✓ Priority queue ordena bien
  ✓ HMAC signing válido

INTEGRATION TESTS (4 horas):
  ✓ Disparador → CP → Telegram (flujo completo)
  ✓ Persistencia mantiene estado
  ✓ Reinicio sin duplicación
  ✓ Admin panel actualiza datos

E2E TESTS (2 horas):
  ✓ Usuario hace clic en Telegram
  ✓ Landing page carga
  ✓ Evento CLICK registrado
  ✓ Correlación visible en tracking

QA MANUAL (1 hora):
  ✓ Verificar cada tipo de publicación
  ✓ Verificar límites diarios
  ✓ Verificar manejo de errores
  ✓ Verificar logs (sin tokens)
```

---

## ESTADO FINAL ESPERADO

### Después de 6 fases (~120 horas)

```
✅ Todas las fases completadas
✅ TEST_ONLY = true (sin envío a oficial aún)
✅ Sistema pausado por seguridad
✅ Documentación de deployment lista

ANTES DEL PRIMER ENVÍO OFICIAL:

Checklist de Configuración:
  1. ¿Lugar exacto para pegar TELEGRAM_BOT_TOKEN?
  2. ¿Canal de prueba configurado?
  3. ¿Cómo obtener y comprobar channel_id?
  4. ¿Permisos del bot verificados?
  5. ¿Archivos creados y modificados listados?
  6. ¿Evidencia de que NO se envió nada al oficial?
  
Pausa Crítica:
  Sistema espera aprobación manual para:
    - Cambiar TEST_ONLY = false
    - Reanudar publicaciones
    - Enviar primer mensaje a @carvipix_official
```

---

## NOTAS DE IMPLEMENTACIÓN

### Blindaje (No tocar)

```
🔒 Expediente Maestro V3
🔒 Prompt Maestro
🔒 Scheduler analítico
🔒 Señal Maestra
🔒 Disparador (solo consumir eventos)
🔒 PayPal (solo integración de entrada)
🔒 Usuarios y login
🔒 Resend
🔒 Bot Engine
```

### Congelamiento

```
DURANTE LA IMPLEMENTACIÓN:
  - No agregar funciones de V2/V3
  - Mantener scope exacto de V1
  - Si aparece conflicto: detener y consultar

DESPUÉS DE V1:
  - Documentar aprendizajes
  - Validar con usuario
  - Entonces: V2/V3 (si aplica)
```

---

**DOCUMENTO FINAL**: Plan de implementación oficial  
**ESTADO**: Listo para comenzar Fase 1  
**SIGUIENTE**: Inicio de desarrollo
