# 📋 DELIVERABLES MVP — CHECKLIST POR ESPECIALISTA

**Para el Director:** Verifica estos deliverables antes de declarar cada especialista "DONE".

---

## ESPECIALISTA 1: GATES SPECIALIST (Ventana 5)

### Responsabilidad
Conectar datos reales del broker y validadores de seguridad.

### Deliverables Requeridos

#### ✅ TIER 1 - CRÍTICO (MVP bloqueado sin esto)

- [ ] **Broker API Connector implementado**
  - Archivo: `/app/engine/integrations/brokerAPI.ts` (NUEVO)
  - Funciones: `connect()`, `getSpread()`, `getVolume()`, `getBalance()`, `getPositions()`
  - Testing: Conecta y retorna datos reales (o mock si broker no disponible)
  - Verificación: Console.log muestra valores válidos

- [ ] **ATR Calculator funcionando**
  - Archivo: `/app/engine/calculations/atrCalculator.ts` (NUEVO)
  - Funciones: `calculateATR(periods, candles)`, `getATRPercentile(historical)`
  - Output: Números reales (ej: ATR=145.3 pips para XAUUSD)
  - Verificación: `npm run dev` sin errores

- [ ] **Gates validados con datos reales**
  - Archivo: `/app/engine/core/safetyGates.ts` (MODIFICADO)
  - Cambios: Reemplazar -1 placeholders con datos del broker
  - Verificación: Todos los 5 gates retornan valores no placeholder

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS (3.8-4.2s)
  - Errores permitidos: 0

#### 🟡 TIER 2 - IMPORTANTE (Mejora calidad)

- [ ] **Economic Calendar API conectado**
  - Archivo: `/app/engine/integrations/economicCalendar.ts` (NUEVO)
  - Funciones: `getNextEvent()`, `getEventSeverity()`, `getMinutesUntil()`
  - Testing: Retorna eventos reales o mock calendar
  - Verificación: News gate puede usar datos reales

- [ ] **Error handling implementado**
  - Broker API timeout → fallback a -1 (provisional mode)
  - Calendar API fail → marcar como no disponible
  - Logging: Console muestra qué falló y por qué

- [ ] **Monitoring/Alertas de data quality**
  - Log si broker desconecta
  - Log si data es stale (>60 seg de lag)
  - Alert si gates reciben datos inconsistentes

### Entregable Final
```
✅ 3 nuevos archivos: brokerAPI.ts, atrCalculator.ts, economicCalendar.ts
✅ safetyGates.ts actualizado con datos reales
✅ npm run build → PASS
✅ npm run dev → sin errors
✅ Documento: GATES_IMPLEMENTATION.md explicando cada integración
```

### Criterio de Aceptación
- Gates reciben datos REALES (o fallback graceful si no disponibles)
- NO hay placeholder -1 en datos de broker
- Build pasa SIEMPRE

---

## ESPECIALISTA 2: BACKTESTING SPECIALIST (Ventana 6)

### Responsabilidad
Validar Motor V2 contra datos históricos reales.

### Deliverables Requeridos

#### ✅ TIER 1 - CRÍTICO

- [ ] **Histórico descargado**
  - Pares: EURUSD, GBPUSD, XAUUSD
  - Fuente: HistData.com (FREE)
  - Formato: 1-min bar quotes (OHLCV)
  - Período: 3 meses mínimo (recomendado 6)
  - Ubicación: `/data/historical/` o similar
  - Verificación: 3+ archivos CSV con datos válidos

- [ ] **Backtest Engine ejecutable**
  - Script: `npm run backtest` o `npm run dev` → /backtest endpoint
  - Input: Histórico + Motor V2
  - Output: Trades generados con timestamps, entry, exit, PnL
  - Verificación: Genera ≥100 trades en 3-month período

- [ ] **Métricas calculadas**
  - Win Rate: % de trades ganadores
  - Profit Factor: Total ganancia / Total pérdida
  - Max Drawdown: Pérdida máxima desde peak
  - Sharpe Ratio: Retorno / Volatilidad
  - Output: Dashboard o JSON con valores

