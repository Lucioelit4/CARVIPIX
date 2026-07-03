# 🎯 Recomendación de Proveedor de Datos Real para CARVIPIX

**Documento de Investigación y Análisis**  
**Fecha:** 2026-07-02  
**Objetivo:** Evaluar y recomendar el mejor proveedor de datos de mercado para alimentar el bot en modo lectura

---

## 📋 Resumen Ejecutivo

Después de investigar 5 proveedores principales, **recomendamos INICIAR CON TWELVE DATA** como proveedor principal, con **Alpha Vantage** como alternativa de bajo costo.

### Por qué Twelve Data:
- ✅ Cobertura completa de los 4 activos requeridos
- ✅ Latencia ultra-baja (~170ms)
- ✅ Soporte para todas las temporalidades (1H, 45M, 5M)
- ✅ Datos históricos amplios (20+ años)
- ✅ WebSocket en tiempo real
- ✅ SLA 99.95%

---

## 🔍 COMPARATIVA DETALLADA DE PROVEEDORES

### 1. **TWELVE DATA** ⭐ RECOMENDADO (Opción Principal)

#### Cobertura de Activos:
| Activo | Disponible | Tipo | Cobertura |
|--------|-----------|------|-----------|
| XAUUSD | ✅ | Commodity | Sí, incluido en forex/commodities |
| EURUSD | ✅ | Forex | 2,000+ pares forex |
| GBPUSD | ✅ | Forex | Incluido en pares mayores |
| BTCUSD | ✅ | Cripto | 4,800+ pares cripto |

#### Características:
- **Temporalidades Soportadas:** 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
  - ✅ 1H disponible (60min)
  - ✅ 45M disponible (custom interval)
  - ✅ 5M disponible
- **Datos Históricos:** Acceso completo a datos históricos (20+ años típicamente)
- **Latencia:** ~170ms promedio para WebSocket (ultra-baja)
- **Actualización:** Tiempo real via WebSocket, con fallback a REST API

#### Precios (Individual/Personal):
```
Tier          Costo/Mes    API Credits    WS Credits    Markets    SLA
────────────────────────────────────────────────────────────────────────
Free/Basic         $0         8 (800/día)    8 trial       3         -
Grow              $79         377           8 trial       20+       No
Pro              $229       1,597          1,500         70+      No
Ultra            $999      10,946         10,000        84+      99.95%
```

**Recomendación:** Plan **Pro ($229/mes)** o **Ultra ($999/mes)**
- Pro: Suficiente para operaciones normales
- Ultra: Recomendado para backtesting y análisis intensivo

#### Pros:
- ✅ Cobertura global excepcional (100k+ símbolos)
- ✅ Latencia muy baja
- ✅ SLA 99.95% en planes premium
- ✅ WebSocket nativo para datos en tiempo real
- ✅ SDKs en 15+ lenguajes
- ✅ Soporte dedicado en planes Pro+
- ✅ Datos de referencia completos
- ✅ Indicadores técnicos incluidos

#### Contras:
- ❌ Costo más elevado comparado con Alpha Vantage
- ❌ Plan Free/Grow muy limitados
- ❌ Requiere plan pagado para características profesionales

#### Backtesting:
✅ **Excelente** - Acceso a datos históricos completos, ideal para backtesting

#### Escalabilidad:
- Plan Pro: 1,597 créditos API/mes (créditos por minuto de conexión, no requests discretos)
- Plan Ultra: 10,946 créditos API/mes (créditos por minuto de conexión)

**Nota Importante:** Los créditos en Twelve Data se consumen por minuto de conexión WebSocket, no como requests individuales. Un minuto de WebSocket con múltiples datos consume 1 crédito. Esto permite mucho mayor throughput que APIs basadas en requests discretos.

---

### 2. **ALPHA VANTAGE** 🥉 ALTERNATIVA (Opción de Bajo Costo)

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | ✅ | Spot: GOLD/XAU, Historical: GOLD_SILVER_HISTORY |
| EURUSD | ✅ | FX_INTRADAY, FX_DAILY, FX_WEEKLY, FX_MONTHLY |
| GBPUSD | ✅ | Forex pairs standard |
| BTCUSD | ✅ | CRYPTO_INTRADAY, DIGITAL_CURRENCY_DAILY |

