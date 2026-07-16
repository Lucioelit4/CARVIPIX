# 📋 PLAN DE PRUEBAS FUNCIONALES — CARVIPIX EA MT5 V1

**Versión:** 1.01  
**Fecha:** 2026-07-15  
**Status:** LISTO PARA TESTING EN DEMO  
**Archivo:** `CARVIPIX_EA_MT5_V1.ex5` (44,182 bytes)

---

## 🎯 OBJETIVO

Validar que el EA MT5 funciona correctamente en todos los escenarios operacionales:
- Inicialización sin crashes
- Gestión de licencia
- Conexión API confiable
- Recepción y procesamiento de signals
- Ejecución correcta de órdenes
- Protección con SL/TP
- Control de duplicados
- Recuperación ante fallos

---

## 📌 CONFIGURACIÓN PREVIA

### Cuenta Demo Requerida
- **Broker:** OANDA MetaTrader 5
- **Tipo:** Demo (nunca real)
- **Saldo Mínimo:** 5,000 USD
- **Símbolo Principal:** XAUUSD.sml o XAUUSD
- **Trading Habilitado:** Sí

### Inputs Recomendados
```
CARVIPIX_LICENSE_KEY    = "TEST-DEMO-20260715"
CARVIPIX_API_URL        = "https://staging-carvipix.com/api/bot/mt5" (o URL local)
RISK_MODE               = "FIXED_LOT"
FIXED_LOT               = 0.01
MAX_OPEN_TRADES         = 1
MAX_DAILY_TRADES        = 10
POLLING_SECONDS         = 5
ALLOW_BUY               = true
ALLOW_SELL              = true
ALLOW_NEW_TRADES        = true
```

### Herramientas Requeridas
- MetaTrader 5 (corriendo)
- Navegador web (para revisar API responses)
- Bloc de notas (para registrar resultados)
- Internet estable

---

## 🧪 PRUEBAS (15 ESCENARIOS)

### ✅ PRUEBA 1: Verificación de Inicialización

**Objetivo:** Confirmar que OnInit() se ejecuta correctamente  

**Procedimiento:**
1. En MetaTrader 5: View → Navigator (Ctrl+N)
2. Expandir "Expert Advisors"
3. Buscar y arrastrar "CARVIPIX EA MT5 V1" a gráfico XAUUSD H1
4. Ventana de inputs: Dejar todos valores por defecto
5. Presionar OK
6. Observar esquina superior derecha del gráfico

**Validaciones Esperadas:**
- [ ] Carita visible en esquina superior derecha
- [ ] La carita NO es roja (ícono de error)
- [ ] Journal (View → Journal) muestra:
  ```
  [CARVIPIX] Inicializando EA v1.00
  [CARVIPIX] Installation ID: INST-...
  [CARVIPIX] Magic Number: ...
  [CARVIPIX] Account Hash: ACC-...
  ```
- [ ] NO aparece "Expert Advisor removed"
- [ ] NO aparece error 32767

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 2: Temporizador Activo

**Objetivo:** Confirmar que OnTimer() se ejecuta periódicamente  

**Procedimiento:**
1. Con EA cargado, dejar corriendo 30 segundos
2. Abrir Journal y buscar mensajes de heartbeat
3. Contar cuántos mensajes aparecen

**Validaciones Esperadas:**
- [ ] Mensajes de heartbeat cada 5 segundos (aproximadamente 6 en 30 seg)
- [ ] No aparecen mensajes duplicados en exceso
- [ ] Timer continúa sin parar

**Fórmula:** 30 segundos ÷ 5 segundos/ciclo = 6 ciclos esperados

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 3: Licencia Vacía

**Objetivo:** Validar comportamiento cuando falta licencia  

**Procedimiento:**
1. Descargar EA del gráfico (clic derecho → Remove)
2. Volver a cargar: Dejar CARVIPIX_LICENSE_KEY = "" (vacío)
3. Presionar OK
4. Observar estado

