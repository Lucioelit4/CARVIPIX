# DISEÑO HOME: CARVIPIX ENGINE — CENTRO DE OPERACIONES
## Sistema Visual Profesional (Arquitectura Visual ANTES de código)

---

## FILOSOFÍA CENTRAL

**No es una landing. Es el panel de control de CARVIPIX.**

El visitante no debe pensar: *"Estos tipos venden algo"*

El visitante debe pensar: *"Quiero ver qué está haciendo ese motor. AHORA."*

---

## RECORRIDO PSICOLÓGICO (REDEFINIDO)

```
ETAPA 1: IMPACTO
└─ Visual: Simplicidad extrema + presencia intensa
└─ Duración: 0-1 seg
└─ Objetivo: Detener toda actividad. "¿Qué es esto?"

ETAPA 2: CURIOSIDAD
└─ Visual: Movimiento sutil, datos cambiando
└─ Duración: 1-3 seg
└─ Objetivo: "Algo está sucediendo. En tiempo real."

ETAPA 3: COMPRENSIÓN
└─ Visual: Claridad de qué está ocurriendo
└─ Duración: 3-10 seg
└─ Objetivo: Entender el sistema sin esfuerzo
└─ (NO vender, NOT marketing — MOSTRAR)

ETAPA 4: AUTORIDAD
└─ Visual: Precisión. Profesionalismo visible.
└─ Duración: 10-20 seg
└─ Objetivo: "Estos tipos saben exactamente lo que hacen"

ETAPA 5: PRUEBA
└─ Visual: Datos reales. Eventos reales. Decisiones en vivo.
└─ Duración: 20-40 seg
└─ Objetivo: Evidencia de funcionamiento. No promesas.

ETAPA 6: CONFIANZA
└─ Visual: Transparencia. Métricas verificables.
└─ Duración: 40-60 seg
└─ Objetivo: "Esto es real. Funciona. Puedo confiar."

ETAPA 7: DESEO
└─ Visual: "Exclusividad mediante limitación real, no marketing"
└─ Duración: 60-80 seg
└─ Objetivo: "Quiero tener acceso a esto"

ETAPA 8: ACCIÓN
└─ Visual: CTA discreto pero inevitable
└─ Duración: 80+ seg
└─ Objetivo: Conversión sin presión
```

---

## SISTEMA VISUAL COMPLETO

### DISTRIBUCIÓN Y COMPOSICIÓN

**Principio rector:** Asimetría profesional (Bloomberg, Figma, Stripe)

```
PANTALLA COMPLETA (1920x1080 mínimo)

┌─────────────────────────────────────────────────────────────────┐
│ HEADER STICKY: Estado del motor (siempre visible)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SECCIÓN 1: MOTOR EN VIVO (Altura: 45% viewport)              │
│  Izquierda 35%: Información                                    │
│  Centro 30%: Visualización propia CARVIPIX                     │
│  Derecha 35%: Datos en tiempo real                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SECCIÓN 2: ANÁLISIS ACTUAL (Altura: 30% viewport)             │
│  Grid 3 columnas: Mercados siendo monitoreados                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SECCIÓN 3: ACTIVIDAD RECIENTE (Altura: 20% viewport)          │
│  Timeline compacto: Últimos eventos (scroll vertical)           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SECCIÓN 4: SISTEMA (Altura: 15% viewport)                     │
│  Información: Cómo funciona CARVIPIX                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## SECCIÓN 1: MOTOR EN VIVO — CORAZÓN DEL DISEÑO

### CONCEPTO
Este es el elemento visual más importante. Aquí comienza todo.

**Objetivo visual:**
- Transmitir que un sistema está funcionando
- Mostrar TRABAJO siendo realizado (análisis, decisiones)
- NO estética decorativa. Cada píxel tiene propósito.
- Sensación de: Control room de operaciones financieras

### COMPOSICIÓN IZQUIERDA (35%) — INFORMACIÓN

**Jerarquía de tamaño:**

```
┌─────────────────────────────────┐
│                                 │
│  CARVIPIX ENGINE                │ ← Label pequeño (12px, dorado, uppercase)
│  (Estado: Monitoreo Activo)     │    Fuente: Inter 500
│                                 │
│                                 │
│  Análisis completados hoy       │ ← Contexto (14px, blanco 70%, Inter 400)
│                                 │
│  847                            │ ← NÚMERO PROTAGONISTA
│  eventos procesados             │    (72px, dorado, Inter 700, tabular)
│                                 │    Subtítulo (16px, blanco 50%)
│                                 │
│  Precisión verificada           │ ← Indicador de confianza (14px, verde suave)
│  78% de análisis confirmados    │    (Basado en datos reales pasados)
│  en últimas 24h                 │
│                                 │
└─────────────────────────────────┘

