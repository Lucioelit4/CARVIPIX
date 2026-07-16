# AUDITORÍA TÉCNICA: COMMUNITY PUBLISHER V1

**Documento de Control**  
**Fecha**: 2026-07-14  
**Propósito**: Identificar sobrearquitectura, capacidades no soportadas por Telegram, y simplificaciones necesarias  
**Estado**: PRE-APROBACIÓN

---

## HALLAZGOS CRÍTICOS

### ❌ FUNCIONALIDADES NO SOPORTADAS POR TELEGRAM BOT API

#### 1. BIENVENIDA AUTOMÁTICA EN CANAL
**Dónde aparece**: Architecture, Tipos de Publicaciones, Panel Admin  
**Asunción**: "BIENVENIDA: Nuevos miembros → Telegram DM"  
**Realidad Telegram**:
- ❌ Bot NO recibe evento cuando alguien entra a canal público
- ❌ Bot SOLO recibe evento si está en grupo vinculado
- ❌ No hay forma de enviar DM automático al entrar al canal
- ⚠️ Puede hacerse SOLO si usuario inicia conversación con bot primero

**Impacto**: BIENVENIDA tipo debe eliminarse de V1 o convertirse en "Bienvenida manual via grupo" (requiere grupo privado vinculado)

**Recomendación**: **ELIMINAR de V1**. En V2 si hay grupo privado vinculado.

---

#### 2. CLICS EN BOTONES EXTERNOS
**Dónde aparece**: Tracking Service, URL de Tracking  
**Asunción**: Bot puede saber si usuario clickeó link externo en Telegram  
**Realidad Telegram**:
- ❌ Bot NUNCA sabe si usuario clickeó un link externo
- ❌ Links no van a través del bot
- ❌ No hay webhook para "usuario clickeó enlace"
- ✅ Lo ÚNICO que funciona: URL tracking INTERNO (CARVIPIX debe recibir el clic)

**Impacto**: REQUIRES_INTERNAL_TRACKING  

**Recomendación**: Documentar claramente que:
```
Bot envía: https://carvipix.app/free-alert?pub_id=X
Usuario clickea en Telegram
CARVIPIX recibe el clic (no Telegram)
Bot NUNCA se entera
```

---

#### 3. VISTAS AUTOMÁTICAS DEL CANAL
**Dónde aparece**: Publication interface `telegramViewEstimate`  
**Asunción**: Bot obtiene automáticamente vistas de cada mensaje  
**Realidad Telegram**:
- ⚠️ Telegram proporciona `forward_count` pero NO `view_count` en Bot API
- ⚠️ View counts solo disponibles para canales Premium
- ⚠️ Requiere queries especiales, no es automático
- ❌ No hay evento que dispare cuando mensaje es visto

**Impacto**: REQUIRES_WORKAROUND  

**Recomendación**: 
```
- Eliminar telegramViewEstimate de V1
- Solo rastrear telegramForwards (disponible)
- Para vistas: usar tracking CARVIPIX (clics, visitas a landing)
```

---

#### 4. REACCIONES POR USUARIO
**Dónde aparece**: Tipos de Tracking, Métricas  
**Asunción**: Bot sabe quién hizo cada reacción  
**Realidad Telegram**:
- ✅ Bot SÍ puede obtener reacciones (if habilitadas)
- ❌ Bot NO sabe quién hizo la reacción (privacidad de Telegram)
- ✅ Solo obtiene conteo total por emoji

**Impacto**: PARTIAL_SUPPORT  

**Recomendación**:
```
Usar reacciones solo como métrica agregada:
- "Este mensaje recibió 45 reacciones"
- NO como: "Usuario X reaccionó"
```

---

#### 5. LISTAS AUTOMÁTICAS DE MIEMBROS
**Dónde aparece**: Implícito en "bienvenida individual"  
**Asunción**: Bot puede obtener lista de todos los miembros del canal  
**Realidad Telegram**:
- ❌ Bot NO puede listar miembros en canal público
- ⚠️ Puede listar miembros en grupo privado (si es admin)
- ❌ No hay forma de iterar "para cada nuevo miembro"

