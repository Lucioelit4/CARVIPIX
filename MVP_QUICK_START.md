# 🎯 QUICK START — GUÍA RÁPIDA POR ESPECIALISTA

**LEER ESTO en tu primera ventana VS Code. Toma 5 minutos.**

---

## 👤 ERES GATES SPECIALIST (Ventana 5)

### Tu Misión
Conectar datos REALES del broker para validar las 5 puertas de seguridad.

### Tareas en Orden

**AHORA (Hoy):**
1. Decidir broker: MT4, MT5, o Interactive Brokers?
2. Obtener credenciales: API key + account info
3. Diseñar la interfaz del conectador

**SEMANA 1:**
1. Crear `/app/engine/integrations/brokerAPI.ts`
   - Funciones: connect(), getSpread(), getVolume(), getBalance(), getPositions()
2. Crear `/app/engine/calculations/atrCalculator.ts`
   - Funciones: calculateATR(periods, candles), getATRPercentile()
3. Verificar que `/app/engine/core/safetyGates.ts` reciba datos reales
4. `npm run build` → debe pasar

**SEMANA 2:**
1. Crear `/app/engine/integrations/economicCalendar.ts`
2. Crear `/app/engine/integrations/errorHandler.ts`
3. Documentar todo en `GATES_IMPLEMENTATION.md`

### Archivos Que Probablemente Edites
```
/app/engine/integrations/brokerAPI.ts          ← CREAR (nuevo)
/app/engine/calculations/atrCalculator.ts       ← CREAR (nuevo)
/app/engine/integrations/economicCalendar.ts    ← CREAR (nuevo)
/app/engine/core/safetyGates.ts                 ← Editar (datos reales)
/app/engine/core/engine.ts                      ← Solo lectura (cómo se usan gates)
```

### Checklist Antes de Commit
```
npm run build            # Debe pasar
npm run dev              # Debe correr sin errores
# En localhost:3000, verifica que no haya errores de consola
```

### Bloqueador Principal
❌ Credenciales broker no disponibles aún
→ Pregunta al Director qué broker usar

### Documentación a Leer
1. `MVP_ALCANCE_CONGELADO.md` → Module 2 (Safety Gates)
2. `AUDITORIA_V2_ESTADO_ACTUAL.md` → Section 3 (Fields required by gate)
3. `_CHAT_5_GATES_SPECIALIST.txt` → Tu contexto completo

---

## 📊 ERES BACKTESTING SPECIALIST (Ventana 6)

### Tu Misión
Validar que Motor V2 es mejor que V1 usando datos históricos reales.

### Tareas en Orden

**AHORA (Hoy):**
1. Ir a https://www.histdata.com/download-free-forex-historical-data/
2. Descargar:
   - EURUSD 1-min bar quotes (3+ meses)
   - GBPUSD 1-min bar quotes (3+ meses)
   - XAUUSD 1-min bar quotes (3+ meses)
3. Guardar en `/data/historical/`

**SEMANA 1:**
1. Ejecutar backtest con Motor V2
   - Ubicación: `/app/engine/backtesting/backtestEngine.ts` (ya existe)
   - Input: Tu histórico descargado
   - Output: Trades + métricas
2. Ejecutar backtest con Motor V1 (si tienes código)
3. Comparar resultados en tabla:
   ```
   Métrica      | V1      | V2      | Ganador
   Win Rate     | ?       | ?       | V2 debe ganar
   Profit Fac   | ?       | ?       | V2 debe ganar ≥15%
   Max DD       | ?       | ?       | V2 debe ganar (menor)
   Sharpe       | ?       | ?       | V2 debe ganar
   ```

**SEMANA 2:**
1. Monte Carlo analysis (resample 1000x histórico)
2. Walk-Forward analysis (train 60%, test 40%)
3. Documentar en `BACKTEST_REPORT.md`

### Archivos Que Probablemente Edites
```
/data/historical/                           ← CREAR (guardar CSV histórico)
/app/engine/backtesting/backtestEngine.ts   ← Probablemente lectura nada más
/app/engine/demo/scenarios.ts               ← Solo lectura (test cases ya existen)
```

### Checklist Antes de Commit
```
npm run build            # Debe pasar
npm run dev              # Debe correr
# Verificar que backtest se ejecuta sin errores
```

### Bloqueador Principal
❌ Ninguno. Histórico es FREE en HistData.com
→ Puedes empezar HOY mismo

### Documentación a Leer
1. `MVP_ALCANCE_CONGELADO.md` → Module 12-14 (Backtesting)
2. `MOTOR_V2_MEJORAS_IMPLEMENTADAS.md` → Qué cambió en Motor V2
3. `_CHAT_6_BACKTESTING_SPECIALIST.txt` → Tu contexto completo