#### Características:
- **Temporalidades Soportadas:** 
  - Intraday: 1min, 5min, 15min, 30min, 60min
  - Daily, Weekly, Monthly
  - ✅ 1H disponible (60min)
  - ✅ 5M disponible
  - ⚠️ 45M: NO disponible nativamente (necesita interpolación)
- **Datos Históricos:** 20+ años completos
- **Latencia:** Buena (HTTP REST, sin WebSocket)
- **Actualización:** Retrasada (free), realtime (premium)

#### Precios:
```
Tier          Costo      Límites               Características
────────────────────────────────────────────────────────────────
Free          $0         5 requests/min        Datos básicos
             ($0)        25-100 requests/día   Demo gratuito (varía)
Premium       -           Bajo demanda         Custom plans
```

**Nota:** Alpha Vantage ofrece principalmente un plan gratuito con limitaciones estrictas. El límite gratuito es aproximadamente 25-100 requests/día según el tipo de datos solicitados.

#### Pros:
- ✅ **Completamente gratuito** (plan básico)
- ✅ No requiere tarjeta de crédito
- ✅ Excelente para prototipos y testing
- ✅ 50+ indicadores técnicos
- ✅ Cobertura mundial
- ✅ Soporte a commodities (oro, plata, petróleo)
- ✅ Datos históricos abundantes

#### Contras:
- ❌ **Límite estricto:** 5 requests/min
- ❌ **25-100 requests/día máximo** en free tier (según tipo de datos)
- ❌ 15-min delayed data en free (no realtime)
- ❌ **NO 45-minute timeframe** nativamente (requiere interpolación)
- ❌ Sin WebSocket (solo REST)
- ❌ API lenta en horas pico
- ❌ Rate limiting muy agresivo

#### Backtesting:
✅ **Bueno** - Datos históricos completos, pero limitado por API rate

#### Escalabilidad:
- Free: 25-100 requests/día = muy limitado para multi-timeframe
- Custom plans: Mejor escalabilidad (bajo demanda)

#### Caso de Uso:
- 📍 Excelente para **desarrollo inicial y testing**
- 📍 **NO recomendado para producción** sin plan premium

---

### 3. **OANDA** 🟡 OPCIÓN SECUNDARIA (Forex/Commodities)

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | ✅ | Aunque OANDA es primarily forex |
| EURUSD | ✅ | 48 forex pairs (todos los majors) |
| GBPUSD | ✅ | Par mayor disponible |
| BTCUSD | ⚠️ | Limitado/No estándar |

#### Características:
- **REST API v20** (moderna y bien documentada)
- **Temporalidades nativas:** S5, S10, S15, S30, M1, M4, M5, M15, M30, H1, H4, D, W, M
  - ✅ 1H disponible (H1)
  - ✅ 5M disponible (M5)
  - ⚠️ 45M: No es nativa, puede construirse localmente combinando M5 (9 velas = 45 minutos) o M15 (3 velas = 45 minutos)
- **Datos Históricos:** Excelentes para forex
- **Latencia:** Muy baja (conectado a market)

#### Precios:
- **Free Demo Account:** Completo (para testing)
- **Live Account:** Requiere depósito mínimo
  - Spreads competitivos
  - Comisiones variables

#### Pros:
- ✅ Excelente para forex (especializado)
- ✅ Latencia muy baja
- ✅ API REST bien documentada
- ✅ Account de demo gratuita completa
- ✅ Conexión MT4 opcional
- ✅ 45M puede construirse localmente desde M5/M15

#### Contras:
- ❌ **Primariamente broker, no data provider**
- ❌ Requiere cuenta trading (no solo datos)
- ❌ Cripto débil/no soportado
- ❌ Commodities limitados
- ❌ Depósito mínimo en live account
- ❌ Enfoque en trading en vivo, no backtesting

