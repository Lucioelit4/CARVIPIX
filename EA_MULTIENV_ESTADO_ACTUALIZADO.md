# CARVIPIX EA MT5 V1 - Estado Actualizado (Multi-Entorno)

**Versión:** 1.00 Multi-Environment  
**Fecha:** 15/07/2026  
**Compilación:** ✅ 0 errores, 2 warnings (833 ms)  
**Tamaño:** 46,100 bytes  
**Estado:** ✅ Listo para Prueba 1 con arquitectura multi-entorno

---

## Cambios Implementados

### 1. Arquitectura de Parámetros

**Anteriormente (DEPRECATED):**
```mql5
input string CARVIPIX_API_URL = "http://localhost:3000/api/bot/mt5";
// ❌ Recompilación necesaria para cambiar entorno
```

**Ahora (NUEVO):**
```mql5
input string CARVIPIX_LICENSE_KEY = "";
input string API_BASE_URL = "";                   // URL personalizada (vacío = auto)
input string CARVIPIX_API_ENVIRONMENT = "PRODUCTION";  // DEVELOPMENT, STAGING, PRODUCTION
input string RISK_MODE = "FIXED_LOT";
```

**Ventajas:** ✅ Sin recompilación, multi-entorno, configurable en MT5

---

### 2. Nueva Función: ResolveApiUrl()

Ubicación: [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L151-L170)

```mql5
string ResolveApiUrl(string customUrl, string environment) {
  // Si usuario especificó URL personalizada, usarla
  if (customUrl != "") {
    return customUrl;
  }
  
  // Si no, resolver según entorno
  if (environment == "DEVELOPMENT") {
    return "http://localhost:3000/api/bot/mt5";
  } else if (environment == "STAGING") {
    return "https://staging.carvipix.com/api/bot/mt5";
  } else if (environment == "PRODUCTION") {
    return "https://carvipix.com/api/bot/mt5";
  }
  return "https://carvipix.com/api/bot/mt5"; // default
}
```

**Líneas:** 151-170  
**Responsabilidad:** Determinar URL del API según configuración del usuario  
**Casos Cubiertos:** 3 entornos predefinidos + 1 custom

---

### 3. Cambios en OnInit()

Ubicación: [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L91-L130)

**Antes:**
```mql5
if (CARVIPIX_API_URL == "") {
  g_api_url = "https://carvipix.com/api/bot/mt5";
} else {
  g_api_url = CARVIPIX_API_URL;
}
```

**Ahora:**
```mql5
// Resolver URL del API según configuración
g_api_url = ResolveApiUrl(API_BASE_URL, CARVIPIX_API_ENVIRONMENT);

Print("[CARVIPIX] Entorno: " + CARVIPIX_API_ENVIRONMENT);
Print("[CARVIPIX] API URL: " + g_api_url);
```

**Líneas:** 91-130  
**Cambios:** 
- Llama a ResolveApiUrl() con los nuevos parámetros
- Registra el entorno seleccionado en Journal
- Registra la URL final antes de conectar

---

## Matriz de Configuración

### Escenario 1: DEVELOPMENT (Testing Local)

| Parámetro | Valor |
|-----------|-------|
| `CARVIPIX_LICENSE_KEY` | `<tu-licencia>` |
| `API_BASE_URL` | `` (vacío) |
| `CARVIPIX_API_ENVIRONMENT` | `DEVELOPMENT` |

**URL Resultante:** `http://localhost:3000/api/bot/mt5`  
**Backend Requerido:** `npm run dev` ejecutándose  
**Uso:** Pruebas, debugging, desarrollo

---

### Escenario 2: STAGING (QA Pre-Producción)

| Parámetro | Valor |
|-----------|-------|
| `CARVIPIX_LICENSE_KEY` | `<tu-licencia>` |
| `API_BASE_URL` | `` (vacío) |
| `CARVIPIX_API_ENVIRONMENT` | `STAGING` |

**URL Resultante:** `https://staging.carvipix.com/api/bot/mt5`  
**Backend Requerido:** Endpoints en staging (deployed)  
**Uso:** Testing antes de producción