---

## 🔌 ERES DATA INTEGRATION SPECIALIST (Ventana 7)

### Tu Misión
Conectar APIs reales (broker, economic calendar) y almacenar datos en base de datos.

### Tareas en Orden

**AHORA (Hoy):**
1. Decidir database: PostgreSQL o MongoDB?
2. Decidir broker: MT4, MT5, o IB?
3. Diseñar database schema en `/app/engine/storage/historicalData.ts`

**SEMANA 1:**
1. Crear `/app/engine/integrations/brokerAPI.ts` (interface genérica)
   - Métodos: connect(), getSpread(), getVolume(), getBalance(), getPositions()
2. Implementar primer broker connector (MT4 O IB)
3. Crear `/app/engine/storage/dataValidator.ts`
   - Validar que spread > 0, volume > 0, timestamp válido
4. `npm run build` → debe pasar

**SEMANA 2:**
1. Database connection pooling
2. Error handling completo (retry logic, timeouts)
3. Backfill histórico desde HistData.com
4. Monitoring + alertas si data falla

### Archivos Que Probablemente Edites
```
/app/engine/integrations/brokerAPI.ts           ← CREAR (nuevo)
/app/engine/storage/historicalData.ts           ← CREAR (nuevo)
/app/engine/storage/dataValidator.ts            ← CREAR (nuevo)
/app/engine/integrations/errorHandler.ts        ← CREAR (nuevo)
/app/api/datasets/route.ts                      ← Probablemente extender
```

### Checklist Antes de Commit
```
npm run build            # Debe pasar
npm run dev              # Debe correr sin errores
# Verifica que broker API conecta correctamente
```

### Bloqueador Principal
❌ Credenciales broker no disponibles aún
❌ Database provisioning (qué proveedor usar?)
→ Pregunta al Director

### Documentación a Leer
1. `MVP_ALCANCE_CONGELADO.md` → Module 15-19 (Data Integration)
2. `AUDITORIA_V2_ESTADO_ACTUAL.md` → Section 3 y 7 (Data requirements)
3. `_CHAT_7_DATA_INTEGRATION.txt` → Tu contexto completo

---

## 🚀 ERES DEPLOYMENT SPECIALIST (Ventana 8)

### Tu Misión
Asegurar que cada cambio compila, testea, y deploya bien en Vercel.

### Tareas en Orden

**AHORA (Hoy):**
1. Verificar que `npm run build` pasa ✅
2. Verificar que `npm run dev` funciona ✅
3. Abrir http://localhost:3000 → debe ver Home premium ✅
4. Abrir browser DevTools → Console debe estar vacío (0 errors)

**SEMANA 1:**
1. Recopilar todos los commits de otros 3 especialistas
2. Verificar que cada commit tiene `npm run build` PASS
3. Hacer commit consolidado:
   ```bash
   git add .
   git commit -m "Motor V2 + Gates + Backtesting framework"
   git push origin main
   ```