#### Backtesting:
⚠️ **Limitado** - Orientado a trading vivo, no ideal para backtesting masivo

#### Caso de Uso:
- 📍 Si es primarily **forex trading** (EURUSD, GBPUSD)
- 📍 **NO para cripto o multi-asset**

---

### 4. **BINANCE** 📊 OPCIÓN PARA CRIPTO

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | ❌ | No soportado |
| EURUSD | ❌ | No soportado |
| GBPUSD | ❌ | No soportado |
| BTCUSD | ✅ | Excelente soporte |

#### Características:
- **Especializado en:** Criptomonedas exclusivamente
- **Temporalidades:** 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
  - ✅ 1H disponible
  - ✅ 5M disponible
  - ⚠️ 45M: NO disponible
- **Datos Históricos:** Limitados a últimos 3 años típicamente
- **API Gratuita:** Sí (con límites razonables)

#### Precios:
- **Free:** API pública sin costo
- **Premium:** No existe modelo premium de datos

#### Pros:
- ✅ **Gratuito**
- ✅ Excelente para cripto
- ✅ Baja latencia
- ✅ WebSocket nativo

#### Contras:
- ❌ **SOLO cripto** - sin forex ni commodities
- ❌ NO soporta XAUUSD, EURUSD, GBPUSD
- ❌ Datos históricos limitados
- ❌ Rate limits restrictivos

#### Backtesting:
⚠️ **Limitado** - Datos históricos solo 3 años

#### Conclusión:
❌ **NO recomendado como principal** para CARVIPIX (solo 1 de 4 activos)

---

### 5. **MASSIVE.COM** (ex-Polygon.IO) 🟢 OPCIÓN EMERGENTE

**Estado:** Polygon.io ahora redirige a Massive.com - plataforma unificada de datos de mercado

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | ⚠️ | Cobertura de commodities limitada en free tier |
| EURUSD | ✅ | Forex via Massive marketplace |
| GBPUSD | ✅ | Forex via Massive marketplace |
| BTCUSD | ✅ | Cripto completo |

#### Características:
- **Plataforma:** Marketplace de datos con múltiples proveedores
- **APIs:** REST y WebSocket disponibles
- **Temporalidades:** 1min, 5min, 15min, 30min, 1hour, daily, etc.
  - ✅ 1H disponible
  - ✅ 5M disponible
  - ⚠️ 45M: No está listado nativamente (requiere construcción local)
- **Datos Históricos:** Disponibles según proveedor seleccionado
- **Latencia:** Varía según fuente de datos

#### Precios:
- **Modelo:** Marketplace de proveedores independientes
- **Free Tier:** Acceso limitado (data sample)
- **Escalable:** Planes personalizados por data source

#### Pros:
- ✅ Plataforma unificada (acceso a múltiples proveedores)
- ✅ Flexible: Elige solo los datos que necesitas
- ✅ Acceso a nuevas fuentes de datos constantemente
- ✅ WebSocket soportado
- ✅ API moderna y bien documentada

#### Contras:
- ⚠️ Nuevo modelo (menos referencias en producción)
- ⚠️ Commodities débil (especialmente XAUUSD)
- ⚠️ Documentación en transición (cambio Polygon → Massive)
- ⚠️ No SLA claro para todos los proveedores
- ⚠️ 45M requiere construcción local
- ⚠️ Pricing aún en definición para muchos activos

#### Backtesting:
⚠️ **Limitado** - Depende del proveedor de datos seleccionado

#### Caso de Uso:
- 📍 Considera para **futura exploración** una vez estable
- 📍 **NO para producción inmediata** (plataforma en transición)

---

## 📊 TABLA COMPARATIVA GENERAL

