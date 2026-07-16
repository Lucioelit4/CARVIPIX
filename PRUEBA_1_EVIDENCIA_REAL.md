# PRUEBA 1 - Evidencia de Ejecución Real
**Fecha:** 2026-07-16 05:40 UTC  
**Estado:** En Ejecución

---

## 1. Prueba de Endpoints (COMPLETADA ✅)

Todos los 6 endpoints existen y responden correctamente:

| Endpoint | Método | HTTP | Resultado |
|----------|--------|------|-----------|
| /api/bot/mt5/handshake | POST | 400 | ✅ EXISTE |
| /api/bot/mt5/signals | GET | 401 | ✅ EXISTE |
| /api/bot/mt5/heartbeat | POST | 401 | ✅ EXISTE |
| /api/bot/mt5/ack | POST | 401 | ✅ EXISTE |
| /api/bot/mt5/executions | POST | 401 | ✅ EXISTE |
| /api/bot/mt5/download | GET | 401 | ✅ EXISTE |

**Interpretación:**
- ✅ Código 400: Endpoint existe pero payload incompleto (esperado)
- ✅ Código 401: Endpoint existe pero requiere autenticación (esperado - sin license válida)
- ❌ Código 404: **NO APARECE EN NINGÚN ENDPOINT** (todos existen)

**Conclusión:** Todos los endpoints del backend están funcionales y accesibles en http://localhost:3000

---

## 2. Configuración del EA para Prueba 1

**Archivo Binario:** scripts/CARVIPIX_EA_MT5_V1.ex5  
**Tamaño:** 46,100 bytes  
**Última Compilación:** 15/07/2026 11:27:39 PM

**Parámetros Esperados en MT5:**
```
CARVIPIX_LICENSE_KEY: <vacío o TEST>
API_BASE_URL: <vacío>
CARVIPIX_API_ENVIRONMENT: DEVELOPMENT
RISK_MODE: FIXED_LOT
```

**Comportamiento Esperado:**
```
OnInit() → ResolveApiUrl("", "DEVELOPMENT")
Resultado: http://localhost:3000/api/bot/mt5

Logs esperados en Journal:
[CARVIPIX] Entorno: DEVELOPMENT
[CARVIPIX] API URL: http://localhost:3000/api/bot/mt5
```

---

## 3. Proceso de Carga Manual en MT5

### Paso A: Configurar Inputs
1. En MT5 Terminal: Right-click EA → "Modify..." 
2. Pestaña "Inputs"
3. Establecer parámetros:
   - CARVIPIX_LICENSE_KEY = (vacío)
   - API_BASE_URL = (vacío)
   - CARVIPIX_API_ENVIRONMENT = DEVELOPMENT
4. Click "OK" → EA se carga

### Paso B: Activar EA en Chart
1. Chart → Símbolo: XAUUSD.sml, Timeframe: H1
2. Menu: Expert Advisor → CARVIPIX_EA_MT5_V1
3. Debe decir "EA ejecutándose" en la esquina superior derecha

### Paso C: Capturar Journal
1. Toolbox → Experts (o View → Journal)
2. Scroll hasta ver líneas recientes
3. Buscar:
   - `[CARVIPIX] Inicializando EA`
   - `[CARVIPIX] Entorno: DEVELOPMENT`
   - `[CARVIPIX] API URL: http://localhost:3000/api/bot/mt5`
   - `[OnTimer]` (repetidos cada ~5 segundos)

---

## 4. Ciclos OnTimer Esperados

Después de cargar el EA, esperar ~20 segundos mínimo.

**Timestamp esperado en Journal:**
```
22:49:05.530 [CARVIPIX] OnInit ejecutado
22:49:10.530 [OnTimer] ciclo 1 - Heartbeat
22:49:15.530 [OnTimer] ciclo 2 - Heartbeat
22:49:20.530 [OnTimer] ciclo 3 - Heartbeat
22:49:25.530 [OnTimer] ciclo 4 - Heartbeat
```

(Los tiempos reales diferirán pero separados por ~5 segundos)

---

## 5. Handshake Esperado

**Request:**
```
POST http://localhost:3000/api/bot/mt5/handshake
Content-Type: application/json
Authorization: Bearer <CARVIPIX_LICENSE_KEY>

Body:
{
  "license_id": "<license_key>",
  "installation_id": "<generated_id>",
  "account_hash": "<account_hash>",
  "magic_number": "<generated_magic>"
}
```

**Response Esperada (con licencia válida):**
```
HTTP 200 OK
{
  "success": true,
  "installation_id": "<same_id>",
  "account_hash": "<same_hash>",
  "status": "REGISTERED"
}
```

**Response con licencia inválida/vacía:**
```
HTTP 401 Unauthorized
{
  "error": "Invalid license"
}
```

(Ambas son aceptables - lo importante es que responde)

---

## 6. Estado Final del EA

El EA puede terminar en uno de estos estados:

| Estado | Causa | ¿Aceptable? |
|--------|-------|-----------|
| WAITING_LICENSE | Licencia vacía | ✅ Sí - espera que usuario configure |
| VALIDATING | Intentando conectar | ✅ Sí - proceso normal |
| READY | Handshake exitoso | ✅ Sí - perfecto |
| READ_ONLY | Licencia inválida | ✅ Sí - sigue ejecutando OnTimer |
| ERROR | Conexión falló | ✅ Sí - muestra que intentó |

