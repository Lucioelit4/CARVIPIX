# 📋 DELIVERABLES MVP v2 — CHECKLIST POR ESPECIALISTA Y NIVEL

**Para el Director:** Verifica estos deliverables por nivel antes de declarar "DONE".

---

## ESPECIALISTA 1: GATES SPECIALIST (Ventana 5)

### Responsabilidad
Conectar datos REALES del broker para **NIVEL 1** (Alertas 100% funcional).

### Deliverables NIVEL 1 - CRÍTICO (MVP bloqueado sin esto)

- [ ] **Broker API Connector implementado**
  - Archivo: `/app/engine/integrations/brokerAPI.ts`
  - Funciones: `connect()`, `getSpread()`, `getVolume()`, `getBalance()`, `getPositions()`
  - Output: Datos REALES del broker (no -1 mocks)
  - Testing: Conecta exitosamente a broker
  - Verificación: Console muestra valores reales

- [ ] **ATR Calculator funcionando**
  - Archivo: `/app/engine/calculations/atrCalculator.ts`
  - Funciones: `calculateATR(periods, candles)`, `getATRPercentile()`
  - Output: Números reales (ej: ATR=145.3 pips XAUUSD)
  - Testing: Calcula sin errores
  - Verificación: ✅ NIVEL 1 Gates validan con datos reales

- [ ] **Safety Gates validando con datos REALES**
  - Archivo: `/app/engine/core/safetyGates.ts`
  - Cambio: Reemplazar -1 placeholders con datos broker
  - Verificación: Todos 5 gates retornan valores REALES
  - Testing: Cada gate valida correctamente

- [ ] **Alertas Dashboard muestra datos REALES**
  - `/app/alertas/page.tsx` conectada
  - Datos vienen del motor (no mocks)
  - Gráfica actualiza con alertas reales
  - Verificación: ✅ NIVEL 1 Alertas funciona 100%

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS (3.8-4.2s)
  - Errores permitidos: 0
  - Verificación: ✅ Deploy ready

### Deliverables NIVEL 2 - IMPORTANTE (Mejora Gates)

- [ ] **Economic Calendar API conectado**
  - Archivo: `/app/engine/integrations/economicCalendar.ts`
  - Funciones: `getNextEvent()`, `getEventSeverity()`
  - Output: Eventos reales O mock gracefully
  - Verificación: News Gate puede validar

- [ ] **Correlation Matrix implementado**
  - Archivo: `/app/engine/calculations/correlationMatrix.ts`
  - Calcula Pearson correlation 100+ candles
  - Output: Matriz válida
  - Verificación: Correlation Gate puede validar

- [ ] **Error Handling implementado**
  - Broker timeout → fallback graceful
  - Calendar API fail → mark unavailable
  - Logging: Qué falló y por qué
  - Verificación: Sistema no crashea

### Entregable Final
```
✅ 3-4 nuevos archivos: brokerAPI.ts, atrCalculator.ts, economicCalendar.ts
✅ safetyGates.ts actualizado con datos REALES
✅ Alertas Dashboard funciona con datos reales
✅ npm run build PASS
✅ npm run dev sin errors
✅ Documento: GATES_IMPLEMENTATION.md
```

### Criterio de Aceptación NIVEL 1
- ✅ Broker API retorna datos REALES (no -1)
- ✅ ATR calculator funciona
- ✅ Gates validan con datos reales
- ✅ Alertas Dashboard muestra alertas reales
- ✅ Build pasa SIEMPRE

---

## ESPECIALISTA 2: BACKTESTING SPECIALIST (Ventana 6)

### Responsabilidad
Validar Motor V2 para **NIVEL 1** (Resultados 100% funcional + Backtest).

### Deliverables NIVEL 1 - CRÍTICO

- [ ] **Histórico descargado (3 pares)**
  - Pares: EURUSD, GBPUSD, XAUUSD
  - Fuente: HistData.com (FREE)
  - Formato: 1-min bar quotes (OHLCV)
  - Período: 3 meses mínimo (6 recomendado)
  - Ubicación: `/data/historical/`
  - Verificación: 3 archivos CSV con datos válidos