4. Esperar a que Vercel haga auto-deploy
5. Verificar en https://vercel.com/dashboard que deployment SUCCESS
6. Ir a tu URL live (ej: https://carvipix.vercel.app) y verificar funciona

**SEMANA 2:**
1. Setup environment variables en Vercel dashboard:
   - BROKER_API_KEY
   - CALENDAR_API_KEY
   - DATABASE_URL
2. Monitorear logs en Vercel
3. Documentar en `DEPLOYMENT_REPORT.md`

### Archivos Que Probablemente Edites
```
/.env.local                  ← Editar (agregar broker/calendar keys)
/.env.example                ← Actualizar (template)
/package.json                ← Solo lectura
/vercel.json                 ← Solo lectura
```

### Checklist Antes de Cada Commit
```
npm run build                # DEBE PASAR ✅
npm run dev                  # DEBE CORRER ✅
npm run lint                 # Revisar warnings
# Browser: Verifica localhost:3000 sin errores
```

### Bloqueador Principal
❌ Otros especialistas deben terminar sus cambios primero
→ Coordina con ellos en el grupo

### Documentación a Leer
1. `MVP_ALCANCE_CONGELADO.md` → Module 20-22 (Deployment)
2. `_CHAT_8_DEPLOYMENT.txt` → Tu contexto completo

---

## 🔧 COMANDOS RÁPIDOS PARA TODOS

**Correr en tu terminal en el folder del proyecto:**

```bash
# Ver si todo está bien
npm run build              # Compila ✅ o ❌
npm run dev                # Dev server en localhost:3000
npx tsc --noEmit           # TypeScript check (0 errors?)

# Git
git status                 # Qué cambió?
git add .                  # Stage todo
git commit -m "MENSAJE"    # Commit (ver formato abajo)
git push origin main       # Push a GitHub → Auto-deploy Vercel

# Formato de commit recomendado:
git commit -m "[COMPONENT] brief description"
# Ejemplos:
git commit -m "[GATES] implement broker API connector"
git commit -m "[BACKTEST] add Monte Carlo analysis"
git commit -m "[DEPLOY] ready for production launch"
```

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
✅ LISTO (14 módulos):
  - Motor V2 (consenso + 11 agentes)
  - 5 Safety Gates
  - Dashboard de alertas
  - Home + 6 páginas frontend
  - Backtest engine
  - Deployment en Vercel

⏳ EN PROGRESO (4 módulos):
  - Broker API connector (esperando tú!)
  - ATR Calculator (esperando tú!)
  - Economic Calendar (esperando tú!)
  - Database schema (esperando tú!)
```

---

## 💬 PREGUNTAS RÁPIDAS

### ¿Dónde está el código del Motor?
→ `/app/engine/agents/index.ts` (11 agentes)  
→ `/app/engine/core/engine.ts` (consenso)  
→ `/app/engine/core/safetyGates.ts` (validadores)

### ¿Dónde está el frontend?
→ `/app/page.tsx` (home)  
→ `/app/alertas/page.tsx` (dashboard)  
→ `/app/bot/page.tsx` (panel bot)  
→ `/app/resultados/page.tsx` (gráficas)

### ¿Dónde está el backtest?
→ `/app/engine/backtesting/backtestEngine.ts`  
→ `/app/engine/demo/scenarios.ts`

### ¿Vercel está configured?
→ SÍ, auto-deploy en git push  
→ URL: https://carvipix.vercel.app (o tu dominio)

### ¿TypeScript? ¿Build? ¿Deploy?
→ ✅ Sí, sí, sí - Todo funciona  
→ Build time: 3.8 segundos  
→ 39/39 rutas prerendered

---

## 🚨 SI ALGO SE ROMPE

**Primero:**
```bash
npm run build    # Qué error?
```

**Si TypeScript error:**
- Abre el archivo mencionado
- Lee el error
- Fix type definition
- Re-run `npm run build`

**Si runtime error:**
- `npm run dev` en terminal
- Abre http://localhost:3000 en browser
- DevTools → Console → Ver el error
- Stack trace te dice dónde arreglar

**Si git conflict:**
```bash
git status          # Ver archivos conflictados
# Abre archivo, busca <<<< >>>> ====
# Resuelve el conflicto manualmente
git add .
git commit -m "Resolve merge conflict"
```

---

## ⏰ TIMELINE ESPERADO

**HOY (Viernes 3 Julio):**
- Backtesting: Descarga histórico
- Todos: Lee documentación MVP

**LUNES 6 Julio:**
- Backtesting: Primer backtest ejecutado
- Gates: Broker interface diseñada
- Data Int: Database schema finalizada

**VIERNES 10 Julio:**
- Backtesting: V2 vs V1 comparado
- Gates: Broker API funciona
- Data Int: Primer broker conectado
- Deploy: Git push → Vercel LIVE 🚀

**LUNES 13 Julio:**
- Todos: Polish + testing final
- Gates: Economic calendar + correlation
- Backtesting: Monte Carlo + Walk-Forward

**MIÉRCOLES 15 Julio:**
- LAUNCH OFICIAL MVP ✅

---

## 🎯 ÉXITO SE VE COMO

**Para GATES:**
✅ Broker API retorna datos reales  
✅ Gates validan con datos reales  
✅ npm run build PASS  
✅ Documento GATES_IMPLEMENTATION.md

**Para BACKTESTING:**
✅ Motor V2 mejor que V1 (≥15%)  
✅ Backtest ejecutable y reproducible  
✅ Documento BACKTEST_REPORT.md  
✅ npm run build PASS

**Para DATA INTEGRATION:**
✅ Broker conectado y funcionando  
✅ Database almacena datos correctamente  
✅ Data validation OK  
✅ Documento DATA_INTEGRATION.md

**Para DEPLOYMENT:**
✅ npm run build PASS  
✅ npm run dev OK  
✅ Vercel live PASS  
✅ Documento DEPLOYMENT_REPORT.md

---

## 📞 NECESITAS AYUDA?

1. Lee `MVP_ALCANCE_CONGELADO.md` → Tu módulo
2. Lee tu archivo CHAT específico (ej: `_CHAT_5_GATES_SPECIALIST.txt`)
3. Lee `MVP_DELIVERABLES_CHECKLIST.md` → Tu sección
4. Pregunta al Director si no hay claridad

---

**Buenas suerte. Entrega bien. El MVP depende de ti.** 🚀
