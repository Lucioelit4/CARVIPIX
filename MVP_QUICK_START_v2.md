# 🎯 QUICK START v2 — GUÍA POR ESPECIALISTA (ARQUITECTURA COMPLETA)

**LEER ESTO en tu primera ventana VS Code. Toma 5 minutos.**

---

## 👤 ERES GATES SPECIALIST (Ventana 5)

### Tu Nueva Misión
Conectar datos REALES del broker para **NIVEL 1** (Alertas, Bot, Resultados).

### Cambio de Filosofía
- ❌ ANTES: "Qué modules entra"
- ✅ AHORA: "Nivel 1 (Alertas) funciona 100% con datos reales"

### Tareas en Orden

**AHORA (Hoy):**
1. Decidir broker: MT4, MT5, o Interactive Brokers?
2. Obtener credenciales
3. Diseñar broker API interface

**SEMANA 1:**
1. Crear `/app/engine/integrations/brokerAPI.ts`
   - Conectar y retornar datos reales para NIVEL 1
2. Crear `/app/engine/calculations/atrCalculator.ts`
3. Actualizar gates en `/app/engine/core/safetyGates.ts` con datos reales
4. Verificar que Alertas Dashboard muestra datos reales
5. `npm run build` → DEBE pasar

**SEMANA 2:**
1. Economic Calendar integration (para News Gate)
2. Correlation Matrix (para Correlation Gate)
3. Testing: Que todos los gates validen correctamente

### QUÉ NO HACER
- ❌ NO eliminar módulos NIVEL 2, 3, 4
- ❌ NO ocultar navegación
- ✅ SÍ enfócate en NIVEL 1 100% funcional

### Archivos a Editar
```
/app/engine/integrations/brokerAPI.ts           ← CREAR
/app/engine/calculations/atrCalculator.ts        ← CREAR
/app/engine/core/safetyGates.ts                  ← Editar
/app/engine/core/engine.ts                       ← Solo lectura
```

### Checklist
```
✅ Broker API retorna datos reales
✅ ATR calculator funciona
✅ Gates validan con datos reales
✅ Alertas Dashboard muestra alertas reales
✅ npm run build PASS
✅ npm run dev sin errores
```

---

## 📊 ERES BACKTESTING SPECIALIST (Ventana 6)

### Tu Nueva Misión
Validar Motor V2 para **NIVEL 1** (Alertas + Resultados).

### Cambio de Filosofía
- ❌ ANTES: "Qué funcionalidad incluir"
- ✅ AHORA: "Motor V2 es 100% listo y mejor que V1"

### Tareas en Orden

**AHORA (Hoy):**
1. Ir a https://www.histdata.com
2. Descargar EURUSD, GBPUSD, XAUUSD (3+ meses cada uno)
3. Guardar en `/data/historical/`

**SEMANA 1:**
1. Ejecutar backtest Motor V2
2. Ejecutar backtest Motor V1 (si existe)
3. Comparar en tabla:
   ```
   Métrica      | V1      | V2      | Ganador
   Win Rate     | ?       | ?       | V2 debe ganar
   Profit Fac   | ?       | ?       | V2 ganar ≥15%
   Max DD       | ?       | ?       | V2 mejor
   Sharpe       | ?       | ?       | V2 mejor
   ```

**SEMANA 2:**
1. Monte Carlo analysis (1000x resample)
2. Walk-Forward analysis (60/40 train/test)
3. Documentar en `BACKTEST_REPORT.md`

### QUÉ NO HACER
- ❌ NO cambiar scope del backtest
- ❌ NO eliminar módulos
- ✅ SÍ valida que Motor V2 listo para producción

### Archivos
```
/data/historical/                           ← CREAR (histórico)
/app/engine/backtesting/backtestEngine.ts   ← Lectura
/app/engine/demo/scenarios.ts               ← Lectura
```

### Checklist
```
✅ Histórico descargado (3 pares, 3+ meses)
✅ Backtest V2 ejecutado
✅ V2 mejor que V1 (≥15% improvement)
✅ Métricas calculadas
✅ Monte Carlo + Walk-Forward completo
✅ npm run build PASS
```

---

## 🔌 ERES DATA INTEGRATION (Ventana 7)

### Tu Nueva Misión
Conectar APIs para soportar NIVEL 1 + NIVEL 2 (datos reales).

### Cambio de Filosofía
- ❌ ANTES: "Qué eliminar para MVP"
- ✅ AHORA: "NIVEL 1 necesita broker API real"

### Tareas en Orden

**AHORA (Hoy):**
1. Decidir database: PostgreSQL o MongoDB?
2. Decidir broker: MT4, MT5, o IB?
3. Diseñar broker API interface

**SEMANA 1:**
1. Crear `/app/engine/integrations/brokerAPI.ts` (interfaz genérica)
2. Implementar primer broker (MT4 O IB)
3. Crear `/app/engine/storage/dataValidator.ts`
4. Crear `/app/engine/storage/historicalData.ts`
5. `npm run build` PASS

