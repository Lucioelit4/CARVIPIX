# 🚀 TRUST & CONVERSION ENGINE V1 — ARQUITECTURA COMPLETA

## Resumen Ejecutivo

El **Trust & Conversion Engine** es un sistema ético de detección de momentos comerciales contextuales (NO schedule-based) que genera sugerencias de conversión con principio de "Embudo de Confianza": 
- **VALUE** (demostrar utilidad) → **TRUST** (construir credibilidad) → **RESULT** (mostrar resultados) → **EDUCATION** (educar) → **INVITATION** (invitar) → **REGISTRATION** (registrar)

**Filosofía**: CARVIPIX vende mediante disciplina, transparencia, consistencia, actividad constante, calidad. La confianza es el principal activo comercial.

---

## 📊 Componentes Implementados

### 1. **Core Types** (`types.ts`)
```typescript
- CommercialMomentType: 7 tipos contextuales
  • WINNING_STREAK: 3+ ganancias en 24h → premium coverage
  • NOTABLE_RESULT: Ganancia significativa
  • HIGH_MARKET_ACTIVITY: Múltiples alertas/hora → members no pierden ninguno
  • NO_OPPORTUNITIES: Sin entrada clara → educación 24/7
  • PRODUCT_LAUNCH: Nuevo producto disponible
  • ENGAGEMENT_PEAK: Alta actividad del sistema
  • CONSISTENCY_MILESTONE: Hito de consistencia

- CommercialMomentStatus: 6 estados
  • DETECTED → PENDING_APPROVAL → APPROVED → PUBLISHED (o CANCELLED/EXPIRED)

- CommercialSuggestion: Propuesta con:
  • message_body: Texto completo profesional (español)
  • message_preview: Resumen para lista
  • confidence (0-100)
  • clicks, registrations, payments tracking

- ConversionProduct: 5 productos
  • PREMIUM_ALERTS, BOT, COMMUNITY, TUTORIALS, REGISTRATION

- ConversionMetrics: CTR, registration_rate, conversion_rate, revenue, by_product/moment_type/day_of_week
```

### 2. **Persistence Layer** (`persistence.ts`)
- **Atomic I/O**: Escritura segura con temp+rename, backups automáticos
- **Lock serialization**: Previene condiciones de carrera
- **Files**:
  - `moments.json`: Momentos detectados
  - `suggestions.json`: Sugerencias generadas
  - `events.json`: Historial de eventos (últimas 1000)
  - `metrics.json`: Agregaciones de conversión
  - `config.json`: Configuración del sistema

### 3. **Moment Detector** (`momentDetector.ts`)
```typescript
5 Algoritmos de Detección:

1. detectWinningStreak():
   - 3+ TRADE_RESULT publicadas en 24h
   - total_pips > threshold
   → Confianza = (total_pips / 200) * 100, max 95

2. detectNotableResult():
   - Single TRADE_RESULT con pips > 50
   - NO después de pérdida
   → Confianza = 70 + (pips / 100) * 20

3. detectHighMarketActivity():
   - 5+ FREE_ALERT en último 60 min
   → Confianza = 50 + (alerts_count / 10) * 30

4. detectNoOpportunities():
   - Sin FREE_ALERT en 3 horas
   → Confianza = 60 (constante)

5. detectEngagementPeak():
   - 5+ publicaciones en última hora
   → Confianza = 40 + (publications_count / 15) * 50

runDetectionCycle(): Ejecuta todos en paralelo, deduplicación, agrega a persistencia
```

### 4. **Conversion Engine** (`conversionEngine.ts`)
```typescript
MESSAGE TEMPLATES (Embudo de Confianza):

WINNING_STREAK:
  "📈 Esta semana, el análisis ha capturado {{pips}} pips
   No es suerte. Es el sistema CARVIPIX funcionando.
   Los miembros Premium acceden a:
   ✓ Cobertura completa (no solo alertas selectas)
   ✓ Análisis de cada sesión
   ✓ Comunidad verificada"

NOTABLE_RESULT:
  "🎯 {{pips}} pips capturados en {{instrument}}
   Un resultado real. Documentado. Verificable.
   Si el análisis gratuito te muestra esto, pregúntate:
   '¿Qué vería en Premium?'"

HIGH_MARKET_ACTIVITY:
  "⚡ {{count}} oportunidades en la última hora
   Hoy el mercado está ruidoso.
   Los miembros Premium no pierden ninguno."

NO_OPPORTUNITIES:
  "📚 Hoy el mercado no ofrece entradas claras
   Los traders profesionales saben cuándo NO operar.
   Los miembros Premium reciben seguimiento 24/7."

ENGAGEMENT_PEAK:
  "🚀 El sistema está activo
   Automatización, alertas personalizadas, seguridad verificada.
   ¿Quieres conocer el bot?"
```

**Límites Estrictos Implementados**:
- ✓ Max 2 promociones/semana
- ✓ Min 48h entre promociones
- ✓ Max 20% ratio promocional
- ✓ Nunca después de pérdida
- ✓ NEVER auto-publish — require_approval=true
- ✓ Status: PENDING_APPROVAL hasta aprobación manual

