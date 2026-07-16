# AUDITORÍA DE DISEÑO: COMMUNITY PUBLISHER V1

**Estado**: PRE-IMPLEMENTACIÓN  
**Fecha**: 2026-07-14  
**Metodología**: Arquitectura → **Auditoría (ESTAMOS AQUÍ)** → Contrato → Implementación → Certificación → Congelamiento  

---

## DECISIONES DE NEGOCIO CRÍTICAS

### ✅ APROBADO - No requiere cambios arquitectónicos

#### 1. Filosofía de Consumidor (Disparador → Telegram)
**Decisión**: Telegram es consumidor del Disparador, no decisor.

**Impacto Arquitectónico**: 
- ✅ Ya implementado en arquitectura: "Event Processor" recibe de Disparador
- ✅ Community Publisher NO modifica decisiones de Observador V3
- ✅ Separación limpia de responsabilidades
- ✅ No introduce retroalimentación (feedback loop) al Motor

**Confirmación**: Mantener como está.

---

#### 2. Plantillas Separadas por Tipo
**Decisión**: Cada tipo de publicación (FREE_ALERT, TRADE_RESULT, MARKET_STATUS, etc) tiene plantilla propia.

**Impacto Arquitectónico**:
- ✅ Ya implementado: Sección 5 del documento define 9 templates
- ✅ Cada template tiene estructura TypeScript (type-safe)
- ✅ Variables ${variable} bien definidas
- ✅ Fácil de mantener y auditar

**Confirmación**: Mantener como está.

---

#### 3. Límite de Alertas Gratuitas
**Decisión**: Máximo 2 alertas gratuitas por día.

**Impacto Arquitectónico**:
- ✅ Ya implementado: FILTRO 3 (Daily Limits) en arquitectura
- ✅ Contador por tipo de publicación
- ✅ Resetea cada medianoche UTC
- ✅ Sistema de cuotas está diseñado

**Confirmación**: Mantener como está.

---

#### 4. Panel Administrativo Propio
**Decisión**: Sistema tiene panel nativo en http://localhost:3000/admin/community-publisher (separado de Observador V3).

**Impacto Arquitectónico**:
- ✅ Ya propuesto en Sección 7
- ✅ 8 módulos funcionales independientes
- ✅ No mezcla con admin de Observador V3
- ✅ Auditoría propia de acciones

**Confirmación**: Mantener como está.

---

#### 5. Moderación de UGC (User Generated Content)
**Decisión**: Usuarios pueden enviar capturas de operaciones. Sistema auto-valida. Admin aprueba/rechaza.

**Impacto Arquitectónico**:
- ✅ Ya propuesto en Sección 6
- ✅ Pipeline: Recepción → Validación automática → Cola para moderación → Aprobación → Publicación
- ✅ Nunca publica sin admin check en versión inicial
- ✅ Seguridad: Valida que la captura contenga SOLO resultado de trade, no prompts/keys

**Confirmación**: Mantener como está.

---

#### 6. Separación Contenido Público vs Privado
**Decisión**: Algunas publicaciones van a canal Telegram público. Otras son solo para dashboard interno.

**Impacto Arquitectónico**:
- ✅ Cada CommunityPublisherEvent tiene campo `destinations: ["telegram" | "dashboard" | "both"]`
- ✅ Si es "dashboard", nunca sale a Telegram (información estratégica)
- ✅ Auditoría registra destino de cada publicación

**Confirmación**: Mantener como está.

---

---

## 🟡 REQUIERE REDISEÑO - Cambios arquitectónicos necesarios

### PUNTO 1: PRIORIDAD DE PUBLICACIONES

**Propuesta del Usuario**:
```
1. Alerta gratuita (máxima prioridad)
2. Resultado de operación
3. Estado del mercado
4. Oportunidad en desarrollo
5. Actividad del sistema
6. Educación
7. Promoción
8. Bienvenida (mínima)
```