**SEMANA 2:**
1. Database connection pooling
2. Error handling (retry, timeout, fallback)
3. Backfill histórico desde HistData.com
4. Monitoring + logs de data quality

### QUÉ NO HACER
- ❌ NO eliminar módulos
- ❌ NO ocultar cualquier componente
- ✅ SÍ soporta NIVEL 1 con datos reales

### Archivos
```
/app/engine/integrations/brokerAPI.ts           ← CREAR
/app/engine/storage/historicalData.ts           ← CREAR
/app/engine/storage/dataValidator.ts            ← CREAR
/app/engine/integrations/errorHandler.ts        ← CREAR
```

### Checklist
```
✅ Broker API interface definida
✅ Primer broker conectado
✅ Database schema ready
✅ Data validation OK
✅ Error handling completo
✅ Backfill de histórico
✅ npm run build PASS
```

---

## 🚀 ERES DEPLOYMENT (Ventana 8)

### Tu Nueva Misión
Deploy PLATAFORMA COMPLETA (todos los niveles) en Vercel.

### Cambio de Filosofía
- ❌ ANTES: "Deploy solo módulos listos"
- ✅ AHORA: "Deploy TODOS los módulos, controlando acceso por nivel"

### Tareas en Orden

**AHORA (Hoy):**
1. Verificar `npm run build` pasa ✅
2. Verificar `npm run dev` funciona ✅
3. Abrir http://localhost:3000 → Home OK ✅

**SEMANA 1:**
1. Recopilar commits de otros 3 especialistas
2. Verificar que cada commit: `npm run build` PASS
3. Git consolidado:
   ```bash
   git add .
   git commit -m "Motor V2 + APIs + Navegación Completa"
   git push origin main
   ```
4. Esperar Vercel auto-deploy
5. Verificar en https://vercel.com/dashboard → SUCCESS
6. Test live en URL

**SEMANA 2:**
1. Setup environment variables en Vercel
2. Monitoring de logs
3. Performance metrics

### QUÉ NO HACER
- ❌ NO eliminar rutas/módulos
- ❌ NO ocultar navegación
- ✅ SÍ asegura que TODOS los niveles están accesibles según permisos

### Archivos
```
/.env.local                  ← Actualizar
/.env.example                ← Actualizar
/package.json                ← Solo lectura
/next.config.ts              ← Solo lectura
```

### Checklist
```
✅ npm run build PASS
✅ npm run dev OK
✅ Localhost:3000 sin errores
✅ Todos los módulos visibles en nav
✅ NIVEL 1: 100% funcional
✅ NIVEL 2: Visible + "BETA" banner
✅ NIVEL 3: Visible + "Próximamente" banner
✅ NIVEL 4: Visible solo si admin
✅ Vercel deploy SUCCESS
✅ URL live funciona
```

---

## 🔑 NUEVA REGLA GLOBAL

### ✅ SÍ HAGO
- ✅ Todos los módulos visibles en navegación
- ✅ Banners claros: Beta, Próximamente, Restringido
- ✅ Ajustar nivel de funcionalidad (no eliminar)
- ✅ Bloquear acceso con auth gates

### ❌ NO HAGO
- ❌ Eliminar módulos
- ❌ Ocultar navegación
- ❌ Hacer que parezca incompleta
- ❌ Remover servicios estratégicos

---

## 📋 MATRIZ DE MÓDULOS (Todo lo que existe)

```
✅ NIVEL 1 - LISTO (11 módulos)
   Home, Alertas, Bot, Resultados, Servicios
   Motor, Gates, Backtest, Header, Alert System, Deploy

🟡 NIVEL 2 - BETA (3 módulos)
   Gestión Capital, Fondeo, Facturación

🔜 NIVEL 3 - PRÓXIMAMENTE (4 módulos)
   Academia, Ayuda, Herramientas, Comunidad

🔐 NIVEL 4 - ADMIN (6 módulos)
   Dashboard, Users, Billing, Config, Logs, Data
```

**TODOS existen desde MVP launch. Simplemente en diferentes niveles.**

---

## 🎯 ÉXITO

Cuando alguien abre CARVIPIX MVP:

1. ✅ Ve navegación COMPLETA
2. ✅ Algunos módulos funcionan 100% (NIVEL 1)
3. ✅ Algunos están "BETA" (NIVEL 2)
4. ✅ Algunos dicen "Próximamente" (NIVEL 3)
5. ✅ Admin puede acceder a panel (NIVEL 4)
6. ✅ Parece plataforma profesional COMPLETA
7. ✅ No parece startup mutilada

---

Versión: 2.0  
Fecha: 3 de Julio 2026 (Revisada)  
Tema: Arquitectura Completa, Niveles de Funcionalidad

---

**PREGUNTA AL DIRECTOR si algo no queda claro.**