**Validaciones Esperadas:**
- [ ] EA se carga (no desaparece)
- [ ] Carita está visible
- [ ] Journal muestra:
  ```
  [WARNING] Licencia no configurada. Por favor ingresa...
  [CARVIPIX] EA cargado en modo WAITING_LICENSE
  ```
- [ ] NO ejecuta operaciones
- [ ] NO intenta hacer handshake

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 4: Licencia Válida

**Objetivo:** Validar handshake cuando licencia está configurada  

**Procedimiento:**
1. Descargar EA
2. Cargar de nuevo con:
   ```
   CARVIPIX_LICENSE_KEY = "TEST-DEMO-20260715"
   ```
3. Observar Journal durante 10 segundos

**Validaciones Esperadas (escenario A: API disponible):**
- [ ] Journal muestra:
  ```
  [CARVIPIX] Iniciando handshake...
  [CARVIPIX] EA READY. Esperando señales...
  ```
- [ ] Status debe cambiar de VALIDATING a READY
- [ ] Heartbeats continúan cada 5 seg

**Validaciones Esperadas (escenario B: API caída):**
- [ ] Journal muestra:
  ```
  [CARVIPIX] Iniciando handshake...
  [ERROR] Handshake fallido. Verifica licencia y conexión.
  ```
- [ ] EA entra en estado ERROR
- [ ] EA permanece cargado (no desaparece)
- [ ] Continúa enviando heartbeats

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 5: Conexión con API

**Objetivo:** Validar manejo de respuestas HTTP  

**Procedimiento:**
1. Con EA cargado, abrir navegador
2. Ir a la URL del API:
   ```
   https://carvipix.com/api/bot/mt5/validate?installation_id=...
   ```
3. Observar respuesta
4. En MT5, revisar Journal

**Validaciones Esperadas (200 OK):**
- [ ] Navegador muestra respuesta JSON
- [ ] Journal no muestra errors
- [ ] Heartbeat continúa

**Validaciones Esperadas (Error HTTP 5xx):**
- [ ] Journal muestra el código HTTP
- [ ] EA no se cuelga
- [ ] Continúa intentando

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 6: Normalización de Símbolo

**Objetivo:** Validar que el EA reconoce variaciones del símbolo  

**Procedimiento:**
1. Prepararuna signal de prueba con símbolo "XAUUSD"
2. La cuenta broker usa "XAUUSD.sml"
3. Enviar signal al endpoint /signals

**Validaciones Esperadas:**
- [ ] Signal recibida correctamente
- [ ] Journal muestra:
  ```
  Símbolo normalizado: XAUUSD → XAUUSD.sml
  ```
- [ ] Orden se abre en el símbolo correcto

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 7: Validación de Firma

**Objetivo:** Confirmar que signals con firma inválida son rechazadas  

**Procedimiento:**
1. Crear 2 signals:
   - Signal A: signature = "" (vacío)
   - Signal B: signature = "valido" o HMAC válido
2. Enviar ambas

**Validaciones Esperadas:**
- [ ] Signal A rechazada:
  ```
  [ERROR] Firma inválida
  ```
- [ ] Signal B procesada
- [ ] ACK enviado correctamente para ambas

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 8: Control de Duplicados

**Objetivo:** Validar que la misma signal no se ejecuta dos veces  

**Procedimiento:**
1. Crear signal:
   ```
   signal_id: TEST_BUY_001
   symbol: XAUUSD
   decision: BUY
   entry: [precio actual]
   stop_loss: [precio - 20]
   take_profit: [precio + 30]
   ```
2. Enviar signal
3. Esperar a que se procese
4. **Enviar la MISMA signal de nuevo**

**Validaciones Esperadas:**
- [ ] Primera signal: Ejecutada (orden abierta)
- [ ] Segunda signal: Rechazada
  ```
  [WARNING] Señal DUPLICADA
  ACK: DUPLICATE
  ```
- [ ] Una sola orden abierta, no dos

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 9: Apertura BUY