- [ ] **Backtest Engine ejecutable**
  - Script: `npm run backtest` O endpoint en dev
  - Input: Histórico + Motor V2
  - Output: Trades con entry/exit/PnL
  - Verificación: Genera ≥100 trades en 3-month período

- [ ] **Métricas calculadas (TODOS)**
  - Win Rate: % traders ganadores
  - Profit Factor: Ganancia/Pérdida
  - Max Drawdown: Pérdida máxima
  - Sharpe Ratio: Retorno/Volatilidad
  - Output: Dashboard O JSON
  - Verificación: Valores válidos

- [ ] **Comparación V1 vs V2**
  - Backtest Motor V1 con mismos datos
  - Backtest Motor V2 con mismos datos
  - Tabla comparativa con % mejora
  - Verificación: V2 mejora ≥15% (Profit Factor O Win Rate)

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS
  - Errores permitidos: 0

### Deliverables NIVEL 2 - IMPORTANTE

- [ ] **Monte Carlo Analysis (1000x)**
  - Resample histórico 1000 veces
  - Output: Percentiles (5th, 25th, 50th, 75th, 95th) DD
  - Verificación: 95th percentile DD < 25%

- [ ] **Walk-Forward Analysis (60/40)**
  - Train: 60% histórico
  - Test: 40% forward
  - Output: OOS performance vs IS (no overfitting)
  - Verificación: OOS Sharpe > 0.8

- [ ] **Documentación completa**
  - Archivo: `BACKTEST_REPORT.md`
  - Secciones: Metodología, Resultados, Comparación, Conclusiones
  - Verificación: Todo documentado

### Entregable Final
```
✅ `/data/historical/` con 3 pares + 3 meses
✅ Backtest Engine ejecutable
✅ Archivo: `BACKTEST_RESULTS.json` (todas las métricas)
✅ Documento: `BACKTEST_REPORT.md` (explicación completa)
✅ npm run build PASS
✅ npm run dev con backtest accessible
```

### Criterio de Aceptación NIVEL 1
- ✅ Motor V2 muestra ≥15% mejora vs V1
- ✅ Max Drawdown < 20%
- ✅ Sharpe Ratio > 1.0
- ✅ Backtest reproducible
- ✅ Build pasa SIEMPRE

---

## ESPECIALISTA 3: DATA INTEGRATION (Ventana 7)

### Responsabilidad
Conectar APIs para **NIVEL 1** (Gates + Alertas) + iniciar **NIVEL 2** (Capital).

### Deliverables NIVEL 1 - CRÍTICO

- [ ] **Broker API Interface diseñada**
  - Archivo: `/app/engine/integrations/brokerAPI.ts`
  - Type-safe, genérica para múltiples brokers
  - Métodos: connect, getSpread, getVolume, getBalance, getPositions, getCandles
  - Verificación: Interfaz clara

- [ ] **Primer Broker conectado (MT4 O IB)**
  - Implementación: `/app/engine/integrations/brokerAPI.ts`
  - Testing: Conecta, autentica, retorna datos
  - Verificación: Datos reales fluyendo

- [ ] **Database Schema definido**
  - Archivo: `/app/engine/storage/historicalData.ts`
  - Tablas: spreads, volumes, atr_cache, economic_events
  - Normalizado, sin redundancia
  - Verificación: Schema válido

- [ ] **Data Validation Pipeline**
  - Archivo: `/app/engine/storage/dataValidator.ts`
  - Validaciones: spread>0, volume>0, timestamp válido, no stale, no duplicates
  - Output: Accept O reject con razón
  - Logging: Qué fue aceptado/rechazado
  - Verificación: Bloquea datos inválidos

- [ ] **Error Handling completo**
  - Broker disconnect → retry 3x, luego fallback
  - Data invalid → skip, log warning
  - API timeout → fallback a último dato válido
  - Archivo: `/app/engine/integrations/errorHandler.ts`
  - Verificación: Sistema no crashea

- [ ] **Build compila sin errores**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS
  - Errores permitidos: 0

### Deliverables NIVEL 2 - IMPORTANTE

