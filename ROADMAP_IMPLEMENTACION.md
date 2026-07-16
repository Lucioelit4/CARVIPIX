# ROADMAP IMPLEMENTACIÓN — PRUEBA INTEGRAL CARVIPIX

**Versión:** 1.0  
**Estado:** Iniciado  
**Objetivo:** Completar ciclo E2E en 15 horas  
**Fecha Inicio:** 15 Julio 2026 22:30

---

## DOCUMENTACIÓN COMPLETADA ✅

| Componente | Archivo | Estado | Propósito |
|-----------|---------|--------|----------|
| Plan Integral | [PRUEBA_INTEGRAL_PLAN.md](PRUEBA_INTEGRAL_PLAN.md) | ✅ | Arquitectura completa del ciclo E2E |
| Master Dispatcher | [master-event-dispatcher.ts](app/backend/services/master-event-dispatcher.ts) | ✅ | Coordinador central de eventos |
| Migraciones BD | [001_master_event_dispatcher.sql](migrations/001_master_event_dispatcher.sql) | ✅ | Tablas para persistencia |
| Telegram Integration | [INTEGRACION_TELEGRAM_E2E.md](INTEGRACION_TELEGRAM_E2E.md) | ✅ | Flujo de alertas de Telegram |

---

## ARQUITECTURA DE COMPONENTES

```
┌────────────────────────────────────────────────────────────┐
│                     FASE 1: SETUP                          │
├────────────────────────────────────────────────────────────┤
│ ✅ Plan de prueba integral                                │
│ ✅ Master Event Dispatcher (core logic)                   │
│ ✅ Migraciones de BD                                      │
│ ✅ Especificación de Telegram                             │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                  FASE 2: IMPLEMENTACIÓN                    │
├────────────────────────────────────────────────────────────┤
│ 🔄 [2.1] Ejecutar migraciones en BD                       │
│    └─ Crear tablas: master_events, module_state, etc     │
│                                                           │
│ 🔄 [2.2] Implementar Module State Tracker                │
│    └─ Persistencia de estado real de cada módulo         │
│                                                           │
│ 🔄 [2.3] Implementar Module Dispatcher                   │
│    └─ Enrutamiento a 8 módulos específicos               │
│                                                           │
│ 🔄 [2.4] Integrar Telegram Service                       │
│    └─ Send/Edit/Retry lógica completa                    │
│                                                           │
│ 🔄 [2.5] Actualizar Admin Dashboard                      │
│    └─ Nueva sección "Event Tracker" con timeline         │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│              FASE 3: TESTING REAL (DEMO MT5)              │
├────────────────────────────────────────────────────────────┤
│ ⏳ [3.1] Test Case #1-6: Flujo básico                    │
│    └─ Signal → Distribution → Bot → MT5 → Retorno       │
│                                                           │
│ ⏳ [3.2] Test Case #7-12: Cierre y recuperación          │
│    └─ TP/SL, duplicados, fallos, reintentos             │
│                                                           │
│ ⏳ [3.3] Test Case #13-14: Dashboard y trazabilidad      │
│    └─ Admin view, timeline, búsqueda por event_id       │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│           FASE 4: EVIDENCE & CONSOLIDATION                 │
├────────────────────────────────────────────────────────────┤
│ ⏳ [4.1] Capturar evidencia real                          │
│    └─ 20+ screenshots, logs, timestamps                  │
│                                                           │
│ ⏳ [4.2] Crear informe final                             │
│    └─ Criterios de aprobación vs resultados              │
└────────────────────────────────────────────────────────────┘
```

---

## TIMELINE ESTIMADO

| Fase | Tarea | Duración | Total |
|------|-------|----------|-------|
| 1 | **Setup Documentación** | ✅ 1h | 1h |
| 2 | Migraciones BD | 15 min | 1.25h |
| 2 | Module State Tracker | 45 min | 2.1h |
| 2 | Module Dispatcher | 1h | 3.1h |
| 2 | Telegram Integration | 45 min | 3.85h |
| 2 | Admin Dashboard Updates | 1.5h | 5.35h |
| 3 | Testing Setup & T1-6 | 1.5h | 6.85h |
| 3 | Testing T7-12 | 1h | 7.85h |
| 3 | Testing T13-14 | 1h | 8.85h |
| 4 | Evidence Capture | 1h | 9.85h |
| 4 | Report Consolidation | 1h | 10.85h |
| **TOTAL** | | | **~11 horas** |

