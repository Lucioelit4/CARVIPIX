# Recomendacion de Proveedor de Datos Real para CARVIPIX

**Documento de Investigacion y Analisis**  
**Fecha:** 2026-07-02  
**Objetivo:** Evaluar y recomendar el mejor proveedor de datos de mercado para alimentar el bot en modo lectura

---

## Resumen Ejecutivo

Despues de investigar 5 proveedores principales, **recomendamos INICIAR CON TWELVE DATA** como proveedor principal, con **Alpha Vantage** como alternativa de bajo costo para testing.

### Por que Twelve Data:
- Cobertura completa de los 4 activos requeridos
- Latencia ultra-baja (aproximadamente 170ms)
- Soporte para todas las temporalidades (1H, 45M, 5M)
- Datos historicos amplios (20+ anos)
- WebSocket en tiempo real
- SLA 99.95%

---

## COMPARATIVA DETALLADA DE PROVEEDORES

### 1. **TWELVE DATA** - RECOMENDADO (Opcion Principal)

#### Cobertura de Activos:
| Activo | Disponible | Tipo | Cobertura |
|--------|-----------|------|-----------|
| XAUUSD | SI | Commodity | Si, incluido en forex/commodities |
| EURUSD | SI | Forex | 2,000+ pares forex |
| GBPUSD | SI | Forex | Incluido en pares mayores |
| BTCUSD | SI | Cripto | 4,800+ pares cripto |

#### Caracteristicas:
- **Temporalidades Soportadas:** 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
  - SI 1H disponible (60min)
  - SI 45M disponible (custom interval)
  - SI 5M disponible
- **Datos Historicos:** Acceso completo a datos historicos (20+ anos tipicamente)
- **Latencia:** aproximadamente 170ms promedio para WebSocket (ultra-baja)
- **Actualizacion:** Tiempo real via WebSocket, con fallback a REST API

#### Precios (Individual/Personal):
```
Tier          Costo/Mes    API Credits    WS Credits    Markets    SLA
────────────────────────────────────────────────────────────────────────
Free/Basic         $0         8             8 trial       3         -
Grow              $79         377           8 trial       20+       No
Pro              $229       1,597          1,500         70+      No
Ultra            $999      10,946         10,000        84+      99.95%
```

**Recomendacion:** Plan **Pro ($229/mes)** o **Ultra ($999/mes)**
- Pro: Suficiente para operaciones normales
- Ultra: Recomendado para backtesting y analisis intensivo

#### Pros:
- Cobertura global excepcional (100k+ simbolos)
- Latencia muy baja
- SLA 99.95% en planes premium
- WebSocket nativo para datos en tiempo real
- SDKs en 15+ lenguajes
- Soporte dedicado en planes Pro+
- Datos de referencia completos
- Indicadores tecnicos incluidos

#### Contras:
- Costo mas elevado comparado con Alpha Vantage
- Plan Free/Grow muy limitados
- Requiere plan pagado para caracteristicas profesionales

#### Backtesting:
EXCELENTE - Acceso a datos historicos completos, ideal para backtesting

#### Escalabilidad:
- Plan Pro: 1,597 creditos API/mes (creditos por minuto de conexion, NO requests discretos)
- Plan Ultra: 10,946 creditos API/mes (creditos por minuto de conexion)

**Nota Importante:** Los creditos en Twelve Data se consumen por minuto de conexion WebSocket, no como requests individuales. Un minuto de WebSocket con multiples datos consume 1 credito. Esto permite mucho mayor throughput que APIs basadas en requests discretos.

---

### 2. **ALPHA VANTAGE** - ALTERNATIVA (Opcion de Bajo Costo)

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | SI | Spot: GOLD/XAU, Historical: GOLD_SILVER_HISTORY |
| EURUSD | SI | FX_INTRADAY, FX_DAILY, FX_WEEKLY, FX_MONTHLY |
| GBPUSD | SI | Forex pairs standard |
| BTCUSD | SI | CRYPTO_INTRADAY, DIGITAL_CURRENCY_DAILY |

#### Caracteristicas:
- **Temporalidades Soportadas:**
  - Intraday: 1min, 5min, 15min, 30min, 60min
  - Daily, Weekly, Monthly
  - SI 1H disponible (60min)
  - SI 5M disponible
  - ADVERTENCIA 45M: NO disponible nativamente (requiere interpolacion)
- **Datos Historicos:** 20+ anos completos
- **Latencia:** Buena (HTTP REST, sin WebSocket)
- **Actualizacion:** Retrasada (free), realtime (premium)