- [ ] **Database Connection Pooling**
  - Maneja simultaneous queries
  - Connection timeout handling
  - Logging de issues

- [ ] **Monitoring & Alerting**
  - Log cuando broker data falta
  - Alert si respuesta > 5 segundos
  - Dashboard de data quality (% uptime)

- [ ] **Historical Data Backfill**
  - Script para popular database con histórico
  - Soporta HistData.com format
  - Output: Table con 3+ meses

### Entregable Final
```
✅ 3-4 nuevos archivos: brokerAPI.ts, historicalData.ts, dataValidator.ts, errorHandler.ts
✅ Primer broker funcional
✅ Database schema + README con DDL
✅ Error handling completo
✅ npm run build PASS
✅ Documento: DATA_INTEGRATION.md (arquitectura + guía)
```

### Criterio de Aceptación NIVEL 1
- ✅ Broker API retorna datos REALES
- ✅ Database almacena datos sin corrupción
- ✅ Data validation bloquea invalidos
- ✅ Build pasa SIEMPRE
- ✅ No hay look-ahead bias

---

## ESPECIALISTA 4: DEPLOYMENT (Ventana 8)

### Responsabilidad
Deploy **TODOS los NIVELES** (1-4) en Vercel, controlando acceso.

### Deliverables NIVEL 1 - CRÍTICO

- [ ] **Testing final en localhost**
  - Comando: `npm run dev`
  - Verificar:
    - ✅ Home carga en http://localhost:3000
    - ✅ Alertas Dashboard funciona
    - ✅ Bot Panel funciona
    - ✅ Resultados Page funciona
    - ✅ Todos los módulos NIVEL 1 OK
    - ✅ No errors en browser console
    - ✅ No TypeScript errors

- [ ] **Navegación COMPLETA visible (TODOS niveles)**
  - ✅ NIVEL 1: Totalmente visible y funcional
  - ✅ NIVEL 2: Visible con banner "BETA"
  - ✅ NIVEL 3: Visible con banner "Próximamente"
  - ✅ NIVEL 4: Visible solo si admin
  - Verificación: 18 módulos en nav, solo bloqueados si corresponde

- [ ] **Build final**
  - Comando: `npm run build`
  - Output: ✅ SUCCESS
  - ✅ 39/39 routes prerendered
  - ✅ 0 compilation errors
  - ✅ 0 warnings (minor OK)

- [ ] **Git Push → Vercel**
  - Commits organizados (tag: [MODULE])
  - Mensaje: descriptivo
  - Comando: `git push origin main`
  - Vercel auto-deploys
  - Verificación: Deployment SUCCESS

- [ ] **Vercel Test (Production URL)**
  - URL live accesible
  - ✅ Home carga
  - ✅ No errors en network tab
  - ✅ Responde en < 3 segundos
  - ✅ Production build (no dev warnings)

- [ ] **Environment Variables setup**
  - `.env.local` (local dev) con credentials
  - Vercel secrets set con credenciales
  - Verificación: `npm run dev` accede sin errors

### Deliverables NIVEL 2 - IMPORTANTE

- [ ] **Monitoring/Logging**
  - Acceso Vercel logs
  - Monitor errores
  - Check performance metrics

- [ ] **Performance Report**
  - Build time: 3.8s ✅
  - Routes prerendered: 39/39 ✅
  - Bundle size: Sin explosiones
  - FCP: < 2 segundos
  - Documento: `DEPLOYMENT_REPORT.md`

### Entregable Final
```
✅ Localhost testing PASS
✅ npm run build PASS (0 errors)
✅ npm run dev PASS
✅ Git commits organized + messages clear
✅ git push → Vercel PASS
✅ Vercel live URL funciona
✅ Environment variables set
✅ TODOS los módulos (1-4) en nav
✅ Acceso controlado por nivel
✅ Documento: DEPLOYMENT_REPORT.md
```

### Criterio de Aceptación NIVEL 1
- ✅ Build pasa SIEMPRE
- ✅ Vercel deployment SUCCESS
- ✅ Production URL accesible
- ✅ 0 console errors
- ✅ TODOS los módulos visibles (según nivel)
- ✅ Acceso controlado por auth