---

## DETALLES POR FASE

### FASE 2.1: Migraciones BD

**Archivos:**
- `migrations/001_master_event_dispatcher.sql` ✅

**Acciones:**
```bash
# Ejecutar migraciones
psql $DATABASE_URL < migrations/001_master_event_dispatcher.sql

# Verificar tablas creadas
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

**Tablas creadas:**
- `master_events` (eventos maestros)
- `module_state_history` (estado histórico por módulo)
- `event_executions` (ejecuciones en MT5)
- `trade_closures` (cierres de operaciones)
- `event_timeline` (auditoría completa)
- `module_registry` (registro de módulos)

**Vista finales creadas:**
- `event_summary` (resumen agregado)
- `module_current_state` (estado actual de módulos)

---

### FASE 2.2: Module State Tracker

**Ubicación:** `app/backend/services/module-state-tracker.ts`

**Responsabilidades:**
1. Registrar estado inicial de cada módulo (RECEIVED)
2. Actualizar progreso en tiempo real
3. Registrar completación o error
4. Persistir en BD

**Código base:**

```typescript
export class ModuleStateTracker {
  async initialize(event_id: string, modules: string[]): Promise<void> {
    // Para cada módulo, crear registro inicial con state=RECEIVED
  }
  
  async updateProgress(
    event_id: string,
    module: string,
    progress: number,
    step?: string
  ): Promise<void> {
    // Actualizar progress (0-100, REAL, no decorativo)
  }
  
  async markCompleted(event_id: string, module: string): Promise<void> {
    // Marcar como COMPLETED
  }
  
  async markFailed(event_id: string, module: string, error: string): Promise<void> {
    // Marcar como FAILED + guardar error
  }
  
  async getState(event_id: string): Promise<ModuleStateRecord[]> {
    // Obtener estado actual de todos los módulos
  }
}
```

---

### FASE 2.3: Module Dispatcher

**Ubicación:** Extender `app/backend/services/master-event-dispatcher.ts`

**Responsabilidades:**
1. Enrutar a cada módulo específico
2. Pasar SOLO datos necesarios
3. Ejecutar en paralelo (Promise.all)
4. Trackear retorno de cada uno

**Pseudocódigo:**

```typescript
private async routeToModules(event: MasterEvent): Promise<void> {
  const routes = [
    this.routeToAlerts(event),
    this.routeToBot(event),
    this.routeToManagement(event),
    this.routeToFunding(event),
    this.routeToResults(event),
    this.routeToNotifications(event),
    this.routeToAudit(event),
    this.routeToAdmin(event)
  ];
  
  // Ejecutar todas en paralelo
  await Promise.all(routes);
}

private async routeToAlerts(event: MasterEvent): Promise<void> {
  // Pasar SOLO: event_id, signal_id, symbol, direction, levels, created_at
  // No pasar: license_key, internal data, etc
}

private async routeToBot(event: MasterEvent): Promise<void> {
  // Pasar SOLO: event_id, signal_id, execution_id, symbol, side, volume, entry, SL, TP
}

// ... etc para cada módulo
```

---

### FASE 2.4: Telegram Service Enhancement

**Ubicación:** Extender `app/lib/services/telegramClientService.ts`

**Nuevos métodos:**

```typescript
export class TelegramAlertService {
  async sendSignalAlert(event: MasterEvent): Promise<TelegramResult> {
    // 1. Validar membresía
    // 2. Validar límite diario
    // 3. Formatear mensaje
    // 4. Enviar a @carvipix_alerts (test)
    // 5. Guardar message_id en BD
  }
  
  async updateExecutionAlert(event_id: string, execution: any): Promise<TelegramResult> {
    // 1. Recuperar message_id anterior
    // 2. Editar mensaje con ticket
    // 3. Actualizar status en BD
  }
  
  async updateClosureAlert(event_id: string, closure: any): Promise<TelegramResult> {
    // 1. Recuperar message_id anterior
    // 2. Editar mensaje con resultado
    // 3. Actualizar status en BD
  }
  