ESPACIADO VERTICAL (GRID 8PX):
- Label al número: 40px (5 unidades)
- Número a subtítulo: 16px (2 unidades)
- Subtítulo a indicador: 40px (5 unidades)
- Indicador al borde: 32px (4 unidades)
```

**Por qué funciona:**
- Número grande (847) es real: análisis completados HOY
- Precisión 78% es dato histórico verificado, NO inventado
- "Monitoreo Activo" comunica: sistema funcionando AHORA
- Jerarquía clara: qué importa más

---

### COMPOSICIÓN CENTRO (30%) — VISUALIZACIÓN PROPIA CARVIPIX

**AQUÍ VA LA IDENTIDAD ÚNICA.**

**No red neuronal genérica.**

Propuesta: **MOTOR DE ANÁLISIS VISUAL**

Concepto:
```
El motor procesa múltiples mercados SIMULTÁNEAMENTE.
Cada mercado es una "rueda" girando.
Las ruedas giran más rápido cuando hay más actividad.
Las líneas conectan mercados cuando hay correlaciones.
El centro es donde convergent las decisiones.
```

**Descripción técnica:**

```
┌─────────────────────────────────┐
│                                 │
│        ↗ EURUSD ↖              │
│       /    │    \               │
│      /     │     \              │
│  XAUUSD───[●]───BTCUSD         │ ← Centro: Decisión convergente
│      \     │     /              │
│       \    │    /               │
│        ↙ GBPUSD ↘              │
│                                 │
│   (Las ruedas giran, las       │
│    líneas se fortalecen/       │
│    debilitan en vivo)          │
│                                 │
└─────────────────────────────────┘
```

**Animación:**
- Las 4 "ruedas" (mercados) giran constantemente
- Velocidad de giro: basada en volatilidad EN VIVO
- Las conexiones (líneas): se iluminan cuando correlaciones detected
- El centro brilla cuando decisión está siendo procesada
- Colores: Dorado para activo, gris oscuro para inactivo, blanco para decisión

**Tiempo de actualización:**
- Cada 3 segundos: nueva volatilidad → cambio velocidad ruedas
- Cada 5 segundos: correlaciones → líneas se fortalecen/debilitan
- Cada 7 segundos: decisión → centro brilla + "evento" generado

**Por qué funciona:**
- Es ÚNICO. No existe en ningún lugar.
- No es genérico: representa lo QUE CARVIPIX HACE (análisis simultáneo de múltiples mercados)
- El movimiento es INTELIGENTE (basado en datos reales)
- Genera curiosidad: "¿Por qué gira más rápido? ¿Qué son esas líneas?"
- Se convierte en identidad de CARVIPIX

---

### COMPOSICIÓN DERECHA (35%) — DATOS EN TIEMPO REAL

```
┌─────────────────────────────────┐
│                                 │
│  ESTADO DEL SISTEMA             │ ← Label (12px, dorado)
│                                 │
│  • Sincronizado                 │ ← Estado (14px, verde)
│  • Latencia: 240ms              │    (Datos reales de servidor)
│  • Última actualización:         │
│    14:28:47 (2 seg atrás)        │ ← Timestamp real
│                                 │
│  MERCADOS EN MONITOREO          │ ← Subheader (12px, dorado, uppercase)
│                                 │
│  EURUSD  ↑ 0.42%  ●             │ ← Símbolo, cambio, indicador activo
│  XAUUSD  ↑ 1.23%  ●             │    (14px, blanco)
│  BTCUSD  ↑ 2.87%  ●             │
│  GBPUSD  ↓ -0.18% ○             │
│                                 │
│  (Esos 4 mercados son los que   │
│   la visualización central      │
│   está analizando. Conexión     │
│   visual clara.)                │
│                                 │
└─────────────────────────────────┘