**Impacto Arquitectónico**:

#### Problema Actual
- Documento propone filtros para decidir "sí/no" publicar
- NO propone un mecanismo de ordenamiento cuando hay conflictos
- Ejemplo: ¿Qué pasa si coinciden ALERTA + ESTADO DEL MERCADO + EDUCACIÓN?

#### Solución Propuesta
1. **Queue de Prioridades** (nueva componente)
   ```
   CommunityPublisherQueue {
     publicationType: string;
     priority: 1-8;  // 1=máxima
     timestamp: Date;
     content: string;
     destinations: string[];
     status: "pending" | "scheduled" | "published" | "failed";
   }
   ```

2. **Scheduler ejecuta en orden**:
   - Ordena por prioridad (ascendente: 1 → 8)
   - Si dos eventos tienen misma prioridad, por timestamp (FIFO)
   - Solo publica si pasa FILTRO 3 (Daily Limits)
   - Despacha el primero, recheck en 5 minutos

3. **Modificación a Community Scheduler**:
   - Input: Lista de eventos listos para publicar
   - Output: El SIGUIENTE evento a publicar (considerando prioridad + cuotas)
   - Si cola está vacía, espera o activa "Política de Silencio" (ver Punto 2)

#### Ficheros a Modificar en Arquitectura
- Agregar `CommunityPublisherQueue` a tipos
- Modificar `Community Scheduler` para incluir lógica de prioridades
- Agregar `Priority Queue Manager` como subcomponente

**Estado**: ✅ **APROBABLE** - Pequeño cambio, implementable.

---

### PUNTO 2: POLÍTICA DE SILENCIO

**Propuesta del Usuario**:
- Si no hay nada útil, NO publicar
- Si canal lleva muchas horas sin actividad, publicar SOLO contenido de valor
- Nunca llenar por obligación

**Impacto Arquitectónico**:

#### Problema Actual
- Scheduler es **reactivo**: reacciona a eventos del Disparador
- NO tiene lógica de "qué hacer si no hay eventos"
- No contempla "obligación de publicar"

#### Solución Propuesta
1. **Modo de Funcionamiento** (nuevo concepto)
   ```typescript
   enum ChannelState {
     ACTIVE = "active",           // 1-4 horas sin publicar
     SLOW = "slow",               // 4-12 horas sin publicar
     DORMANT = "dormant";         // >12 horas sin publicar
   }
   ```

2. **Reglas según Estado**:
   - **ACTIVE**: Publica eventos normalmente (aplica prioridades)
   - **SLOW**: Solo publica VALOR (tipos: FREE_ALERT, TRADE_RESULT, EDUCATION) + omite BIENVENIDA/ACTIVIDAD
   - **DORMANT**: Solo FREE_ALERT si es de alta calidad, rechaza todo lo demás

3. **Cálculo de "Valor"**:
   - FREE_ALERT con probability > 70% = Valor
   - TRADE_RESULT (cualquier estado) = Valor
   - MARKET_STATUS = Valor si hay volatilidad > 2% o nuevos niveles
   - EDUCATION = Valor siempre
   - ACTIVIDAD DEL SISTEMA = Nunca en modo SLOW/DORMANT
   - PROMOCIÓN = Solo si está en calendario editorial (ver Punto 5)

4. **Triggering Logic**:
   ```
   if (timeSinceLastPublication > 12 hours) {
     // DORMANT: espera alerta de Alta Prioridad o resetea a medianoche
   } else if (timeSinceLastPublication > 4 hours) {
     // SLOW: solo Valor
   } else {
     // ACTIVE: normal
   }
   ```

#### Ficheros a Modificar
- Agregar `ChannelState` a tipos
- Modificar `Quality Gate Filter` para evaluar "Valor" dinámicamente
- Agregar timestamp de "last publication" a persistencia

**Estado**: ✅ **APROBABLE** - Requiere nuevo filtro, pero es modular.

---

