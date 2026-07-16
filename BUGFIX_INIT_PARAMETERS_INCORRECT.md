# 🔧 CORRECCIÓN APLICADA — Error INIT_PARAMETERS_INCORRECT

**Fecha:** 2026-07-15  
**Hora:** 22:18 UTC  
**Problema:** EA se eliminaba inmediatamente con error 32767  
**Causa:** OnInit() retornaba INIT_PARAMETERS_INCORRECT  
**Status:** ✅ CORREGIDO  

---

## 🔍 PROBLEMA IDENTIFICADO

El EA retornaba `INIT_PARAMETERS_INCORRECT` si:
- `CARVIPIX_LICENSE_KEY` estaba vacío
- `CARVIPIX_API_URL` estaba vacío

**Resultado:** MetaTrader 5 descargaba el EA inmediatamente sin permitir configuración.

---

## ✅ SOLUCIÓN APLICADA

### Cambio 1: OnInit() ya no retorna errores
```mql5
// ANTES:
if (CARVIPIX_LICENSE_KEY == "") {
  return INIT_PARAMETERS_INCORRECT;  // ❌ MT5 descarga EA
}

// DESPUÉS:
if (CARVIPIX_LICENSE_KEY == "") {
  g_mode = "WAITING_LICENSE";  // ✅ EA sigue cargado
}
```

### Cambio 2: OnInit() siempre retorna INIT_SUCCEEDED
```mql5
// ANTES:
return INIT_FAILED;  // ❌ Si handshake falla

// DESPUÉS:
return INIT_SUCCEEDED;  // ✅ EA se carga en modo ERROR/WAITING
```

### Cambio 3: Estados de inicialización más granulares
```mql5
WAITING_LICENSE    // Licencia no configurada, esperando input
VALIDATING         // Intentando handshake
READY              // Operacional, esperando signals
ERROR              // Handshake falló, pero EA sigue cargado
```

### Cambio 4: API URL con valor por defecto
```mql5
if (CARVIPIX_API_URL == "") {
  g_api_url = "https://carvipix.com/api/bot/mt5";  // ✅ Valor por defecto
} else {
  g_api_url = CARVIPIX_API_URL;
}
```

---

## 🎯 RESULTADO

**Archivo compilado:** `CARVIPIX_EA_MT5_V1.ex5`
- Tamaño: 44,182 bytes (18 bytes más que antes)
- Timestamp: 2026-07-15 22:18:43
- Errores: 0
- Warnings: 2 (no críticos)

---

## 📋 COMPORTAMIENTO ESPERADO AHORA

### Escenario 1: Licencia Vacía
```
1. Arrastrar EA a gráfico
2. Ventana de inputs aparece
3. Dejar CARVIPIX_LICENSE_KEY en blanco
4. Presionar OK
5. EA se carga normalmente (sin eliminar)
6. Journal muestra: "[WARNING] Licencia no configurada..."
7. EA entra en estado: WAITING_LICENSE
8. Carita está visible pero "fría" (esperando licencia)
```

### Escenario 2: Licencia Configurada
```
1. Ingresa licencia en inputs: "TEST-DEMO-2026"
2. EA intenta handshake
3. Si backend responde: EA entra en READY
4. Si backend no responde: EA entra en ERROR (pero sigue cargado)
5. Carita es feliz 😊 (READY) o triste 😢 (ERROR)
```

### Escenario 3: Recargar sin Cambios
```
1. Descargar EA del gráfico (Remove)
2. Volver a cargar (Attach)
3. EA usa mismos inputs configurados
4. Funciona normalmente
```

---

## 🛑 VALIDACIONES DESPUÉS DE CARGAR

Abrir Journal (View → Journal) y buscar uno de estos:

### ✅ Carga Exitosa
```
[CARVIPIX] Inicializando EA v1.00
[CARVIPIX] Installation ID: INST-...
[CARVIPIX] Magic Number: ...
[CARVIPIX] Account Hash: ACC-...
[CARVIPIX] API URL: https://...
```

### ⚠️ Carga en Modo Espera (Esperado)
```
[WARNING] Licencia no configurada. Por favor ingresa CARVIPIX_LICENSE_KEY...
[CARVIPIX] EA cargado en modo WAITING_LICENSE. Configura la licencia...
```

### ❌ Error de Inicialización (Inesperado)
```
Inicialización fallida
Expert Advisor unloaded
```

---

## 🚀 PRÓXIMOS PASOS

1. **Descargar nuevo .ex5:**
   ```
   C:\Users\user1\Downloads\CARVIPIX_EA_MT5_V1.ex5
   ```

2. **Copiar a MT5:**
   ```
   MQL5\Experts\CARVIPIX_EA_MT5_V1.ex5
   ```

3. **Reiniciar MT5** (si es necesario)

4. **Cargar EA nuevamente:**
   - Abrir Navigator (Ctrl+N)
   - Arrastrar CARVIPIX EA MT5 V1 a gráfico
   - Dejar inputs en blanco si es prueba
   - Presionar OK

5. **Verificar Journal:**
   - Debe mostrar inicialización sin eliminar EA
   - Carita debe estar visible

---

## 📊 CAMBIOS TÉCNICOS

### Variables Globales (Nuevas)
```mql5
string g_api_url = "";  // Almacena URL del API (puede ser default)
```

### Variables Globales (Modificadas)
```mql5
string g_mode = "INITIALIZING";  // Ahora soporta: WAITING_LICENSE, VALIDATING, READY, ERROR, READ_ONLY, SUSPENDED
```

### Función OnInit() (Refactorizada)
- ✅ Siempre retorna `INIT_SUCCEEDED`
- ✅ No retorna `INIT_PARAMETERS_INCORRECT` o `INIT_FAILED`
- ✅ Permite cargar EA sin licencia
- ✅ Entra en modo apropiado según validaciones

### Funciones Actualizadas
- `PerformHandshake()` — usa `g_api_url` en lugar de `CARVIPIX_API_URL`
- `GetPendingSignal()` — usa `g_api_url`
- `ValidateLicense()` — usa `g_api_url`
- `SendACK()` — usa `g_api_url`
- `SendHeartbeat()` — usa `g_api_url`
- `ReportExecution()` — usa `g_api_url`

---

## ✅ VERIFICACIÓN DE COMPILACIÓN

```
Compilación #4 (Con correcciones):
- 0 errores
- 2 warnings (no críticos)
- 864 ms elapsed
- Tamaño: 44,182 bytes
- Status: LISTO PARA TESTING
```

---

## 🎖️ RESUMEN

| Aspecto | Antes | Después |
|---|---|---|
| **OnInit() error** | INIT_PARAMETERS_INCORRECT ❌ | INIT_SUCCEEDED ✅ |
| **Licencia vacía** | EA se elimina ❌ | EA carga en WAITING_LICENSE ✅ |
| **API URL vacía** | Retorna error ❌ | Usa valor por defecto ✅ |
| **Carita visible** | No ❌ | Sí ✅ |
| **Estado** | ERROR en init | WAITING_LICENSE o READY o ERROR (pero cargado) |

---

**Próximo:** Cargar el nuevo EA en MT5 y validar que no se elimina.
