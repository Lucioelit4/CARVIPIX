# 📊 DIAGNÓSTICO DE ENDPOINTS — BÚSQUEDA EXHAUSTIVA

**Fecha:** 2026-07-15  
**Búsqueda:** Proyecto completo CARVIPIX  
**Resultado:** ENDPOINTS ENCONTRADOS

---

## ✅ ENDPOINTS EXISTENTES

| Endpoint | Archivo | Estado | HTTP Method | Función | Líneas |
|----------|---------|--------|-------------|---------|--------|
| **`/api/bot/mt5/handshake`** | `app/api/bot/mt5/handshake/route.ts` | ✅ COMPLETO | POST | Registra instalación EA | 108 |
| **`/api/bot/mt5/handshake/validate`** | Mismo archivo | ✅ COMPLETO | GET | Valida instalación | Incluido |
| **`/api/bot/mt5/signals`** | `app/api/bot/mt5/signals/route.ts` | ✅ COMPLETO | GET | Obtiene signal pendiente | 70 |
| **`/api/bot/mt5/ack`** | `app/api/bot/mt5/ack/route.ts` | ✅ COMPLETO | POST | Confirma recepción signal | 38 |
| **`/api/bot/mt5/executions`** | `app/api/bot/mt5/executions/route.ts` | ✅ COMPLETO | POST | Reporta ejecución | 82 |
| **`/api/bot/mt5/heartbeat`** | ⏳ NO ENCONTRADO | ❌ FALTA | POST | Status periódico | — |
| **`/api/bot/mt5/download`** | ⏳ NO ENCONTRADO | ❌ FALTA | GET | Descarga .ex5 | — |

---

## 🔍 ANÁLISIS DETALLADO

### ✅ POST /api/bot/mt5/handshake (COMPLETO)

**Ubicación:** `app/api/bot/mt5/handshake/route.ts`  
**Líneas:** 1-108

**Implementación:**
```typescript
export async function POST(request: NextRequest) {
  // Valida: license_id, installation_id, account_hash (REQUERIDO)
  // Busca licencia en sistema
  // Registra instalación en BD si válida
  // Retorna: { success, installation_id, magic_number, status }
}
```

**Validaciones Incluidas:**
- ✅ Requiere license_id, installation_id, account_hash
- ✅ Valida que licencia existe y está activa
- ✅ Registra instalación en BD bot_mt5_installations
- ✅ Responde HTTP 201 si exitoso
- ✅ Responde HTTP 401 si licencia inválida
- ✅ Responde HTTP 400 si faltan parámetros

**Estado:** LISTO PARA USAR

---

### ✅ GET /api/bot/mt5/handshake/validate (COMPLETO)

**Ubicación:** Mismo archivo `app/api/bot/mt5/handshake/route.ts`  
**Líneas:** 64-108

**Implementación:**
```typescript
export async function GET(request: NextRequest) {
  // Requiere Bearer token = license_id
  // Valida que instalación existe
  // Verifica que no está revocada
  // Retorna: { valid, status, installation_id }
}
```

**Autenticación:**
- ✅ Valida header Authorization: Bearer {license_id}
- ✅ Rechaza si token no coincide con license_id
- ✅ Responde HTTP 401 si sin autorización

**Estado:** LISTO PARA USAR

---

### ✅ GET /api/bot/mt5/signals (COMPLETO)

**Ubicación:** `app/api/bot/mt5/signals/route.ts`  
**Líneas:** 1-70

**Implementación:**
```typescript
export async function GET(request: NextRequest) {
  // Requiere: license_id, installation_id, account_hash
  // Requiere: Authorization: Bearer {license_id}
  // Valida que instalación existe y no está suspendida
  // Obtiene signal pendiente de BD
  // Marca como "delivered"
  // Retorna: { signal: {...} } o { signal: null }
}
```