**Impacto**: NOT_SUPPORTED  

**Recomendación**: **ELIMINAR feature de bienvenida automática**

---

#### 6. WEBHOOKS DE EVENTOS DE CANAL
**Dónde aparece**: CommunityScheduler, CheckCalendarEvents  
**Asunción**: Telegram puede enviar webhooks cuando algo ocurre en canal  
**Realidad Telegram**:
- ❌ Bot solo recibe webhooks para mensajes privados (no canal)
- ❌ No hay evento "nuevo miembro en canal"
- ❌ No hay evento "reacción añadida a mensaje"
- ✅ SOLO polling: GetUpdates cada N segundos

**Impacto**: REQUIRES_POLLING  

**Recomendación**:
```
Para eventos de canal, usar polling cada 30-60 segundos:
- getUpdates() para nuevos comandos
- getChatMember() para estadísticas puntuales
- Evitar queries frecuentes (rate limit)
```

---

### 🟡 SOBREARQUITECTURA EN V1

#### A. TIPOS DE PUBLICACIÓN (9 → 5)
**Actual**:
```
1. FREE_ALERT
2. TRADE_RESULT
3. MARKET_STATUS
4. OPORTUNIDAD_EN_DESARROLLO
5. EDUCACION
6. ACTIVIDAD_DEL_SISTEMA
7. PROMOCION
8. BIENVENIDA           ← NO SOPORTADO
9. ANUNCIOS_ESPECIALES
```

**Problema**: Muchos tipos impactan filtros, queue, variantes, panel.

**Recomendación V1**:
```
1. FREE_ALERT          (máx 2/día, prioridad 1)
2. TRADE_RESULT        (sin límite, prioridad 2)
3. MARKET_STATUS       (sin límite, prioridad 3)
4. EDUCACION           (máx 2/semana, prioridad 5)
5. PROMOCION           (máx 1 cada 48h, prioridad 7)

ELIMINADOS para V1:
- OPORTUNIDAD_EN_DESARROLLO (puede ser MARKET_STATUS con subtipo)
- ACTIVIDAD_DEL_SISTEMA (no necesaria en V1)
- BIENVENIDA (no soportado por Telegram)
- ANUNCIOS_ESPECIALES (puede ser PROMOCION)

Total: 5 tipos vs 9 → 44% menos complejidad
```

---

#### B. CALENDARIO EDITORIAL (COMPLEX → SIMPLE)
**Actual**: Calendario semanal/biweekly/monthly con eventos múltiples

**Problema**: 
- Agrega complejidad al scheduler
- Requiere lógica de triggers condicionales
- Requiere 50+ variantes por tipo
- Puede esperar a V2

**Recomendación V1**:
```
SIMPLE: Solo EDUCACION programada
- Lunes 10:00 UTC: 1 educación (topic rotativo)
- Miércoles 15:00 UTC: 1 educación (topic rotativo)
- Viernes 18:00 UTC: Resumen semanal

Total: 3 publicaciones semanales, predefinidas.
Variantes: 5-8 por tema, no 50.

DEJAR PARA V2:
- Eventos bi-semanales
- Recurrencia mensual
- Triggers condicionales (AFTER_PREVIOUS_PUBLISHED)
```

---

#### C. SISTEMA DE CAMPAÑAS (FULL → MINIMAL)
**Actual**: 
- Campañas con múltiples fases
- Scheduling (FIXED, TRIGGER)
- Condiciones de trigger
- Gating (una fase espera a la anterior)
- Metrics completas por campaña

**Problema**: 
- No hay campaña real que justifique esto en V1
- Agrega 400+ líneas de código
- Puede manejarse con calendario simple + manual admin

**Recomendación V1**:
```
ELIMINAR para V1
Razón: Community Publisher aún no tiene campaign que lo justifique
Si en futuro hay campaña, crear módulo separado.

Para V1: Si admin quiere promoción multi-día, usar:
- Calendario editorial
- O crear publicaciones manuales en panel admin
- Sin "gating" ni fases.
```