  async retryFailedMessages(): Promise<void> {
    // Reintento automático de mensajes fallidos
  }
}
```

---

### FASE 2.5: Admin Dashboard Update

**Ubicación:** Extender `app/admin/AdminDashboard.tsx`

**Nueva sección: "Ciclo E2E Tracker"**

Mostrar:
- Event ID (clickeable para expandir)
- Signal ID
- Símbolo y dirección
- Estado general: CREATED / DISTRIBUTED / EXECUTED / CLOSED
- 8 módulos con estado individual (con colores):
  - 🟢 COMPLETED
  - 🟡 PROCESSING
  - 🔴 FAILED
  - ⚪ PENDING
- Progress bar general (0-100%)
- Ticket del broker (si existe)
- Precios (solicitado vs ejecutado)
- SL / TP
- Resultado (si está cerrado)
- Timeline expandible mostrando todos los eventos en orden

---

## TESTS CONCRETOS

### TEST 1-6: Flujo Básico

```
1. Crear Signal de prueba
   └─ event_id: EVT-20260715-0001
   └─ symbol: XAUUSD, BUY
   └─ entry: 2024.50, SL: 2020.00, TP: 2035.00

2. Verificar distribución a 8 módulos
   └─ Todas las entregas exitosas

3. Verificar Telegram enviado
   └─ @carvipix_alerts recibió mensaje

4. Enviar al Bot
   └─ Bot validó licencia y preparó instrucción

5. MT5 ejecutó orden
   └─ Operación abierta con ticket real

6. Backend recibió confirmación
   └─ Status actualizado a EXECUTED
```

### TEST 7-12: Operaciones Avanzadas

```
7. Cerrar por TP en MT5
   └─ +10.48 pips, +$69.87

8. Backend recibe CLOSED
   └─ Todos módulos actualizados

9. Telegram actualizado
   └─ Mensaje muestra resultado final

10. Validar NO hay duplicados
    └─ Mismo event_id no genera segunda operación

11. Simular fallo de Telegram
    └─ Reintento automático exitoso

12. Validar trazabilidad
    └─ Busca por event_id muestra cadena completa
```

### TEST 13-14: Admin Dashboard

```
13. Abrir Admin Dashboard
    └─ Nueva sección "Ciclo E2E" visible
    └─ Event ID clickeable
    └─ Timeline mostrada
    └─ Todos los campos presentes

14. Compilación
    └─ npm run build → 0 errores
    └─ npm run dev → backend ok
```

---

## CHECKLIST DE CRITERIOS DE APROBACIÓN

### Criterio 1: Señal Maestra Generada ✓
- [ ] event_id único (EVT-YYYYMMDD-NNNNN)
- [ ] signal_id único
- [ ] Persistida en BD master_events
- [ ] Todos los campos presentes

### Criterio 2: Distribución Coordinada ✓
- [ ] 8 módulos reciben evento
- [ ] Cada uno recibe SOLO datos necesarios
- [ ] Cero duplicados
- [ ] Timestamps en orden

### Criterio 3: Procesamiento Independiente ✓
- [ ] Estado de cada módulo registrado
- [ ] Progress real 0-100% (no decorativo)
- [ ] Paso a paso identificado
- [ ] Error capturado si falla

### Criterio 4: Telegram Integrado ✓
- [ ] Mensaje enviado a test channel
- [ ] message_id guardado
- [ ] Mensaje editado con ticket
- [ ] Mensaje editado con resultado

### Criterio 5: Ejecución en MT5 ✓
- [ ] EA recibe instrucción
- [ ] Orden abierta 0.01 BUY
- [ ] Ticket registrado
- [ ] SL/TP colocados

### Criterio 6: Retorno de Información ✓
- [ ] Backend recibe EXECUTED
- [ ] Execution_id guardado
- [ ] Status correcto

### Criterio 7: Actualización de Módulos ✓
- [ ] 8 módulos reflejan EXECUTED
- [ ] Estados: Bot→EXECUTED, Alertas→EN_OPERACION, etc
- [ ] Timestamps actualizado

### Criterio 8: Cierre de Operación ✓
- [ ] MT5 ejecuta TP automáticamente
- [ ] Operación cierra con +10+ pips
- [ ] Backend recibe CLOSED

### Criterio 9: Actualización Final ✓
- [ ] 8 módulos reflejan CLOSED
- [ ] Estados: Bot→CLOSED, Alertas→CERRADA, etc
- [ ] PnL actualizado

### Criterio 10: Admin Dashboard ✓
- [ ] Event ID visible
- [ ] Ciclo completo mostrado
- [ ] Timeline con timestamps
- [ ] Todos los campos presentes
- [ ] Estados actuales correctos

### Criterio 11: Trazabilidad ✓
- [ ] Buscar por event_id muestra TODA la cadena
- [ ] signal_id relacionado
- [ ] execution_id relacionado
- [ ] Ticket vinculado
- [ ] Módulos en orden

### Criterio 12: Control de Duplicados ✓
- [ ] Segundo intento rechazado
- [ ] Solo una operación abierta
- [ ] Registrada razón de rechazo

### Criterio 13: Recuperación de Fallos ✓
- [ ] Fallo en módulo no destruye ciclo
- [ ] Reintento exitoso
- [ ] Sin duplicación
- [ ] Estado final consistente

### Criterio 14: Compilación ✓
- [ ] npm run build → 0 errores
- [ ] npm run dev → funcional
- [ ] Logs sin excepciones

---

## ARCHIVOS A CREAR/MODIFICAR

```
NEW FILES:
├─ app/backend/services/master-event-dispatcher.ts ✅
├─ app/backend/services/module-state-tracker.ts 🔄
├─ app/backend/services/module-dispatcher.ts 🔄
├─ migrations/001_master_event_dispatcher.sql ✅
├─ PRUEBA_INTEGRAL_PLAN.md ✅
├─ INTEGRACION_TELEGRAM_E2E.md ✅
└─ ROADMAP_IMPLEMENTACION.md 🔄 (este archivo)

