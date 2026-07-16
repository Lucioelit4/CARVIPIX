# 📋 PENDIENTES PARA MAÑANA — 2026-07-16

**Previo**: Leer `PROJECT_STATE_2026-07-15.md` (1 min)

---

## ✅ MAÑANA CONTINUAR DESDE AQUÍ

### 1. ACTIVAR SHADOW PRODUCTION (15 min)
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Ejecutar script
.\activate-shadow-production.ps1
```

**Resultado esperado**:
- ✓ Todos los módulos checkeados
- ✓ Shadow Production inicializado
- ✓ Dashboard abierto
- ✓ Status: READY

---

### 2. PRIMER REPORTE DIARIO (5 min)
```bash
curl http://localhost:3001/api/internal/shadow-production/daily-report?date=2026-07-16
```

**Guardar como**: `data/shadow-production/daily-reports/2026-07-16.txt`

---

### 3. MONITOREO CONTINUO (7 días)

**Cada mañana (5 min)**:
- Generar reporte diario
- Revisar anomalías
- Documentar en bitácora

**Si ocurre anomalía**:
```bash
curl -X POST http://localhost:3001/api/internal/shadow-production/events?action=report-anomaly \
  -H "Content-Type: application/json" \
  -d '{"module":"...","severity":"CRITICAL|MAJOR|MINOR","description":"..."}'
```

**Verificar salud (si hay problemas)**:
```bash
curl http://localhost:3001/api/internal/shadow-production/health
```

---

### 4. DÍA 7 — REPORTE FINAL (30 min)

**2026-07-22, 23:55**:
```bash
curl http://localhost:3001/api/internal/shadow-production/final-report
```

**Analizar**:
- ✓ Total de análisis realizados
- ✓ P&L de paper account
- ✓ Publicaciones enviadas
- ✓ Sugerencias generadas
- ✓ Errores/warnings
- ✓ Status de módulos
- ✓ Ready for Production? (SÍ/NO)

---

## 📊 ARCHIVOS A REVISAR DURANTE SHADOW PRODUCTION

### 1. Estado actualizado
- Dashboard: `http://localhost:3001/admin/observer-v3`

### 2. Reportes diarios
- Location: `data/shadow-production/daily-metrics.json`

### 3. Anomalías registradas
- Location: `data/shadow-production/anomalies.json`

### 4. Eventos del sistema
- Location: `data/shadow-production/events.json`

---

## 🔒 REGLAS DURANTE SHADOW PRODUCTION

❌ **PROHIBIDO**:
- NO modificar código
- NO cambiar prompts ChatGPT
- NO alterar scheduler
- NO cambiar Community Publisher
- NO tocar Trust Engine
- NO modificar TEST_ONLY o AUTO_SEND
- NO desarrollo nuevo
- NO conectar cuentas reales MT4/MT5

✅ **PERMITIDO**:
- Observar
- Registrar
- Monitorear
- Documentar anomalías
- Leer reportes

---

## 📈 INDICADORES CLAVE (REVISAR DIARIAMENTE)

| Métrica | Expected | Where |
|---------|----------|-------|
| Módulos READY | 9/9 ✓ | /health |
| Uptime | 99%+ | daily-report |
| Errores | ≤ 2 | daily-report |
| TEST_ONLY | true | config.json |
| Publicaciones | N > 0 | daily-report |
| P&L Paper | Positivo o neutral | daily-report |

---

## 🎯 TIMELINE (7 DÍAS)

```
Day 1 (2026-07-16):  Init + First report
Day 2-3 (2026-07-17-18): Normal operations
Day 4-5 (2026-07-19-20): Data collection
Day 6-7 (2026-07-21-22): Analysis + Final report
```

---

## 📞 CONTACTO CON CAMBIOS

Si necesitas CAMBIOS después de mañana:

1. **PARAR** todo trabajo en Shadow Production
2. **DOCUMENTAR** el cambio necesario
3. **ESPERAR** aprobación del director
4. **REINICIAR** Shadow Production con contador reseteado

**REGLA**: No interrumpir los 7 días sin razón crítica.

---

## ✅ VERIFICACIÓN PRE-INICIO

Antes de ejecutar mañana:
```bash
# 1. Código guardado?
git status

# 2. Build ok?
npm run build

# 3. Dev server?
npm run dev

# 4. Archivos persistencia ok?
ls data/community-publisher/
ls data/trust-conversion/
```

---

## 📝 BITÁCORA DIARIA (Template)

Guardar como: `data/shadow-production/bitacora-2026-07-1X.txt`

```
═════════════════════════════════════════════════════════════════
BITÁCORA DIARIA — 2026-07-1X
═════════════════════════════════════════════════════════════════

Hora inicio: HH:MM
Módulos READY: X/9
Uptime: XX%
Errores: N

EVENTOS DEL DÍA:
- [HORA] Evento 1: descripción
- [HORA] Evento 2: descripción

ANOMALÍAS:
- [HORA] Anomalía: descripción → STATUS (LOGGED/INVESTIGATING/RESOLVED)

ANÁLISIS:
- P&L: +X pips o -X pips (Paper)
- Publicaciones: N enviadas
- Sugerencias: N generadas
- Clicks: N
- Registrations: N

NEXT STEPS:
- [ ] Task 1
- [ ] Task 2

Hora fin: HH:MM
═════════════════════════════════════════════════════════════════
```

---

## 🚀 INICIO RÁPIDO (COPY-PASTE)

```bash
# Terminal 1
npm run dev

# Terminal 2 (después de que dev server esté listo)
.\activate-shadow-production.ps1

# Si no funciona script, uso manual:
curl -X POST http://localhost:3001/api/internal/shadow-production/init
```

---

**Documento preparado para continuidad sin pérdida**
**Siguiente reunión**: 2026-07-16 — Activación de Shadow Production