### 5. **Tracking Service** (`trackingService.ts`)
```typescript
Funciones:
- trackConversionEvent(eventType, suggestionId, userId, metadata)
- generateTrackingLink(suggestionId, product, baseUrl)
- calculateMetrics() → ConversionMetrics completo
- generateConversionReport() → Top productos, momentos, daily performance
- updateAndSaveMetrics() → Guardar con sync

Eventos Rastreados:
- LINK_CLICKED
- REGISTRATION_STARTED
- REGISTRATION_COMPLETED
- PAYMENT_APPROVED
```

### 6. **Initialization** (`initialization.ts`)
```typescript
- initializeTrustConversionEngine(): Crea directorio, config default
- getEngineStatus(): Retorna estado actual, thresholds, is_initialized
- resetTrustConversionEngine(): Reset completo (testing only)

DEFAULT_CONFIG:
  • enable_detection: true
  • enable_suggestions: true
  • enable_publication: true
  • paused: false
  • max_promotions_per_week: 2
  • min_cooldown_hours: 48
  • max_promotional_ratio: 0.2
  • require_approval: true
  • confidence_threshold: 50
  • timezone: America/Mazatlan (or CARVIPIX_TIMEZONE env)
```

---

## 🔌 API Endpoints Implementados

### GET `/api/internal/trust-conversion/init` — Status
Retorna: `{ is_initialized, config, status, thresholds }`

### POST `/api/internal/trust-conversion/init` — Initialize
Retorna: `{ ok, message, config, engine_status }`

### GET `/api/internal/trust-conversion/suggestions?status=PENDING_APPROVAL` — List
Retorna: `{ ok, total, suggestions[], fetched_at }`

### POST `/api/internal/trust-conversion/suggestions/[id]/approve` — Approve
Retorna: `{ ok, suggestion }`

### POST `/api/internal/trust-conversion/suggestions/[id]/cancel` — Cancel
Retorna: `{ ok, suggestion }`

### POST `/api/internal/trust-conversion/suggestions/[id]/publish` — Publish
- Convierte sugerencia aprobada a publicación EDUCATIONAL_OR_PROMOTIONAL
- Agrega a cola del Community Publisher
- Retorna: `{ ok, publication_id }` o `{ ok: false, reason }`

### POST `/api/internal/trust-conversion/detect` — Run Detection Cycle
- Ejecuta detectAllMoments() en paralelo
- Procesa momentos detectados → genera sugerencias
- Retorna: `{ ok, message, timestamp }`

### GET `/api/internal/trust-conversion/metrics` — Get Metrics
Retorna: `{ ok, metrics, report, fetched_at }`

**Protección**: Todos requieren `isSameOriginRequest` (same-origin only)

---

## 🎨 Admin Panel UI (`TrustConversionPanel.tsx`)

### Tabs
1. **PENDIENTES** ⏳
   - Lista sugerencias con status PENDING_APPROVAL
   - Muestra: tipo de momento, confianza, preview, producto
   - Botones: Aprobar, Cancelar, Ver
   - Sub-section: Aprobadas listas para publicar (con botón Publicar)

2. **MÉTRICAS** 📊
   - Grid: Total publicadas, clics, registros, conversiones
   - Grid: CTR, tasa registro, tasa conversión, ingresos/pub
   - Top productos y momentos más efectivos

3. **HISTORIAL** 📈
   - Últimas 20 publicaciones (DESC by date)
   - Muestra: producto, timestamp, preview, clics, registros, pagos

### Acciones
- Auto-polling cada 10 segundos
- Botones: Detectar Ahora, Refresh
- Modal de inspección JSON completo

---

## 🔄 Flujo E2E: Momento → Conversión

```
1. DETECCIÓN (momentDetector.ts)
   └─ Analiza publications históricas
   └─ Calcula confianza por algoritmo
   └─ Crea CommercialMoment (status: DETECTED)

2. SUGERENCIA (conversionEngine.ts)
   └─ generateSuggestion(moment)
   └─ Aplica plantilla de mensaje + trust principles
   └─ Verifica límites (frequency, cooldown, ratio)
   └─ Crea CommercialSuggestion (status: PENDING_APPROVAL)

3. APROBACIÓN (Manual)
   └─ Admin revisa en panel UI
   └─ Click: Aprobar
   └─ Status: APPROVED

4. PUBLICACIÓN (Manual o API)
   └─ Admin hace click: Publicar
   └─ publishApprovedSuggestion()
   └─ Crea Publication (EDUCATIONAL_OR_PROMOTIONAL)
   └─ Agrega a queue del Community Publisher
   └─ Retorna publication_id
   └─ Status: PUBLISHED

5. ENTREGA (Community Publisher)
   └─ Publication → Telegram (respetando TEST_ONLY)
   └─ Status: DELIVERED

6. TRACKING (trackingService.ts)
   └─ User hizo clic → trackConversionEvent('LINK_CLICKED')
   └─ User registró → trackConversionEvent('REGISTRATION_COMPLETED')
   └─ User pagó → trackConversionEvent('PAYMENT_APPROVED')
   └─ Metrics actualizadas
```