---

#### D. POLÍTICA DE SILENCIO (3 ESTADOS → SIMPLE)
**Actual**: 
- ACTIVE < 4h
- SLOW 4-12h
- DORMANT > 12h
- Lógica de "qué es valor" según estado
- Bloqueo de ciertos tipos en SLOW/DORMANT

**Problema**: 
- Complejidad media
- Afecta 6 filtros
- Requiere state manager
- Puede simplificarse

**Recomendación V1**:
```
SIMPLE: NO publicar si últimas 12h sin actividad

if (timeSinceLastPublication > 12 hours) {
  onlyPublishIfCritical = true  // Solo FREE_ALERT con prob > 80%
} else {
  publishNormally = true
}

Eliminar ACTIVE/SLOW/DORMANT del enum
Solo 2 estados: NORMAL, QUIET_HOURS

Respeta Daily Limits sin estado extra.
```

---

#### E. BIBLIOTECA DE VARIANTES (50 → 8-12)
**Actual**: 
- 50 mensajes por estado frecuente
- 50 para mercado bajo vigilancia
- 50 para educación
- etc.

**Problema**: 
- 300+ mensajes pre-escritos es sobrearquitectura
- Requiere gestión y testing
- Para V1, no necesario

**Recomendación V1**:
```
POR TIPO (máximo):

FREE_ALERT (entrada):
  - 5 variantes técnicas
  - 3 variantes cautious
  
TRADE_RESULT:
  - 4 variantes ganancia
  - 4 variantes pérdida
  
MARKET_STATUS:
  - 4 variantes consolidación
  - 4 variantes volatilidad
  - 4 variantes oportunidad
  
EDUCACION:
  - 5 variantes sobre riesgo
  
PROMOCION:
  - 3 variantes call-to-action

Total: ~50 variantes vs 300+
Strategy: Random (no weighted en V1)
Sin round-robin tracking (agrega complejidad)
```

---

#### F. PANEL ADMINISTRATIVO (8 → 3)
**Actual**: 
1. Dashboard General
2. Histórico de Publicaciones
3. Configuración de Filtros
4. Cola de Publicaciones
5. Moderación de UGC
6. Integración Telegram
7. Estadísticas y Engagement
8. Logs y Auditoría

**Problema**: 
- 8 módulos es un panel completo
- Muchas features no necesarias en V1
- Agregan 2,000+ LOC de frontend

**Recomendación V1**:
```
MÓDULOS OBLIGATORIOS:
1. Dashboard (últimas publicaciones + próxima en queue)
2. Queue (mostrar siguiente publicación a enviar)
3. Configuración (editar límites, horarios)

MÓDULOS PARA V2:
4. Histórico (tabla completa de publicaciones)
5. Estadísticas (métricas de conversión)
6. Logs (auditoría)

ELIMINADOS para V1:
- Moderación UGC (canal público, sin UGC)
- Integración Telegram (setup manual, no requiere panel)
```

---

#### G. FILTROS PIPELINE (6 COMPLETOS → 4 SIMPLES)
**Actual**:
- F1: Type Check ✓ MANTENER
- F2: Time Check (horarios) ✓ MANTENER
- F3: Daily Limits + Ratio ✓ MANTENER (pero simplificado)
- F4: Quality Gate (score) ✗ ELIMINAR (confusa, no clara)
- F5: Duplicate Detection (80% match) ⚠️ SIMPLIFICAR
- F6: Security Check ✓ MANTENER (pero solo essentials)

**Recomendación V1**:
```
FILTRO 1: Type Check
  - ¿Este tipo está habilitado?
  - Rechazo: NO

FILTRO 2: Time Check
  - ¿Es horario permitido (8-22 UTC)?
  - Si es fin de semana: rechaza no-críticos
  - Rechazo: NO

FILTRO 3: Daily Limits
  - FREE_ALERT: máx 2/día
  - EDUCACION: máx 2/semana
  - PROMOCION: máx 1 cada 48h
  - Si cuota alcanzada: rechaza
  - Rechazo: ENQUEUE (intenta mañana)

FILTRO 4: Security
  - ¿Contiene keyword prohibido? (blacklist simple)
  - ¿URL es whitelisted?
  - Rechazo: NO

SIMPLIFICAR:
- NO Quality Gate (confuso, no definido)
- NO Duplicate Detection (probabilidad de error, V2)
- NO Promotional Ratio (solo límite simple por tipo)
```

