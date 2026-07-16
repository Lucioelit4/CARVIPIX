# 🌑 SHADOW PRODUCTION V1 — MANUAL OPERATIVO

## Estado Oficial

```
SHADOW_PRODUCTION = true
TEST_ONLY = true
AUTO_SEND_OFFICIAL = false
BOT_MT4_MT5 = disabled
LIVE_TRADING = false
```

**Duración**: 7 días
**Objetivo**: Observación integral sin modificaciones de código
**Filosofía**: Registrar todo, analizar después, actuar con datos

---

## 📡 Arquitectura en Funcionamiento

```
Twelve Data
      ↓
Expediente Maestro V3 (ChatGPT)
      ↓
Disparador
      ↓
Community Publisher
      ├→ Telegram TEST ✓
      └→ Telegram OFICIAL ✗ (bloqueado)
      ↓
Trust & Conversion Engine
      ├→ Momento detectado
      ├→ Sugerencia generada
      └→ PENDING_APPROVAL (manual)
      ↓
Paper Trading Account ($10,000)
      ↓
Observer Dashboard
      ↓
Logs Certificación
      ↓
Análisis Diario
```

Todos los módulos funcionan **continuamente** sin parar.

---

## 🚀 INICIAR SHADOW PRODUCTION

### Paso 1: Verificar Estado Pre-Operativo

```bash
# Terminal 1 — Dev server
npm run dev

# Terminal 2 — Health check (esperar a que esté listo)
curl http://localhost:3001/api/internal/shadow-production/health
```

Respuesta esperada:
```json
{
  "status": "ALL_READY" o "DEGRADED",
  "ready_count": 9,
  "total_count": 9,
  "modules": [
    { "name": "TWELVE_DATA", "status": "READY", "is_ready": true },
    { "name": "COMMUNITY_PUBLISHER", "status": "READY", "is_ready": true },
    { "name": "TRUST_CONVERSION", "status": "READY", "is_ready": true },
    { "name": "OBSERVER", "status": "READY", "is_ready": true }
  ]
}
```

✓ Si ves "ALL_READY" → Continuar
⚠️ Si ves "DEGRADED" → Revisar módulo específico

### Paso 2: Inicializar Shadow Production

```bash
curl -X POST http://localhost:3001/api/internal/shadow-production/init
```

Respuesta:
```json
{
  "ok": true,
  "message": "Shadow Production inicializado",
  "config": {
    "mode": "SHADOW_PRODUCTION",
    "start_date": "2026-07-15T...",
    "duration_days": 7,
    "test_only": true,
    "auto_send_official": false,
    "paper_trading_enabled": true,
    "paper_trading_balance": 10000
  },
  "module_status": {...}
}
```

✓ Sistema está activo

### Paso 3: Verificar Conexión Telegram

- Grupo de prueba debe recibir mensajes
- Canal oficial debe estar completamente bloqueado
- Variable TEST_ONLY=true confirmada en .env.local

---

## 📋 OPERACIONES DIARIAS

### Cada mañana:

```bash
# Generar reporte del día anterior
curl http://localhost:3001/api/internal/shadow-production/daily-report?date=2026-07-15
```

Ejemplo de salida:
```
╔═══════════════════════════════════════════════════════════════╗
║         REPORTE DIARIO SHADOW PRODUCTION — 2026-07-15         ║
╚═══════════════════════════════════════════════════════════════╝

📊 MERCADO
  • Análisis realizados: 247
  • Alertas gratuitas: 15
  • Operaciones paper: 8
  • Ganancias: 6
  • Pérdidas: 2
  • P&L USD: $245.67
  • Win rate: 75%

📱 TELEGRAM
  • Publicaciones enviadas: 12
  • Resultados: 3
  • Educación: 2

💰 CONVERSIÓN
  • Sugerencias generadas: 2
  • Clics totales: 5
  • Registros: 1

⚙️ SISTEMA
  • Errores: 0
  • Advertencias: 2
  • Costo OpenAI: $5.42
  • Uptime: 99.8%
```

Guardar en: `data/daily-reports/2026-07-15.txt`

### Cada vez que ocurra una anomalía:

```bash
# Reportar anomalía inmediatamente
curl -X POST http://localhost:3001/api/internal/shadow-production/events?action=report-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "module": "COMMUNITY_PUBLISHER",
    "severity": "MAJOR",
    "description": "Publicación a canal oficial cuando TEST_ONLY=true",
    "evidence": {"event_id": "...", "channel": "official"},
    "analysis_id": "ANA-xxx",
    "signal_id": "SIG-xxx"
  }'
```

✓ Anomalía registrada automáticamente en historial
✓ Se crea ticket para revisión post-shadow

### Si un módulo falla:

```bash
# 1. Verificar estado actual
curl http://localhost:3001/api/internal/shadow-production/health?module=COMMUNITY_PUBLISHER

# 2. Registrar error
curl -X POST http://localhost:3001/api/internal/shadow-production/events?action=log-event \
  -H "Content-Type: application/json" \
  -d '{
    "module": "COMMUNITY_PUBLISHER",
    "severity": "ERROR",
    "event_type": "MODULE_FAILURE",
    "description": "Connection timeout",
    "analysis_id": "ANA-xxx"
  }'

# 3. ESPERARA AUTORIZACIÓN ANTES DE REINICIAR
# Notificar a: director@carvipix.com
```

---

## 🔍 MONITOREO ACTIVO

### Dashboard en tiempo real:

Abre en navegador: `http://localhost:3001/admin/observer-v3`

Secciones:
1. **Observador Maestro V3** — Análisis reales, conversación ChatGPT
2. **Community Publisher** — Estadísticas de publicaciones
3. **Trust & Conversion Engine** — Sugerencias pendientes de aprobación
4. **Papier Account** — Operaciones y P&L

**Frecuencia de actualización**: 3 segundos (auto-polling)

### Endpoints para monitoreo:

```bash
# Estado actual del sistema
curl http://localhost:3001/api/internal/shadow-production/init

# Anomalías últimos 7 días
curl http://localhost:3001/api/internal/shadow-production/events?action=anomalies

# Eventos últimas 24 horas
curl http://localhost:3001/api/internal/shadow-production/events?action=events&hours=24

# Health check de módulos
curl http://localhost:3001/api/internal/shadow-production/health
```

---

## ⚠️ REGLAS ESTRICTAS

**PROHIBIDO durante estos 7 días:**

❌ Modificar Expediente Maestro V3
❌ Cambiar prompts de ChatGPT
❌ Alterar scheduler de análisis
❌ Cambiar Disparador
❌ Modificar Community Publisher
❌ Alterar Trust & Conversion Engine
❌ Tocar cuentas reales MT4/MT5
❌ AUTO_SEND_OFFICIAL = true
❌ TEST_ONLY = false
❌ Desarrollo de nuevas funciones

**PERMITIDO:**

✓ Observar
✓ Registrar errores
✓ Documentar anomalías
✓ Recolectar métricas
✓ Revisar logs
✓ Aprobar/rechazar sugerencias del Trust Engine (si está manual)
✓ Leer dashboard
✓ Generar reportes diarios

---

## 📊 WHAT TO EXPECT

### Día 1-2: Setup & Validation
- Verificar que todos los módulos arranquen correctamente
- Confirmar conectividad Telegram (solo test)
- Validar flujo de análisis end-to-end

### Día 3-4: Normal Operations
- 150-250 análisis diarios esperados
- 8-15 publicaciones Telegram diarias
- 1-3 sugerencias del Trust Engine diarias
- Paper account debería ser positivo o neutral

### Día 5-7: Pattern Recognition
- Identificar anomalías recurrentes
- Evaluar performance de templates
- Analizar conversion funnels
- Validar datos para estadísticas finales

---

## 📈 MÉTRICAS CLAVE A MONITOREAR

### Market
- Total análisis completados
- % de análisis descartados (debe ser bajo)
- Paper trading win rate (target: >50%)
- Paper P&L (target: >0)
- Max drawdown (monitor stability)

### Telegram
- Publicaciones enviadas (target: 8-15/día)
- Tasa error envío (target: 0%)
- Todos en TEST_ONLY (target: 100%)

### Trust & Conversion
- Sugerencias generadas (target: 1-3/día)
- % de PENDING_APPROVAL (target: 100% — nunca auto-publish)
- Quality of suggestions (manual review)

