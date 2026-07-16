# ⚡ QUICK START — Trust & Conversion Engine V1

## 1️⃣ Inicializar el Sistema

```bash
# Terminal (npm run dev debe estar ejecutándose)
curl -X POST http://localhost:3001/api/internal/trust-conversion/init
```

Respuesta esperada:
```json
{
  "ok": true,
  "message": "Trust & Conversion Engine inicializado",
  "config": {
    "enable_detection": true,
    "enable_suggestions": true,
    "enable_publication": true,
    "paused": false,
    "max_promotions_per_week": 2,
    "min_cooldown_hours": 48,
    "max_promotional_ratio": 0.2,
    "require_approval": true,
    "confidence_threshold": 50,
    "timezone": "America/Mazatlan"
  },
  "engine_status": {
    "is_initialized": true,
    "config": {...},
    "status": "READY",
    "thresholds": {...}
  },
  "timestamp": "2024-..."
}
```

✓ Si ves `"status": "READY"` → Sistema listo

---

## 2️⃣ Ejecutar Ciclo de Detección

```bash
curl -X POST http://localhost:3001/api/internal/trust-conversion/detect
```

Respuesta:
```json
{
  "ok": true,
  "message": "Ciclo de detección ejecutado",
  "timestamp": "2024-..."
}
```

✓ Sistema analizó publicaciones del Community Publisher
✓ Creó momentos detectados si hay condiciones (winning streak, notable result, etc)

---

## 3️⃣ Ver Sugerencias Pendientes

```bash
curl http://localhost:3001/api/internal/trust-conversion/suggestions?status=PENDING_APPROVAL
```

Respuesta:
```json
{
  "ok": true,
  "total": 1,
  "suggestions": [
    {
      "suggestion_id": "SUGG-1234567890-abcde",
      "moment_id": "MOM-...",
      "product": "PREMIUM_ALERTS",
      "status": "PENDING_APPROVAL",
      "message_body": "📈 Esta semana el análisis capturó 150 pips...",
      "message_preview": "📈 Racha positiva — Descubre Premium",
      "created_at": "2024-...",
      "clicks": 0,
      "registrations": 0,
      "payments": 0,
      "confidence": 85,
      "reasoning": "..."
    }
  ],
  "fetched_at": "2024-..."
}
```

✓ Si `total > 0` → Hay momentos comerciales detectados

---

## 4️⃣ Acceder al Panel Admin

Abre en navegador:
```
http://localhost:3001/admin/observer-v3
```

Scroll down → Busca sección:
```
🚀 TRUST & CONVERSION ENGINE
```

**Tabs disponibles**:
1. ⏳ PENDIENTES — Sugerencias esperando aprobación
2. 📊 MÉTRICAS — CTR, conversiones, top productos
3. 📈 HISTORIAL — Publicaciones anteriores

---

## 5️⃣ Aprobar una Sugerencia

**Opción A: API**
```bash
curl -X POST http://localhost:3001/api/internal/trust-conversion/suggestions/SUGG-xxx/approve
```

**Opción B: Panel UI**
- Ve a tab ⏳ PENDIENTES
- Haz click en botón: **Aprobar**
- Status cambia a APPROVED

Respuesta:
```json
{
  "ok": true,
  "suggestion": {
    "suggestion_id": "SUGG-...",
    "status": "APPROVED",
    "approved_at": "2024-..."
  }
}
```

---

## 6️⃣ Publicar Sugerencia Aprobada

**Opción A: API**
```bash
curl -X POST http://localhost:3001/api/internal/trust-conversion/suggestions/SUGG-xxx/publish
```

**Opción B: Panel UI**
- Ve a tab ⏳ PENDIENTES
- Section: "APROBADAS - LISTAS PARA PUBLICAR"
- Haz click en botón: **Publicar**

Respuesta:
```json
{
  "ok": true,
  "publication_id": "PUB-..."
}
```

✓ Sugerencia creó una publicación EDUCATIONAL_OR_PROMOTIONAL
✓ Se agregó a la cola del Community Publisher
✓ Respeta TEST_ONLY=true (va a canal de test en Telegram)

---

## 7️⃣ Ver Métricas

**API**:
```bash
curl http://localhost:3001/api/internal/trust-conversion/metrics
```

**Panel UI**:
- Tab 📊 MÉTRICAS
- Muestra: CTR, tasa de registros, tasa de conversión
- Top productos
- Momentos más efectivos

Respuesta:
```json
{
  "ok": true,
  "metrics": {
    "total_moments_detected": 1,
    "moments_approved": 1,
    "moments_published": 0,
    "total_clicks": 0,
    "total_registrations": 0,
    "total_conversions": 0,
    "total_revenue": 0,
    "ctr": 0,
    "registration_rate": 0,
    "conversion_rate": 0,
    "revenue_per_publication": 0,
    "by_product": {...},
    "by_moment_type": {...},
    "by_day_of_week": {...}
  },
  "report": {
    "summary": "📊 REPORTE DE CONVERSIÓN\n...",
    "top_converting_products": [],
    "top_converting_moments": []
  },
  "fetched_at": "2024-..."
}
```