---

### 🔴 CONTRADICCIONES EN DOCUMENTOS

#### 1. SELECCIÓN DE ALERTAS GRATUITAS NO DEFINIDA
**Problema**: Architecture menciona "Alerta gratuita (máxima)" pero contrato NO especifica:
- ¿Qué pasa si llegan dos alertas con probability 78% y 82%?
- ¿Se publican ambas o solo la mejor?
- ¿Hay ventana de tiempo para esperar mejores alertas?
- ¿Qué ocurre si la primera fue publicada y luego llega una 90%?

**Requerimiento faltante**: "Selector de alertas gratuitas" - EXACTAMENTE cuándo se publica

**Recomendación V1**:
```
POLÍTICA CLARA:

1. Cuando llega alert con prob >= 70%:
   - Entra a queue con prioridad 1
   - Se publica inmediatamente (no espera)
   
2. Límite 2/día:
   - Primera alert: se publica cuando pasa filtros
   - Segunda alert: se publica cuando pasa filtros
   - Tercera alert: se rechaza (cuota agotada)
   
3. Si la primera fue baja (prob 72%) y llega una mejor (prob 88%):
   - Se publica solo la 88% (reemplaza la 72%)
   - O se publican ambas (si aún hay cuota)
   
DECISIÓN REQUERIDA: ¿Descartar la 72%?
```

---

#### 2. RESULTADOS: ¿QUÉ SE PUBLICA?
**Problema**: "TRADE_RESULT: Solo publicar si fue previamente publicada en canal"

Pero contrato NO define:
- ¿Qué pasa con trades cerrados de análisis NO publicados?
- ¿Se archivan silenciosamente?
- ¿Hay espacio para "resultados educativos" de trades no publicados?

**Recomendación V1**:
```
REGLA SIMPLE Y ESTRICTA:

TRADE_RESULT solo publicable si:
  1. Fue asociado a un FREE_ALERT publicado en Telegram
  2. Tiene timestamp de cierre > timestamp de publicación
  3. Tiene P&L final calculado

Si no cumple: se archiva, no se publica.

INDICACIÓN OBLIGATORIA en cada resultado:
  ✅ "Resultado de alerta publicada el [fecha]"
  ❌ Nunca "Resultado educativo" sin fuente verificable
```

---

#### 3. POLÍTICA PROMOCIONAL: ¿CÓMO SE CALCULA?
**Problema**: "Máximo 20% del contenido"

Pero contrato NO define:
- ¿Ventana móvil de cuántas publicaciones? (última 20? última 100?)
- ¿Contador diario reseta a medianoche UTC? (¿qué si solo hay 5 pubs/día?)
- ¿La promoción misma cuenta como "contenido"?
- ¿Educación promocional (webinar sobre risk) cuenta como educación o promoción?

**Recomendación V1** (más simple):
```
REGLA SIMPLE:

Máximo 1 promoción directa cada 48 horas.

Si hay menos de 20 publicaciones en día:
  - No aplicar ratio
  - Solo aplicar límite de "1 cada 48h"

CONTEO:
  Promo += 1 cuando se publica PROMOCION type
  Reset: nunca (es límite de frecuencia, no de porcentaje)

Ejemplo:
  Lunes 10:00 - publica PROMOCION #1
  Lunes 18:00 - rechaza PROMOCION (< 48h desde #1)
  Miércoles 12:00 - publica PROMOCION #2 (> 48h)
```

---