```
CRITERIO              TWELVE DATA    ALPHA VANTAGE    OANDA        BINANCE      MASSIVE
──────────────────────────────────────────────────────────────────────────────────────
XAUUSD                ✅ Excelente   ✅ Bueno         ✅ Bueno     ❌ No        ⚠️ Débil
EURUSD                ✅ Excelente   ✅ Bueno         ✅ Excelente ❌ No        ✅ Sí
GBPUSD                ✅ Excelente   ✅ Bueno         ✅ Excelente ❌ No        ✅ Sí
BTCUSD                ✅ Excelente   ✅ Bueno         ⚠️ Limitado  ✅ Excelente ✅ Excelente

1H (60m)              ✅ Nativa      ✅ Nativa        ✅ Nativa    ✅ Nativa    ✅ Nativa
45M (45m)             ✅ Custom      ❌ No (interp.)  ⚠️ Local     ❌ No        ⚠️ Local
5M (5m)               ✅ Nativa      ✅ Nativa        ✅ Nativa    ✅ Nativa    ✅ Nativa

Datos Históricos      ✅ 20+ años    ✅ 20+ años      ✅ Amplios   ⚠️ 3 años    ⚠️ Variable
Latencia              ✅ 170ms       ⚠️ HTTP          ✅ Muy baja  ✅ Muy baja  ⚠️ Variable
WebSocket Real-time   ✅ Sí          ❌ No            ✅ Opcional  ✅ Sí        ✅ Sí
SLA                   ✅ 99.95%      ⚠️ No premium    ✅ Bueno     ⚠️ No formal ⚠️ En proceso

Costo Mensual         $229-999       $0 (Free)        Variable    $0 (Free)    Variable
Costo Anual           $2,748-11,988  $0               Variable    $0           Variable

Backtesting           ✅ Excelente   ⚠️ Limitado      ⚠️ Limitado  ⚠️ Limitado  ⚠️ Limitado
Prod Ready            ✅ Sí          ❌ Solo test     ✅ Solo FX   ⚠️ Solo cr   ⚠️ Beta
Rate Limiting         ✅ Generoso    ❌ Muy strict    ✅ Bueno     ✅ Razonable ⚠️ Variable
Documentación         ✅ Excelente   ✅ Excelente     ✅ Excelente ✅ Excelente ⚠️ En trans
```

---

## 🎯 ESTRATEGIA RECOMENDADA

### FASE 1: DESARROLLO & TESTING (Ahora)
```
Proveedor: ALPHA VANTAGE (Gratuito)
├─ Ventaja: $0/mes, ideal para prototipos
├─ Limitación: 25-100 requests/día
├─ Duración: 1-2 meses de desarrollo
└─ Transición: Fácil migración a Twelve Data
```

### FASE 2: PRE-PRODUCCIÓN (1-3 meses)
```
Proveedor: TWELVE DATA Pro ($229/mes)
├─ Ventaja: Balanceado costo/performance
├─ Capacidad: 1,597 créditos/mes (por minuto de conexión)
├─ Datos: Tiempo real, latencia baja
└─ Ideal para: Backtesting + trading simulado
```

### FASE 3: PRODUCCIÓN (3+ meses)
```
Proveedor: TWELVE DATA Ultra ($999/mes) u optimizado
├─ Ventaja: Máximo throughput, redundancia
├─ Capacidad: 10,946 créditos/mes (por minuto de conexión)
├─ Datos: Real-time, websocket, SLA 99.95%
└─ Ideal para: Operaciones en vivo 24/5
```

---

## 💰 ANÁLISIS DE COSTOS

### Primer Año (Opciones):

**Opción A - MÍNIMO COSTO (Testing):**
```
Months 1-2: Alpha Vantage Free = $0
Months 3-12: Twelve Data Pro = $229 × 10 = $2,290
────────────────────────────────
TOTAL PRIMER AÑO: $2,290
```

**Opción B - RECOMENDADA (Equilibrada):**
```
Months 1-12: Twelve Data Pro = $229 × 12 = $2,748
────────────────────────────────
TOTAL PRIMER AÑO: $2,748
```

**Opción C - PREMIUM (Máximo):**
```
Months 1-6: Twelve Data Pro = $229 × 6 = $1,374
Months 7-12: Twelve Data Ultra = $999 × 6 = $5,994
────────────────────────────────
TOTAL PRIMER AÑO: $7,368
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Paso 1: Configuración Inicial
```bash
# 1. Crear cuenta Twelve Data (pro plan)
# 2. Generar API Key
# 3. Agregar a .env.local (ya preparado)
DATA_API_KEY=tu_clave_aqui
NEXT_PUBLIC_DATA_PROVIDER=twelve_data