- [ ] **Comparación V1 vs V2**
  - Backtest Motor V1 con mismos datos
  - Backtest Motor V2 con mismos datos
  - Tabla comparativa:
    ```
    Métrica      | V1      | V2      | Mejora
    Win Rate     | 52%     | 58%     | +6pp
    Profit Fac   | 1.3     | 1.6     | +23%
    Max DD       | 22%     | 18%     | -4pp
    Sharpe       | 0.92    | 1.15    | +25%
    ```
  - Verificación: V2 mejora ≥ 15% en Profit Factor

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS
  - Errores permitidos: 0

#### 🟡 TIER 2 - IMPORTANTE

- [ ] **Monte Carlo Analysis**
  - Resample histórico 1000x
  - Output: Percentiles (5th, 25th, 50th, 75th, 95th) de max drawdown
  - Verificación: 95th percentile DD < 25%

- [ ] **Walk-Forward Analysis**
  - Train: 60% histórico
  - Test: 40% forward
  - Output: OOS performance similar a IS (no overfitting)
  - Verificación: OOS Sharpe > 0.8

- [ ] **Documentación completa**
  - Archivo: `BACKTEST_REPORT.md`
  - Secciones:
    - Metodología (qué datos, qué período)
    - Resultados (métricas principales)
    - Comparación V1 vs V2
    - Conclusiones (es Motor V2 listo?)
    - Limitaciones (qué asume)

### Entregable Final
```
✅ `/data/historical/` con 3 pares + 3 meses cada uno
✅ Backtest Engine ejecutable
✅ Archivo: `BACKTEST_RESULTS.json` con todas las métricas
✅ Documento: `BACKTEST_REPORT.md` (explicación completa)
✅ npm run build → PASS
✅ npm run dev → backtest accessible
```

### Criterio de Aceptación
- Motor V2 muestra ≥15% mejora vs V1 (Profit Factor o Win Rate)
- Max Drawdown < 20%
- Sharpe Ratio > 1.0
- No hay look-ahead bias en backtest

---

## ESPECIALISTA 3: DATA INTEGRATION (Ventana 7)

### Responsabilidad
Conectar APIs reales, almacenar datos históricos, pipelines.

### Deliverables Requeridos

#### ✅ TIER 1 - CRÍTICO

- [ ] **Broker API Interface diseñada**
  - Archivo: `/app/engine/integrations/brokerAPI.ts` (interface definition)
  - Métodos requeridos:
    ```typescript
    interface BrokerAPI {
      connect(credentials): Promise<void>
      getSpread(pair): Promise<number>
      getVolume(pair): Promise<number>
      getBalance(): Promise<number>
      getDrawdown(): Promise<number>
      getPositions(): Promise<Position[]>
      getCandles(pair, timeframe, count): Promise<Candle[]>
    }
    ```
  - Verificación: Interfaz clara, type-safe

- [ ] **Primer Broker conectado**
  - Elegir: MT4 O MT5 O Interactive Brokers
  - Implementación: `/app/engine/integrations/brokerAPI.ts`
  - Testing: Conecta, autentica, retorna datos
  - Verificación: `console.log(broker.getBalance())` retorna número real

- [ ] **Database Schema definido**
  - Archivo: `/app/engine/storage/historicalData.ts`
  - Tablas:
    ```sql
    spreads (pair, timestamp, bid, ask)
    volumes (pair, timestamp, volume)
    atr_cache (pair, timeframe, atr_value, atr_percentile)
    economic_events (timestamp, severity, currency, description)
    ```
  - Verificación: Schema es normalizado, sin redundancia

- [ ] **Data Validation Pipeline**
  - Archivo: `/app/engine/storage/dataValidator.ts` (NUEVO)
  - Validaciones:
    - ✅ Spread > 0
    - ✅ Volume > 0
    - ✅ Timestamp válido (no futuro)
    - ✅ Data no stale (< 60 seg lag)
    - ✅ No duplicate timestamps
  - Output: Logs de qué pasó (accepted/rejected) con razón