#### 4. POLÍTICA DE TRACKING: ¿INTEGRACIÓN CON PAGOS EXISTENTES?
**Problema**: Architecture menciona "PAYMENT_APPROVED" pero NO define:
- ¿Cómo se integra con Stripe/PayPal existente?
- ¿Quién dispara el evento? (Sistema de pagos o Community Publisher?)
- ¿Hay riesgo de duplicación?
- ¿Requiere cambios en backend de pagos?

**Recomendación V1**:
```
REQUIREMENT CLARIFICACIÓN:

Community Publisher RECIBE eventos de pago (no los crea):
  - Payment system emite: PAYMENT_APPROVED
  - Community Publisher escucha evento
  - Correlaciona con publication_id
  - Registra en su DB

FLUJO:
  1. Usuario clickea link de publicación
  2. Llega a landing, se registra
  3. Paga via Stripe/PayPal
  4. Sistema de pagos emite webhook: PAYMENT_APPROVED
  5. Community Publisher recibe webhook
  6. Correlaciona con pub_id (vía user.referrer_source)
  7. Actualiza publication.metrics.revenue

SIN CAMBIOS en lógica de pagos existente.
```

---

### 🟠 RIESGOS DE SEGURIDAD

#### 1. BLOQUEO AUTOMÁTICO DE PROMPTS
**Riesgo**: Architecture menciona "bloqueo automático de keyword 'prompt'"

**Problema**:
- ¿Qué si un análisis legítimo menciona "prompt engineering"?
- ¿Qué si ChatGPT output contiene "prompting" en análisis de psicología?
- False positives pueden rechazar contenido válido

**Recomendación V1**:
```
CAMBIAR de automático a LOGGING:

if (content.includes(blockedKeyword)) {
  log("SECURITY_WARNING: Contains blocked keyword: " + keyword)
  sendAdminAlert()  // Humano revisa
  hold(content)     // No publicar automáticamente
}

Admin tiene 5 minutos para:
  - Aprobar (si es false positive)
  - Rechazar
  - Editar y republish

Cambiar paradigma: LOG + HUMAN, no automático
```

---

#### 2. PRIVACIDAD EN URLS
**Riesgo**: URL de tracking contiene `pub_id=...`

**Problema**: 
- Si URL es compartida, alguien puede ver todos los pub_ids
- ¿Qué información expone pub_id? (nada, es OK)
- ¿Qué si someone adivina siguientes pub_ids?

**Recomendación V1**:
```
URLs de tracking: ✅ SEGURAS
  pub_id = alphanumeric random, no secuencial
  campaign_id = alphanumeric random
  Ejemplo: pub_xY9mK2nL (no pub_001, pub_002)

AGREGAR:
  signature: HMAC(pub_id + campaign_id, SECRET)
  Para prevenir tampering

URL final:
  https://carvipix.app/free-alert
    ?pub=xY9mK2nL
    &campaign=aB1cD2eF
    &sig=5f7d2e8a9c...
```

---

#### 3. EXPOSICIÓN DE TELEGRAM TOKEN
**Riesgo**: Token en .env.local

**Problema**:
- .env.local no debe versionarse (OK, en .gitignore)
- ¿Pero qué si servidor se compromete?
- ¿Hay acceso segregado por rol?

**Recomendación V1**:
```
IMPLEMENTAR:

1. Token en .env.local ✓
2. Token también en sistema secrets (Vercel, Docker)
3. No loguear token nunca (audit logs)
4. Rotar token cada 90 días
5. Bot solo puede:
   - Enviar a canal específico
   - NO acceder a otros canales/grupos
   - NO listar miembros
   - NO acceder a messages privados

PERMISOS MÍNIMOS:
  sendMessage: SI
  editMessageText: SI (para correcciones)
  deleteMessage: NO
  getChat: NO
  getChatMembers: NO
```

---

### 📊 INCOMPATIBILIDADES CON DISPARADOR

#### 1. EVENTO "ANALYSIS_COMPLETED" - ¿QUÉ CAMPO USAR?
**Problema**: Architecture menciona "ANALYSIS_COMPLETED con decision = ENTER_BUY"

Pero Disparador puede no tener exactamente ese campo.