**Objetivo:** Validar que se abre orden BUY correctamente  

**Procedimiento:**
1. Signal:
   ```
   decision: "BUY"
   symbol: "XAUUSD" (o variante)
   entry: [Ask actual]
   stop_loss: [Ask - 20 puntos]
   take_profit: [Ask + 30 puntos]
   lot: 0.01
   ```
2. Enviar signal
3. Observar gráfico y MT5 Trade terminal

**Validaciones Esperadas:**
- [ ] Orden abierta en MT5
- [ ] Tipo: BUY
- [ ] Lote: 0.01
- [ ] Magic Number coincide (ver Orden → Magic)
- [ ] SL colocado correctamente
- [ ] TP colocado correctamente
- [ ] Journal muestra:
  ```
  [EXECUTE] Orden ejecutada. Ticket: [número]
  ```

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 10: Apertura SELL

**Objetivo:** Validar que se abre orden SELL correctamente  

**Procedimiento:**
1. Cerrar orden BUY anterior (si existe)
2. Signal SELL:
   ```
   decision: "SELL"
   symbol: "XAUUSD"
   entry: [Bid actual]
   stop_loss: [Bid + 20 puntos]
   take_profit: [Bid - 30 puntos]
   lot: 0.01
   ```
3. Enviar signal

**Validaciones Esperadas:**
- [ ] Orden abierta SELL
- [ ] Lote: 0.01
- [ ] SL y TP correctos para SELL
- [ ] Magic Number correcto
- [ ] Terminal muestra la operación

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 11: SL y TP Colocados

**Objetivo:** Validar que Stop Loss y Take Profit se respetan  

**Procedimiento:**
1. Abrir orden BUY con SL y TP (ver Prueba 9)
2. Esperar a que se cierre automáticamente por:
   - TP alcanzado, O
   - SL alcanzado
3. Revisar P&L

**Validaciones Esperadas:**
- [ ] Orden se cierra cuando toca SL o TP
- [ ] NO se cierra antes
- [ ] P&L es positivo (si TP) o negativo (si SL)
- [ ] Cierre es exacto al precio de SL/TP (dentro de spread)

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 12: Señal Expirada

**Objetivo:** Validar que signals expiradas no se ejecutan  

**Procedimiento:**
1. Signal con:
   ```
   expires_at: "2026-07-15T20:00:00Z"  (hora pasada)
   ```
2. Enviar signal

**Validaciones Esperadas:**
- [ ] Signal rechazada:
  ```
  [WARNING] Señal expirada
  ```
- [ ] ACK: EXPIRED
- [ ] NO se abre orden

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 13: Señal Inválida

**Objetivo:** Validar manejo de signals con datos incorrectos  

**Procedimiento:**
Probar cada escenario:

1. **Campo vacío:**
   ```
   signal_id: ""
   ```
   → Esperado: Rechazada, error "INVALID_ID"

2. **Símbolo inexistente:**
   ```
   symbol: "INVALIDXYZ"
   ```
   → Esperado: Rechazada, "SYMBOL_NOT_FOUND"

3. **Decision desconocida:**
   ```
   decision: "UNKNOWN"
   ```
   → Esperado: Rechazada, "INVALID_DECISION"

4. **Lote negativo:**
   ```
   lot: -0.01
   ```
   → Esperado: Rechazada, "INVALID_LOT"

5. **SL = Entry:**
   ```
   stop_loss: [igual a entry]
   ```
   → Esperado: Rechazada, "INVALID_SL"

**Validaciones Esperadas para cada:**
- [ ] Signal rechazada
- [ ] Registro en Journal
- [ ] No se abre orden
- [ ] ACK de error enviado

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 14: Pérdida de Conexión

**Objetivo:** Validar recuperación ante caída de API  

**Procedimiento:**
1. EA corriendo y conectado
2. **Desactivar internet** temporalmente
3. Esperar 30 segundos
4. **Restaurar internet**
5. Observar Journal