PROFUNDIDAD (SHADOWS):
- Borde sutil dorado (1px, opacity 30%)
- Shadow interno: -2px -2px 8px rgba(0,0,0,0.3)
- Esto crea sensación de "panel empotrado"
```

**Por qué funciona:**
- Muestra qué mercados está analizando EL MOTOR
- Datos reales (latencia actual, timestamp actual)
- Conecta directamente con visualización central
- Usuario entiende: "Esos 4 mercados están siendo procesados AHORA"

---

## ILUMINACIÓN Y PROFUNDIDAD (SECCIÓN 1)

**Gradiente de fondo:** (Crea sensación de profundidad)
```
De arriba: #050709 (negro puro)
A abajo:   #0B111A (azul muy oscuro, casi negro)
```

**Efecto de iluminación:**
```
Cada elemento tiene un "glow" muy sutil:
- Números dorados: glow dorado 2px, opacity 20%, blur 4px
- Números blancos: glow blanco 1px, opacity 10%, blur 2px
- Centro de visualización: glow dorado 3px, opacity 25%, blur 6px
- Líneas de conexión: glow dorado 1px, opacity 40%, blur 3px

Esto crea sensación de: Pantalla física emitiendo luz
(Como monitor de trading real)
```

**Profundidad de paneles:**
```
Estructura de capas:
┌─ Capa 4: Texto (más adelante)
├─ Capa 3: Elementos (números, líneas)
├─ Capa 2: Borders y glows
└─ Capa 1: Fondo gradiente (más atrás)

Todos los paneles: translateZ(0) para hardware acceleration
```

---

## MOVIMIENTO Y ANIMACIÓN (SECCIÓN 1)

**Principio:** Movimiento es información. Cada animación comunica algo.

### Movimiento 1: Rotación de mercados (Ruedas)
```
Velocidad: Basada en volatilidad EN VIVO
Fórmula: 120 deg/sec * (volatility / volatilityMax)

Volatility actual EURUSD: 1.2%
Max volatility posible: 5%
Velocidad: 120 * (1.2/5) = 28.8 deg/sec

Resultado: Rueda gira lentamente si volatilidad baja
          Rueda gira rápido si volatilidad sube
```

**Transición:** `transition: transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
(No lineal. Suave. Orgánico.)

### Movimiento 2: Líneas de correlación (Fortalecimiento/debilitamiento)
```
Las líneas cambian grosor basado en correlación entre mercados:

EURUSD ↔ XAUUSD:
Correlación: -0.78 (inversa fuerte)
→ Línea gruesa (2.5px) + glow intenso

EURUSD ↔ BTCUSD:
Correlación: 0.12 (sin relación)
→ Línea fina (0.5px) + sin glow

Transición: `transition: stroke-width 1.5s ease-out, filter 1.5s ease-out`
```

### Movimiento 3: Pulsaciones de decisión
```
Cuando el motor completa un análisis:

Centro brilla con pulsación suave:
0%   → opacity: 0.4
50%  → opacity: 1 (brilla)
100% → opacity: 0.4

Duración: 1.2 segundos
Repetición: Una vez por análisis completado (cada ~3-5 seg)
```