**Recomendación V1**:
```
VALIDAR CON DISPARADOR:

Qué campos exactos proporciona Disparador para análisis completado:
  - analysis_id? ✓
  - instrument? ✓
  - decision? (ENTER_BUY? ENTER_SELL? HOLD?)
  - probability? (0-100?)
  - conviction? ✓
  - entry_price? ✓
  - stop_loss? ✓
  - timestamp? ✓
  - analysis_quality? ✓

SIN ASUMIR - VERIFICAR ANTES.
```

---

#### 2. EVENTO "TRADE_CLOSED" - ¿QUIÉN LO EMITE?
**Problema**: Architecture menciona "TRADE_CLOSED", pero:
- ¿Lo emite Paper Trading Monitor?
- ¿O Observador V3 directamente?
- ¿Qué información incluye?

**Recomendación V1**:
```
MAPEO NECESARIO:
  - Paper Trading Monitor emite: TRADE_CLOSED
  - Campos: entry_price, exit_price, entry_time, exit_time, P&L, instrument
  - SIN ASUMIR - VALIDAR ESTRUCTURA EXACTA
```

---

## FUNCIONALIDADES APLAZADAS (V2/V3)

```
❌ Calendario Editorial semanal/biweekly/monthly
❌ Sistema de Campañas multi-fase
❌ Moderación de UGC
❌ BIENVENIDA automática
❌ ACTIVIDAD_DEL_SISTEMA tipo
❌ OPORTUNIDAD_EN_DESARROLLO tipo
❌ Panel Admin completo (8 módulos)
❌ Política de Silencio (3 estados)
❌ Duplicated Detection (80% match)
❌ Quality Gate (score complejo)
❌ Variantes ponderadas (weighted)
❌ Tracking de scroll/bot detection
❌ Campañas A/B testing
❌ Integración con Telegram Premium metrics
❌ Webhooks de eventos de canal
❌ Escalabilidad a 100K miembros
```

---

## ALCANCE EXACTO: COMMUNITY PUBLISHER V1

### ENTRADA (Disparador)
```
DisparadorEvent
├─ ANALYSIS_COMPLETED
│  ├─ analysis_id
│  ├─ instrument
│  ├─ decision (ENTER_BUY | ENTER_SELL | HOLD)
│  ├─ probability (0-100)
│  ├─ conviction
│  ├─ entry_price
│  ├─ stop_loss
│  └─ timestamp
│
└─ TRADE_CLOSED
   ├─ trade_id
   ├─ associated_analysis_id
   ├─ entry_price
   ├─ exit_price
   ├─ P&L
   ├─ entry_time
   ├─ exit_time
   ├─ instrument
   └─ timestamp
```

### PROCESOS
```
1. Event Processor
   ANALYSIS_COMPLETED → Publication (draft)
   TRADE_CLOSED → Publication (draft)

2. Filter Pipeline (4 filtros)
   F1: Type Check
   F2: Time Check (8-22 UTC)
   F3: Daily Limits (2 alerts, 2 edu, 1 promo/48h)
   F4: Security Check

3. Content Generator
   - Selecciona variante aleatoria (8-12 por tipo)
   - Compone markdown
   - Genera URL con tracking: pub_id, campaign_id, content_type, source

4. Priority Queue
   - Ordenado por prioridad (1-5)
   - FIFO en empate

5. Scheduler (Simple)
   - Cada 5 minutos: chequea queue
   - Publica siguiente evento
   - Registra timestamp + telegram_message_id

6. Tracking Service
   - Recibe eventos de landing page
   - Correlaciona con pub_id
   - Registra: click, visit, signup, payment
```

### SALIDA (Telegram)
```
Message
├─ Text (Markdown)
├─ URL de tracking
├─ Reply markup (sin botones, solo link texto)
└─ No inline buttons
```

### PERSISTENCIA
```
data/community-publisher/
├─ publications/
│  └─ [YYYYMMDD].json (diarios)
├─ queue.json
├─ config.json (límites, horarios, keywords)
└─ tracking/
   └─ [YYYYMMDD].json (eventos)
```