---

### Escenario 3: PRODUCTION (Standard)

| Parámetro | Valor |
|-----------|-------|
| `CARVIPIX_LICENSE_KEY` | `<tu-licencia>` |
| `API_BASE_URL` | `` (vacío) |
| `CARVIPIX_API_ENVIRONMENT` | `PRODUCTION` |

**URL Resultante:** `https://carvipix.com/api/bot/mt5`  
**Backend Requerido:** Endpoints en producción (deployed)  
**Uso:** Operación normal de clientes

---

### Escenario 4: URL PERSONALIZADA (Override)

| Parámetro | Valor |
|-----------|-------|
| `CARVIPIX_LICENSE_KEY` | `<tu-licencia>` |
| `API_BASE_URL` | `https://custom-api.example.com/bot/mt5` |
| `CARVIPIX_API_ENVIRONMENT` | Ignorado |

**URL Resultante:** `https://custom-api.example.com/bot/mt5`  
**Backend Requerido:** Custom endpoint especificado  
**Uso:** Proxy, dominios personalizados, etc.

---

## Flujo de Ejecución

```
┌─────────────────────────────────────────┐
│         EA Carga en MT5                 │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│   OnInit() ejecuta                      │
│ - Validar licencia                      │
│ - Generar Installation ID               │
│ - Generar Account Hash                  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│   ResolveApiUrl()                       │
│   Lee: API_BASE_URL, ENVIRONMENT        │
└────────────────────┬────────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
      ¿customUrl ≠ ""?      ¿customUrl = ""?
            │                 │
            ▼                 ▼
       Usar custom      Resolver según ENVIRONMENT
            │                 │
            │        ┌────────┼────────┐
            │        │        │        │
          DEV      STAGING  PROD    (otros)
            │        │        │        │
            ▼        ▼        ▼        ▼
      localhost   staging   prod     prod(default)
            │        │        │        │
            └────────┼────────┼────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   g_api_url = resolved  │
         │   Intentar Handshake    │
         └────────────┬────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
       ✅ ÉXITO            ❌ ERROR
            │                   │
            ▼                   ▼
         READY               ERROR/RETRY
```

---