MODIFIED FILES:
├─ app/lib/services/telegramClientService.ts 🔄
├─ app/admin/AdminDashboard.tsx 🔄 (add new tab)
├─ app/backend/core/database.ts 🔄 (init tables)
└─ package.json (no cambios necesarios)
```

---

## COMANDOS PARA EJECUTAR

### Setup BD
```bash
# En terminal con acceso a Neon
psql $DATABASE_URL < migrations/001_master_event_dispatcher.sql

# Verificar
psql $DATABASE_URL -c "\dt"  # Listar tablas
```

### Development
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: MT5 (manual)
# Abrir MT5 y cargar EA
# Configurar a DEVELOPMENT

# Terminal 3: Tests (manual)
# Ejecutar test cases
```

### Build Final
```bash
npm run build
npm run dev

# En otro terminal: Prueba integral real
```

---

## PRÓXIMOS PASOS INMEDIATOS

### Siguiente: [FASE 2.1] Ejecutar Migraciones

1. ✅ Verificar acceso a BD Neon
2. ✅ Ejecutar SQL de migraciones
3. ✅ Crear 6 tablas principales
4. ✅ Crear 2 vistas SQL
5. ✅ Crear 2 funciones

**Salida esperada:**
```
✓ master_events (tabla)
✓ module_state_history (tabla)
✓ event_executions (tabla)
✓ trade_closures (tabla)
✓ event_timeline (tabla)
✓ module_registry (tabla)
✓ event_summary (vista)
✓ module_current_state (vista)
```

---

## NOTAS IMPORTANTES

**⚠️ No crear arquitectura nueva:**
- Usar existentes: Trading Engine, Bot Module, Alerts, etc
- Solo CONECTAR lo que falta
- Seguir CARVIPIX estructura vigente

**⚠️ Evidencia REAL:**
- Screenshots reales de MT5, Telegram, admin dashboard
- JSON real de requests/responses
- Timestamps reales
- NO simulado

**⚠️ Compilación obligatoria:**
- Cero errores antes de aprobación
- Logs sin excepciones
- Testing en dev server activo

**⚠️ Trazabilidad:**
- Event_id es ID global único
- Signal_id, execution_id, ticket todo relacionado
- Busca por event_id debe encontrar TODO

---

## DURACIÓN TOTAL

- **Planificación:** ✅ 1 h (completado)
- **Implementación:** 🔄 ~5.5 h (próxima)
- **Testing:** 🔄 ~3 h (próxima)
- **Evidence & Report:** 🔄 ~2 h (próxima)
- **TOTAL:** ~11.5 horas

**Inicio:** 15 Julio 2026 22:30  
**Fin esperado:** 16 Julio 2026 09:00-10:00

---

**Versión:** 1.0  
**Estado:** Iniciado - Listos para Fase 2.1  
**Próxima Revisión:** Después de completar migraciones