#### Precios:
```
Tier          Costo      Limites               Caracteristicas
────────────────────────────────────────────────────────────────
Free          $0         5 requests/min        Datos basicos
             ($0)        25 requests/dia       Demo gratuito
Premium       -           Bajo demanda         Custom plans
```

**Nota:** Alpha Vantage ofrece principalmente un plan gratuito con limitaciones estrictas. El limite gratuito es aproximadamente **25 requests/dia** (no 500 como afirman algunas fuentes antiguas). Esto es muy restrictivo para multi-timeframe.

#### Pros:
- **Completamente gratuito** (plan basico)
- No requiere tarjeta de credito
- Excelente para prototipos y testing
- 50+ indicadores tecnicos
- Cobertura mundial
- Soporte a commodities (oro, plata, petroleo)
- Datos historicos abundantes

#### Contras:
- **Limite estricto:** 5 requests/min
- **25 requests/dia maximo** en free tier
- 15-min delayed data en free (no realtime)
- **NO 45-minute timeframe** nativamente (requiere interpolacion)
- Sin WebSocket (solo REST)
- API lenta en horas pico
- Rate limiting muy agresivo

#### Backtesting:
BUENO - Datos historicos completos, pero limitado por API rate

#### Escalabilidad:
- Free: 25 requests/dia = muy limitado para multi-timeframe
- Custom plans: Mejor escalabilidad (bajo demanda)

#### Caso de Uso:
- EXCELENTE para **desarrollo inicial y testing**
- **NO recomendado para produccion** sin plan premium

---

### 3. **OANDA** - OPCION SECUNDARIA (Forex/Commodities)

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | SI | Aunque OANDA es principalmente forex |
| EURUSD | SI | 48 forex pairs (todos los majors) |
| GBPUSD | SI | Par mayor disponible |
| BTCUSD | ADVERTENCIA | Limitado/No estandar |

#### Caracteristicas:
- **REST API v20** (moderna y bien documentada)
- **Temporalidades nativas:** S5, S10, S15, S30, M1, M4, M5, M15, M30, H1, H4, D, W, M
  - SI 1H disponible (H1)
  - SI 5M disponible (M5)
  - ADVERTENCIA 45M: NO es nativa - debe construirse localmente combinando M5 (9 velas = 45 minutos) o M15 (3 velas = 45 minutos)
- **Datos Historicos:** Excelentes para forex
- **Latencia:** Muy baja (conectado a market)

#### Precios:
- **Free Demo Account:** Completo (para testing)
- **Live Account:** Requiere deposito minimo
  - Spreads competitivos
  - Comisiones variables

#### Pros:
- Excelente para forex (especializado)
- Latencia muy baja
- API REST bien documentada
- Account de demo gratuita completa
- Conexion MT4 opcional
- 45M puede construirse localmente desde M5/M15

#### Contras:
- **Principalmente broker, no data provider**
- Requiere cuenta trading (no solo datos)
- Cripto debil/no soportado
- Commodities limitados
- Deposito minimo en live account
- Enfoque en trading en vivo, no backtesting

#### Backtesting:
LIMITADO - Orientado a trading vivo, no ideal para backtesting masivo

#### Caso de Uso:
- SI es principalmente **forex trading** (EURUSD, GBPUSD)
- **NO para cripto o multi-asset**

---

### 4. **BINANCE** - OPCION PARA CRIPTO

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | NO | No soportado |
| EURUSD | NO | No soportado |
| GBPUSD | NO | No soportado |
| BTCUSD | SI | Excelente soporte |

#### Caracteristicas:
- **Especializado en:** Criptomonedas exclusivamente
- **Temporalidades:** 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
  - SI 1H disponible
  - SI 5M disponible
  - ADVERTENCIA 45M: NO disponible
- **Datos Historicos:** Limitados a ultimos 3 anos tipicamente
- **API Gratuita:** Si (con limites razonables)

#### Precios:
- **Free:** API publica sin costo
- **Premium:** No existe modelo premium de datos

#### Pros:
- **Gratuito**
- Excelente para cripto
- Baja latencia
- WebSocket nativo

#### Contras:
- **SOLO cripto** - sin forex ni commodities
- NO soporta XAUUSD, EURUSD, GBPUSD
- Datos historicos limitados
- Rate limits restrictivos

#### Backtesting:
LIMITADO - Datos historicos solo 3 anos

#### Conclusion:
**NO recomendado como principal** para CARVIPIX (solo 1 de 4 activos)

---

### 5. **MASSIVE.COM** (ex-Polygon.IO) - OPCION EMERGENTE

**Estado:** Polygon.io ahora redirige a Massive.com - plataforma unificada de datos de mercado

