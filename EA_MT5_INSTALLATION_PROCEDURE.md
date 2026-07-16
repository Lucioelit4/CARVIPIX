# 📋 REPORTE DE INSTALACIÓN — EA MT5 CARVIPIX V1

**Fecha:** 2026-07-15  
**Hora:** 21:45 UTC  
**Status:** ✅ ARCHIVO INSTALADO, PENDIENTE VALIDACIÓN EN GRÁFICO  

---

## ✅ VERIFICACIÓN TÉCNICA

### Archivo .ex5 Compilado
```
✅ Localización: c:\Users\user1\carvipix\scripts\CARVIPIX_EA_MT5_V1.ex5
✅ Tamaño: 44,164 bytes
✅ Compilación: 0 errores, 2 warnings
✅ Timestamp: 2026-07-15 21:38:29
```

### Instalación en MT5
```
✅ Carpeta Experts: C:\Users\user1\AppData\Roaming\MetaQuotes\Terminal\EC6CB01DD6EC087A123DA4B636574C06\MQL5\Experts\
✅ Archivo presente: CARVIPIX_EA_MT5_V1.ex5 (44,164 bytes)
✅ Archivo fuente: CARVIPIX_EA_MT5_V1.mq5 (21,071 bytes)
✅ Terminal MT5: OANDA MetaTrader 5 (Corriendo, PID: 7756)
```

---

## 🎯 PROCEDIMIENTO DE VALIDACIÓN EN GRÁFICO

### Paso 1: Abrir Navigator
1. En MetaTrader 5, presionar **Ctrl+N**
2. O hacer clic en **View → Navigator**

### Paso 2: Localizar el EA
1. En Navigator, expandir **Expert Advisors**
2. Buscar: **CARVIPIX EA MT5 V1**
3. Debe aparecer en la lista

### Paso 3: Preparar gráfico de prueba
1. Abrir un gráfico con **XAUUSD** (recomendado para testing)
2. Timeframe: **H1** (1 hora)
3. El gráfico debe estar visible en la pantalla

### Paso 4: Cargar el EA
1. En Navigator, hacer clic derecho en **CARVIPIX EA MT5 V1**
2. Seleccionar **Attach to a chart**
3. O: Arrastrar el EA directamente al gráfico

### Paso 5: Configurar Inputs
Una ventana de inputs aparecerá. Configurar:

```
CARVIPIX_LICENSE_KEY = "TEST-DEMO-2026"  (cualquier valor por ahora)
CARVIPIX_API_URL = "https://carvipix.com/api/bot/mt5"  (predeterminado)
ALLOW_NEW_TRADES = true
```

Dejar otros inputs en valores predeterminados.

### Paso 6: Dar permisos WebRequest
1. Marcar casilla: **Allow WebRequest for indicated URLs**
2. En la URL: **https://carvipix.com/api/bot/mt5**
3. Hacer clic en **OK**

### Paso 7: Activar el EA
1. El EA debe cargar en el gráfico
2. Buscar la **carita de smiley** (Happy face) en la esquina superior derecha del gráfico
3. Si aparece: ✅ EA está activo
4. Si no aparece o muestra cara triste: ❌ Error

---

## 🔍 VALIDACIONES ESPERADAS

### En el Gráfico
- [x] EA aparece en la esquina superior derecha
- [x] Carita está feliz (😊) o con reloj (⏳)
- [x] Dice "CARVIPIX EA MT5 V1" o similar

### En el Journal (Vista → Journal)
Debe mostrar algo como:

```
2026.07.15 21:45:23.123 | CARVIPIX | Inicializando EA v1.00
2026.07.15 21:45:23.234 | CARVIPIX | Installation ID: INST-[cuenta]-[timestamp]
2026.07.15 21:45:23.245 | CARVIPIX | Magic Number: [número único]
2026.07.15 21:45:23.256 | CARVIPIX | Account Hash: ACC-[hash]
2026.07.15 21:45:24.100 | CARVIPIX | Iniciando handshake...
```

### Errores NO esperados
❌ "Expert Advisor not found"  
❌ "Compilation error"  
❌ "DLL import error"  
❌ "Illegal operation"  

---

## 🛑 SI ALGO FALLA

### Error: "No such file or directory"
- Verificar que el archivo está en: `MQL5\Experts\CARVIPIX_EA_MT5_V1.ex5`
- Reiniciar MT5 con **Ctrl+Q** y reabrir

### Error: "Expert Advisor compilation error"
- Esto NO debería ocurrir (ya está compilado como .ex5)
- Si ocurre: Copiar de nuevo el archivo .ex5

### Error: "Initialization failed"
- Revisar Journal para mensaje exacto
- Probablemente sea error de conexión con API (esperado por ahora)
- Hacer clic en "REMOVE" para descargar el EA del gráfico
- Revisar configuración