### PUNTO 3: PROMOCIÓN INTELIGENTE (Máx 15-20%)

**Propuesta del Usuario**:
- No más del 15-20% del contenido puede ser PROMOCIÓN
- El resto debe ser valor (análisis, resultados, educación, actividad)

**Impacto Arquitectónico**:

#### Problema Actual
- Filtro 3 (Daily Limits) cuenta por tipo, pero NO por categoría
- No contempla "porcentaje de contenido"

#### Solución Propuesta
1. **Categorización de Contenido** (nueva clasificación)
   ```typescript
   enum ContentCategory {
     VALUE = "value",             // FREE_ALERT, TRADE_RESULT, MARKET_STATUS, EDUCATION
     OPERATIONAL = "operational", // OPORTUNIDAD, ACTIVIDAD
     PROMOTIONAL = "promotional", // PROMOCIÓN, BIENVENIDA
   }
   ```

2. **Regla de 80-20**:
   - Track en 24 horas: cuántas publicaciones de cada categoría
   - Si PROMOTIONAL ≥ 20%, rechaza próxima PROMOCIÓN
   - Si PROMOTIONAL > 15%, la Política de Silencio la puede rechazar también

3. **Implementación**:
   ```
   dailyStats = {
     value: 12,
     operational: 5,
     promotional: 2,
     total: 19
   }
   
   promotionalRatio = 2 / 19 = 10.5% ✅ Permitido
   
   Si siguiente evento es PROMOCIÓN:
   - Calcular: (2 + 1) / (19 + 1) = 15%
   - Check: 15% <= 20% ✅ Permitido
   ```

4. **Comportamiento**:
   - Si ratio > 20%, mete PROMOCIÓN en cola pero con prioridad baja (8)
   - Al día siguiente a medianoche, counters resetean

#### Ficheros a Modificar
- Agregar `ContentCategory` a tipos
- Agregar `dailyPromotionalStats` a persistencia
- Modificar `FILTRO 3` para incluir lógica de porcentaje

**Estado**: ✅ **APROBABLE** - Pequeño cambio en Daily Limits, muy importante para credibilidad.

---

### PUNTO 4: BIBLIOTECA DE MENSAJES (Variantes)

**Propuesta del Usuario**:
- 50 mensajes para "mercado sin oportunidad"
- 50 para "mercado bajo vigilancia"
- 50 para "educación"
- 50 para "resultados"
- Etc.

No quiere que el canal parezca robótico.

**Impacto Arquitectónico**:

#### Problema Actual
- Arquitectura propone `plantillas`, pero es UNA plantilla por tipo
- No contempla variación dentro del mismo tipo

#### Solución Propuesta
1. **Estructura de Templates con Variantes**:
   ```typescript
   type PublicationTemplate = {
     type: "FREE_ALERT" | "MARKET_STATUS" | ...;
     variants: PublicationVariant[];
     selectionStrategy: "random" | "round-robin" | "weighted";
   }
   
   type PublicationVariant = {
     id: string;
     content: string;           // Markdown con ${variables}
     tone: "technical" | "casual" | "cautious";
     length: "short" | "medium" | "long";
     usageCount?: number;       // Para round-robin
   }
   ```

2. **Ejemplos de Variantes para MARKET_STATUS**:
   ```
   Variante 1: "📊 ${instrument} en vigilancia. Volumen ${volume}. Próxima barrera: ${level}."
   Variante 2: "⏱️ ${instrument} consolidando. Sin movimiento significativo en últimas 2h. Estado: ${state}."
   Variante 3: "🔍 Seguimiento a ${instrument}. Mercado neutral. Esperando confirmación de ${signal}."
   ```

3. **Selection Strategy**:
   - **random**: Cada vez que publica ese tipo, elige aleatoriamente
   - **round-robin**: Rotación para evitar repetir la misma variante consecutivamente
   - **weighted**: Algunas variantes más frecuentes que otras