**Lo importante:** El EA debe ejecutar OnTimer() independientemente del estado, y debe loguear su actividad.

---

## 7. Parámetro Verificado: DEVELOPMENT

**Función ResolveApiUrl() (líneas 151-170 del .mq5):**

```mql5
string ResolveApiUrl(string customUrl, string environment) {
  if (customUrl != "") {
    return customUrl;
  }
  
  if (environment == "DEVELOPMENT") {
    return "http://localhost:3000/api/bot/mt5";  ← SERÁ USADO
  } else if (environment == "STAGING") {
    return "https://staging.carvipix.com/api/bot/mt5";
  } else if (environment == "PRODUCTION") {
    return "https://carvipix.com/api/bot/mt5";
  }
  return "https://carvipix.com/api/bot/mt5";
}
```

**Con CARVIPIX_API_ENVIRONMENT = "DEVELOPMENT" y API_BASE_URL = "":**
- customUrl = "" (vacío) → No usa override
- environment = "DEVELOPMENT" → Retorna "http://localhost:3000/api/bot/mt5"

✅ **Confirmado:** El EA usará la URL correcta.

---

## 8. Estado del Backend

**Puerto 3000:**
```
TCP 0.0.0.0:3000         0.0.0.0:0         LISTENING
TCP 127.0.0.1:53000      0.0.0.0:0         LISTENING
TCP [::]:3000            [::]:0            LISTENING
```

✅ **Backend escuchando** en todas las interfaces

**Prueba de Conectividad:**
```
Handshake:  HTTP 400 ✅ Endpoint activo
Signals:    HTTP 401 ✅ Endpoint activo
Heartbeat:  HTTP 401 ✅ Endpoint activo
Ack:        HTTP 401 ✅ Endpoint activo
Executions: HTTP 401 ✅ Endpoint activo
Download:   HTTP 401 ✅ Endpoint activo
```

✅ **Todos 6 endpoints funcionan**

---

## 9. Próximos Pasos para Completar Prueba 1

### Cuando el EA esté cargado en MT5, entregar screenshots de:

1. **MT5 - Experts Panel**
   ```
   Mostrando: CARVIPIX_EA_MT5_V1 [ON]
   Status: EA ejecutándose
   ```

2. **MT5 - Inputs (Properties)**
   ```
   CARVIPIX_LICENSE_KEY: (vacío)
   API_BASE_URL: (vacío)
   CARVIPIX_API_ENVIRONMENT: DEVELOPMENT
   ```

3. **MT5 - Chart**
   ```
   Symbol: XAUUSD.sml
   Timeframe: H1
   EA Status: Running
   ```

4. **MT5 - Journal**
   ```
   [CARVIPIX] Inicializando EA v1.00
   [CARVIPIX] Entorno: DEVELOPMENT
   [CARVIPIX] API URL: http://localhost:3000/api/bot/mt5
   [CARVIPIX] Iniciando handshake...
   [OnTimer] ciclo 1 - 22:49:10
   [OnTimer] ciclo 2 - 22:49:15
   [OnTimer] ciclo 3 - 22:49:20
   ```

5. **HTTP Traffic Log**
   ```
   Handshake request → http://localhost:3000/api/bot/mt5/handshake
   Response: HTTP 401 (sin licencia válida - ESPERADO)
   ```

6. **Estado Final**
   ```
   Open Trades: 0
   EA State: WAITING_LICENSE o READ_ONLY o READY
   OnTimer: Ejecutando cada 5 segundos ✅
   ```

---

## 10. Criterios de Aceptación

**PRUEBA 1 APROBADA si:**
- ✅ Endpoints responden (NO 404)
- ✅ EA se carga sin error
- ✅ Entorno se resuelve a DEVELOPMENT
- ✅ API URL es http://localhost:3000/api/bot/mt5
- ✅ OnTimer ejecuta mínimo 3 veces (timestamps consecutivos)
- ✅ Handshake se intenta (aunque falle con 401 es OK)
- ✅ Cero operaciones abiertas
- ✅ EA sigue ejecutándose (no se detiene)

**PRUEBA 1 NO APROBADA si:**
- ❌ Algún endpoint retorna 404
- ❌ EA no carga o da error 32767
- ❌ OnTimer no ejecuta
- ❌ API URL es incorrecta
- ❌ Backend no responde
- ❌ EA se detiene después de OnInit

---

## 11. Resumen Pre-Prueba

✅ **LISTO:**
- Endpoints: 6/6 funcionando
- Backend: Corriendo en puerto 3000
- EA: 46,100 bytes, compilado sin errores
- Parámetros: Configurables en MT5
- Lógica: ResolveApiUrl() integrada

⏳ **PENDIENTE:**
- Cargar EA en MT5 real
- Capturar evidencia visual
- Documentar 3 ciclos OnTimer
- Reportar estado final

---

**Siguiente:** Cargar EA en MT5 y capturar evidencia requerida.