### PANEL ADMIN (V1)
```
Pages:
  1. Dashboard
     - Últimas 5 publicaciones
     - Próxima en queue
     - Métrica: clics, registros, pagos hoy
  
  2. Queue
     - Mostrar siguiente evento
     - Botón: "Publicar ahora"
     - Botón: "Rechazar"
  
  3. Configuración
     - Habilitar/deshabilitar tipos
     - Horarios (start, end)
     - Límites por tipo
     - Keywords bloqueadas
```

### API ENDPOINTS (V1)
```
GET /api/internal/community-publisher/status
  → {queue_length, last_published, next_in_queue}

GET /api/internal/community-publisher/publications
  → {publications: [], count}

POST /api/internal/community-publisher/publish-now
  → {success, message_id}

POST /api/webhooks/community-publisher/tracking
  → recibe CLICK, PAGE_VISIT, SIGNUP, PAYMENT
```

---

## ARCHIVOS NECESARIOS (V1)

```
app/lib/types/
├─ communityPublisherTypes.ts          (150 LOC)

app/lib/services/
├─ eventProcessorService.ts            (100 LOC)
├─ filterPipelineService.ts            (150 LOC)
├─ contentGeneratorService.ts          (100 LOC)
├─ priorityQueueService.ts             (80 LOC)
├─ communitySchedulerService.ts        (150 LOC)
├─ trackingService.ts                  (100 LOC)

app/api/internal/community-publisher/
├─ route.ts                            (80 LOC - GET status, GET publications)
├─ publish-now/route.ts                (50 LOC - POST)

app/api/webhooks/community-publisher/
├─ tracking/route.ts                   (50 LOC - POST)

app/admin/community-publisher/
├─ page.tsx                            (200 LOC - Dashboard)
├─ components/
   ├─ QueueViewer.tsx                  (80 LOC)
   ├─ ConfigForm.tsx                   (150 LOC)
   ├─ PublicationHistory.tsx           (80 LOC)

data/
├─ community-publisher/
   ├─ publications/                    (JSON daily files)
   ├─ config.json                      (setup)
   ├─ queue.json
   └─ tracking/                        (JSON daily files)

Total: ~1,600 LOC (vs 3,500 + 2,500 = 6,000 en docs)
Simplificación: 73% menos código
```

---

## ESTIMACIÓN DE TIEMPO (V1)

```
Backend Services:        40 hours
  - Event processing
  - Filtering
  - Queue management
  - Scheduler
  
Content & Telegram:      20 hours
  - Template system
  - Content generation
  - Telegram integration
  - Retry/error handling

API Endpoints:           15 hours
  - Status endpoint
  - Publication endpoint
  - Publish-now endpoint
  - Tracking webhook

Admin Panel:             25 hours
  - Dashboard
  - Queue viewer
  - Configuration form
  - Publication history

Testing & Debugging:     20 hours

TOTAL: 120 horas (~3 semanas, 1 desarrollador)

vs Original Plan (6,000 LOC): 300+ horas

AHORRO: 180 horas = 4.5 semanas
```

---

## RIESGOS MITIGADOS EN V1

```
RIESGO                          MITIGACIÓN
─────────────────────────────────────────────────────
Telegram API no entrega X       Validar V1, posponer V2
Sobrearquitectura               Reducir de 9 → 5 tipos
Complejidad del scheduler       Dual mode → simple tick
Campañas no justificadas        Eliminar, solo manual
UGC moderación innecesaria      Eliminar canal público
Variantes 300+                  8-12 por tipo
Integración con pagos           No modificar existente
False positives en seguridad    Human approval, no automático
```

---

## VARIABLES A PROPORCIONAR

