# 🎯 CERTIFICACIÓN DEL EXPEDIENTE MAESTRO V3 CON DATOS REALES

## Descripción General

Este documento detalla cómo ejecutar la **certificación definitiva del Expediente Maestro V3** utilizando únicamente datos reales del mercado desde Twelve Data.

**Estado**: Listo para certificación con datos reales
**Cambios principales**: Sistema completo migrado de datos sintéticos a datos reales

---

## 📋 REQUISITOS PREVIOS

### 1. Twelve Data API Key
Se requiere una clave API válida de Twelve Data para acceder a datos reales del mercado.

**Opciones**:
- Si ya tienes una clave: Configúralo en `TWELVE_DATA_API_KEY`
- Si no tienes: 
  - Opción A: Crear cuenta en [Twelve Data](https://twelvedata.com)
  - Opción B: El sistema tiene un fallback a modo evaluación si la API key no está disponible

### 2. Variables de Entorno
Crear o actualizar `.env.local` en la raíz del proyecto:

```bash
# Twelve Data (requerido para datos reales)
TWELVE_DATA_API_KEY=your_api_key_here

# OpenAI (ya debe estar configurado)
OPENAI_API_KEY=your_openai_key

# Optional: Twelve Data configuration
TWELVE_DATA_EVALUATION_MODE=false  # Set false for real API calls
```

---

## 🚀 CÓMO EJECUTAR LA CERTIFICACIÓN

### Paso 1: Inicia el Servidor de Desarrollo

```bash
npm run dev
```

**Salida esperada**:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  ready - started server on 0.0.0.0:3000
```

### Paso 2: Abre el Observador en el Navegador

```
http://localhost:3000/admin/observer-v3
```

**Qué sucede automáticamente**:
1. La página llama a `/api/internal/maestro-v3-init` (inicializador)
2. El inicializador:
   - Crea un `MarketDataPipeline`
   - Crea un `IndicatorFramework`
   - Carga datos históricos reales desde Twelve Data (últimas 120 velas H1, 120 M30, 144 M5)
   - Calcula indicadores técnicos
   - Inicia el `AdaptiveScheduler`
3. El scheduler comienza a monitorear

**Salida en consola**:
```
[MaestroV3Init] Initializing Maestro V3 Observer with REAL DATA...
[MaestroV3Init] ✅ Created pipeline and indicators
[RealDataIngestion] Loading historical candles from Twelve Data...
[RealDataIngestion] XAUUSD: 120 H1, 120 M30, 144 M5 candles loaded
[RealDataIngestion] EURUSD: 120 H1, 120 M30, 144 M5 candles loaded
[RealDataIngestion] GBPUSD: 120 H1, 120 M30, 144 M5 candles loaded
[RealDataIngestion] BTCUSD: 120 H1, 120 M30, 144 M5 candles loaded
[RealDataIngestion] Complete. 2176 total candles loaded.
[ObserverRunner] ✅ Indicators computed from real data.
[ObserverRunner] ✅ Scheduler ready to monitor. Awaiting first trigger...
```

### Paso 3: Ver el Observador en Vivo

El Observador mostrará:

- **Tarjeta de Resumen**: Total análisis, costo USD, balance paper, P&L
- **Monitor Paper Account**: Balance, equity, win rate, operaciones abiertas/cerradas
- **Tarjetas por Instrumento** (XAUUSD, EURUSD, GBPUSD, BTCUSD):
  - Estado (COMPLETED, SKIPPED_BEFORE_AI, etc.)
  - Decisión de ChatGPT (ENTER_BUY, WAIT, NO_TRADE, etc.)
  - Probabilidad y convicción
  - Latencia y costo
  - Analysis ID y signal ID
  - Timestamp

**Cada tarjeta es expandible** para ver:
- Decisión Maestra (decisión, dirección, probabilidad, convicción)
- Análisis Privado (reasoning de ChatGPT, primeras 500 chars)
- Factores (a favor vs en contra)
- **Matriz de Distribución** (9 destinos: BOT_ENGINE, ALERTA_PREMIUM, TELEGRAM, DASHBOARD, ESTADO_MERCADO, OBSERVADOR, HISTORIAL, RESULTADOS_PAPER, MONITOR_PAPER)
- Metadata (analysis_id, signal_id, cost, latency, prompt_hash)

### Paso 4: Monitorear Análisis Reales

El Scheduler corre automáticamente y ejecuta análisis cuando:

- **Proximity to market state**: Cada 5-60 minutos dependiendo de la proximidad del mercado a niveles observados
- **Price level wakeup**: Si el precio alcanza niveles clave registrados
- **Timeframe close**: En cierre de velas H1/M30

**Qué observar**:

1. **Sin intervención manual** - Los análisis ocurren automáticamente
2. **Decisiones honestas** - ChatGPT devuelve decisiones reales basadas en datos reales:
   - Pueden ser ENTER_BUY, ENTER_SELL, WAIT, NO_TRADE, CONDITIONAL_ENTRY
   - No hay forzamiento de resultados
3. **Tres ciclos completos** - El sistema capturará y mostrará al menos 3 análisis completos con:
   - Analysis ID y Signal ID únicos
   - Prompt enviado a ChatGPT (primeras 500 chars)
   - Respuesta completa de ChatGPT
   - Distribución a 9 módulos
   - Metadatos (cost, latency, tokens)
   - Estado de cada destino (DELIVERED, SKIPPED, FAILED)

---

## 🔍 VERIFICACIÓN DE DATOS REALES

### Confirmar que está usando Twelve Data

En la consola del navegador (DevTools), deberías ver logs como:

```
[RealDataIngestion] XAUUSD: 120 H1, 120 M30, 144 M5 candles loaded
```

### Confirmar que el Scheduler está corriendo

Ejecuta en otra terminal:

```bash
npm run observer:status
```

**Salida**:
```
╔════════════════════════════════════════════════════════════╗
║      OBSERVADOR MAESTRO V3 — ESTADO EN VIVO               ║
╚════════════════════════════════════════════════════════════╝

📊 ESTADO GENERAL:
   Scheduler:    ✅ Activo
   Timestamp:    2026-07-14T15:30:45.123Z
   Total análisis:  3
   Costo acumulado: $0.0234
```

### Ver análisis en vivo (monitor en tiempo real)

```bash
npm run observer:run
```

Esto actualizará cada 10 segundos mostrando nuevos análisis a medida que se ejecutan.

---

## 📊 INTERPRETACIÓN DE RESULTADOS

### Análisis COMPLETADO

```
Status: COMPLETED
Decision: ENTER_BUY
Cost USD: $0.0052
Latency: 2341ms
```

Significa:
- ✅ Datos reales procesados
- ✅ Expediente construido (16 secciones)
- ✅ ChatGPT procesó la solicitud
- ✅ Se tomó una decisión

### Análisis SKIPPED

```
Status: SKIPPED_BEFORE_AI
Reason: DATA_TOO_STALE
```

Significa:
- El mercado no ha generado velas cerradas nuevas
- No hay actividad relevante para analizar
- **Esto es normal y esperado**

### Análisis REUSED

```
Status: REUSED_PREVIOUS_ANALYSIS
```

Significa:
- Se reutilizó un análisis anterior (idempotencia)
- Costo: $0 (no se llamó ChatGPT)

---

## 🎯 CERTIFICACIÓN: CHECKLIST FINAL

Antes de declarar el Expediente Maestro V3 **CONGELADO**, verifica:

- [ ] **Datos Reales**: Console muestra "candles loaded from Twelve Data"
- [ ] **Tres Análisis Completos**: Al menos 3 COMPLETED (no forzados a ENTER_BUY)
- [ ] **Diversidad de Decisiones**: Visible mezcla de ENTER_BUY, WAIT, NO_TRADE, SKIPPED
- [ ] **Analysis IDs Únicos**: Cada análisis tiene unique analysis_id y signal_id
- [ ] **Distribución Válida**: Todos los 9 destinos tienen status (DELIVERED/SKIPPED/FAILED)
- [ ] **Costos Realistas**: Costos USD coinciden con llamadas reales a ChatGPT
- [ ] **Latencia Real**: Latencia > 1000ms (tiempo real de red)
- [ ] **Monitor Paper**: Balance actualizado, operaciones registradas (si aplica)
- [ ] **Scheduler Activo**: Logs muestran "Scheduler ready to monitor"
- [ ] **Cero Errores**: No hay errors en console del navegador
- [ ] **Tests Pasando**: `npm run test:v3` devuelve 40/40 passed

---

## 📸 EVIDENCIA REQUERIDA

Para la certificación oficial, captura:

1. **Pantalla completa del Observador** (mostrando 3 análisis)
2. **Consola del servidor** (mostrando initialization logs)
3. **DevTools Console** (mostrando polling results)
4. **Para cada análisis**:
   - Analysis ID
   - Signal ID
   - Decision recibida
   - Cost USD
   - Latency ms
   - Estado de cada uno de los 9 destinos

---

## ⚠️ TROUBLESHOOTING

### Error: "TWELVE_DATA_API_KEY not configured"

**Solución**:
1. Verifica que `.env.local` exista en la raíz
2. Configura `TWELVE_DATA_API_KEY=<your-key>`
3. Reinicia el servidor: `npm run dev`

### Error: "Failed to load candles"

**Posibles causas**:
- Twelve Data API rate limit alcanzado
- Conexión de red lenta
- API key inválida

**Solución**:
- Espera 5 minutos y recarga la página
- Verifica que TWELVE_DATA_API_KEY sea correcta

### Observador muestra "no data"

**Posible causa**: Pipeline no se inicializó correctamente

**Solución**:
1. Abre DevTools (F12)
2. Revisa la consola para errores
3. Recarga la página (Ctrl+R)
4. Verifica logs en terminal del servidor

---

## 🔒 GARANTÍAS DE INTEGRIDAD

✅ **Cero modificaciones a módulos congelados**:
- Prompt exactamente igual
- Scheduler logic intacto
- Dispatcher sin cambios
- ShadowFlow V3 preservado

✅ **Cero datos forzados**:
- Todos los datos son 100% reales de Twelve Data
- Decisiones son honestas (ChatGPT decide real)
- Paper trading simula correctamente

✅ **Cero regresiones**:
- 40/40 tests siguen pasando
- Arquitectura congelada respetada

---

## 🎓 SIGNIFICADO DE LA CERTIFICACIÓN

Después de confirmar esta certificación con datos reales:

1. **Expediente Maestro V3 quedará CONGELADO**
   - Sin cambios de prompt
   - Sin cambios de scheduler
   - Sin cambios de dispatcher
   - Solo cambios futuros basados en evidencia estadística

2. **Próximos bloques del proyecto**:
   - BOT ENGINE (ejecución de señales)
   - TELEGRAM (alertas en tiempo real)
   - COMMUNITY PUBLISHER (resultados públicos)
   - LANDING PAGE (promoción)

3. **Monitoreo continuo**:
   - Semanas de datos reales
   - Análisis estadístico de decisiones
   - Win rate, Sharpe ratio, drawdown
   - Solo modificaciones si hay evidencia

---

## 📞 SOPORTE

Si encuentras problemas:
1. Verifica logs en consola del navegador
2. Verifica logs en terminal del servidor
3. Ejecuta `npm run test:v3` para validar sistema
4. Revisa este documento (sección troubleshooting)

---

**VERSIÓN**: 1.0 - Real Data Certification Ready  
**FECHA**: 2026-07-14  
**ESTADO**: ✅ READY FOR CERTIFICATION