- [ ] **Error Handling**
  - Broker disconnects → Log + retry 3x
  - Data invalid → Skip trade, log warning
  - API timeout → Fallback a último data válido
  - Archivo: `/app/engine/integrations/errorHandler.ts` (NUEVO)

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS
  - Errores permitidos: 0

#### 🟡 TIER 2 - IMPORTANTE

- [ ] **Database Connection Pooling**
  - Manage multiple simultaneous queries
  - Connection timeout handling
  - Logging de connection issues

- [ ] **Monitoring & Alerting**
  - Log cuando broker data falta
  - Alert si API respuesta > 5 segundos
  - Dashboard de data quality (% uptime, latency)

- [ ] **Historical Data Backfill**
  - Script para popular database con histórico
  - Soporta: HistData.com format
  - Output: Table llena con 3+ meses de datos

### Entregable Final
```
✅ 3 nuevos archivos: brokerAPI.ts, historicalData.ts, dataValidator.ts
✅ Primer broker funcional (MT4 O IB)
✅ Database schema definido + README con DDL
✅ Error handling completo con logging
✅ npm run build → PASS
✅ Documento: DATA_INTEGRATION.md (arquitectura + guía integración)
```

### Criterio de Aceptación
- Broker API retorna datos válidos (o graceful fallback)
- Database almacena y recupera datos sin corrupción
- Data validation pipeline bloquea datos inválidos
- Build pasa siempre
- Puedes agregar 2do broker sin refactoring major

---

## ESPECIALISTA 4: DEPLOYMENT (Ventana 8)

### Responsabilidad
Git, deployment a Vercel, testing final.

### Deliverables Requeridos

#### ✅ TIER 1 - CRÍTICO

- [ ] **Testing final en localhost**
  - Comando: `npm run dev`
  - Verificar:
    - ✅ Home page carga en http://localhost:3000
    - ✅ Alertas dashboard funciona
    - ✅ Bot panel funciona
    - ✅ Resultados page funciona
    - ✅ No errors en browser console
    - ✅ No TypeScript errors en terminal
    - ✅ Responsive design OK (mobile + desktop)

- [ ] **Git Commits organizados**
  - Commits por tarea (no "fix", no "update")
  - Mensaje format: `[COMPONENT] brief description`
  - Ejemplos:
    - `[MOTOR] implement consensus weighting v2`
    - `[GATES] add liquidity validator`
    - `[BACKTEST] add Monte Carlo analysis`
    - `[DEPLOY] ready for vercel launch`

- [ ] **Build final**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS (3.8-4.2s)
  - Verificar:
    - ✅ 39/39 routes prerendered
    - ✅ 0 compilation errors
    - ✅ 0 warnings (optional: ok si warnings minor)

- [ ] **Git Push → Vercel**
  - Comando: `git push origin main`
  - Vercel auto-deploys
  - Verificar: Deployment SUCCESS en vercel.com dashboard

- [ ] **Vercel Test**
  - Ir a: https://carvipix.vercel.app (O tu domain)
  - Verificar:
    - ✅ Home page carga
    - ✅ No errors en network tab
    - ✅ Responde en < 3 segundos
    - ✅ Production build, no dev warnings

- [ ] **Environment Variables setup**
  - `.env.local` (local dev) con:
    - BROKER_API_KEY=xxx
    - CALENDAR_API_KEY=xxx
    - DATABASE_URL=xxx
  - Vercel secrets set con credenciales
  - Verificar: `npm run dev` accede sin errors

#### 🟡 TIER 2 - IMPORTANTE

- [ ] **Monitoring/Logging**
  - Access Vercel logs
  - Monitor errors (if any)
  - Check performance metrics
  - Screenshot dashboard y guardar

- [ ] **Performance Report**
  - Build time: 3.8s ✅
  - Route prerendering: 39/39 ✅
  - Bundle size: No explosions
  - First Contentful Paint: <2s
  - Document: `DEPLOYMENT_REPORT.md`