# 4. Crear adaptador específico
app/engine/data/twelveDataProvider.ts
```

### Paso 2: Integración
```typescript
// En RealDataProvider (ya existe estructura)
// Implementar métodos:
- getCandle(asset, timeframe) → Twelve Data API
- getTick(asset) → Twelve Data WebSocket
- calculateIndicators() → Twelve Data endpoint
- getMarketData() → Consolidado
```

### Paso 3: Testing
```bash
# 1. Backtesting (datos históricos)
# 2. Paper trading (sin dinero real)
# 3. Validación de latencia
# 4. Prueba de confiabilidad
```

### Paso 4: Monitoreo
```
- Health checks cada 1 minuto
- Alertas si latencia > 500ms
- Logging de conexiones perdidas
- Estadísticas de uptime
```

---

## 📋 CHECKLIST DE REQUISITOS

### ✅ TWELVE DATA Cubre:
- [x] XAUUSD - Commodity/Forex
- [x] EURUSD - Forex pair
- [x] GBPUSD - Forex pair
- [x] BTCUSD - Cripto pair
- [x] Timeframe 1H - 60min
- [x] Timeframe 45M - 45min custom
- [x] Timeframe 5M - 5min
- [x] Datos históricos - 20+ años
- [x] Latencia aceptable - 170ms avg
- [x] API estable - 99.95% SLA
- [x] Costos razonables - $229-999/mes

---

## ⚠️ CONSIDERACIONES ESPECIALES

### Problema: Timeframe 45M
- **Twelve Data:** ✅ Soporta custom intervals (45M nativo)
- **Alpha Vantage:** ❌ No soporta (requiere interpolación de 5M)
- **OANDA:** ⚠️ No es nativo (construir desde M5: 9 velas o M15: 3 velas)
- **Binance:** ❌ No soporta
- **Massive:** ⚠️ Varía por proveedor (requiere construcción local)

**Solución:** Usar Twelve Data (única con 45M nativo) o construir localmente combinando velas menores

### Problema: Cripto
- Binance es excelente SOLO para cripto
- Twelve Data excelente para TODOS
- Considerar Twelve Data para cobertura unificada

### Problema: Backtesting
- Twelve Data ideal (datos completos + WebSocket)
- Alpha Vantage limitado por rate limits
- Considerar descarga offline de datos

---

## ✨ RECOMENDACIÓN FINAL

### 🏆 OPCIÓN ELEGIDA: TWELVE DATA

**Por qué:**
1. Cubre 100% de requerimientos (4/4 activos, 3/3 timeframes)
2. Latencia muy baja (~170ms)
3. SLA profesional (99.95%)
4. Backtesting excepcional
5. WebSocket nativo para realtime
6. Costo justificado ($229/mes)
7. Fácil escalado a producción

**Próximos Pasos:**
1. Registrarse en Twelve Data (https://twelvedata.com/register)
2. Seleccionar plan Pro ($229/mes)
3. Obtener API Key
4. Implementar adaptador en `app/engine/data/twelveDataProvider.ts`
5. Configurar `.env.local` con credenciales
6. Testing y validación

**Timeline Sugerido:**
- Semana 1-2: Setup y configuración
- Semana 3-4: Integración y testing
- Semana 5-6: Backtesting de estrategias
- Semana 7-8: Validación y ajustes

---

## REFERENCIAS Y ENLACES

- **Twelve Data:** https://twelvedata.com
- **API Docs:** https://twelvedata.com/docs
- **Alpha Vantage:** https://www.alphavantage.co
- **OANDA:** https://developer.oanda.com
- **Binance:** https://binance-docs.github.io/
- **Massive:** https://massive.com/

---

**Documento Preparado:** 2026-07-02  
**Status:** Listo para Implementación  
**Autorización Requerida:** Aprobación presupuestal para Twelve Data Pro
