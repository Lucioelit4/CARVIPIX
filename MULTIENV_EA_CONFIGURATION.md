# CARVIPIX EA MT5 V1 - Configuración Multi-Entorno

**Versión:** 1.00 Multi-Environment  
**Fecha:** 15/07/2026  
**Estado:** ✅ Implementado y compilado (46,100 bytes)

---

## 1. Arquitectura de Configuración

El EA ahora soporta **3 entornos sin necesidad de recompilar**:

### Parámetros de Configuración

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `CARVIPIX_LICENSE_KEY` | string | "" | Licencia del usuario (obligatoria para operar) |
| `API_BASE_URL` | string | "" | URL personalizada (vacío = auto-detectar según entorno) |
| `CARVIPIX_API_ENVIRONMENT` | string | "PRODUCTION" | Entorno: DEVELOPMENT, STAGING, PRODUCTION |
| `RISK_MODE` | string | "FIXED_LOT" | Modo de riesgo: FIXED_LOT o RISK_PERCENT |

### Lógica de Resolución de URL

```
Si API_BASE_URL ≠ "" → usar API_BASE_URL
Si API_BASE_URL = "" y ENVIRONMENT = "DEVELOPMENT" → http://localhost:3000/api/bot/mt5
Si API_BASE_URL = "" y ENVIRONMENT = "STAGING" → https://staging.carvipix.com/api/bot/mt5
Si API_BASE_URL = "" y ENVIRONMENT = "PRODUCTION" → https://carvipix.com/api/bot/mt5
```

---

## 2. Escenarios de Uso

### Escenario 1: Desarrollo Local (Recomendado para Testing)

```
CARVIPIX_LICENSE_KEY: <tu-licencia-test>
API_BASE_URL: "" (vacío)
CARVIPIX_API_ENVIRONMENT: DEVELOPMENT
```

**Resultado:** EA conectará a `http://localhost:3000/api/bot/mt5`

**Requisitos:**
- Backend Node.js ejecutándose en localhost:3000
- `npm run dev` en raíz del proyecto CARVIPIX

---

### Escenario 2: Staging (Testing Pre-Producción)

```
CARVIPIX_LICENSE_KEY: <tu-licencia-staging>
API_BASE_URL: "" (vacío)
CARVIPIX_API_ENVIRONMENT: STAGING
```

**Resultado:** EA conectará a `https://staging.carvipix.com/api/bot/mt5`

**Requisitos:**
- Endpoints publicados en staging.carvipix.com

---

### Escenario 3: Producción (Standard)

```
CARVIPIX_LICENSE_KEY: <tu-licencia-prod>
API_BASE_URL: "" (vacío)
CARVIPIX_API_ENVIRONMENT: PRODUCTION
```

**Resultado:** EA conectará a `https://carvipix.com/api/bot/mt5`

---

### Escenario 4: URL Personalizada (Override)

Si necesitas usar un endpoint diferente (proxy, custom domain, etc.):

```
CARVIPIX_LICENSE_KEY: <tu-licencia>
API_BASE_URL: "https://custom-api.yourdomain.com/bot/mt5"
CARVIPIX_API_ENVIRONMENT: "PRODUCTION" (ignorado si API_BASE_URL ≠ "")
```

**Resultado:** EA conectará a exactamente `https://custom-api.yourdomain.com/bot/mt5`

---

## 3. Cambiar Entorno en MT5

### Paso 1: Abrir EA en MT5
- En MetaTrader 5 Terminal, navegar a **Toolbox** → **Experts**
- Right-click en `CARVIPIX_EA_MT5_V1`
- Seleccionar **"Modify..."** o **"Edit"**

### Paso 2: Cambiar Parámetros
En la pestaña **"Inputs"**:

**Para cambiar de PRODUCTION a DEVELOPMENT:**
1. `CARVIPIX_API_ENVIRONMENT`: cambiar a `DEVELOPMENT`
2. `API_BASE_URL`: dejar vacío ""
3. Click "OK" → EA se reinitiará

**Para cambiar de DEVELOPMENT a PRODUCTION:**
1. `CARVIPIX_API_ENVIRONMENT`: cambiar a `PRODUCTION`
2. `API_BASE_URL`: dejar vacío ""
3. Click "OK" → EA se reinitiará

### Paso 3: Verificar en Logs