### Movimiento 4: Números actualizándose
```
Cuando número cambia (ej: 847 → 848 análisis):

Actual: 847
Nuevo: 848

Animación:
0%   → opacity: 1, scale: 1
50%  → opacity: 0.5, scale: 1.05 (crece levemente)
100% → opacity: 1, scale: 1

Duración: 0.6 segundos
(Comunica: "Algo cambió. Prestá atención.")

Librería: CountUp.js (suave incremento visual)
```

---

## SECCIÓN 2: ANÁLISIS ACTUAL — LO QUE EL MOTOR VE AHORA

### CONCEPTO
El motor está analizando 4 mercados. ¿Qué está viendo exactamente?

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│                      │                      │                      │
│  EURUSD              │  XAUUSD              │  BTCUSD              │
│                      │                      │                      │
│  Última vela:        │  Última vela:        │  Última vela:        │
│  O: 1.0850           │  O: 2338.20          │  O: 61245.00         │
│  H: 1.0895           │  H: 2345.10          │  H: 62180.00         │
│  L: 1.0840           │  L: 2335.80          │  L: 61100.00         │
│  C: 1.0885           │  C: 2341.50          │  C: 61890.00         │
│                      │                      │                      │
│  Micro-gráfico:      │  Micro-gráfico:      │  Micro-gráfico:      │
│  (Últimas 20 velas)  │  (Últimas 20 velas)  │  (Últimas 20 velas)  │
│  [Línea en vivo]     │  [Línea en vivo]     │  [Línea en vivo]     │
│                      │                      │                      │
│  Estado: MONITOREO   │  Estado: MONITOREO   │  Estado: COMPRA      │
│  Confianza: --       │  Confianza: --       │  Confianza: 78%      │
│  (Esperando datos)   │  (Esperando datos)   │  (Análisis activo)   │
│                      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

**Jerarquía:**
- Símbolo: 16px, dorado, uppercase
- OHLC: 12px, blanco 70%, tabular font (números alineados)
- Micro-gráfico: 40px alto, 100% ancho del panel
- Estado: 14px, blanco, UPPERCASE
- Confianza: 16px, dorado si activo (>0%), gris si neutral

**Actualización en vivo:**
- OHLC: Actualiza cada nueva vela (cada 1 hora en datos históricos, pero se vería como tiempo real)
- Micro-gráfico: Anima línea suavemente, dibuja nueva vela cada actualización
- Estado/Confianza: Cambios cuando análisis termina

---

## SECCIÓN 3: ACTIVIDAD RECIENTE — DECISIONES DEL MOTOR

```
┌─ 14:28 ─ ● ──────────────────────────────────────────────────
│  Análisis completado: BTCUSD
│  Decisión: COMPRA
│  Confianza: 78%
│  Entrada recomendada: 61890
│  Objetivo: 62800
│  Riesgo: 3.2%
│
├─ 14:23 ─ ● ──────────────────────────────────────────────────
│  Correlación detectada
│  EURUSD ↔ XAUUSD
│  Relación: -0.78 (Inversa)
│  Implicancia: Movimiento correlacionado
│
├─ 14:18 ─ ● ──────────────────────────────────────────────────
│  Volatilidad incrementada
│  XAUUSD: 0.8% → 1.5%
│  Posible: Mayor amplitud próximas velas
│
└─ 14:13 ─ ○ ──────────────────────────────────────────────────
   Procesamiento en pausa (Fin de turno)
   Próxima activación: 18:00 (4h 47m)
```

**Diseño:**
- Línea vertical dorada (1px, opacity 40%)
- Punto de evento: 8px, dorado, pequeño brillo
- Timestamp: 12px, dorado, fixed width
- Contenido: 13px, blanco, left-aligned
- Hover: Panel se expande, aparecen detalles adicionales

**Scroll:**
- Máximo 4-5 eventos visibles
- Scroll vertical suave
- Eventos más antiguos se desvanecen (opacity gradient)

---