### Entregable Final
```
✅ localhost testing PASS
✅ npm run build PASS
✅ npm run dev PASS
✅ Git commits organized + messages clear
✅ git push → Vercel PASS
✅ Vercel live URL funciona
✅ Environment variables set
✅ Documento: DEPLOYMENT_REPORT.md (build times, metrics)
```

### Criterio de Aceptación
- Build pasa SIEMPRE
- Vercel deployment SUCCESS
- Production URL accesible y rápida
- 0 console errors en live
- Environment variables correctas

---

## RESUMEN DE ENTREGAS POR FECHA

### EOD Viernes 4 de Julio
- [ ] Backtesting Specialist: Histórico descargado + 1er backtest ejecutado
- [ ] Deployment: Local testing completo, lista para git push
- [ ] Gates: Broker API interface diseñada

### EOD Lunes 7 de Julio
- [ ] Backtesting: Backtest V2 vs V1 completo + report
- [ ] Data Integration: Primer broker conectado
- [ ] Gates: ATR calculator implementado
- [ ] Deployment: Git push → Vercel LIVE

### EOD Viernes 11 de Julio
- [ ] Gates: Economic calendar conectado, correlation matrix
- [ ] Backtesting: Monte Carlo + Walk-Forward analysis
- [ ] Data Integration: Database con 3 meses histórico backfilled
- [ ] All: Final polish + testing

---

## CHECKLIST DE ACEPTACIÓN FINAL

### Para GATES Specialist
- [ ] `npm run build` → PASS
- [ ] Broker API retorna datos reales (o mock graceful)
- [ ] ATR calculator retorna 20-período y 200-percentile
- [ ] Economic calendar función implementada
- [ ] Todos los 5 gates validando con datos reales
- [ ] Documento: GATES_IMPLEMENTATION.md

### Para BACKTESTING Specialist
- [ ] Histórico 3+ meses descargado
- [ ] Backtest engine ejecutable y genera trades
- [ ] Métricas: WinRate, ProfitFactor, Sharpe, MaxDD
- [ ] V2 vs V1 comparación muestra ≥15% mejora
- [ ] Monte Carlo analysis ejecutable
- [ ] Documento: BACKTEST_REPORT.md

### Para DATA INTEGRATION
- [ ] Broker API interface definida
- [ ] Primer broker conectado y funcionando
- [ ] Database schema diseñado
- [ ] Data validation pipeline implementado
- [ ] Error handling completo
- [ ] Documento: DATA_INTEGRATION.md

### Para DEPLOYMENT
- [ ] `npm run build` → PASS
- [ ] `npm run dev` → PASS (localhost)
- [ ] Git commits organized
- [ ] `git push` → Vercel PASS
- [ ] Production URL accesible
- [ ] Environment variables set
- [ ] Documento: DEPLOYMENT_REPORT.md

---

## DIRECTOR: FINAL CHECK

Antes de LAUNCHZAR el MVP a producción, verificar que TODOS tienen ✅:

```
GATES SPECIALIST:
✅ Broker API funciona
✅ ATR calculator funciona
✅ Gates validados
✅ Build PASS

BACKTESTING:
✅ Backtest ejecutado
✅ Métricas calculadas
✅ V2 mejor que V1 (≥15%)
✅ Report documentado

DATA INTEGRATION:
✅ Primer broker conectado
✅ Database schema ready
✅ Data validation OK
✅ Error handling OK

DEPLOYMENT:
✅ Local testing PASS
✅ Build PASS
✅ Vercel live PASS
✅ Prod URL funciona

MOTOR:
✅ TypeScript: 0 errores
✅ Build: 3.8s
✅ Routes: 39/39 prerendered
✅ Console: 0 errors
```

**Si TODOS tienen ✅ en todo, entonces:** 🚀 **LANZA MVP A PRODUCCIÓN**

---

**Firmado:** Director  
**Fecha:** 3 de Julio 2026