Buscar en **Journal**:
```
[CARVIPIX] Entorno: DEVELOPMENT
[CARVIPIX] API URL: http://localhost:3000/api/bot/mt5
```

O para producción:
```
[CARVIPIX] Entorno: PRODUCTION
[CARVIPIX] API URL: https://carvipix.com/api/bot/mt5
```

---

## 4. Cambios en el Código

### Función New: ResolveApiUrl()

```mql5
string ResolveApiUrl(string customUrl, string environment) {
  // Si usuario especificó una URL personalizada, usarla
  if (customUrl != "") {
    Print("[CARVIPIX] Usando URL personalizada: " + customUrl);
    return customUrl;
  }
  
  // Si no, usar según el entorno
  if (environment == "DEVELOPMENT") {
    return "http://localhost:3000/api/bot/mt5";
  } else if (environment == "STAGING") {
    return "https://staging.carvipix.com/api/bot/mt5";
  } else if (environment == "PRODUCTION") {
    return "https://carvipix.com/api/bot/mt5";
  } else {
    // Default a producción si es desconocido
    return "https://carvipix.com/api/bot/mt5";
  }
}
```

### Cambios en OnInit()

```mql5
// ANTES:
if (CARVIPIX_API_URL == "") {
  g_api_url = "https://carvipix.com/api/bot/mt5";
} else {
  g_api_url = CARVIPIX_API_URL;
}

// DESPUÉS:
g_api_url = ResolveApiUrl(API_BASE_URL, CARVIPIX_API_ENVIRONMENT);
```

---

## 5. Ventajas de la Nueva Arquitectura

✅ **Sin recompilación:** Cambiar entorno solo requiere cambiar inputs en MT5  
✅ **Multi-entorno:** Soporta development, staging, production  
✅ **URL personalizada:** Permite override para casos especiales (proxy, custom domain)  
✅ **Backwards compatible:** Código existente sigue funcionando  
✅ **Escalable:** Fácil agregar nuevos entornos en el futuro  

---

## 6. Próximas Pruebas

### Prueba 1 Actualizada (Con Multi-Entorno)

**Objetivo:** Validar que EA se conecta correctamente según el entorno configurado

**Configuración:**
```
Entorno: DEVELOPMENT
License: (configurada por usuario)
API URL: (auto-detectado → http://localhost:3000/api/bot/mt5)
```

**Validación Esperada:**
- ✅ OnInit() ejecuta y resuelve URL correcta
- ✅ Mínimo 3 ciclos OnTimer() (5 seg cada uno)
- ✅ Handshake exitoso (HTTP 200)
- ✅ Respuesta del servidor disponible en logs

**Instrucciones:**
1. Asegurar backend corriendo: `npm run dev` en proyecto
2. En MT5: Cargar EA con DEVELOPMENT configurado
3. Dejar corriendo 25+ segundos
4. Capturar Journal logs y respuestas HTTP

---

## 7. Estados y Transiciones

```
WAITING_LICENSE
    ↓ (Licencia válida)
VALIDATING
    ↓ (Handshake exitoso)
READY
    ↓
POLLING (estado principal, OnTimer ejecuta)
    ↓ (Licencia inválida)
READ_ONLY
    ↓ (Error grave)
ERROR
```

---

## 8. Troubleshooting

### Problema: "API URL conecta pero recibe 404"

**Causa:** Backend no está publicado en ese dominio  
**Solución:** Cambiar a DEVELOPMENT si estás testando localmente

### Problema: "Cannot connect to localhost:3000"

**Causa:** Backend no está ejecutándose  
**Solución:** Ejecutar `npm run dev` en raíz del proyecto CARVIPIX

### Problema: "Certificado SSL inválido en STAGING"

**Causa:** Certificado staging no es válido  
**Solución:** Usualmente MT5 acepta certificados auto-firmados, pero reportar a infraestructura

### Problema: "API URL no se actualiza después de cambiar inputs"

**Causa:** EA no se reinició después del cambio  
**Solución:** Click derecho en chart → Experts → Remove, esperar, volver a cargar

---

## Compilación

```
Compiler: MetaEditor 5 (OANDA MT5 Terminal)
Result: 0 errors, 2 warnings (no-error warnings only)
Time: 833 ms (X64 Regular)
Size: 46,100 bytes
Date: 15/07/2026 11:27:39 PM
```

---

**Siguientes pasos:** Ejecutar Prueba 1 actualizada con configuración multi-entorno.