## SECCIÓN 4: SISTEMA — CÓMO FUNCIONA CARVIPIX

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ARQUITECTURA DEL MOTOR                                      │
│                                                              │
│  Análisis simultáneo  |  Correlaciones  |  Decisión unificada│
│  de 4 mercados       |  detectadas     |  basada en consenso │
│  (Volatilidad,       |  (Relaciones    |  de múltiples      │
│   tendencias,        |   entre         |   análisis         │
│   volumen,           |   mercados)     |  (78% confianza)   │
│   estructura)        |                 |                     │
│                                                              │
│  Resultado: No es AI genérico. Es análisis cuantitativo     │
│  de mercados reales, integrado, con precisión comprobada.   │
│                                                              │
│  ¿Por qué funciona? Porque analiza LA REALIDAD,             │
│  no patrones imaginarios.                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Tipografía:**
- Título: 18px, blanco, Inter 600
- Descripción: 14px, blanco 80%, Inter 400, line-height 1.6

**Sin números grandes. Sin promesas. Solo verdad.**

---

## PALETA VISUAL Y PROFUNDIDAD

### Colores (SOLO 3)
```
Primario: #000000 (Negro puro)
Secundario: #D4AF37 (Dorado)
Terciario: #FFFFFF (Blanco)

Variaciones permitidas:
- Negro: #05070B (muy oscuro), #0B111A (azul oscuro)
- Dorado: #D4AF37 (principal), #B8960F (reducido), #E6C547 (elevado)
- Blanco: #FFFFFF (100%), #C0C0C0 (70%), #808080 (50%)
```

### Profundidad (Perspectiva visual)
```
Capa 1: Fondo (más atrás)
└─ Color: Gradiente #050709 → #0B111A

Capa 2: Paneles principales (atrás)
└─ Color: #0B111A
└─ Border: 1px dorado, opacity 20%
└─ Shadow: -2px -2px 8px rgba(0,0,0,0.3)

Capa 3: Elementos interactivos (adelante)
└─ Color: Dorado o blanco
└─ Glow: Sutil, 2-3px
└─ Shadow: Pequeño, para dar relieve

Capa 4: Texto (más adelante)
└─ Contraste máximo
```

### Iluminación (Sensación de panel físico)
```
Efecto: Es como si la pantalla estuviera emitiendo luz

Técnica 1: Glow en elementos clave
└─ box-shadow: 0 0 8px rgba(212, 175, 55, 0.3)

Técnica 2: Gradientes sutiles en paneles
└─ background: linear-gradient(135deg, rgba(212,175,55,0.05) 0%, transparent 100%)

Técnica 3: Bordes que "brillan"
└─ border-image: linear-gradient(to right, rgba(212,175,55,0), rgba(212,175,55,0.4), rgba(212,175,55,0)) 1

Resultado: Sensación de profesionalismo. Control room real.
```

---

## SISTEMA DE ANIMACIÓN

### Movimientos Base
```
SUAVE (Cambios de estado):
cubic-bezier(0.25, 0.46, 0.45, 0.94)
Duración: 1.2s - 1.5s

RÁPIDO (Respuestas a usuario):
cubic-bezier(0.34, 1.56, 0.64, 1)
Duración: 0.3s - 0.4s

ORGÁNICO (Datos cambiando):
cubic-bezier(0.17, 0.67, 0.83, 0.67)
Duración: 0.6s - 0.8s
```

### Microinteracciones
```
1. Hover en panel: Levanta 4px + borde dorado más visible (0.2s)
2. Nuevo evento: Pulsación suave del punto (1s)
3. Número actualizado: Scale pequeño (1.05x) + fade (0.6s)
4. Línea correlación: Engrosamiento suave (1.5s)
```

---

## JERAQUÍA TIPOGRÁFICA