4. **Persistencia**:
   - Archivo: `data/community-publisher/templates/[type]_variants.json`
   - Almacena todas las variantes + usage count si usa round-robin

5. **Configuración**:
   - Panel Admin: Sección "Biblioteca de Mensajes"
   - Permite: agregar, editar, deshabilitar variantes sin redeploy
   - Auditoría: Log de qué variante se usó en cada publicación

#### Ficheros a Crear
- `data/community-publisher/templates/` (directorio)
- Tipos: `PublicationVariant`, `VariantSelectionStrategy`
- Servicio: `TemplateVariantService` (cargar, seleccionar, registrar uso)

**Estado**: ✅ **APROBABLE** - Modular, no afecta arquitectura core. Archivo de configuración externo.

---

### PUNTO 5: CALENDARIO EDITORIAL

**Propuesta del Usuario**:
- Lunes → Gestión de riesgo
- Miércoles → Psicología
- Viernes → Resumen semanal
- Contenido pre-planificado, automático

**Impacto Arquitectónico**:

#### Problema Actual
- Community Scheduler es 100% reactivo (espera eventos del Disparador)
- NO genera contenido proactivamente

#### Solución Propuesta
1. **Calendar Editor Event** (nueva componente)
   ```typescript
   type CalendarEditorialEvent = {
     id: string;
     dayOfWeek: 0-6;            // 0=Domingo, 1=Lunes, etc
     hour: 0-23;
     minute: 0-59;
     publicationType: "EDUCATION" | "MARKET_STATUS" | "ACTIVITY";
     theme: string;             // "Gestión de Riesgo", "Psicología", "Resumen Semanal"
     variantPool: string[];     // IDs de variantes a usar
     recurrence: "weekly" | "biweekly" | "monthly";
   }
   ```

2. **Community Scheduler - Modo Dual**:
   - **Modo Reactivo**: Responde a eventos del Disparador (como ahora)
   - **Modo Proactivo**: Cada hora, chequea si hay evento calendárico pendiente
     - Si sí, y channel no está en DORMANT, genera publicación
     - Utiliza template + variante del evento calendárico

3. **Generation Logic**:
   ```
   if (currentDay == Monday && currentHour >= 10 && !publishedToday[CALENDAR_RISK_MGMT]) {
     // Genera EDUCATION sobre gestión de riesgo
     content = generateEducationContent(theme="Gestión de Riesgo");
     publish(content, type="EDUCATION");
     markAsPublished(CALENDAR_RISK_MGMT);
   }
   ```

4. **Evitar Saturación**:
   - Solo 1 evento calendárico por día
   - Se publica si channel está ACTIVE o SLOW
   - No fuerza publicación si hay contenido reactivo ese día

5. **Panel Admin**:
   - Nueva sección: "Calendario Editorial"
   - CRUD: Agregar/editar/deshabilitar eventos calendáricos
   - Vista: Calendario visual mostrando qué se publica cuándo

#### Ficheros a Crear
- Tipos: `CalendarEditorialEvent`
- Servicio: `EditorialCalendarService` (cargar, chequear, persistir)
- Modificar: `Community Scheduler` para incluir chequeo calendárico

**Estado**: ✅ **APROBABLE** - Agranda scope del Scheduler, pero es limpio y modular.

---

### PUNTO 6: MÉTRICAS DE ENGAGEMENT

**Propuesta del Usuario**:
- Cuántas personas entraron después de cada publicación
- Cuántos clics tuvo
- Cuántos registros produjo
- Qué tipo de publicación convierte mejor

**Impacto Arquitectónico**:

#### Problema Actual
- Arquitectura NO contempla tracking de engagement
- Solo registra "qué se publicó", no "qué pasó después"

#### Solución Propuesta
1. **Telegram Webhook para Eventos**:
   ```typescript
   type TelegramEvent = {
     type: "member_joined" | "message_clicked" | "reaction_added" | "link_clicked";
     timestamp: Date;
     userId: string;
     messageId: string;
     source?: string;  // "link", "button", "reaction"
   }
   ```

