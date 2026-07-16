# 📋 PRUEBA 1 — DIAGNÓSTICO DE INICIALIZACIÓN Y ONTIMER
**Fecha:** 2026-07-15  
**Hora de Prueba:** 22:49 (UTC local)  
**Versión EA:** CARVIPIX_EA_MT5_V1.ex5 (44,182 bytes)  
**Archivo Compilado:** ✅ SIN ERRORES

---

## 📊 RESULTADOS CAPTURADOS

### 1️⃣ OnInit Execution (22:49:04.530)

**Status:** ✅ EXITOSO

```
[CARVIPIX] Inicializando EA v1.0.0
[WARNING] Licencia no configurada. Por favor ingresa CARVIPIX_LICENSE_KEY en las propiedades del EA.
[CARVIPIX] Installation ID: INST-1715547693-1784188140
[CARVIPIX] Magic Number: 1736147643
[CARVIPIX] Account Hash: ACC-138547797
[CARVIPIX] API URL: https://carvipix.com/api/bot/mt5
[CARVIPIX] EA cargado en modo WAITING_LICENSE. Configura la licencia en propiedades.
```

**Análisis:**
- ✅ OnInit se ejecutó sin errores
- ✅ ID de instalación generado (único y determinístico)
- ✅ Magic Number calculado (CRC-like hash)
- ✅ Account Hash creado sin exponer número de cuenta
- ✅ API URL leído correctamente del input
- ✅ EA detectó licencia vacía
- ✅ Entró en modo WAITING_LICENSE (seguro)
- ✅ Timer iniciado (debería ejecutar OnTimer cada 5 seg)

---

### 2️⃣ OnTimer Execution (22:49:09.530)

**Status:** ✅ DETECTADO (1 ciclo)

```
[WARNING] Licencia inválida o expirada. Entrando READ_ONLY.
```

**Análisis:**
- ✅ OnTimer se ejecutó exactamente 5 segundos después de OnInit
- ✅ Intentó validar licencia
- ✅ Detectó falta de licencia
- ✅ Cambió a modo READ_ONLY (seguro, protegido)
- ❌ NO HAY MÁS CICLOS DE ONTIMER DESPUÉS DE 22:49:09

---

### 3️⃣ Post-Timer Status

**Status:** ⚠️ INCOMPLETO

**Hallazgo Crítico:**
```
No hay logs posteriores a 22:49:09.530
```

**Posibles explicaciones:**
1. EA entró en READ_ONLY y dejó de escribir logs detallados
2. EA continúa ejecutando OnTimer pero en silencio (READ_ONLY limita salida)
3. EA se descargó después del primer ciclo (pero no hay mensaje de "detenido")
4. Timer se detuvo por alguna razón

**Conclusión:** El EA ejecutó OnInit y al menos 1 ciclo de OnTimer, pero no hay evidencia de ciclos posteriores.

---

## 🌐 ESTADO DEL ENDPOINT API

**Endpoint Probado:**
```
https://carvipix.com/api/bot/mt5/validate
```

**Respuesta Real:**
```
HTTP 404 - NOT FOUND
```

**Implicaciones:**
- ❌ El endpoint NO existe en producción
- ❌ El EA no puede conectar al backend
- ❌ Handshake fallará si se intenta
- ❌ ValidateLicense() recibirá 404

**Estado Real de la API:**
```
Estado: NO DISPONIBLE
Endpoints: NO IMPLEMENTADOS
Backend: NO OPERATIVO PARA MT5
```

---

## 📋 CONFIGURACIÓN DE PRUEBA

**Entorno:**
- Broker: OANDA MetaTrader 5
- Cuenta: DEMO
- Símbolo: XAUUSD.sml (H1)
- Trading: Habilitado
- Automated Trading: Habilitado

**Inputs del EA:**
```
CARVIPIX_LICENSE_KEY = "" (vacío)
CARVIPIX_API_URL = "https://carvipix.com/api/bot/mt5" (default)
RISK_MODE = "FIXED_LOT"
FIXED_LOT = 0.01
MAX_OPEN_TRADES = 1
MAX_DAILY_TRADES = 10
POLLING_SECONDS = 5
ALLOW_BUY = true
ALLOW_SELL = true
ALLOW_NEW_TRADES = true
```