#### Cobertura de Activos:
| Activo | Disponible | Notas |
|--------|-----------|-------|
| XAUUSD | ADVERTENCIA | Cobertura de commodities limitada en free tier |
| EURUSD | SI | Forex via Massive marketplace |
| GBPUSD | SI | Forex via Massive marketplace |
| BTCUSD | SI | Cripto completo |

#### Caracteristicas:
- **Plataforma:** Marketplace de datos con multiples proveedores
- **APIs:** REST y WebSocket disponibles
- **Temporalidades:** 1min, 5min, 15min, 30min, 1hour, daily, etc.
  - SI 1H disponible
  - SI 5M disponible
  - ADVERTENCIA 45M: No esta listado nativamente (requiere construccion local)
- **Datos Historicos:** Disponibles segun proveedor seleccionado
- **Latencia:** Varia segun fuente de datos

#### Precios:
- **Modelo:** Marketplace de proveedores independientes
- **Free Tier:** Acceso limitado (data sample)
- **Escalable:** Planes personalizados por data source

#### Pros:
- Plataforma unificada (acceso a multiples proveedores)
- Flexible: Elige solo los datos que necesitas
- Acceso a nuevas fuentes de datos constantemente
- WebSocket soportado
- API moderna y bien documentada

#### Contras:
- ADVERTENCIA Nuevo modelo (menos referencias en produccion)
- ADVERTENCIA Commodities debil (especialmente XAUUSD)
- ADVERTENCIA Documentacion en transicion (cambio Polygon a Massive)
- ADVERTENCIA No SLA claro para todos los proveedores
- ADVERTENCIA 45M requiere construccion local
- ADVERTENCIA Pricing aun en definicion para muchos activos

#### Backtesting:
LIMITADO - Depende del proveedor de datos seleccionado

#### Caso de Uso:
- Para **futura exploracion** una vez estable
- **NO para produccion inmediata** (plataforma en transicion)

---

## TABLA COMPARATIVA GENERAL

```
CRITERIO              TWELVE DATA    ALPHA VANTAGE    OANDA        BINANCE      MASSIVE
──────────────────────────────────────────────────────────────────────────────────────
XAUUSD                SI             SI              SI           NO           ADVERTENCIA
EURUSD                SI             SI              SI           NO           SI
GBPUSD                SI             SI              SI           NO           SI
BTCUSD                SI             SI              ADVERTENCIA  SI           SI

1H (60m)              NATIVA         NATIVA          NATIVA       NATIVA       NATIVA
45M (45m)             CUSTOM         NO(INTERP)      LOCAL        NO           LOCAL
5M (5m)               NATIVA         NATIVA          NATIVA       NATIVA       NATIVA

Datos Historicos      20+ anos       20+ anos        AMPLIOS      3 anos       VARIABLE
Latencia              170ms          HTTP            MUY BAJA     MUY BAJA     VARIABLE
WebSocket Real-time   SI             NO              OPCIONAL     SI           SI
SLA                   99.95%         NO PREMIUM      BUENO        NO FORMAL    EN PROCESO

Costo Mensual         $229-999       $0 (Free)       VARIABLE     $0 (Free)    VARIABLE
Costo Anual           $2,748-11,988  $0              VARIABLE     $0           VARIABLE

Backtesting           EXCELENTE      LIMITADO        LIMITADO     LIMITADO     LIMITADO
Prod Ready            SI             SOLO TEST       SOLO FX      SOLO CRIPTO  BETA
Rate Limiting         GENEROSO       MUY STRICT      BUENO        RAZONABLE    VARIABLE
Documentacion         EXCELENTE      EXCELENTE       EXCELENTE    EXCELENTE    EN TRANS
```

---

## ESTRATEGIA RECOMENDADA

### FASE 1: DESARROLLO & TESTING (Ahora)
```
Proveedor: ALPHA VANTAGE (Gratuito)
├─ Ventaja: $0/mes, ideal para prototipos
├─ Limitacion: 25 requests/dia
├─ Duracion: 1-2 meses de desarrollo
└─ Transicion: Facil migracion a Twelve Data
```

### FASE 2: PRE-PRODUCCION (1-3 meses)
```
Proveedor: TWELVE DATA Pro ($229/mes)
├─ Ventaja: Balanceado costo/performance
├─ Capacidad: 1,597 creditos/mes (por minuto de conexion)
├─ Datos: Tiempo real, latencia baja
└─ Ideal para: Backtesting + trading simulado
```

### FASE 3: PRODUCCION (3+ meses)
```
Proveedor: TWELVE DATA Ultra ($999/mes) u optimizado
├─ Ventaja: Maximo throughput, redundancia
├─ Capacidad: 10,946 creditos/mes (por minuto de conexion)
├─ Datos: Real-time, websocket, SLA 99.95%
└─ Ideal para: Operaciones en vivo 24/5
```