2. **Correlación Publication ↔ Engagement**:
   ```typescript
   type PublicationMetrics = {
     publicationId: string;
     type: string;
     publishedAt: Date;
     messageId: string;          // Telegram message ID
     
     events: TelegramEvent[];
     stats: {
       viewCount: number;         // Estimated (Telegram API)
       clickCount: number;
       memberJoinedAfter: number; // Joined dentro de 1 hora
       registrationCount: number; // Usuarios que se registraron
     }
     conversionRate: number;     // registrationCount / viewCount
   }
   ```

3. **Cálculos**:
   - **View Count**: Telegram API proporciona `forwarded_from_chat` y `forward_count`
   - **Click Count**: Webhook cuando usuario clickea link
   - **Member Joined After**: Listener de nuevos miembros + correlación temporal
   - **Registration Count**: Query a API de registros por email/usuario

4. **Agregación**:
   - Por tipo de publicación (qué convierte mejor)
   - Por día/semana/mes
   - Por tema (si es EDUCATION)
   - Por variant (qué textos funcionan mejor)

5. **Panel Admin**:
   - Nueva sección: "Estadísticas y Engagement"
   - Tablas: Publicaciones + métricas, sorted por conversion
   - Gráficos: Tendencia de engagement por tipo
   - Export: CSV con datos completos

#### Ficheros a Crear
- Tipos: `TelegramEvent`, `PublicationMetrics`
- Servicio: `EngagementTrackingService`
- API: POST `/api/webhooks/telegram-events` (recibe eventos)
- Persistencia: `data/community-publisher/metrics/[date].json`

**Dependencias Externas**:
- Telegram Bot API (ya necesaria para enviar mensajes)
- Webhook expuesto públicamente (security: validar token Telegram)

**Estado**: ⚠️ **REQUIERE DECISIÓN**:
- ¿Usar Telegram API nativo (view counts) o tracking pixel interno?
- ¿Cuánto tiempo guardar histórico de eventos?
- ¿Qué privacidad tiene usuario respecto a tracking?

---

### PUNTO 7: SISTEMA DE CAMPAÑAS

**Propuesta del Usuario**:
- No promociones aisladas, sino campañas organizadas
- Ejemplo: "Nueva versión del Bot" durante una semana (anuncio → avance → resultado → recordatorio → cierre)
- Todo pre-planificado

**Impacto Arquitectónico**:

#### Problema Actual
- Arquitectura NO contempla agrupación de publicaciones
- Cada evento es independiente

#### Solución Propuesta
1. **Campaign Structure**:
   ```typescript
   type Campaign = {
     id: string;
     name: string;               // "Nueva versión del Bot"
     description: string;
     startDate: Date;
     endDate: Date;
     status: "draft" | "active" | "paused" | "completed" | "archived";
     
     phases: CampaignPhase[];
     metrics: CampaignMetrics;
   }
   
   type CampaignPhase = {
     id: string;
     sequenceNumber: 1-10;
     name: string;               // "Anuncio", "Avance", "Resultado", etc
     publicationType: string;
     content: string;
     scheduledDate?: Date;       // Si es fijo
     triggerCondition?: string;  // Si es condicional ("after_previous_published")
     priority: number;           // Override de prioridad global
   }
   ```

2. **Behavior**:
   - **Sequential**: Fases se ejecutan en orden (1 → 2 → 3 → ...)
   - **Gating**: No puede pasar a fase N+1 hasta completar fase N
   - **Timing**: Si es scheduledDate, espera esa fecha. Si es trigger, ejecuta cuando se cumpla.
   - **Flexibility**: Si una fase falla, admin puede saltarla manualmente