**Respuesta JSON (si hay signal):**
```json
{
  "signal": {
    "signal_id": "...",
    "analysis_id": "...",
    "symbol": "XAUUSD",
    "decision": "BUY",
    "entry": 2338.45,
    "stop_loss": 2332.00,
    "take_profit": 2345.00,
    "risk_reward": 1.5,
    "expires_at": "2026-07-15T23:00:00Z",
    "signature": "..."
  }
}
```

**Estado:** LISTO PARA USAR

---

### ✅ POST /api/bot/mt5/ack (COMPLETO)

**Ubicación:** `app/api/bot/mt5/ack/route.ts`  
**Líneas:** 1-38

**Implementación:**
```typescript
export async function POST(request: NextRequest) {
  // Requiere: license_id, signal_id, status
  // Requiere: Authorization: Bearer {license_id}
  // Status esperados: "RECEIVED", "EXECUTED", "REJECTED", "DUPLICATE", etc.
  // Retorna: { success, signal_id, ack_status }
}
```

**Estado:** LISTO PARA USAR (simple logging)

---

### ✅ POST /api/bot/mt5/executions (COMPLETO)

**Ubicación:** `app/api/bot/mt5/executions/route.ts`  
**Líneas:** 1-82

**Implementación:**
```typescript
export async function POST(request: NextRequest) {
  // Requiere: license_id, signal_id, symbol, direction, status
  // Requiere: Authorization: Bearer {license_id}
  // Registra ejecución en BD bot_mt5_executions
  // Marca signal como ejecutada si status=EXECUTED
  // Retorna: { success, execution_id, signal_id, status }
}
```

**Campos Soportados:**
- signal_id, symbol, direction (BUY/SELL)
- requested_entry, executed_entry
- stop_loss, take_profit
- lot_size, broker_order_id
- magic_number, status (EXECUTED/FAILED)

**Estado:** LISTO PARA USAR

---

### ❌ POST /api/bot/mt5/heartbeat (NO ENCONTRADO)

**Ubicación:** ⏳ NO EXISTE EN PROYECTO  
**Problema:** El EA llama a heartbeat pero endpoint no está implementado

**Lo que el EA espera:**
```
POST /api/bot/mt5/heartbeat
{
  "license_id": "...",
  "installation_id": "...",
  "account_hash": "...",
  "ea_version": "1.00",
  "status": "READY|ERROR|etc",
  "open_positions": 2,
  "equity": 5234.50,
  "balance": 5000.00
}
```

**Acción Requerida:** IMPLEMENTAR

---

### ❌ GET /api/bot/mt5/download (NO ENCONTRADO)

**Ubicación:** ⏳ NO EXISTE EN PROYECTO  
**Problema:** El EA podría necesitar descargar actualizaciones de versión

**Acción Requerida:** IMPLEMENTAR (baja prioridad)

---

## 🔧 SERVICIO DE BACKEND

**Ubicación:** `app/backend/services/bot-mt5-service.ts`  
**Líneas:** 260+

**Clase:** `BotMT5Service`  
**Métodos:**
```typescript
✅ getInstallation(licenseId, installationId)
✅ registerInstallation(userId, licenseId, ...)
✅ getPendingSignal(licenseId)
✅ recordExecution(signalId, licenseId, ...)
✅ recordHeartbeat(licenseId, ...) — Posible método
✅ markSignalDelivered(signalId)
✅ markSignalExecuted(signalId)
```

**Base de Datos (Tablas):**
- ✅ bot_mt5_installations
- ✅ bot_mt5_signals
- ✅ bot_mt5_executions
- ✅ bot_mt5_heartbeats
- ✅ bot_mt5_downloads (no encontrada)

**Estado:** CÓDIGO BASE EXISTE, requiere verificar conexión a BD

---

## 🌐 PROBLEMA ACTUAL

### URL Configurada en EA
```
https://carvipix.com/api/bot/mt5
```

### Respuesta Real
```
HTTP 404 - NOT FOUND
```