**Validaciones Esperadas:**
- [ ] Durante caída:
  ```
  [ERROR] Handshake FALLIDO
  Status: ERROR
  ```
- [ ] EA permanece cargado
- [ ] NO se cierra automáticamente

- [ ] Después de restaurar:
  ```
  [SUCCESS] Handshake EXITOSO
  Status: READY
  ```
- [ ] EA se reconecta automáticamente
- [ ] Continúa operando

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

### ✅ PRUEBA 15: Reinicio de MT5 (Persistencia)

**Objetivo:** Validar que no se repiten signals después de reinicio  

**Procedimiento:**
1. Ejecutar una signal (Prueba 9 BUY)
2. **Cerrar MT5 completamente** (File → Exit)
3. Esperar 5 segundos
4. **Reabrirlo**
5. Cargar EA nuevamente en el gráfico
6. **Enviar la MISMA signal otra vez**

**Validaciones Esperadas:**
- [ ] Después del reinicio:
  - Signal guardada en memoria del EA
  - La misma signal no se ejecuta dos veces
- [ ] Al enviar de nuevo:
  ```
  [WARNING] Señal DUPLICADA
  ```
- [ ] Una sola orden total (no dos)

**Resultado:** ✅ Aprobado / ❌ Falló

**Observaciones:**
```
[Espacio para notas]
```

---

## 📋 CHECKLIST FINAL

Después de completar todas las pruebas, marcar:

```
INICIALIZACIÓN
[ ] EA carga sin errores
[ ] OnInit() se ejecuta
[ ] Timer arranca
[ ] Carita es visible

LICENCIA
[ ] Licencia vacía: modo WAITING_LICENSE
[ ] Licencia válida: handshake exitoso
[ ] Licencia inválida: estado ERROR

CONEXIÓN
[ ] API disponible: conecta
[ ] API caída: maneja error
[ ] Pérdida internet: se recupera

SIGNALS
[ ] Signal válida: ejecutada
[ ] Signal duplicada: rechazada
[ ] Signal expirada: rechazada
[ ] Signal inválida: rechazada

TRADING
[ ] BUY abierto correctamente
[ ] SELL abierto correctamente
[ ] SL y TP colocados
[ ] Orden se cierra por SL/TP

ROBUSTEZ
[ ] No hay crashes
[ ] Recuperación ante errores
[ ] Persistencia de duplicados
[ ] Reinicio correcto
```

---

## 📊 RESUMEN DE RESULTADOS

| Prueba | Status | Observaciones |
|--------|--------|---------------|
| 1. Inicialización | ✅/❌ | |
| 2. Temporizador | ✅/❌ | |
| 3. Licencia Vacía | ✅/❌ | |
| 4. Licencia Válida | ✅/❌ | |
| 5. Conexión API | ✅/❌ | |
| 6. Normalización Símbolo | ✅/❌ | |
| 7. Validación Firma | ✅/❌ | |
| 8. Control Duplicados | ✅/❌ | |
| 9. Apertura BUY | ✅/❌ | |
| 10. Apertura SELL | ✅/❌ | |
| 11. SL y TP | ✅/❌ | |
| 12. Signal Expirada | ✅/❌ | |
| 13. Signal Inválida | ✅/❌ | |
| 14. Pérdida Conexión | ✅/❌ | |
| 15. Reinicio MT5 | ✅/❌ | |

**Total Aprobadas:** __/15  
**Aprobación General:** ✅ / ❌

---

## 🎖️ CRITERIOS DE APROBACIÓN

✅ **APROBADO** si:
- 13 o más pruebas pasan
- No hay crashes
- Se abre y cierra orden correctamente
- SL/TP funcionan
- Duplicados se controlan

❌ **NO APROBADO** si:
- Menos de 13 pruebas pasan
- EA se reinicia solo
- Órdenes se abren mal
- SL o TP no funcionan
- Duplicados no se controlan

---

**Próximo:** Ejecutar pruebas y documentar resultados.