---

## ANALISIS DE COSTOS

### Primer Ano (Opciones):

**Opcion A - MINIMO COSTO (Testing):**
```
Months 1-2: Alpha Vantage Free = $0
Months 3-12: Twelve Data Pro = $229 x 10 = $2,290
────────────────────────────────
TOTAL PRIMER ANO: $2,290
```

**Opcion B - RECOMENDADA (Equilibrada):**
```
Months 1-12: Twelve Data Pro = $229 x 12 = $2,748
────────────────────────────────
TOTAL PRIMER ANO: $2,748
```

**Opcion C - PREMIUM (Maximo):**
```
Months 1-6: Twelve Data Pro = $229 x 6 = $1,374
Months 7-12: Twelve Data Ultra = $999 x 6 = $5,994
────────────────────────────────
TOTAL PRIMER ANO: $7,368
```

---

## PLAN DE IMPLEMENTACION

### Paso 1: Configuracion Inicial
```bash
# 1. Crear cuenta Twelve Data (pro plan)
# 2. Generar API Key
# 3. Agregar a .env.local (ya preparado)
DATA_API_KEY=tu_clave_aqui
NEXT_PUBLIC_DATA_PROVIDER=twelve_data

# 4. Crear adaptador especifico
app/engine/data/twelveDataProvider.ts
```

### Paso 2: Integracion
```typescript
// En RealDataProvider (ya existe estructura)
// Implementar metodos:
- getCandle(asset, timeframe) → Twelve Data API
- getTick(asset) → Twelve Data WebSocket
- calculateIndicators() → Twelve Data endpoint
- getMarketData() → Consolidado
```

### Paso 3: Testing
```bash
# 1. Backtesting (datos historicos)
# 2. Paper trading (sin dinero real)
# 3. Validacion de latencia
# 4. Prueba de confiabilidad
```

### Paso 4: Monitoreo
```
- Health checks cada 1 minuto
- Alertas si latencia > 500ms
- Logging de conexiones perdidas
- Estadisticas de uptime
```

---

## CHECKLIST DE REQUISITOS

### TWELVE DATA Cubre:
- [x] XAUUSD - Commodity/Forex
- [x] EURUSD - Forex pair
- [x] GBPUSD - Forex pair
- [x] BTCUSD - Cripto pair
- [x] Timeframe 1H - 60min
- [x] Timeframe 45M - 45min custom
- [x] Timeframe 5M - 5min
- [x] Datos historicos - 20+ anos
- [x] Latencia aceptable - 170ms avg
- [x] API estable - 99.95% SLA
- [x] Costos razonables - $229-999/mes

---

## CONSIDERACIONES ESPECIALES

### Problema: Timeframe 45M
- **Twelve Data:** Soporta custom intervals (45M nativo)
- **Alpha Vantage:** No soporta (requiere interpolacion de 5M)
- **OANDA:** No es nativo (construir desde M5: 9 velas o M15: 3 velas)
- **Binance:** No soporta
- **Massive:** Varia por proveedor (requiere construccion local)

**Solucion:** Usar Twelve Data (unica con 45M nativo) o construir localmente combinando velas menores

### Problema: Cripto
- Binance es excelente SOLO para cripto
- Twelve Data excelente para TODOS
- Considerar Twelve Data para cobertura unificada

### Problema: Backtesting
- Twelve Data ideal (datos completos + WebSocket)
- Alpha Vantage limitado por rate limits
- Considerar descarga offline de datos

---

## RECOMENDACION FINAL

### OPCION ELEGIDA: TWELVE DATA

**Por que:**
1. Cubre 100% de requerimientos (4/4 activos, 3/3 timeframes)
2. Latencia muy baja (aproximadamente 170ms)
3. SLA profesional (99.95%)
4. Backtesting excepcional
5. WebSocket nativo para realtime
6. Costo justificado ($229/mes)
7. Facil escalado a produccion

**Proximos Pasos:**
1. Registrarse en Twelve Data (https://twelvedata.com/register)
2. Seleccionar plan Pro ($229/mes)
3. Obtener API Key
4. Implementar adaptador en `app/engine/data/twelveDataProvider.ts`
5. Configurar `.env.local` con credenciales
6. Testing y validacion

**Timeline Sugerido:**
- Semana 1-2: Setup y configuracion
- Semana 3-4: Integracion y testing
- Semana 5-6: Backtesting de estrategias
- Semana 7-8: Validacion y ajustes

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
**Status:** Listo para Implementacion  
**Autorizacion Requerida:** Aprobacion presupuestal para Twelve Data Pro