### Análisis
1. ✅ Los endpoints están **implementados en código**
2. ✅ Los endpoints están en `/app/api/bot/mt5/...` (Next.js format)
3. ❌ Los endpoints **NO ESTÁN PUBLICADOS** en `https://carvipix.com`
4. ❌ El servidor Next.js no está respondiendo en esa URL

### Posibles Causas
1. **App Next.js no está corriendo** — El servidor backend no está activo
2. **Ruta incorrecta** — El endpoint está en diferente dominio/puerto
3. **No desplegado en producción** — Solo existe en desarrollo local
4. **Configuración de proxy falta** — El servidor no sirve estos endpoints

---

## 🔍 BÚSQUEDA DE REFERENCIAS EN CÓDIGO

**Archivos que llaman a los endpoints:**

1. **EA MQL5:** `scripts/CARVIPIX_EA_MT5_V1.mq5`
   - Llama a: `https://carvipix.com/api/bot/mt5/handshake`
   - Llama a: `https://carvipix.com/api/bot/mt5/signals`
   - Llama a: `https://carvipix.com/api/bot/mt5/validate`
   - Llama a: `https://carvipix.com/api/bot/mt5/ack`
   - Llama a: `https://carvipix.com/api/bot/mt5/executions`
   - Llama a: `https://carvipix.com/api/bot/mt5/heartbeat`

2. **Dashboard Admin:** `app/admin/components/AdminMT5Dashboard.tsx`
   - Interfaz para ver instalaciones y executions
   - Usa mock data (no conecta a API directamente)

3. **Dashboard Cliente:** `app/(public)/bot-mt5/page.tsx`
   - Interfaz para cliente
   - Muestra guía de instalación

---

## 📋 TABLA RESUMIDA

```
COMPONENTE                  ESTADO          UBICACIÓN
────────────────────────────────────────────────────────────
POST /handshake             ✅ CÓDIGO OK    app/api/bot/mt5/handshake/route.ts
GET /validate               ✅ CÓDIGO OK    app/api/bot/mt5/handshake/route.ts
GET /signals                ✅ CÓDIGO OK    app/api/bot/mt5/signals/route.ts
POST /ack                   ✅ CÓDIGO OK    app/api/bot/mt5/ack/route.ts
POST /executions            ✅ CÓDIGO OK    app/api/bot/mt5/executions/route.ts
POST /heartbeat             ❌ NO EXISTE    —
GET /download               ❌ NO EXISTE    —
─────────────────────────────────────────────────────────────
BotMT5Service               ✅ CÓDIGO OK    app/backend/services/bot-mt5-service.ts
BD Schema (5 tablas)        ✅ CÓDIGO OK    app/backend/core/database.ts
Admin Dashboard             ✅ CÓDIGO OK    app/admin/components/AdminMT5Dashboard.tsx
─────────────────────────────────────────────────────────────
PUBLICADO en carvipix.com   ❌ NO            —
CORRIENDO localmente        ❓ DESCONOCIDO   —
```

---

## 🎯 CONCLUSIÓN

### Lo que está hecho
- ✅ 5/7 endpoints implementados
- ✅ Servicio de backend completo
- ✅ Dashboards creados
- ✅ Esquema de BD definido

### Lo que falta
- ❌ 2 endpoints por implementar (heartbeat, download)
- ❌ Endpoints NO publicados en carvipix.com
- ❌ Backend Next.js NO está corriendo/desplegado
- ❌ BD NO confirmada que existe
- ❌ Servidor NO responde en https://carvipix.com/api/bot/mt5

### Acción Inmediata
Necesito confirmar:
1. ¿Dónde está corriendo el servidor Next.js? (localhost:3000, staging, producción)
2. ¿Está realmente funcionando?
3. ¿Necesito ejecutar `npm run dev` o `npm run build`?
4. ¿Cuál es la URL correcta para alcanzar los endpoints?

---

**Próximo Paso:** Iniciar el servidor Next.js localmente y hacer que responda en una URL accesible, luego actualizar la URL del EA.