## Líneas de Código Modificadas

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L20-L23) | 20-23 | Parámetros de entrada (nuevos) |
| [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L151-L170) | 151-170 | Función ResolveApiUrl() (nueva) |
| [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L100-L105) | 100-105 | OnInit() - Resolución de URL |
| [CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5#L108-L109) | 108-109 | Print() - Logs de entorno y URL |

---

## Compatibilidad

| Aspecto | Estado |
|--------|--------|
| Backward Compatibility | ✅ Código existente sigue funcionando |
| MT5 MetaEditor | ✅ Compila sin cambios en compilador |
| Endpoint APIs | ✅ Los 7 endpoints existentes sin cambios |
| Database | ✅ Schema no cambió |
| MQL5 SDK | ✅ Solo funciones built-in (WebRequest, etc.) |

---

## Compilación y Distribución

**Compilador:** MetaEditor 5 (OANDA MT5 Terminal)

```
Input:  c:\Users\user1\carvipix\scripts\CARVIPIX_EA_MT5_V1.mq5
Output: C:\...\Experts\CARVIPIX_EA_MT5_V1.ex5

Resultado:
  0 errors
  2 warnings (enum conversions - no-error)
  833 ms elapsed
  X64 Regular

Size: 46,100 bytes
Timestamp: 15/07/2026 11:27:39 PM
```

**Distribución:**
- ✅ [scripts/CARVIPIX_EA_MT5_V1.ex5](scripts/CARVIPIX_EA_MT5_V1.ex5) - 46,100 bytes
- ✅ C:\Users\user1\Downloads\CARVIPIX_EA_MT5_V1.ex5 - 46,100 bytes
- ✅ MT5 Experts Folder - 46,100 bytes

---

## Prueba 1: Validación Multi-Entorno

**Objetivo:** Confirmar que EA detecta, configura y usa la URL correcta según el entorno

### Configuración para Prueba 1

```
Entorno Seleccionado: DEVELOPMENT
CARVIPIX_LICENSE_KEY: <licencia-test-valida>
API_BASE_URL: "" (vacío - auto-detectar)
CARVIPIX_API_ENVIRONMENT: DEVELOPMENT
```

### Validaciones Esperadas

**En Journal (logs de MT5):**
```
[CARVIPIX] Inicializando EA v1.00
[CARVIPIX] Installation ID: <generado>
[CARVIPIX] Magic Number: <generado>
[CARVIPIX] Account Hash: <generado>
[CARVIPIX] Entorno: DEVELOPMENT
[CARVIPIX] API URL: http://localhost:3000/api/bot/mt5
[CARVIPIX] Iniciando handshake...
```

**Mínimo 3 ciclos OnTimer() (cada 5 segundos):**
```
[OnTimer] ciclo 1 - Enviando heartbeat...
[OnTimer] ciclo 2 - Enviando heartbeat...
[OnTimer] ciclo 3 - Enviando heartbeat...
```

**Handshake Exitoso:**
```
[CARVIPIX] EA READY. Esperando señales...
```

### Condiciones Previas

1. Backend Node.js ejecutándose: `npm run dev`
2. Base de datos PostgreSQL disponible
3. MT5 Terminal con EA cargado en Symbol XAUUSD.sml, TimeFrame H1
4. Licencia válida en sistema

### Condiciones Post-Prueba

- ✅ No se abrieron posiciones
- ✅ Log completo capturado
- ✅ HTTP respuestas capturadas (200 OK esperado)
- ✅ Handshake ejecutado
- ✅ Minimum 3 OnTimer cycles logged

---

## Próximas Fases

**Fase 1 (Actual):** ✅ COMPLETADA
- Arquitectura multi-entorno implementada
- Función ResolveApiUrl() codificada
- EA compilado (0 errores)
- Documentación creada

**Fase 2 (Siguiente):** Prueba 1 Validación
- Ejecutar con DEVELOPMENT
- Capturar logs de OnInit + 3 OnTimer
- Verificar handshake
- Confirmar HTTP 200

**Fase 3 (Post-Fase 2):** Prueba de Señales
- Crear señal de test en backend
- EA recibe y procesa señal
- Validar lógica de decisión
- (Opcional: abrir posición de prueba)

---

## Comandos de Referencia

### Para cambiar de entorno sin recompilar:

1. **Cambiar a DEVELOPMENT:**
   ```
   En MT5: Properties → Inputs
   CARVIPIX_API_ENVIRONMENT: DEVELOPMENT
   API_BASE_URL: (vacío)
   Click OK
   ```

2. **Cambiar a PRODUCTION:**
   ```
   En MT5: Properties → Inputs
   CARVIPIX_API_ENVIRONMENT: PRODUCTION
   API_BASE_URL: (vacío)
   Click OK
   ```

3. **Usar URL personalizada:**
   ```
   En MT5: Properties → Inputs
   API_BASE_URL: https://custom-domain.com/api/bot/mt5
   CARVIPIX_API_ENVIRONMENT: (ignorado)
   Click OK
   ```

---

## Archivos Relacionados

- [MULTIENV_EA_CONFIGURATION.md](MULTIENV_EA_CONFIGURATION.md) - Guía detallada de configuración
- [scripts/CARVIPIX_EA_MT5_V1.mq5](scripts/CARVIPIX_EA_MT5_V1.mq5) - Código fuente
- [scripts/CARVIPIX_EA_MT5_V1.ex5](scripts/CARVIPIX_EA_MT5_V1.ex5) - Binario compilado
- [DIAGNOSTICO_ENDPOINTS_ENCONTRADOS.md](DIAGNOSTICO_ENDPOINTS_ENCONTRADOS.md) - Estado de endpoints

---

**Estado:** ✅ Listo para Prueba 1 Multi-Entorno