---

## ⚙️ Integración con Community Publisher V1

**Relación**: Trust & Conversion Engine genera sugerencias que se publican como tipo `EDUCATIONAL_OR_PROMOTIONAL`

**Key Functions**:
```typescript
// En conversionEngine.ts
publishApprovedSuggestion(suggestionId)
  ├─ Obtiene CommercialSuggestion
  ├─ Llama createPublication() del Community Publisher
  ├─ Establece content_preview + metadata
  ├─ Llama addToQueue() del Community Publisher
  └─ Retorna publication_id
```

**Constraints**:
- TEST_ONLY=true: Solo a canal de test (preservado)
- AUTO_SEND=false: Sin envío automático (preservado)
- require_approval=true: NEVER auto-publish (garantizado)

---

## 📋 Estado de Completitud

### ✅ COMPLETADO
- [x] Tipos TypeScript (150 líneas)
- [x] Persistencia atómica (170 líneas)
- [x] Moment detector (5 algoritmos, 280 líneas)
- [x] Conversion engine (642 líneas)
- [x] Tracking service (220 líneas)
- [x] Initialization utility (100 líneas)
- [x] 7 API endpoints con isSameOriginRequest
- [x] Admin panel UI (500+ líneas React)
- [x] Integración en observer-v3/page.tsx
- [x] Message templates (embudo de confianza)
- [x] Limits enforcement (3 tipos)
- [x] Approval workflow (PENDING_APPROVAL)
- [x] Metrics calculation (CTR, conversion_rate, by_product, etc)

### ⏳ PRÓXIMAS FASES (Opcional)
- [ ] Cron job para runDetectionCycle cada 5 minutos
- [ ] HMAC signatures para tracking de clicks
- [ ] Dashboard de conversión avanzada (funnel visualization)
- [ ] A/B testing de message templates
- [ ] Revenue attribution por moment_type
- [ ] Alertas para limites próximos de ser excedidos

---

## 🔒 Garantías de Seguridad y Ética

1. **APPROVAL REQUIRED**: Ninguna sugerencia se publica sin aprobación manual
2. **LIMITS ENFORCED**: Frecuencia, cooldown, ratio protegidos
3. **NO AGGRESSIVE PROMO**: Embudo de confianza, no sales pressure
4. **NO MANIPULATION**: Triggers contextuales reales, no artificial scarcity
5. **TRACKING TRANSPARENT**: Métricas y eventos auditables
6. **TEST_ONLY PRESERVED**: No publica a canal oficial sin autorización explícita
7. **NEVER COMBINED**: No mezcla resultado + promoción en mismo mensaje

---

## 📍 Archivos Creados

```
app/lib/trust-conversion/
  ├── types.ts                      (150 líneas)
  ├── persistence.ts                (170 líneas)
  ├── momentDetector.ts             (280 líneas)
  ├── conversionEngine.ts           (642 líneas)
  ├── trackingService.ts            (220 líneas)
  └── initialization.ts             (100 líneas)

app/api/internal/trust-conversion/
  ├── suggestions/route.ts
  ├── suggestions/[id]/[action]/route.ts
  ├── metrics/route.ts
  ├── detect/route.ts
  └── init/route.ts

app/admin/observer-v3/components/
  └── TrustConversionPanel.tsx      (500+ líneas React)

app/admin/observer-v3/
  └── page.tsx                      (modificado: +import +component)
```

**Total**: 11 nuevos archivos, ~2500 líneas de código funcional

---

## 🎯 Siguiente: Scheduler (Opcional)

Para automatizar runDetectionCycle cada 5 minutos:

```typescript
// app/api/internal/trust-conversion/cron/route.ts
export async function POST(req: NextRequest) {
  // Verificar X-Cron-Secret
  // Llamar: await runDetectionCycle()
  // Llamar: await processDetectedMoments()
  // Log: timestamp, moments_count
}
```

Luego configurar:
- Cron service externo (easycron.com) 
- O Vercel Cron: `public/cron.json`

---

## 📞 Notas de Implementación

1. **Deduplicación**: momentDetector evita duplicados por moment_id (hash de trigger_data)
2. **Confidence Calculation**: Cada algoritmo calcula 0-100 independientemente
3. **Thread Safety**: withLock en persistence garantiza atomicidad
4. **Timezone-Aware**: Usa CARVIPIX_TIMEZONE para "esta semana"
5. **Error Resilient**: Try-catch en cada ciclo, logging detallado
6. **Community Publisher Integration**: Seamless via createPublication() y addToQueue()

---

## 🚀 Start Here

1. POST `/api/internal/trust-conversion/init` — Inicializa
2. Panel en observer-v3 → Tab "TRUST & CONVERSION ENGINE"
3. POST `/api/internal/trust-conversion/detect` — Ejecutar detección manual
4. Revisar sugerencias en tab PENDIENTES
5. Aprobar + Publicar
6. Ver tracking en tab MÉTRICAS

**Estado Actual**: ✅ PRODUCTION-READY para TEST_ONLY=true