---

## ✅ VALIDACIONES CONFIRMADAS

| Validación | Status | Evidencia |
|-----------|--------|-----------|
| OnInit se ejecuta | ✅ | Log 22:49:04.530 |
| Installation ID generado | ✅ | INST-1715547693-1784188140 |
| Magic Number calculado | ✅ | 1736147643 |
| Account Hash creado | ✅ | ACC-138547797 |
| API URL leído | ✅ | https://carvipix.com/api/bot/mt5 |
| Licencia vacía detectada | ✅ | Modo WAITING_LICENSE |
| OnTimer se ejecuta | ✅ | Log 22:49:09.530 (+5 seg) |
| Validación de licencia | ✅ | Entra READ_ONLY |
| No crash en OnInit | ✅ | No "Expert removed" |
| No error 32767 | ✅ | EA permanece cargado |

---

## ❌ PROBLEMAS IDENTIFICADOS

### Problema 1: Ciclos de OnTimer Insuficientes
**Severidad:** MEDIA  
**Descripción:** Solo se registró 1 ciclo de OnTimer. Debería haber al menos 3-4 ciclos en 20-30 segundos.  
**Causa Probable:** EA cambió a READ_ONLY y dejó de registrar logs, o el timer se detuvo.  
**Acción Requerida:** Cargar EA con licencia simulada para ver si continúa.

### Problema 2: Endpoint API No Existe
**Severidad:** CRÍTICA  
**Descripción:** El endpoint /api/bot/mt5 no está implementado en carvipix.com  
**Causa:** Backend MT5 no está en producción  
**Acción Requerida:** Implementar endpoints de backend O usar URL local de prueba

### Problema 3: Falta de Logs en READ_ONLY
**Severidad:** MEDIA  
**Descripción:** En modo READ_ONLY, el EA no genera logs posteriores. Dificulta debugging.  
**Acción Requerida:** Mejorar logging incluso en modo READ_ONLY

---

## 🎯 CONCLUSIÓN INICIAL

```
PRUEBA 1: PARCIALMENTE APROBADA
```

**Aprobado:**
- ✅ EA se inicializa correctamente
- ✅ OnInit no genera errores
- ✅ OnTimer se ejecuta (al menos 1 ciclo confirmado)
- ✅ Manejo correcto de licencia vacía
- ✅ No hay crash ni error 32767

**No Aprobado:**
- ❌ Ciclos de OnTimer insuficientes para probar continuidad
- ❌ Endpoint API no disponible
- ❌ No se puede validar conexión con backend
- ❌ No se puede probar recepción de signals sin API

---

## 🔄 PRÓXIMOS PASOS

### Paso 1: Cargar EA con Licencia de Prueba
Ejecutar nuevamente con:
```
CARVIPIX_LICENSE_KEY = "TEST-DEMO-20260715"
```
Objetivo: Ver si OnTimer continúa ejecutándose y qué intenta hacer con licencia válida.

### Paso 2: Implementar Endpoint Mínimo
Necesitar un endpoint que responda:
```
GET /api/bot/mt5/validate?installation_id=...
Response: 200 OK { "status": "valid" }
```

### Paso 3: Probar Conexión
Con endpoint disponible, validar:
- Handshake exitoso
- Envío de heartbeat
- Recepción de signal (simulada)

### Paso 4: Probar Apertura de Operación
Enviar signal de prueba BUY/SELL y validar:
- Orden se abre
- SL/TP se colocan
- Magic Number es correcto

---

## 📎 ARCHIVOS ASOCIADOS

- Código: `scripts/CARVIPIX_EA_MT5_V1.mq5`
- Compilado: `scripts/CARVIPIX_EA_MT5_V1.ex5`
- Journal: `/AppData/Roaming/MetaQuotes/Terminal/.../MQL5/Logs/20260715.log`
- Plan de Testing: `EA_MT5_TESTING_PLAN.md`

---

**Realizado por:** Automated Test Suite  
**Status:** Listo para Próxima Fase  
**Requiere:** Decisión sobre Endpoint API  