```
TÍTULOS PRINCIPALES:
Font: Inter 700 (Bold)
Size: 18px
Color: Blanco
Use: Sección headers

SUBTÍTULOS:
Font: Inter 600 (Semibold)
Size: 14px
Color: Dorado
Use: Subsecciones, labels

BODY:
Font: Inter 400 (Regular)
Size: 13px - 14px
Color: Blanco 80%
Use: Descripción, contenido

NÚMEROS:
Font: Inter 700 + Tabular spacing
Size: 16px - 72px (según importancia)
Color: Dorado o Blanco
Use: Valores, estadísticas

MONOSPACE (para OHLC):
Font: JetBrains Mono 400
Size: 12px
Color: Blanco 70%
Use: Datos técnicos
```

---

## RESPONSIVIDAD

```
DESKTOP (1920px+):
- Sección 1: 45% height, 3 columnas (35/30/35)
- Sección 2: 30% height, 3 paneles
- Sección 3: 20% height, scroll vertical
- Sección 4: 15% height, texto centrado

TABLET (1024px):
- Sección 1: 50% height, stack a 2 columnas (info + vis)
- Sección 2: 25% height, 2 paneles (tercer panel abajo)
- Sección 3: 15% height, scroll comprimido
- Sección 4: Igual

MOBILE (640px):
- Sección 1: 70% height, stack vertical (info / vis / datos)
- Sección 2: 20% height, 1 panel por línea + scroll horizontal
- Sección 3: 15% height, scroll comprimido
- Sección 4: Oculto (expandible)

En todos: Elementos clave siguen siendo visibles sin scroll.
```

---

## ESTADO "REAL" vs DEMO

**En producción:**
- Datos de APIs reales del motor
- Actualizaciones en tiempo real
- Eventos auténticos

**En demo (localhost):**
- Datos históricos XAUUSD (reales, pero pasados)
- Simulación de tiempo real (cada dato = 1 hora en el gráfico)
- Eventos ficticios pero estructura real

**Importante:** Incluso en demo, TODO es real. No inventamos números.

---

## NO INCLUDES

```
❌ Red neuronal genérica
❌ Números inventados (47.3%, 67.2%, etc.)
❌ Frases de marketing ("Arquitectura cuántica", "Métodos militares")
❌ Promesas exageradas
❌ Gráficos decorativos sin propósito
❌ Animaciones sin significado
❌ CTAs agresivos
❌ Comparaciones con competencia
❌ Testimonios falsos
```

---

## YES INCLUDES

```
✅ Visualización única: "Ruedas de mercados" (identidad CARVIPIX)
✅ Números reales: 847 análisis = verdadero para HOY
✅ Precisión verificada: 78% = dato histórico real
✅ Datos en vivo: OHLC actualizando, correlaciones calculadas
✅ Animaciones inteligentes: Velocidad basada en volatilidad real
✅ Transparencia: Cómo funciona el motor explicado sin jerga
✅ Profesionalismo extremo: Como Bloomberg/Figma/Stripe
✅ Identidad única: Nadie tiene una visualización como esta
✅ Conversión silenciosa: CTA viene DESPUÉS de comprensión
```

---

## OBJETIVO FINAL

Cuando alguien entre a esta página, debe pensar:

*"¿Qué es esto? Parece... profesional. Real. Como si estuviera mirando un sistema que realmente funciona. Quiero saber qué está haciendo ese motor. AHORA."*

No:

*"Uau, ¡se ve lindo! ¿Me venden algo?"*

---

## SIGUIENTE PASO

¿Te sorprende esta dirección? ¿Cambios requeridos?

Áreas de aprobación:
- [ ] Visualización "ruedas de mercados" = identidad única ✓?
- [ ] Sección 1 estructura (izq/centro/der) = balanceada ✓?
- [ ] Datos reales (847, 78%, OHLC) = confiable ✓?
- [ ] Recorrido psicológico (Imp→Cur→Com→Aut→Pru→Con→Des→Acc) ✓?
- [ ] Paleta visual (negro/dorado/blanco + profundidad) ✓?
- [ ] Movimiento (ruedas girando, líneas fortaleciendo, pulsaciones) ✓?
- [ ] Mensaje general ("Motor es protagonista, no marketing") ✓?

¿Algo cambiar antes de que diseñe el REST DE SECCIONES?