### Error: "Expert not found in Navigator"
- Presionar **F5** en Navigator para refrescar
- O cerrar y reabrirnavigator con **Ctrl+N**

---

## 📊 EVIDENCIA ESPERADA

Una vez que el EA cargue, tomar capturas de:

### Captura 1: Navigator
```
View → Navigator
Mostrar sección "Expert Advisors"
CARVIPIX EA MT5 V1 debe estar visible
```

### Captura 2: Propiedades del EA
```
Clic derecho en EA en Navigator
Select "Properties"
Mostrar campo "Name", "Author", "Version"
```

### Captura 3: Gráfico con EA Cargado
```
Gráfico XAUUSD con EA
Carita visible en esquina superior derecha
Status debe decir algo como "CARVIPIX EA MT5 V1" o smiley
```

### Captura 4: Journal de Inicialización
```
View → Journal
Mostrar líneas iniciales de [CARVIPIX] iniciando
Debe mostrar:
  - Installation ID generado
  - Magic Number
  - Account Hash
  - Inicio de handshake
```

---

## ✅ CRITERIOS DE ÉXITO

El test será **EXITOSO** si:

1. ✅ El EA aparece en Navigator → Expert Advisors
2. ✅ El EA se puede arrastrar a un gráfico sin errores
3. ✅ El EA carga en el gráfico (carita visible)
4. ✅ OnInit() se ejecuta correctamente
5. ✅ Journal muestra mensajes "[CARVIPIX]" sin errores críticos
6. ✅ El EA NO intenta abrir trades (solo debe hacer handshake en OnTimer)
7. ✅ El EA NO muestra errores de WebRequest (esperando a que backend esté listo)
8. ✅ Después de 10 segundos, el EA debe estar en estado "READY" u otro estado operacional

---

## 📌 IMPORTANTE

Este test **NO** valida:
- ❌ Que las señales se reciban (backend no está listo)
- ❌ Que se ejecuten trades (no hay signals)
- ❌ Que el P&L sea correcto (no hay trades)
- ❌ Que el handshake funcione (API puede no estar en staging)

Este test **SOLO** valida:
- ✅ Que el EA compila correctamente
- ✅ Que se instala en MT5 sin conflictos
- ✅ Que OnInit() se ejecuta sin crashes
- ✅ Que el código MQL5 es válido en runtime

---

## 🚀 SIGUIENTE PASO

Una vez que el EA cargue correctamente en el gráfico y el Journal muestre inicialización sin errores:

1. Documentar el estado en pantalla (capturas)
2. Proceder a Fase 2: **Handshake con Backend**
   - Verificar que POST /handshake funciona
   - Confirmar que instalación se registra en DB
   - Validar que Admin muestra EA ACTIVE

---

## 📝 NOTAS TÉCNICAS

**Qué hace OnInit():**
```mql5
1. Valida licencia (input CARVIPIX_LICENSE_KEY)
2. Genera Installation ID único
3. Genera Account Hash
4. Genera Magic Number (CRC32 hash)
5. Inicia timer cada 5 segundos (polling)
6. Intenta POST handshake a CARVIPIX_API_URL
7. Si handshake OK → estado "READY"
8. Si handshake FAIL → estado "ERROR"
```

**Qué hace OnTimer():**
```mql5
Cada 5 segundos:
1. Envía heartbeat a backend
2. Valida que licencia aún es válida
3. Si está en READ_ONLY o ERROR: retorna
4. Si está READY: intenta GET signals
5. Si hay signal: ValidateSignal() → ProcessSignal() → ExecuteSignal()
```

**WebRequest en MQL5:**
- Requiere permiso de usuario en primer handshake
- MT5 mostrará diálogo pidiendo autorización
- URL debe estar en whitelist: "https://carvipix.com/api/bot/mt5"
- Timeout: 10 seg para handshake, 5 seg para signals

---

## 🎖️ RESUMEN

| Componente | Status | Detalle |
|---|---|---|
| Compilación MQL5 | ✅ | 0 errores, 2 warnings |
| Archivo .ex5 | ✅ | 44 KB, listo para instalar |
| Copia a Experts | ✅ | Presente en MQL5/Experts/ |
| MT5 Terminal | ✅ | Corriendo (PID: 7756) |
| EA en Navigator | ⏳ | Debe verificarse manualmente |
| EA en Gráfico | ⏳ | Debe cargarse manualmente |
| OnInit() | ⏳ | Debe ejecutarse al cargar |
| Handshake | ⏳ | Depende de backend |

---

**PRÓXIMO CHECKPOINT:** Captura de pantalla del EA cargado en gráfico + Journal de inicialización.