### System
- Errores por día (target: 0-5)
- Uptime (target: >99%)
- OpenAI cost (monitor budget)
- Response latency (target: <5s)

---

## 🚨 CRITICAL INCIDENTS

### Si sucede algo CRÍTICO:

**Ejemplo**: Publicación enviada a canal OFICIAL (violando TEST_ONLY)

Acción inmediata:
1. **REGISTRAR** — Reportar anomalía con evidencia
2. **DOCUMENTAR** — Descripción exacta, timestamp, análisis_id
3. **ESPERAR** — No hacer nada más hasta autorización
4. **NOTIFICAR** — Email a director@carvipix.com

**NO PERMITIDO**: Modificar código sin autorización

Excepción: Si el módulo está completamente caído y bloquea toda la prueba, OK reiniciar PERO registrar evento primero.

---

## 📝 BITÁCORA DIARIA

Mantén un archivo por cada día:

```
data/shadow-production-logs/
├── 2026-07-15.md (Día 1)
├── 2026-07-16.md (Día 2)
├── 2026-07-17.md (Día 3)
├── 2026-07-18.md (Día 4)
├── 2026-07-19.md (Día 5)
├── 2026-07-20.md (Día 6)
└── 2026-07-21.md (Día 7)
```

Contenido recomendado:

```markdown
# Shadow Production — Día 1 (2026-07-15)

## Status General
- Inicio: 08:30 UTC-7
- Estado: ✓ RUNNING
- Módulos: 9/9 READY

## Incidentes
- 09:45 — WARNING en COMMUNITY_PUBLISHER (timeout Telegram)
  Duración: 2 minutos
  Resolución automática: sí

## Métricas
- Análisis: 247
- Publicaciones: 12
- Sugerencias: 2
- P&L Paper: +$245.67

## Notas Importantes
- Trust Engine funcionando perfectamente
- Todos los mensajes en TEST_ONLY ✓
- Win rate 75% (excelente)

## Siguiente
- Monitorear COMMUNITY_PUBLISHER por posibles timeouts
- Revisar templates de messages
```

---

## 🎯 FINAL REPORT (Día 7 — 23:59)

```bash
# Generar reporte final
curl http://localhost:3001/api/internal/shadow-production/final-report
```

Reporte incluye:
- ✅ Resumen ejecución (247 análisis, $245.67 profit, 99.8% uptime)
- ✅ Rendimiento paper account
- ✅ Publicaciones y engagement
- ✅ Métricas de conversión
- ✅ Anomalías y issues
- ✅ Status de cada módulo
- ✅ Recomendaciones específicas
- ✅ ¿Ready for Production? (SÍ / NO)

Distribuir a:
- director@carvipix.com
- Equipo técnico
- Mantener en `data/shadow-production/FINAL_REPORT_2026-07-15_to_2026-07-21.json`

---

## ✅ SUCCESS CRITERIA

Al terminar los 7 días, el sistema estará listo para **Producción Controlada** si:

✅ Cero incidentes críticos no resueltos
✅ Paper account con P&L positivo O neutral (no pérdidas)
✅ 99%+ uptime
✅ TEST_ONLY respetado 100% del tiempo
✅ Auto_SEND_OFFICIAL = false 100% del tiempo
✅ Todas las anomalías documentadas
✅ Módulos funcionan de forma estable
✅ Recomendaciones de mejora identificadas

---

## 🔐 Post-Shadow Actions

Después de los 7 días:

1. **Análisis de resultados** (1 día)
2. **Correcciones menores** (2-3 días)
3. **QA final** (1 día)
4. **Paso a Producción Controlada** (Beta cerrada, 100 usuarios)

No hay rollback a desarrollo durante esta fase.

---

## 📞 Support

Dudas o problemas:
- Revisar este manual
- Consultar `/memories/repo/` para arquitectura
- Revisar dashboard en observer-v3
- Loguear evento para análisis posterior

---

**Estado**: 🟢 LISTO PARA INICIAR
**Fecha**: 2026-07-15
**Duración**: 7 días
**Objetivo**: Demostrar que CARVIPIX funciona como un ecosistema profesional, disciplinado y estable