3. **Ejemplos Precargados**:
   ```
   Campaign: "Nueva versión del Bot"
   - Fase 1 (Lunes): "Anuncio" → ACTIVIDAD type
   - Fase 2 (Martes): "Avance Técnico" → EDUCACIÓN type
   - Fase 3 (Miércoles): "Resultado Inicial" → TRADE_RESULT type
   - Fase 4 (Viernes): "Recordatorio + Link" → PROMOCIÓN type (pero bajo trato de 15-20%)
   - Fase 5 (Domingo): "Cierre + Estadísticas" → MARKET_STATUS type
   ```

4. **Campaign Scheduler**:
   - Nueva subcomponente dentro de Community Scheduler
   - Chequea diariamente qué fase de qué campaña debe ejecutarse
   - Prioriza fases sobre eventos reactivos (porque son parte de estrategia)
   - Registra ejecución + fecha real de cada fase

5. **Panel Admin**:
   - Nueva sección: "Campañas"
   - CRUD: Crear, editar, duplicar campañas
   - Template de campañas predefinidas
   - Vista de progreso (qué fase en qué fecha)
   - Historial de campañas completadas

#### Ficheros a Crear
- Tipos: `Campaign`, `CampaignPhase`, `CampaignMetrics`
- Servicio: `CampaignService` (CRUD, scheduling, execution)
- Modificar: `Community Scheduler` para incluir chequeo de campañas
- Persistencia: `data/community-publisher/campaigns/[campaignId].json`

**Diferencia con Calendar Editorial**:
- **Calendar Editorial**: Contenido recurrente semanal (cada lunes → Gestión de Riesgo)
- **Campaign**: Contenido temporal, estratégico, multi-fase (nueva versión del bot: 1 semana)

**Estado**: ✅ **APROBABLE** - Modular, muy valioso para estrategia, no interfiere con core.

---

---

## RESUMEN DE CAMBIOS REQUERIDOS

| Punto | Impacto | Complejidad | Aprobación |
|-------|--------|------------|-----------|
| 1. Cola de Prioridades | Pequeño (nueva queue) | Baja | ✅ Aprobable |
| 2. Política de Silencio | Medio (nuevo modo) | Baja-Media | ✅ Aprobable |
| 3. Límite de Promoción | Pequeño (filtro) | Baja | ✅ Aprobable |
| 4. Biblioteca de Mensajes | Pequeño (externos) | Baja | ✅ Aprobable |
| 5. Calendario Editorial | Medio (proactivo) | Media | ✅ Aprobable |
| 6. Métricas de Engagement | Grande (webhooks) | Alta | ⚠️ Requiere decisión |
| 7. Sistema de Campañas | Grande (strategy) | Media-Alta | ✅ Aprobable |

---

## PRÓXIMOS PASOS

1. **Confirmación de Punto 6** (Métricas): 
   - ¿Tracking pixel interno o Telegram API nativo?
   - ¿Privacidad vs analytics?
   - ¿Guardar histórico infinito o rolling window?

2. **Crear documento de Actualización Arquitectónica**:
   - Integrar estos 7 puntos en COMMUNITY_PUBLISHER_ARCHITECTURE_V1.md
   - Agregar diagramas si es necesario
   - Actualizar tipos TypeScript
   - Actualizar componentes del Scheduler

3. **Crear documento de Contrato de Interfaz** (Fase 3: Auditoría):
   - Especificar exactamente inputs/outputs de cada componente nueva
   - Definir campos de persistencia
   - Especificar formatos JSON

4. **Congelamiento de Diseño**:
   - Una vez aprobados estos 7 puntos + Arquitectura actualizada, documentamos como ARQUITECTURA_APROBADA_V1.md
   - En ese momento, prohibido hacer cambios sin review

---

## PENDIENTE DE TI

✅ ¿Confirmas todos estos cambios?  
⚠️ Punto 6 (Métricas): ¿Cómo quieres hacerlo?  
❓ ¿Hay algo que agreguemos o modifiquemos?

Una vez confirmado, actualizo la arquitectura y creamos el documento de Contrato.