```
ANTES DE IMPLEMENTAR, USUARIO DEBE CONFIRMAR:

1. ¿Estructura exacta de ANALYSIS_COMPLETED event?
2. ¿Estructura exacta de TRADE_CLOSED event?
3. ¿Rango de probability? (0-100? 0-1?)
4. ¿Timezone oficial de CARVIPIX? (para UTC conversion)
5. ¿Límites definitivos?
   - Alertas gratuitas/día: 2? 3?
   - Educación/semana: 2? 3?
   - Promoción/48h: 1? 2?
6. ¿Horarios de publicación? (8-22 UTC? diferente?)
7. ¿Canal de prueba y oficial diferentes?
8. ¿Webhook URL para tracking eventos?
9. ¿Integration con Stripe/PayPal ya existe?
10. ¿Roles/permisos en admin panel?
```

---

## CHECKLIST PRE-IMPLEMENTACIÓN

```
ARQUITECTURA:
☐ Reducir de 9 → 5 tipos de publicación
☐ Eliminar Calendario Editorial complejo (solo 3 posts semanales fijos)
☐ Eliminar Sistema de Campañas (usar panel admin manual)
☐ Simplificar Política de Silencio (1 regla: si > 12h, solo críticos)
☐ Reducir Variantes de 300+ → 50 total
☐ Reducir Panel Admin de 8 → 3 módulos
☐ Reducir Filtros de 6 → 4
☐ Validar que ningún componente asume capacidades no soportadas por Telegram

CONTRATO:
☐ Definir exactamente cuándo se publica alerta (si prob >= 70%, inmediato)
☐ Definir exactamente qué resultados se publican (solo asociados a alertas publicadas)
☐ Definir exactamente política de promoción (1 cada 48h, no ratio)
☐ Definir tracking de pagos (sin modificar lógica existente)
☐ Documentar que bot NO sabe si alguien clickeó link (solo CARVIPIX sabe)

SEGURIDAD:
☐ Cambiar bloqueo automático a logging + human review
☐ Agregar HMAC signature a URLs de tracking
☐ Definir rotación de token Telegram (90 días)
☐ Definir permisos mínimos del bot

DISPARADOR:
☐ Validar estructura exacta de ANALYSIS_COMPLETED
☐ Validar estructura exacta de TRADE_CLOSED
☐ Confirmar campos disponibles
☐ Confirmar rango de valores (probability, conviction, etc)

TESTING:
☐ Test idempotencia (pub_id duplicado no replica mensaje)
☐ Test retry logic (fallos no duplican)
☐ Test filters (cada filtro rechaza correctamente)
☐ Test queue ordering (prioridad respetada)
```

---

## CONCLUSIÓN: VEREDICTO FINAL

**Documentos Actuales**: Bien intencionados pero SOBREARQUITECTURADOS para V1

**Hallazgos**:
- ❌ 3 funcionalidades NO soportadas por Telegram
- ❌ 7 características de sobrearquitectura para V1
- ⚠️ 4 contradicciones no resueltas en especificaciones
- 🔴 3 riesgos de seguridad

**Recomendación Final**:

```
NO APROBAR documentos actuales para implementación.

CREAR NUEVA VERSIÓN:
- COMMUNITY_PUBLISHER_V1_SIMPLIFIED.md (1,200 LOC, no 3,500)
- COMMUNITY_PUBLISHER_V1_CONTRACT.md (800 LOC, no 2,500)

Con alcance exacto:
✅ 5 tipos de publicación
✅ 4 filtros simples
✅ Queue con prioridades
✅ Scheduler sencillo
✅ Tracking interno
✅ Panel admin 3 módulos
✅ 100 líneas de riesgos mitigados
✅ Checklist pre-implementación

TIEMPO ESTIMADO: 120 horas vs 300+ horas (ahorro 60%)

APLICACIÓN DE METODOLOGÍA:
✓ Arquitectura simplificada (listo)
✓ Contrato sin contradicciones (pendiente rewrite)
✓ Auditoría completada (este documento)
✓ Aprobación final (pendiente usuario)
✓ Implementación (cuando apruebes)
```

**ESTADO**: AUDITORÍA COMPLETA - EN ESPERA DE INSTRUCCIONES

---

**PRÓXIMO PASO**: Usuario revisa hallazgos y decide:

A) Reescribo ambos documentos con V1 simplificada
B) Modifico solo puntos específicos
C) Rechaza y solicita enfoque diferente