---

## 🧪 Testing Scenarios

### Escenario 1: Winning Streak (3+ ganancias)
1. Publica 3 resultados ganadores via Community Publisher
2. POST `/api/internal/trust-conversion/detect`
3. ✓ Debe crear momento WINNING_STREAK

### Escenario 2: Notable Result (50+ pips)
1. Publica resultado con 75 pips via Community Publisher
2. POST `/api/internal/trust-conversion/detect`
3. ✓ Debe crear momento NOTABLE_RESULT

### Escenario 3: High Activity (5+ alertas/hora)
1. Publica 5 FREE_ALERT en últimos 60 minutos
2. POST `/api/internal/trust-conversion/detect`
3. ✓ Debe crear momento HIGH_MARKET_ACTIVITY

### Escenario 4: Approval Workflow
1. Detectar momento
2. Generar sugerencia (status: PENDING_APPROVAL)
3. ✅ API: POST .../approve
4. ✅ API: POST .../publish
5. ✓ Debe agregar a Community Publisher queue

### Escenario 5: Limits Enforcement
1. Publicar 2 sugerencias en semana
2. Intentar publicar 3ª
3. ✓ Debe rechazar con reason: "Límite semanal (2/2)"

---

## 🛠️ Troubleshooting

### ❌ "Unauthorized" en endpoints
**Causa**: Request no es same-origin
**Solución**: Usar curl/fetch desde mismo origen (localhost:3001)

### ❌ "Error initializing" 
**Causa**: Permisos de archivo en data/
**Solución**: 
```bash
mkdir -p c:\Users\user1\carvipix\data\trust-conversion
chmod 755 data/trust-conversion
```

### ❌ No hay sugerencias después de detect
**Causa**: No hay publicaciones en Community Publisher
**Solución**: 
1. Publica algunas alertas en Community Publisher primero
2. Luego corre detección

### ❌ Sugerencias no aparecen en panel
**Causa**: Panel no se está refrescando
**Solución**: Presiona botón "🔄" en panel o espera 10s

---

## 📊 Checklist de Validación

- [ ] `/api/internal/trust-conversion/init` retorna status=READY
- [ ] `/api/internal/trust-conversion/detect` ejecuta sin errores
- [ ] Sugerencias aparecen en `/api/internal/trust-conversion/suggestions`
- [ ] Panel UI está visible en observer-v3
- [ ] Botón "Aprobar" cambia status a APPROVED
- [ ] Botón "Publicar" crea publication_id
- [ ] Publicación aparece en Community Publisher queue
- [ ] Message templates son legibles (sin variables sin reemplazar)
- [ ] Télémetros son consistentes en UI y API
- [ ] TEST_ONLY=true respetado (canal test)

---

## 🚀 Production Considerations

Before going live:

1. **Scheduler Setup**
   - Configurar cron para POST `/api/internal/trust-conversion/detect` cada 5 min
   - O usar: easycron.com + X-Cron-Secret header

2. **Monitoring**
   - Logs de cada ciclo de detección
   - Alertas si limits exceeded
   - Email notifications para admin

3. **Data Cleanup**
   - events.json mantiene últimas 1000
   - Purgar sugerencias REJECTED >30 días
   - Archive histórico de metrics

4. **Testing Production**
   - Mantener TEST_ONLY=true en staging
   - Cambiar a TEST_ONLY=false solo con autorización expresa
   - Monitorear revenue attribution

5. **A/B Testing**
   - Diferentes versiones de message templates
   - Tracking de CTR por template_variant
   - Optimize highest converters

---

## 💡 Tips

1. **Ver JSON completo de sugerencia**:
   - Panel UI → Click "Ver" en sugerencia
   - Modal con JSON formateado

2. **Reset completo** (testing):
   ```bash
   # En código: await resetTrustConversionEngine()
   # O eliminar: data/trust-conversion/suggestions.json
   ```

3. **Bypass aprobación** (NO recomendado):
   - Modificar require_approval=false en config
   - ⚠️ Violará principio ético, no hacer

4. **Tracking manual**:
   ```bash
   curl -X POST http://localhost:3001/api/internal/trust-conversion/events \
     -H "Content-Type: application/json" \
     -d '{"suggestion_id":"SUGG-xxx","event_type":"LINK_CLICKED"}'
   ```

---

**Status**: ✅ Sistema producción-ready con TEST_ONLY=true

Próximo: Implementar scheduler para automation (opcional Phase 4b)