---

## RESUMEN DE ENTREGAS POR FECHA

### EOD Viernes 4 de Julio
- [ ] Backtesting: Histórico descargado + 1er backtest
- [ ] Deployment: Local testing completo
- [ ] Gates: Broker interface diseñada

### EOD Lunes 7 de Julio
- [ ] Backtesting: V2 vs V1 completo + report
- [ ] Data Int: Primer broker conectado
- [ ] Gates: ATR calculator implementado
- [ ] Deployment: Git push → Vercel LIVE

### EOD Viernes 11 de Julio
- [ ] Gates: Economic Calendar + Correlation
- [ ] Backtesting: Monte Carlo + Walk-Forward
- [ ] Data Int: Database con 3 meses backfilled
- [ ] All: Final polish + testing

---

## CHECKLIST DE ACEPTACIÓN FINAL (Director verifica)

### Para GATES Specialist
- [ ] `npm run build` PASS
- [ ] Broker API retorna datos REALES
- [ ] ATR calculator retorna valores correctos
- [ ] Todos 5 gates validan con datos REALES
- [ ] Alertas Dashboard funciona
- [ ] Documento GATES_IMPLEMENTATION.md

### Para BACKTESTING Specialist
- [ ] Histórico 3+ meses descargado
- [ ] Backtest V2 ejecutable
- [ ] Métricas calculadas (todas)
- [ ] V2 mejor que V1 (≥15%)
- [ ] Monte Carlo + Walk-Forward ejecutables
- [ ] Documento BACKTEST_REPORT.md

### Para DATA INTEGRATION
- [ ] Broker API interface definida
- [ ] Primer broker conectado funcional
- [ ] Database schema diseñado
- [ ] Data validation pipeline OK
- [ ] Error handling completo
- [ ] Documento DATA_INTEGRATION.md

### Para DEPLOYMENT
- [ ] `npm run build` PASS
- [ ] `npm run dev` PASS (localhost)
- [ ] Git commits organized
- [ ] git push → Vercel PASS
- [ ] Production URL accesible
- [ ] Todos los módulos en nav (NIVEL 1-4)
- [ ] Acceso controlado por nivel
- [ ] Documento DEPLOYMENT_REPORT.md

---

## DIRECTOR: FINAL CHECK PRE-LAUNCH

Antes de **lanzar MVP a producción**, verificar que TODOS tienen ✅:

```
NIVEL 1 (✅ LISTO):
  ✅ Motor V2 funciona 100%
  ✅ Gates validan con datos REALES
  ✅ Alertas Dashboard = datos reales
  ✅ Bot Panel = datos reales
  ✅ Resultados Page = equity real
  ✅ Backtest engine executable
  ✅ Header + Nav = COMPLETA
  ✅ Build PASS

NIVEL 2 (🟡 BETA):
  ✅ Visible en nav
  ✅ Banner "BETA" claro
  ✅ CTAs funcionales
  ✅ No crashea al acceder

NIVEL 3 (🔜 PRÓXIMAMENTE):
  ✅ Visible en nav
  ✅ Banner "Próximamente" claro
  ✅ CTAs: "Notifícate" funcionales
  ✅ No quebrantos UI al acceder

NIVEL 4 (🔐 ADMIN):
  ✅ Visible solo si admin
  ✅ Auth gates funcionan
  ✅ No accessible a regular users

GENERAL:
  ✅ Navegación COMPLETA visible
  ✅ npm run build PASS
  ✅ npm run dev PASS
  ✅ 0 console errors
  ✅ Vercel deploy PASS
  ✅ URL live funciona
  ✅ Parece plataforma profesional COMPLETA
```

**Si TODOS están ✅, entonces:** 🚀 **LANZA MVP A PRODUCCIÓN**

```bash
# COMANDO FINAL
git add .
git commit -m "MVP FINAL: Arquitectura Completa - Niveles 1-4 Implementados"
git push origin main
# Vercel auto-deploys
# 🎉 MVP LIVE
```

---

**Firmado:** Director  
**Fecha:** 3 de Julio 2026 (Revisado v2)
